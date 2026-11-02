# backend/app/protection/router.py
"""
FastAPI Router for Phase 5: Farmer Protection, Deal Transparency & Financial Trust.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database.base import get_db
from app.database.models import User, TransactionAuditEvent, DealAgreement
from app.protection.schemas import (
    DealAgreementResponse,
    AgreementCreate,
    AgreementAccept,
    AgreementAmend,
    DeliveryRecordResponse,
    DeliveryRecordCreate,
    DeliveryConfirmRequest,
    PaymentRecordResponse,
    PaymentRecordCreate,
    PaymentReconciliationSummary,
    FarmerDisputeResponse,
    DisputeCreate,
    DisputeUpdate,
    FarmerRiskAlertResponse,
    RiskAlertResolve,
    TransactionAuditEventResponse,
    ProtectionDashboardMetrics,
)
from app.protection.service import protection_service

protection_router = APIRouter(prefix="/protection", tags=["Farmer Protection & Financial Trust"])


# ==============================================================================
# Dashboard Summary
# ==============================================================================

@protection_router.get(
    "/dashboard",
    response_model=ProtectionDashboardMetrics,
    summary="Farmer Protection Dashboard Metrics",
)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Returns aggregated real-time counts, financial balances, disputes, and risk alerts."""
    return await protection_service.get_dashboard_metrics(db, user)


# ==============================================================================
# Deal Agreements
# ==============================================================================

@protection_router.get(
    "/agreements",
    response_model=List[DealAgreementResponse],
    summary="List Deal Agreements",
)
async def list_agreements(
    status: Optional[str] = Query(None, description="Filter by status (e.g. ACCEPTED, PENDING_ACCEPTANCE)"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List commercial agreements for current farmer or partner."""
    return await protection_service.list_agreements(db, user, status=status)


@protection_router.post(
    "/agreements",
    response_model=DealAgreementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Commercial Deal Agreement",
)
async def create_agreement(
    payload: AgreementCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Creates a structured digital agreement with itemized deductions and clear units."""
    return await protection_service.create_agreement(db, user, payload)


@protection_router.post(
    "/agreements/from-execution/{request_id}",
    response_model=DealAgreementResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate Agreement from Confirmed Execution Request",
)
async def create_agreement_from_execution(
    request_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Converts a confirmed execution order into a transparent commercial agreement."""
    return await protection_service.create_agreement_from_execution_request(db, user, request_id)


@protection_router.get(
    "/agreements/{agreement_id}",
    response_model=DealAgreementResponse,
    summary="Get Agreement Details & History",
)
async def get_agreement(
    agreement_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Fetch complete agreement snapshot including amendments and audit stream."""
    return await protection_service.get_agreement(db, agreement_id, user)


@protection_router.post(
    "/agreements/{agreement_id}/accept",
    response_model=DealAgreementResponse,
    summary="Accept Agreement Terms",
)
async def accept_agreement(
    agreement_id: str,
    payload: AgreementAccept,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Farmer or partner records explicit acceptance of agreement terms."""
    return await protection_service.accept_agreement(db, agreement_id, user, notes=payload.notes)


@protection_router.post(
    "/agreements/{agreement_id}/amend",
    response_model=DealAgreementResponse,
    summary="Amend Commercial Agreement Terms",
)
async def amend_agreement(
    agreement_id: str,
    payload: AgreementAmend,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Amends terms with an auditable snapshot.
    Resets status to PENDING_ACCEPTANCE requiring mutual re-acceptance.
    """
    return await protection_service.amend_agreement(db, agreement_id, user, payload)


@protection_router.get(
    "/agreements/{agreement_id}/reconciliation",
    response_model=PaymentReconciliationSummary,
    summary="Payment Reconciliation Summary for Agreement",
)
async def reconcile_agreement_payments(
    agreement_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Calculates agreed payout vs total received, outstanding balance and overdue amount."""
    return await protection_service.reconcile_payments(db, agreement_id, user)


# ==============================================================================
# Delivery Verification
# ==============================================================================

@protection_router.get(
    "/deliveries",
    response_model=List[DeliveryRecordResponse],
    summary="List Delivery Records",
)
async def list_deliveries(
    agreement_id: Optional[str] = Query(None, description="Filter by agreement ID"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List delivery verification records."""
    deliveries = await protection_service.list_deliveries(db, user, agreement_id=agreement_id)
    # Calculate remaining quantity for each delivery's agreement
    res = []
    for d in deliveries:
        agr = await protection_service.get_agreement(db, d.agreement_id, user)
        rem = await protection_service.calculate_remaining_quantity(db, agr)
        resp = DeliveryRecordResponse.model_validate(d)
        resp.remaining_quantity_kg = rem
        res.append(resp)
    return res


@protection_router.post(
    "/deliveries",
    response_model=DeliveryRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record Produce Delivery",
)
async def record_delivery(
    payload: DeliveryRecordCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Logs full or partial produce delivery with weighbridge & quality verification notes."""
    delivery = await protection_service.record_delivery(db, user, payload)
    agr = await protection_service.get_agreement(db, delivery.agreement_id, user)
    rem = await protection_service.calculate_remaining_quantity(db, agr)
    resp = DeliveryRecordResponse.model_validate(delivery)
    resp.remaining_quantity_kg = rem
    return resp


@protection_router.post(
    "/deliveries/{delivery_id}/confirm",
    response_model=DeliveryRecordResponse,
    summary="Confirm Produce Delivery",
)
async def confirm_delivery(
    delivery_id: str,
    payload: DeliveryConfirmRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Farmer or partner records formal confirmation of delivered quantity and quality."""
    delivery = await protection_service.confirm_delivery(db, delivery_id, user, notes=payload.notes)
    agr = await protection_service.get_agreement(db, delivery.agreement_id, user)
    rem = await protection_service.calculate_remaining_quantity(db, agr)
    resp = DeliveryRecordResponse.model_validate(delivery)
    resp.remaining_quantity_kg = rem
    return resp


# ==============================================================================
# Payment Tracking Ledger
# ==============================================================================

@protection_router.get(
    "/payments",
    response_model=List[PaymentRecordResponse],
    summary="List Payment Ledger Records",
)
async def list_payments(
    agreement_id: Optional[str] = Query(None, description="Filter by agreement ID"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List transparent payment tracking records."""
    return await protection_service.list_payments(db, user, agreement_id=agreement_id)


@protection_router.post(
    "/payments",
    response_model=PaymentRecordResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record Payment Transaction in Ledger",
)
async def record_payment(
    payload: PaymentRecordCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Record a simulated payment installment (advance, partial or final settlement)."""
    return await protection_service.record_payment(db, user, payload)


# ==============================================================================
# Farmer Dispute Management
# ==============================================================================

@protection_router.get(
    "/disputes",
    response_model=List[FarmerDisputeResponse],
    summary="List Disputes",
)
async def list_disputes(
    status: Optional[str] = Query(None, description="Filter by status (e.g. OPEN, RESOLVED)"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List farmer disputes with event timelines."""
    return await protection_service.list_disputes(db, user, status=status)


@protection_router.post(
    "/disputes",
    response_model=FarmerDisputeResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Raise Farmer Dispute",
)
async def create_dispute(
    payload: DisputeCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Raise formal internal dispute regarding payment, delivery, deductions or terms."""
    return await protection_service.create_dispute(db, user, payload)


@protection_router.get(
    "/disputes/{dispute_id}",
    response_model=FarmerDisputeResponse,
    summary="Get Dispute Details & Event Timeline",
)
async def get_dispute(
    dispute_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Fetch single dispute record and timeline of actions."""
    return await protection_service.get_dispute(db, dispute_id, user)


@protection_router.post(
    "/disputes/{dispute_id}/status",
    response_model=FarmerDisputeResponse,
    summary="Update Dispute Status or Add Resolution Notes",
)
async def update_dispute_status(
    dispute_id: str,
    payload: DisputeUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Transition dispute lifecycle (UNDER_REVIEW, RESOLVED, REJECTED, etc.)."""
    return await protection_service.update_dispute(db, dispute_id, user, payload)


# ==============================================================================
# Farmer Risk Alerts
# ==============================================================================

@protection_router.get(
    "/risk-alerts",
    response_model=List[FarmerRiskAlertResponse],
    summary="List Farmer Risk Alerts",
)
async def list_risk_alerts(
    resolved: Optional[bool] = Query(None, description="Filter by resolved status"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List explainable risk alerts (price reductions, overdue payments, etc.)."""
    return await protection_service.list_risk_alerts(db, user, resolved=resolved)


@protection_router.post(
    "/risk-alerts/{alert_id}/resolve",
    response_model=FarmerRiskAlertResponse,
    summary="Resolve or Dismiss Risk Alert",
)
async def resolve_risk_alert(
    alert_id: str,
    payload: RiskAlertResolve,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Farmer records action taken and marks risk alert resolved."""
    return await protection_service.resolve_risk_alert(db, alert_id, user, payload.resolution_notes)


# ==============================================================================
# Transaction Audit Trail
# ==============================================================================

@protection_router.get(
    "/audit-events",
    response_model=List[TransactionAuditEventResponse],
    summary="List Transaction Audit Events",
)
async def list_audit_events(
    agreement_id: Optional[str] = Query(None, description="Filter by agreement ID"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Fetch immutable transaction milestone audit log."""
    stmt = (
        select(TransactionAuditEvent)
        .join(DealAgreement, TransactionAuditEvent.agreement_id == DealAgreement.id)
        .order_by(TransactionAuditEvent.created_at.desc())
    )
    if user.role == "FARMER":
        stmt = stmt.where(DealAgreement.farmer_user_id == user.id)
    if agreement_id:
        stmt = stmt.where(TransactionAuditEvent.agreement_id == agreement_id)

    res = await db.execute(stmt)
    return list(res.scalars().all())
