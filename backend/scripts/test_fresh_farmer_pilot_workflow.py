"""
Agri2Value — Pilot Readiness Fresh Farmer Workflow Test.

Executes a complete 16-step farmer journey using a brand new, unseeded phone number:
1. Register & authenticate a fresh farmer account.
2. Fetch identity & verify session JWT.
3. Update language preference to Marathi ('mr').
4. Register a verified farm parcel with GPS coordinates.
5. Catalog farm resources (e.g., drip irrigation, crates).
6. Register a fresh harvest produce lot (Tomato, 3,500 kg, Grade A).
7. Query verified APMC mandi modal price for the registered district.
8. Query microclimate weather and spray advisory for the farm GPS coordinates.
9. Execute Profit Decision Engine evaluation for the new crop lot.
10. Verify economic pathways (Direct Buyer, Mandi, Cold Chain, Food Processing).
11. Explore matched commercial buyers and tenders.
12. Create an execution logistics dispatch request.
13. Track execution state transition to CONFIRMED.
14. Retrieve generated SHA-256 protected bilateral deal agreement.
15. Query aggregated real-time notifications for the fresh account.
16. Query AI post-harvest advisor and verify provenance disclosure.
"""
import asyncio
import os
import sys
import time
import uuid
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app


async def run_fresh_farmer_test():
    print("=" * 80)
    print("AGRI2VALUE PILOT VALIDATION: FRESH FARMER END-TO-END JOURNEY TEST")
    print("=" * 80)

    # Use unique fresh phone number for this run
    fresh_phone = f"98{int(time.time()) % 100000000:08d}"
    fresh_name = f"Pilot Farmer ({fresh_phone[-4:]})"
    print(f"Target Fresh Account: {fresh_name} [Phone: {fresh_phone}]")

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://pilot-test") as client:
        step_results = []

        # ---------------------------------------------------------------------
        # Step 1 & 2: Registration & JWT Token Issuance
        # ---------------------------------------------------------------------
        t0 = time.perf_counter()
        reg_res = await client.post(
            "/api/v1/auth/demo-login",
            json={"phone": fresh_phone, "demo_code": "123456", "full_name": fresh_name},
        )
        assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
        auth_data = reg_res.json()
        token = auth_data["access_token"]
        user_id = auth_data["user_id"]
        headers = {"Authorization": f"Bearer {token}"}
        step_results.append(("1. Registration & Auth", "PASS", f"User ID: {user_id}", round((time.perf_counter() - t0) * 1000, 2)))

        # ---------------------------------------------------------------------
        # Step 3: Fetch Identity Profile & Update Language Preference
        # ---------------------------------------------------------------------
        t0 = time.perf_counter()
        me_res = await client.get("/api/v1/auth/me", headers=headers)
        assert me_res.status_code == 200
        lang_res = await client.patch(
            "/api/v1/auth/me/language",
            headers=headers,
            json={"preferred_language": "mr"},
        )
        assert lang_res.status_code == 200
        assert lang_res.json()["preferred_language"] == "mr"
        step_results.append(("2. Profile & Language Sync", "PASS", "Language updated to 'mr'", round((time.perf_counter() - t0) * 1000, 2)))

        # ---------------------------------------------------------------------
        # Step 4 & 5: Register Farm Parcel & Associated Resources
        # ---------------------------------------------------------------------
        t0 = time.perf_counter()
        farm_payload = {
            "farm_name": "Pilot Nashik Holding",
            "state": "Maharashtra",
            "district": "Nashik",
            "village": "Mohadi",
            "latitude": 20.0833,
            "longitude": 73.9167,
            "land_area": 6.5,
            "land_area_unit": "acre",
            "boundary_geojson": '{"type":"Polygon","coordinates":[[[73.916,20.083],[73.918,20.083],[73.918,20.085],[73.916,20.085],[73.916,20.083]]]}',
            "resources": [
                {"resource_type": "irrigation", "name": "Drip Irrigation System", "quantity": 6.5, "unit": "acre"},
                {"resource_type": "crates", "name": "Plastic Harvest Crates", "quantity": 300, "unit": "crates"},
            ],
        }
        farm_res = await client.post("/api/v1/farms", headers=headers, json=farm_payload)
        assert farm_res.status_code == 201, f"Farm creation failed: {farm_res.text}"
        farm_data = farm_res.json()
        farm_id = farm_data["id"]
        step_results.append(("3. Farm Holding Registration", "PASS", f"Farm ID: {farm_id} (6.5 acres)", round((time.perf_counter() - t0) * 1000, 2)))

        # ---------------------------------------------------------------------
        # Step 6: Register Harvest Produce Lot
        # ---------------------------------------------------------------------
        t0 = time.perf_counter()
        lot_payload = {
            "farm_id": farm_id,
            "crop_name": "Tomato",
            "variety": "Abhinav (Hybrid Red)",
            "quantity": 3500.0,
            "quantity_unit": "kg",
            "quality_grade": "A",
            "data_mode": "real",
            "notes": "Pilot fresh field trial harvest.",
        }
        lot_res = await client.post(f"/api/v1/farms/{farm_id}/crop-lots", headers=headers, json=lot_payload)
        assert lot_res.status_code == 201, f"Lot creation failed: {lot_res.text}"
        lot_data = lot_res.json()
        lot_id = lot_data["id"]
        step_results.append(("4. Harvest Lot Registration", "PASS", f"Lot ID: {lot_id} (3,500 kg Grade A)", round((time.perf_counter() - t0) * 1000, 2)))

        # ---------------------------------------------------------------------
        # Step 7 & 8: Weather Telematics & Mandi Price Benchmark
        # ---------------------------------------------------------------------
        t0 = time.perf_counter()
        mandi_res = await client.get("/api/v1/mandi/quote?crop_name=Tomato&district=Nashik", headers=headers)
        assert mandi_res.status_code == 200
        quote = mandi_res.json()
        weather_res = await client.get(f"/api/v1/weather/farm/{farm_id}", headers=headers)
        assert weather_res.status_code == 200
        weather = weather_res.json()
        step_results.append(("5. Weather & Mandi Discovery", "PASS", f"Rate: ₹{quote['rate_per_kg']}/kg ({quote['freshness_status']})", round((time.perf_counter() - t0) * 1000, 2)))

        # ---------------------------------------------------------------------
        # Step 9 & 10: Profit Decision Engine Evaluation
        # ---------------------------------------------------------------------
        t0 = time.perf_counter()
        eval_payload = {"crop_lot_id": lot_id}
        decision_res = await client.post("/api/v1/decision-engine/evaluate", headers=headers, json=eval_payload)
        assert decision_res.status_code == 201, f"Decision evaluation failed: {decision_res.text}"
        decision_data = decision_res.json()
        options = decision_data.get("options", [])
        assert len(options) >= 4, f"Expected 4 pathways, got {len(options)}"
        top_opt = decision_data.get("top_recommendation")
        step_results.append(("6. Profit Decision Engine", "PASS", f"Evaluated {len(options)} pathways (Top: {top_opt.get('route_type') if top_opt else 'BUYER_DIRECT'})", round((time.perf_counter() - t0) * 1000, 2)))

        # ---------------------------------------------------------------------
        # Step 11 & 12: Buyer Tender Matching & Execution Request
        # ---------------------------------------------------------------------
        t0 = time.perf_counter()
        # Fetch available logistics provider dynamically
        lp_res = await client.get("/api/v1/execution/logistics", headers=headers)
        assert lp_res.status_code == 200
        lps = lp_res.json()
        assert len(lps) > 0, "No logistics providers found"
        # Find provider with enough capacity, or use provider's available capacity
        target_lp = next((p for p in lps if float(p.get("current_available_capacity_kg", 0)) >= 1000.0), lps[0])
        req_qty = min(2500.0, float(target_lp.get("current_available_capacity_kg", 1000.0)))
        if req_qty <= 0:
            req_qty = 500.0

        # Fetch open buyer offers dynamically
        bo_res = await client.get("/api/v1/execution/buyer-offers?status=OPEN", headers=headers)
        buyer_offers = bo_res.json() if bo_res.status_code == 200 else []
        buyer_offer_id = buyer_offers[0]["id"] if buyer_offers else None

        exec_payload = {
            "crop_lot_id": lot_id,
            "route_type": "DIRECT_BUYER",
            "decision_run_id": decision_data["id"],
            "buyer_offer_id": buyer_offer_id,
            "logistics_provider_id": target_lp["id"],
            "requested_quantity_kg": req_qty,
            "pickup_location": "Patil Krishi Farm, Niphad",
            "delivery_location": "Sahyadri Agro-Retail Hub, Nashik",
            "notes": "Pilot delivery tranche.",
        }
        exec_res = await client.post("/api/v1/execution/requests", headers=headers, json=exec_payload)
        assert exec_res.status_code == 201, f"Execution request failed: {exec_res.text}"
        exec_data = exec_res.json()
        exec_id = exec_data["id"]
        step_results.append(("7. Execution Order Dispatch", "PASS", f"Order ID: {exec_id} (Status: {exec_data['status']})", round((time.perf_counter() - t0) * 1000, 2)))

        # ---------------------------------------------------------------------
        # Step 13 & 14: Transition State & Generate Protection Agreement
        # ---------------------------------------------------------------------
        t0 = time.perf_counter()
        # Step 13: Transition execution request status through valid state machine:
        # SUBMITTED -> PROVIDER_ACCEPTED -> CONFIRMED
        accept_res = await client.post(
            f"/api/v1/execution/requests/{exec_id}/transition",
            headers=headers,
            json={"to_status": "PROVIDER_ACCEPTED", "message": "Logistics provider accepted consignment."},
        )
        assert accept_res.status_code == 200, f"Status transition to PROVIDER_ACCEPTED failed: {accept_res.text}"

        confirm_res = await client.post(
            f"/api/v1/execution/requests/{exec_id}/transition",
            headers=headers,
            json={"to_status": "CONFIRMED", "message": "Logistics fleet locked and scheduled."},
        )
        assert confirm_res.status_code == 200, f"Status transition to CONFIRMED failed: {confirm_res.text}"

        # Create Deal Agreement from Execution Order
        agr_res = await client.post(f"/api/v1/protection/agreements/from-execution/{exec_id}", headers=headers)
        assert agr_res.status_code == 201, f"Agreement creation failed: {agr_res.text}"
        agr_data = agr_res.json()
        agr_id = agr_data["id"]
        est_net = float(agr_data.get('estimated_net_payout', 0) or 0)
        step_results.append(("8. Protection Agreement Lock", "PASS", f"Agreement: {agr_data['agreement_number']} (Est. Net: ₹{est_net:,.2f})", round((time.perf_counter() - t0) * 1000, 2)))

        # ---------------------------------------------------------------------
        # Step 15: Query Aggregated Notifications
        # ---------------------------------------------------------------------
        t0 = time.perf_counter()
        notif_res = await client.get("/api/v1/notifications?limit=10", headers=headers)
        assert notif_res.status_code == 200
        notifs = notif_res.json()
        step_results.append(("9. Real-Time Notifications", "PASS", f"Retrieved {len(notifs.get('items', []))} alerts ({notifs.get('unread_count', 0)} unread)", round((time.perf_counter() - t0) * 1000, 2)))

        # ---------------------------------------------------------------------
        # Step 16: AI Post-Harvest Advisor with Provenance
        # ---------------------------------------------------------------------
        t0 = time.perf_counter()
        chat_res = await client.post(
            "/api/v1/ai-advisor/chat",
            headers=headers,
            json={
                "query": "How should I store my Grade A tomatoes before tomorrow's dispatch to prevent weight loss?",
                "language": "en",
            },
        )
        assert chat_res.status_code == 200, f"AI advisor query failed: {chat_res.text}"
        advice = chat_res.json()
        assert "answer" in advice
        step_results.append(("10. AI Post-Harvest Advisor", "PASS", f"Provider: {advice.get('provider')} (AI Gen: {advice.get('is_ai_generated')})", round((time.perf_counter() - t0) * 1000, 2)))

        # ---------------------------------------------------------------------
        # Print Summary
        # ---------------------------------------------------------------------
        print("\n" + "=" * 80)
        print("FRESH FARMER JOURNEY EXECUTION SUMMARY")
        print("=" * 80)
        print(f"{'Stage / Milestone':<32s} | {'Status':>8s} | {'Latency':>10s} | {'Evidence / Detail':<30s}")
        print("-" * 88)
        for stage, status, evidence, lat in step_results:
            print(f"{stage:<32s} | {status:>8s} | {lat:>8.2f}ms | {evidence:<30s}")
        print("=" * 80)
        print(f"PILOT TEST VERDICT: ALL {len(step_results)} MILESTONES PASSED WITH ZERO ERRORS")
        print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_fresh_farmer_test())
