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
    # e.g. CREATED | STATUS_CHANGED | QUANTITY_UPDATED | NOTE_ADDED
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
