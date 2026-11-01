"""
Agri2Value — Integration Tests for Smart Execution Network & Crop Rescue API.
"""
from datetime import datetime, timezone
from decimal import Decimal
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import (
    Buyer,
    BuyerOffer,
    LogisticsProvider,
    ColdStorageFacility,
    ProcessingFacility,
)


@pytest_asyncio.fixture(autouse=True)
async def seed_execution_network(db_session: AsyncSession):
    # Seed Buyers
    b1 = Buyer(
        company_name="Sahyadri Agro-Retail Hub",
        contact_person="Vikram Shinde",
        phone="9822011223",
        district="Nashik",
        state="Maharashtra",
        address="MIDC Ambad, Nashik",
        buyer_type="DIRECT_RETAIL",
        service_radius_km=Decimal("80.0"),
        is_verified=False,
        verification_badge="DEMO_SIMULATION",
        data_mode="demo",
    )
    b2 = Buyer(
        company_name="MahaFresh Wholesale Trading Corp",
        contact_person="Sunil Kulkarni",
        phone="9890123456",
        district="Mumbai",
        state="Maharashtra",
        address="APMC Vashi, Navi Mumbai",
        buyer_type="WHOLESALER",
        service_radius_km=Decimal("200.0"),
        is_verified=False,
        verification_badge="DEMO_SIMULATION",
        data_mode="demo",
    )
    db_session.add_all([b1, b2])
    await db_session.flush()

    # Buyer Offers
    o1 = BuyerOffer(
        buyer_id=b1.id,
        commodity="Tomato",
        variety="Hybrid (Abhinav)",
        accepted_grades="A,B",
        min_quantity_kg=Decimal("1000"),
        max_quantity_kg=Decimal("25000"),
        offered_price_per_kg=Decimal("16.50"),
        price_unit="INR/kg",
        logistics_requirement="PICKUP_AT_FARM",
        payment_terms_days=3,
        valid_until=datetime(2026, 12, 31, tzinfo=timezone.utc),
        status="OPEN",
        data_mode="demo",
    )
    o2 = BuyerOffer(
        buyer_id=b2.id,
        commodity="Tomato",
        variety="Commercial Red",
        accepted_grades="A,B,C",
        min_quantity_kg=Decimal("2000"),
        max_quantity_kg=Decimal("50000"),
        offered_price_per_kg=Decimal("15.80"),
        price_unit="INR/kg",
        logistics_requirement="DELIVERY_TO_BUYER",
        payment_terms_days=7,
        valid_until=datetime(2026, 12, 31, tzinfo=timezone.utc),
        status="OPEN",
        data_mode="demo",
    )
    db_session.add_all([o1, o2])

    # Logistics Providers
    l1 = LogisticsProvider(
        provider_name="Niphad Agri-Express Tempo Fleet",
        contact_phone="9823100111",
        vehicle_type="TEMPO_3T",
        capacity_kg=Decimal("3000"),
        current_available_capacity_kg=Decimal("3000"),
        base_district="Nashik",
        service_districts="Nashik,Pune",
        per_km_rate_per_kg=Decimal("0.0450"),
        minimum_fare=Decimal("800.00"),
        pricing_unit="INR/kg/km",
        is_temperature_controlled=False,
        availability_status="AVAILABLE",
        data_mode="demo",
    )
    db_session.add(l1)

    # Cold Storage Facilities
    c1 = ColdStorageFacility(
        facility_name="Niphad Multi-Commodity Cold Chain Hub",
        contact_phone="9823200111",
        location_district="Nashik",
        location_taluka="Niphad",
        compatible_commodities="Tomato,Onion",
        total_capacity_kg=Decimal("200000"),
        available_capacity_kg=Decimal("45000"),
        storage_rate_per_kg_per_month=Decimal("0.70"),
        pricing_unit="INR/kg/month",
        availability_status="AVAILABLE",
        data_mode="demo",
    )
    db_session.add(c1)

    # Processing Facilities
    p1 = ProcessingFacility(
        facility_name="Sahyadri Tomato Puree & Pulp Works",
        contact_phone="9823300111",
        facility_type="TOMATO_PUREE_PULP",
        accepted_commodities="Tomato",
        accepted_grades="A,B,C",
        daily_capacity_kg=Decimal("15000"),
        available_capacity_kg=Decimal("6000"),
        processing_charge_per_kg=Decimal("3.20"),
        pricing_unit="INR/input_kg",
        output_recovery_ratio=Decimal("0.2800"),
        output_product_name="Aseptic Tomato Puree",
        location_district="Nashik",
        location_taluka="Dindori",
        availability_status="OPERATIONAL",
        data_mode="demo",
    )
    db_session.add(p1)
    await db_session.commit()


async def _create_test_lot(client: AsyncClient, headers: dict, qty: str = "4000") -> str:
    farm_resp = await client.post(
        "/api/v1/farms",
        json={
            "farm_name": "Execution Test Farm",
            "state": "Maharashtra",
            "district": "Nashik",
            "village": "Niphad",
        },
        headers=headers,
    )
    farm_id = farm_resp.json()["id"]

    lot_resp = await client.post(
        f"/api/v1/farms/{farm_id}/crop-lots",
        json={
            "farm_id": farm_id,
            "crop_name": "Tomato",
            "variety": "Abhinav",
            "quantity": qty,
            "quantity_unit": "kg",
            "quality_grade": "A",
            "data_mode": "demo",
        },
        headers=headers,
    )
    return lot_resp.json()["id"]


@pytest.mark.asyncio
async def test_list_buyers_and_offers_api(client: AsyncClient, auth_headers: dict):
    # 1. List buyers
    resp = await client.get("/api/v1/execution/buyers", headers=auth_headers)
    assert resp.status_code == 200
    buyers = resp.json()
    assert len(buyers) >= 1
    assert any("Sahyadri" in b["company_name"] for b in buyers)

    # 2. Filter buyers by district
    nashik_resp = await client.get("/api/v1/execution/buyers?district=Nashik", headers=auth_headers)
    assert nashik_resp.status_code == 200
    assert all("nashik" in b["district"].lower() for b in nashik_resp.json())

    # 3. List buyer offers
    offers_resp = await client.get("/api/v1/execution/buyer-offers?commodity=Tomato", headers=auth_headers)
    assert offers_resp.status_code == 200
    offers = offers_resp.json()
    assert len(offers) >= 1
    assert all(o["commodity"] == "Tomato" for o in offers)


@pytest.mark.asyncio
async def test_list_infrastructure_api(client: AsyncClient, auth_headers: dict):
    # Logistics
    log_resp = await client.get("/api/v1/execution/logistics", headers=auth_headers)
    assert log_resp.status_code == 200
    providers = log_resp.json()
    assert len(providers) >= 1
    assert any("TEMPO" in p["vehicle_type"] for p in providers)

    # Cold storage
    cold_resp = await client.get("/api/v1/execution/cold-storage", headers=auth_headers)
    assert cold_resp.status_code == 200
    facilities = cold_resp.json()
    assert len(facilities) >= 1
    assert any("Cold" in f["facility_name"] for f in facilities)

    # Processing
    proc_resp = await client.get("/api/v1/execution/processing", headers=auth_headers)
    assert proc_resp.status_code == 200
    procs = proc_resp.json()
    assert len(procs) >= 1
    assert any("TOMATO" in p["facility_type"] for p in procs)


@pytest.mark.asyncio
async def test_create_execution_request(client: AsyncClient, auth_headers: dict):
    lot_id = await _create_test_lot(client, auth_headers)

    # Get an open buyer offer
    offers_resp = await client.get("/api/v1/execution/buyer-offers?commodity=Tomato", headers=auth_headers)
    offer = offers_resp.json()[0]

    # Create request
    req_payload = {
        "crop_lot_id": lot_id,
        "route_type": "DIRECT_BUYER",
        "requested_quantity_kg": "3500",
        "buyer_offer_id": offer["id"],
        "notes": "Grade A firm red tomatoes packed in 20kg crates.",
    }
    create_resp = await client.post("/api/v1/execution/requests", json=req_payload, headers=auth_headers)
    assert create_resp.status_code == 201
    req_data = create_resp.json()
    assert req_data["crop_lot_id"] == lot_id
    assert req_data["status"] == "SUBMITTED"
    assert Decimal(str(req_data["requested_quantity_kg"])) == Decimal("3500")
    assert Decimal(str(req_data["indicative_unit_price"])) == Decimal(str(offer["offered_price_per_kg"]))
    assert Decimal(str(req_data["indicative_net_payout"])) > Decimal("0")
    assert len(req_data["events"]) >= 1
    assert req_data["events"][0]["to_status"] == "SUBMITTED"


@pytest.mark.asyncio
async def test_over_reservation_prevention(client: AsyncClient, auth_headers: dict):
    lot_id = await _create_test_lot(client, auth_headers, qty="2000")

    # Attempt to request 5,000 kg for a 2,000 kg lot
    bad_req = {
        "crop_lot_id": lot_id,
        "route_type": "DIRECT_BUYER",
        "requested_quantity_kg": "5000",
    }
    resp = await client.post("/api/v1/execution/requests", json=bad_req, headers=auth_headers)
    assert resp.status_code == 422
    assert "exceeds crop lot volume" in resp.json()["message"]


@pytest.mark.asyncio
async def test_execution_status_lifecycle_and_events(client: AsyncClient, auth_headers: dict):
    lot_id = await _create_test_lot(client, auth_headers)

    # Create request
    create_resp = await client.post(
        "/api/v1/execution/requests",
        json={"crop_lot_id": lot_id, "route_type": "PROCESSING", "requested_quantity_kg": "2500"},
        headers=auth_headers,
    )
    req_id = create_resp.json()["id"]

    # 1. SUBMITTED -> PROVIDER_ACCEPTED
    t1 = await client.post(
        f"/api/v1/execution/requests/{req_id}/transition",
        json={"to_status": "PROVIDER_ACCEPTED", "message": "Factory schedule slot allocated for tomorrow 9 AM."},
        headers=auth_headers,
    )
    assert t1.status_code == 200
    assert t1.json()["status"] == "PROVIDER_ACCEPTED"

    # 2. PROVIDER_ACCEPTED -> CONFIRMED
    t2 = await client.post(
        f"/api/v1/execution/requests/{req_id}/transition",
        json={"to_status": "CONFIRMED", "message": "Terms locked and factory intake confirmed."},
        headers=auth_headers,
    )
    assert t2.status_code == 200
    assert t2.json()["status"] == "CONFIRMED"

    # 3. CONFIRMED -> IN_EXECUTION
    t3 = await client.post(
        f"/api/v1/execution/requests/{req_id}/transition",
        json={"to_status": "IN_EXECUTION", "message": "Vehicle dispatched and loading at farmgate."},
        headers=auth_headers,
    )
    assert t3.status_code == 200
    assert t3.json()["status"] == "IN_EXECUTION"

    # Verify event audit trail length
    req_detail = await client.get(f"/api/v1/execution/requests/{req_id}", headers=auth_headers)
    assert len(req_detail.json()["events"]) == 4


@pytest.mark.asyncio
async def test_invalid_status_transition_rejected(client: AsyncClient, auth_headers: dict):
    lot_id = await _create_test_lot(client, auth_headers)

    create_resp = await client.post(
        "/api/v1/execution/requests",
        json={"crop_lot_id": lot_id, "route_type": "COLD_STORAGE", "requested_quantity_kg": "1500"},
        headers=auth_headers,
    )
    req_id = create_resp.json()["id"]

    # Attempt illegal transition: SUBMITTED directly to COMPLETED
    bad_trans = await client.post(
        f"/api/v1/execution/requests/{req_id}/transition",
        json={"to_status": "COMPLETED", "message": "Premature completion attempt."},
        headers=auth_headers,
    )
    assert bad_trans.status_code == 422
    assert "Invalid transition" in bad_trans.json()["message"]


@pytest.mark.asyncio
async def test_complete_execution_and_snapshot_preservation(client: AsyncClient, auth_headers: dict):
    lot_id = await _create_test_lot(client, auth_headers)

    # 1. Run Decision Engine evaluation first
    eval_resp = await client.post(
        "/api/v1/decision-engine/evaluate",
        json={"crop_lot_id": lot_id},
        headers=auth_headers,
    )
    assert eval_resp.status_code == 201
    decision_run = eval_resp.json()
    orig_decision_id = decision_run["id"]
    orig_decision_profit = decision_run["recommended_net_profit"]

    # 2. Create execution request linked to decision run
    create_resp = await client.post(
        "/api/v1/execution/requests",
        json={
            "crop_lot_id": lot_id,
            "decision_run_id": orig_decision_id,
            "route_type": "DIRECT_BUYER",
            "requested_quantity_kg": "4000",
        },
        headers=auth_headers,
    )
    req_id = create_resp.json()["id"]

    # 3. Transition to CONFIRMED
    await client.post(
        f"/api/v1/execution/requests/{req_id}/transition",
        json={"to_status": "PROVIDER_ACCEPTED", "message": "Tentative acceptance."},
        headers=auth_headers,
    )
    await client.post(
        f"/api/v1/execution/requests/{req_id}/transition",
        json={"to_status": "CONFIRMED", "message": "Booking confirmed."},
        headers=auth_headers,
    )

    # 4. Record actual completion
    complete_resp = await client.post(
        f"/api/v1/execution/requests/{req_id}/complete",
        json={
            "actual_quantity_kg": "3920.0",  # slight handling shrinkage
            "actual_unit_price": "16.80",
            "actual_logistics_cost": "1500.00",
            "completion_notes": "Weighbridge slip #48291 verified. Produce graded Premium A.",
        },
        headers=auth_headers,
    )
    assert complete_resp.status_code == 200
    comp_data = complete_resp.json()
    assert comp_data["status"] == "COMPLETED"
    assert Decimal(str(comp_data["actual_quantity_kg"])) == Decimal("3920.0")
    # Gross: 3920 * 16.80 = 65856.00, Net: 65856 - 1500 = 64356.00
    assert Decimal(str(comp_data["actual_gross_revenue"])) == Decimal("65856.00")
    assert Decimal(str(comp_data["actual_net_payout"])) == Decimal("64356.00")

    # 5. VERIFY ORIGINAL DECISION SNAPSHOT IS 100% UNTOUCHED
    check_run_resp = await client.get(
        f"/api/v1/decision-engine/decisions/{orig_decision_id}",
        headers=auth_headers,
    )
    assert check_run_resp.status_code == 200
    persisted_run = check_run_resp.json()
    assert persisted_run["id"] == orig_decision_id
    assert persisted_run["recommended_net_profit"] == orig_decision_profit


@pytest.mark.asyncio
async def test_farmer_ownership_isolation(client: AsyncClient, auth_headers: dict):
    # Farmer A creates request
    lot_id = await _create_test_lot(client, auth_headers)
    create_resp = await client.post(
        "/api/v1/execution/requests",
        json={"crop_lot_id": lot_id, "route_type": "PROCESSING", "requested_quantity_kg": "2000"},
        headers=auth_headers,
    )
    req_id = create_resp.json()["id"]

    # Farmer B logs in
    login_b = await client.post(
        "/api/v1/auth/demo-login",
        json={"phone": "9999988888", "demo_code": "123456", "full_name": "Suresh Deshmukh"},
    )
    headers_b = {"Authorization": f"Bearer {login_b.json()['access_token']}"}

    # Farmer B attempts to view Farmer A's request -> 403 Forbidden
    resp = await client.get(f"/api/v1/execution/requests/{req_id}", headers=headers_b)
    assert resp.status_code == 403

    # Farmer B attempts to transition Farmer A's request -> 403 Forbidden
    resp_t = await client.post(
        f"/api/v1/execution/requests/{req_id}/transition",
        json={"to_status": "PROVIDER_ACCEPTED", "message": "Unauthorized attempt."},
        headers=headers_b,
    )
    assert resp_t.status_code == 403


@pytest.mark.asyncio
async def test_crop_rescue_assessment(client: AsyncClient, auth_headers: dict):
    lot_id = await _create_test_lot(client, auth_headers)

    rescue_resp = await client.get(f"/api/v1/crop-rescue/lot/{lot_id}", headers=auth_headers)
    assert rescue_resp.status_code == 200
    rescue_data = rescue_resp.json()

    assert rescue_data["crop_lot_id"] == lot_id
    assert rescue_data["crop_name"] == "Tomato"
    assert rescue_data["urgency_level"] in ("CRITICAL", "HIGH", "MODERATE", "LOW")
    assert 0 <= rescue_data["urgency_score"] <= 100
    assert len(rescue_data["risk_reasons"]) > 0
    assert len(rescue_data["salvage_pathways"]) == 4

    pathway_types = [p["route_type"] for p in rescue_data["salvage_pathways"]]
    assert "PROCESSING" in pathway_types
    assert "COLD_STORAGE" in pathway_types
    assert "DIRECT_BUYER" in pathway_types
    assert "RESCUE_SALE" in pathway_types
