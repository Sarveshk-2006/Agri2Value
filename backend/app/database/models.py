# backend/app/database/models.py
"""
SQLAlchemy ORM models for Phase 1.

Models: User, Farm, FarmResource, CropLot, CropLotEvent.

Rules (enforced here):
- UUID primary keys
- Timezone-aware timestamps (UTC stored, displayed in local TZ by frontend)
- Decimal for financial/quantity values
- Explicit unit columns for every quantity
- Foreign keys with cascade rules
- Indexes on frequently filtered columns
"""
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ---- User -------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    role: Mapped[str] = mapped_column(
        String(50), nullable=False, default="FARMER"
    )
    # Roles: FARMER | BUYER | PROCESSOR | TRANSPORTER | RESOURCE_PROVIDER | FPO_MANAGER | ADMIN
    preferred_language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    # Relationships
    farms: Mapped[List["Farm"]] = relationship("Farm", back_populates="owner", lazy="select")
    crop_lots: Mapped[List["CropLot"]] = relationship("CropLot", back_populates="owner", lazy="select")
    devices: Mapped[List["IoTDevice"]] = relationship("IoTDevice", back_populates="farmer", lazy="select")

    def __repr__(self) -> str:
        return f"<User id={self.id} phone={self.phone} role={self.role}>"


# ---- Farm -------------------------------------------------------

class Farm(Base):
    __tablename__ = "farms"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    owner_user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    farm_name: Mapped[str] = mapped_column(String(200), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[str] = mapped_column(String(100), nullable=False)
    village: Mapped[str] = mapped_column(String(200), nullable=False)

    # Location — nullable; collected only with GPS consent
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 7), nullable=True)

    # Land area — use Decimal to preserve precision
    land_area: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 4), nullable=True)
    land_area_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="acre")
    # Supported units: acre | hectare | bigha | guntha | sq_meter

    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    # Relationships
    owner: Mapped["User"] = relationship("User", back_populates="farms")
    resources: Mapped[List["FarmResource"]] = relationship("FarmResource", back_populates="farm", lazy="selectin")
    crop_lots: Mapped[List["CropLot"]] = relationship("CropLot", back_populates="farm", lazy="select")
    devices: Mapped[List["IoTDevice"]] = relationship("IoTDevice", back_populates="farm", lazy="select")

    __table_args__ = (
        Index("ix_farms_owner_district", "owner_user_id", "district"),
    )

    def __repr__(self) -> str:
        return f"<Farm id={self.id} name={self.farm_name}>"


# ---- FarmResource -----------------------------------------------

class FarmResource(Base):
    __tablename__ = "farm_resources"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    farm_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    # e.g. storage | equipment | labour | vehicle | processing_access
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    quantity: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 4), nullable=True)
    unit: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    availability_status: Mapped[str] = mapped_column(String(50), nullable=False, default="available")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )

    # Relationship
    farm: Mapped["Farm"] = relationship("Farm", back_populates="resources")

    def __repr__(self) -> str:
        return f"<FarmResource id={self.id} type={self.resource_type} name={self.name}>"


# ---- CropLot ----------------------------------------------------

class CropLot(Base):
    __tablename__ = "crop_lots"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    farm_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("farms.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    owner_user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    crop_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    variety: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Quantity — always stored with explicit unit and normalized kg value
    quantity: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    quantity_unit: Mapped[str] = mapped_column(String(20), nullable=False)
    # Supported units: kg | quintal | tonne | maund | bag
    quantity_kg_normalized: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    # Always stored as kg equivalent for calculations

    harvest_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    quality_grade: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    # e.g. A | B | C | ungraded

    status: Mapped[str] = mapped_column(String(50), nullable=False, default="DRAFT")
    # State machine: DRAFT → READY_FOR_ANALYSIS → ANALYZED → OPTION_SELECTED →
    # REQUESTS_PENDING → READY_TO_EXECUTE → IN_PROGRESS → DELIVERED →
    # PAYMENT_PENDING → COMPLETED | CANCELLED | EXPIRED | BLOCKED | RESCUE_REQUIRED

    data_mode: Mapped[str] = mapped_column(String(20), nullable=False, default="real")
    # real | demo

    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="crop_lots")
    owner: Mapped["User"] = relationship("User", back_populates="crop_lots")
    events: Mapped[List["CropLotEvent"]] = relationship(
        "CropLotEvent", back_populates="crop_lot", order_by="CropLotEvent.created_at", lazy="selectin"
    )
    decision_runs: Mapped[List["DecisionRun"]] = relationship(
        "DecisionRun", back_populates="crop_lot", order_by="DecisionRun.created_at.desc()", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_crop_lots_owner_status", "owner_user_id", "status"),
        Index("ix_crop_lots_farm_crop", "farm_id", "crop_name"),
    )

    def __repr__(self) -> str:
        return f"<CropLot id={self.id} crop={self.crop_name} qty={self.quantity}{self.quantity_unit}>"


# ---- CropLotEvent -----------------------------------------------

class CropLotEvent(Base):
    """
    Immutable event log for a crop lot's lifecycle.
    Events are never deleted or updated.
    """
    __tablename__ = "crop_lot_events"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    crop_lot_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("crop_lots.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    # e.g. CREATED | STATUS_CHANGED | QUANTITY_UPDATED | NOTE_ADDED | DECISION_EVALUATED
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    actor_user_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )

    # Relationship
    crop_lot: Mapped["CropLot"] = relationship("CropLot", back_populates="events")

    def __repr__(self) -> str:
        return f"<CropLotEvent id={self.id} type={self.event_type}>"


# ---- DecisionRun ------------------------------------------------

class DecisionRun(Base):
    """
    Immutable evaluation run produced by the Profit Decision Engine.
    Stores the exact parameters and inputs used for auditing.
    """
    __tablename__ = "decision_runs"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    crop_lot_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("crop_lots.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    owner_user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    algorithm_version: Mapped[str] = mapped_column(
        String(50), nullable=False, default="v2.0-deterministic"
    )
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="COMPLETED"
    )
    # Status: COMPLETED | NEEDS_MORE_DATA | FAILED

    recommended_option_id: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )
    recommended_route_type: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )
    recommended_net_profit: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(14, 2), nullable=True
    )
    baseline_net_profit: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(14, 2), nullable=True
    )
    additional_profit_vs_baseline: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(14, 2), nullable=True
    )

    # Input and context snapshot stored as JSON text for reproducible audit
    input_snapshot: Mapped[str] = mapped_column(Text, nullable=False)
    disclaimer: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="Illustrative sample values used for demonstration. Not live market guarantees."
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )

    # Relationships
    crop_lot: Mapped["CropLot"] = relationship("CropLot", back_populates="decision_runs")
    owner: Mapped["User"] = relationship("User")
    options: Mapped[List["DecisionOption"]] = relationship(
        "DecisionOption",
        back_populates="decision_run",
        cascade="all, delete-orphan",
        order_by="DecisionOption.rank",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_decision_runs_owner_lot", "owner_user_id", "crop_lot_id"),
    )

    def __repr__(self) -> str:
        return f"<DecisionRun id={self.id} lot={self.crop_lot_id} recommended={self.recommended_route_type}>"


# ---- DecisionOption ---------------------------------------------

class DecisionOption(Base):
    """
    Evaluated pathway result within a DecisionRun.
    Contains both financial breakdown and feasibility gating status.
    """
    __tablename__ = "decision_options"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    decision_run_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("decision_runs.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    route_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # RAW_MANDI | DIRECT_BUYER | PROCESSING | STORAGE | GROUP_SELLING
    route_name: Mapped[str] = mapped_column(String(200), nullable=False)

    feasibility_status: Mapped[str] = mapped_column(String(50), nullable=False)
    # FEASIBLE | CONDITIONALLY_FEASIBLE | INFEASIBLE | NEEDS_MORE_DATA

    rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_recommended: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    saleable_quantity: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    saleable_quantity_unit: Mapped[str] = mapped_column(String(20), nullable=False)

    gross_revenue: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    total_costs: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    net_profit: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    net_profit_per_kg: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    effective_realization_per_kg: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    additional_profit_vs_baseline: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, default=Decimal("0.00")
    )
    time_to_payment_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Detailed serialized structures
    cost_breakdown: Mapped[str] = mapped_column(Text, nullable=False)
    feasibility_reasons: Mapped[str] = mapped_column(Text, nullable=False)
    risks_and_confidence: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)

    data_source: Mapped[str] = mapped_column(String(200), nullable=False)
    data_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )

    # Relationship
    decision_run: Mapped["DecisionRun"] = relationship("DecisionRun", back_populates="options")

    def __repr__(self) -> str:
        return f"<DecisionOption id={self.id} route={self.route_type} net={self.net_profit}>"


# =================================================================
# PHASE 3: SMART EXECUTION NETWORK MODELS
# =================================================================

# ---- Buyer & Buyer Offers ---------------------------------------

class Buyer(Base):
    """
    Commercial produce buyer or wholesale procurement aggregator.
    Profiles are clearly demarcated as demo or genuine verification.
    """
    __tablename__ = "buyers"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    company_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    contact_person: Mapped[str] = mapped_column(String(200), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    state: Mapped[str] = mapped_column(String(100), nullable=False, default="Maharashtra")
    address: Mapped[str] = mapped_column(String(300), nullable=False)
    buyer_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="DIRECT_RETAIL"
    )
    # Types: DIRECT_RETAIL | WHOLESALER | EXPORTER | INSTITUTIONAL | SUPERMARKET_CHAIN
    service_radius_km: Mapped[Decimal] = mapped_column(
        Numeric(8, 2), nullable=False, default=Decimal("100.00")
    )
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    verification_badge: Mapped[str] = mapped_column(
        String(50), nullable=False, default="DEMO_SIMULATION"
    )
    # DEMO_SIMULATION | UNVERIFIED | APMC_REGISTERED | FPO_PARTNER
    rating: Mapped[Optional[Decimal]] = mapped_column(Numeric(3, 2), nullable=True)
    data_mode: Mapped[str] = mapped_column(String(20), nullable=False, default="demo")
    # demo | real

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    # Relationships
    offers: Mapped[List["BuyerOffer"]] = relationship(
        "BuyerOffer", back_populates="buyer", cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Buyer id={self.id} company={self.company_name} verified={self.is_verified}>"


class BuyerOffer(Base):
    """
    Active purchasing requirement or standing offer from a buyer.
    """
    __tablename__ = "buyer_offers"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    buyer_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("buyers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    commodity: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    variety: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    accepted_grades: Mapped[str] = mapped_column(
        String(100), nullable=False, default="A,B"
    )
    min_quantity_kg: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    max_quantity_kg: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    current_fulfilled_kg: Mapped[Decimal] = mapped_column(
        Numeric(12, 4), nullable=False, default=Decimal("0.0000")
    )
    offered_price_per_kg: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    price_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="INR/kg")
    logistics_requirement: Mapped[str] = mapped_column(
        String(50), nullable=False, default="PICKUP_AT_FARM"
    )
    # PICKUP_AT_FARM | DELIVERY_TO_BUYER | NEGOTIABLE
    payment_terms_days: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="OPEN"
    )
    # OPEN | PAUSED | EXPIRED | FULFILLED
    data_mode: Mapped[str] = mapped_column(String(20), nullable=False, default="demo")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    # Relationship
    buyer: Mapped["Buyer"] = relationship("Buyer", back_populates="offers")

    def __repr__(self) -> str:
        return f"<BuyerOffer id={self.id} commodity={self.commodity} rate={self.offered_price_per_kg}>"


# ---- Logistics Provider -----------------------------------------

class LogisticsProvider(Base):
    """
    Agricultural freight operator, tempo driver, or cold van transporter.
    """
    __tablename__ = "logistics_providers"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    provider_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    vehicle_type: Mapped[str] = mapped_column(String(100), nullable=False)
    # PICKUP_TRUCK_1T | TEMPO_3T | MEDIUM_TRUCK_7T | REEFER_VAN_4T | HEAVY_TRUCK_16T
    capacity_kg: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    current_available_capacity_kg: Mapped[Decimal] = mapped_column(
        Numeric(12, 4), nullable=False
    )
    base_district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    service_districts: Mapped[str] = mapped_column(String(300), nullable=False)
    per_km_rate_per_kg: Mapped[Decimal] = mapped_column(
        Numeric(8, 4), nullable=False, default=Decimal("0.0450")
    )
    minimum_fare: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=Decimal("800.00")
    )
    pricing_unit: Mapped[str] = mapped_column(String(50), nullable=False, default="INR/kg/km")
    is_temperature_controlled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    availability_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="AVAILABLE"
    )
    # AVAILABLE | PARTIALLY_BOOKED | UNAVAILABLE
    data_mode: Mapped[str] = mapped_column(String(20), nullable=False, default="demo")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    def __repr__(self) -> str:
        return f"<LogisticsProvider id={self.id} name={self.provider_name} type={self.vehicle_type}>"


# ---- Cold Storage Facility --------------------------------------

class ColdStorageFacility(Base):
    """
    Temperature-controlled warehouse or post-harvest cold room.
    """
    __tablename__ = "cold_storage_facilities"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    facility_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    location_district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    location_taluka: Mapped[str] = mapped_column(String(100), nullable=False)
    compatible_commodities: Mapped[str] = mapped_column(String(300), nullable=False)
    total_capacity_kg: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    available_capacity_kg: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    storage_rate_per_kg_per_month: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    pricing_unit: Mapped[str] = mapped_column(String(50), nullable=False, default="INR/kg/month")
    min_holding_days: Mapped[int] = mapped_column(Integer, nullable=False, default=7)
    max_holding_days: Mapped[int] = mapped_column(Integer, nullable=False, default=90)
    temperature_range_celsius: Mapped[str] = mapped_column(
        String(50), nullable=False, default="8°C - 12°C"
    )
    humidity_range_pct: Mapped[str] = mapped_column(
        String(50), nullable=False, default="85% - 90%"
    )
    availability_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="AVAILABLE"
    )
    # AVAILABLE | LIMITED | FULL
    data_mode: Mapped[str] = mapped_column(String(20), nullable=False, default="demo")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    def __repr__(self) -> str:
        return f"<ColdStorageFacility id={self.id} name={self.facility_name} district={self.location_district}>"


# ---- Processing Facility ----------------------------------------

class ProcessingFacility(Base):
    """
    Agro-processing unit (puree, pulp, dehydration, juice extraction).
    """
    __tablename__ = "processing_facilities"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    facility_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    facility_type: Mapped[str] = mapped_column(String(100), nullable=False)
    # TOMATO_PUREE_PULP | ONION_DEHYDRATION | SOLAR_DRYING | JUICE_CONCENTRATE
    accepted_commodities: Mapped[str] = mapped_column(String(300), nullable=False)
    accepted_grades: Mapped[str] = mapped_column(String(100), nullable=False, default="A,B,C")
    daily_capacity_kg: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    available_capacity_kg: Mapped[Decimal] = mapped_column(Numeric(12, 4), nullable=False)
    processing_charge_per_kg: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False
    )
    pricing_unit: Mapped[str] = mapped_column(String(50), nullable=False, default="INR/input_kg")
    output_recovery_ratio: Mapped[Decimal] = mapped_column(
        Numeric(6, 4), nullable=False, default=Decimal("0.2800")
    )
    output_product_name: Mapped[str] = mapped_column(String(150), nullable=False)
    location_district: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    location_taluka: Mapped[str] = mapped_column(String(100), nullable=False)
    availability_status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="OPERATIONAL"
    )
    # OPERATIONAL | LIMITED_CAPACITY | MAINTENANCE
    data_mode: Mapped[str] = mapped_column(String(20), nullable=False, default="demo")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    def __repr__(self) -> str:
        return f"<ProcessingFacility id={self.id} name={self.facility_name} type={self.facility_type}>"


# ---- Execution Request ------------------------------------------

class ExecutionRequest(Base):
    """
    Actionable execution order submitted by a farmer to a buyer or provider.
    Maintains a strict, traceable status lifecycle:
    SUBMITTED → PROVIDER_ACCEPTED → CONFIRMED → IN_EXECUTION → COMPLETED (or CANCELLED / REJECTED)
    """
    __tablename__ = "execution_requests"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    crop_lot_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("crop_lots.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    farmer_user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    decision_run_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("decision_runs.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    route_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # DIRECT_BUYER | PROCESSING | COLD_STORAGE | LOGISTICS_ONLY | RESCUE_SALE
    status: Mapped[str] = mapped_column(
        String(50), nullable=False, default="SUBMITTED"
    )
    # SUBMITTED | PROVIDER_ACCEPTED | CONFIRMED | IN_EXECUTION | COMPLETED | CANCELLED | REJECTED

    # Provider linkages (nullable depending on route_type)
    buyer_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("buyers.id", ondelete="SET NULL"),
        nullable=True,
    )
    buyer_offer_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("buyer_offers.id", ondelete="SET NULL"),
        nullable=True,
    )
    logistics_provider_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("logistics_providers.id", ondelete="SET NULL"),
        nullable=True,
    )
    cold_storage_facility_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("cold_storage_facilities.id", ondelete="SET NULL"),
        nullable=True,
    )
    processing_facility_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("processing_facilities.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Requested quantities & indicative estimates (from Decision Engine)
    requested_quantity_kg: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    indicative_unit_price: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=Decimal("0.00")
    )
    indicative_total_value: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, default=Decimal("0.00")
    )
    indicative_logistics_cost: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, default=Decimal("0.00")
    )
    indicative_storage_cost: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, default=Decimal("0.00")
    )
    indicative_processing_cost: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, default=Decimal("0.00")
    )
    indicative_net_payout: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, default=Decimal("0.00")
    )

    # Actual realization (recorded at completion — NEVER overwrites original decision run!)
    actual_quantity_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 4), nullable=True)
    actual_unit_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    actual_gross_revenue: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    actual_logistics_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    actual_storage_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    actual_processing_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    actual_net_payout: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    completion_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Schedule & logistics particulars
    pickup_location: Mapped[str] = mapped_column(String(300), nullable=False)
    delivery_location: Mapped[str] = mapped_column(String(300), nullable=False)
    scheduled_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    data_mode: Mapped[str] = mapped_column(String(20), nullable=False, default="demo")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    # Relationships
    crop_lot: Mapped["CropLot"] = relationship("CropLot")
    farmer: Mapped["User"] = relationship("User")
    decision_run: Mapped[Optional["DecisionRun"]] = relationship("DecisionRun")
    buyer: Mapped[Optional["Buyer"]] = relationship("Buyer")
    buyer_offer: Mapped[Optional["BuyerOffer"]] = relationship("BuyerOffer")
    logistics_provider: Mapped[Optional["LogisticsProvider"]] = relationship("LogisticsProvider")
    cold_storage_facility: Mapped[Optional["ColdStorageFacility"]] = relationship("ColdStorageFacility")
    processing_facility: Mapped[Optional["ProcessingFacility"]] = relationship("ProcessingFacility")
    events: Mapped[List["ExecutionRequestEvent"]] = relationship(
        "ExecutionRequestEvent",
        back_populates="request",
        cascade="all, delete-orphan",
        order_by="ExecutionRequestEvent.created_at",
        lazy="selectin",
    )

    __table_args__ = (
        Index("ix_execution_requests_farmer_status", "farmer_user_id", "status"),
        Index("ix_execution_requests_lot", "crop_lot_id"),
    )

    def __repr__(self) -> str:
        return f"<ExecutionRequest id={self.id} lot={self.crop_lot_id} route={self.route_type} status={self.status}>"


# ---- Execution Request Event ------------------------------------

class ExecutionRequestEvent(Base):
    """
    Immutable audit trail event for ExecutionRequest status changes.
    """
    __tablename__ = "execution_request_events"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    request_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("execution_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    from_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    to_status: Mapped[str] = mapped_column(String(50), nullable=False)
    actor_user_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False), nullable=True
    )
    actor_role: Mapped[str] = mapped_column(
        String(50), nullable=False, default="FARMER"
    )
    # FARMER | BUYER | LOGISTICS_PROVIDER | FACILITY_OPERATOR | SYSTEM
    message: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )

    # Relationship
    request: Mapped["ExecutionRequest"] = relationship("ExecutionRequest", back_populates="events")

    def __repr__(self) -> str:
        return f"<ExecutionRequestEvent id={self.id} {self.from_status} -> {self.to_status}>"


# ---- IoT & Edge Telematics (Phase 4A) ----------------------------

class IoTDevice(Base):
    """
    Physical or virtual ESP32 farm telematics and microclimate node.
    """
    __tablename__ = "iot_devices"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    device_code: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True, index=True
    )
    device_name: Mapped[str] = mapped_column(String(100), nullable=False)
    farm_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    farmer_user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    device_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="ESP32_AGRI_NODE"
    )
    # ESP32_AGRI_NODE | ESP32_WEATHER_STATION | VIRTUAL_SIMULATOR
    firmware_version: Mapped[str] = mapped_column(
        String(30), nullable=False, default="v1.0.0-sim"
    )
    sensor_capabilities: Mapped[str] = mapped_column(
        String(255), nullable=False, default="SOIL_MOISTURE,AIR_TEMP,HUMIDITY,RAINFALL"
    )
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="ACTIVE"
    )
    # ACTIVE | INACTIVE | REVOKED
    data_source: Mapped[str] = mapped_column(
        String(30), nullable=False, default="SIMULATED"
    )
    # SIMULATED | PHYSICAL
    api_key_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    api_key_prefix: Mapped[str] = mapped_column(String(20), nullable=False)
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    last_reading_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    # Relationships
    farm: Mapped["Farm"] = relationship("Farm", back_populates="devices")
    farmer: Mapped["User"] = relationship("User", back_populates="devices")
    readings: Mapped[List["IoTTelemetryReading"]] = relationship(
        "IoTTelemetryReading",
        back_populates="device",
        cascade="all, delete-orphan",
        lazy="select",
    )
    alerts: Mapped[List["IoTAlert"]] = relationship(
        "IoTAlert",
        back_populates="device",
        cascade="all, delete-orphan",
        lazy="select",
    )

    __table_args__ = (
        Index("ix_iot_devices_farm_status", "farm_id", "status"),
        Index("ix_iot_devices_farmer", "farmer_user_id"),
    )

    def __repr__(self) -> str:
        return f"<IoTDevice id={self.id} code={self.device_code} status={self.status}>"


class IoTTelemetryReading(Base):
    """
    Time-series sensor telemetry reading ingested from an IoT node.
    """
    __tablename__ = "iot_telemetry_readings"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    device_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("iot_devices.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    farm_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reading_id: Mapped[str] = mapped_column(
        String(64), nullable=False, index=True
    )
    # Unique event/reading ID from device for idempotency & deduplication
    sensor_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # SOIL_MOISTURE | AIR_TEMP | HUMIDITY | RAINFALL | LIGHT_INTENSITY | BATTERY_VOLTAGE
    value: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(20), nullable=False)
    # %, °C, mm, lux, V
    device_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    server_ingested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, index=True
    )
    source_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="SIMULATED"
    )
    # SIMULATED | PHYSICAL
    quality_flag: Mapped[str] = mapped_column(
        String(30), nullable=False, default="VALID"
    )
    # VALID | OUT_OF_RANGE | SUSPECT
    raw_metadata: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationship
    device: Mapped["IoTDevice"] = relationship("IoTDevice", back_populates="readings")

    __table_args__ = (
        UniqueConstraint("device_id", "reading_id", name="uq_device_reading_id"),
        Index("ix_iot_readings_device_time", "device_id", "device_timestamp"),
        Index("ix_iot_readings_farm_type_time", "farm_id", "sensor_type", "device_timestamp"),
    )

    def __repr__(self) -> str:
        return f"<IoTTelemetryReading device={self.device_id} type={self.sensor_type} val={self.value}{self.unit}>"


class IoTAlert(Base):
    """
    Environmental anomaly or telematics status advisory.
    """
    __tablename__ = "iot_alerts"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    device_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("iot_devices.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    farm_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("farms.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # LOW_SOIL_MOISTURE | HIGH_TEMPERATURE | HIGH_HUMIDITY | HEAVY_RAINFALL | DEVICE_OFFLINE | STALE_TELEMETRY
    severity: Mapped[str] = mapped_column(
        String(20), nullable=False, default="WARNING"
    )
    # INFO | WARNING | CRITICAL
    trigger_reading_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    sensor_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    trigger_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    trigger_unit: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    reading_timestamp: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    threshold_used: Mapped[str] = mapped_column(String(100), nullable=False)
    source_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="SIMULATED"
    )
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    is_resolved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, index=True
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationship
    device: Mapped["IoTDevice"] = relationship("IoTDevice", back_populates="alerts")

    __table_args__ = (
        Index("ix_iot_alerts_device_resolved", "device_id", "is_resolved"),
        Index("ix_iot_alerts_farm_created", "farm_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<IoTAlert type={self.alert_type} severity={self.severity} resolved={self.is_resolved}>"


# ---- Phase 5: Farmer Protection, Deal Transparency & Financial Trust ----

class DealAgreement(Base):
    """
    Structured, binding digital agreement record linked to an execution request
    or created directly between a farmer and a commercial partner.
    Maintains immutable accepted terms, itemized deductions, and version history.
    """
    __tablename__ = "deal_agreements"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    agreement_number: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True, index=True
    )
    execution_request_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("execution_requests.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    farmer_user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    farm_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("farms.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    crop_lot_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("crop_lots.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    # Partner details
    partner_type: Mapped[str] = mapped_column(String(30), nullable=False, default="BUYER")
    # BUYER | PROCESSOR | COLD_STORAGE | LOGISTICS
    partner_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    partner_name: Mapped[str] = mapped_column(String(200), nullable=False)
    partner_contact: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Commodity & Quantity particulars
    commodity: Mapped[str] = mapped_column(String(100), nullable=False)
    variety: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    quality_grade: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    agreed_quantity_kg: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    quantity_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="kg")

    # Commercial terms & itemized deductions
    agreed_unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    pricing_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="INR/kg")
    gross_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    logistics_deduction: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, default=Decimal("0.00")
    )
    processing_deduction: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, default=Decimal("0.00")
    )
    quality_deduction: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, default=Decimal("0.00")
    )
    other_deductions: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, default=Decimal("0.00")
    )
    total_deductions: Mapped[Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, default=Decimal("0.00")
    )
    estimated_net_payout: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)

    # Delivery & Logistics
    quality_requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pickup_location: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    delivery_location: Mapped[str] = mapped_column(String(300), nullable=False)
    expected_delivery_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Payment Terms
    payment_terms_days: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    expected_payment_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Lifecycle & Versioning
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="PENDING_ACCEPTANCE", index=True
    )
    # DRAFT | PENDING_ACCEPTANCE | ACCEPTED | IN_PROGRESS | COMPLETED | CANCELLED | DISPUTED
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_latest: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    farmer_accepted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    partner_accepted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    farmer_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    terms_acknowledged: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    data_mode: Mapped[str] = mapped_column(String(20), nullable=False, default="demo")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    # Relationships
    farmer: Mapped["User"] = relationship("User", foreign_keys=[farmer_user_id])
    farm: Mapped["Farm"] = relationship("Farm", foreign_keys=[farm_id])
    crop_lot: Mapped["CropLot"] = relationship("CropLot", foreign_keys=[crop_lot_id])
    execution_request: Mapped[Optional["ExecutionRequest"]] = relationship(
        "ExecutionRequest", foreign_keys=[execution_request_id]
    )
    amendments: Mapped[List["AgreementAmendment"]] = relationship(
        "AgreementAmendment", back_populates="agreement", cascade="all, delete-orphan", order_by="AgreementAmendment.version.desc()"
    )
    deliveries: Mapped[List["DeliveryRecord"]] = relationship(
        "DeliveryRecord", back_populates="agreement", cascade="all, delete-orphan", order_by="DeliveryRecord.created_at.desc()"
    )
    payments: Mapped[List["PaymentRecord"]] = relationship(
        "PaymentRecord", back_populates="agreement", cascade="all, delete-orphan", order_by="PaymentRecord.created_at.desc()"
    )
    disputes: Mapped[List["FarmerDispute"]] = relationship(
        "FarmerDispute", back_populates="agreement", cascade="all, delete-orphan", order_by="FarmerDispute.created_at.desc()"
    )
    risk_alerts: Mapped[List["FarmerRiskAlert"]] = relationship(
        "FarmerRiskAlert", back_populates="agreement", cascade="all, delete-orphan", order_by="FarmerRiskAlert.created_at.desc()"
    )
    audit_events: Mapped[List["TransactionAuditEvent"]] = relationship(
        "TransactionAuditEvent", back_populates="agreement", cascade="all, delete-orphan", order_by="TransactionAuditEvent.created_at.desc()"
    )

    __table_args__ = (
        Index("ix_deal_agreements_farmer_status", "farmer_user_id", "status"),
        Index("ix_deal_agreements_crop_lot", "crop_lot_id"),
    )

    def __repr__(self) -> str:
        return f"<DealAgreement {self.agreement_number} status={self.status} v{self.version}>"


class AgreementAmendment(Base):
    """
    Immutable historical audit snapshot created whenever deal terms are amended.
    Ensures changed commercial terms are never silently overwritten.
    """
    __tablename__ = "agreement_amendments"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    agreement_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("deal_agreements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    changed_by_role: Mapped[str] = mapped_column(String(30), nullable=False)
    changed_by_name: Mapped[str] = mapped_column(String(100), nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    terms_snapshot_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )

    agreement: Mapped["DealAgreement"] = relationship(
        "DealAgreement", back_populates="amendments"
    )

    def __repr__(self) -> str:
        return f"<AgreementAmendment agr={self.agreement_id} v={self.version}>"


class DeliveryRecord(Base):
    """
    Delivery verification record capturing delivered quantity, quality checks,
    partial shipments, and bilateral confirmations.
    """
    __tablename__ = "delivery_records"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    delivery_number: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True, index=True
    )
    agreement_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("deal_agreements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    execution_request_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("execution_requests.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    expected_quantity_kg: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    delivered_quantity_kg: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    accepted_quantity_kg: Mapped[Decimal] = mapped_column(Numeric(14, 4), nullable=False)
    rejected_quantity_kg: Mapped[Decimal] = mapped_column(
        Numeric(14, 4), nullable=False, default=Decimal("0.00")
    )
    quantity_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="kg")

    delivery_timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    delivery_location: Mapped[str] = mapped_column(String(300), nullable=False)

    farmer_confirmed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    farmer_confirmed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    partner_confirmed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    partner_confirmed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    quality_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    vehicle_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    driver_contact: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    evidence_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence_data_mode: Mapped[str] = mapped_column(
        String(30), nullable=False, default="SIMULATED_DEMO_PROOF"
    )

    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="PENDING", index=True
    )
    # PENDING | CONFIRMED | PARTIALLY_DELIVERED | DISPUTED

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    agreement: Mapped["DealAgreement"] = relationship(
        "DealAgreement", back_populates="deliveries"
    )

    def __repr__(self) -> str:
        return f"<DeliveryRecord {self.delivery_number} status={self.status} del={self.delivered_quantity_kg}>"


class PaymentRecord(Base):
    """
    Payment tracking ledger record. Distinguishes expected dues from actual payments,
    tracks partial receipts, outstanding balances, and overdue status.
    """
    __tablename__ = "payment_records"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    payment_reference: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True, index=True
    )
    agreement_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("deal_agreements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    execution_request_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("execution_requests.id", ondelete="SET NULL"),
        nullable=True,
    )
    amount_due: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    amount_paid: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    payment_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    due_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    payment_method: Mapped[str] = mapped_column(
        String(50), nullable=False, default="BANK_TRANSFER"
    )
    # BANK_TRANSFER | UPI | NEFT | RTGS | CASH_RECEIPT | CHEQUE

    payment_status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="PENDING", index=True
    )
    # NOT_DUE | PENDING | PARTIALLY_PAID | PAID | OVERDUE | DISPUTED

    payer_name: Mapped[str] = mapped_column(String(150), nullable=False)
    payee_name: Mapped[str] = mapped_column(String(150), nullable=False)
    transaction_reference_id: Mapped[Optional[str]] = mapped_column(
        String(100), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    data_mode: Mapped[str] = mapped_column(
        String(20), nullable=False, default="SIMULATED"
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    agreement: Mapped["DealAgreement"] = relationship(
        "DealAgreement", back_populates="payments"
    )

    def __repr__(self) -> str:
        return f"<PaymentRecord {self.payment_reference} status={self.payment_status} paid={self.amount_paid}/{self.amount_due}>"


class FarmerDispute(Base):
    """
    Formal dispute record raised by a farmer linked to a deal, delivery or payment.
    Provides an internal mediation workflow with complete audit trail.
    """
    __tablename__ = "farmer_disputes"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    dispute_reference: Mapped[str] = mapped_column(
        String(50), nullable=False, unique=True, index=True
    )
    agreement_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("deal_agreements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    farmer_user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    delivery_record_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("delivery_records.id", ondelete="SET NULL"),
        nullable=True,
    )
    payment_record_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("payment_records.id", ondelete="SET NULL"),
        nullable=True,
    )

    category: Mapped[str] = mapped_column(String(50), nullable=False)
    # PAYMENT_OVERDUE | PAYMENT_AMOUNT_MISMATCH | UNEXPECTED_DEDUCTION | QUANTITY_MISMATCH
    # QUALITY_DISAGREEMENT | CHANGED_DEAL_TERMS | DELIVERY_DISAGREEMENT | OTHER

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    disputed_amount: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(14, 2), nullable=True
    )
    evidence_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence_data_mode: Mapped[str] = mapped_column(
        String(30), nullable=False, default="DEMO_EVIDENCE"
    )

    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="OPEN", index=True
    )
    # OPEN | UNDER_REVIEW | AWAITING_INFORMATION | RESOLVED | REJECTED | CLOSED

    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_by: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    disclaimer: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="Internal platform record and workflow. Not a court, arbitration service, or legal authority.",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, index=True
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, onupdate=_now
    )

    agreement: Mapped["DealAgreement"] = relationship(
        "DealAgreement", back_populates="disputes"
    )
    events: Mapped[List["DisputeEvent"]] = relationship(
        "DisputeEvent", back_populates="dispute", cascade="all, delete-orphan", order_by="DisputeEvent.created_at.asc()"
    )

    __table_args__ = (
        Index("ix_farmer_disputes_farmer_status", "farmer_user_id", "status"),
    )

    def __repr__(self) -> str:
        return f"<FarmerDispute {self.dispute_reference} cat={self.category} status={self.status}>"


class DisputeEvent(Base):
    """
    Timeline audit event on a dispute tracking status transitions and notes.
    """
    __tablename__ = "dispute_events"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    dispute_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("farmer_disputes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    actor_role: Mapped[str] = mapped_column(String(30), nullable=False)
    # FARMER | PARTNER | PLATFORM_ADMIN
    actor_name: Mapped[str] = mapped_column(String(100), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    previous_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    new_status: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now
    )

    dispute: Mapped["FarmerDispute"] = relationship(
        "FarmerDispute", back_populates="events"
    )

    def __repr__(self) -> str:
        return f"<DisputeEvent disp={self.dispute_id} action={self.action}>"


class FarmerRiskAlert(Base):
    """
    Explainable risk indicator providing early warnings on price deviations,
    unexpected deductions, overdue payments, and delivery mismatches.
    """
    __tablename__ = "farmer_risk_alerts"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    farmer_user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    agreement_id: Mapped[Optional[str]] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("deal_agreements.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    risk_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # PRICE_CHANGED_AFTER_ACCEPTANCE | UNEXPECTED_DEDUCTION | PAYMENT_OVERDUE | DELIVERY_MISMATCH
    # UNACKNOWLEDGED_DELIVERY | MISSING_TERMS | PAYMENT_UNRECONCILED

    severity: Mapped[str] = mapped_column(
        String(20), nullable=False, default="WARNING"
    )
    # INFO | WARNING | CRITICAL

    trigger_evidence: Mapped[str] = mapped_column(Text, nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    recommended_action: Mapped[str] = mapped_column(Text, nullable=False)

    is_resolved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    resolution_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, index=True
    )

    agreement: Mapped[Optional["DealAgreement"]] = relationship(
        "DealAgreement", back_populates="risk_alerts"
    )

    __table_args__ = (
        Index("ix_farmer_risk_alerts_farmer_resolved", "farmer_user_id", "is_resolved"),
    )

    def __repr__(self) -> str:
        return f"<FarmerRiskAlert type={self.risk_type} severity={self.severity} resolved={self.is_resolved}>"


class TransactionAuditEvent(Base):
    """
    Immutable transaction event stream recording commercial milestones:
    agreement creation, acceptance, amendments, deliveries, payments, and disputes.
    """
    __tablename__ = "transaction_audit_events"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=_uuid
    )
    agreement_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("deal_agreements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # AGREEMENT_CREATED | AGREEMENT_ACCEPTED | TERMS_AMENDED | DELIVERY_LOGGED | DELIVERY_CONFIRMED
    # PAYMENT_RECORDED | PAYMENT_RECONCILED | DISPUTE_RAISED | DISPUTE_STATUS_CHANGED | RISK_ALERT_TRIGGERED

    actor_role: Mapped[str] = mapped_column(String(30), nullable=False)
    # FARMER | BUYER | PROCESSOR | TRANSPORTER | SYSTEM
    actor_name: Mapped[str] = mapped_column(String(100), nullable=False)
    summary: Mapped[str] = mapped_column(String(255), nullable=False)
    details_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=_now, index=True
    )

    agreement: Mapped["DealAgreement"] = relationship(
        "DealAgreement", back_populates="audit_events"
    )

    def __repr__(self) -> str:
        return f"<TransactionAuditEvent agr={self.agreement_id} type={self.event_type}>"



