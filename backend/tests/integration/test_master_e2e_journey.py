# backend/tests/integration/test_master_e2e_journey.py
"""
Agri2Value — Master End-to-End Farmer Journey Integration Test Suite (Phase 7).

Validates the complete 15-stage competition demonstration scenario:
1. Farmer Onboarding & Profile Verification
2. Farm Setup & Ownership Inspection
3. Harvest Lot Creation & Volume Normalization
4. Market & Weather Intelligence with Provenance Verification
5. Feasibility-Aware Profit Decision Engine Evaluation & Snapshot
6. Buyer Selection, Offer Capacity Check & Execution Request Lifecycle
7. Crop Rescue Assessment & Salvage Pathways
8. Commercial Deal Agreement Generation & Explicit Acceptance
9. Delivery Verification, Remaining Quantity Tracking & Bilateral Confirmation
10. Transparent Payment Ledger Entry
11. Commercial Payment Reconciliation & Outstanding Balance Calculation
12. Dispute Raising, Resolution Workflow & Timeline Events
13. IoT Edge Telematics Ingestion & Environmental Advisory Alerts
14. Actual vs Expected Profit Reconciliation
15. Protection Dashboard Metrics & Immutable Transaction Audit Trail
"""
from datetime import datetime, timezone, timedelta
from decimal import Decimal
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.models import (
    Buyer,
    BuyerOffer,
    LogisticsProvider,
    ProcessingFacility,
    ColdStorageFacility,
)


@pytest.mark.asyncio
async def test_complete_master_farmer_journey(client: AsyncClient, db_session: AsyncSession):
    # -------------------------------------------------------------------------
    # PRE-REQUISITE SEEDING: Infrastructure & Commercial Demands
    # -------------------------------------------------------------------------
    buyer = Buyer(
        company_name="Sahyadri Agro-Retail Hub",
        contact_person="Vikram Shinde (Procurement Lead)",
        phone="9822011223",
        email="procure@sahyadriagro.in",
        district="Nashik",
        state="Maharashtra",
        address="MIDC Ambad, Nashik 422010",
        buyer_type="DIRECT_RETAIL",
        service_radius_km=Decimal("80.0"),
        is_verified=False,
        verification_badge="DEMO_SIMULATION",
        rating=Decimal("4.8"),
        data_mode="demo",
    )
    db_session.add(buyer)
    await db_session.flush()

    offer = BuyerOffer(
        buyer_id=buyer.id,
        commodity="Tomato",
        variety="Abhinav (Hybrid Red)",
        accepted_grades="A,B",
        min_quantity_kg=Decimal("1000"),
        max_quantity_kg=Decimal("25000"),
        offered_price_per_kg=Decimal("16.50"),
        price_unit="INR/kg",
        logistics_requirement="PICKUP_AT_FARM",
        payment_terms_days=3,
        valid_until=datetime(2026, 12, 31, 23, 59, 59, tzinfo=timezone.utc),
        status="OPEN",
        data_mode="demo",
    )
    db_session.add(offer)

    logistics = LogisticsProvider(
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
        availability_status="AVAILABLE",
        data_mode="demo",
    )
    db_session.add(logistics)

    cold = ColdStorageFacility(
        facility_name="Niphad Multi-Commodity Cold Chain Hub",
        contact_phone="9823200111",
        location_district="Nashik",
        location_taluka="Niphad",
        compatible_commodities="Tomato,Onion,Grapes",
        total_capacity_kg=Decimal("200000"),
        available_capacity_kg=Decimal("45000"),
        storage_rate_per_kg_per_month=Decimal("0.70"),
        pricing_unit="INR/kg/month",
        availability_status="AVAILABLE",
        data_mode="demo",
    )
    db_session.add(cold)

    proc = ProcessingFacility(
        facility_name="Sahyadri Tomato Puree & Pulp Works",
        contact_phone="9823300111",
        facility_type="TOMATO_PUREE_PULP",
        accepted_commodities="Tomato",
        accepted_grades="A,B,C,processing_grade",
        daily_capacity_kg=Decimal("15000"),
        available_capacity_kg=Decimal("6000"),
        processing_charge_per_kg=Decimal("3.20"),
        pricing_unit="INR/input_kg",
        output_recovery_ratio=Decimal("0.2800"),
        output_product_name="Aseptic Tomato Puree (28-30 Brix)",
        location_district="Nashik",
        location_taluka="Dindori",
        availability_status="OPERATIONAL",
        data_mode="demo",
    )
    db_session.add(proc)
    await db_session.commit()

    # -------------------------------------------------------------------------
    # STEP 1: Farmer Onboarding & Authentication
    # -------------------------------------------------------------------------
    login_resp = await client.post(
        "/api/v1/auth/demo-login",
        json={
            "phone": "9876543210",
            "demo_code": "123456",
            "full_name": "Ramesh Patil",
        },
    )
    assert login_resp.status_code == 200, f"Demo login failed: {login_resp.text}"
    auth_data = login_resp.json()
    token = auth_data["access_token"]
    farmer_id = auth_data["user_id"]
    headers = {"Authorization": f"Bearer {token}"}

    me_resp = await client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    me = me_resp.json()
    assert me["id"] == farmer_id
    assert me["full_name"] == "Ramesh Patil"
    assert me["role"] == "FARMER"
    assert me["demo_mode"] is True

    # -------------------------------------------------------------------------
    # STEP 2: Farm Setup & Verification
    # -------------------------------------------------------------------------
    farms_resp = await client.get("/api/v1/farms", headers=headers)
    assert farms_resp.status_code == 200
    farms_list = farms_resp.json()["farms"]

    if farms_list:
        farm = farms_list[0]
        farm_id = farm["id"]
    else:
        create_farm_resp = await client.post(
            "/api/v1/farms",
            json={
                "farm_name": "Patil Krishi Farm",
                "state": "Maharashtra",
                "district": "Nashik",
                "village": "Niphad",
                "latitude": 20.0768,
                "longitude": 74.0375,
                "land_area": 3.5,
                "land_area_unit": "acre",
            },
            headers=headers,
        )
        assert create_farm_resp.status_code == 201
        farm = create_farm_resp.json()
        farm_id = farm["id"]

    assert farm["farm_name"] == "Patil Krishi Farm"
    assert farm["district"] == "Nashik"
    assert farm["village"] == "Niphad"

    # -------------------------------------------------------------------------
    # STEP 3: Harvest Lot Creation
    # -------------------------------------------------------------------------
    create_lot_resp = await client.post(
        f"/api/v1/farms/{farm_id}/crop-lots",
        json={
            "farm_id": farm_id,
            "crop_name": "Tomato",
            "variety": "Abhinav (Fresh Table & Processing)",
            "quantity": 4000.0,
            "quantity_unit": "kg",
            "quality_grade": "A",
            "notes": "E2E Master Scenario Harvest Lot",
            "data_mode": "demo",
        },
        headers=headers,
    )
    assert create_lot_resp.status_code == 201
    crop_lot = create_lot_resp.json()
    lot_id = crop_lot["id"]
    assert crop_lot["crop_name"] == "Tomato"
    assert float(crop_lot["quantity"]) == 4000.0
    assert float(crop_lot["quantity_kg_normalized"]) == 4000.0

    # -------------------------------------------------------------------------
    # STEP 4: Market & Weather Intelligence
    # -------------------------------------------------------------------------
    market_resp = await client.get(
        "/api/v1/market-prices?commodity=Tomato&district=Nashik",
        headers=headers,
    )
    assert market_resp.status_code == 200
    m_data = market_resp.json()
    assert m_data["total_records"] > 0
    record = m_data["records"][0]
    assert record["commodity"] == "Tomato"
    assert record["freshness_status"] in ("LIVE", "CACHED", "DEMO")
    assert record["normalized_price_per_kg"] is not None

    weather_resp = await client.get(f"/api/v1/weather/farm/{farm_id}", headers=headers)
    assert weather_resp.status_code == 200
    w_data = weather_resp.json()
    assert w_data["farm_id"] == farm_id
    assert "current" in w_data["weather"]
    assert "daily_forecast" in w_data["weather"]
    assert "advisory" in w_data["weather"]

    # -------------------------------------------------------------------------
    # STEP 5: Profit Decision Engine Evaluation & Snapshot
    # -------------------------------------------------------------------------
    decision_resp = await client.post(
        "/api/v1/decision-engine/evaluate",
        json={
            "crop_lot_id": lot_id,
            "scenario_preset": "EXPECTED",
        },
        headers=headers,
    )
    assert decision_resp.status_code == 201
    decision = decision_resp.json()
    decision_id = decision["id"]
    assert decision["crop_lot_id"] == lot_id
    assert len(decision["options"]) > 0
    rec_opt = next((o for o in decision["options"] if o["is_recommended"]), decision["options"][0])
    assert rec_opt is not None
    assert rec_opt["feasibility_status"] in ("FEASIBLE", "CONDITIONALLY_FEASIBLE")

    # Verify immutable snapshot retrieval
    snap_resp = await client.get(f"/api/v1/decision-engine/decisions/{decision_id}", headers=headers)
    assert snap_resp.status_code == 200
    assert snap_resp.json()["id"] == decision_id

    # -------------------------------------------------------------------------
    # STEP 6: Buyer Selection & Execution Lifecycle
    # -------------------------------------------------------------------------
    offers_resp = await client.get("/api/v1/execution/buyer-offers?commodity=Tomato", headers=headers)
    assert offers_resp.status_code == 200
    offers = offers_resp.json()
    assert len(offers) > 0
    selected_offer = offers[0]

    exec_resp = await client.post(
        "/api/v1/execution/requests",
        json={
            "crop_lot_id": lot_id,
            "route_type": "DIRECT_BUYER",
            "buyer_id": selected_offer["buyer_id"],
            "buyer_offer_id": selected_offer["id"],
            "requested_quantity_kg": 4000.0,
            "indicative_unit_price": float(selected_offer["offered_price_per_kg"]),
            "indicative_total_value": float(selected_offer["offered_price_per_kg"]) * 4000.0,
            "indicative_logistics_cost": 3500.0,
            "indicative_net_payout": (float(selected_offer["offered_price_per_kg"]) * 4000.0) - 3500.0,
            "pickup_location": "Patil Krishi Farm, Gate No. 42, Niphad",
            "delivery_location": "Ambad Industrial Hub, Nashik",
        },
        headers=headers,
    )
    assert exec_resp.status_code == 201
    exec_req = exec_resp.json()
    exec_id = exec_req["id"]
    assert exec_req["status"] == "SUBMITTED"

    # Transition: SUBMITTED -> PROVIDER_ACCEPTED -> CONFIRMED
    p_acc_resp = await client.post(
        f"/api/v1/execution/requests/{exec_id}/transition",
        json={"to_status": "PROVIDER_ACCEPTED", "message": "Buyer procurement accepted request."},
        headers=headers,
    )
    assert p_acc_resp.status_code == 200
    assert p_acc_resp.json()["status"] == "PROVIDER_ACCEPTED"

    trans_resp = await client.post(
        f"/api/v1/execution/requests/{exec_id}/transition",
        json={"to_status": "CONFIRMED", "message": "Commercial order confirmed with capacity reservation."},
        headers=headers,
    )
    assert trans_resp.status_code == 200
    assert trans_resp.json()["status"] == "CONFIRMED"

    # -------------------------------------------------------------------------
    # STEP 7: Crop Rescue Assessment
    # -------------------------------------------------------------------------
    rescue_resp = await client.get(f"/api/v1/crop-rescue/lot/{lot_id}", headers=headers)
    assert rescue_resp.status_code == 200
    rescue = rescue_resp.json()
    assert rescue["crop_lot_id"] == lot_id
    assert len(rescue["salvage_pathways"]) > 0
    assert rescue["recommended_action"] is not None

    # -------------------------------------------------------------------------
    # STEP 8: Deal Agreement Generation & Explicit Acceptance
    # -------------------------------------------------------------------------
    agr_gen_resp = await client.post(
        f"/api/v1/protection/agreements/from-execution/{exec_id}",
        headers=headers,
    )
    assert agr_gen_resp.status_code == 201
    agr = agr_gen_resp.json()
    agr_id = agr["id"]
    assert agr["status"] == "PENDING_ACCEPTANCE"
    assert float(agr["agreed_quantity_kg"]) == 4000.0
    assert float(agr["gross_amount"]) == 66000.0
    assert float(agr["estimated_net_payout"]) == 66000.0

    # Accept agreement
    accept_resp = await client.post(
        f"/api/v1/protection/agreements/{agr_id}/accept",
        json={"notes": "Farmer accepted digital agreement terms."},
        headers=headers,
    )
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "ACCEPTED"

    # -------------------------------------------------------------------------
    # STEP 9: Delivery Verification & Bilateral Confirmation
    # -------------------------------------------------------------------------
    del_resp = await client.post(
        "/api/v1/protection/deliveries",
        json={
            "agreement_id": agr_id,
            "delivered_quantity_kg": 2000.0,
            "accepted_quantity_kg": 2000.0,
            "rejected_quantity_kg": 0.0,
            "delivery_location": "Ambad Industrial Hub, Nashik",
            "vehicle_number": "MH-15-EG-4412",
            "quality_notes": "First batch of 2,000 kg passed Grade A inspection.",
        },
        headers=headers,
    )
    assert del_resp.status_code == 201
    del_data = del_resp.json()
    del_id = del_data["id"]
    assert del_data["status"] == "PARTIALLY_DELIVERED"
    assert float(del_data["remaining_quantity_kg"]) == 2000.0

    # Confirm delivery
    conf_del_resp = await client.post(
        f"/api/v1/protection/deliveries/{del_id}/confirm",
        json={"confirmed": True, "notes": "Weighbridge certified Grade A."},
        headers=headers,
    )
    assert conf_del_resp.status_code == 200
    assert conf_del_resp.json()["farmer_confirmed"] is True

    # -------------------------------------------------------------------------
    # STEP 10: Transparent Payment Ledger Recording
    # -------------------------------------------------------------------------
    pay_resp = await client.post(
        "/api/v1/protection/payments",
        json={
            "agreement_id": agr_id,
            "amount_due": 66000.0,
            "amount_paid": 33000.0,
            "due_date": "2026-11-10T12:00:00Z",
            "payment_method": "BANK_TRANSFER",
            "payer_name": agr["partner_name"],
            "payee_name": "Ramesh Patil",
            "transaction_reference_id": "SIM-E2E-UTR-001",
            "notes": "50% advance payment credited against Batch 1 delivery.",
        },
        headers=headers,
    )
    assert pay_resp.status_code == 201
    pay_data = pay_resp.json()
    assert pay_data["payment_status"] == "PARTIALLY_PAID"
    assert float(pay_data["amount_paid"]) == 33000.0

    # -------------------------------------------------------------------------
    # STEP 11: Commercial Payment Reconciliation
    # -------------------------------------------------------------------------
    rec_resp = await client.get(
        f"/api/v1/protection/agreements/{agr_id}/reconciliation",
        headers=headers,
    )
    assert rec_resp.status_code == 200
    reconciliation = rec_resp.json()
    assert float(reconciliation["net_agreed_payout"]) == 66000.0
    assert float(reconciliation["total_paid"]) == 33000.0
    assert float(reconciliation["outstanding_balance"]) == 33000.0
    assert reconciliation["is_fully_paid"] is False

    # -------------------------------------------------------------------------
    # STEP 12: Dispute Management Workflow
    # -------------------------------------------------------------------------
    disp_resp = await client.post(
        "/api/v1/protection/disputes",
        json={
            "agreement_id": agr_id,
            "category": "PAYMENT_OVERDUE",
            "title": "Pending second installment past 3-day payment window",
            "description": "Batch 1 delivered and confirmed; balance payment overdue.",
            "disputed_amount": 33000.0,
        },
        headers=headers,
    )
    assert disp_resp.status_code == 201
    dispute = disp_resp.json()
    disp_id = dispute["id"]
    assert dispute["status"] == "OPEN"

    # Advance dispute status to UNDER_REVIEW then RESOLVED
    step1_resp = await client.post(
        f"/api/v1/protection/disputes/{disp_id}/status",
        json={
            "status": "UNDER_REVIEW",
            "notes": "Buyer procurement desk notified; payment batch scheduled for processing.",
        },
        headers=headers,
    )
    assert step1_resp.status_code == 200
    assert step1_resp.json()["status"] == "UNDER_REVIEW"

    step2_resp = await client.post(
        f"/api/v1/protection/disputes/{disp_id}/status",
        json={
            "status": "RESOLVED",
            "notes": "Payment processed and confirmed via bank transaction slip.",
            "resolution_notes": "Settled mutually without arbitration.",
        },
        headers=headers,
    )
    assert step2_resp.status_code == 200
    assert step2_resp.json()["status"] == "RESOLVED"

    # -------------------------------------------------------------------------
    # STEP 13: IoT Edge Telematics Ingestion & Monitoring
    # -------------------------------------------------------------------------
    reg_resp = await client.post(
        "/api/v1/iot/devices",
        json={
            "farm_id": farm_id,
            "device_code": "ESP32-E2E-MASTER-01",
            "device_name": "Tomato Polyhouse Node Master",
            "device_type": "ESP32_AGRI_NODE",
            "data_source": "SIMULATED",
            "sensor_capabilities": "SOIL_MOISTURE,AIR_TEMP,HUMIDITY,RAINFALL",
        },
        headers=headers,
    )
    assert reg_resp.status_code == 201
    device = reg_resp.json()

    # Ingest telemetry via simulator preset
    sim_resp = await client.post(
        "/api/v1/iot/simulator/run",
        json={
            "device_id": device["id"],
            "scenario_key": "DRY_SOIL_HEATWAVE",
            "duration_readings": 2,
        },
        headers=headers,
    )
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()
    assert "SIMULAT" in sim_data["disclaimer"].upper()
    assert sim_data["telemetry_response"]["ingested_count"] > 0

    # Query device telemetry
    telem_resp = await client.get(f"/api/v1/iot/devices/{device['id']}/telemetry", headers=headers)
    assert telem_resp.status_code == 200
    readings = telem_resp.json()
    assert len(readings) > 0
    assert readings[0]["source_type"] == "SIMULATED"

    # Check alerts generated
    alerts_resp = await client.get(f"/api/v1/iot/alerts?farm_id={farm_id}", headers=headers)
    assert alerts_resp.status_code == 200
    alerts = alerts_resp.json()
    assert isinstance(alerts, list)

    # -------------------------------------------------------------------------
    # STEP 14: Actual vs Expected Profit Reconciliation
    # -------------------------------------------------------------------------
    comp_resp = await client.get(
        f"/api/v1/decision-engine/outcome-comparison/{decision_id}",
        headers=headers,
    )
    assert comp_resp.status_code == 200
    comparison = comp_resp.json()
    assert comparison["decision_run_id"] == decision_id
    assert comparison["expected_quantity_kg"] is not None
    assert comparison["estimated_net_profit_inr"] is not None
    assert comparison["has_actual_outcome"] is True
    assert float(comparison["actual_quantity_kg"]) == 2000.0
    assert float(comparison["actual_net_proceeds_inr"]) == 33000.0
    assert comparison["status"] == "PARTIALLY_RECONCILED"

    # -------------------------------------------------------------------------
    # STEP 15: Protection Dashboard & Audit History
    # -------------------------------------------------------------------------
    dash_resp = await client.get("/api/v1/protection/dashboard", headers=headers)
    assert dash_resp.status_code == 200
    dash = dash_resp.json()
    assert dash["active_agreements_count"] >= 1
    assert float(dash["expected_payments_total"]) > 0.0
    assert float(dash["payments_received_total"]) > 0.0

    audit_resp = await client.get(f"/api/v1/protection/audit-events?agreement_id={agr_id}", headers=headers)
    assert audit_resp.status_code == 200
    events = audit_resp.json()
    assert len(events) >= 3
    event_types = [e["event_type"] for e in events]
    assert "AGREEMENT_CREATED" in event_types
    assert "AGREEMENT_ACCEPTED" in event_types
    assert "DELIVERY_LOGGED" in event_types
