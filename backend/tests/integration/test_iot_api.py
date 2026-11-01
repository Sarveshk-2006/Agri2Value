# backend/tests/integration/test_iot_api.py
"""
Agri2Value — Integration Tests for IoT & Edge Telematics (Phase 4A).
"""
import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import pytest
from httpx import AsyncClient


async def _create_test_farm(client: AsyncClient, headers: dict) -> str:
    res = await client.post(
        "/api/v1/farms",
        json={
            "farm_name": "IoT Pilot Farm",
            "state": "Maharashtra",
            "district": "Nashik",
            "village": "Niphad",
            "land_area": "4.5",
            "land_area_unit": "acre",
        },
        headers=headers,
    )
    assert res.status_code == 201
    return res.json()["id"]


async def _create_test_lot(client: AsyncClient, headers: dict, farm_id: str) -> str:
    res = await client.post(
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
    assert res.status_code == 201
    return res.json()["id"]


@pytest.mark.asyncio
async def test_device_registration_and_one_time_secret(client: AsyncClient, auth_headers: dict):
    farm_id = await _create_test_farm(client, auth_headers)

    # 1. Register a new IoT device
    reg_res = await client.post(
        "/api/v1/iot/devices",
        json={
            "device_code": "ESP32-TEST-NODE-01",
            "device_name": "Polyhouse Test Node 1",
            "farm_id": farm_id,
            "device_type": "ESP32_AGRI_NODE",
            "firmware_version": "v1.0.0",
            "sensor_capabilities": "SOIL_MOISTURE,AIR_TEMP,HUMIDITY,RAINFALL",
            "data_source": "SIMULATED",
        },
        headers=auth_headers,
    )
    assert reg_res.status_code == 201
    created_data = reg_res.json()
    assert created_data["device_code"] == "ESP32-TEST-NODE-01"
    assert created_data["status"] == "ACTIVE"
    assert "raw_api_key" in created_data
    assert created_data["raw_api_key"].startswith("a2v_dev_")
    assert "api_key_prefix" in created_data
    assert "api_key_hash" not in created_data  # Secret hash must not be exposed

    device_id = created_data["id"]

    # 2. List devices - verify raw_api_key is omitted
    list_res = await client.get("/api/v1/iot/devices", headers=auth_headers)
    assert list_res.status_code == 200
    devices = list_res.json()
    found = next((d for d in devices if d["id"] == device_id), None)
    assert found is not None
    assert "raw_api_key" not in found
    assert "api_key_hash" not in found


@pytest.mark.asyncio
async def test_device_authentication_and_telemetry_ingestion(client: AsyncClient, auth_headers: dict):
    farm_id = await _create_test_farm(client, auth_headers)

    reg_res = await client.post(
        "/api/v1/iot/devices",
        json={
            "device_code": "ESP32-INGEST-01",
            "device_name": "Ingestion Node",
            "farm_id": farm_id,
        },
        headers=auth_headers,
    )
    device_data = reg_res.json()
    device_code = device_data["device_code"]
    raw_key = device_data["raw_api_key"]

    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Successful authenticated ingestion
    payload = {
        "farm_id": farm_id,
        "readings": [
            {
                "reading_id": "reading-soil-001",
                "sensor_type": "SOIL_MOISTURE",
                "value": "45.50",
                "unit": "%",
                "device_timestamp": now_iso,
                "source_type": "SIMULATED",
            },
            {
                "reading_id": "reading-temp-001",
                "sensor_type": "AIR_TEMP",
                "value": "26.80",
                "unit": "°C",
                "device_timestamp": now_iso,
                "source_type": "SIMULATED",
            },
        ],
    }

    ingest_res = await client.post(
        "/api/v1/iot/telemetry",
        json=payload,
        headers={
            "X-Device-Id": device_code,
            "X-Device-Key": raw_key,
        },
    )
    assert ingest_res.status_code == 201
    res_data = ingest_res.json()
    assert res_data["status"] == "INGESTED"
    assert res_data["ingested_count"] == 2
    assert res_data["duplicate_count"] == 0

    # 2. Query device telemetry history
    hist_res = await client.get(
        f"/api/v1/iot/devices/{device_data['id']}/telemetry",
        headers=auth_headers,
    )
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) == 2


@pytest.mark.asyncio
async def test_invalid_credentials_and_revocation(client: AsyncClient, auth_headers: dict):
    farm_id = await _create_test_farm(client, auth_headers)

    reg_res = await client.post(
        "/api/v1/iot/devices",
        json={
            "device_code": "ESP32-REVOKE-01",
            "device_name": "Revoke Test Node",
            "farm_id": farm_id,
        },
        headers=auth_headers,
    )
    device_data = reg_res.json()
    device_code = device_data["device_code"]
    raw_key = device_data["raw_api_key"]

    # 1. Invalid key -> 401
    bad_res = await client.post(
        "/api/v1/iot/telemetry",
        json={"readings": [{"reading_id": "reading-inv-01", "sensor_type": "AIR_TEMP", "value": "25.0", "unit": "°C", "device_timestamp": datetime.now(timezone.utc).isoformat()}]},
        headers={"X-Device-Id": device_code, "X-Device-Token": "wrong-key-12345"},
    )
    assert bad_res.status_code == 401

    # 2. Update status to REVOKED
    patch_res = await client.patch(
        f"/api/v1/iot/devices/{device_data['id']}/status",
        json={"status": "REVOKED"},
        headers=auth_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "REVOKED"

    # Ingestion rejected with 403 Forbidden
    revoked_res = await client.post(
        "/api/v1/iot/telemetry",
        json={"readings": [{"reading_id": "reading-rev-01", "sensor_type": "AIR_TEMP", "value": "25.0", "unit": "°C", "device_timestamp": datetime.now(timezone.utc).isoformat()}]},
        headers={"X-Device-Id": device_code, "X-Device-Token": raw_key},
    )
    assert revoked_res.status_code == 403


@pytest.mark.asyncio
async def test_key_rotation(client: AsyncClient, auth_headers: dict):
    farm_id = await _create_test_farm(client, auth_headers)

    reg_res = await client.post(
        "/api/v1/iot/devices",
        json={"device_code": "ESP32-ROT-01", "device_name": "Rotation Node", "farm_id": farm_id},
        headers=auth_headers,
    )
    device_data = reg_res.json()
    old_key = device_data["raw_api_key"]

    # Rotate key
    rot_res = await client.post(
        f"/api/v1/iot/devices/{device_data['id']}/rotate-key",
        headers=auth_headers,
    )
    assert rot_res.status_code == 200
    new_key = rot_res.json()["raw_api_key"]
    assert new_key != old_key

    # Old key fails
    payload = {"readings": [{"reading_id": "r-rot-1", "sensor_type": "HUMIDITY", "value": "60.0", "unit": "%", "device_timestamp": datetime.now(timezone.utc).isoformat()}]}
    old_try = await client.post(
        "/api/v1/iot/telemetry",
        json=payload,
        headers={"X-Device-Id": "ESP32-ROT-01", "X-Device-Key": old_key},
    )
    assert old_try.status_code == 401

    # New key succeeds
    new_try = await client.post(
        "/api/v1/iot/telemetry",
        json=payload,
        headers={"X-Device-Id": "ESP32-ROT-01", "X-Device-Key": new_key},
    )
    assert new_try.status_code == 201


@pytest.mark.asyncio
async def test_duplicate_event_rejection(client: AsyncClient, auth_headers: dict):
    farm_id = await _create_test_farm(client, auth_headers)

    reg_res = await client.post(
        "/api/v1/iot/devices",
        json={"device_code": "ESP32-DEDUP-01", "device_name": "Dedup Node", "farm_id": farm_id},
        headers=auth_headers,
    )
    device_data = reg_res.json()

    item = {
        "reading_id": "dedup-unique-reading-100",
        "sensor_type": "SOIL_MOISTURE",
        "value": "50.0",
        "unit": "%",
        "device_timestamp": datetime.now(timezone.utc).isoformat(),
    }

    headers = {"X-Device-Id": "ESP32-DEDUP-01", "X-Device-Key": device_data["raw_api_key"]}

    # First attempt: ingested
    r1 = await client.post("/api/v1/iot/telemetry", json={"readings": [item]}, headers=headers)
    assert r1.status_code == 201
    assert r1.json()["ingested_count"] == 1
    assert r1.json()["duplicate_count"] == 0

    # Second attempt with same reading_id: duplicate skipped
    r2 = await client.post("/api/v1/iot/telemetry", json={"readings": [item]}, headers=headers)
    assert r2.status_code == 201
    assert r2.json()["ingested_count"] == 0
    assert r2.json()["duplicate_count"] == 1


@pytest.mark.asyncio
async def test_range_and_unit_validation(client: AsyncClient, auth_headers: dict):
    farm_id = await _create_test_farm(client, auth_headers)

    reg_res = await client.post(
        "/api/v1/iot/devices",
        json={"device_code": "ESP32-RANGE-01", "device_name": "Range Node", "farm_id": farm_id},
        headers=auth_headers,
    )
    headers = {"X-Device-Id": "ESP32-RANGE-01", "X-Device-Key": reg_res.json()["raw_api_key"]}

    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Invalid unit
    bad_unit = await client.post(
        "/api/v1/iot/telemetry",
        json={"readings": [{"reading_id": "b1", "sensor_type": "SOIL_MOISTURE", "value": "50.0", "unit": "liters", "device_timestamp": now_iso}]},
        headers=headers,
    )
    assert bad_unit.status_code == 422

    # 2. Out of range value (e.g. soil moisture > 100%)
    bad_val = await client.post(
        "/api/v1/iot/telemetry",
        json={"readings": [{"reading_id": "b2", "sensor_type": "SOIL_MOISTURE", "value": "150.0", "unit": "%", "device_timestamp": now_iso}]},
        headers=headers,
    )
    assert bad_val.status_code == 422


@pytest.mark.asyncio
async def test_virtual_simulator_preset_and_alert_resolution(client: AsyncClient, auth_headers: dict):
    farm_id = await _create_test_farm(client, auth_headers)

    reg_res = await client.post(
        "/api/v1/iot/devices",
        json={"device_code": "ESP32-SIM-01", "device_name": "Virtual Sim Node", "farm_id": farm_id},
        headers=auth_headers,
    )
    device_id = reg_res.json()["id"]

    # 1. Run LOW_MOISTURE_DROUGHT simulation
    sim_res = await client.post(
        "/api/v1/iot/simulator/run",
        json={"device_id": device_id, "scenario": "LOW_MOISTURE_DROUGHT"},
        headers=auth_headers,
    )
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["scenario"] == "LOW_MOISTURE_DROUGHT"
    assert sim_data["alerts_count"] >= 1

    # 2. List alerts
    alerts_res = await client.get("/api/v1/iot/alerts", headers=auth_headers)
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    assert len(alerts) >= 1
    unresolved_alert = next((a for a in alerts if not a["is_resolved"] and a["alert_type"] == "LOW_SOIL_MOISTURE"), None)
    assert unresolved_alert is not None
    assert unresolved_alert["source_type"] == "SIMULATED"

    # 3. Resolve alert
    resolve_res = await client.post(
        f"/api/v1/iot/alerts/{unresolved_alert['id']}/resolve",
        headers=auth_headers,
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["is_resolved"] is True


@pytest.mark.asyncio
async def test_crop_rescue_supplementary_telemetry_linkage(client: AsyncClient, auth_headers: dict):
    farm_id = await _create_test_farm(client, auth_headers)
    lot_id = await _create_test_lot(client, auth_headers, farm_id)

    # Register node and inject a heat stress alert
    reg_res = await client.post(
        "/api/v1/iot/devices",
        json={"device_code": "ESP32-RESCUE-01", "device_name": "Rescue Node", "farm_id": farm_id},
        headers=auth_headers,
    )
    device_id = reg_res.json()["id"]

    # Run HEATWAVE_STRESS simulation
    await client.post(
        "/api/v1/iot/simulator/run",
        json={"device_id": device_id, "scenario": "HEATWAVE_STRESS"},
        headers=auth_headers,
    )

    # Assess lot for crop rescue
    rescue_res = await client.get(f"/api/v1/crop-rescue/lot/{lot_id}", headers=auth_headers)
    assert rescue_res.status_code == 200
    rescue_data = rescue_res.json()

    # Verify that supplementary telematics alert was appended into risk_reasons
    assert any("Farm Telematics Alert" in r for r in rescue_data["risk_reasons"])


@pytest.mark.asyncio
async def test_cross_farmer_device_isolation(client: AsyncClient, auth_headers: dict):
    # 1. Farmer A creates farm and device
    farm_a_id = await _create_test_farm(client, auth_headers)
    reg_a = await client.post(
        "/api/v1/iot/devices",
        json={"device_code": "ESP32-FARM-A-01", "device_name": "Farmer A Node", "farm_id": farm_a_id},
        headers=auth_headers,
    )
    assert reg_a.status_code == 201
    device_a = reg_a.json()

    # 2. Login as Farmer B
    phone_b = f"98123{str(uuid.uuid4().int)[:5]}"
    reg_b_res = await client.post(
        "/api/v1/auth/demo-login",
        json={"phone": phone_b, "demo_code": "123456", "full_name": "Farmer B"},
    )
    assert reg_b_res.status_code == 200
    token_b = reg_b_res.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # 3. Farmer B attempts to get Farmer A's device -> 404
    get_res = await client.get(f"/api/v1/iot/devices/{device_a['id']}", headers=headers_b)
    assert get_res.status_code == 404

    # 4. Farmer B attempts to rotate Farmer A's key -> 404
    rot_res = await client.post(f"/api/v1/iot/devices/{device_a['id']}/rotate-key", headers=headers_b)
    assert rot_res.status_code == 404

    # 5. Farmer B attempts to query Farmer A's telemetry -> 404
    hist_res = await client.get(f"/api/v1/iot/devices/{device_a['id']}/telemetry", headers=headers_b)
    assert hist_res.status_code == 404

    # 6. Device ingestion with mismatched farm_id -> 403 Forbidden
    farm_b_id = await _create_test_farm(client, headers_b)
    ingest_mismatch = await client.post(
        "/api/v1/iot/telemetry",
        json={
            "farm_id": farm_b_id,  # Mismatched farm ID
            "readings": [{
                "reading_id": "reading-mismatch-1",
                "sensor_type": "SOIL_MOISTURE",
                "value": "45.0",
                "unit": "%",
                "device_timestamp": datetime.now(timezone.utc).isoformat(),
            }]
        },
        headers={"X-Device-Id": "ESP32-FARM-A-01", "X-Device-Key": device_a["raw_api_key"]},
    )
    assert ingest_mismatch.status_code == 403


@pytest.mark.asyncio
async def test_delayed_and_out_of_order_events(client: AsyncClient, auth_headers: dict):
    farm_id = await _create_test_farm(client, auth_headers)
    reg_res = await client.post(
        "/api/v1/iot/devices",
        json={"device_code": "ESP32-ORDER-01", "device_name": "Order Test Node", "farm_id": farm_id},
        headers=auth_headers,
    )
    device_data = reg_res.json()
    headers = {"X-Device-Id": "ESP32-ORDER-01", "X-Device-Key": device_data["raw_api_key"]}

    now = datetime.now(timezone.utc)
    t_new = now
    t_old = now - timedelta(hours=2)

    # 1. Ingest newer reading first
    r_new = await client.post(
        "/api/v1/iot/telemetry",
        json={"readings": [{
            "reading_id": "reading-new-101",
            "sensor_type": "SOIL_MOISTURE",
            "value": "48.0",
            "unit": "%",
            "device_timestamp": t_new.isoformat(),
        }]},
        headers=headers,
    )
    assert r_new.status_code == 201

    dev_check1 = (await client.get(f"/api/v1/iot/devices/{device_data['id']}", headers=auth_headers)).json()
    assert dev_check1["last_seen_at"] is not None
    dt1 = datetime.fromisoformat(dev_check1["last_seen_at"].replace("Z", "+00:00"))

    # 2. Ingest delayed/older reading (2 hours ago)
    r_old = await client.post(
        "/api/v1/iot/telemetry",
        json={"readings": [{
            "reading_id": "reading-old-102",
            "sensor_type": "SOIL_MOISTURE",
            "value": "47.0",
            "unit": "%",
            "device_timestamp": t_old.isoformat(),
        }]},
        headers=headers,
    )
    assert r_old.status_code == 201

    # 3. Verify last_seen_at was NOT rolled back to the older timestamp
    dev_check2 = (await client.get(f"/api/v1/iot/devices/{device_data['id']}", headers=auth_headers)).json()
    dt2 = datetime.fromisoformat(dev_check2["last_seen_at"].replace("Z", "+00:00"))
    assert dt2 >= dt1


@pytest.mark.asyncio
async def test_alert_deduplication_and_automatic_condition_recovery(client: AsyncClient, auth_headers: dict):
    farm_id = await _create_test_farm(client, auth_headers)
    reg_res = await client.post(
        "/api/v1/iot/devices",
        json={"device_code": "ESP32-ALERT-RECOV-01", "device_name": "Recovery Node", "farm_id": farm_id},
        headers=auth_headers,
    )
    device_data = reg_res.json()
    headers = {"X-Device-Id": "ESP32-ALERT-RECOV-01", "X-Device-Key": device_data["raw_api_key"]}
    now = datetime.now(timezone.utc)

    # 1. Ingest low soil moisture reading (<30%) -> triggers alert
    r1 = await client.post(
        "/api/v1/iot/telemetry",
        json={"readings": [{
            "reading_id": "reading-dry-1",
            "sensor_type": "SOIL_MOISTURE",
            "value": "22.0",
            "unit": "%",
            "device_timestamp": now.isoformat(),
        }]},
        headers=headers,
    )
    assert r1.status_code == 201
    assert r1.json()["alerts_triggered"] == 1

    # 2. Ingest another low soil moisture reading with different reading_id
    # Alert de-duplication must prevent a duplicate open LOW_SOIL_MOISTURE alert
    r2 = await client.post(
        "/api/v1/iot/telemetry",
        json={"readings": [{
            "reading_id": "reading-dry-2",
            "sensor_type": "SOIL_MOISTURE",
            "value": "21.5",
            "unit": "%",
            "device_timestamp": (now + timedelta(minutes=5)).isoformat(),
        }]},
        headers=headers,
    )
    assert r2.status_code == 201
    assert r2.json()["alerts_triggered"] == 0  # Deduplicated

    # Verify only 1 active alert exists
    active_alerts = (await client.get(f"/api/v1/iot/alerts?farm_id={farm_id}&is_resolved=false", headers=auth_headers)).json()
    assert len([a for a in active_alerts if a["alert_type"] == "LOW_SOIL_MOISTURE"]) == 1

    # 3. Ingest recovered soil moisture (e.g. 42% after irrigation)
    r3 = await client.post(
        "/api/v1/iot/telemetry",
        json={"readings": [{
            "reading_id": "reading-moist-3",
            "sensor_type": "SOIL_MOISTURE",
            "value": "42.0",
            "unit": "%",
            "device_timestamp": (now + timedelta(minutes=20)).isoformat(),
        }]},
        headers=headers,
    )
    assert r3.status_code == 201

    # Verify that the dry soil alert has been automatically resolved
    active_alerts_after = (await client.get(f"/api/v1/iot/alerts?farm_id={farm_id}&is_resolved=false", headers=auth_headers)).json()
    assert len([a for a in active_alerts_after if a["alert_type"] == "LOW_SOIL_MOISTURE"]) == 0
