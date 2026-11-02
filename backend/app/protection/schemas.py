# backend/app/protection/schemas.py
"""
Pydantic Schemas for Phase 5: Farmer Protection, Deal Transparency & Financial Trust.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


# ==============================================================================
# Helper / Base
# ==============================================================================

class ProtectionBaseModel(BaseModel):
    model_config = {"from_attributes": True}


# ==============================================================================
# Deal Agreement Schemas
# ==============================================================================

class AgreementCreate(BaseModel):
    crop_lot_id: str
    execution_request_id: Optional[str] = None
    partner_type: str = Field(default="BUYER", description="BUYER | PROCESSOR | COLD_STORAGE | LOGISTICS")
    partner_id: Optional[str] = None
    partner_name: str
    partner_contact: Optional[str] = None
    commodity: str
    variety: Optional[str] = None
    quality_grade: Optional[str] = None
    agreed_quantity_kg: Decimal = Field(gt=0, description="Agreed volume in kilograms")
    quantity_unit: str = Field(default="kg")
    agreed_unit_price: Decimal = Field(gt=0, description="Price per unit in INR")
    pricing_unit: str = Field(default="INR/kg")
    logistics_deduction: Decimal = Field(default=Decimal("0.00"), ge=0)
    processing_deduction: Decimal = Field(default=Decimal("0.00"), ge=0)
    quality_deduction: Decimal = Field(default=Decimal("0.00"), ge=0)
    other_deductions: Decimal = Field(default=Decimal("0.00"), ge=0)
    quality_requirements: Optional[str] = None
    pickup_location: Optional[str] = None
    delivery_location: str
    expected_delivery_date: Optional[datetime] = None
    payment_terms_days: int = Field(default=3, ge=0)
    farmer_notes: Optional[str] = None

    @field_validator("quantity_unit")
    @classmethod
    def validate_quantity_unit(cls, v: str) -> str:
        if v.lower() not in ["kg", "kilogram", "kilograms"]:
            raise ValueError(f"Quantity unit must be 'kg'. Got '{v}'. Use normalized kg.")
        return "kg"

    @field_validator("pricing_unit")
    @classmethod
    def validate_pricing_unit(cls, v: str) -> str:
        if v.upper() not in ["INR/KG", "INR/QUINTAL"]:
            raise ValueError(f"Pricing unit must be INR/kg or INR/quintal. Got '{v}'.")
        return v


class AgreementAccept(BaseModel):
    terms_acknowledged: bool = Field(default=True, description="Farmer acknowledges agreement terms")
    notes: Optional[str] = None


class AgreementAmend(BaseModel):
    reason: str = Field(min_length=5, description="Clear business rationale for amending accepted terms")
    agreed_quantity_kg: Optional[Decimal] = Field(default=None, gt=0)
    agreed_unit_price: Optional[Decimal] = Field(default=None, gt=0)
    logistics_deduction: Optional[Decimal] = Field(default=None, ge=0)
    processing_deduction: Optional[Decimal] = Field(default=None, ge=0)
    quality_deduction: Optional[Decimal] = Field(default=None, ge=0)
    other_deductions: Optional[Decimal] = Field(default=None, ge=0)
    payment_terms_days: Optional[int] = Field(default=None, ge=0)
    delivery_location: Optional[str] = None


class AgreementAmendmentResponse(ProtectionBaseModel):
    id: str
    agreement_id: str
    version: int
    changed_by_role: str
    changed_by_name: str
    reason: str
    terms_snapshot_json: str
    created_at: datetime


class DealAgreementResponse(ProtectionBaseModel):
    id: str
    agreement_number: str
    execution_request_id: Optional[str] = None
    farmer_user_id: str
    farm_id: str
    crop_lot_id: str
    partner_type: str
    partner_id: Optional[str] = None
    partner_name: str
    partner_contact: Optional[str] = None
    commodity: str
    variety: Optional[str] = None
    quality_grade: Optional[str] = None
    agreed_quantity_kg: Decimal
    quantity_unit: str
    agreed_unit_price: Decimal
    pricing_unit: str
    gross_amount: Decimal
    logistics_deduction: Decimal
    processing_deduction: Decimal
    quality_deduction: Decimal
    other_deductions: Decimal
    total_deductions: Decimal
    estimated_net_payout: Decimal
    quality_requirements: Optional[str] = None
    pickup_location: Optional[str] = None
    delivery_location: str
    expected_delivery_date: Optional[datetime] = None
    payment_terms_days: int
    expected_payment_date: Optional[datetime] = None
    status: str
    version: int
    is_latest: bool
    farmer_accepted_at: Optional[datetime] = None
    partner_accepted_at: Optional[datetime] = None
    farmer_notes: Optional[str] = None
    terms_acknowledged: bool
    data_mode: str
    created_at: datetime
    updated_at: datetime
    amendments: List[AgreementAmendmentResponse] = []


# ==============================================================================
# Delivery Record Schemas
# ==============================================================================

class DeliveryRecordCreate(BaseModel):
    agreement_id: str
    delivered_quantity_kg: Decimal = Field(gt=0, description="Actual physical quantity delivered in kg")
    accepted_quantity_kg: Decimal = Field(ge=0, description="Quantity meeting quality specifications in kg")
    rejected_quantity_kg: Decimal = Field(default=Decimal("0.00"), ge=0, description="Quantity rejected at delivery")
    quantity_unit: str = Field(default="kg")
    delivery_location: str
    delivery_timestamp: Optional[datetime] = None
    quality_notes: Optional[str] = None
    vehicle_number: Optional[str] = None
    driver_contact: Optional[str] = None
    evidence_notes: Optional[str] = Field(
        default=None,
        description="Demo weighbridge ticket, receipt number or simulated proof description"
    )

    @field_validator("quantity_unit")
    @classmethod
    def validate_quantity_unit(cls, v: str) -> str:
        if v.lower() not in ["kg", "kilogram", "kilograms"]:
            raise ValueError(f"Delivery quantity unit must be 'kg'. Got '{v}'.")
        return "kg"


class DeliveryConfirmRequest(BaseModel):
    confirmed: bool = Field(default=True)
    notes: Optional[str] = None


class DeliveryRecordResponse(ProtectionBaseModel):
    id: str
    delivery_number: str
    agreement_id: str
    execution_request_id: Optional[str] = None
    expected_quantity_kg: Decimal
    delivered_quantity_kg: Decimal
    accepted_quantity_kg: Decimal
    rejected_quantity_kg: Decimal
    quantity_unit: str
    delivery_timestamp: datetime
    delivery_location: str
    farmer_confirmed: bool
    farmer_confirmed_at: Optional[datetime] = None
    partner_confirmed: bool
    partner_confirmed_at: Optional[datetime] = None
    quality_notes: Optional[str] = None
    vehicle_number: Optional[str] = None
    driver_contact: Optional[str] = None
    evidence_notes: Optional[str] = None
    evidence_data_mode: str
    status: str
    created_at: datetime
    updated_at: datetime
    remaining_quantity_kg: Optional[Decimal] = None


# ==============================================================================
# Payment Record Schemas
# ==============================================================================

class PaymentRecordCreate(BaseModel):
    agreement_id: str
    amount_due: Decimal = Field(gt=0, description="Expected payment installment amount in INR")
    amount_paid: Decimal = Field(ge=0, description="Amount actually transferred in INR")
    payment_date: Optional[datetime] = None
    due_date: datetime = Field(description="Contractual payment due date")
    payment_method: str = Field(default="BANK_TRANSFER")
    payer_name: str
    payee_name: str
    transaction_reference_id: Optional[str] = Field(
        default=None,
        description="Simulated UTR, UPI transaction ID or bank reference"
    )
    notes: Optional[str] = None


class PaymentRecordResponse(ProtectionBaseModel):
    id: str
    payment_reference: str
    agreement_id: str
    execution_request_id: Optional[str] = None
    amount_due: Decimal
    amount_paid: Decimal
    payment_date: Optional[datetime] = None
    due_date: datetime
    payment_method: str
    payment_status: str
    payer_name: str
    payee_name: str
    transaction_reference_id: Optional[str] = None
    notes: Optional[str] = None
    data_mode: str
    created_at: datetime
    updated_at: datetime


class PaymentReconciliationSummary(BaseModel):
    agreement_id: str
    agreement_number: str
    gross_agreed_amount: Decimal
    total_deductions: Decimal
    net_agreed_payout: Decimal
    total_paid: Decimal
    outstanding_balance: Decimal
    is_fully_paid: bool
    is_overdue: bool
    overdue_amount: Decimal
    payments_count: int
    data_mode_label: str = "SIMULATED_LEDGER_DEMO"


# ==============================================================================
# Dispute Schemas
# ==============================================================================

class DisputeCreate(BaseModel):
    agreement_id: str
    delivery_record_id: Optional[str] = None
    payment_record_id: Optional[str] = None
    category: str = Field(
        description="PAYMENT_OVERDUE | PAYMENT_AMOUNT_MISMATCH | UNEXPECTED_DEDUCTION | "
                    "QUANTITY_MISMATCH | QUALITY_DISAGREEMENT | CHANGED_DEAL_TERMS | "
                    "DELIVERY_DISAGREEMENT | OTHER"
    )
    title: str = Field(min_length=5, max_length=255)
    description: str = Field(min_length=10)
    disputed_amount: Optional[Decimal] = Field(default=None, ge=0)
    evidence_notes: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        valid = [
            "PAYMENT_OVERDUE",
            "PAYMENT_AMOUNT_MISMATCH",
            "UNEXPECTED_DEDUCTION",
            "QUANTITY_MISMATCH",
            "QUALITY_DISAGREEMENT",
            "CHANGED_DEAL_TERMS",
            "DELIVERY_DISAGREEMENT",
            "OTHER",
        ]
        if v.upper() not in valid:
            raise ValueError(f"Invalid dispute category '{v}'. Allowed: {', '.join(valid)}")
        return v.upper()


class DisputeUpdate(BaseModel):
    status: str = Field(
        description="OPEN | UNDER_REVIEW | AWAITING_INFORMATION | RESOLVED | REJECTED | CLOSED"
    )
    notes: str = Field(min_length=3, description="Comment or explanation of the status transition")
    resolution_notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        valid = ["OPEN", "UNDER_REVIEW", "AWAITING_INFORMATION", "RESOLVED", "REJECTED", "CLOSED"]
        if v.upper() not in valid:
            raise ValueError(f"Invalid dispute status '{v}'. Allowed: {', '.join(valid)}")
        return v.upper()


class DisputeEventResponse(ProtectionBaseModel):
    id: str
    dispute_id: str
    actor_role: str
    actor_name: str
    action: str
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    notes: str
    created_at: datetime


class FarmerDisputeResponse(ProtectionBaseModel):
    id: str
    dispute_reference: str
    agreement_id: str
    farmer_user_id: str
    delivery_record_id: Optional[str] = None
    payment_record_id: Optional[str] = None
    category: str
    title: str
    description: str
    disputed_amount: Optional[Decimal] = None
    evidence_notes: Optional[str] = None
    evidence_data_mode: str
    status: str
    resolution_notes: Optional[str] = None
    resolved_by: Optional[str] = None
    disclaimer: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    updated_at: datetime
    events: List[DisputeEventResponse] = []


# ==============================================================================
# Risk Alert Schemas
# ==============================================================================

class FarmerRiskAlertResponse(ProtectionBaseModel):
    id: str
    farmer_user_id: str
    agreement_id: Optional[str] = None
    risk_type: str
    severity: str
    trigger_evidence: str
    explanation: str
    recommended_action: str
    is_resolved: bool
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime


class RiskAlertResolve(BaseModel):
    resolution_notes: str = Field(min_length=5, description="Action taken to address or dismiss this risk alert")


# ==============================================================================
# Transaction Audit Trail Schemas
# ==============================================================================

class TransactionAuditEventResponse(ProtectionBaseModel):
    id: str
    agreement_id: str
    event_type: str
    actor_role: str
    actor_name: str
    summary: str
    details_json: Optional[str] = None
    created_at: datetime


# ==============================================================================
# Farmer Protection Dashboard Metrics
# ==============================================================================

class ProtectionDashboardMetrics(BaseModel):
    active_agreements_count: int
    deals_awaiting_acceptance_count: int
    deliveries_awaiting_confirmation_count: int
    expected_payments_total: Decimal
    payments_received_total: Decimal
    outstanding_balance_total: Decimal
    overdue_payments_total: Decimal
    open_disputes_count: int
    active_risk_alerts_count: int
    recent_events: List[TransactionAuditEventResponse] = []
    disclaimer: str = (
        "Agri2Value Financial Trust is a transparent commercial tracking platform. "
        "No escrow, banking, money transfer or legal arbitration services are provided."
    )
