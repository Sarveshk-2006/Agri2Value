# Agri2Value (कृषि-मूल्य)

> **AI-Assisted Farm-to-Profit Decision and Execution Platform**  
> Developed for **Indradhanu: PCCOE International Grand Challenge 2026**

---

## 1. Product Context & Core Mission

Farmers often face dramatic price swings, asymmetrical intermediary power, and distress selling at local mandis. **Agri2Value** transforms agricultural decision-making by converting harvest volume into optimized net profit:

$$\text{Net Profit} = \text{Gross Revenue} - (\text{Processing Costs} + \text{Logistics} + \text{Packaging} + \text{Storage Loss} + \text{Mandi Cess})$$

Rather than providing generic advisory, Agri2Value executes the complete journey:
$$\textbf{UNDERSTAND} \longrightarrow \textbf{DECIDE} \longrightarrow \textbf{EXECUTE} \longrightarrow \textbf{PROTECT} \longrightarrow \textbf{LEARN}$$

---

## 2. Phase 1 Scope & Status

Phase 1 provides the solid, tested foundational platform:
- **FastAPI 0.111+ Async Backend:** RESTful services with strict Pydantic v2 schemas and structlog structured logging.
- **SQLAlchemy 2.0 Async ORM & Alembic:** Dual-compatible schema (PostgreSQL & SQLite) with UUID keys and audit events.
- **Demo-Mode Authentication:** Clear, secure demo authentication with OTP `123456` and role-based permissions.
- **Farm & Produce Registration:** Normalized kilogram units, quality grades, GPS/location attributes, and on-farm resource tracking.
- **React 19 + Vite + Tailwind CSS Frontend:** Responsive, accessible UI shell featuring live metrics, interactive modals, and Phase 2 decision engine simulations.
- **Automated Test Suite:** 14/14 unit and integration tests passing (100% test pass rate).

---

## 3. Repository Architecture

```
Agri2Value/
├── docs/                        # 10 comprehensive architectural blueprints
│   ├── 01_PRODUCT_VISION_AND_SCOPE.md
│   ├── ...
│   └── 10_RISKS_ASSUMPTIONS_AND_GLOSSARY.md
├── backend/                     # Python 3.11+ FastAPI Application
│   ├── app/
│   │   ├── auth/                # JWT Auth, demo-login, role dependencies
│   │   ├── core/                # Config, security (bcrypt), logging, error handlers
│   │   ├── database/            # Async engine, session, Base, SQLAlchemy models
│   │   ├── farms/               # Farm management & resource services
│   │   ├── crop_lots/           # Produce lots, quantity normalizer, audit events
│   │   └── main.py              # Application entrypoint & middleware
│   ├── migrations/              # Alembic versioned migrations
│   │   └── versions/0001_initial_schema.py
│   ├── scripts/
│   │   └── seed.py              # Canonical demo seed scenario runner
│   ├── tests/
│   │   ├── unit/                # Security, hashing, schema validator tests
│   │   ├── integration/         # Auth, CRUD, ownership isolation tests
│   │   └── conftest.py          # Pytest async SQLite fixtures
│   ├── requirements.txt         # Pinned Python dependencies
│   └── .env                     # Local environment configuration
├── frontend/                    # React 19 + TypeScript + Vite + Tailwind v4
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx       # Brand, demo status pill, connection status
│   │   │   ├── Navigation.tsx   # Responsive tab bar
│   │   │   ├── DashboardView.tsx # KPI summary, pilot lot card, event logs
│   │   │   ├── FarmsView.tsx    # Farm listings & farm registration modal
│   │   │   ├── HarvestLotsView.tsx # Lot cards, normalized kg, registration modal
│   │   │   ├── DecisionEnginePreview.tsx # Phase 2 mathematical simulation
│   │   │   ├── SpecsView.tsx    # Architectural blueprint & judging alignment
│   │   │   └── AuthModal.tsx    # Demo sign-in with 1-click persona preset
│   │   ├── api.ts               # API client with offline/mock resilience
│   │   ├── types.ts             # Domain TypeScript interfaces
│   │   ├── App.tsx              # Root app component
│   │   └── index.css            # Tailwind v4 theme & glassmorphism styling
├── hardware/                    # IoT & embedded firmware specs (Phase 8)
├── ml/                          # Computer vision & model specs (Phase 7)
├── scripts/                     # Cross-platform development runners
├── docker-compose.yml           # PostgreSQL container definition
└── README.md
```

---

## 4. Quick Start & Execution Guide

### Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- (Optional) Docker for PostgreSQL

### Step 1: Set Up Backend
```powershell
cd d:\Agri2Value\backend

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# (If new environment) install requirements:
# pip install -r requirements.txt

# Seed canonical pilot scenario
python -m scripts.seed

# Start FastAPI dev server on port 8000
python -m uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at: `http://localhost:8000/api/v1/docs`

### Step 2: Set Up Frontend
```powershell
cd d:\Agri2Value\frontend

# Install dependencies (if needed)
npm install

# Start Vite dev server on port 5173
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 5. Demo Persona & Pilot Scenario

| Attribute | Canonical Pilot Data |
|---|---|
| **Farmer Persona** | Ramesh Patil |
| **Phone / Role** | `9876543210` / `FARMER` |
| **Demo OTP Code** | `123456` |
| **Farm Name** | Patil Krishi Farm |
| **Location** | Niphad, Nashik, Maharashtra |
| **Land Area** | 3.5 Acres |
| **On-Farm Resources** | Shaded shed (2 MT), 80 crates, 3 labourers |
| **Harvest Lot** | 4,000 kg Summer Tomato (Abhinav, Grade A) |
| **Data Provenance Tag** | `demo` / `[DEMO_SEED]` |

---

## 6. Running Automated Tests

Run all unit and integration tests with pytest:
```powershell
cd d:\Agri2Value\backend
.\.venv\Scripts\pytest -v
```
All 96 tests execute with 100% pass rate across authentication, profit decision engine, mandi & weather live integration, smart execution network, crop rescue mode, virtual IoT telematics, and farmer protection & financial trust.

---

## 7. Phase 4A — Virtual IoT Telemetry & Smart Irrigation Monitoring

Agri2Value features a complete, secure virtual device simulator that connects to the production-minded FastAPI telemetry ingestion pipeline:

### Key Features:
- **Virtual Node Provisioning:** Farmers can register virtual IoT nodes (`ESP32_AGRI_NODE`) with secure SHA-256 hashed API tokens (`POST /api/v1/iot/devices`).
- **Telemetry Ingestion API:** `POST /api/v1/iot/telemetry` authenticated via `X-Device-Id` and `X-Device-Token` (or `X-Device-Key`).
- **Telemetry Validation:** Server-side range checks for Soil Moisture (0–100%), Air Temp (-20 to 65°C), Humidity (0–100%), Rainfall (0–500 mm), Lux, and Battery Voltage.
- **De-duplication & Time-series Storage:** Prevents duplicate reading IDs and tracks device online/standby status.
- **Configurable Smart Irrigation Advisories:** Dynamic threshold slider triggers clear advisories (e.g., "Soil moisture is below configured 30.0% threshold. Inspect field rootzone and consider drip irrigation.").
- **Safety Guardrail:** Strictly **Advisory Only**. No automated remote pump or valve actuation in Phase 4A.
- **Future ESP32 Hardware Contract:** Documented in [`hardware/README.md`](hardware/README.md).

### Simulator Usage Instructions:
1. Log in as pilot farmer **Ramesh Patil** (`9876543210` / `123456`).
2. Navigate to **IoT & Telematics** (`/app/iot`).
3. Select the seeded node **ESP32-NIPHAD-NODE-01** (or provision a new virtual node via the top-right button).
4. Choose an environmental scenario preset:
   - `NORMAL_OPTIMAL`: Balanced microclimate (Moisture 55%, Temp 27.5°C).
   - `LOW_MOISTURE_DROUGHT`: Soil moisture stress (<30%) — generates actionable irrigation advisory.
   - `HEATWAVE_STRESS`: Canopy temperature spike (>38°C) — triggers heat advisory.
   - `HIGH_HUMIDITY_BLIGHT`: Elevated humidity (>85%) — triggers late blight alert.
   - `HEAVY_MONSOON_RAIN`: Precipitation surge (>25mm) — triggers waterlogging warning.
   - `DEVICE_OFFLINE`: Missed heartbeat simulation.
5. Click **Inject Once** to post a single telemetry batch or click **Stream** to transmit continuous readings every 3–10 seconds.
6. The dashboard gauges, alert list, and persisted database history log update in real-time.

---

## 8. Phase 5 — Farmer Protection, Deal Transparency & Financial Trust

Agri2Value provides an end-to-end commercial transparency foundation protecting farmers throughout deal acceptance, delivery verification, payment tracking, and dispute management:

### Key Capabilities:
- **Digital Deal Agreements:** Converts confirmed execution requests into structured deal agreements with itemized deductions (transport, handling, platform fees), gross cargo value, and net farmer proceeds calculated using strict `Decimal` precision.
- **Immutable Acceptance Snapshots:** Accepted terms cannot be mutated silently. Any proposed adjustment creates an auditable versioned amendment (`AgreementAmendment`) and generates explainable risk alerts.
- **Delivery Verification Records:** Tracks weighbridge receipt, accepted vs. rejected weights, vehicle registrations, and driver contacts. Transparently recalculates remaining unfulfilled quantities for partial shipments.
- **Payment Tracking Ledger:** Reconciles milestone payments against agreed commercial totals. Evaluates payment due dates to flag overdue balances without arbitrary client-side manipulation.
- **Transparent Dispute Management:** Allows farmers to lodge commercial grievances across 8 standard categories (`PAYMENT_OVERDUE`, `PAYMENT_AMOUNT_MISMATCH`, `UNEXPECTED_DEDUCTION`, `QUANTITY_MISMATCH`, etc.) with multi-role audit timelines.
- **Explainable Risk Indicators:** Server-evaluated risk alerts with explicit triggering evidence, severity rankings, and actionable recommended farmer steps.
- **Dedicated Protection Dashboard:** Responsive interface with 6 tabs (Overview, Agreements, Deliveries, Payments, Disputes, Alerts), printable digital deal certificates, and complete chronological audit trails.
- **Complete Report:** Documented in [`docs/PHASE_5_FARMER_PROTECTION_COMPLETION_REPORT.md`](docs/PHASE_5_FARMER_PROTECTION_COMPLETION_REPORT.md).


