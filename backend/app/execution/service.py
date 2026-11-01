"""
Agri2Value — Smart Execution Network Domain Service.

Handles:
- Provider and buyer listing queries with strict filtering.
- Traceable execution request creation with farmer ownership validation.
- Server-side capacity checks and double-booking / over-reservation prevention.
- Validated state machine transitions with an immutable event log.
- Post-execution realization recording that separates estimated vs actual finances.
"""
from datetime import datetime, timezone
from decimal import Decimal
import json
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import AuthorizationError, NotFoundError, ValidationError
from app.core.logging import get_logger
from app.database.models import (
    Buyer,
    BuyerOffer,
    LogisticsProvider,
    ColdStorageFacility,
    ProcessingFacility,
    ExecutionRequest,
    ExecutionRequestEvent,
    CropLot,
    CropLotEvent,
    DecisionRun,
)
from app.execution.schemas import (
    ExecutionRequestCreate,
    ExecutionStatusTransitionRequest,
    ExecutionRequestCompleteRequest,
)

logger = get_logger("execution_service")

# Valid lifecycle state transitions
VALID_TRANSITIONS: Dict[str, List[str]] = {
    "SUBMITTED": ["PROVIDER_ACCEPTED", "CANCELLED", "REJECTED"],
    "PROVIDER_ACCEPTED": ["CONFIRMED", "CANCELLED", "REJECTED"],
    "CONFIRMED": ["IN_EXECUTION", "CANCELLED"],
    "IN_EXECUTION": ["COMPLETED", "CANCELLED"],
    "COMPLETED": [],
    "CANCELLED": [],
    "REJECTED": [],
}


class ExecutionService:
    """Core domain service for the Smart Execution Network."""

    # ---- Buyer & Buyer Offers ---------------------------------------

    async def get_buyers(
        self,
        db: AsyncSession,
        commodity: Optional[str] = None,
        district: Optional[str] = None,
        buyer_type: Optional[str] = None,
        verified_only: bool = False,
    ) -> List[Buyer]:
        stmt = select(Buyer).options(selectinload(Buyer.offers)).order_by(Buyer.created_at.desc())
        
        if district:
            stmt = stmt.where(Buyer.district.ilike(f"%{district}%"))
        if buyer_type:
            stmt = stmt.where(Buyer.buyer_type == buyer_type)
        if verified_only:
            stmt = stmt.where(Buyer.is_verified == True)

        result = await db.execute(stmt)
        buyers = result.scalars().all()

        if commodity:
            buyers = [
                b for b in buyers
                if any(commodity.lower() in o.commodity.lower() for o in b.offers)
            ]
        return buyers

    async def get_buyer_offers(
        self,
        db: AsyncSession,
        commodity: Optional[str] = None,
        district: Optional[str] = None,
        grade: Optional[str] = None,
        status: str = "OPEN",
    ) -> List[BuyerOffer]:
        stmt = (
            select(BuyerOffer)
            .join(Buyer)
            .options(selectinload(BuyerOffer.buyer))
            .where(BuyerOffer.status == status)
            .order_by(BuyerOffer.offered_price_per_kg.desc())
        )
        if commodity:
            stmt = stmt.where(BuyerOffer.commodity.ilike(f"%{commodity}%"))
        if district:
            stmt = stmt.where(Buyer.district.ilike(f"%{district}%"))

        result = await db.execute(stmt)
        offers = result.scalars().all()

        if grade:
            offers = [
                o for o in offers
                if grade.upper() in [g.strip().upper() for g in o.accepted_grades.split(",")]
            ]
        return offers

    # ---- Logistics Providers ----------------------------------------

    async def get_logistics_providers(
        self,
        db: AsyncSession,
        district: Optional[str] = None,
        min_capacity_kg: Optional[Decimal] = None,
        temperature_controlled: Optional[bool] = None,
        available_only: bool = False,
    ) -> List[LogisticsProvider]:
        stmt = select(LogisticsProvider).order_by(LogisticsProvider.capacity_kg.asc())
        if district:
            stmt = stmt.where(
                or_(
                    LogisticsProvider.base_district.ilike(f"%{district}%"),
                    LogisticsProvider.service_districts.ilike(f"%{district}%"),
                )
            )
        if min_capacity_kg:
            stmt = stmt.where(LogisticsProvider.capacity_kg >= min_capacity_kg)
        if temperature_controlled is not None:
            stmt = stmt.where(LogisticsProvider.is_temperature_controlled == temperature_controlled)
        if available_only:
            stmt = stmt.where(LogisticsProvider.availability_status == "AVAILABLE")

        result = await db.execute(stmt)
        return result.scalars().all()

    # ---- Cold Storage Facilities ------------------------------------

    async def get_cold_storage_facilities(
        self,
        db: AsyncSession,
        district: Optional[str] = None,
        commodity: Optional[str] = None,
        min_capacity_kg: Optional[Decimal] = None,
        available_only: bool = False,
    ) -> List[ColdStorageFacility]:
        stmt = select(ColdStorageFacility).order_by(ColdStorageFacility.storage_rate_per_kg_per_month.asc())
        if district:
            stmt = stmt.where(ColdStorageFacility.location_district.ilike(f"%{district}%"))
        if commodity:
            stmt = stmt.where(ColdStorageFacility.compatible_commodities.ilike(f"%{commodity}%"))
        if min_capacity_kg:
            stmt = stmt.where(ColdStorageFacility.available_capacity_kg >= min_capacity_kg)
        if available_only:
            stmt = stmt.where(ColdStorageFacility.availability_status.in_(["AVAILABLE", "LIMITED"]))

        result = await db.execute(stmt)
        return result.scalars().all()

    # ---- Processing Facilities --------------------------------------

    async def get_processing_facilities(
        self,
        db: AsyncSession,
        commodity: Optional[str] = None,
        district: Optional[str] = None,
        facility_type: Optional[str] = None,
        available_only: bool = False,
    ) -> List[ProcessingFacility]:
        stmt = select(ProcessingFacility).order_by(ProcessingFacility.daily_capacity_kg.desc())
        if commodity:
            stmt = stmt.where(ProcessingFacility.accepted_commodities.ilike(f"%{commodity}%"))
        if district:
            stmt = stmt.where(ProcessingFacility.location_district.ilike(f"%{district}%"))
        if facility_type:
            stmt = stmt.where(ProcessingFacility.facility_type == facility_type)
        if available_only:
            stmt = stmt.where(ProcessingFacility.availability_status == "OPERATIONAL")

        result = await db.execute(stmt)
        return result.scalars().all()

    # ---- Execution Requests -----------------------------------------

    async def create_execution_request(
        self,
        payload: ExecutionRequestCreate,
        farmer_user_id: str,
        db: AsyncSession,
    ) -> ExecutionRequest:
        """
        Creates an actionable execution request with:
        - Farmer lot ownership check
        - Capacity check and over-reservation prevention
        - Indicative finances hydration
        - Audit trail logging
        """
        # 1. Fetch Crop Lot & verify ownership
        lot_stmt = (
            select(CropLot)
            .options(selectinload(CropLot.farm))
            .where(CropLot.id == payload.crop_lot_id)
        )
        lot_res = await db.execute(lot_stmt)
        crop_lot = lot_res.scalar_one_or_none()

        if not crop_lot:
            raise NotFoundError("Crop lot", payload.crop_lot_id)

        if crop_lot.owner_user_id != farmer_user_id:
            raise AuthorizationError("You do not have permission to execute orders for this crop lot.")

        # 2. Validate quantity vs crop lot available volume
        if payload.requested_quantity_kg > crop_lot.quantity_kg_normalized:
            raise ValidationError(
                f"Requested quantity ({payload.requested_quantity_kg} kg) exceeds "
                f"crop lot volume ({crop_lot.quantity_kg_normalized} kg)."
            )

        # 3. Capacity & availability guards
        unit_price = Decimal("0.00")
        total_val = Decimal("0.00")
        logistics_cost = Decimal("0.00")
        storage_cost = Decimal("0.00")
        processing_cost = Decimal("0.00")
        pickup = payload.pickup_location or f"{crop_lot.farm.village}, {crop_lot.farm.district}" if crop_lot.farm else "Farmgate"
        delivery = payload.delivery_location or "Destination Yard"

        # Check Buyer Offer
        if payload.buyer_offer_id:
            offer_stmt = select(BuyerOffer).options(selectinload(BuyerOffer.buyer)).where(BuyerOffer.id == payload.buyer_offer_id)
            offer_res = await db.execute(offer_stmt)
            offer = offer_res.scalar_one_or_none()
            if not offer:
                raise NotFoundError("Buyer offer", payload.buyer_offer_id)

            if offer.status != "OPEN":
                raise ValidationError(f"Buyer offer '{offer.id}' is currently {offer.status} and cannot accept new orders.")

            remaining_buyer_capacity = offer.max_quantity_kg - offer.current_fulfilled_kg
            if payload.requested_quantity_kg > remaining_buyer_capacity:
                raise ValidationError(
                    f"Requested quantity ({payload.requested_quantity_kg} kg) exceeds buyer's remaining capacity "
                    f"({remaining_buyer_capacity} kg for this offer)."
                )

            unit_price = offer.offered_price_per_kg
            total_val = (payload.requested_quantity_kg * unit_price).quantize(Decimal("0.01"))
            delivery = f"{offer.buyer.company_name} Warehouse ({offer.buyer.district})"
            payload.buyer_id = offer.buyer_id

        # Check Logistics Provider
        if payload.logistics_provider_id:
            log_stmt = select(LogisticsProvider).where(LogisticsProvider.id == payload.logistics_provider_id)
            log_res = await db.execute(log_stmt)
            log_prov = log_res.scalar_one_or_none()
            if not log_prov:
                raise NotFoundError("Logistics provider", payload.logistics_provider_id)

            if payload.requested_quantity_kg > log_prov.current_available_capacity_kg:
                raise ValidationError(
                    f"Requested volume ({payload.requested_quantity_kg} kg) exceeds vehicle's "
                    f"available capacity ({log_prov.current_available_capacity_kg} kg)."
                )
            # Estimate 40 km average pilot transport
            est_dist_km = Decimal("40.0")
            calc_transport = (payload.requested_quantity_kg * log_prov.per_km_rate_per_kg * est_dist_km).quantize(Decimal("0.01"))
            logistics_cost = max(calc_transport, log_prov.minimum_fare)

        # Check Cold Storage
        if payload.cold_storage_facility_id:
            cold_stmt = select(ColdStorageFacility).where(ColdStorageFacility.id == payload.cold_storage_facility_id)
            cold_res = await db.execute(cold_stmt)
            cold_fac = cold_res.scalar_one_or_none()
            if not cold_fac:
                raise NotFoundError("Cold storage facility", payload.cold_storage_facility_id)

            if payload.requested_quantity_kg > cold_fac.available_capacity_kg:
                raise ValidationError(
                    f"Requested quantity ({payload.requested_quantity_kg} kg) exceeds cold storage "
                    f"available capacity ({cold_fac.available_capacity_kg} kg)."
                )
            delivery = f"{cold_fac.facility_name} ({cold_fac.location_taluka})"
            # Estimate 1 month initial holding
            storage_cost = (payload.requested_quantity_kg * cold_fac.storage_rate_per_kg_per_month).quantize(Decimal("0.01"))

        # Check Processing Facility
        if payload.processing_facility_id:
            proc_stmt = select(ProcessingFacility).where(ProcessingFacility.id == payload.processing_facility_id)
            proc_res = await db.execute(proc_stmt)
            proc_fac = proc_res.scalar_one_or_none()
            if not proc_fac:
                raise NotFoundError("Processing facility", payload.processing_facility_id)

            if payload.requested_quantity_kg > proc_fac.available_capacity_kg:
                raise ValidationError(
                    f"Requested batch ({payload.requested_quantity_kg} kg) exceeds facility daily available "
                    f"capacity ({proc_fac.available_capacity_kg} kg)."
                )
            delivery = f"{proc_fac.facility_name} ({proc_fac.location_district})"
            processing_cost = (payload.requested_quantity_kg * proc_fac.processing_charge_per_kg).quantize(Decimal("0.01"))

        net_payout = (total_val - logistics_cost - storage_cost - processing_cost).quantize(Decimal("0.01"))

        # 4. Construct ExecutionRequest
        req_id = str(uuid.uuid4())
        exec_req = ExecutionRequest(
            id=req_id,
            crop_lot_id=crop_lot.id,
            farmer_user_id=farmer_user_id,
            decision_run_id=payload.decision_run_id,
            route_type=payload.route_type,
            status="SUBMITTED",
            buyer_id=payload.buyer_id,
            buyer_offer_id=payload.buyer_offer_id,
            logistics_provider_id=payload.logistics_provider_id,
            cold_storage_facility_id=payload.cold_storage_facility_id,
            processing_facility_id=payload.processing_facility_id,
            requested_quantity_kg=payload.requested_quantity_kg,
            indicative_unit_price=unit_price,
            indicative_total_value=total_val,
            indicative_logistics_cost=logistics_cost,
            indicative_storage_cost=storage_cost,
            indicative_processing_cost=processing_cost,
            indicative_net_payout=net_payout,
            pickup_location=pickup,
            delivery_location=delivery,
            scheduled_date=payload.scheduled_date or datetime.now(timezone.utc),
            notes=payload.notes,
            data_mode="demo",
        )
        db.add(exec_req)

        # 5. Add initial audit event
        audit_event = ExecutionRequestEvent(
            id=str(uuid.uuid4()),
            request_id=req_id,
            from_status=None,
            to_status="SUBMITTED",
            actor_user_id=farmer_user_id,
            actor_role="FARMER",
            message=f"Execution request initiated for {payload.requested_quantity_kg} kg {crop_lot.crop_name} via {payload.route_type}.",
        )
        db.add(audit_event)

        # 6. Update CropLot status & event
        crop_lot.status = "REQUESTS_PENDING"
        lot_event = CropLotEvent(
            crop_lot_id=crop_lot.id,
            event_type="EXECUTION_REQUESTED",
            description=f"Execution request {req_id[:8]} submitted for {payload.route_type}.",
            actor_user_id=farmer_user_id,
        )
        db.add(lot_event)

        await db.commit()
        await db.refresh(exec_req)
        return await self.get_execution_request_by_id(req_id, farmer_user_id, db)

    async def get_user_execution_requests(
        self,
        user_id: str,
        db: AsyncSession,
        status: Optional[str] = None,
    ) -> List[ExecutionRequest]:
        stmt = (
            select(ExecutionRequest)
            .options(
                selectinload(ExecutionRequest.events),
                selectinload(ExecutionRequest.crop_lot),
                selectinload(ExecutionRequest.buyer),
                selectinload(ExecutionRequest.buyer_offer),
                selectinload(ExecutionRequest.logistics_provider),
                selectinload(ExecutionRequest.cold_storage_facility),
                selectinload(ExecutionRequest.processing_facility),
            )
            .where(ExecutionRequest.farmer_user_id == user_id)
            .order_by(ExecutionRequest.created_at.desc())
        )
        if status:
            stmt = stmt.where(ExecutionRequest.status == status)

        res = await db.execute(stmt)
        return res.scalars().all()

    async def get_execution_request_by_id(
        self,
        request_id: str,
        user_id: str,
        db: AsyncSession,
    ) -> ExecutionRequest:
        stmt = (
            select(ExecutionRequest)
            .options(
                selectinload(ExecutionRequest.events),
                selectinload(ExecutionRequest.crop_lot),
                selectinload(ExecutionRequest.buyer),
                selectinload(ExecutionRequest.buyer_offer),
                selectinload(ExecutionRequest.logistics_provider),
                selectinload(ExecutionRequest.cold_storage_facility),
                selectinload(ExecutionRequest.processing_facility),
            )
            .where(ExecutionRequest.id == request_id)
        )
        res = await db.execute(stmt)
        req = res.scalar_one_or_none()

        if not req:
            raise NotFoundError("Execution request", request_id)

        if req.farmer_user_id != user_id:
            raise AuthorizationError("You do not have permission to access this execution request.")

        return req

    async def transition_execution_status(
        self,
        request_id: str,
        transition: ExecutionStatusTransitionRequest,
        actor_user_id: str,
        actor_role: str,
        db: AsyncSession,
    ) -> ExecutionRequest:
        """
        Validates and transitions request status with capacity reservation / release logic.
        """
        req = await self.get_execution_request_by_id(request_id, actor_user_id, db)
        current_status = req.status
        target_status = transition.to_status

        # 1. Validate status transition
        allowed = VALID_TRANSITIONS.get(current_status, [])
        if target_status not in allowed:
            raise ValidationError(
                f"Invalid transition from '{current_status}' to '{target_status}'. "
                f"Permitted next states: {', '.join(allowed) if allowed else 'None (Terminal state)'}"
            )

        # 2. Capacity reservation when CONFIRMED
        if target_status == "CONFIRMED" and current_status != "CONFIRMED":
            if req.buyer_offer_id:
                off_stmt = select(BuyerOffer).where(BuyerOffer.id == req.buyer_offer_id).with_for_update()
                off_res = await db.execute(off_stmt)
                offer = off_res.scalar_one_or_none()
                if offer:
                    if offer.current_fulfilled_kg + req.requested_quantity_kg > offer.max_quantity_kg:
                        raise ValidationError("Cannot confirm: Buyer purchasing capacity has been exhausted by concurrent orders.")
                    offer.current_fulfilled_kg += req.requested_quantity_kg
                    if offer.current_fulfilled_kg >= offer.max_quantity_kg:
                        offer.status = "FULFILLED"

            if req.cold_storage_facility_id:
                cold_stmt = select(ColdStorageFacility).where(ColdStorageFacility.id == req.cold_storage_facility_id).with_for_update()
                cold_res = await db.execute(cold_stmt)
                cold_fac = cold_res.scalar_one_or_none()
                if cold_fac:
                    if cold_fac.available_capacity_kg < req.requested_quantity_kg:
                        raise ValidationError("Cannot confirm: Cold storage capacity is no longer sufficient.")
                    cold_fac.available_capacity_kg -= req.requested_quantity_kg
                    if cold_fac.available_capacity_kg <= Decimal("0"):
                        cold_fac.availability_status = "FULL"

            if req.processing_facility_id:
                proc_stmt = select(ProcessingFacility).where(ProcessingFacility.id == req.processing_facility_id).with_for_update()
                proc_res = await db.execute(proc_stmt)
                proc_fac = proc_res.scalar_one_or_none()
                if proc_fac:
                    if proc_fac.available_capacity_kg < req.requested_quantity_kg:
                        raise ValidationError("Cannot confirm: Processing unit daily capacity exhausted.")
                    proc_fac.available_capacity_kg -= req.requested_quantity_kg

            if req.logistics_provider_id:
                log_stmt = select(LogisticsProvider).where(LogisticsProvider.id == req.logistics_provider_id).with_for_update()
                log_res = await db.execute(log_stmt)
                log_prov = log_res.scalar_one_or_none()
                if log_prov:
                    log_prov.current_available_capacity_kg = max(
                        Decimal("0"), log_prov.current_available_capacity_kg - req.requested_quantity_kg
                    )

        # 3. Release capacity if CANCELLED or REJECTED from CONFIRMED or IN_EXECUTION
        if target_status in ("CANCELLED", "REJECTED") and current_status in ("CONFIRMED", "IN_EXECUTION"):
            if req.buyer_offer_id:
                off_stmt = select(BuyerOffer).where(BuyerOffer.id == req.buyer_offer_id).with_for_update()
                off_res = await db.execute(off_stmt)
                offer = off_res.scalar_one_or_none()
                if offer:
                    offer.current_fulfilled_kg = max(Decimal("0"), offer.current_fulfilled_kg - req.requested_quantity_kg)
                    if offer.status == "FULFILLED":
                        offer.status = "OPEN"

            if req.cold_storage_facility_id:
                cold_stmt = select(ColdStorageFacility).where(ColdStorageFacility.id == req.cold_storage_facility_id).with_for_update()
                cold_res = await db.execute(cold_stmt)
                cold_fac = cold_res.scalar_one_or_none()
                if cold_fac:
                    cold_fac.available_capacity_kg += req.requested_quantity_kg
                    cold_fac.availability_status = "AVAILABLE"

            if req.processing_facility_id:
                proc_stmt = select(ProcessingFacility).where(ProcessingFacility.id == req.processing_facility_id).with_for_update()
                proc_res = await db.execute(proc_stmt)
                proc_fac = proc_res.scalar_one_or_none()
                if proc_fac:
                    proc_fac.available_capacity_kg += req.requested_quantity_kg

        # 4. Update request status
        req.status = target_status
        req.updated_at = datetime.now(timezone.utc)

        # 5. Log audit event
        audit_event = ExecutionRequestEvent(
            id=str(uuid.uuid4()),
            request_id=req.id,
            from_status=current_status,
            to_status=target_status,
            actor_user_id=actor_user_id,
            actor_role=actor_role,
            message=transition.message,
            metadata_json=json.dumps(transition.metadata or {}),
        )
        db.add(audit_event)

        # 6. Update CropLot status correspondingly
        lot_stmt = select(CropLot).where(CropLot.id == req.crop_lot_id)
        lot_res = await db.execute(lot_stmt)
        crop_lot = lot_res.scalar_one_or_none()
        if crop_lot:
            if target_status == "CONFIRMED":
                crop_lot.status = "READY_TO_EXECUTE"
            elif target_status == "IN_EXECUTION":
                crop_lot.status = "IN_PROGRESS"
            elif target_status == "CANCELLED":
                crop_lot.status = "ANALYZED"

        await db.commit()
        return await self.get_execution_request_by_id(request_id, actor_user_id, db)

    async def complete_execution_request(
        self,
        request_id: str,
        completion: ExecutionRequestCompleteRequest,
        actor_user_id: str,
        db: AsyncSession,
    ) -> ExecutionRequest:
        """
        Records the actual realized outcomes (settlement weights, price, costs, and net realized payout).
        Preserves the immutable Decision Engine snapshot completely untouched.
        """
        req = await self.get_execution_request_by_id(request_id, actor_user_id, db)
        if req.status not in ("CONFIRMED", "IN_EXECUTION"):
            raise ValidationError(f"Cannot complete request from status '{req.status}'. Must be CONFIRMED or IN_EXECUTION.")

        gross = (completion.actual_quantity_kg * completion.actual_unit_price).quantize(Decimal("0.01"))
        log_cost = completion.actual_logistics_cost or Decimal("0.00")
        store_cost = completion.actual_storage_cost or Decimal("0.00")
        proc_cost = completion.actual_processing_cost or Decimal("0.00")
        net = (gross - log_cost - store_cost - proc_cost).quantize(Decimal("0.01"))

        now_utc = datetime.now(timezone.utc)
        req.actual_quantity_kg = completion.actual_quantity_kg
        req.actual_unit_price = completion.actual_unit_price
        req.actual_gross_revenue = gross
        req.actual_logistics_cost = log_cost
        req.actual_storage_cost = store_cost
        req.actual_processing_cost = proc_cost
        req.actual_net_payout = net
        req.completion_notes = completion.completion_notes
        req.completed_at = now_utc
        req.status = "COMPLETED"
        req.updated_at = now_utc

        # Record completion event
        event = ExecutionRequestEvent(
            id=str(uuid.uuid4()),
            request_id=req.id,
            from_status="IN_EXECUTION",
            to_status="COMPLETED",
            actor_user_id=actor_user_id,
            actor_role="FARMER",
            message=(
                f"Execution completed. Realized net payout: ₹{net:,.2f} "
                f"({completion.actual_quantity_kg} kg @ ₹{completion.actual_unit_price}/kg)."
            ),
            metadata_json=json.dumps({
                "realized_gross": str(gross),
                "realized_net": str(net),
                "logistics_cost": str(log_cost),
            }),
        )
        db.add(event)

        # Update CropLot
        lot_stmt = select(CropLot).where(CropLot.id == req.crop_lot_id)
        lot_res = await db.execute(lot_stmt)
        crop_lot = lot_res.scalar_one_or_none()
        if crop_lot:
            crop_lot.status = "COMPLETED"
            lot_event = CropLotEvent(
                crop_lot_id=crop_lot.id,
                event_type="COMPLETED",
                description=f"Harvest lot execution successfully completed via request {req.id[:8]}. Realized net profit: ₹{net:,.2f}.",
                actor_user_id=actor_user_id,
            )
            db.add(lot_event)

        await db.commit()
        return await self.get_execution_request_by_id(request_id, actor_user_id, db)


execution_service = ExecutionService()
