# backend/tests/unit/test_protection_service.py
"""
Unit tests for Phase 5: Farmer Protection & Deal Transparency.
Tests financial calculations, Decimal precision, unit normalizations, and schema constraints.
"""
from decimal import Decimal
import pytest
from pydantic import ValidationError

from app.protection.service import ProtectionService, round_decimal
from app.protection.schemas import AgreementCreate, DeliveryRecordCreate, DisputeCreate


def test_round_decimal_accuracy():
    assert round_decimal(Decimal("16.504")) == Decimal("16.50")
    assert round_decimal(Decimal("16.505")) == Decimal("16.51")
    assert round_decimal(Decimal("100.999")) == Decimal("101.00")


def test_calculate_commercial_totals_inr_per_kg():
    # 4000 kg at 16.50 INR/kg
    # Gross: 66,000.00
    # Logistics deduction: 3,500.00
    # Handling deduction: 500.00
    # Net: 62,000.00
    gross, total_ded, net_payout = ProtectionService.calculate_commercial_totals(
        agreed_quantity_kg=Decimal("4000.0000"),
        agreed_unit_price=Decimal("16.50"),
        pricing_unit="INR/kg",
        logistics_deduction=Decimal("3500.00"),
        processing_deduction=Decimal("0.00"),
        quality_deduction=Decimal("0.00"),
        other_deductions=Decimal("500.00"),
    )
    assert gross == Decimal("66000.00")
    assert total_ded == Decimal("4000.00")
    assert net_payout == Decimal("62000.00")


def test_calculate_commercial_totals_inr_per_quintal():
    # 4000 kg = 40 quintals
    # At 1650.00 INR/quintal (equivalent to 16.50/kg)
    # Gross: 40 * 1650 = 66,000.00
    gross, total_ded, net_payout = ProtectionService.calculate_commercial_totals(
        agreed_quantity_kg=Decimal("4000.0000"),
        agreed_unit_price=Decimal("1650.00"),
        pricing_unit="INR/quintal",
        logistics_deduction=Decimal("2000.00"),
    )
    assert gross == Decimal("66000.00")
    assert total_ded == Decimal("2000.00")
    assert net_payout == Decimal("64000.00")


def test_net_payout_cannot_be_negative():
    gross, total_ded, net_payout = ProtectionService.calculate_commercial_totals(
        agreed_quantity_kg=Decimal("100.0000"),
        agreed_unit_price=Decimal("10.00"),  # Gross = 1000
        pricing_unit="INR/kg",
        logistics_deduction=Decimal("1500.00"),  # Deductions exceed gross
    )
    assert gross == Decimal("1000.00")
    assert total_ded == Decimal("1500.00")
    assert net_payout == Decimal("0.00")


def test_agreement_schema_unit_validation():
    # Invalid quantity unit rejected
    with pytest.raises(ValidationError):
        AgreementCreate(
            crop_lot_id="test-lot-id",
            partner_name="Test Buyer",
            commodity="Tomato",
            agreed_quantity_kg=Decimal("1000"),
            quantity_unit="crates",  # Invalid
            agreed_unit_price=Decimal("20.00"),
            delivery_location="Nashik",
        )

    # Invalid pricing unit rejected
    with pytest.raises(ValidationError):
        AgreementCreate(
            crop_lot_id="test-lot-id",
            partner_name="Test Buyer",
            commodity="Tomato",
            agreed_quantity_kg=Decimal("1000"),
            quantity_unit="kg",
            agreed_unit_price=Decimal("20.00"),
            pricing_unit="USD/ton",  # Invalid
            delivery_location="Nashik",
        )


def test_delivery_schema_unit_validation():
    with pytest.raises(ValidationError):
        DeliveryRecordCreate(
            agreement_id="test-agr-id",
            delivered_quantity_kg=Decimal("500"),
            accepted_quantity_kg=Decimal("500"),
            quantity_unit="boxes",  # Invalid
            delivery_location="Nashik APMC",
        )


def test_dispute_category_validation():
    with pytest.raises(ValidationError):
        DisputeCreate(
            agreement_id="test-agr-id",
            category="INVALID_CATEGORY",
            title="Late payment",
            description="The buyer has not paid after 10 days.",
        )
