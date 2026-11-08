# backend/app/farms/schemas.py
"""Pydantic schemas for Farm and FarmResource endpoints."""
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


# ---- Enums / Constants ----------------------------------------

LAND_AREA_UNITS = {"acre", "acres", "hectare", "hectares", "bigha", "guntha", "sq_meter"}


# ---- FarmResource Schemas ------------------------------------

class FarmResourceCreate(BaseModel):
    resource_type: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=200)
    quantity: Optional[Decimal] = None
    unit: Optional[str] = Field(None, max_length=50)
    availability_status: str = Field("available", max_length=50)


class FarmResourceResponse(BaseModel):
    id: str
    resource_type: str
    name: str
    quantity: Optional[Decimal]
    unit: Optional[str]
    availability_status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ---- Farm Schemas --------------------------------------------

class FarmCreate(BaseModel):
    farm_name: str = Field(..., min_length=1, max_length=200, examples=["Patil Farm"])
    state: str = Field(..., min_length=1, max_length=100, examples=["Maharashtra"])
    district: str = Field(..., min_length=1, max_length=100, examples=["Nashik"])
    village: str = Field(..., min_length=1, max_length=200, examples=["Niphad"])
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    land_area: Optional[Decimal] = Field(None, gt=Decimal("0"))
    land_area_unit: str = Field("acre", max_length=20)
    boundary_geojson: Optional[str] = None
    resources: List[FarmResourceCreate] = Field(default_factory=list)

    @field_validator("land_area_unit")
    @classmethod
    def validate_unit(cls, v: str) -> str:
        val = v.lower().strip()
        if val == "acres":
            val = "acre"
        elif val == "hectares":
            val = "hectare"
        if val not in {"acre", "hectare", "bigha", "guntha", "sq_meter"}:
            raise ValueError(f"land_area_unit must be one of: {', '.join(sorted({'acre', 'hectare', 'bigha', 'guntha', 'sq_meter'}))}")
        return val


class FarmUpdate(BaseModel):
    farm_name: Optional[str] = Field(None, min_length=1, max_length=200)
    state: Optional[str] = Field(None, min_length=1, max_length=100)
    district: Optional[str] = Field(None, min_length=1, max_length=100)
    village: Optional[str] = Field(None, min_length=1, max_length=200)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    land_area: Optional[Decimal] = Field(None, gt=Decimal("0"))
    land_area_unit: Optional[str] = Field(None, max_length=20)
    boundary_geojson: Optional[str] = None
    resources: Optional[List[FarmResourceCreate]] = None

    @field_validator("land_area_unit")
    @classmethod
    def validate_unit(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in LAND_AREA_UNITS:
            raise ValueError(f"land_area_unit must be one of: {', '.join(sorted(LAND_AREA_UNITS))}")
        return v


class FarmResponse(BaseModel):
    id: str
    owner_user_id: str
    farm_name: str
    state: str
    district: str
    village: str
    latitude: Optional[float]
    longitude: Optional[float]
    land_area: Optional[Decimal]
    land_area_unit: str
    boundary_geojson: Optional[str] = None
    is_active: bool
    resources: List[FarmResourceResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FarmListResponse(BaseModel):
    farms: List[FarmResponse]
    total: int
