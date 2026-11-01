"""
Agri2Value — Weather & Market Prices API Integration Tests.

Tests:
1. GET /api/v1/market-prices (with filtering by commodity, district, market)
2. GET /api/v1/mandi/quote (and 422 mismatch rejection)
3. GET /api/v1/weather (coordinate-based query)
4. GET /api/v1/weather/farm/{farm_id} (farm-coordinate lookup + farmer ownership protection)
5. Decision Engine evaluation with data_source_mode ('LIVE_MANDI' vs 'PILOT_BENCHMARK')
6. Decision Engine commodity mismatch rejection
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_market_prices_api(client: AsyncClient):
    res = await client.get("/api/v1/market-prices?state=Maharashtra&commodity=Tomato")
    assert res.status_code == 200
    data = res.json()

    assert "records" in data
    assert data["total_records"] > 0
    rec = data["records"][0]
    assert rec["commodity"] == "Tomato"
    assert rec["price_unit"] == "Rs/Quintal"
    assert rec["normalized_price_per_kg"] is not None
    assert rec["observation_date"] is not None
    assert rec["retrieved_timestamp"] is not None
    assert rec["freshness_status"] in ("LIVE", "CACHED", "DEMO")


@pytest.mark.asyncio
async def test_market_prices_filtering(client: AsyncClient):
    # Filter by market Pimpalgaon
    res = await client.get("/api/v1/market-prices?state=Maharashtra&market=Pimpalgaon")
    assert res.status_code == 200
    data = res.json()
    assert len(data["records"]) >= 1
    for r in data["records"]:
        assert "pimpalgaon" in r["market_name"].lower()


@pytest.mark.asyncio
async def test_get_mandi_quote_api(client: AsyncClient):
    res = await client.get("/api/v1/mandi/quote?crop_name=Tomato&district=Nashik")
    assert res.status_code == 200
    data = res.json()

    assert data["commodity"] == "Tomato"
    assert float(data["rate_per_kg"]) in (14.0, 14.5)
    assert data["normalized_unit"] == "INR/kg"
    assert data["observation_date"] is not None
    assert data["retrieval_date"] is not None


@pytest.mark.asyncio
async def test_mandi_quote_commodity_mismatch_returns_422(client: AsyncClient):
    res = await client.get("/api/v1/mandi/quote?crop_name=NonExistentExoticCrop&district=Nashik")
    assert res.status_code == 422
    data = res.json()
    assert data["error"] == "VALIDATION_ERROR"
    assert "Commodity substitution is strictly disabled" in data["message"]


@pytest.mark.asyncio
async def test_get_weather_coordinates_api(client: AsyncClient):
    res = await client.get("/api/v1/weather?latitude=20.0760&longitude=74.0534")
    assert res.status_code == 200
    data = res.json()

    assert data["latitude"] == 20.0760
    assert data["longitude"] == 74.0534
    assert "current" in data
    assert "daily_forecast" in data
    assert "advisory" in data
    assert "Open-Meteo" in data["attribution"]


@pytest.mark.asyncio
async def test_farm_weather_ownership_and_lookup(client: AsyncClient, auth_headers: dict):
    # 1. Create a farm for authenticated user
    farm_payload = {
        "farm_name": "Weather Test Farm",
        "state": "Maharashtra",
        "district": "Nashik",
        "village": "Niphad",
        "latitude": 20.0821,
        "longitude": 74.0412,
        "land_area": "2.5",
        "land_area_unit": "acre",
    }
    create_resp = await client.post("/api/v1/farms", json=farm_payload, headers=auth_headers)
    assert create_resp.status_code == 201
    farm_id = create_resp.json()["id"]

    # 2. Get farm weather
    weather_resp = await client.get(f"/api/v1/weather/farm/{farm_id}", headers=auth_headers)
    assert weather_resp.status_code == 200
    wdata = weather_resp.json()

    assert wdata["farm_id"] == farm_id
    assert wdata["latitude"] == 20.0821
    assert wdata["longitude"] == 74.0412
    assert "weather" in wdata
    assert len(wdata["weather"]["daily_forecast"]) >= 1

    # 3. Test non-existent farm returns 404
    bad_resp = await client.get("/api/v1/weather/farm/non-existent-farm-id", headers=auth_headers)
    assert bad_resp.status_code == 404

    # 4. Test unauthorized request without auth returns 401
    unauth_resp = await client.get(f"/api/v1/weather/farm/{farm_id}")
    assert unauth_resp.status_code == 401


@pytest.mark.asyncio
async def test_decision_engine_with_live_mandi_mode(client: AsyncClient, auth_headers: dict):
    # 1. Create farm & crop lot
    farm_resp = await client.post(
        "/api/v1/farms",
        json={"farm_name": "Decision Farm", "state": "Maharashtra", "district": "Nashik", "village": "Niphad"},
        headers=auth_headers,
    )
    farm_id = farm_resp.json()["id"]

    lot_resp = await client.post(
        f"/api/v1/farms/{farm_id}/crop-lots",
        json={"farm_id": farm_id, "crop_name": "Tomato", "variety": "Abhinav", "quantity": "4000", "quantity_unit": "kg", "quality_grade": "A"},
        headers=auth_headers,
    )
    lot_id = lot_resp.json()["id"]

    # 2. Evaluate decision with LIVE_MANDI data source mode
    eval_resp = await client.post(
        "/api/v1/decision-engine/evaluate",
        json={"crop_lot_id": lot_id, "data_source_mode": "LIVE_MANDI"},
        headers=auth_headers,
    )
    assert eval_resp.status_code == 201
    eval_data = eval_resp.json()

    assert eval_data["status"] == "COMPLETED"
    assert "input_snapshot" in eval_data
    snapshot = eval_data["input_snapshot"]
    assert snapshot["data_source_mode"] == "LIVE_MANDI"
    assert snapshot["data_mode"] in ("LIVE", "CACHED")
    assert snapshot["unit_conversion"] == "1 Quintal = 100 kg"
    assert len(snapshot["assumptions"]) > 0

    # 3. Verify Mandi option has provenance recorded
    mandi_opts = [o for o in eval_data["options"] if o["route_type"] == "RAW_MANDI"]
    assert len(mandi_opts) == 1
    m_opt = mandi_opts[0]
    assert "APMC" in m_opt["data_source"] or "Market Yard" in m_opt["data_source"]


@pytest.mark.asyncio
async def test_decision_engine_commodity_mismatch_rejection(client: AsyncClient, auth_headers: dict):
    # Create farm & lot
    farm_resp = await client.post(
        "/api/v1/farms",
        json={"farm_name": "Mismatch Farm", "state": "Maharashtra", "district": "Nashik", "village": "Niphad"},
        headers=auth_headers,
    )
    farm_id = farm_resp.json()["id"]

    lot_resp = await client.post(
        f"/api/v1/farms/{farm_id}/crop-lots",
        json={"farm_id": farm_id, "crop_name": "Tomato", "quantity": "3000", "quantity_unit": "kg"},
        headers=auth_headers,
    )
    lot_id = lot_resp.json()["id"]

    # Pass mismatched mandi commodity in custom parameters
    bad_eval_resp = await client.post(
        "/api/v1/decision-engine/evaluate",
        json={
            "crop_lot_id": lot_id,
            "custom_parameters": {
                "mandi": {
                    "commodity": "Onion",  # MISMATCH with Tomato lot!
                    "rate_per_kg": 25.0,
                }
            },
        },
        headers=auth_headers,
    )
    assert bad_eval_resp.status_code == 422
    err_data = bad_eval_resp.json()
    assert "Commodity mismatch" in err_data["message"]
