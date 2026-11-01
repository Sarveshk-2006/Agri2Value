"""
Agri2Value — Mandi Service Unit Tests.

Verifies:
- Fallback data is NEVER labeled as live (is_live == False).
- Observation date is separated from retrieval timestamp.
- Unit normalization ONLY occurs when source unit is verified.
- Staleness threshold (> 7 days) flags records correctly.
- Commodity mismatch is strictly rejected with ValidationError.
"""
from datetime import datetime, timedelta
from decimal import Decimal
import pytest

from app.core.errors import ValidationError
from app.mandi.service import (
    MandiService,
    check_staleness,
    normalize_record,
    parse_observation_date,
)


def test_parse_observation_date():
    d1 = parse_observation_date("2026-11-01")
    assert d1 is not None
    assert d1.year == 2026 and d1.month == 11 and d1.day == 1

    d2 = parse_observation_date("01/11/2026")
    assert d2 is not None
    assert d2.year == 2026 and d2.month == 11 and d2.day == 1

    d_bad = parse_observation_date("not-a-date")
    assert d_bad is None


def test_check_staleness():
    today_str = datetime.now().strftime("%Y-%m-%d")
    is_stale, warning = check_staleness(today_str, max_days=7)
    assert is_stale is False
    assert warning is None

    stale_date = (datetime.now() - timedelta(days=10)).strftime("%Y-%m-%d")
    is_stale, warning = check_staleness(stale_date, max_days=7)
    assert is_stale is True
    assert "10 days old" in warning


def test_unit_normalization_quintal_to_kg():
    raw = {
        "state": "Maharashtra",
        "district": "Nashik",
        "market": "Pimpalgaon",
        "commodity": "Tomato",
        "variety": "Hybrid",
        "arrival_date": "2026-11-01",
        "min_price": 1000.0,
        "max_price": 1800.0,
        "modal_price": 1400.0,
        "source_unit": "Rs/Quintal",
        "data_source": "APMC Yard Bulletin",
    }
    record = normalize_record(
        raw=raw,
        is_live=False,
        source_type="curated_mandi_bulletin",
        default_data_source="Test Source",
        retrieval_timestamp="2026-11-01T12:00:00Z",
    )

    assert record.is_live is False
    assert record.unit_normalized is True
    assert record.normalized_unit == "INR/kg"
    assert record.normalized_modal_price_per_kg == Decimal("14.00")
    assert record.observation_date == "2026-11-01"
    assert record.retrieval_timestamp == "2026-11-01T12:00:00Z"


def test_unit_normalization_unknown_unit_not_converted():
    raw = {
        "state": "Maharashtra",
        "district": "Nashik",
        "market": "Pimpalgaon",
        "commodity": "Tomato",
        "arrival_date": "2026-11-01",
        "min_price": 10.0,
        "max_price": 20.0,
        "modal_price": 15.0,
        "source_unit": "crates",  # Unknown / ambiguous unit
    }
    record = normalize_record(
        raw=raw,
        is_live=False,
        source_type="curated_mandi_bulletin",
        default_data_source="Test Source",
        retrieval_timestamp="2026-11-01T12:00:00Z",
    )

    assert record.unit_normalized is False
    assert record.normalized_unit is None
    assert record.normalized_modal_price_per_kg is None


@pytest.mark.asyncio
async def test_mandi_service_curated_fallback_never_live():
    svc = MandiService()
    # Force fallback by querying with no live key or offline state
    resp = await svc.get_mandi_prices(state="Maharashtra", commodity="Tomato")
    assert resp.is_live is False  # MUST NEVER BE LABELED LIVE
    assert len(resp.records) > 0
    for r in resp.records:
        assert r.is_live is False
        assert r.source_type == "curated_mandi_bulletin"
        assert r.observation_date is not None
        assert r.retrieval_timestamp is not None
        assert r.normalized_modal_price_per_kg is not None


@pytest.mark.asyncio
async def test_mandi_service_commodity_mismatch_rejection():
    svc = MandiService()
    # Requesting non-existent crop or mismatched crop should raise ValidationError
    with pytest.raises(ValidationError) as exc_info:
        await svc.get_verified_mandi_quote(crop_name="DragonFruit", district="Nashik")
    assert "DragonFruit" in str(exc_info.value)
    assert "Commodity substitution is strictly disabled" in str(exc_info.value)


@pytest.mark.asyncio
async def test_mandi_service_verified_quote():
    svc = MandiService()
    quote = await svc.get_verified_mandi_quote(crop_name="Tomato", district="Nashik")
    assert quote.commodity == "Tomato"
    assert quote.rate_per_kg == Decimal("14.00") or quote.rate_per_kg == Decimal("14.50")
    assert quote.normalized_unit == "INR/kg"
    assert quote.observation_date is not None
    assert quote.retrieval_date is not None
    assert quote.is_live is False  # From curated benchmark archive
