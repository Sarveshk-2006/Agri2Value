# backend/tests/integration/test_phase4_intelligence_and_security.py
"""
Integration tests for Phase 4:
1. Security headers verification (X-Frame-Options, X-Content-Type-Options, etc.)
2. AI Post-Harvest Advisor with context injection and honest provenance
3. Aggregated Notifications with read/unread state management
4. Tenant isolation (IDOR protection verification)
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_security_headers_present(client: AsyncClient):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.headers.get("x-content-type-options") == "nosniff"
    assert resp.headers.get("x-frame-options") == "DENY"
    assert resp.headers.get("x-xss-protection") == "1; mode=block"
    assert resp.headers.get("referrer-policy") == "strict-origin-when-cross-origin"


@pytest.mark.asyncio
async def test_ai_advisor_chat_with_context(client: AsyncClient, auth_headers: dict):
    # Ask price and profit question
    payload = {
        "query": "What is the best market price and profit route for my tomato harvest?",
        "language": "en",
    }
    resp = await client.post("/api/v1/ai-advisor/chat", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()

    assert "answer" in data
    assert len(data["answer"]) > 20
    assert "provider" in data
    assert "model_name" in data
    assert "confidence_score" in data
    assert len(data["suggested_actions"]) >= 1
    assert "disclaimer" in data
    # Provenance honesty check
    assert data["provider"] in ("google_gemini", "deterministic_agronomy_rules")


@pytest.mark.asyncio
async def test_notifications_lifecycle(client: AsyncClient, auth_headers: dict):
    # 1. Fetch aggregated notifications
    list_resp = await client.get("/api/v1/notifications", headers=auth_headers)
    assert list_resp.status_code == 200
    data = list_resp.json()
    assert "items" in data
    assert "unread_count" in data
    assert "total" in data

    if data["items"]:
        first_notif = data["items"][0]
        notif_id = first_notif["id"]

        # 2. Mark specific notification as read
        read_resp = await client.post(f"/api/v1/notifications/{notif_id}/read", headers=auth_headers)
        assert read_resp.status_code == 200
        assert read_resp.json()["success"] is True

        # 3. Mark all as read
        mark_all = await client.post("/api/v1/notifications/mark-all-read", headers=auth_headers)
        assert mark_all.status_code == 200
        assert mark_all.json()["unread_count"] == 0


@pytest.mark.asyncio
async def test_cross_tenant_idor_protection(client: AsyncClient):
    # Farmer A setup
    login_a = await client.post(
        "/api/v1/auth/demo-login",
        json={"phone": "9111111111", "demo_code": "123456", "full_name": "Farmer Alpha"},
    )
    headers_a = {"Authorization": f"Bearer {login_a.json()['access_token']}"}

    # Farmer B setup
    login_b = await client.post(
        "/api/v1/auth/demo-login",
        json={"phone": "9222222222", "demo_code": "123456", "full_name": "Farmer Beta"},
    )
    headers_b = {"Authorization": f"Bearer {login_b.json()['access_token']}"}

    # 1. Farmer A creates Farm & Lot
    farm_resp = await client.post(
        "/api/v1/farms",
        json={"farm_name": "Alpha Private Farm", "state": "Maharashtra", "district": "Nashik", "village": "Niphad"},
        headers=headers_a,
    )
    assert farm_resp.status_code == 201
    farm_a_id = farm_resp.json()["id"]

    lot_resp = await client.post(
        f"/api/v1/farms/{farm_a_id}/crop-lots",
        json={
            "farm_id": farm_a_id,
            "crop_name": "Grapes",
            "quantity": "5000",
            "quantity_unit": "kg",
            "quality_grade": "A",
            "status": "READY_FOR_ANALYSIS",
        },
        headers=headers_a,
    )
    assert lot_resp.status_code == 201
    lot_a_id = lot_resp.json()["id"]

    # 2. Farmer B attempts to read Farmer A's Farm -> MUST 404 (isolation)
    get_farm_b = await client.get(f"/api/v1/farms/{farm_a_id}", headers=headers_b)
    assert get_farm_b.status_code == 404

    # 3. Farmer B attempts to patch Farmer A's Farm -> MUST 404
    patch_farm_b = await client.patch(
        f"/api/v1/farms/{farm_a_id}",
        json={"farm_name": "Hacked Farm"},
        headers=headers_b,
    )
    assert patch_farm_b.status_code == 404

    # 4. Farmer B attempts to read Farmer A's Crop Lot -> MUST 404
    get_lot_b = await client.get(f"/api/v1/crop-lots/{lot_a_id}", headers=headers_b)
    assert get_lot_b.status_code == 404

    # 5. Farmer B attempts to delete Farmer A's Crop Lot -> MUST 404
    del_lot_b = await client.delete(f"/api/v1/crop-lots/{lot_a_id}", headers=headers_b)
    assert del_lot_b.status_code == 404

    # 6. Farmer B attempts to run profit evaluation on Farmer A's Crop Lot -> MUST 404 or 403
    eval_b = await client.post(
        "/api/v1/decision-engine/evaluate",
        json={"crop_lot_id": lot_a_id},
        headers=headers_b,
    )
    assert eval_b.status_code in (403, 404)

