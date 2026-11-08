"""
Agri2Value — Phase 5 Controlled Stress & Performance Benchmark Suite.

Executes controlled concurrent load testing against core system endpoints:
1. Concurrent Authentication Requests
2. Dashboard / Health Check Ingestion
3. Farm & Land Holdings Queries
4. Harvest Produce Operations
5. Deterministic Profit Decision Engine Evaluation
6. Buyer & Tender Discovery
7. Notification Retrieval

Calculates exact percentiles: min, mean, p50, p95, p99, max, throughput (req/s), and error rates.
"""
import asyncio
import os
import sys
import time
import statistics
from typing import List, Dict, Any
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database.base import engine
import logging

for log_name in ["sqlalchemy.engine", "sqlalchemy.pool", "sqlalchemy.dialects", "httpx"]:
    logger = logging.getLogger(log_name)
    logger.setLevel(logging.ERROR)
    logger.propagate = False
try:
    engine.sync_engine.echo = False
except Exception:
    pass


def calculate_metrics(latencies_ms: List[float], total_duration_s: float, errors: int) -> Dict[str, Any]:
    if not latencies_ms:
        return {
            "total_requests": 0,
            "errors": errors,
            "error_rate_pct": 0.0,
            "throughput_rps": 0.0,
            "min_ms": 0.0,
            "mean_ms": 0.0,
            "p50_ms": 0.0,
            "p95_ms": 0.0,
            "p99_ms": 0.0,
            "max_ms": 0.0,
        }
    latencies_sorted = sorted(latencies_ms)
    n = len(latencies_sorted)
    p50_idx = int(0.50 * n)
    p95_idx = min(int(0.95 * n), n - 1)
    p99_idx = min(int(0.99 * n), n - 1)

    return {
        "total_requests": n + errors,
        "successful_requests": n,
        "errors": errors,
        "error_rate_pct": round((errors / (n + errors)) * 100, 2) if (n + errors) > 0 else 0.0,
        "throughput_rps": round((n + errors) / total_duration_s, 2) if total_duration_s > 0 else 0.0,
        "min_ms": round(latencies_sorted[0], 2),
        "mean_ms": round(statistics.mean(latencies_sorted), 2),
        "p50_ms": round(latencies_sorted[p50_idx], 2),
        "p95_ms": round(latencies_sorted[p95_idx], 2),
        "p99_ms": round(latencies_sorted[p99_idx], 2),
        "max_ms": round(latencies_sorted[-1], 2),
    }


async def run_concurrent_worker_pool(
    client: AsyncClient,
    method: str,
    url: str,
    headers: Dict[str, str],
    json_payload: Any,
    concurrency: int,
    total_requests: int,
) -> Dict[str, Any]:
    semaphore = asyncio.Semaphore(concurrency)
    latencies: List[float] = []
    errors = 0

    async def single_request():
        nonlocal errors
        async with semaphore:
            start = time.perf_counter()
            try:
                if method == "GET":
                    resp = await client.get(url, headers=headers)
                elif method == "POST":
                    resp = await client.post(url, headers=headers, json=json_payload)
                else:
                    raise ValueError(f"Unsupported method: {method}")
                duration_ms = (time.perf_counter() - start) * 1000
                if resp.status_code in (200, 201):
                    latencies.append(duration_ms)
                else:
                    errors += 1
            except Exception:
                errors += 1

    overall_start = time.perf_counter()
    tasks = [asyncio.create_task(single_request()) for _ in range(total_requests)]
    await asyncio.gather(*tasks)
    total_duration_s = time.perf_counter() - overall_start

    return calculate_metrics(latencies, total_duration_s, errors)


async def main():
    print("=" * 80)
    print("AGRI2VALUE PHASE 5: CONTROLLED STRESS & PERFORMANCE BENCHMARK SUITE")
    print("=" * 80)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        # Pre-seed authentication token
        auth_resp = await client.post(
            "/api/v1/auth/demo-login",
            json={"phone": "9876543210", "demo_code": "123456", "full_name": "Ramesh Patil"},
        )
        assert auth_resp.status_code == 200, f"Demo login failed: {auth_resp.text}"
        token = auth_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Pre-fetch farmer's farm and crop lot ID
        farms_data = (await client.get("/api/v1/farms", headers=headers)).json()
        farm_list = farms_data.get("farms", []) if isinstance(farms_data, dict) else farms_data
        assert len(farm_list) > 0, "No farms available for benchmark"
        farm_id = farm_list[0]["id"]

        lots_data = (await client.get("/api/v1/crop-lots", headers=headers)).json()
        lot_list = lots_data.get("crop_lots", []) if isinstance(lots_data, dict) else lots_data
        assert len(lot_list) > 0, "No crop lots available for benchmark"
        lot_id = lot_list[0]["id"]

        benchmarks = [
            {
                "name": "1. Health Status Ping",
                "method": "GET",
                "url": "/api/v1/health",
                "headers": {},
                "json": None,
                "concurrency": 10,
                "total_requests": 50,
            },
            {
                "name": "2. Concurrent Authentication (Demo Login)",
                "method": "POST",
                "url": "/api/v1/auth/demo-login",
                "headers": {},
                "json": {"phone": "9876543210", "demo_code": "123456", "full_name": "Ramesh Patil"},
                "concurrency": 8,
                "total_requests": 40,
            },
            {
                "name": "3. Farm Land Holdings Retrieval",
                "method": "GET",
                "url": "/api/v1/farms",
                "headers": headers,
                "json": None,
                "concurrency": 8,
                "total_requests": 40,
            },
            {
                "name": "4. Harvest Produce Lot Retrieval",
                "method": "GET",
                "url": "/api/v1/crop-lots",
                "headers": headers,
                "json": None,
                "concurrency": 8,
                "total_requests": 40,
            },
            {
                "name": "5. Profit Decision Engine Simulation",
                "method": "POST",
                "url": "/api/v1/decision-engine/evaluate",
                "headers": headers,
                "json": {
                    "crop_lot_id": lot_id,
                },
                "concurrency": 5,
                "total_requests": 25,
            },
            {
                "name": "6. APMC Mandi Price Feeds",
                "method": "GET",
                "url": "/api/v1/market-prices?commodity=Tomato&district=Nashik",
                "headers": headers,
                "json": None,
                "concurrency": 8,
                "total_requests": 40,
            },
            {
                "name": "7. Real-Time Aggregated Notifications",
                "method": "GET",
                "url": "/api/v1/notifications?limit=25",
                "headers": headers,
                "json": None,
                "concurrency": 8,
                "total_requests": 40,
            },
            {
                "name": "8. Farmer Protection & Escrow Pulse",
                "method": "GET",
                "url": "/api/v1/protection/dashboard",
                "headers": headers,
                "json": None,
                "concurrency": 8,
                "total_requests": 40,
            },
        ]

        summary_table = []
        for b in benchmarks:
            print(f"\nRunning Benchmark: {b['name']} ({b['total_requests']} reqs, concurrency={b['concurrency']})...")
            res = await run_concurrent_worker_pool(
                client=client,
                method=b["method"],
                url=b["url"],
                headers=b["headers"],
                json_payload=b["json"],
                concurrency=b["concurrency"],
                total_requests=b["total_requests"],
            )
            summary_table.append((b["name"], res))
            print(
                f"   -> p50: {res['p50_ms']}ms | p95: {res['p95_ms']}ms | p99: {res['p99_ms']}ms | "
                f"Throughput: {res['throughput_rps']} req/s | Errors: {res['errors']} ({res['error_rate_pct']}%)"
            )

        print("\n" + "=" * 80)
        print("MASTER PERFORMANCE SUMMARY TABLE")
        print("=" * 80)
        print(f"{'Endpoint / Workflow':<42s} | {'Reqs':>5s} | {'p50 (ms)':>9s} | {'p95 (ms)':>9s} | {'p99 (ms)':>9s} | {'RPS':>7s} | {'Err %':>6s}")
        print("-" * 92)
        for name, m in summary_table:
            print(f"{name:<42s} | {m['total_requests']:>5d} | {m['p50_ms']:>9.2f} | {m['p95_ms']:>9.2f} | {m['p99_ms']:>9.2f} | {m['throughput_rps']:>7.1f} | {m['error_rate_pct']:>5.1f}%")
        print("=" * 80)


if __name__ == "__main__":
    asyncio.run(main())
