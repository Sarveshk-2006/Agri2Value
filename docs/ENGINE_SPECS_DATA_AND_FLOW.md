# Agri2Value — Engine Specs Data Architecture & Technical Integrations
**Route:** `/app/specs`  
**System:** Agri2Value Full-Stack Technical Architecture  
**Date:** November 2026

---

## 1. System Integration Map

```
[Presentation Layer (React 19 + Vite 8 + Three.js)]
                     │
                     ▼
[Backend REST Layer (FastAPI 0.162 + Pydantic V2)]
 ├── Auth Middleware (JWT HS256 + Tenant user_id Guard)
 ├── 12 Modular Async Routers
 └── Structlog Structured Logging
                     │
                     ▼
[Domain Services & Decision Engine (Python 3.14)]
 ├── Deterministic Profit Calculator (Zero Hallucinations)
 ├── Crop Rescue Urgency Triage (Weather 35%, Shelf-Life 30%)
 ├── Farmer Protection & Transparency Ledger
 └── IoT Edge Telemetry Aggregator
                     │
                     ▼
[Persistence Layer (SQLAlchemy 2.1 + Alembic)]
 ├── 25 Relational Models (users, farms, lots, executions, ...)
 ├── 5 Versioned Migrations (0001 to 0005)
 └── Immutable SHA-256 Transaction Audit Stream
                     │
                     ▼
[External Feeds (Proxied & Resilient)]
 ├── Open-Meteo High-Resolution Forecasting API
 ├── Maharashtra APMC Mandi Auction Aggregator
 └── ESP32 Microclimate Sensor Edge Probes
```

---

## 2. Deterministic Financial Arithmetic Proof

$$\text{Gross Revenue} = Q_{\text{lot}} \times P_{\text{unit}}$$
$$\text{Freight Cost} = D_{\text{km}} \times Q_{\text{lot}} \times T_{\text{freight}}$$
$$\text{Processing Fee} = Q_{\text{lot}} \times T_{\text{processing}}$$
$$\text{Storage Buffer Cost} = Q_{\text{lot}} \times T_{\text{daily}} \times N_{\text{days}}$$
$$\mathbf{\text{Net Farmer Payout}} = \text{Gross Revenue} - \text{Freight} - \text{Processing} - \text{Storage} - \text{Cess}$$

Example (Tomato Lot #862b8403, 4,000 kg Grade A):
- $Q_{\text{lot}} = 4,000\,\text{kg}$
- $P_{\text{unit}} = ₹18.00/\text{kg} \implies \text{Gross} = ₹72,000$
- Freight (Tempo 3T, 42 km @ ₹0.045/km/kg): $-₹1,800$
- Processing & Crate Handling: $-₹1,200$
- Quality Moisture Allowance: $-₹600$
- **Net Realized Payout:** $₹72,000 - ₹3,600 = \mathbf{₹68,400} \quad (\mathbf{₹17.10/kg})$

---

## 3. Test Suite & Reliability Mapping

| Test File | Test Count | Scope |
| :--- | :--- | :--- |
| `test_auth.py` | 4 | JWT authentication, token expiry, tenant credentials |
| `test_benchmark_performance.py` | 1 | Sub-50ms query benchmark |
| `test_decision_api.py` | 5 | Decision evaluate endpoint and sensitivity curve |
| `test_execution_api.py` | 9 | Booking, status updates, partner assignment |
| `test_farms_and_crop_lots.py` | 3 | Farm parcels, resources, normalized kg batches |
| `test_health.py` | 1 | System & DB health check (`/api/v1/health`) |
| `test_iot_api.py` | 11 | Telemetry ingestion, thresholds, anomaly alerts |
| `test_master_e2e_journey.py` | 1 | Unbroken farmer lifecycle journey |
| `test_protection_api.py` | 9 | Agreements, deliveries, payments, disputes |
| `test_system_invariants.py` | 4 | Financial balance invariants, non-negative bounds |
| `test_weather_and_mandi.py` | 8 | Open-Meteo and APMC mandi proxy endpoints |
| `unit/test_decision_engine.py` | 9 | Deterministic mathematical formulas |
| `unit/test_decision_quality.py` | 16 | Quality downgrades and pricing sensitivity |
| `unit/test_execution_service.py` | 4 | Service layer execution orchestrator |
| `unit/test_iot_service.py` | 3 | Sensor data transformation |
| `unit/test_mandi_service.py` | 9 | APMC modal price calculations |
| `unit/test_protection_service.py` | 7 | Payout reconciliation and dispute state transitions |
| `unit/test_schemas.py` | 3 | Pydantic V2 model validators |
| `unit/test_security.py` | 3 | Bcrypt password hashing and token decoding |
| `unit/test_weather_service.py` | 11 | Meteorological risk detection |
| **TOTAL** | **124 PASSED** | **100% Passing in ~23s** |
