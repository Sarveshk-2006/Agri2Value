# backend/tests/integration/test_protection_api.py
"""
Agri2Value — Integration Tests for Phase 5:
Farmer Protection, Deal Transparency & Financial Trust API.
"""
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import User, Farm, CropLot, ExecutionRequest, Buyer, BuyerOffer


@pytest_asyncio.fixture
async def setup_farmer_lot(db_session: AsyncSession, auth_headers: dict):
    """Seed test Farm and CropLot for logged in farmer Ramesh Patil."""
    # Find farmer user created by auth_headers
    from sqlalchemy import select
    user_res = await db_session.execute(select(User).where(User.phone == "9876543210"))
    farmer = user_res.scalar_one()

    farm = Farm(
        owner_user_id=farmer.id,
        farm_name="Patil Krishi Farm",
        state="Maharashtra",
        district="Nashik",
        village="Niphad",
        latitude=Decimal("20.0768"),
        longitude=Decimal("74.0375"),
        land_area=Decimal("3.5"),
        land_area_unit="acre",
    )
    db_session.add(farm)
    await db_session.flush()

    lot = CropLot(
        farm_id=farm.id,
        owner_user_id=farmer.id,
        crop_name="Tomato",
        variety="Abhinav Hybrid",
        quantity=Decimal("4000"),
        quantity_unit="kg",
        quantity_kg_normalized=Decimal("4000.0000"),
        quality_grade="A",
        status="DRAFT",
    )
    db_session.add(lot)
    await db_session.flush()

    b1 = Buyer(
        company_name="Sahyadri Agro-Retail Hub",
        contact_person="Vikram Shinde",
        phone="9822011223",
        district="Nashik",
        state="Maharashtra",
        address="MIDC Ambad, Nashik",
        buyer_type="DIRECT_RETAIL",
        data_mode="demo",
    )
    db_session.add(b1)
    await db_session.flush()

    offer = BuyerOffer(
        buyer_id=b1.id,
        commodity="Tomato",
        variety="Abhinav Hybrid",
        accepted_grades="A,B",
        min_quantity_kg=Decimal("1000"),
        max_quantity_kg=Decimal("10000"),
        offered_price_per_kg=Decimal("16.50"),
        price_unit="INR/kg",
        payment_terms_days=3,
        valid_until=datetime(2026, 12, 31, 23, 59, 59, tzinfo=timezone.utc),
        status="OPEN",
        data_mode="demo",
    )
    db_session.add(offer)
    await db_session.commit()

    return {"farmer": farmer, "farm": farm, "crop_lot": lot, "buyer": b1, "offer": offer}


@pytest.mark.asyncio
async def test_create_and_retrieve_deal_agreement(
    client: AsyncClient,
    auth_headers: dict,
    setup_farmer_lot: dict,
):
    lot = setup_farmer_lot["crop_lot"]
    buyer = setup_farmer_lot["buyer"]

    payload = {
        "crop_lot_id": lot.id,
        "partner_type": "BUYER",
        "partner_id": buyer.id,
        "partner_name": buyer.company_name,
        "partner_contact": "Vikram Shinde (+91 98220 11223)",
        "commodity": "Tomato",
        "variety": "Abhinav Hybrid",
        "quality_grade": "A",
        "agreed_quantity_kg": 4000.0,
        "quantity_unit": "kg",
        "agreed_unit_price": 16.50,
        "pricing_unit": "INR/kg",
        "logistics_deduction": 3500.0,
        "processing_deduction": 0.0,
        "quality_deduction": 0.0,
        "other_deductions": 500.0,
        "quality_requirements": "Grade A firm red fruit, minimum Brix 4.5",
        "delivery_location": "MIDC Ambad, Nashik",
        "payment_terms_days": 3,
        "farmer_notes": "Initial agreed deal terms",
    }

    # Create agreement
    res = await client.post("/api/v1/protection/agreements", json=payload, headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["agreement_number"].startswith("AGR-2026-")
    assert data["status"] == "PENDING_ACCEPTANCE"
    assert data["version"] == 1
    assert float(data["gross_amount"]) == 66000.0
    assert float(data["total_deductions"]) == 4000.0
    assert float(data["estimated_net_payout"]) == 62000.0
    assert data["terms_acknowledged"] is False

    agr_id = data["id"]

    # Retrieve agreement
    get_res = await client.get(f"/api/v1/protection/agreements/{agr_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["id"] == agr_id


@pytest.mark.asyncio
async def test_accept_deal_agreement(
    client: AsyncClient,
    auth_headers: dict,
    setup_farmer_lot: dict,
):
    lot = setup_farmer_lot["crop_lot"]
    buyer = setup_farmer_lot["buyer"]

    payload = {
        "crop_lot_id": lot.id,
        "partner_name": buyer.company_name,
        "commodity": "Tomato",
        "agreed_quantity_kg": 2000.0,
        "agreed_unit_price": 18.00,
        "delivery_location": "Nashik APMC",
        "payment_terms_days": 3,
    }
    c_res = await client.post("/api/v1/protection/agreements", json=payload, headers=auth_headers)
    agr_id = c_res.json()["id"]

    # Accept agreement
    acc_res = await client.post(
        f"/api/v1/protection/agreements/{agr_id}/accept",
        json={"terms_acknowledged": True, "notes": "Farmer accepted digital terms."},
        headers=auth_headers,
    )
    assert acc_res.status_code == 200
    data = acc_res.json()
    assert data["status"] == "ACCEPTED"
    assert data["terms_acknowledged"] is True
    assert data["farmer_accepted_at"] is not None


@pytest.mark.asyncio
async def test_amend_agreement_immutable_snapshot_and_risk_alert(
    client: AsyncClient,
    auth_headers: dict,
    setup_farmer_lot: dict,
):
    lot = setup_farmer_lot["crop_lot"]
    buyer = setup_farmer_lot["buyer"]

    # 1. Create and accept agreement v1
    c_res = await client.post(
        "/api/v1/protection/agreements",
        json={
            "crop_lot_id": lot.id,
            "partner_name": buyer.company_name,
            "commodity": "Tomato",
            "agreed_quantity_kg": 3000.0,
            "agreed_unit_price": 20.00,
            "delivery_location": "Nashik",
            "payment_terms_days": 3,
        },
        headers=auth_headers,
    )
    agr_id = c_res.json()["id"]

    await client.post(
        f"/api/v1/protection/agreements/{agr_id}/accept",
        json={"terms_acknowledged": True},
        headers=auth_headers,
    )

    # 2. Amend agreement: buyer requests price reduction from 20.00 to 18.00 and adds 800 deduction
    amend_payload = {
        "reason": "Market price softened due to excess regional arrivals at APMC.",
        "agreed_unit_price": 18.00,
        "logistics_deduction": 800.0,
    }
    amend_res = await client.post(
        f"/api/v1/protection/agreements/{agr_id}/amend",
        json=amend_payload,
        headers=auth_headers,
    )
    assert amend_res.status_code == 200
    data = amend_res.json()
    assert data["version"] == 2
    assert data["status"] == "PENDING_ACCEPTANCE"  # Must reset status
    assert len(data["amendments"]) == 1
    assert data["amendments"][0]["version"] == 1
    assert "20.00" in data["amendments"][0]["terms_snapshot_json"]

    # 3. Verify that an explainable risk alert was generated
    alerts_res = await client.get("/api/v1/protection/risk-alerts", headers=auth_headers)
    assert alerts_res.status_code == 200
    alerts = alerts_res.json()
    price_alerts = [a for a in alerts if a["risk_type"] == "PRICE_CHANGED_AFTER_ACCEPTANCE"]
    assert len(price_alerts) >= 1
    assert "reduced from INR 20.00 to INR 18.00" in price_alerts[0]["trigger_evidence"]


@pytest.mark.asyncio
async def test_create_agreement_from_execution_request(
    client: AsyncClient,
    auth_headers: dict,
    setup_farmer_lot: dict,
    db_session: AsyncSession,
):
    lot = setup_farmer_lot["crop_lot"]
    farmer = setup_farmer_lot["farmer"]
    buyer = setup_farmer_lot["buyer"]
    offer = setup_farmer_lot["offer"]

    # Create ExecutionRequest
    req = ExecutionRequest(
        crop_lot_id=lot.id,
        farmer_user_id=farmer.id,
        route_type="DIRECT_BUYER",
        status="CONFIRMED",
        buyer_id=buyer.id,
        buyer_offer_id=offer.id,
        requested_quantity_kg=Decimal("4000.0000"),
        indicative_unit_price=Decimal("16.50"),
        indicative_total_value=Decimal("66000.00"),
        indicative_logistics_cost=Decimal("3500.00"),
        indicative_net_payout=Decimal("62500.00"),
        pickup_location="Farm Gate",
        delivery_location="Sahyadri Hub, Nashik",
        data_mode="demo",
    )
    db_session.add(req)
    await db_session.commit()

    # Generate Agreement from Execution
    res = await client.post(
        f"/api/v1/protection/agreements/from-execution/{req.id}",
        headers=auth_headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["execution_request_id"] == req.id
    assert float(data["agreed_quantity_kg"]) == 4000.0
    assert float(data["agreed_unit_price"]) == 16.50
    assert float(data["logistics_deduction"]) == 3500.0
    assert data["partner_name"] == buyer.company_name


@pytest.mark.asyncio
async def test_partial_delivery_and_remaining_quantity(
    client: AsyncClient,
    auth_headers: dict,
    setup_farmer_lot: dict,
):
    lot = setup_farmer_lot["crop_lot"]
    buyer = setup_farmer_lot["buyer"]

    c_res = await client.post(
        "/api/v1/protection/agreements",
        json={
            "crop_lot_id": lot.id,
            "partner_name": buyer.company_name,
            "commodity": "Tomato",
            "agreed_quantity_kg": 4000.0,
            "agreed_unit_price": 15.00,
            "delivery_location": "Nashik APMC",
        },
        headers=auth_headers,
    )
    agr_id = c_res.json()["id"]

    # 1. Record Batch 1: 1,500 kg
    del_res = await client.post(
        "/api/v1/protection/deliveries",
        json={
            "agreement_id": agr_id,
            "delivered_quantity_kg": 1500.0,
            "accepted_quantity_kg": 1500.0,
            "rejected_quantity_kg": 0.0,
            "delivery_location": "Nashik APMC Gate 2",
            "vehicle_number": "MH-15-AB-1234",
            "quality_notes": "First partial batch in good condition.",
        },
        headers=auth_headers,
    )
    assert del_res.status_code == 201
    del1 = del_res.json()
    assert del1["status"] == "PARTIALLY_DELIVERED"
    assert float(del1["remaining_quantity_kg"]) == 2500.0

    # 2. Confirm delivery
    conf_res = await client.post(
        f"/api/v1/protection/deliveries/{del1['id']}/confirm",
        json={"confirmed": True},
        headers=auth_headers,
    )
    assert conf_res.status_code == 200
    assert conf_res.json()["farmer_confirmed"] is True


@pytest.mark.asyncio
async def test_payment_ledger_and_reconciliation(
    client: AsyncClient,
    auth_headers: dict,
    setup_farmer_lot: dict,
):
    lot = setup_farmer_lot["crop_lot"]
    buyer = setup_farmer_lot["buyer"]

    # 1. Create agreement for Net 50,000 INR
    c_res = await client.post(
        "/api/v1/protection/agreements",
        json={
            "crop_lot_id": lot.id,
            "partner_name": buyer.company_name,
            "commodity": "Tomato",
            "agreed_quantity_kg": 2500.0,
            "agreed_unit_price": 20.00,  # Gross 50,000
            "delivery_location": "Nashik",
        },
        headers=auth_headers,
    )
    agr_id = c_res.json()["id"]

    # 2. Record partial payment of 20,000 INR
    due_dt = (datetime.now(timezone.utc) + timedelta(days=3)).isoformat()
    pay_res = await client.post(
        "/api/v1/protection/payments",
        json={
            "agreement_id": agr_id,
            "amount_due": 50000.0,
            "amount_paid": 20000.0,
            "due_date": due_dt,
            "payment_method": "BANK_TRANSFER",
            "payer_name": buyer.company_name,
            "payee_name": "Ramesh Patil",
            "notes": "Advance payment for procurement batch.",
        },
        headers=auth_headers,
    )
    assert pay_res.status_code == 201
    pay_data = pay_res.json()
    assert pay_data["payment_status"] == "PARTIALLY_PAID"

    # 3. Check reconciliation endpoint
    rec_res = await client.get(f"/api/v1/protection/agreements/{agr_id}/reconciliation", headers=auth_headers)
    assert rec_res.status_code == 200
    rec = rec_res.json()
    assert float(rec["net_agreed_payout"]) == 50000.0
    assert float(rec["total_paid"]) == 20000.0
    assert float(rec["outstanding_balance"]) == 30000.0
    assert rec["is_fully_paid"] is False


@pytest.mark.asyncio
async def test_dispute_creation_and_lifecycle(
    client: AsyncClient,
    auth_headers: dict,
    setup_farmer_lot: dict,
):
    lot = setup_farmer_lot["crop_lot"]
    buyer = setup_farmer_lot["buyer"]

    c_res = await client.post(
        "/api/v1/protection/agreements",
        json={
            "crop_lot_id": lot.id,
            "partner_name": buyer.company_name,
            "commodity": "Tomato",
            "agreed_quantity_kg": 1000.0,
            "agreed_unit_price": 20.00,
            "delivery_location": "Nashik",
        },
        headers=auth_headers,
    )
    agr_id = c_res.json()["id"]

    # 1. Raise dispute
    disp_res = await client.post(
        "/api/v1/protection/disputes",
        json={
            "agreement_id": agr_id,
            "category": "PAYMENT_OVERDUE",
            "title": "Payment not credited after 7 days",
            "description": "Produce delivered and accepted at weighbridge, but payment remains unpaid past due date.",
            "disputed_amount": 20000.0,
        },
        headers=auth_headers,
    )
    assert disp_res.status_code == 201
    disp = disp_res.json()
    disp_id = disp["id"]
    assert disp["status"] == "OPEN"
    assert disp["category"] == "PAYMENT_OVERDUE"
    assert "Not a court" in disp["disclaimer"]

    # Check agreement transitioned to DISPUTED
    agr_res = await client.get(f"/api/v1/protection/agreements/{agr_id}", headers=auth_headers)
    assert agr_res.json()["status"] == "DISPUTED"

    # 2. Update dispute to RESOLVED
    update_res = await client.post(
        f"/api/v1/protection/disputes/{disp_id}/status",
        json={
            "status": "RESOLVED",
            "notes": "Buyer released RTGS payment with transaction UTR #SIM-9912.",
            "resolution_notes": "Payment credited and confirmed by farmer.",
        },
        headers=auth_headers,
    )
    assert update_res.status_code == 200
    updated_disp = update_res.json()
    assert updated_disp["status"] == "RESOLVED"
    assert len(updated_disp["events"]) == 2


@pytest.mark.asyncio
async def test_farmer_ownership_isolation(
    client: AsyncClient,
    auth_headers: dict,
    setup_farmer_lot: dict,
):
    lot = setup_farmer_lot["crop_lot"]
    buyer = setup_farmer_lot["buyer"]

    # Create agreement for Farmer Ramesh
    c_res = await client.post(
        "/api/v1/protection/agreements",
        json={
            "crop_lot_id": lot.id,
            "partner_name": buyer.company_name,
            "commodity": "Tomato",
            "agreed_quantity_kg": 1000.0,
            "agreed_unit_price": 20.00,
            "delivery_location": "Nashik",
        },
        headers=auth_headers,
    )
    agr_id = c_res.json()["id"]

    # Log in as a DIFFERENT farmer (Suresh Gaikwad)
    login2 = await client.post(
        "/api/v1/auth/demo-login",
        json={"phone": "9811122233", "demo_code": "123456", "full_name": "Suresh Gaikwad"},
    )
    token2 = login2.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token2}"}

    # Suresh attempts to view Ramesh's agreement -> 403 Forbidden
    res = await client.get(f"/api/v1/protection/agreements/{agr_id}", headers=headers2)
    assert res.status_code == 403
    msg = res.json().get("message") or res.json().get("detail", "")
    assert "Access denied" in msg


@pytest.mark.asyncio
async def test_protection_dashboard_metrics(
    client: AsyncClient,
    auth_headers: dict,
    setup_farmer_lot: dict,
):
    res = await client.get("/api/v1/protection/dashboard", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "active_agreements_count" in data
    assert "expected_payments_total" in data
    assert "payments_received_total" in data
    assert "outstanding_balance_total" in data
    assert "open_disputes_count" in data
    assert "active_risk_alerts_count" in data
    assert "recent_events" in data
