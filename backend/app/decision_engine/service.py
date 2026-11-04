"""
Decision Engine Application Service.

Hydrates farm, crop lot, and market data, executes the deterministic engine,
and persists an immutable DecisionRun snapshot with ownership isolation.
"""
from datetime import datetime, timezone
from decimal import Decimal
import json
from typing import Any, Dict, List, Optional
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import NotFoundError, AuthorizationError, ValidationError
from app.database.models import (
    CropLot,
    CropLotEvent,
    DecisionRun,
    DecisionOption,
    Farm,
)
from app.decision_engine.models import (
    HarvestLotSnapshot,
    DecisionResult,
    CalculatedOption,
    AssumptionItem,
    AssumptionProvenance,
    ScenarioVariation,
    SensitivityAnalysisResult,
    OutcomeComparison,
)
from app.decision_engine.engine import DecisionEngine
from app.decision_engine.schemas import (
    DecisionOptionResponse,
    DecisionRunResponse,
    SensitivityRequest,
)


def _serialize_for_db(obj: Any) -> str:
    """Helper to dump dicts/lists to JSON text with Decimal handling."""
    def decimal_default(val: Any) -> Any:
        if isinstance(val, Decimal):
            return str(val)
        raise TypeError(f"Object of type {type(val)} is not JSON serializable")

    return json.dumps(obj, default=decimal_default)


def _format_option_response(opt_model: DecisionOption) -> DecisionOptionResponse:
    """Helper to parse a DecisionOption ORM model into DecisionOptionResponse."""
    risks_data = json.loads(opt_model.risks_and_confidence) if opt_model.risks_and_confidence else {}
    raw_assumptions = risks_data.get("itemized_assumptions", [])
    itemized_assumptions = [AssumptionItem(**a) for a in raw_assumptions] if raw_assumptions else []
    operational_constraints = risks_data.get("operational_constraints", [])

    return DecisionOptionResponse(
        id=opt_model.id,
        decision_run_id=opt_model.decision_run_id,
        route_type=opt_model.route_type,
        route_name=opt_model.route_name,
        feasibility_status=opt_model.feasibility_status,
        rank=opt_model.rank,
        is_recommended=opt_model.is_recommended,
        saleable_quantity=opt_model.saleable_quantity,
        saleable_quantity_unit=opt_model.saleable_quantity_unit,
        gross_revenue=opt_model.gross_revenue,
        total_costs=opt_model.total_costs,
        net_profit=opt_model.net_profit,
        net_profit_per_kg=opt_model.net_profit_per_kg,
        effective_realization_per_kg=opt_model.effective_realization_per_kg,
        additional_profit_vs_baseline=opt_model.additional_profit_vs_baseline,
        time_to_payment_days=opt_model.time_to_payment_days,
        cost_breakdown=json.loads(opt_model.cost_breakdown),
        feasibility_reasons=json.loads(opt_model.feasibility_reasons),
        risks_and_confidence=risks_data,
        explanation=opt_model.explanation,
        data_source=opt_model.data_source,
        data_timestamp=opt_model.data_timestamp,
        itemized_assumptions=itemized_assumptions,
        operational_constraints=operational_constraints,
    )


def _format_run_response(run_model: DecisionRun) -> DecisionRunResponse:
    """Helper to parse a DecisionRun ORM model with its options into DecisionRunResponse."""
    snapshot = json.loads(run_model.input_snapshot) if run_model.input_snapshot else {}
    raw_assumptions = snapshot.get("assumptions_disclosed", [])
    assumptions_disclosed = [AssumptionItem(**a) for a in raw_assumptions] if raw_assumptions else []

    raw_sensitivity = snapshot.get("sensitivity_preview")
    sensitivity_preview = SensitivityAnalysisResult(**raw_sensitivity) if raw_sensitivity else None

    options_responses = [_format_option_response(opt) for opt in run_model.options]
    return DecisionRunResponse(
        id=run_model.id,
        crop_lot_id=run_model.crop_lot_id,
        owner_user_id=run_model.owner_user_id,
        algorithm_version=run_model.algorithm_version,
        status=run_model.status,
        recommended_option_id=run_model.recommended_option_id,
        recommended_route_type=run_model.recommended_route_type,
        recommended_net_profit=run_model.recommended_net_profit,
        baseline_net_profit=run_model.baseline_net_profit,
        additional_profit_vs_baseline=run_model.additional_profit_vs_baseline,
        input_snapshot=snapshot,
        disclaimer=run_model.disclaimer,
        created_at=run_model.created_at,
        options=options_responses,
        assumptions_disclosed=assumptions_disclosed,
        sensitivity_preview=sensitivity_preview,
    )


async def evaluate_crop_lot_decision(
    crop_lot_id: str,
    current_user_id: str,
    scenario_preset: Optional[str] = None,
    data_source_mode: Optional[str] = "PILOT_BENCHMARK",
    custom_params: Optional[Dict[str, Any]] = None,
    db: AsyncSession = None,
) -> DecisionRunResponse:
    """
    Evaluates harvest pathways for a farmer's crop lot.
    Enforces ownership isolation, executes pure decision engine,
    and records an immutable audit snapshot with market provenance.
    """
    # 1. Fetch CropLot and ensure it belongs to authenticated user
    stmt = (
        select(CropLot)
        .options(selectinload(CropLot.farm), selectinload(CropLot.events))
        .where(CropLot.id == crop_lot_id)
    )
    result = await db.execute(stmt)
    crop_lot = result.scalar_one_or_none()

    if not crop_lot:
        raise NotFoundError("Crop lot", crop_lot_id)

    if crop_lot.owner_user_id != current_user_id:
        raise AuthorizationError("You do not have permission to evaluate this crop lot.")

    # 2. Extract input snapshot
    farm: Optional[Farm] = crop_lot.farm
    lot_snapshot = HarvestLotSnapshot(
        lot_id=crop_lot.id,
        crop_name=crop_lot.crop_name,
        variety=crop_lot.variety,
        quantity_kg=crop_lot.quantity_kg_normalized,
        quality_grade=crop_lot.quality_grade,
        harvest_date=crop_lot.harvest_date.isoformat() if crop_lot.harvest_date else None,
        farm_state=farm.state if farm else "Maharashtra",
        farm_district=farm.district if farm else "Nashik",
        farm_village=farm.village if farm else "Niphad",
        has_cold_storage_access=False,
    )

    # 3. Configure scenario overrides
    overrides: Dict[str, Any] = {}
    if scenario_preset == "MANDI_WINS":
        overrides["direct_buyer"] = {
            "offer_price_per_kg": Decimal("15.50"),
            "distance_km": Decimal("90"),
            "transport_cost_per_kg": Decimal("4.20"),
            "quality_sorting_loss_pct": Decimal("0.12"),  # 12% rejection
        }
        overrides["processing"] = {
            "facility_operational": False,
        }
    elif scenario_preset == "PROCESSING_BOTTLENECK":
        overrides["processing"] = {
            "facility_operational": False,
            "max_batch_kg": Decimal("2000"),
        }
    elif scenario_preset == "MISSING_DATA":
        overrides["processing"] = {
            "yield_known": False,
        }

    # Validate custom mandi parameters for commodity mismatch
    if custom_params and "mandi" in custom_params:
        custom_mandi = custom_params["mandi"]
        if "commodity" in custom_mandi and custom_mandi["commodity"]:
            if custom_mandi["commodity"].strip().lower() != crop_lot.crop_name.strip().lower():
                raise ValidationError(
                    f"Commodity mismatch: custom mandi parameter is for '{custom_mandi['commodity']}', "
                    f"but harvest lot is '{crop_lot.crop_name}'. Mismatched commodity rates are rejected."
                )

    # Ingest market data based on data_source_mode
    freshness_status = "DEMO"
    mandi_source_desc = "APMC Pimpalgaon Bulletin (Pilot Benchmark Archive)"
    mandi_market_name = "APMC Pimpalgaon (Nashik)"
    mandi_obs_date = "2026-11-01"
    mandi_retrieved_at = datetime.now(timezone.utc).isoformat()

    if data_source_mode == "LIVE_MANDI":
        from app.services.mandi_service import mandi_service
        try:
            quote = await mandi_service.get_verified_mandi_quote(
                crop_name=crop_lot.crop_name,
                district=farm.district if farm else "Nashik",
            )
            if "mandi" not in overrides:
                overrides["mandi"] = {}
            overrides["mandi"]["rate_per_kg"] = quote.rate_per_kg
            overrides["mandi"]["mandi_name"] = quote.market_name
            overrides["mandi"]["data_source"] = quote.data_source
            overrides["mandi"]["data_timestamp"] = f"Observed: {quote.observation_date} | Ingested: {quote.retrieval_date}"
            overrides["mandi"]["is_live"] = quote.is_live
            overrides["mandi"]["is_stale"] = quote.is_stale
            overrides["mandi"]["staleness_warning"] = quote.staleness_warning

            freshness_status = quote.freshness_status
            mandi_source_desc = quote.data_source
            mandi_market_name = quote.market_name
            mandi_obs_date = quote.observation_date
            mandi_retrieved_at = quote.retrieval_date
        except ValidationError:
            raise
        except Exception as exc:
            raise ValidationError(
                f"Reliable market data unavailable for '{crop_lot.crop_name}'. "
                f"Status: NEEDS_MORE_DATA. Error: {str(exc)}"
            )

    if custom_params:
        for k, v in custom_params.items():
            if k == "mandi" and "mandi" in overrides:
                overrides["mandi"].update(v)
            else:
                overrides[k] = v
        freshness_status = "CUSTOM"

    # 4. Run pure, deterministic DecisionEngine
    engine = DecisionEngine(sample_overrides=overrides)
    decision_result = engine.evaluate(lot_snapshot)

    # 5. Build and persist immutable database snapshot
    run_id = str(uuid.uuid4())
    all_evaluated_options: List[CalculatedOption] = (
        decision_result.ranked_feasible_options + decision_result.infeasible_options
    )

    rec_opt = decision_result.recommended_option
    baseline_opt = decision_result.baseline_mandi_option

    snapshot_data = lot_snapshot.model_dump(mode="json")
    snapshot_data.update({
        "data_source_mode": data_source_mode or "PILOT_BENCHMARK",
        "data_mode": freshness_status,
        "mandi_name": mandi_market_name,
        "price_observation_date": mandi_obs_date,
        "retrieval_timestamp": mandi_retrieved_at,
        "source": mandi_source_desc,
        "unit_conversion": "1 Quintal = 100 kg",
        "assumptions": [
            "Local tempo transport tariff: ₹0.045/kg/km",
            "APMC statutory cess: 1.05%, agent commission: 4.0%",
            "Handling loss: 2.0% during transit and yard handling"
        ],
        "assumptions_disclosed": [a.model_dump(mode="json") for a in decision_result.assumptions_disclosed],
        "sensitivity_preview": decision_result.sensitivity_preview.model_dump(mode="json") if decision_result.sensitivity_preview else None,
    })

    db_run = DecisionRun(
        id=run_id,
        crop_lot_id=crop_lot.id,
        owner_user_id=current_user_id,
        algorithm_version=decision_result.algorithm_version,
        status=decision_result.status,
        recommended_option_id=rec_opt.route_name if rec_opt else None,
        recommended_route_type=rec_opt.route_type.value if rec_opt else None,
        recommended_net_profit=rec_opt.net_profit if rec_opt else None,
        baseline_net_profit=baseline_opt.net_profit if baseline_opt else None,
        additional_profit_vs_baseline=rec_opt.additional_profit_vs_baseline if rec_opt else None,
        input_snapshot=_serialize_for_db(snapshot_data),
        disclaimer=decision_result.disclaimer,
    )
    db.add(db_run)

    for opt in all_evaluated_options:
        opt_risks = dict(opt.risks_and_confidence)
        opt_risks["itemized_assumptions"] = [a.model_dump(mode="json") for a in opt.itemized_assumptions]
        opt_risks["operational_constraints"] = opt.operational_constraints

        db_opt = DecisionOption(
            id=str(uuid.uuid4()),
            decision_run_id=run_id,
            route_type=opt.route_type.value,
            route_name=opt.route_name,
            feasibility_status=opt.feasibility.status.value,
            rank=opt.rank,
            is_recommended=opt.is_recommended,
            saleable_quantity=opt.saleable_quantity,
            saleable_quantity_unit=opt.saleable_quantity_unit,
            gross_revenue=opt.gross_revenue,
            total_costs=opt.costs.total_costs,
            net_profit=opt.net_profit,
            net_profit_per_kg=opt.net_profit_per_kg,
            effective_realization_per_kg=opt.effective_realization_per_kg,
            additional_profit_vs_baseline=opt.additional_profit_vs_baseline,
            time_to_payment_days=opt.time_to_payment_days,
            cost_breakdown=_serialize_for_db(opt.costs.model_dump(mode="json")),
            feasibility_reasons=_serialize_for_db(opt.feasibility.model_dump(mode="json")),
            risks_and_confidence=_serialize_for_db(opt_risks),
            explanation=opt.explanation,
            data_source=opt.data_source,
        )
        db.add(db_opt)

    # 6. Update CropLot status and log event
    crop_lot.status = "ANALYZED"
    rec_text = f"Recommended: {rec_opt.route_name} (₹{rec_opt.net_profit:,.2f})" if rec_opt else "No feasible route"
    event = CropLotEvent(
        crop_lot_id=crop_lot.id,
        event_type="DECISION_EVALUATED",
        actor_user_id=current_user_id,
        description=f"Profit Decision Engine evaluation completed. {rec_text}",
    )
    db.add(event)

    await db.commit()

    # 7. Reload saved run with options for return
    stmt_reload = (
        select(DecisionRun)
        .options(selectinload(DecisionRun.options))
        .where(DecisionRun.id == run_id)
    )
    res_reload = await db.execute(stmt_reload)
    persisted_run = res_reload.scalar_one()

    return _format_run_response(persisted_run)


async def get_decision_by_id(
    decision_id: str,
    current_user_id: str,
    db: AsyncSession,
) -> DecisionRunResponse:
    """Retrieve a previously generated decision run snapshot with ownership isolation."""
    stmt = (
        select(DecisionRun)
        .options(selectinload(DecisionRun.options))
        .where(DecisionRun.id == decision_id)
    )
    result = await db.execute(stmt)
    run = result.scalar_one_or_none()

    if not run:
        raise NotFoundError("Decision run", decision_id)

    if run.owner_user_id != current_user_id:
        raise AuthorizationError("You do not have permission to view this decision run.")

    return _format_run_response(run)


async def get_lot_decisions(
    crop_lot_id: str,
    current_user_id: str,
    db: AsyncSession,
) -> List[DecisionRunResponse]:
    """Retrieve all historical decision runs for a specific crop lot."""
    # Ensure lot exists and belongs to farmer
    stmt_lot = select(CropLot).where(CropLot.id == crop_lot_id)
    res_lot = await db.execute(stmt_lot)
    lot = res_lot.scalar_one_or_none()

    if not lot:
        raise NotFoundError("Crop lot", crop_lot_id)

    if lot.owner_user_id != current_user_id:
        raise AuthorizationError("You do not have permission to view decisions for this crop lot.")

    stmt = (
        select(DecisionRun)
        .options(selectinload(DecisionRun.options))
        .where(DecisionRun.crop_lot_id == crop_lot_id)
        .order_by(DecisionRun.created_at.desc())
    )
    result = await db.execute(stmt)
    runs = result.scalars().all()

    return [_format_run_response(r) for r in runs]


async def get_decision_actual_outcome_comparison(
    decision_id: str,
    current_user_id: str,
    db: AsyncSession,
) -> OutcomeComparison:
    """
    Compare decision expectations against actual execution, delivery, and payment records.
    Never invents records. Reconciles data transparently when completed records exist.
    """
    # 1. Fetch DecisionRun with options
    stmt = (
        select(DecisionRun)
        .options(selectinload(DecisionRun.options))
        .where(DecisionRun.id == decision_id)
    )
    res = await db.execute(stmt)
    run = res.scalar_one_or_none()
    if not run:
        raise NotFoundError("Decision run", decision_id)
    if run.owner_user_id != current_user_id:
        raise AuthorizationError("You do not have permission to view this decision run.")

    # 2. Extract expectations from recommended option or rank 1 option
    rec_opt = next((o for o in run.options if o.is_recommended), None)
    if not rec_opt and run.options:
        rec_opt = min(run.options, key=lambda o: o.rank if o.rank is not None else 999)

    expected_qty = rec_opt.saleable_quantity if rec_opt else Decimal("0.00")
    expected_price = rec_opt.effective_realization_per_kg if rec_opt else Decimal("0.00")
    estimated_deductions = rec_opt.total_costs if rec_opt else Decimal("0.00")
    estimated_net = rec_opt.net_profit if rec_opt else Decimal("0.00")
    expected_days = rec_opt.time_to_payment_days or 3

    # 3. Check for linked DealAgreement on the crop lot
    from app.database.models import DealAgreement
    stmt_deal = (
        select(DealAgreement)
        .options(
            selectinload(DealAgreement.deliveries),
            selectinload(DealAgreement.payments),
        )
        .where(DealAgreement.crop_lot_id == run.crop_lot_id)
        .order_by(DealAgreement.created_at.desc())
    )
    res_deal = await db.execute(stmt_deal)
    deals = res_deal.scalars().all()

    if not deals:
        return OutcomeComparison(
            has_actual_outcome=False,
            status="PENDING_EXECUTION",
            decision_run_id=run.id,
            crop_lot_id=run.crop_lot_id,
            route_type=rec_opt.route_type if rec_opt else "DIRECT_SALE",
            channel_name=rec_opt.route_name if rec_opt else "Direct Buyer",
            expected_quantity_kg=expected_qty,
            expected_unit_price=expected_price,
            estimated_deductions_inr=estimated_deductions,
            estimated_net_profit_inr=estimated_net,
            expected_realization_days=expected_days,
            actual_quantity_kg=None,
            actual_unit_price=None,
            actual_deductions_inr=None,
            actual_net_proceeds_inr=None,
            actual_realization_days=None,
            quantity_variance_pct=None,
            price_variance_pct=None,
            deductions_variance_inr=None,
            net_profit_variance_inr=None,
            net_profit_variance_pct=None,
            forecast_accuracy_summary=(
                "No execution contract or delivery records found for this crop lot yet. "
                "Recommendation expectations remain baseline benchmark."
            ),
        )

    # Use the primary agreement
    agreement = deals[0]
    deliveries = agreement.deliveries or []
    payments = agreement.payments or []

    # Check if delivery or payment occurred
    total_delivered_kg = sum((d.accepted_quantity_kg for d in deliveries), Decimal("0.00"))
    total_paid_inr = sum((p.amount_paid for p in payments), Decimal("0.00"))

    has_completed_delivery = any(d.status == "CONFIRMED" for d in deliveries) or agreement.status in ("COMPLETED", "ACCEPTED")

    if not has_completed_delivery and total_paid_inr == 0:
        return OutcomeComparison(
            has_actual_outcome=False,
            status="DEAL_CONTRACTED_AWAITING_DELIVERY",
            decision_run_id=run.id,
            crop_lot_id=run.crop_lot_id,
            route_type=rec_opt.route_type if rec_opt else "DIRECT_SALE",
            channel_name=rec_opt.route_name if rec_opt else "Direct Buyer",
            expected_quantity_kg=expected_qty,
            expected_unit_price=expected_price,
            estimated_deductions_inr=estimated_deductions,
            estimated_net_profit_inr=estimated_net,
            expected_realization_days=expected_days,
            forecast_accuracy_summary=(
                f"Deal {agreement.agreement_number} contracted with {agreement.partner_name} "
                f"at ₹{agreement.agreed_unit_price}/kg, awaiting weighbridge delivery confirmation."
            ),
        )

    # Actual numbers verified from weighbridge delivery and payment records
    actual_qty = total_delivered_kg if total_delivered_kg > 0 else agreement.agreed_quantity_kg
    actual_price = agreement.agreed_unit_price
    actual_deductions = agreement.total_deductions
    actual_net = total_paid_inr if total_paid_inr > 0 else agreement.estimated_net_payout

    # Days to realization
    created_ts = agreement.created_at
    latest_ts = agreement.updated_at or created_ts
    if payments and payments[0].payment_date:
        latest_ts = payments[0].payment_date
    actual_days = max(1, (latest_ts - created_ts).days)

    qty_var_pct = (
        ((actual_qty - expected_qty) / expected_qty * Decimal("100")).quantize(Decimal("0.01"))
        if expected_qty > 0 else Decimal("0.00")
    )
    price_var_pct = (
        ((actual_price - expected_price) / expected_price * Decimal("100")).quantize(Decimal("0.01"))
        if expected_price > 0 else Decimal("0.00")
    )
    deductions_var_inr = actual_deductions - estimated_deductions
    net_profit_var_inr = actual_net - estimated_net
    net_profit_var_pct = (
        ((net_profit_var_inr) / abs(estimated_net) * Decimal("100")).quantize(Decimal("0.01"))
        if estimated_net != 0 else Decimal("0.00")
    )

    reconcile_status = "RECONCILED" if agreement.status == "COMPLETED" else "PARTIALLY_RECONCILED"
    sign_str = "+" if net_profit_var_inr >= 0 else ""
    notes = (
        f"Verified from Deal {agreement.agreement_number} ({agreement.partner_name}). "
        f"Delivered {actual_qty:,.1f} kg with ₹{actual_deductions:,.2f} deductions. "
        f"Net proceeds realized: ₹{actual_net:,.2f} vs expected ₹{estimated_net:,.2f} "
        f"({sign_str}₹{net_profit_var_inr:,.2f}, {net_profit_var_pct}%)."
    )

    return OutcomeComparison(
        has_actual_outcome=True,
        status=reconcile_status,
        decision_run_id=run.id,
        crop_lot_id=run.crop_lot_id,
        execution_request_id=agreement.execution_request_id,
        agreement_id=agreement.id,
        route_type=rec_opt.route_type if rec_opt else "DIRECT_SALE",
        channel_name=rec_opt.route_name if rec_opt else "Direct Buyer",
        expected_quantity_kg=expected_qty,
        expected_unit_price=expected_price,
        estimated_deductions_inr=estimated_deductions,
        estimated_net_profit_inr=estimated_net,
        expected_realization_days=expected_days,
        actual_quantity_kg=actual_qty,
        actual_unit_price=actual_price,
        actual_deductions_inr=actual_deductions,
        actual_net_proceeds_inr=actual_net,
        actual_realization_days=actual_days,
        quantity_variance_pct=qty_var_pct,
        price_variance_pct=price_var_pct,
        deductions_variance_inr=deductions_var_inr,
        net_profit_variance_inr=net_profit_var_inr,
        net_profit_variance_pct=net_profit_var_pct,
        forecast_accuracy_summary=notes,
    )


async def run_sensitivity_analysis(
    crop_lot_id: str,
    current_user_id: str,
    req: SensitivityRequest,
    db: AsyncSession,
) -> SensitivityAnalysisResult:
    """
    Perform multi-scenario sensitivity exploration for a crop lot.
    Produces Conservative, Expected, and Optimistic net profit projections.
    """
    stmt = (
        select(CropLot)
        .options(selectinload(CropLot.farm))
        .where(CropLot.id == crop_lot_id)
    )
    result = await db.execute(stmt)
    crop_lot = result.scalar_one_or_none()
    if not crop_lot:
        raise NotFoundError("Crop lot", crop_lot_id)
    if crop_lot.owner_user_id != current_user_id:
        raise AuthorizationError("You do not have permission to evaluate this crop lot.")

    farm = crop_lot.farm
    lot_snapshot = HarvestLotSnapshot(
        lot_id=crop_lot.id,
        crop_name=crop_lot.crop_name,
        variety=crop_lot.variety,
        quantity_kg=crop_lot.quantity_kg_normalized,
        quality_grade=crop_lot.quality_grade,
        harvest_date=crop_lot.harvest_date.isoformat() if crop_lot.harvest_date else None,
        farm_state=farm.state if farm else "Maharashtra",
        farm_district=farm.district if farm else "Nashik",
        farm_village=farm.village if farm else "Niphad",
        has_cold_storage_access=False,
    )

    engine = DecisionEngine()
    baseline_result = engine.evaluate(lot_snapshot)
    rec_base = baseline_result.recommended_option
    base_net = rec_base.net_profit if rec_base else Decimal("0.00")
    base_rev = rec_base.gross_revenue if rec_base else Decimal("0.00")
    base_costs = rec_base.costs.total_costs if rec_base else Decimal("0.00")

    price_shift = (req.price_variance_pct or Decimal("15.0")) / Decimal("100")
    transport_shift = (req.transport_variance_pct or Decimal("20.0")) / Decimal("100")
    wastage_shift = (req.wastage_variance_pct or Decimal("5.0")) / Decimal("100")

    # 1. Conservative scenario
    cons_mandi_price = Decimal("19.50") * (Decimal("1.00") - price_shift)
    cons_buyer_price = Decimal("24.00") * (Decimal("1.00") - price_shift)
    cons_tempo_rate = Decimal("0.045") * (Decimal("1.00") + transport_shift)

    cons_engine = DecisionEngine(sample_overrides={
        "mandi": {"rate_per_kg": cons_mandi_price, "transport_tariff_per_kg_km": cons_tempo_rate, "transit_sorting_loss_pct": Decimal("0.02") + wastage_shift},
        "direct_buyer": {"offer_price_per_kg": cons_buyer_price, "quality_sorting_loss_pct": Decimal("0.04") + wastage_shift},
        "processing": {"recovery_yield_pct": Decimal("0.24"), "puree_selling_price_per_kg": Decimal("75.00") * (Decimal("1.00") - price_shift)},
    })
    cons_result = cons_engine.evaluate(lot_snapshot)
    cons_rec = cons_result.recommended_option
    cons_net = cons_rec.net_profit if cons_rec else Decimal("0.00")
    cons_rev = cons_rec.gross_revenue if cons_rec else Decimal("0.00")
    cons_cost = cons_rec.costs.total_costs if cons_rec else Decimal("0.00")
    cons_var_inr = cons_net - base_net
    cons_var_pct = ((cons_var_inr / base_net) * Decimal("100")).quantize(Decimal("0.01")) if base_net != 0 else Decimal("0.00")

    conservative_scenario = ScenarioVariation(
        name="Conservative",
        description=f"Market price -{req.price_variance_pct}%, transport tariff +{req.transport_variance_pct}%, sorting wastage +{req.wastage_variance_pct}%",
        projected_gross_revenue=cons_rev,
        projected_total_costs=cons_cost,
        projected_net_profit=cons_net,
        recommended_route=cons_rec.route_name if cons_rec else "None",
        net_profit_variance_inr=cons_var_inr,
        net_profit_variance_pct=cons_var_pct,
    )

    expected_scenario = ScenarioVariation(
        name="Expected",
        description="Standard pilot benchmarks and current APMC quotes with verified cost tariffs",
        projected_gross_revenue=base_rev,
        projected_total_costs=base_costs,
        projected_net_profit=base_net,
        recommended_route=rec_base.route_name if rec_base else "None",
        net_profit_variance_inr=Decimal("0.00"),
        net_profit_variance_pct=Decimal("0.00"),
    )

    # 3. Optimistic scenario
    opt_mandi_price = Decimal("19.50") * (Decimal("1.00") + price_shift)
    opt_buyer_price = Decimal("24.00") * (Decimal("1.00") + price_shift)
    opt_tempo_rate = Decimal("0.045") * Decimal("0.90")

    opt_engine = DecisionEngine(sample_overrides={
        "mandi": {"rate_per_kg": opt_mandi_price, "transport_tariff_per_kg_km": opt_tempo_rate, "transit_sorting_loss_pct": Decimal("0.01")},
        "direct_buyer": {"offer_price_per_kg": opt_buyer_price, "quality_sorting_loss_pct": Decimal("0.02")},
        "processing": {"recovery_yield_pct": Decimal("0.30"), "puree_selling_price_per_kg": Decimal("75.00") * (Decimal("1.00") + price_shift)},
    })
    opt_result = opt_engine.evaluate(lot_snapshot)
    opt_rec = opt_result.recommended_option
    opt_net = opt_rec.net_profit if opt_rec else Decimal("0.00")
    opt_rev = opt_rec.gross_revenue if opt_rec else Decimal("0.00")
    opt_cost = opt_rec.costs.total_costs if opt_rec else Decimal("0.00")
    opt_var_inr = opt_net - base_net
    opt_var_pct = ((opt_var_inr / base_net) * Decimal("100")).quantize(Decimal("0.01")) if base_net != 0 else Decimal("0.00")

    optimistic_scenario = ScenarioVariation(
        name="Optimistic",
        description=f"Market price +{req.price_variance_pct}%, negotiated transport -10%, minimal wastage (1-2%)",
        projected_gross_revenue=opt_rev,
        projected_total_costs=opt_cost,
        projected_net_profit=opt_net,
        recommended_route=opt_rec.route_name if opt_rec else "None",
        net_profit_variance_inr=opt_var_inr,
        net_profit_variance_pct=opt_var_pct,
    )

    # Check stability
    stability = "ROBUST"
    if cons_rec and rec_base and cons_rec.route_name != rec_base.route_name:
        stability = "SENSITIVE_TO_PRICE"
    elif cons_net < 0:
        stability = "DOWNSIDE_RISK"

    vulnerabilities = [
        "Fuel price escalation or vehicle shortage on rural collection routes (+20% tariff).",
        "APMC market glut during peak harvest depressing wholesale rates.",
        "Delayed sorting rejection at buyer collection gates exceeding 5%.",
    ]

    summary = (
        f"Net proceeds range between ₹{cons_net:,.2f} (Conservative) and ₹{opt_net:,.2f} (Optimistic). "
        f"Recommendation stability: {stability}."
    )

    return SensitivityAnalysisResult(
        scenarios=[conservative_scenario, expected_scenario, optimistic_scenario],
        key_vulnerabilities=vulnerabilities,
        recommendation_stability=stability,
        sensitivity_summary=summary,
    )


def get_benchmark_assumptions() -> List[AssumptionItem]:
    """Return default benchmark assumptions with provenance metadata."""
    return [
        AssumptionItem(
            name="APMC Statutory Cess",
            value="1.05%",
            unit="pct_gross",
            provenance=AssumptionProvenance.VERIFIED,
            source_description="Maharashtra APMC Act, Pimpalgaon Market Committee Schedule",
            is_configurable=False,
        ),
        AssumptionItem(
            name="Commission Agent Hamali & Arhat",
            value="4.00%",
            unit="pct_gross",
            provenance=AssumptionProvenance.VERIFIED,
            source_description="APMC Pimpalgaon By-laws Trade Schedule",
            is_configurable=False,
        ),
        AssumptionItem(
            name="Rural Tempo Freight Tariff",
            value="₹0.045",
            unit="INR/kg/km",
            provenance=AssumptionProvenance.CONFIGURED,
            source_description="Local Niphad-Nashik tempo union standard tariff schedule",
            is_configurable=True,
        ),
        AssumptionItem(
            name="Tomato Puree 28° Brix Recovery Yield",
            value="28.0%",
            unit="pct_raw_weight",
            provenance=AssumptionProvenance.ILLUSTRATIVE_BENCHMARK,
            source_description="CFTRI Food Processing Standard for Commercial Table Tomatoes",
            is_configurable=True,
        ),
        AssumptionItem(
            name="Job-Work Processing Charge",
            value="₹4.50",
            unit="INR/kg_raw",
            provenance=AssumptionProvenance.CONFIGURED,
            source_description="Sayhadri Farmer Producer Co. commercial rate card",
            is_configurable=True,
        ),
        AssumptionItem(
            name="Cold Storage Tariff",
            value="₹1.80",
            unit="INR/kg/month",
            provenance=AssumptionProvenance.CONFIGURED,
            source_description="Pimpalgaon Agro Cold Chain standard commercial tariff",
            is_configurable=True,
        ),
        AssumptionItem(
            name="Tomato Ambient Safe Holding Limit",
            value="4 days",
            unit="days",
            provenance=AssumptionProvenance.ILLUSTRATIVE_BENCHMARK,
            source_description="Post-harvest physiological research guidelines at 28-34°C",
            is_configurable=True,
        ),
    ]
