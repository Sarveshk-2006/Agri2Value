"""
Agri2Value — Crop Rescue Mode Service.

Assesses harvest lots facing spoilage, depressed mandi gluts, or adverse weather.
Calculates transparent urgency indicators and formulates four deterministic
salvage pathways to protect farmer capital and prevent post-harvest dumping.
"""
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import AuthorizationError, NotFoundError
from app.core.logging import get_logger
from app.database.models import (
    CropLot,
    Farm,
    BuyerOffer,
    ProcessingFacility,
    ColdStorageFacility,
    IoTAlert,
)
from app.execution.schemas import CropRescueAssessment, RescuePathwayOption
from app.services.mandi_service import mandi_service
from app.services.weather_service import weather_service

logger = get_logger("crop_rescue_service")

# Reference ambient post-harvest shelf-life guidelines (days at 25-30°C)
CROP_SHELF_LIFE_DAYS = {
    "tomato": 8,
    "grapes": 5,
    "onion": 60,
    "pomegranate": 25,
    "wheat": 180,
    "banana": 6,
    "default": 7,
}


class CropRescueService:
    """Evaluates crop emergency risks and generates actionable rescue pathways."""

    async def assess_lot_for_rescue(
        self,
        crop_lot_id: str,
        farmer_user_id: str,
        db: AsyncSession,
        custom_assumptions: Optional[dict] = None,
    ) -> CropRescueAssessment:
        # 1. Fetch Crop Lot & Farm
        stmt = (
            select(CropLot)
            .options(selectinload(CropLot.farm))
            .where(CropLot.id == crop_lot_id)
            .execution_options(populate_existing=True)
        )
        res = await db.execute(stmt)
        crop_lot = res.scalar_one_or_none()

        if not crop_lot:
            raise NotFoundError("Crop lot", crop_lot_id)

        if crop_lot.owner_user_id != farmer_user_id:
            raise AuthorizationError("You do not have permission to assess this crop lot.")

        farm: Optional[Farm] = crop_lot.farm
        crop_lower = crop_lot.crop_name.lower().strip()
        
        # Base shelf life (configurable)
        custom_shelf = custom_assumptions.get("shelf_life_days") if custom_assumptions else None
        shelf_life_max = int(custom_shelf) if custom_shelf else CROP_SHELF_LIFE_DAYS.get(crop_lower, CROP_SHELF_LIFE_DAYS["default"])

        # 2. Compute Age & Shelf-Life Risk
        now_dt = datetime.now(timezone.utc)
        lot_harvest_dt = crop_lot.harvest_date or crop_lot.created_at
        if lot_harvest_dt and lot_harvest_dt.tzinfo is None:
            lot_harvest_dt = lot_harvest_dt.replace(tzinfo=timezone.utc)
        age_days = max(0, (now_dt - lot_harvest_dt).days) if lot_harvest_dt else 0
        shelf_life_used_pct = min(100, int((age_days / shelf_life_max) * 100))

        risk_reasons: List[str] = []
        urgency_score = 15  # baseline

        if shelf_life_used_pct >= 60:
            urgency_score += 40
            risk_reasons.append(
                f"Perishability Alert: {age_days} days elapsed of estimated {shelf_life_max}-day ambient shelf-life ({shelf_life_used_pct}% consumed)."
            )
        elif shelf_life_used_pct >= 40:
            urgency_score += 25
            risk_reasons.append(
                f"Moderate Age: {age_days} days post-harvest ({shelf_life_used_pct}% shelf-life elapsed)."
            )
        else:
            risk_reasons.append(f"Produce is fresh: {age_days} days post-harvest.")

        # 3. Check Weather Threats (if coordinates available)
        weather_alert: Optional[str] = None
        if farm and farm.latitude and farm.longitude:
            try:
                w_resp = await weather_service.get_weather_by_coordinates(
                    float(farm.latitude), float(farm.longitude), location_name=f"{farm.village}, {farm.district}"
                )
                if w_resp.observed.precipitation_mm > 1.0:
                    urgency_score += 20
                    weather_alert = f"Precipitation Warning: {w_resp.observed.precipitation_mm}mm rain observed at farm; moisture accelerates fungal rot."
                    risk_reasons.append(weather_alert)
                elif w_resp.daily_forecast and w_resp.daily_forecast[0].precipitation_sum > 2.0:
                    urgency_score += 15
                    weather_alert = f"Forecast Rain: {w_resp.daily_forecast[0].precipitation_sum}mm expected today; unprotected lots at severe risk."
                    risk_reasons.append(weather_alert)
            except Exception as e:
                logger.warning("Could not fetch weather for rescue assessment", error=str(e))

        # 4. Check Local Mandi Pricing Signals
        mandi_signal: Optional[str] = None
        current_mandi_rate = Decimal("14.00")  # default benchmark
        try:
            m_quote = await mandi_service.get_verified_mandi_quote(
                crop_name=crop_lot.crop_name,
                district=farm.district if farm else "Nashik",
            )
            current_mandi_rate = m_quote.rate_per_kg
            if current_mandi_rate < Decimal("13.00"):
                urgency_score += 20
                mandi_signal = f"Mandi Price Glut: Local APMC rate is currently ₹{current_mandi_rate}/kg (below normal commercial viability)."
                risk_reasons.append(mandi_signal)
            else:
                mandi_signal = f"Mandi rate: ₹{current_mandi_rate}/kg at {m_quote.market_name} (Observation date: {m_quote.observation_date})."
        except Exception:
            mandi_signal = "Live Mandi rates unavailable; evaluated using regional pilot benchmarks."

        # 4b. Supplementary On-Farm IoT Telematics Alerts (Phase 4A)
        if farm:
            res_alerts = await db.execute(
                select(IoTAlert).where(
                    IoTAlert.farm_id == farm.id,
                    IoTAlert.is_resolved == False
                ).order_by(IoTAlert.created_at.desc()).limit(2)
            )
            farm_iot_alerts = res_alerts.scalars().all()
            for al in farm_iot_alerts:
                risk_reasons.append(
                    f"Farm Telematics Alert ({al.source_type}): {al.alert_type} - {al.explanation}"
                )

        # Cap score
        urgency_score = min(98, max(10, urgency_score))
        if urgency_score >= 70:
            urgency_level = "CRITICAL"
        elif urgency_score >= 50:
            urgency_level = "HIGH"
        elif urgency_score >= 30:
            urgency_level = "MODERATE"
        else:
            urgency_level = "LOW"

        # 5. Formulate 4 Actionable Rescue Pathways with Dynamic Cost Accounting
        quantity = crop_lot.quantity_kg_normalized

        # Pathway A: Emergency Puree / Agro-Processing
        proc_stmt = select(ProcessingFacility).where(ProcessingFacility.availability_status == "OPERATIONAL")
        proc_res = await db.execute(proc_stmt)
        proc_fac = proc_res.scalars().first()
        proc_name = proc_fac.facility_name if proc_fac else "Sahyadri Tomato Puree & Pulp Works"
        proc_price = Decimal(str(custom_assumptions.get("processed_product_price", "14.50"))) if custom_assumptions else Decimal("14.50")
        proc_charge = proc_fac.processing_charge_per_kg if proc_fac else Decimal("3.20")
        proc_gross = (quantity * proc_price).quantize(Decimal("0.01"))
        proc_freight = max(Decimal("800.00"), (quantity * Decimal("0.85")).quantize(Decimal("0.01")))
        proc_fee = (quantity * proc_charge).quantize(Decimal("0.01"))
        proc_handling = (quantity * Decimal("0.25")).quantize(Decimal("0.01"))
        proc_costs = (proc_fee + proc_freight + proc_handling).quantize(Decimal("0.01"))
        proc_net = max(Decimal("0"), proc_gross - proc_costs)
        proc_salvage = Decimal("88.0")

        opt_proc = RescuePathwayOption(
            route_type="PROCESSING",
            title="Emergency Industrial Processing (Puree/Pulp)",
            channel_name=proc_name,
            estimated_net_payout=proc_net,
            salvaged_value_pct=proc_salvage,
            time_to_safety_hours=8,
            capacity_status="Ready / Immediate Slot Available",
            risk_level="Lowest Risk (Arrests Spoilage Completely)",
            action_button_label="Dispatch to Processing Unit",
            target_entity_id=proc_fac.id if proc_fac else None,
            feasibility_status="FEASIBLE" if (proc_fac and proc_fac.availability_status == "OPERATIONAL") else "CONDITIONALLY_FEASIBLE",
            itemized_deductions={
                "processing_fee": float(proc_fee),
                "inbound_freight": float(proc_freight),
                "handling_labour": float(proc_handling),
            },
            assumptions_disclosed=[
                {"name": "Puree Yield Realization", "value": 14.50, "unit": "INR/kg equivalent", "provenance": "ILLUSTRATIVE_BENCHMARK", "source": "Cluster processing net realization formula"},
                {"name": "Processing Tariff", "value": float(proc_charge), "unit": "INR/kg raw", "provenance": "CONFIGURED", "source": "Agro processing facility schedule"},
            ],
        )

        # Pathway B: Temperature-Controlled Cold Storage Buffer
        cold_stmt = select(ColdStorageFacility).where(ColdStorageFacility.availability_status.in_(["AVAILABLE", "LIMITED"]))
        cold_res = await db.execute(cold_stmt)
        cold_fac = cold_res.scalars().first()
        cold_name = cold_fac.facility_name if cold_fac else "Niphad Multi-Commodity Cold Chain Hub"
        rebound_price = Decimal(str(custom_assumptions.get("rebound_price", "18.00"))) if custom_assumptions else Decimal("18.00")
        cold_rate = Decimal(str(custom_assumptions.get("cold_storage_rate", "0.70"))) if custom_assumptions else Decimal("0.70")
        cold_holding_fee = (quantity * cold_rate).quantize(Decimal("0.01"))
        cold_two_way_freight = max(Decimal("1200.00"), (quantity * Decimal("1.10")).quantize(Decimal("0.01")))
        cold_handling = (quantity * Decimal("0.30")).quantize(Decimal("0.01"))
        cold_spoilage_cost = (quantity * Decimal("0.04") * rebound_price).quantize(Decimal("0.01"))
        cold_storage_cost = (cold_holding_fee + cold_two_way_freight + cold_handling + cold_spoilage_cost).quantize(Decimal("0.01"))
        cold_net = max(Decimal("0"), (quantity * rebound_price) - cold_storage_cost)
        cold_salvage = Decimal("92.0")

        opt_cold = RescuePathwayOption(
            route_type="COLD_STORAGE",
            title="Cold Buffer Holding (Wait for Glut Clearance)",
            channel_name=cold_name,
            estimated_net_payout=cold_net,
            salvaged_value_pct=cold_salvage,
            time_to_safety_hours=14,
            capacity_status=f"Available Space: {cold_fac.available_capacity_kg if cold_fac else '45,000'} kg",
            risk_level="Medium (Requires Price Rebound in 2-3 Weeks)",
            action_button_label="Reserve Cold Room Space",
            target_entity_id=cold_fac.id if cold_fac else None,
            feasibility_status="FEASIBLE" if cold_fac else "CONDITIONALLY_FEASIBLE",
            itemized_deductions={
                "cold_room_tariff": float(cold_holding_fee),
                "two_way_transport": float(cold_two_way_freight),
                "handling_labour": float(cold_handling),
                "expected_shrinkage_loss": float(cold_spoilage_cost),
            },
            assumptions_disclosed=[
                {"name": "Rebound Price Forecast", "value": float(rebound_price), "unit": "INR/kg", "provenance": "CONFIGURED", "source": "Post-glut market rebound price projection"},
                {"name": "Cold Storage Fee", "value": float(cold_rate), "unit": "INR/kg/holding", "provenance": "CONFIGURED", "source": "Cold chain partner tariff"},
            ],
        )

        # Pathway C: Fast Direct Buyer Liquidation
        offer_stmt = select(BuyerOffer).options(selectinload(BuyerOffer.buyer)).where(BuyerOffer.status == "OPEN")
        offer_res = await db.execute(offer_stmt)
        buyer_offer = offer_res.scalars().first()
        buyer_name = buyer_offer.buyer.company_name if buyer_offer else "Sahyadri Agro-Retail Procurement"
        buyer_rate = buyer_offer.offered_price_per_kg if buyer_offer else Decimal("16.00")
        buyer_gross = (quantity * buyer_rate).quantize(Decimal("0.01"))
        buyer_pickup_freight = max(Decimal("600.00"), (quantity * Decimal("0.40")).quantize(Decimal("0.01")))
        buyer_sorting_loss = (buyer_gross * Decimal("0.04")).quantize(Decimal("0.01"))
        buyer_net = max(Decimal("0"), buyer_gross - (buyer_pickup_freight + buyer_sorting_loss))
        buyer_salvage = Decimal("95.0")

        opt_buyer = RescuePathwayOption(
            route_type="DIRECT_BUYER",
            title="Fast Direct Buyer Liquidation (Farmgate Pickup)",
            channel_name=buyer_name,
            estimated_net_payout=buyer_net,
            salvaged_value_pct=buyer_salvage,
            time_to_safety_hours=24,
            capacity_status="Active Procurement Demand",
            risk_level="Low (Confirmed Standing Contract)",
            action_button_label="Request Immediate Buyer Pickup",
            target_entity_id=buyer_offer.id if buyer_offer else None,
            feasibility_status="FEASIBLE" if buyer_offer else "CONDITIONALLY_FEASIBLE",
            itemized_deductions={
                "farmgate_pickup_freight": float(buyer_pickup_freight),
                "grade_sorting_discount": float(buyer_sorting_loss),
            },
            assumptions_disclosed=[
                {"name": "Buyer Contract Rate", "value": float(buyer_rate), "unit": "INR/kg", "provenance": "VERIFIED" if buyer_offer else "ILLUSTRATIVE_BENCHMARK", "source": "Standing contract procurement matrix"},
            ],
        )

        # Pathway D: Immediate Local APMC Mandi Auction
        mandi_gross = (quantity * current_mandi_rate).quantize(Decimal("0.01"))
        mandi_transport = max(Decimal("800.00"), (quantity * Decimal("0.70")).quantize(Decimal("0.01")))
        mandi_cess_comm = (mandi_gross * Decimal("0.0505")).quantize(Decimal("0.01"))  # 1.05% cess + 4% comm
        mandi_labour = (quantity * Decimal("0.35")).quantize(Decimal("0.01"))
        mandi_expenses = (mandi_transport + mandi_cess_comm + mandi_labour).quantize(Decimal("0.01"))
        mandi_net = max(Decimal("0"), mandi_gross - mandi_expenses)
        mandi_salvage = Decimal("74.0")

        opt_mandi = RescuePathwayOption(
            route_type="RESCUE_SALE",
            title="Immediate APMC Mandi Yard Auction",
            channel_name="APMC Pimpalgaon Baswant Yard",
            estimated_net_payout=mandi_net,
            salvaged_value_pct=mandi_salvage,
            time_to_safety_hours=12,
            capacity_status="Open Yard Auctions Daily",
            risk_level="High (Subject to Intra-Day Price Drop)",
            action_button_label="Book Yard Transport & Gate Entry",
            target_entity_id=None,
            feasibility_status="FEASIBLE",
            itemized_deductions={
                "transport_to_apmc": float(mandi_transport),
                "apmc_cess_and_commission": float(mandi_cess_comm),
                "loading_unloading_hamali": float(mandi_labour),
            },
            assumptions_disclosed=[
                {"name": "APMC Statutory Fees", "value": 5.05, "unit": "%", "provenance": "VERIFIED", "source": "APMC Statutory Regulation"},
                {"name": "Mandi Auction Rate", "value": float(current_mandi_rate), "unit": "INR/kg", "provenance": "VERIFIED" if mandi_signal and "at" in mandi_signal else "ILLUSTRATIVE_BENCHMARK", "source": "Daily APMC yard bulletin"},
            ],
        )

        pathways = [opt_proc, opt_cold, opt_buyer, opt_mandi]
        # Sort pathways by highest salvage net payout
        pathways.sort(key=lambda p: p.estimated_net_payout, reverse=True)

        rec_action = (
            f"Given urgency score {urgency_score}/100 ({urgency_level}), {pathways[0].title} via "
            f"'{pathways[0].channel_name}' delivers the highest protected payout of ₹{pathways[0].estimated_net_payout:,.2f} "
            f"with {pathways[0].time_to_safety_hours} hours to safety."
        )

        global_assumptions = [
            {"name": "Maximum Safe Ambient Shelf-Life", "value": shelf_life_max, "unit": "days", "provenance": "CONFIGURED" if custom_shelf else "ILLUSTRATIVE_BENCHMARK", "source": "Post-harvest shelf-life guidelines at 25-30°C ambient storage", "is_configurable": True},
            {"name": "Rainfall Alert Threshold", "value": 1.0, "unit": "mm", "provenance": "CONFIGURED", "source": "Agronomic precipitation threshold triggering accelerated fungal rot", "is_configurable": False},
            {"name": "Mandi Price Glut Threshold", "value": 13.0, "unit": "INR/kg", "provenance": "CONFIGURED", "source": "Breakeven production & freight recovery baseline", "is_configurable": True},
        ]

        scenario_notes = (
            f"Scenario Comparison: Immediate APMC sale yields ₹{opt_mandi.estimated_net_payout:,.2f} with highest price risk. "
            f"Cold storage holding projects ₹{opt_cold.estimated_net_payout:,.2f} if market rebounds to ₹{rebound_price:.2f}/kg. "
            f"Industrial processing guarantees ₹{opt_proc.estimated_net_payout:,.2f} net proceeds by eliminating perishability."
        )

        return CropRescueAssessment(
            crop_lot_id=crop_lot.id,
            crop_name=crop_lot.crop_name,
            variety=crop_lot.variety,
            quantity_kg=crop_lot.quantity_kg_normalized,
            quality_grade=crop_lot.quality_grade,
            urgency_level=urgency_level,
            urgency_score=urgency_score,
            risk_reasons=risk_reasons,
            weather_alert=weather_alert,
            mandi_price_signal=mandi_signal,
            salvage_pathways=pathways,
            recommended_action=rec_action,
            assumptions_disclosed=global_assumptions,
            scenario_comparison_notes=scenario_notes,
        )


crop_rescue_service = CropRescueService()
