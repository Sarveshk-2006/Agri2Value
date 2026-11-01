"""
Integration tests for Profit Decision Engine API endpoints.

Tests:
- POST /api/v1/decision-engine/evaluate
- GET /api/v1/decision-engine/decisions/{decision_id}
- GET /api/v1/decision-engine/lots/{lot_id}/decisions
- Farmer ownership isolation (Farmer B cannot evaluate or access Farmer A's data).
- Scenario preset evaluations via API.
- Crop lot status transition to ANALYZED and event logging.
"""
from decimal import Decimal
import pytest
from httpx import AsyncClient


async def _create_test_lot(client: AsyncClient, headers: dict) -> str:
    """Helper to create a Farm and CropLot for testing."""
    farm_resp = await client.post(
        "/api/v1/farms",
        json={
            "farm_name": "Patil Krishi Farm",
            "state": "Maharashtra",
            "district": "Nashik",
            "village": "Niphad",
        },
        headers=headers,
    )
    assert farm_resp.status_code == 201
    farm_id = farm_resp.json()["id"]

    lot_resp = await client.post(
        f"/api/v1/farms/{farm_id}/crop-lots",
        json={
            "farm_id": farm_id,
            "crop_name": "Tomato",
            "variety": "Abhinav",
            "quantity": "4000",
            "quantity_unit": "kg",
            "quality_grade": "A",
            "data_mode": "demo",
        },
        headers=headers,
    )
    assert lot_resp.status_code == 201
    return lot_resp.json()["id"]


@pytest.mark.asyncio
async def test_evaluate_decision_success(client: AsyncClient, auth_headers: dict):
    """Test standard evaluation run for a 4,000 kg tomato lot."""
    lot_id = await _create_test_lot(client, auth_headers)

    eval_resp = await client.post(
        "/api/v1/decision-engine/evaluate",
        json={"crop_lot_id": lot_id},
        headers=auth_headers,
    )
    assert eval_resp.status_code == 201
    data = eval_resp.json()

    assert data["crop_lot_id"] == lot_id
    assert data["status"] == "COMPLETED"
    assert data["recommended_route_type"] == "DIRECT_BUYER"
    assert Decimal(str(data["recommended_net_profit"])) > Decimal("0")
    assert Decimal(str(data["additional_profit_vs_baseline"])) > Decimal("0")
    assert len(data["options"]) == 5

    # Check that winning option has rank 1 and is_recommended True
    winner = next(opt for opt in data["options"] if opt["is_recommended"])
    assert winner["rank"] == 1
    assert winner["route_type"] == "DIRECT_BUYER"
    assert winner["feasibility_status"] == "FEASIBLE"
    assert "cost_breakdown" in winner
    assert "explanation" in winner

    # Verify CropLot status updated to ANALYZED
    lot_check = await client.get(f"/api/v1/crop-lots/{lot_id}", headers=auth_headers)
    assert lot_check.status_code == 200
    assert lot_check.json()["status"] == "ANALYZED"


@pytest.mark.asyncio
async def test_retrieve_decision_snapshot(client: AsyncClient, auth_headers: dict):
    """Test retrieving previously generated decision run snapshot."""
    lot_id = await _create_test_lot(client, auth_headers)

    eval_resp = await client.post(
        "/api/v1/decision-engine/evaluate",
        json={"crop_lot_id": lot_id},
        headers=auth_headers,
    )
    assert eval_resp.status_code == 201
    decision_id = eval_resp.json()["id"]

    get_resp = await client.get(
        f"/api/v1/decision-engine/decisions/{decision_id}",
        headers=auth_headers,
    )
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["id"] == decision_id
    assert data["crop_lot_id"] == lot_id
    assert len(data["options"]) == 5


@pytest.mark.asyncio
async def test_get_lot_decision_history(client: AsyncClient, auth_headers: dict):
    """Test listing chronological decision runs for a crop lot."""
    lot_id = await _create_test_lot(client, auth_headers)

    # Run two evaluations
    await client.post(
        "/api/v1/decision-engine/evaluate",
        json={"crop_lot_id": lot_id},
        headers=auth_headers,
    )
    await client.post(
        "/api/v1/decision-engine/evaluate",
        json={"crop_lot_id": lot_id, "scenario_preset": "MANDI_WINS"},
        headers=auth_headers,
    )

    history_resp = await client.get(
        f"/api/v1/decision-engine/lots/{lot_id}/decisions",
        headers=auth_headers,
    )
    assert history_resp.status_code == 200
    runs = history_resp.json()
    assert len(runs) == 2


@pytest.mark.asyncio
async def test_farmer_ownership_isolation(client: AsyncClient, auth_headers: dict):
    """Verify that Farmer B cannot evaluate or access Farmer A's decision runs."""
    lot_id = await _create_test_lot(client, auth_headers)

    eval_resp = await client.post(
        "/api/v1/decision-engine/evaluate",
        json={"crop_lot_id": lot_id},
        headers=auth_headers,
    )
    decision_id = eval_resp.json()["id"]

    # Log in as Farmer B (different phone number)
    login_b = await client.post(
        "/api/v1/auth/demo-login",
        json={"phone": "9123456789", "demo_code": "123456", "full_name": "Suresh Shinde"},
    )
    assert login_b.status_code == 200
    headers_b = {"Authorization": f"Bearer {login_b.json()['access_token']}"}

    # 1. Farmer B attempts to evaluate Farmer A's lot -> 403 Forbidden
    eval_b = await client.post(
        "/api/v1/decision-engine/evaluate",
        json={"crop_lot_id": lot_id},
        headers=headers_b,
    )
    assert eval_b.status_code == 403

    # 2. Farmer B attempts to retrieve Farmer A's decision run -> 403 Forbidden
    get_b = await client.get(
        f"/api/v1/decision-engine/decisions/{decision_id}",
        headers=headers_b,
    )
    assert get_b.status_code == 403

    # 3. Farmer B attempts to list decisions for Farmer A's lot -> 403 Forbidden
    hist_b = await client.get(
        f"/api/v1/decision-engine/lots/{lot_id}/decisions",
        headers=headers_b,
    )
    assert hist_b.status_code == 403


@pytest.mark.asyncio
async def test_scenario_presets_via_api(client: AsyncClient, auth_headers: dict):
    """Test scenario presets: Mandi Wins and Processing Bottleneck."""
    lot_id = await _create_test_lot(client, auth_headers)

    # 1. Mandi Wins
    mandi_resp = await client.post(
        "/api/v1/decision-engine/evaluate",
        json={"crop_lot_id": lot_id, "scenario_preset": "MANDI_WINS"},
        headers=auth_headers,
    )
    assert mandi_resp.status_code == 201
    assert mandi_resp.json()["recommended_route_type"] == "RAW_MANDI"

    # 2. Processing Bottleneck
    bottleneck_resp = await client.post(
        "/api/v1/decision-engine/evaluate",
        json={"crop_lot_id": lot_id, "scenario_preset": "PROCESSING_BOTTLENECK"},
        headers=auth_headers,
    )
    assert bottleneck_resp.status_code == 201
    opts = bottleneck_resp.json()["options"]
    proc_opt = next(o for o in opts if o["route_type"] == "PROCESSING")
    assert proc_opt["feasibility_status"] == "INFEASIBLE"
    assert proc_opt["is_recommended"] is False
