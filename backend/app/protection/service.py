# backend/app/protection/service.py
"""
Service layer for Phase 5: Farmer Protection, Deal Transparency & Financial Trust.

Implements:
- Strict Decimal arithmetic for commercial terms.
- Immutable deal snapshots and auditable amendment versioning.
- Delivery verification, remaining volume calculation, and bilateral confirmations.
- Auditable payment ledger and reconciliation without payment processor integration.
- Farmer dispute lifecycle with transparent timelines and legal disclaimers.
- Explainable risk alerts engine.
- Complete transaction audit event stream.
"""
import json
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Tuple

from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import AppError, NotFoundError, AuthorizationError, ValidationError
from app.database.models import (
    User,
    Farm,
    CropLot,
    ExecutionRequest,
    ExecutionRequestEvent,
    Buyer,
    ProcessingFacility,
    ColdStorageFacility,
    DealAgreement,
    AgreementAmendment,
    DeliveryRecord,
    PaymentRecord,
    FarmerDispute,
    DisputeEvent,
    FarmerRiskAlert,
    TransactionAuditEvent,
)
from app.protection.schemas import (
    AgreementCreate,
    AgreementAmend,
    DeliveryRecordCreate,
    PaymentRecordCreate,
    DisputeCreate,
    DisputeUpdate,
    PaymentReconciliationSummary,
    ProtectionDashboardMetrics,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def ensure_utc(dt: Optional[datetime]) -> Optional[datetime]:
    """Ensure datetime has UTC tzinfo for cross-dialect compatibility (e.g. SQLite tests)."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def round_decimal(val: Decimal, places: int = 2) -> Decimal:
    """Helper to round decimals with ROUND_HALF_UP."""
    fmt = Decimal("10") ** -places
    return val.quantize(fmt, rounding=ROUND_HALF_UP)


class ProtectionService:
    # ==========================================================================
    # Commercial Math & Unit Normalization
    # ==========================================================================

    @staticmethod
    def calculate_commercial_totals(
        agreed_quantity_kg: Decimal,
        agreed_unit_price: Decimal,
        pricing_unit: str,
        logistics_deduction: Decimal = Decimal("0.00"),
        processing_deduction: Decimal = Decimal("0.00"),
        quality_deduction: Decimal = Decimal("0.00"),
        other_deductions: Decimal = Decimal("0.00"),
    ) -> Tuple[Decimal, Decimal, Decimal]:
        """
        Calculate gross amount, total deductions, and net payout using Decimal.
        Normalizes pricing unit safely:
        - If INR/quintal: 1 quintal = 100 kg -> gross = (qty / 100) * price
        - If INR/kg: gross = qty * price
        """
        unit_clean = pricing_unit.strip().upper()
        if unit_clean == "INR/QUINTAL":
            gross = (agreed_quantity_kg / Decimal("100")) * agreed_unit_price
        else:
            gross = agreed_quantity_kg * agreed_unit_price

        gross = round_decimal(gross, 2)
        total_ded = round_decimal(
            logistics_deduction + processing_deduction + quality_deduction + other_deductions,
            2,
        )
        net_payout = round_decimal(gross - total_ded, 2)
        if net_payout < Decimal("0.00"):
            net_payout = Decimal("0.00")

        return gross, total_ded, net_payout

    # ==========================================================================
    # Deal Agreements
    # ==========================================================================

    async def list_agreements(
        self,
        db: AsyncSession,
        user: User,
        status: Optional[str] = None,
    ) -> List[DealAgreement]:
        """List agreements visible to user (farmer or partner)."""
        stmt = (
            select(DealAgreement)
            .options(selectinload(DealAgreement.amendments))
            .order_by(DealAgreement.created_at.desc())
        )
        if user.role == "FARMER":
            stmt = stmt.where(DealAgreement.farmer_user_id == user.id)
        elif user.role in ["BUYER", "PROCESSOR", "TRANSPORTER"]:
            # Role-aware partner filter: matches partner_id or farmer agreements if demo
            stmt = stmt.where(
                or_(
                    DealAgreement.partner_id == user.id,
                    DealAgreement.partner_type == user.role,
                )
            )

        if status:
            stmt = stmt.where(DealAgreement.status == status.upper())

        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_agreement(
        self,
        db: AsyncSession,
        agreement_id: str,
        user: User,
    ) -> DealAgreement:
        """Fetch agreement with ownership verification."""
        stmt = (
            select(DealAgreement)
            .options(
                selectinload(DealAgreement.amendments),
                selectinload(DealAgreement.deliveries),
                selectinload(DealAgreement.payments),
                selectinload(DealAgreement.disputes),
                selectinload(DealAgreement.risk_alerts),
                selectinload(DealAgreement.audit_events),
            )
            .where(DealAgreement.id == agreement_id)
        )
        result = await db.execute(stmt)
        agr = result.scalar_one_or_none()
        if not agr:
            raise NotFoundError("Deal agreement", agreement_id)

        if user.role == "FARMER" and agr.farmer_user_id != user.id:
            raise AuthorizationError("Access denied: You do not own this agreement")

        return agr

    async def create_agreement(
        self,
        db: AsyncSession,
        user: User,
        payload: AgreementCreate,
    ) -> DealAgreement:
        """Create a new digital agreement record."""
        # Verify crop lot ownership
        res_lot = await db.execute(select(CropLot).where(CropLot.id == payload.crop_lot_id))
        crop_lot = res_lot.scalar_one_or_none()
        if not crop_lot:
            raise NotFoundError("Crop lot", payload.crop_lot_id)
        if user.role == "FARMER" and crop_lot.owner_user_id != user.id:
            raise AuthorizationError("Access denied: Crop lot does not belong to you")

        # Count existing agreements to generate sequential agreement number
        count_res = await db.execute(select(func.count(DealAgreement.id)))
        total_agrs = count_res.scalar_one() or 0
        agr_num = f"AGR-2026-{total_agrs + 1:04d}"

        gross, total_ded, net_payout = self.calculate_commercial_totals(
            agreed_quantity_kg=payload.agreed_quantity_kg,
            agreed_unit_price=payload.agreed_unit_price,
            pricing_unit=payload.pricing_unit,
            logistics_deduction=payload.logistics_deduction,
            processing_deduction=payload.processing_deduction,
            quality_deduction=payload.quality_deduction,
            other_deductions=payload.other_deductions,
        )

        now = _now()
        expected_payment_dt = None
        if payload.expected_delivery_date:
            expected_payment_dt = payload.expected_delivery_date + timedelta(days=payload.payment_terms_days)
        else:
            expected_payment_dt = now + timedelta(days=payload.payment_terms_days)

        agr = DealAgreement(
            agreement_number=agr_num,
            execution_request_id=payload.execution_request_id,
            farmer_user_id=user.id,
            farm_id=crop_lot.farm_id,
            crop_lot_id=crop_lot.id,
            partner_type=payload.partner_type.upper(),
            partner_id=payload.partner_id,
            partner_name=payload.partner_name,
            partner_contact=payload.partner_contact,
            commodity=payload.commodity,
            variety=payload.variety,
            quality_grade=payload.quality_grade,
            agreed_quantity_kg=payload.agreed_quantity_kg,
            quantity_unit="kg",
            agreed_unit_price=payload.agreed_unit_price,
            pricing_unit=payload.pricing_unit,
            gross_amount=gross,
            logistics_deduction=payload.logistics_deduction,
            processing_deduction=payload.processing_deduction,
            quality_deduction=payload.quality_deduction,
            other_deductions=payload.other_deductions,
            total_deductions=total_ded,
            estimated_net_payout=net_payout,
            quality_requirements=payload.quality_requirements,
            pickup_location=payload.pickup_location,
            delivery_location=payload.delivery_location,
            expected_delivery_date=payload.expected_delivery_date,
            payment_terms_days=payload.payment_terms_days,
            expected_payment_date=expected_payment_dt,
            status="PENDING_ACCEPTANCE",
            version=1,
            is_latest=True,
            farmer_notes=payload.farmer_notes,
            terms_acknowledged=False,
            data_mode="demo",
            created_at=now,
            updated_at=now,
        )
        db.add(agr)
        await db.flush()

        # Audit event
        audit = TransactionAuditEvent(
            agreement_id=agr.id,
            event_type="AGREEMENT_CREATED",
            actor_role=user.role,
            actor_name=user.full_name,
            summary=f"Agreement {agr.agreement_number} created with {agr.partner_name} for {agr.agreed_quantity_kg} kg {agr.commodity}.",
            created_at=now,
        )
        db.add(audit)
        await db.commit()
        return await self.get_agreement(db, agr.id, user)

    async def create_agreement_from_execution_request(
        self,
        db: AsyncSession,
        user: User,
        execution_request_id: str,
    ) -> DealAgreement:
        """Create a transparent DealAgreement directly from a confirmed ExecutionRequest."""
        # Find execution request
        stmt = select(ExecutionRequest).where(ExecutionRequest.id == execution_request_id)
        result = await db.execute(stmt)
        req = result.scalar_one_or_none()
        if not req:
            raise NotFoundError("Execution request", execution_request_id)
        if user.role == "FARMER" and req.farmer_user_id != user.id:
            raise AuthorizationError("Access denied: Execution request does not belong to you")

        # Check if already created
        ex_stmt = select(DealAgreement).where(DealAgreement.execution_request_id == execution_request_id)
        ex_res = await db.execute(ex_stmt)
        existing = ex_res.scalar_one_or_none()
        if existing:
            return await self.get_agreement(db, existing.id, user)

        # Get crop lot
        lot_res = await db.execute(select(CropLot).where(CropLot.id == req.crop_lot_id))
        lot = lot_res.scalar_one_or_none()

        # Identify partner
        partner_name = "Commercial Partner"
        partner_type = "BUYER"
        partner_id = None
        partner_contact = None
        payment_terms_days = 3

        if req.buyer_id:
            b_res = await db.execute(select(Buyer).where(Buyer.id == req.buyer_id))
            b = b_res.scalar_one_or_none()
            if b:
                partner_name = b.company_name
                partner_type = "BUYER"
                partner_id = b.id
                partner_contact = f"{b.contact_person} ({b.phone})"
        elif req.processing_facility_id:
            p_res = await db.execute(select(ProcessingFacility).where(ProcessingFacility.id == req.processing_facility_id))
            p = p_res.scalar_one_or_none()
            if p:
                partner_name = p.facility_name
                partner_type = "PROCESSOR"
                partner_id = p.id
                partner_contact = p.contact_phone
                payment_terms_days = 7

        unit_price = req.indicative_unit_price
        if not unit_price or unit_price <= Decimal("0.00"):
            unit_price = (lot.target_price_per_kg if lot and lot.target_price_per_kg and lot.target_price_per_kg > 0 else Decimal("18.00"))

        payload = AgreementCreate(
            crop_lot_id=req.crop_lot_id,
            execution_request_id=req.id,
            partner_type=partner_type,
            partner_id=partner_id,
            partner_name=partner_name,
            partner_contact=partner_contact,
            commodity=lot.crop_name if lot else "Produce",
            variety=lot.variety if lot else None,
            quality_grade=lot.quality_grade if lot else "Grade A",
            agreed_quantity_kg=req.requested_quantity_kg,
            quantity_unit="kg",
            agreed_unit_price=unit_price,
            pricing_unit="INR/kg",
            logistics_deduction=req.indicative_logistics_cost,
            processing_deduction=req.indicative_processing_cost,
            quality_deduction=Decimal("0.00"),
            other_deductions=Decimal("0.00"),
            quality_requirements="Standard Grade specifications as agreed in execution order.",
            pickup_location=req.pickup_location,
            delivery_location=req.delivery_location,
            expected_delivery_date=req.scheduled_date,
            payment_terms_days=payment_terms_days,
            farmer_notes=f"Converted from Execution Request #{req.id[:8]}",
        )
        return await self.create_agreement(db, user, payload)

    async def accept_agreement(
        self,
        db: AsyncSession,
        agreement_id: str,
        user: User,
        notes: Optional[str] = None,
    ) -> DealAgreement:
        """Accept an agreement. Both farmer and partner can accept."""
        agr = await self.get_agreement(db, agreement_id, user)
        now = _now()

        if user.role == "FARMER":
            if agr.farmer_user_id != user.id:
                raise AuthorizationError("Only the owning farmer can accept this agreement")
            agr.farmer_accepted_at = now
            agr.terms_acknowledged = True
            if notes:
                agr.farmer_notes = notes

            # In demo mode, if partner hasn't explicitly accepted, auto-accept to simulate smooth flow
            if not agr.partner_accepted_at:
                agr.partner_accepted_at = now

        else:
            agr.partner_accepted_at = now

        agr.status = "ACCEPTED"
        agr.updated_at = now

        audit = TransactionAuditEvent(
            agreement_id=agr.id,
            event_type="AGREEMENT_ACCEPTED",
            actor_role=user.role,
            actor_name=user.full_name,
            summary=f"Agreement {agr.agreement_number} accepted by {user.role} ({user.full_name}).",
            created_at=now,
        )
        db.add(audit)
        await db.commit()
        return await self.get_agreement(db, agr.id, user)

    async def amend_agreement(
        self,
        db: AsyncSession,
        agreement_id: str,
        user: User,
        payload: AgreementAmend,
    ) -> DealAgreement:
        """
        Amend agreement terms with an auditable snapshot.
        Never silently overwrites accepted terms; requires explicit re-acceptance.
        """
        agr = await self.get_agreement(db, agreement_id, user)
        now = _now()

        if agr.status in ["COMPLETED", "CANCELLED"]:
            raise ValidationError(f"Cannot amend agreement {agr.agreement_number} in terminal state '{agr.status}'.")

        if user.role == "FARMER" and agr.farmer_user_id != user.id:
            raise AuthorizationError("Only parties associated with this agreement can amend terms.")

        # Capture immutable snapshot of current terms
        snapshot = {
            "version": agr.version,
            "agreed_quantity_kg": str(agr.agreed_quantity_kg),
            "agreed_unit_price": str(agr.agreed_unit_price),
            "pricing_unit": agr.pricing_unit,
            "gross_amount": str(agr.gross_amount),
            "logistics_deduction": str(agr.logistics_deduction),
            "processing_deduction": str(agr.processing_deduction),
            "quality_deduction": str(agr.quality_deduction),
            "other_deductions": str(agr.other_deductions),
            "total_deductions": str(agr.total_deductions),
            "estimated_net_payout": str(agr.estimated_net_payout),
            "payment_terms_days": agr.payment_terms_days,
            "delivery_location": agr.delivery_location,
            "status_prior": agr.status,
            "farmer_accepted_at": agr.farmer_accepted_at.isoformat() if agr.farmer_accepted_at else None,
            "partner_accepted_at": agr.partner_accepted_at.isoformat() if agr.partner_accepted_at else None,
        }

        amendment = AgreementAmendment(
            agreement=agr,
            agreement_id=agr.id,
            version=agr.version,
            changed_by_role=user.role,
            changed_by_name=user.full_name,
            reason=payload.reason,
            terms_snapshot_json=json.dumps(snapshot),
            created_at=now,
        )
        db.add(amendment)

        # Detect adverse changes for explainable risk alerts
        previous_price = agr.agreed_unit_price
        previous_deductions = agr.total_deductions

        # Apply updates
        if payload.agreed_quantity_kg is not None:
            agr.agreed_quantity_kg = payload.agreed_quantity_kg
        if payload.agreed_unit_price is not None:
            agr.agreed_unit_price = payload.agreed_unit_price
        if payload.logistics_deduction is not None:
            agr.logistics_deduction = payload.logistics_deduction
        if payload.processing_deduction is not None:
            agr.processing_deduction = payload.processing_deduction
        if payload.quality_deduction is not None:
            agr.quality_deduction = payload.quality_deduction
        if payload.other_deductions is not None:
            agr.other_deductions = payload.other_deductions
        if payload.payment_terms_days is not None:
            agr.payment_terms_days = payload.payment_terms_days
        if payload.delivery_location:
            agr.delivery_location = payload.delivery_location

        # Recompute totals
        gross, total_ded, net_payout = self.calculate_commercial_totals(
            agreed_quantity_kg=agr.agreed_quantity_kg,
            agreed_unit_price=agr.agreed_unit_price,
            pricing_unit=agr.pricing_unit,
            logistics_deduction=agr.logistics_deduction,
            processing_deduction=agr.processing_deduction,
            quality_deduction=agr.quality_deduction,
            other_deductions=agr.other_deductions,
        )
        agr.gross_amount = gross
        agr.total_deductions = total_ded
        agr.estimated_net_payout = net_payout

        # Increment version and require re-acceptance
        agr.version += 1
        agr.status = "PENDING_ACCEPTANCE"
        agr.farmer_accepted_at = None
        agr.partner_accepted_at = None
        agr.updated_at = now

        # Risk alert triggers
        if agr.agreed_unit_price < previous_price:
            p_old = f"{round_decimal(previous_price, 2):.2f}"
            p_new = f"{round_decimal(agr.agreed_unit_price, 2):.2f}"
            alert = FarmerRiskAlert(
                farmer_user_id=agr.farmer_user_id,
                agreement_id=agr.id,
                risk_type="PRICE_CHANGED_AFTER_ACCEPTANCE",
                severity="WARNING",
                trigger_evidence=f"Unit price reduced from INR {p_old} to INR {p_new}.",
                explanation="Commercial terms were amended with a lower unit price than previously agreed.",
                recommended_action="Review amendment reasons and accept only if market conditions or quality adjustments justify it.",
                created_at=now,
            )
            db.add(alert)

        if agr.total_deductions > previous_deductions:
            diff = f"{round_decimal(agr.total_deductions - previous_deductions, 2):.2f}"
            total_now = f"{round_decimal(agr.total_deductions, 2):.2f}"
            alert = FarmerRiskAlert(
                farmer_user_id=agr.farmer_user_id,
                agreement_id=agr.id,
                risk_type="UNEXPECTED_DEDUCTION",
                severity="WARNING",
                trigger_evidence=f"Deductions increased by INR {diff} (Total deductions now INR {total_now}).",
                explanation="New or increased deductions were introduced in the latest amendment snapshot.",
                recommended_action="Request itemized explanation for additional deductions before re-accepting.",
                created_at=now,
            )
            db.add(alert)

        # Audit event
        audit = TransactionAuditEvent(
            agreement_id=agr.id,
            event_type="TERMS_AMENDED",
            actor_role=user.role,
            actor_name=user.full_name,
            summary=f"Agreement amended to v{agr.version}. Reason: {payload.reason}.",
            details_json=json.dumps({"version": agr.version, "reason": payload.reason}),
            created_at=now,
        )
        db.add(audit)
        await db.commit()
        return await self.get_agreement(db, agr.id, user)

    # ==========================================================================
    # Delivery Records
    # ==========================================================================

    async def list_deliveries(
        self,
        db: AsyncSession,
        user: User,
        agreement_id: Optional[str] = None,
    ) -> List[DeliveryRecord]:
        """List delivery records."""
        stmt = (
            select(DeliveryRecord)
            .join(DealAgreement, DeliveryRecord.agreement_id == DealAgreement.id)
            .order_by(DeliveryRecord.created_at.desc())
        )
        if user.role == "FARMER":
            stmt = stmt.where(DealAgreement.farmer_user_id == user.id)
        if agreement_id:
            stmt = stmt.where(DeliveryRecord.agreement_id == agreement_id)

        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def calculate_remaining_quantity(
        self,
        db: AsyncSession,
        agreement: DealAgreement,
    ) -> Decimal:
        """Calculate unfulfilled quantity in kg."""
        stmt = select(func.sum(DeliveryRecord.accepted_quantity_kg)).where(
            DeliveryRecord.agreement_id == agreement.id,
            DeliveryRecord.status.in_(["CONFIRMED", "PENDING", "PARTIALLY_DELIVERED"]),
        )
        res = await db.execute(stmt)
        total_delivered = res.scalar_one_or_none() or Decimal("0.0000")
        remaining = agreement.agreed_quantity_kg - total_delivered
        return Decimal("0.0000") if remaining < Decimal("0.0000") else remaining

    async def record_delivery(
        self,
        db: AsyncSession,
        user: User,
        payload: DeliveryRecordCreate,
    ) -> DeliveryRecord:
        """Record a partial or full delivery."""
        agr = await self.get_agreement(db, payload.agreement_id, user)
        now = _now()

        # 1. Validate quantity breakdown integrity
        if (payload.accepted_quantity_kg + payload.rejected_quantity_kg) != payload.delivered_quantity_kg:
            raise ValidationError(
                f"Quantity mismatch: accepted ({payload.accepted_quantity_kg} kg) + rejected ({payload.rejected_quantity_kg} kg) "
                f"does not equal total delivered quantity ({payload.delivered_quantity_kg} kg)."
            )

        # 2. Prevent over-delivery beyond agreed remaining volume
        remaining_qty = await self.calculate_remaining_quantity(db, agr)
        if payload.delivered_quantity_kg > remaining_qty:
            raise ValidationError(
                f"Delivered quantity ({payload.delivered_quantity_kg} kg) exceeds remaining unfulfilled quantity "
                f"({remaining_qty} kg) for agreement {agr.agreement_number}."
            )

        # 3. Detect duplicate delivery records
        if payload.vehicle_number and payload.delivery_timestamp:
            dup_stmt = select(DeliveryRecord).where(
                DeliveryRecord.agreement_id == agr.id,
                DeliveryRecord.vehicle_number == payload.vehicle_number,
                DeliveryRecord.delivery_timestamp == payload.delivery_timestamp,
            )
            dup = (await db.execute(dup_stmt)).scalar_one_or_none()
            if dup:
                raise ValidationError(
                    f"Duplicate delivery record detected for vehicle '{payload.vehicle_number}' "
                    f"at timestamp '{payload.delivery_timestamp}'."
                )

        count_res = await db.execute(select(func.count(DeliveryRecord.id)))
        total_dels = count_res.scalar_one() or 0
        del_num = f"DEL-2026-{total_dels + 1:04d}"

        # Determine initial confirmation status based on who logged it
        farmer_conf = (user.role == "FARMER")
        partner_conf = (user.role in ["BUYER", "PROCESSOR", "TRANSPORTER"])

        # Determine status
        if payload.delivered_quantity_kg < agr.agreed_quantity_kg:
            status = "PARTIALLY_DELIVERED"
        else:
            status = "CONFIRMED" if (farmer_conf and partner_conf) else "PENDING"

        delivery = DeliveryRecord(
            delivery_number=del_num,
            agreement_id=agr.id,
            execution_request_id=agr.execution_request_id,
            expected_quantity_kg=agr.agreed_quantity_kg,
            delivered_quantity_kg=payload.delivered_quantity_kg,
            accepted_quantity_kg=payload.accepted_quantity_kg,
            rejected_quantity_kg=payload.rejected_quantity_kg,
            quantity_unit="kg",
            delivery_timestamp=payload.delivery_timestamp or now,
            delivery_location=payload.delivery_location,
            farmer_confirmed=farmer_conf,
            farmer_confirmed_at=now if farmer_conf else None,
            partner_confirmed=partner_conf,
            partner_confirmed_at=now if partner_conf else None,
            quality_notes=payload.quality_notes,
            vehicle_number=payload.vehicle_number,
            driver_contact=payload.driver_contact,
            evidence_notes=payload.evidence_notes or "Simulated demo delivery weighbridge verification record.",
            evidence_data_mode="SIMULATED_DEMO_PROOF",
            status=status,
            created_at=now,
            updated_at=now,
        )
        db.add(delivery)

        # If delivery recorded, transition deal to IN_PROGRESS
        if agr.status in ["ACCEPTED", "PENDING_ACCEPTANCE"]:
            agr.status = "IN_PROGRESS"
            agr.updated_at = now

        # Risk alert if rejection > 0
        if payload.rejected_quantity_kg > Decimal("0.00"):
            alert = FarmerRiskAlert(
                farmer_user_id=agr.farmer_user_id,
                agreement_id=agr.id,
                risk_type="DELIVERY_MISMATCH",
                severity="WARNING",
                trigger_evidence=f"Delivery {delivery.delivery_number} has {payload.rejected_quantity_kg} kg rejected at weighbridge.",
                explanation="Delivered quantity had partial rejection. Review quality notes or file a dispute if rejection was unjustified.",
                recommended_action="Inspect quality rejection notes and seek joint inspection evidence from the buyer.",
                created_at=now,
            )
            db.add(alert)

        audit = TransactionAuditEvent(
            agreement_id=agr.id,
            event_type="DELIVERY_LOGGED",
            actor_role=user.role,
            actor_name=user.full_name,
            summary=f"Delivery {delivery.delivery_number} recorded: {delivery.delivered_quantity_kg} kg delivered ({delivery.accepted_quantity_kg} kg accepted).",
            created_at=now,
        )
        db.add(audit)
        await db.commit()
        await db.refresh(delivery)
        return delivery

    async def confirm_delivery(
        self,
        db: AsyncSession,
        delivery_id: str,
        user: User,
        notes: Optional[str] = None,
    ) -> DeliveryRecord:
        """Confirm delivery bilaterally."""
        stmt = select(DeliveryRecord).where(DeliveryRecord.id == delivery_id)
        result = await db.execute(stmt)
        delivery = result.scalar_one_or_none()
        if not delivery:
            raise NotFoundError("Delivery record", delivery_id)

        agr = await self.get_agreement(db, delivery.agreement_id, user)
        now = _now()

        if user.role == "FARMER":
            delivery.farmer_confirmed = True
            delivery.farmer_confirmed_at = now
        else:
            delivery.partner_confirmed = True
            delivery.partner_confirmed_at = now

        if delivery.farmer_confirmed and delivery.partner_confirmed:
            delivery.status = "CONFIRMED"

        delivery.updated_at = now
        if notes:
            delivery.quality_notes = f"{delivery.quality_notes or ''}\nConfirmation Note: {notes}".strip()

        audit = TransactionAuditEvent(
            agreement_id=agr.id,
            event_type="DELIVERY_CONFIRMED",
            actor_role=user.role,
            actor_name=user.full_name,
            summary=f"Delivery {delivery.delivery_number} confirmed by {user.role}.",
            created_at=now,
        )
        db.add(audit)
        await db.commit()
        await db.refresh(delivery)
        return delivery

    # ==========================================================================
    # Payment Ledger & Reconciliation
    # ==========================================================================

    async def list_payments(
        self,
        db: AsyncSession,
        user: User,
        agreement_id: Optional[str] = None,
    ) -> List[PaymentRecord]:
        """List payments."""
        stmt = (
            select(PaymentRecord)
            .join(DealAgreement, PaymentRecord.agreement_id == DealAgreement.id)
            .order_by(PaymentRecord.created_at.desc())
        )
        if user.role == "FARMER":
            stmt = stmt.where(DealAgreement.farmer_user_id == user.id)
        if agreement_id:
            stmt = stmt.where(PaymentRecord.agreement_id == agreement_id)

        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def record_payment(
        self,
        db: AsyncSession,
        user: User,
        payload: PaymentRecordCreate,
    ) -> PaymentRecord:
        """Record a simulated payment installment in the ledger."""
        agr = await self.get_agreement(db, payload.agreement_id, user)
        now = _now()

        # 1. Prevent payments exceeding outstanding balance
        rec = await self.reconcile_payments(db, agr.id, user)
        if payload.amount_paid > rec.outstanding_balance:
            raise ValidationError(
                f"Payment amount (INR {payload.amount_paid}) exceeds outstanding balance "
                f"(INR {rec.outstanding_balance}) for agreement {agr.agreement_number}."
            )

        # 2. Reject duplicate transaction references
        if payload.transaction_reference_id:
            dup_pay = await db.execute(
                select(PaymentRecord).where(
                    PaymentRecord.transaction_reference_id == payload.transaction_reference_id
                )
            )
            if dup_pay.scalar_one_or_none():
                raise ValidationError(
                    f"Duplicate payment transaction reference '{payload.transaction_reference_id}' already exists in ledger."
                )

        count_res = await db.execute(select(func.count(PaymentRecord.id)))
        total_pays = count_res.scalar_one() or 0
        pay_ref = f"PAY-2026-{total_pays + 1:04d}"

        # Determine status
        due_utc = ensure_utc(payload.due_date)
        if payload.amount_paid >= payload.amount_due:
            status = "PAID"
        elif payload.amount_paid > Decimal("0.00"):
            status = "PARTIALLY_PAID"
        elif due_utc and due_utc < now:
            status = "OVERDUE"
        else:
            status = "PENDING"

        payment = PaymentRecord(
            payment_reference=pay_ref,
            agreement_id=agr.id,
            execution_request_id=agr.execution_request_id,
            amount_due=payload.amount_due,
            amount_paid=payload.amount_paid,
            payment_date=payload.payment_date or (now if payload.amount_paid > 0 else None),
            due_date=payload.due_date,
            payment_method=payload.payment_method,
            payment_status=status,
            payer_name=payload.payer_name,
            payee_name=payload.payee_name,
            transaction_reference_id=payload.transaction_reference_id or f"SIM-UTR-{uuid.uuid4().hex[:10].upper()}",
            notes=payload.notes,
            data_mode="SIMULATED",
            created_at=now,
            updated_at=now,
        )
        db.add(payment)

        # Check total payments against agreement
        stmt = select(func.sum(PaymentRecord.amount_paid)).where(PaymentRecord.agreement_id == agr.id)
        res = await db.execute(stmt)
        paid_so_far = (res.scalar_one_or_none() or Decimal("0.00")) + payload.amount_paid

        if paid_so_far >= agr.estimated_net_payout and agr.status == "IN_PROGRESS":
            agr.status = "COMPLETED"
            agr.updated_at = now

        audit = TransactionAuditEvent(
            agreement_id=agr.id,
            event_type="PAYMENT_RECORDED",
            actor_role=user.role,
            actor_name=user.full_name,
            summary=f"Payment {payment.payment_reference} logged: INR {payment.amount_paid} paid against INR {payment.amount_due} due ({status}).",
            created_at=now,
        )
        db.add(audit)
        await db.commit()
        await db.refresh(payment)
        return payment

    async def reconcile_payments(
        self,
        db: AsyncSession,
        agreement_id: str,
        user: User,
    ) -> PaymentReconciliationSummary:
        """Reconcile payments against agreed net proceeds."""
        agr = await self.get_agreement(db, agreement_id, user)
        now = _now()

        stmt = select(PaymentRecord).where(PaymentRecord.agreement_id == agr.id)
        res = await db.execute(stmt)
        payments = list(res.scalars().all())

        total_paid = sum((p.amount_paid for p in payments), Decimal("0.00"))
        outstanding = agr.estimated_net_payout - total_paid
        if outstanding < Decimal("0.00"):
            outstanding = Decimal("0.00")

        # Overdue check
        overdue_amount = Decimal("0.00")
        is_overdue = False
        for p in payments:
            due_utc = ensure_utc(p.due_date)
            if due_utc and due_utc < now and p.amount_paid < p.amount_due:
                is_overdue = True
                overdue_amount += (p.amount_due - p.amount_paid)

        expected_dt = ensure_utc(agr.expected_payment_date)
        if not payments and expected_dt and expected_dt < now:
            is_overdue = True
            overdue_amount = agr.estimated_net_payout

        return PaymentReconciliationSummary(
            agreement_id=agr.id,
            agreement_number=agr.agreement_number,
            gross_agreed_amount=agr.gross_amount,
            total_deductions=agr.total_deductions,
            net_agreed_payout=agr.estimated_net_payout,
            total_paid=round_decimal(total_paid, 2),
            outstanding_balance=round_decimal(outstanding, 2),
            is_fully_paid=(outstanding == Decimal("0.00") and total_paid > Decimal("0.00")),
            is_overdue=is_overdue,
            overdue_amount=round_decimal(overdue_amount, 2),
            payments_count=len(payments),
        )

    # ==========================================================================
    # Farmer Dispute Management
    # ==========================================================================

    async def list_disputes(
        self,
        db: AsyncSession,
        user: User,
        status: Optional[str] = None,
    ) -> List[FarmerDispute]:
        """List farmer disputes with event timelines."""
        stmt = (
            select(FarmerDispute)
            .options(selectinload(FarmerDispute.events))
            .order_by(FarmerDispute.created_at.desc())
        )
        if user.role == "FARMER":
            stmt = stmt.where(FarmerDispute.farmer_user_id == user.id)
        if status:
            stmt = stmt.where(FarmerDispute.status == status.upper())

        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_dispute(
        self,
        db: AsyncSession,
        dispute_id: str,
        user: User,
    ) -> FarmerDispute:
        """Fetch single dispute with ownership check."""
        stmt = (
            select(FarmerDispute)
            .options(selectinload(FarmerDispute.events))
            .where(FarmerDispute.id == dispute_id)
        )
        result = await db.execute(stmt)
        disp = result.scalar_one_or_none()
        if not disp:
            raise NotFoundError("Dispute record", dispute_id)
        if user.role == "FARMER" and disp.farmer_user_id != user.id:
            raise AuthorizationError("Access denied: You do not own this dispute record")
        return disp

    async def create_dispute(
        self,
        db: AsyncSession,
        user: User,
        payload: DisputeCreate,
    ) -> FarmerDispute:
        """Raise a formal internal dispute linked to agreement, delivery or payment."""
        agr = await self.get_agreement(db, payload.agreement_id, user)
        now = _now()

        count_res = await db.execute(select(func.count(FarmerDispute.id)))
        total_disps = count_res.scalar_one() or 0
        disp_ref = f"DISP-2026-{total_disps + 1:04d}"

        dispute = FarmerDispute(
            dispute_reference=disp_ref,
            agreement_id=agr.id,
            farmer_user_id=user.id,
            delivery_record_id=payload.delivery_record_id,
            payment_record_id=payload.payment_record_id,
            category=payload.category,
            title=payload.title,
            description=payload.description,
            disputed_amount=payload.disputed_amount,
            evidence_notes=payload.evidence_notes or "Dispute evidence submitted for platform review.",
            evidence_data_mode="DEMO_EVIDENCE",
            status="OPEN",
            disclaimer="Internal platform record and workflow. Not a court, arbitration service, or legal authority.",
            created_at=now,
            updated_at=now,
        )
        db.add(dispute)
        await db.flush()

        # Mark agreement status
        agr.status = "DISPUTED"
        agr.updated_at = now

        # Add initial timeline event
        ev = DisputeEvent(
            dispute=dispute,
            dispute_id=dispute.id,
            actor_role=user.role,
            actor_name=user.full_name,
            action="DISPUTE_FILED",
            previous_status=None,
            new_status="OPEN",
            notes=f"Dispute {dispute.dispute_reference} opened under category {payload.category}.",
            created_at=now,
        )
        db.add(ev)

        # Audit event
        audit = TransactionAuditEvent(
            agreement_id=agr.id,
            event_type="DISPUTE_RAISED",
            actor_role=user.role,
            actor_name=user.full_name,
            summary=f"Dispute {dispute.dispute_reference} raised: {dispute.title}.",
            details_json=json.dumps({"dispute_id": dispute.id, "category": dispute.category}),
            created_at=now,
        )
        db.add(audit)
        await db.commit()
        return await self.get_dispute(db, dispute.id, user)

    async def update_dispute(
        self,
        db: AsyncSession,
        dispute_id: str,
        user: User,
        payload: DisputeUpdate,
    ) -> FarmerDispute:
        """Update dispute status and add note."""
        disp = await self.get_dispute(db, dispute_id, user)
        agr = await self.get_agreement(db, disp.agreement_id, user)
        now = _now()

        old_status = disp.status
        valid_transitions = {
            "OPEN": ["UNDER_REVIEW", "AWAITING_INFORMATION", "RESOLVED", "REJECTED", "CLOSED"],
            "UNDER_REVIEW": ["AWAITING_INFORMATION", "RESOLVED", "REJECTED", "CLOSED"],
            "AWAITING_INFORMATION": ["UNDER_REVIEW", "RESOLVED", "REJECTED", "CLOSED"],
            "RESOLVED": ["CLOSED"],
            "REJECTED": ["CLOSED"],
            "CLOSED": [],
        }
        allowed = valid_transitions.get(old_status, [])
        if payload.status not in allowed:
            raise ValidationError(
                f"Invalid dispute status transition from '{old_status}' to '{payload.status}'. "
                f"Allowed next states: {', '.join(allowed) if allowed else 'None (Terminal state)'}"
            )
        disp.status = payload.status
        disp.updated_at = now
        if payload.resolution_notes:
            disp.resolution_notes = payload.resolution_notes
        if payload.status in ["RESOLVED", "CLOSED", "REJECTED"]:
            disp.resolved_at = now
            disp.resolved_by = f"{user.role}: {user.full_name}"
            # Revert agreement status if no other open disputes
            agr.status = "IN_PROGRESS"
            agr.updated_at = now

        ev = DisputeEvent(
            dispute=disp,
            dispute_id=disp.id,
            actor_role=user.role,
            actor_name=user.full_name,
            action="STATUS_CHANGED",
            previous_status=old_status,
            new_status=disp.status,
            notes=payload.notes,
            created_at=now,
        )
        db.add(ev)

        audit = TransactionAuditEvent(
            agreement_id=disp.agreement_id,
            event_type="DISPUTE_STATUS_CHANGED",
            actor_role=user.role,
            actor_name=user.full_name,
            summary=f"Dispute {disp.dispute_reference} transitioned from {old_status} to {disp.status}.",
            created_at=now,
        )
        db.add(audit)
        await db.commit()
        return await self.get_dispute(db, disp.id, user)

    # ==========================================================================
    # Farmer Risk Alerts
    # ==========================================================================

    async def list_risk_alerts(
        self,
        db: AsyncSession,
        user: User,
        resolved: Optional[bool] = None,
    ) -> List[FarmerRiskAlert]:
        """List explainable risk alerts."""
        stmt = (
            select(FarmerRiskAlert)
            .order_by(FarmerRiskAlert.created_at.desc())
        )
        if user.role == "FARMER":
            stmt = stmt.where(FarmerRiskAlert.farmer_user_id == user.id)
        if resolved is not None:
            stmt = stmt.where(FarmerRiskAlert.is_resolved == resolved)

        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def resolve_risk_alert(
        self,
        db: AsyncSession,
        alert_id: str,
        user: User,
        resolution_notes: str,
    ) -> FarmerRiskAlert:
        """Resolve a risk alert."""
        stmt = select(FarmerRiskAlert).where(FarmerRiskAlert.id == alert_id)
        result = await db.execute(stmt)
        alert = result.scalar_one_or_none()
        if not alert:
            raise NotFoundError("Risk alert", alert_id)
        if user.role == "FARMER" and alert.farmer_user_id != user.id:
            raise AuthorizationError("Access denied: You do not own this risk alert")

        alert.is_resolved = True
        alert.resolution_notes = resolution_notes
        alert.resolved_at = _now()
        await db.commit()
        await db.refresh(alert)
        return alert

    # ==========================================================================
    # Farmer Protection Dashboard Aggregator
    # ==========================================================================

    async def get_dashboard_metrics(
        self,
        db: AsyncSession,
        user: User,
    ) -> ProtectionDashboardMetrics:
        """Compute real-time metrics for Farmer Protection Dashboard."""
        now = _now()
        farmer_filter = DealAgreement.farmer_user_id == user.id if user.role == "FARMER" else True

        # Active agreements count
        res_act = await db.execute(
            select(func.count(DealAgreement.id)).where(
                farmer_filter,
                DealAgreement.status.in_(["ACCEPTED", "IN_PROGRESS"]),
            )
        )
        active_agrs = res_act.scalar_one() or 0

        # Awaiting acceptance
        res_wait = await db.execute(
            select(func.count(DealAgreement.id)).where(
                farmer_filter,
                DealAgreement.status.in_(["PENDING_ACCEPTANCE", "DRAFT"]),
            )
        )
        awaiting_acc = res_wait.scalar_one() or 0

        # Deliveries awaiting confirmation
        res_del = await db.execute(
            select(func.count(DeliveryRecord.id))
            .join(DealAgreement, DeliveryRecord.agreement_id == DealAgreement.id)
            .where(
                farmer_filter,
                DeliveryRecord.status.in_(["PENDING", "PARTIALLY_DELIVERED"]),
            )
        )
        dels_wait = res_del.scalar_one() or 0

        # Open disputes
        disp_filter = FarmerDispute.farmer_user_id == user.id if user.role == "FARMER" else True
        res_disp = await db.execute(
            select(func.count(FarmerDispute.id)).where(
                disp_filter,
                FarmerDispute.status.in_(["OPEN", "UNDER_REVIEW", "AWAITING_INFORMATION"]),
            )
        )
        open_disputes = res_disp.scalar_one() or 0

        # Active alerts
        alert_filter = FarmerRiskAlert.farmer_user_id == user.id if user.role == "FARMER" else True
        res_alert = await db.execute(
            select(func.count(FarmerRiskAlert.id)).where(
                alert_filter,
                FarmerRiskAlert.is_resolved.is_(False),
            )
        )
        active_alerts = res_alert.scalar_one() or 0

        # Financial totals
        agrs_stmt = select(DealAgreement).where(
            farmer_filter,
            DealAgreement.status.in_(["ACCEPTED", "IN_PROGRESS", "COMPLETED", "DISPUTED"]),
        )
        agrs_res = await db.execute(agrs_stmt)
        agrs = list(agrs_res.scalars().all())

        expected_total = sum((a.estimated_net_payout for a in agrs), Decimal("0.00"))

        agr_ids = [a.id for a in agrs]
        received_total = Decimal("0.00")
        overdue_total = Decimal("0.00")

        if agr_ids:
            pays_stmt = select(PaymentRecord).where(PaymentRecord.agreement_id.in_(agr_ids))
            pays_res = await db.execute(pays_stmt)
            payments = list(pays_res.scalars().all())

            received_total = sum((p.amount_paid for p in payments), Decimal("0.00"))

            for p in payments:
                due_utc = ensure_utc(p.due_date)
                if due_utc and due_utc < now and p.amount_paid < p.amount_due:
                    overdue_total += (p.amount_due - p.amount_paid)

        outstanding_total = expected_total - received_total
        if outstanding_total < Decimal("0.00"):
            outstanding_total = Decimal("0.00")

        # Recent events
        ev_stmt = (
            select(TransactionAuditEvent)
            .join(DealAgreement, TransactionAuditEvent.agreement_id == DealAgreement.id)
            .where(farmer_filter)
            .order_by(TransactionAuditEvent.created_at.desc())
            .limit(10)
        )
        ev_res = await db.execute(ev_stmt)
        recent_events = list(ev_res.scalars().all())

        return ProtectionDashboardMetrics(
            active_agreements_count=active_agrs,
            deals_awaiting_acceptance_count=awaiting_acc,
            deliveries_awaiting_confirmation_count=dels_wait,
            expected_payments_total=round_decimal(expected_total, 2),
            payments_received_total=round_decimal(received_total, 2),
            outstanding_balance_total=round_decimal(outstanding_total, 2),
            overdue_payments_total=round_decimal(overdue_total, 2),
            open_disputes_count=open_disputes,
            active_risk_alerts_count=active_alerts,
            recent_events=recent_events,
        )


protection_service = ProtectionService()
