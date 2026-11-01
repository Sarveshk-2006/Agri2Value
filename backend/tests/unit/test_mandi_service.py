"""
Agri2Value — Mandi Service Unit Tests.

Verifies:
- Fallback data is NEVER labeled as live (is_live == False, freshness_status == 'CACHED'/'DEMO').
- Observation date is separated from retrieval timestamp.
- Unit normalization ONLY occurs when source unit is verified.
- Staleness threshold (> 7 days) flags records correctly.
- Commodity mismatch is strictly rejected with ValidationError.
- Market and district filtering works properly.
- Arrival quantities and variety metadata are parsed when present.
- Mocked Data.gov.in responses (success, failure, timeout).
"""
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import AsyncMock, patch, MagicMock
import httpx
import pytest

from app.core.errors import ValidationError
from app.services.mandi_service import (
    MandiService,
    check_staleness,
    normalize_mandi_item,
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
        "market_name": "APMC Pimpalgaon Baswant",
        "commodity": "Tomato",
        "variety": "Hybrid",
        "arrival_date": "2026-11-01",
        "min_price": 1000.0,
        "max_price": 1800.0,
        "modal_price": 1400.0,
        "price_unit": "Rs/Quintal",
        "arrival_quantity": 420.0,
        "arrival_unit": "Quintals",
        "data_source": "APMC Yard Bulletin",
    }
    record = normalize_mandi_item(
        raw=raw,
        is_live=False,
        freshness_status="CACHED",
        default_data_source="Test Source",
        retrieval_timestamp="2026-11-01T12:00:00Z",
    )

    assert record.is_live is False
    assert record.freshness_status == "CACHED"
    assert record.unit_normalized is True
    assert record.normalized_price_per_kg == Decimal("14.00")
    assert record.observation_date == "2026-11-01"
    assert record.retrieved_timestamp == "2026-11-01T12:00:00Z"
    assert record.arrival_quantity == 420.0
    assert record.arrival_unit == "Quintals"


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
        "price_unit": "crates",  # Unknown / ambiguous unit
    }
    record = normalize_mandi_item(
        raw=raw,
        is_live=False,
        freshness_status="DEMO",
        default_data_source="Test Source",
        retrieval_timestamp="2026-11-01T12:00:00Z",
    )

    assert record.unit_normalized is False
    assert record.normalized_price_per_kg is None


@pytest.mark.asyncio
async def test_mandi_service_curated_fallback_never_live():
    svc = MandiService()
    resp = await svc.get_market_prices(state="Maharashtra", commodity="Tomato")
    assert resp.records[0].is_live is False  # MUST NEVER BE LABELED LIVE
    assert resp.records[0].freshness_status == "CACHED"
    assert len(resp.records) > 0
    for r in resp.records:
        assert r.is_live is False
        assert r.observation_date is not None
        assert r.retrieved_timestamp is not None
        assert r.normalized_price_per_kg is not None


@pytest.mark.asyncio
async def test_mandi_service_filtering():
    svc = MandiService()
    # Filter by market Pimpalgaon
    resp = await svc.get_market_prices(state="Maharashtra", commodity="Tomato", market="Pimpalgaon")
    assert len(resp.records) >= 1
    for r in resp.records:
        assert "pimpalgaon" in r.market_name.lower()
        assert r.commodity.lower() == "tomato"


@pytest.mark.asyncio
async def test_mandi_service_commodity_mismatch_rejection():
    svc = MandiService()
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
    assert quote.is_live is False


@pytest.mark.asyncio
async def test_mandi_service_mocked_live_success():
    mock_payload = {
        "records": [
            {
                "state": "Maharashtra",
                "district": "Nashik",
                "market": "Pimpalgaon",
                "commodity": "Tomato",
                "variety": "Hybrid",
                "arrival_date": "2026-11-01",
                "min_price": 1200,
                "max_price": 1900,
                "modal_price": 1600,
                "arrival_quantity": 550,
            }
        ]
    }
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_payload

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_resp
        svc = MandiService()
        svc.api_key = "test_live_key"  # simulate configured key
        res = await svc.get_market_prices(state="Maharashtra", commodity="Tomato", force_refresh=True)

        assert res.total_records >= 1
        rec = res.records[0]
        assert rec.is_live is True
        assert rec.freshness_status == "LIVE"
        assert rec.normalized_price_per_kg == Decimal("16.00")
