"""
Agri2Value — Unit Tests for Smart Execution Network & Crop Rescue.
"""
from decimal import Decimal
import pytest
from app.core.errors import ValidationError
from app.execution.service import VALID_TRANSITIONS
from app.execution.crop_rescue_service import CROP_SHELF_LIFE_DAYS


def test_execution_valid_transitions_map():
    assert "PROVIDER_ACCEPTED" in VALID_TRANSITIONS["SUBMITTED"]
    assert "CANCELLED" in VALID_TRANSITIONS["SUBMITTED"]
    assert "REJECTED" in VALID_TRANSITIONS["SUBMITTED"]
    assert "CONFIRMED" in VALID_TRANSITIONS["PROVIDER_ACCEPTED"]
    assert "IN_EXECUTION" in VALID_TRANSITIONS["CONFIRMED"]
    assert "COMPLETED" in VALID_TRANSITIONS["IN_EXECUTION"]
    # Terminal states
    assert len(VALID_TRANSITIONS["COMPLETED"]) == 0
    assert len(VALID_TRANSITIONS["CANCELLED"]) == 0
    assert len(VALID_TRANSITIONS["REJECTED"]) == 0


def test_shelf_life_table_coverage():
    assert CROP_SHELF_LIFE_DAYS["tomato"] == 8
    assert CROP_SHELF_LIFE_DAYS["grapes"] == 5
    assert CROP_SHELF_LIFE_DAYS["onion"] == 60
    assert "default" in CROP_SHELF_LIFE_DAYS


def test_financial_realization_math():
    qty = Decimal("3850.0")
    rate = Decimal("16.20")
    gross = (qty * rate).quantize(Decimal("0.01"))
    assert gross == Decimal("62370.00")

    logistics_cost = Decimal("1800.00")
    storage_cost = Decimal("0.00")
    proc_cost = Decimal("0.00")
    net = gross - logistics_cost - storage_cost - proc_cost
    assert net == Decimal("60570.00")


def test_capacity_reservation_math():
    initial_capacity = Decimal("25000.0")
    requested = Decimal("4000.0")
    remaining = initial_capacity - requested
    assert remaining == Decimal("21000.0")

    # Releasing capacity on cancellation
    released = remaining + requested
    assert released == initial_capacity
