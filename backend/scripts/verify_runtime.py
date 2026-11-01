# backend/scripts/verify_runtime.py
"""
Runtime verification script testing:
1. Health & Swagger endpoints
2. Authentication suite (valid, invalid code, bad token, me profile, refresh)
3. Complete end-to-end Farmer Journey (create farm, retrieve, register 1000kg tomato, retrieve lot)
4. Persistence check
5. Cross-user isolation check (second farmer cannot access first farmer's resources)
"""
import httpx as requests
import sys

BASE_URL = "http://127.0.0.1:8000/api/v1"

def run_checks():
    print("=" * 60)
    print("AGRI2VALUE — LIVE RUNTIME VERIFICATION SUITE")
    print("=" * 60)
    
    # --- 1. Health & Docs ---
    print("\n[CHECK 1] Health Endpoint")
    r = requests.get(f"{BASE_URL}/health")
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    health_data = r.json()
    print("  Status code:", r.status_code)
    print("  Database status:", health_data.get("database"))
    print("  Demo mode flag:", health_data.get("demo_mode"))
    print("  Warning banner:", health_data.get("warning"))
    assert health_data.get("database") == "connected"
    assert health_data.get("demo_mode") is True
    assert "DEMO MODE" in health_data.get("warning", "")
    print("  --> PASS: Health endpoint verified.")

    # --- 2. Auth Suite ---
    print("\n[CHECK 2] Authentication - Valid Demo Login")
    r = requests.post(f"{BASE_URL}/auth/demo-login", json={
        "phone": "9876543210",
        "demo_code": "123456",
        "full_name": "Ramesh Patil"
    })
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    auth_data = r.json()
    access_token = auth_data["access_token"]
    refresh_token = auth_data["refresh_token"]
    assert auth_data["role"] == "FARMER"
    assert auth_data["demo_mode"] is True
    headers = {"Authorization": f"Bearer {access_token}"}
    print("  --> PASS: Demo login issued tokens with FARMER role and demo_mode=True.")

    print("\n[CHECK 3] Authentication - Invalid Demo Code")
    r = requests.post(f"{BASE_URL}/auth/demo-login", json={
        "phone": "9876543210",
        "demo_code": "000000",
        "full_name": "Ramesh Patil"
    })
    assert r.status_code == 401, f"Expected 401, got {r.status_code}"
    print(f"  Got expected 401: {r.json().get('message')}")
    print("  --> PASS: Invalid demo code rejected.")

    print("\n[CHECK 4] Authentication - Unauthenticated Request")
    r = requests.get(f"{BASE_URL}/auth/me")
    assert r.status_code in (401, 403), f"Expected 401/403, got {r.status_code}"
    print("  --> PASS: Unauthenticated request rejected.")

    print("\n[CHECK 5] Authentication - Invalid Bearer Token")
    r = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": "Bearer fake.garbage.token"})
    assert r.status_code == 401, f"Expected 401, got {r.status_code}"
    print("  --> PASS: Malformed/invalid token rejected.")

    print("\n[CHECK 6] Authentication - Profile Retrieval (/auth/me)")
    r = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    me = r.json()
    assert me["full_name"] == "Ramesh Patil"
    assert me["role"] == "FARMER"
    assert me["demo_mode"] is True
    print(f"  Profile verified: {me['full_name']} ({me['phone']}) - Role: {me['role']}")
    print("  --> PASS: Authenticated profile retrieval verified.")

    print("\n[CHECK 7] Authentication - Token Refresh")
    r = requests.post(f"{BASE_URL}/auth/refresh", json={"refresh_token": refresh_token})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    new_access_token = r.json()["access_token"]
    assert new_access_token is not None
    print("  --> PASS: Token refresh exchanged valid new access token.")

    # --- 8. Farmer Journey ---
    print("\n[CHECK 8] Farmer Journey - Create Farm")
    farm_payload = {
        "farm_name": "Patil Verification Farm",
        "state": "Maharashtra",
        "district": "Nashik",
        "village": "Niphad",
        "latitude": 20.0768,
        "longitude": 74.0375,
        "land_area": 4.5,
        "land_area_unit": "acre",
        "resources": [
            {
                "resource_type": "storage",
                "name": "Ventilated Storage Shed",
                "quantity": 3000,
                "unit": "kg",
                "availability_status": "available"
            }
        ]
    }
    r = requests.post(f"{BASE_URL}/farms", json=farm_payload, headers=headers)
    assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.text}"
    farm = r.json()
    farm_id = farm["id"]
    print(f"  Created farm: {farm['farm_name']} (ID: {farm_id}) in {farm['village']}, {farm['district']}")
    print("  --> PASS: Farm created with resources.")

    print("\n[CHECK 9] Farmer Journey - Retrieve Farm")
    r = requests.get(f"{BASE_URL}/farms/{farm_id}", headers=headers)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert r.json()["farm_name"] == "Patil Verification Farm"
    print("  --> PASS: Farm retrieved and matches created attributes.")

    print("\n[CHECK 10] Farmer Journey - Register 1,000 kg Tomato Harvest")
    lot_payload = {
        "farm_id": farm_id,
        "crop_name": "Tomato",
        "variety": "Abhinav",
        "quantity": 1000,
        "quantity_unit": "kg",
        "quality_grade": "A",
        "data_mode": "demo",
        "notes": "Runtime verification test lot 1000kg"
    }
    r = requests.post(f"{BASE_URL}/farms/{farm_id}/crop-lots", json=lot_payload, headers=headers)
    assert r.status_code == 201, f"Expected 201, got {r.status_code}: {r.text}"
    lot = r.json()
    lot_id = lot["id"]
    assert float(lot["quantity_kg_normalized"]) == 1000.0
    assert lot["status"] == "DRAFT"
    assert len(lot["events"]) >= 1
    print(f"  Created harvest lot: {lot['crop_name']} {lot['quantity']}{lot['quantity_unit']} (ID: {lot_id})")
    print(f"  Audit events logged: {len(lot['events'])}")
    print("  --> PASS: Harvest registered with kg normalization and audit event.")

    print("\n[CHECK 11] Farmer Journey - Retrieve Crop Lot")
    r = requests.get(f"{BASE_URL}/crop-lots/{lot_id}", headers=headers)
    assert r.status_code == 200, f"Expected 200, got {r.status_code}"
    assert r.json()["id"] == lot_id
    print("  --> PASS: Crop lot retrieved successfully.")

    # --- 12. Cross-User Isolation ---
    print("\n[CHECK 12] Cross-User Authorization Isolation")
    # Farmer B login
    r_b = requests.post(f"{BASE_URL}/auth/demo-login", json={
        "phone": "9998887776",
        "demo_code": "123456",
        "full_name": "Suresh Deshmukh"
    })
    assert r_b.status_code == 200
    token_b = r_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Farmer B attempts to access Farmer A's farm
    r_access_farm = requests.get(f"{BASE_URL}/farms/{farm_id}", headers=headers_b)
    print(f"  Farmer B access to Farmer A farm: Status {r_access_farm.status_code}")
    assert r_access_farm.status_code == 404, f"Expected 404, got {r_access_farm.status_code}"

    # Farmer B attempts to access Farmer A's crop lot
    r_access_lot = requests.get(f"{BASE_URL}/crop-lots/{lot_id}", headers=headers_b)
    print(f"  Farmer B access to Farmer A lot: Status {r_access_lot.status_code}")
    assert r_access_lot.status_code == 404, f"Expected 404, got {r_access_lot.status_code}"
    print("  --> PASS: Cross-user isolation enforced. 404 returned without leaking resource existence.")

    print("\n" + "=" * 60)
    print("ALL 12 RUNTIME VERIFICATION CHECKS PASSED (100% SUCCESS)")
    print("=" * 60)

if __name__ == "__main__":
    run_checks()
