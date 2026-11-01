"""
Agri2Value — Weather & Mandi API Integration Tests.

Tests:
1. GET /api/v1/weather
2. GET /api/v1/mandi/prices
3. GET /api/v1/mandi/quote
4. Decision run integration verifying provenance preservation and commodity mismatch protection.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_get_weather_api_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/weather?latitude=20.0760&longitude=74.0534")
        assert res.status_code == 200
        data = res.json()

        assert "latitude" in data
        assert "longitude" in data
        assert "current" in data
        assert "daily_forecast" in data
        assert "advisory" in data
        assert "attribution" in data
        assert "Open-Meteo" in data["attribution"]
        assert "strictly informational" in data["advisory"]["disclaimer"].lower()
        assert data["current"]["observed_at"] is not None
        assert data["retrieved_at"] is not None


@pytest.mark.asyncio
async def test_get_mandi_prices_api_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/mandi/prices?state=Maharashtra&commodity=Tomato")
        assert res.status_code == 200
        data = res.json()

        assert "records" in data
        assert data["total_records"] > 0
        record = data["records"][0]
        assert record["commodity"] == "Tomato"
        assert record["source_unit"] == "Rs/Quintal"
        assert record["unit_normalized"] is True
        assert record["normalized_unit"] == "INR/kg"
        assert float(record["normalized_modal_price_per_kg"]) > 0
        assert record["observation_date"] is not None
        assert record["retrieval_timestamp"] is not None


@pytest.mark.asyncio
async def test_get_mandi_quote_api_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/mandi/quote?crop_name=Tomato&district=Nashik")
        assert res.status_code == 200
        data = res.json()

        assert data["commodity"] == "Tomato"
        assert float(data["rate_per_kg"]) == 14.0 or float(data["rate_per_kg"]) == 14.5
        assert data["normalized_unit"] == "INR/kg"
        assert data["observation_date"] is not None
        assert data["retrieval_date"] is not None
        assert "Pimpalgaon" in data["market_name"] or "Nashik" in data["market_name"]


@pytest.mark.asyncio
async def test_mandi_quote_commodity_mismatch_returns_422():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/api/v1/mandi/quote?crop_name=NonExistentExoticCrop&district=Nashik")
        assert res.status_code == 422
        data = res.json()
        assert data["error"] == "VALIDATION_ERROR"
        assert "Commodity substitution is strictly disabled" in data["message"]
