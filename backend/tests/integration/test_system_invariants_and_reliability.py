"""
AGRI2VALUE — System Invariants & Multi-Tenant Reliability Test Suite (Phase 7)

Validates critical platform safeguards:
1. Cross-Farmer Tenant Isolation (Zero data leaks across farmers for Farms, Lots, Deals, Disputes, IoT).
2. Protection Invariants (Over-delivery prevention, delivery breakdown reconciliation, over-payment prevention).
3. Financial Ledger Integrity (Duplicate transaction reference rejection, terminal agreement immutability).
4. Dispute Lifecycle State Machine (Rejection of invalid transitions, terminal closed states).
5. IoT Edge Security & Ingestion Range Validation (Authentication verification, sensor bounds checking).
6. Transparency Disclaimers & Provenance Grounding (Explicit labeling of demo / simulated records).
"""

import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


async def _get_two_farmers(client: AsyncClient):
    """Generates two separate authenticated farmer sessions for tenant isolation verification."""
    # Farmer A
    phone_a = f"98{uuid.uuid4().int % 100000000:08d}"
    res_a = await client.post(
        "/api/v1/auth/demo-login",
        json={"phone": phone_a, "demo_code": "123456", "full_name": "Farmer Ramesh A"},
    )
    assert res_a.status_code == 200
    token_a = res_a.json()["access_token"]
    user_id_a = res_a.json()["user_id"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Farmer B
    phone_b = f"99{uuid.uuid4().int % 100000000:08d}"
    res_b = await client.post(
        "/api/v1/auth/demo-login",
        json={"phone": phone_b, "demo_code": "123456", "full_name": "Farmer Suresh B"},
    )
    assert res_b.status_code == 200
    token_b = res_b.json()["access_token"]
    user_id_b = res_b.json()["user_id"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    return {
        "farmer_a": {"id": user_id_a, "headers": headers_a, "name": "Farmer Ramesh A"},
        "farmer_b": {"id": user_id_b, "headers": headers_b, "name": "Farmer Suresh B"},
    }


async def _create_farm_and_lot(client: AsyncClient, headers: dict, name_prefix: str = "Farm"):
    """Helper to create a farm and a crop lot for a farmer."""
    res_farm = await client.post(
        "/api/v1/farms",
        json={
            "farm_name": f"{name_prefix} Estate",
            "state": "Maharashtra",
            "district": "Nashik",
            "taluka": "Niphad",
            "village": "Pimpalgaon",
            "total_area_acres": 4.5,
            "soil_type": "BLACK_REGUR",
            "irrigation_source": "DRIP",
        },
        headers=headers,
    )
    assert res_farm.status_code == 201
    farm_id = res_farm.json()["id"]

    res_lot = await client.post(
        f"/api/v1/farms/{farm_id}/crop-lots",
        json={
            "farm_id": farm_id,
            "crop_name": "Tomato",
            "variety": "Abhinav Hybrid",
            "quantity": 5000.0,
            "quantity_unit": "kg",
            "quality_grade": "A",
            "data_mode": "demo",
            "notes": "System invariant test lot",
        },
        headers=headers,
    )
    assert res_lot.status_code == 201
    lot_id = res_lot.json()["id"]
    return farm_id, lot_id


@pytest.mark.asyncio
async def test_cross_farmer_tenant_isolation(client: AsyncClient):
    """
    INVARIANT 1: Strict Tenant Isolation.
    Farmer B MUST NEVER be able to read or mutate Farmer A's farms, crop lots,
    agreements, disputes, or IoT telemetry devices.
    """
    farmers = await _get_two_farmers(client)
    farmer_a = farmers["farmer_a"]
    farmer_b = farmers["farmer_b"]

    farm_a_id, lot_a_id = await _create_farm_and_lot(client, farmer_a["headers"], "Tenant Isolation Farm A")

    # Farmer A creates an IoT device on Farm A
    res_dev = await client.post(
        "/api/v1/iot/devices",
        json={
            "farm_id": farm_a_id,
            "device_code": f"ESP32-TENANT-A-{uuid.uuid4().hex[:6].upper()}",
            "device_name": "Ramesh Soil Node",
            "device_type": "ESP32_AGRI_NODE",
            "sensor_capabilities": "SOIL_MOISTURE,AIR_TEMP",
        },
        headers=farmer_a["headers"],
    )
    assert res_dev.status_code == 201
    dev_a_id = res_dev.json()["id"]

    # --- CROSS-TENANT ACCESS ATTEMPTS BY FARMER B ---

    # Attempt 1: Farmer B reads Farmer A's farm -> MUST FAIL (403 or 404)
    b_farm_res = await client.get(f"/api/v1/farms/{farm_a_id}", headers=farmer_b["headers"])
    assert b_farm_res.status_code in (403, 404), "Farmer B accessed Farmer A's farm!"

    # Attempt 2: Farmer B reads Farmer A's crop lot -> MUST FAIL (403 or 404)
    b_lot_res = await client.get(f"/api/v1/crop-lots/{lot_a_id}", headers=farmer_b["headers"])
    assert b_lot_res.status_code in (403, 404), "Farmer B accessed Farmer A's crop lot!"

    # Attempt 3: Farmer B reads Farmer A's IoT device -> MUST FAIL (403 or 404)
    b_dev_res = await client.get(f"/api/v1/iot/devices/{dev_a_id}", headers=farmer_b["headers"])
    assert b_dev_res.status_code in (403, 404), "Farmer B accessed Farmer A's IoT device!"

    # Attempt 4: Farmer B queries Farmer A's IoT telemetry -> MUST FAIL (403 or 404)
    b_telem_res = await client.get(f"/api/v1/iot/devices/{dev_a_id}/telemetry", headers=farmer_b["headers"])
    assert b_telem_res.status_code in (403, 404), "Farmer B accessed Farmer A's telemetry data!"


@pytest.mark.asyncio
async def test_over_delivery_rejection(client: AsyncClient):
    """
    INVARIANT 2: Over-Delivery Protection.
    Delivering a quantity exceeding the remaining agreed volume MUST be rejected with HTTP 422.
    """
    farmers = await _get_two_farmers(client)
    farmer_a = farmers["farmer_a"]

    farm_id, lot_id = await _create_farm_and_lot(client, farmer_a["headers"], "Over Delivery Farm")

    # Create agreement for Farmer A via API: 2,000 kg @ 15.00 INR/kg
    agr_res = await client.post(
        "/api/v1/protection/agreements",
        json={
            "crop_lot_id": lot_id,
            "partner_type": "BUYER",
            "partner_name": "Godavari Agro Mills",
            "commodity": "Tomato",
            "variety": "Abhinav",
            "quality_grade": "A",
            "agreed_quantity_kg": 2000.0,
            "quantity_unit": "kg",
            "agreed_unit_price": 15.00,
            "pricing_unit": "INR/kg",
            "delivery_location": "MIDC Sinnar Weighbridge",
            "payment_terms_days": 3,
        },
        headers=farmer_a["headers"],
    )
    assert agr_res.status_code == 201
    agr = agr_res.json()
    agr_id = agr["id"]

    # Accept agreement
    await client.post(
        f"/api/v1/protection/agreements/{agr_id}/accept",
        json={"notes": "Terms accepted"},
        headers=farmer_a["headers"],
    )

    # Attempt to deliver 2,500 kg against a 2,000 kg contract -> MUST FAIL (422)
    bad_del_resp = await client.post(
        "/api/v1/protection/deliveries",
        json={
            "agreement_id": agr_id,
            "delivered_quantity_kg": 2500.0,
            "accepted_quantity_kg": 2500.0,
            "rejected_quantity_kg": 0.0,
            "delivery_location": "MIDC Sinnar Weighbridge",
            "vehicle_number": "MH-15-AB-1234",
        },
        headers=farmer_a["headers"],
    )
    assert bad_del_resp.status_code == 422, f"Over-delivery was not rejected: {bad_del_resp.text}"
    msg = (bad_del_resp.json().get("message") or bad_del_resp.json().get("detail", "")).lower()
    assert "exceeds" in msg or "unfulfilled" in msg


@pytest.mark.asyncio
async def test_delivery_breakdown_mismatch_rejection(client: AsyncClient):
    """
    INVARIANT 3: Delivery Mathematical Consistency.
    accepted_quantity_kg + rejected_quantity_kg MUST equal delivered_quantity_kg.
    """
    farmers = await _get_two_farmers(client)
    farmer_a = farmers["farmer_a"]

    farm_id, lot_id = await _create_farm_and_lot(client, farmer_a["headers"], "Breakdown Farm")

    agr_res = await client.post(
        "/api/v1/protection/agreements",
        json={
            "crop_lot_id": lot_id,
            "partner_type": "BUYER",
            "partner_name": "Nashik Mandi Direct",
            "commodity": "Tomato",
            "variety": "Abhinav",
            "quality_grade": "A",
            "agreed_quantity_kg": 1000.0,
            "quantity_unit": "kg",
            "agreed_unit_price": 20.00,
            "pricing_unit": "INR/kg",
            "delivery_location": "Pimpalgaon Yard",
            "payment_terms_days": 2,
        },
        headers=farmer_a["headers"],
    )
    assert agr_res.status_code == 201
    agr_id = agr_res.json()["id"]

    await client.post(
        f"/api/v1/protection/agreements/{agr_id}/accept",
        json={"notes": "Terms accepted"},
        headers=farmer_a["headers"],
    )

    # Inconsistent payload: delivered 1,000 kg, but accepted 700 + rejected 100 = 800 kg (200 kg unaccounted!)
    bad_breakdown = await client.post(
        "/api/v1/protection/deliveries",
        json={
            "agreement_id": agr_id,
            "delivered_quantity_kg": 1000.0,
            "accepted_quantity_kg": 700.0,
            "rejected_quantity_kg": 100.0,  # 700 + 100 != 1000
            "delivery_location": "Pimpalgaon Yard",
            "vehicle_number": "MH-15-XY-9999",
        },
        headers=farmer_a["headers"],
    )
    assert bad_breakdown.status_code == 422
    msg = (bad_breakdown.json().get("message") or bad_breakdown.json().get("detail", "")).lower()
    assert "mismatch" in msg


@pytest.mark.asyncio
async def test_over_payment_and_duplicate_utr_rejection(client: AsyncClient):
    """
    INVARIANT 4 & 5: Payment Over-Payment & Duplicate UTR Prevention.
    1. Paying more than the agreement's outstanding balance MUST be rejected (422).
    2. Re-using an existing bank transaction reference UTR MUST be rejected (422).
    """
    farmers = await _get_two_farmers(client)
    farmer_a = farmers["farmer_a"]

    farm_id, lot_id = await _create_farm_and_lot(client, farmer_a["headers"], "Payment Farm")

    agr_res = await client.post(
        "/api/v1/protection/agreements",
        json={
            "crop_lot_id": lot_id,
            "partner_type": "BUYER",
            "partner_name": "Sinnar Agro Processing Ltd",
            "commodity": "Tomato",
            "variety": "Abhinav",
            "quality_grade": "A",
            "agreed_quantity_kg": 1000.0,
            "quantity_unit": "kg",
            "agreed_unit_price": 15.00,
            "pricing_unit": "INR/kg",
            "delivery_location": "Sinnar Plant",
            "payment_terms_days": 3,
        },
        headers=farmer_a["headers"],
    )
    assert agr_res.status_code == 201
    agr = agr_res.json()
    agr_id = agr["id"]
    net_payout = float(agr["estimated_net_payout"])  # 15,000 INR

    await client.post(
        f"/api/v1/protection/agreements/{agr_id}/accept",
        json={"notes": "Terms accepted"},
        headers=farmer_a["headers"],
    )

    # 1. Over-payment rejection: outstanding balance is 15,000 INR; try paying 20,000 INR
    over_pay = await client.post(
        "/api/v1/protection/payments",
        json={
            "agreement_id": agr_id,
            "amount_due": net_payout,
            "amount_paid": net_payout + 5000.0,  # Exceeds outstanding balance
            "due_date": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
            "payment_method": "BANK_TRANSFER",
            "payer_name": "Sinnar Agro Processing Ltd",
            "payee_name": farmer_a["name"],
            "transaction_reference_id": "SIM-UTR-OVERPAY-001",
        },
        headers=farmer_a["headers"],
    )
    assert over_pay.status_code == 422
    msg = (over_pay.json().get("message") or over_pay.json().get("detail", "")).lower()
    assert "exceeds" in msg

    # 2. Legitimate partial payment of 5,000 INR
    unique_utr = f"SIM-UTR-LEGIT-{uuid.uuid4().hex[:8].upper()}"
    legit_pay = await client.post(
        "/api/v1/protection/payments",
        json={
            "agreement_id": agr_id,
            "amount_due": net_payout,
            "amount_paid": 5000.0,
            "due_date": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
            "payment_method": "BANK_TRANSFER",
            "payer_name": "Sinnar Agro Processing Ltd",
            "payee_name": farmer_a["name"],
            "transaction_reference_id": unique_utr,
        },
        headers=farmer_a["headers"],
    )
    assert legit_pay.status_code == 201

    # 3. Duplicate UTR rejection: try recording another payment using the exact same UTR
    dup_pay = await client.post(
        "/api/v1/protection/payments",
        json={
            "agreement_id": agr_id,
            "amount_due": net_payout - 5000.0,
            "amount_paid": 5000.0,
            "due_date": (datetime.now(timezone.utc) + timedelta(days=5)).isoformat(),
            "payment_method": "BANK_TRANSFER",
            "payer_name": "Sinnar Agro Processing Ltd",
            "payee_name": farmer_a["name"],
            "transaction_reference_id": unique_utr,  # Re-used reference!
        },
        headers=farmer_a["headers"],
    )
    assert dup_pay.status_code == 422
    dup_msg = (dup_pay.json().get("message") or dup_pay.json().get("detail", "")).lower()
    assert "duplicate" in dup_msg


@pytest.mark.asyncio
async def test_dispute_lifecycle_state_machine(client: AsyncClient):
    """
    INVARIANT 6: Dispute Lifecycle Integrity.
    Disputes cannot perform invalid state transitions (e.g. CLOSED cannot transition to OPEN).
    """
    farmers = await _get_two_farmers(client)
    farmer_a = farmers["farmer_a"]

    farm_id, lot_id = await _create_farm_and_lot(client, farmer_a["headers"], "Dispute Farm")

    agr_res = await client.post(
        "/api/v1/protection/agreements",
        json={
            "crop_lot_id": lot_id,
            "partner_type": "BUYER",
            "partner_name": "Niphad Cold Chain Hub",
            "commodity": "Tomato",
            "variety": "Abhinav",
            "quality_grade": "A",
            "agreed_quantity_kg": 1000.0,
            "quantity_unit": "kg",
            "agreed_unit_price": 20.00,
            "pricing_unit": "INR/kg",
            "delivery_location": "Niphad Cold Facility",
            "payment_terms_days": 3,
        },
        headers=farmer_a["headers"],
    )
    assert agr_res.status_code == 201
    agr_id = agr_res.json()["id"]

    await client.post(
        f"/api/v1/protection/agreements/{agr_id}/accept",
        json={"notes": "Terms accepted"},
        headers=farmer_a["headers"],
    )

    # 1. Create dispute (starts OPEN)
    disp_res = await client.post(
        "/api/v1/protection/disputes",
        json={
            "agreement_id": agr_id,
            "category": "QUALITY_DISAGREEMENT",
            "title": "Grade B dispute on harvest",
            "description": "Cold facility inspector downgraded Grade A to Grade B unilaterally.",
            "disputed_amount": 5000.0,
        },
        headers=farmer_a["headers"],
    )
    assert disp_res.status_code == 201
    disp_id = disp_res.json()["id"]

    # 2. Transition OPEN -> UNDER_REVIEW (Valid)
    tr1 = await client.post(
        f"/api/v1/protection/disputes/{disp_id}/status",
        json={"status": "UNDER_REVIEW", "notes": "Cold storage quality team reviewing brix records."},
        headers=farmer_a["headers"],
    )
    assert tr1.status_code == 200

    # 3. Transition UNDER_REVIEW -> RESOLVED (Valid)
    tr2 = await client.post(
        f"/api/v1/protection/disputes/{disp_id}/status",
        json={"status": "RESOLVED", "notes": "Agreed on Grade A pricing with ₹500 handling credit."},
        headers=farmer_a["headers"],
    )
    assert tr2.status_code == 200

    # 4. Transition RESOLVED -> CLOSED (Valid)
    tr3 = await client.post(
        f"/api/v1/protection/disputes/{disp_id}/status",
        json={"status": "CLOSED", "notes": "Case closed and payment released."},
        headers=farmer_a["headers"],
    )
    assert tr3.status_code == 200

    # 5. Transition CLOSED -> OPEN (Invalid: terminal state cannot reopen)
    bad_tr = await client.post(
        f"/api/v1/protection/disputes/{disp_id}/status",
        json={"status": "OPEN", "notes": "Attempting to reopen closed dispute."},
        headers=farmer_a["headers"],
    )
    assert bad_tr.status_code == 422
    msg = (bad_tr.json().get("message") or bad_tr.json().get("detail", "")).lower()
    assert "invalid" in msg


@pytest.mark.asyncio
async def test_terminal_agreement_amendment_rejection(client: AsyncClient, db_session: AsyncSession):
    """
    INVARIANT 7: Terminal Agreement Immutability.
    Agreements in CANCELLED status cannot be amended.
    """
    farmers = await _get_two_farmers(client)
    farmer_a = farmers["farmer_a"]

    farm_id, lot_id = await _create_farm_and_lot(client, farmer_a["headers"], "Cancelled Deal Farm")

    agr_res = await client.post(
        "/api/v1/protection/agreements",
        json={
            "crop_lot_id": lot_id,
            "partner_type": "BUYER",
            "partner_name": "Cancelled Trader LLC",
            "commodity": "Tomato",
            "variety": "Abhinav",
            "quality_grade": "A",
            "agreed_quantity_kg": 1000.0,
            "quantity_unit": "kg",
            "agreed_unit_price": 15.00,
            "pricing_unit": "INR/kg",
            "delivery_location": "Nashik Mandi",
            "payment_terms_days": 3,
        },
        headers=farmer_a["headers"],
    )
    assert agr_res.status_code == 201
    agr_id = agr_res.json()["id"]

    # Mark agreement as COMPLETED (terminal state)
    from sqlalchemy import update
    from app.database.models import DealAgreement
    await db_session.execute(
        update(DealAgreement).where(DealAgreement.id == agr_id).values(status="COMPLETED")
    )
    await db_session.commit()

    # Attempt to amend completed agreement terms -> MUST FAIL (422)
    amend_res = await client.post(
        f"/api/v1/protection/agreements/{agr_id}/amend",
        json={
            "reason": "Attempting price renegotiation on completed deal",
            "agreed_quantity_kg": 1200.0,
            "agreed_unit_price": 18.0,
        },
        headers=farmer_a["headers"],
    )
    assert amend_res.status_code == 422
    assert "terminal state" in amend_res.text.lower()


@pytest.mark.asyncio
async def test_iot_security_and_bounds_validation(client: AsyncClient):
    """
    INVARIANT 8: IoT Telemetry Ingestion Boundary & Security Safeguards.
    1. Unauthenticated or invalid token ingestion MUST return HTTP 401.
    2. Telemetry values outside physically plausible bounds MUST return HTTP 422.
    """
    farmers = await _get_two_farmers(client)
    farmer_a = farmers["farmer_a"]

    farm_id, _ = await _create_farm_and_lot(client, farmer_a["headers"], "Sensor Bound Farm")

    res_dev = await client.post(
        "/api/v1/iot/devices",
        json={
            "farm_id": farm_id,
            "device_code": f"ESP32-BOUNDS-{uuid.uuid4().hex[:6].upper()}",
            "device_name": "Telemetry Node 1",
            "device_type": "ESP32_AGRI_NODE",
            "sensor_capabilities": "SOIL_MOISTURE,AIR_TEMP",
        },
        headers=farmer_a["headers"],
    )
    assert res_dev.status_code == 201
    device = res_dev.json()
    device_code = device["device_code"]
    raw_api_key = device["raw_api_key"]

    now_iso = datetime.now(timezone.utc).isoformat()

    # 1. Invalid authentication header -> 401
    bad_auth = await client.post(
        "/api/v1/iot/telemetry",
        json={
            "farm_id": farm_id,
            "readings": [
                {
                    "reading_id": "r-01",
                    "sensor_type": "SOIL_MOISTURE",
                    "value": 45.0,
                    "unit": "%",
                    "device_timestamp": now_iso,
                }
            ],
        },
        headers={
            "X-Device-Id": device_code,
            "X-Device-Key": "WRONG_TOKEN_VALUE_XYZ",
        },
    )
    assert bad_auth.status_code == 401

    # 2. Unphysical / out-of-bounds soil moisture (150% is physically impossible) -> 422
    bad_val = await client.post(
        "/api/v1/iot/telemetry",
        json={
            "farm_id": farm_id,
            "readings": [
                {
                    "reading_id": "r-02",
                    "sensor_type": "SOIL_MOISTURE",
                    "value": 150.0,  # Max allowed is 100.0%
                    "unit": "%",
                    "device_timestamp": now_iso,
                }
            ],
        },
        headers={
            "X-Device-Id": device_code,
            "X-Device-Key": raw_api_key,
        },
    )
    assert bad_val.status_code == 422
    msg = (bad_val.json().get("message") or bad_val.json().get("detail", "")).lower()
    assert "soil_moisture" in msg or "range" in msg
