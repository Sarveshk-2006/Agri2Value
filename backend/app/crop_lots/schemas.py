# backend/app/crop_lots/schemas.py
"""Pydantic schemas for CropLot endpoints."""
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime


# ---- Unit Conversion -----------------------------------------
# Canonical unit: kg
QUANTITY_UNIT_TO_KG = {
    "kg": Decimal("1"),
    "quintal": Decimal("100"),
    "tonne": Decimal("1000"),
    "maund": Decimal("37.3242"),  # Standard maund (Pakistan/India historical)
    "bag": Decimal("50"),         # Common 50 kg bag — user should verify
    "gram": Decimal("0.001"),
}

VALID_QUANTITY_UNITS = set(QUANTITY_UNIT_TO_KG.keys())

VALID_QUALITY_GRADES = {"A", "B", "C", "ungraded", "mixed"}

VALID_STATUSES = {
    "DRAFT", "READY_FOR_ANALYSIS", "ANALYZED", "OPTION_SELECTED",
    "REQUESTS_PENDING", "READY_TO_EXECUTE", "IN_PROGRESS", "DELIVERED",
    "PAYMENT_PENDING", "COMPLETED", "CANCELLED", "EXPIRED", "BLOCKED",
    "RESCUE_REQUIRED", "PARTIALLY_COMPLETED",
}


def normalize_to_kg(quantity: Decimal, unit: str) -> Decimal:
    """Convert a quantity in the given unit to kilograms."""
    factor = QUANTITY_UNIT_TO_KG.get(unit)
    if factor is None:
        raise ValueError(f"Unknown quantity unit: {unit}")
    return quantity * factor


# ---- CropLotEvent Schema ------------------------------------

class CropLotEventResponse(BaseModel):
    id: str
    event_type: str
    description: Optional[str]
    actor_user_id: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- CropLot Schemas ----------------------------------------

class CropLotCreate(BaseModel):
    farm_id: str = Field(..., description="UUID of the farm this lot belongs to.")
    crop_name: str = Field(..., min_length=1, max_length=100, examples=["Tomato"])
    variety: Optional[str] = Field(None, max_length=100, examples=["Desi Red"])
    quantity: Decimal = Field(..., gt=Decimal("0"), description="Must be a positive number.")
    quantity_unit: str = Field(..., description=f"One of: {', '.join(sorted(VALID_QUANTITY_UNITS))}")
    harvest_date: Optional[datetime] = None
    quality_grade: Optional[str] = Field(None, examples=["A"])
    notes: Optional[str] = Field(None, max_length=2000)
    data_mode: str = Field("real", description="'real' or 'demo'.")

    @field_validator("quantity_unit")
    @classmethod
    def validate_unit(cls, v: str) -> str:
        if v not in VALID_QUANTITY_UNITS:
            raise ValueError(
                f"quantity_unit must be one of: {', '.join(sorted(VALID_QUANTITY_UNITS))}"
            )
        return v

    @field_validator("quality_grade")
    @classmethod
    def validate_grade(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_QUALITY_GRADES:
            raise ValueError(
                f"quality_grade must be one of: {', '.join(sorted(VALID_QUALITY_GRADES))}"
            )
        return v

    @field_validator("data_mode")
    @classmethod
    def validate_data_mode(cls, v: str) -> str:
        if v not in ("real", "demo"):
            raise ValueError("data_mode must be 'real' or 'demo'")
        return v


class CropLotUpdate(BaseModel):
    crop_name: Optional[str] = Field(None, min_length=1, max_length=100)
    variety: Optional[str] = Field(None, max_length=100)
    quantity: Optional[Decimal] = Field(None, gt=Decimal("0"))
    quantity_unit: Optional[str] = None
    harvest_date: Optional[datetime] = None
    quality_grade: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=2000)

    @field_validator("quantity_unit")
    @classmethod
    def validate_unit(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_QUANTITY_UNITS:
            raise ValueError(
                f"quantity_unit must be one of: {', '.join(sorted(VALID_QUANTITY_UNITS))}"
            )
        return v

    @field_validator("quality_grade")
    @classmethod
    def validate_grade(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in VALID_QUALITY_GRADES:
            raise ValueError(
                f"quality_grade must be one of: {', '.join(sorted(VALID_QUALITY_GRADES))}"
            )
        return v


class CropLotResponse(BaseModel):
    id: str
    farm_id: str
    owner_user_id: str
    crop_name: str
    variety: Optional[str]
    quantity: Decimal
    quantity_unit: str
    quantity_kg_normalized: Decimal
    harvest_date: Optional[datetime]
    quality_grade: Optional[str]
    status: str
    data_mode: str
    notes: Optional[str]
    events: List[CropLotEventResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CropLotListResponse(BaseModel):
    crop_lots: List[CropLotResponse]
    total: int
