# backend/tests/integration/test_farms_and_crop_lots.py
"""Integration tests for Farm and CropLot CRUD and authorization isolation."""
from decimal import Decimal
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_and_list_farms(client: AsyncClient, auth_headers: dict):
    # 1. Create farm
    farm_payload = {
        "farm_name": "Patil Krishi Farm",
        "state": "Maharashtra",
        "district": "Pune",
        "village": "Narayangaon",
        "land_area": "3.5",
        "land_area_unit": "acre",
        "resources": [
            {
                "resource_type": "storage",
                "name": "Shaded Shed",
                "quantity": "2000",
                "unit": "kg",
                "availability_status": "available",
            }
        ],
    }
    resp = await client.post("/api/v1/farms", json=farm_payload, headers=auth_headers)
    assert resp.status_code == 201
    farm_data = resp.json()
    farm_id = farm_data["id"]
    assert farm_data["farm_name"] == "Patil Krishi Farm"
    assert len(farm_data["resources"]) == 1

    # 2. List farms
    list_resp = await client.get("/api/v1/farms", headers=auth_headers)
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] >= 1


@pytest.mark.asyncio
async def test_create_and_list_crop_lots(client: AsyncClient, auth_headers: dict):
    # 1. Create farm first
    farm_payload = {
        "farm_name": "Patil Test Farm",
        "state": "Maharashtra",
        "district": "Pune",
        "village": "Narayangaon",
    }
    farm_resp = await client.post("/api/v1/farms", json=farm_payload, headers=auth_headers)
    farm_id = farm_resp.json()["id"]

    # 2. Register harvest lot under farm
    lot_payload = {
        "farm_id": farm_id,
        "crop_name": "Tomato",
        "variety": "Abhinav",
        "quantity": "4000",
        "quantity_unit": "kg",
        "quality_grade": "A",
        "data_mode": "demo",
        "notes": "Pilot tomato lot",
    }
    lot_resp = await client.post(
        f"/api/v1/farms/{farm_id}/crop-lots", json=lot_payload, headers=auth_headers
    )
    assert lot_resp.status_code == 201
    lot_data = lot_resp.json()
    assert lot_data["crop_name"] == "Tomato"
    assert Decimal(str(lot_data["quantity"])) == Decimal("4000")
    assert Decimal(str(lot_data["quantity_kg_normalized"])) == Decimal("4000")
    assert lot_data["status"] == "DRAFT"
    assert lot_data["data_mode"] == "demo"
    assert len(lot_data["events"]) >= 1
    assert lot_data["events"][0]["event_type"] == "CREATED"

    lot_id = lot_data["id"]

    # 3. Retrieve crop lot by ID
    get_resp = await client.get(f"/api/v1/crop-lots/{lot_id}", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == lot_id

    # 4. List crop lots
    lots_list = await client.get("/api/v1/crop-lots", headers=auth_headers)
    assert lots_list.status_code == 200
    assert lots_list.json()["total"] >= 1


@pytest.mark.asyncio
async def test_farm_ownership_isolation(client: AsyncClient):
    # Farmer A
    login_a = await client.post(
        "/api/v1/auth/demo-login",
        json={"phone": "9000000001", "demo_code": "123456", "full_name": "Farmer A"},
    )
    token_a = login_a.json()["access_token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Farmer B
    login_b = await client.post(
        "/api/v1/auth/demo-login",
        json={"phone": "9000000002", "demo_code": "123456", "full_name": "Farmer B"},
    )
    token_b = login_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Farmer A creates a farm
    farm_resp = await client.post(
        "/api/v1/farms",
        json={"farm_name": "Farm A", "state": "MH", "district": "Pune", "village": "A-Village"},
        headers=headers_a,
    )
    farm_id = farm_resp.json()["id"]

    # Farmer B attempts to access Farmer A's farm -> returns 404 (does not leak existence)
    b_access = await client.get(f"/api/v1/farms/{farm_id}", headers=headers_b)
    assert b_access.status_code == 404


@pytest.mark.asyncio
async def test_update_farm_with_boundary_and_resources(client: AsyncClient, auth_headers: dict):
    # 1. Create farm
    farm_resp = await client.post(
        "/api/v1/farms",
        json={
            "farm_name": "Initial Farm",
            "state": "Maharashtra",
            "district": "Nashik",
            "village": "Niphad",
            "land_area": "4.0",
            "land_area_unit": "acre",
        },
        headers=auth_headers,
    )
    assert farm_resp.status_code == 201
    farm_id = farm_resp.json()["id"]

    # 2. Update farm with boundary GeoJSON and new resources
    geojson_str = '{"type":"Polygon","coordinates":[[[74.037,20.076],[74.039,20.076],[74.039,20.078],[74.037,20.078],[74.037,20.076]]]}'
    patch_payload = {
        "farm_name": "Updated Smart Farm",
        "boundary_geojson": geojson_str,
        "resources": [
            {
                "resource_type": "storage",
                "name": "Solar Cold Shed",
                "quantity": "5000",
                "unit": "kg",
                "availability_status": "available",
            },
            {
                "resource_type": "equipment",
                "name": "Drip Irrigation Controller",
                "quantity": "1",
                "unit": "unit",
                "availability_status": "available",
            },
        ],
    }
    patch_resp = await client.patch(f"/api/v1/farms/{farm_id}", json=patch_payload, headers=auth_headers)
    assert patch_resp.status_code == 200
    updated_data = patch_resp.json()
    assert updated_data["farm_name"] == "Updated Smart Farm"
    assert updated_data["boundary_geojson"] == geojson_str
    assert len(updated_data["resources"]) == 2
    res_names = [r["name"] for r in updated_data["resources"]]
    assert "Solar Cold Shed" in res_names
    assert "Drip Irrigation Controller" in res_names
