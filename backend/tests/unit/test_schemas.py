# backend/tests/unit/test_schemas.py
"""Unit tests for unit conversion and schema validation."""
from decimal import Decimal
import pytest
from pydantic import ValidationError

from app.crop_lots.schemas import normalize_to_kg, CropLotCreate
from app.farms.schemas import FarmCreate


def test_normalize_to_kg():
    # 1 kg = 1 kg
    assert normalize_to_kg(Decimal("500"), "kg") == Decimal("500")

    # 1 quintal = 100 kg
    assert normalize_to_kg(Decimal("40"), "quintal") == Decimal("4000")

    # 1 tonne = 1000 kg
    assert normalize_to_kg(Decimal("4"), "tonne") == Decimal("4000")

    # 1 bag = 50 kg
    assert normalize_to_kg(Decimal("80"), "bag") == Decimal("4000")

    # Invalid unit raises ValueError
    with pytest.raises(ValueError):
        normalize_to_kg(Decimal("10"), "invalid_unit")


def test_crop_lot_create_validation():
    # Valid model
    lot = CropLotCreate(
        farm_id="farm-uuid-1",
        crop_name="Tomato",
        variety="Abhinav",
        quantity=Decimal("4000"),
        quantity_unit="kg",
        quality_grade="A",
        data_mode="demo",
    )
    assert lot.crop_name == "Tomato"
    assert lot.quantity == Decimal("4000")

    # Negative quantity rejected
    with pytest.raises(ValidationError):
        CropLotCreate(
            farm_id="farm-uuid-1",
            crop_name="Tomato",
            quantity=Decimal("-10"),
            quantity_unit="kg",
        )

    # Invalid unit rejected
    with pytest.raises(ValidationError):
        CropLotCreate(
            farm_id="farm-uuid-1",
            crop_name="Tomato",
            quantity=Decimal("100"),
            quantity_unit="bushel",
        )


def test_farm_create_validation():
    # Valid farm
    farm = FarmCreate(
        farm_name="Patil Krishi Farm",
        state="Maharashtra",
        district="Pune",
        village="Narayangaon",
        land_area=Decimal("3.5"),
        land_area_unit="acre",
        latitude=19.1136,
        longitude=73.9723,
    )
    assert farm.farm_name == "Patil Krishi Farm"

    # Invalid land unit rejected
    with pytest.raises(ValidationError):
        FarmCreate(
            farm_name="Invalid Farm",
            state="Maharashtra",
            district="Pune",
            village="Narayangaon",
            land_area=Decimal("5"),
            land_area_unit="lightyears",
        )
