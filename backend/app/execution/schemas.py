"""
Agri2Value — Smart Execution Network Schemas.

Pydantic schemas for Buyer Discovery, Logistics, Cold Storage, Processing,
Traceable Execution Requests, and Crop Rescue Assessment.
"""
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


# ---- Buyer Schemas ----------------------------------------------

class BuyerOfferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    buyer_id: str
    commodity: str
    variety: Optional[str] = None
    accepted_grades: str
    min_quantity_kg: Decimal
    max_quantity_kg: Decimal
    current_fulfilled_kg: Decimal
    offered_price_per_kg: Decimal
    price_unit: str = "INR/kg"
    logistics_requirement: str
    payment_terms_days: int
    valid_until: datetime
    status: str
    data_mode: str


class BuyerResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    company_name: str
    contact_person: str
    phone: str
    email: Optional[str] = None
    district: str
    state: str
    address: str
    buyer_type: str
    service_radius_km: Decimal
    is_verified: bool
    verification_badge: str
    rating: Optional[Decimal] = None
    data_mode: str
    created_at: datetime
    offers: List[BuyerOfferResponse] = Field(default_factory=list)


# ---- Logistics Provider Schemas ---------------------------------

class LogisticsProviderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    provider_name: str
    contact_phone: str
    vehicle_type: str
    capacity_kg: Decimal
    current_available_capacity_kg: Decimal
    base_district: str
    service_districts: str
    per_km_rate_per_kg: Decimal
    minimum_fare: Decimal
    pricing_unit: str = "INR/kg/km"
    is_temperature_controlled: bool
    availability_status: str
    data_mode: str
    created_at: datetime


# ---- Cold Storage Facility Schemas ------------------------------

class ColdStorageFacilityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    facility_name: str
    contact_phone: str
    location_district: str
    location_taluka: str
    compatible_commodities: str
    total_capacity_kg: Decimal
    available_capacity_kg: Decimal
    storage_rate_per_kg_per_month: Decimal
    pricing_unit: str = "INR/kg/month"
    min_holding_days: int
    max_holding_days: int
    temperature_range_celsius: str
    humidity_range_pct: str
    availability_status: str
    data_mode: str
    created_at: datetime


# ---- Processing Facility Schemas --------------------------------

class ProcessingFacilityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    facility_name: str
    contact_phone: str
    facility_type: str
    accepted_commodities: str
    accepted_grades: str
    daily_capacity_kg: Decimal
    available_capacity_kg: Decimal
    processing_charge_per_kg: Decimal
    pricing_unit: str = "INR/input_kg"
    output_recovery_ratio: Decimal
    output_product_name: str
    location_district: str
    location_taluka: str
    availability_status: str
    data_mode: str
    created_at: datetime


# ---- Execution Request Schemas ----------------------------------

class ExecutionRequestCreate(BaseModel):
    crop_lot_id: str
    route_type: str = Field(
        ...,
        description="'DIRECT_BUYER' | 'PROCESSING' | 'COLD_STORAGE' | 'LOGISTICS_ONLY' | 'RESCUE_SALE'",
    )
    requested_quantity_kg: Decimal = Field(..., gt=Decimal("0"))
    decision_run_id: Optional[str] = None
    buyer_id: Optional[str] = None
    buyer_offer_id: Optional[str] = None
    logistics_provider_id: Optional[str] = None
    cold_storage_facility_id: Optional[str] = None
    processing_facility_id: Optional[str] = None
    pickup_location: Optional[str] = None
    delivery_location: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    notes: Optional[str] = None


class ExecutionRequestEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    request_id: str
    from_status: Optional[str] = None
    to_status: str
    actor_user_id: Optional[str] = None
    actor_role: str
    message: str
    metadata_json: Optional[str] = None
    created_at: datetime


class ExecutionRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    crop_lot_id: str
    farmer_user_id: str
    decision_run_id: Optional[str] = None
    route_type: str
    status: str
    buyer_id: Optional[str] = None
    buyer_offer_id: Optional[str] = None
    logistics_provider_id: Optional[str] = None
    cold_storage_facility_id: Optional[str] = None
    processing_facility_id: Optional[str] = None
    requested_quantity_kg: Decimal
    indicative_unit_price: Decimal
    indicative_total_value: Decimal
    indicative_logistics_cost: Decimal
    indicative_storage_cost: Decimal
    indicative_processing_cost: Decimal
    indicative_net_payout: Decimal
    actual_quantity_kg: Optional[Decimal] = None
    actual_unit_price: Optional[Decimal] = None
    actual_gross_revenue: Optional[Decimal] = None
    actual_logistics_cost: Optional[Decimal] = None
    actual_storage_cost: Optional[Decimal] = None
    actual_processing_cost: Optional[Decimal] = None
    actual_net_payout: Optional[Decimal] = None
    completion_notes: Optional[str] = None
    completed_at: Optional[datetime] = None
    pickup_location: str
    delivery_location: str
    scheduled_date: Optional[datetime] = None
    notes: Optional[str] = None
    data_mode: str
    created_at: datetime
    updated_at: datetime
    events: List[ExecutionRequestEventResponse] = Field(default_factory=list)


class ExecutionStatusTransitionRequest(BaseModel):
    to_status: str = Field(
        ...,
        description="'PROVIDER_ACCEPTED' | 'CONFIRMED' | 'IN_EXECUTION' | 'COMPLETED' | 'CANCELLED' | 'REJECTED'",
    )
    message: str = Field(..., min_length=2)
    metadata: Optional[Dict[str, Any]] = None


class ExecutionRequestCompleteRequest(BaseModel):
    actual_quantity_kg: Decimal = Field(..., gt=Decimal("0"))
    actual_unit_price: Decimal = Field(..., ge=Decimal("0"))
    actual_logistics_cost: Optional[Decimal] = Field(default=Decimal("0.00"))
    actual_storage_cost: Optional[Decimal] = Field(default=Decimal("0.00"))
    actual_processing_cost: Optional[Decimal] = Field(default=Decimal("0.00"))
    completion_notes: Optional[str] = None


# ---- Crop Rescue Schemas ----------------------------------------

class RescuePathwayOption(BaseModel):
    route_type: str
    title: str
    channel_name: str
    estimated_net_payout: Decimal
    salvaged_value_pct: Decimal
    time_to_safety_hours: int
    capacity_status: str
    risk_level: str
    action_button_label: str
    target_entity_id: Optional[str] = None


class CropRescueAssessment(BaseModel):
    crop_lot_id: str
    crop_name: str
    variety: Optional[str] = None
    quantity_kg: Decimal
    quality_grade: Optional[str] = None
    urgency_level: str  # CRITICAL | HIGH | MODERATE | LOW
    urgency_score: int  # 0 to 100
    risk_reasons: List[str]
    weather_alert: Optional[str] = None
    mandi_price_signal: Optional[str] = None
    salvage_pathways: List[RescuePathwayOption]
    recommended_action: str
    missing_data_warnings: List[str] = Field(default_factory=list)
    disclaimer: str = (
        "Crop Rescue Mode provides advisory decision pathways based on estimated perishability "
        "and available network capacity. It does not constitute a guaranteed commercial transaction."
    )
