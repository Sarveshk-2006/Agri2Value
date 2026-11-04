"""
AGRI2VALUE — Automated Endpoint Performance Benchmark (Phase 7)
Evaluates response latency across the 7 critical system endpoints.
"""

import time
import statistics
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_endpoint_latency_benchmarks(client: AsyncClient):
    print("\n" + "=" * 80)
    print("AGRI2VALUE PHASE 7: 7-ENDPOINT PERFORMANCE & LATENCY BENCHMARK")
    print("=" * 80)

    # 1. Login
    login_res = await client.post(
        "/api/v1/auth/demo-login",
        json={"phone": "9876543210", "demo_code": "123456", "full_name": "Ramesh Patil"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Setup Farm, Crop Lot & IoT Device
    farm_res = await client.post(
        "/api/v1/farms",
        json={
            "farm_name": "Benchmark Farm",
            "state": "Maharashtra",
            "district": "Nashik",
            "taluka": "Niphad",
            "village": "Pimpalgaon",
            "total_area_acres": 4.0,
            "soil_type": "BLACK_REGUR",
            "irrigation_source": "DRIP",
        },
        headers=headers,
    )
    assert farm_res.status_code == 201
    farm_id = farm_res.json()["id"]

    lot_res = await client.post(
        f"/api/v1/farms/{farm_id}/crop-lots",
        json={
            "farm_id": farm_id,
            "crop_name": "Tomato",
            "variety": "Abhinav",
            "quantity": 4000.0,
            "quantity_unit": "kg",
            "quality_grade": "A",
            "data_mode": "demo",
        },
        headers=headers,
    )
    assert lot_res.status_code == 201
    lot_id = lot_res.json()["id"]

    dev_res = await client.post(
        "/api/v1/iot/devices",
        json={
            "farm_id": farm_id,
            "device_code": "ESP32-BENCH-01",
            "device_name": "Benchmark Node",
            "device_type": "ESP32_AGRI_NODE",
            "sensor_capabilities": "SOIL_MOISTURE,AIR_TEMP",
        },
        headers=headers,
    )
    assert dev_res.status_code == 201
    dev = dev_res.json()
    device_code = dev["device_code"]
    raw_key = dev["raw_api_key"]

    endpoints = [
        {
            "name": "Health Status",
            "method": "GET",
            "url": "/api/v1/health",
            "kwargs": {},
        },
        {
            "name": "Farmer Authentication (Demo Login)",
            "method": "POST",
            "url": "/api/v1/auth/demo-login",
            "kwargs": {
                "json": {"phone": "9876543210", "demo_code": "123456", "full_name": "Ramesh Patil"}
            },
        },
        {
            "name": "Market Mandi Prices Query",
            "method": "GET",
            "url": "/api/v1/market-prices?commodity=Tomato&district=Nashik",
            "kwargs": {"headers": headers},
        },
        {
            "name": "Hyperlocal Weather Intelligence",
            "method": "GET",
            "url": "/api/v1/weather?lat=20.0&lon=74.0",
            "kwargs": {"headers": headers},
        },
        {
            "name": "Profit Decision Engine Evaluation",
            "method": "POST",
            "url": "/api/v1/decision-engine/evaluate",
            "kwargs": {
                "json": {
                    "crop_lot_id": lot_id,
                    "storage_horizon_days": 14,
                    "urgent_cash_need": False,
                },
                "headers": headers,
            },
        },
        {
            "name": "Farmer Protection Dashboard",
            "method": "GET",
            "url": "/api/v1/protection/dashboard",
            "kwargs": {"headers": headers},
        },
        {
            "name": "IoT Edge Telemetry Ingestion",
            "method": "POST",
            "url": "/api/v1/iot/telemetry",
            "kwargs": {
                "json": {
                    "farm_id": farm_id,
                    "readings": [
                        {
                            "reading_id": "bench-r-01",
                            "sensor_type": "SOIL_MOISTURE",
                            "value": 52.0,
                            "unit": "%",
                            "device_timestamp": "2026-11-04T12:00:00Z",
                        }
                    ],
                },
                "headers": {
                    "X-Device-Id": device_code,
                    "X-Device-Key": raw_key,
                },
            },
        },
    ]

    # Warmup
    for ep in endpoints:
        if ep["method"] == "GET":
            await client.get(ep["url"], **ep["kwargs"])
        else:
            await client.post(ep["url"], **ep["kwargs"])

    results = []
    n_iters = 15

    for ep in endpoints:
        times_ms = []
        status_codes = []
        for i in range(n_iters):
            if "telemetry" in ep["url"]:
                ep["kwargs"]["json"]["readings"][0]["reading_id"] = f"bench-r-{i:04d}"

            t0 = time.perf_counter()
            if ep["method"] == "GET":
                res = await client.get(ep["url"], **ep["kwargs"])
            else:
                res = await client.post(ep["url"], **ep["kwargs"])
            t1 = time.perf_counter()
            times_ms.append((t1 - t0) * 1000.0)
            status_codes.append(res.status_code)

        all_ok = all(s in (200, 201) for s in status_codes)
        times_sorted = sorted(times_ms)
        p50 = statistics.median(times_sorted)
        p95_idx = int(0.95 * len(times_sorted))
        p95 = times_sorted[min(p95_idx, len(times_sorted) - 1)]

        results.append({
            "name": ep["name"],
            "method": ep["method"],
            "url": ep["url"].split("?")[0],
            "status": "PASS" if all_ok else f"FAIL ({set(status_codes)})",
            "min": min(times_ms),
            "avg": statistics.mean(times_ms),
            "p50": p50,
            "p95": p95,
            "max": max(times_ms),
        })

    print("\n| Endpoint | Method | Status | Min (ms) | Avg (ms) | p50 (ms) | p95 (ms) | Max (ms) |")
    print("|---|---|---|---|---|---|---|---|")
    for r in results:
        print(f"| {r['name']} (`{r['url']}`) | {r['method']} | {r['status']} | {r['min']:.1f} | {r['avg']:.1f} | {r['p50']:.1f} | {r['p95']:.1f} | {r['max']:.1f} |")
    print("=" * 80 + "\n")

    # Clean up benchmark temporary file
    assert all(r["status"] == "PASS" for r in results)

