# Agri2Value — Phase 4A Completion Report
## Complete Virtual IoT Telemetry, Device Simulation & Smart Irrigation Monitoring

**Project:** Agri2Value (कृषि-मूल्य)  
**Phase:** 4A — Simulation-First IoT & Edge Microclimate Telematics  
**Role:** Senior Full-Stack Engineer, IoT Integration Specialist, and Agricultural Technology Architect  
**Date:** November 2026  
**Status:** Completed, Verified, and Production-Ready (Simulation-First)  

---

> ### ⚠️ Mandatory Physical Hardware Disclosure
> **Physical hardware has NOT been physically tested.**  
> No physical ESP32 microcontroller boards, capacitive soil probes, DHT22 sensors, or relays are connected at this stage.  
> Phase 4A establishes a **Simulation-First Virtual IoT Telemetry Foundation** that transmits data through the exact authenticated backend API endpoint (`POST /api/v1/iot/telemetry`) that future physical ESP32 devices will use.

---

## 1. Executive Summary & Objective

In Phase 4A, Agri2Value delivered a production-grade, simulation-first IoT telemetry infrastructure. Rather than relying on purely static frontend UI mocks or random local state, the system implements a complete vertical flow:

$$\text{Virtual Device Simulator} \longrightarrow \text{Secure API Ingestion} \longrightarrow \text{Validation \& Range Checks} \longrightarrow \text{Database Persistence} \longrightarrow \text{Sensor Dashboard} \longrightarrow \text{Alerts \& Irrigation Advisories}$$

Key accomplishments in this phase include:
1. **Device Provisioning & Authentication:** Cryptographically secure device tokens (SHA-256 hashed in database, never logged, one-time reveal) authenticated via `X-Device-Id` and `X-Device-Token` (or `X-Device-Key`).
2. **Standard Telemetry Ingestion Pipeline (`POST /api/v1/iot/telemetry`):** Strict server-side range validation for 6 core telemetry metrics (Soil Moisture %, Air Temp °C, Humidity %, Rainfall mm, Lux, Battery V), unit normalization, timezone-aware UTC persistence, and duplicate event rejection based on `(device_id, reading_id)`.
3. **Interactive Virtual Device Simulator:** Embedded directly in the authenticated farmer console (`/app/iot`) supporting 6 agronomic scenarios (Optimal, Severe Moisture Stress, Heatwave, Blight/Fungal threat, Monsoon downpour, and Missed heartbeat).
4. **Transparent Smart Irrigation Decision Engine:** Dynamic farmer-configurable threshold slider (e.g. `<30%` moisture) triggering clear, actionable irrigation advisories. Strictly **Advisory Only** with explicit safeguards: no automatic remote pump, valve, or relay actuation.
5. **Cross-Farmer Device Isolation & Security:** Guaranteed multi-tenant tenant isolation ensuring one farmer cannot access, inspect, or ingest data into another farmer's edge node.
6. **Future ESP32 Hardware Contract:** Complete specification, JSON schema, curl examples, and MicroPython client in `hardware/README.md`.

---

## 2. Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Edge Layer (Simulation / Future ESP32)               │
│                                                                        │
│   Virtual Device Simulator (Web UI)  ──┐                               │
│                                        ├──► HTTPS POST /api/v1/iot/telemetry
│   Future ESP32 MicroPython Firmware ───┘    Headers:                   │
│   (Capacitive Soil, DHT22, BH1750, etc.)       X-Device-Id             │
│                                                X-Device-Token          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   FastAPI Telemetry Ingestion Pipeline                 │
│                                                                        │
│   1. Device Credential Verification: secrets.compare_digest(hash)      │
│   2. Operational Status Check: Reject INACTIVE or REVOKED devices      │
│   3. Farm Ownership Resolution: Server resolves device.farm_id         │
│   4. Schema & Unit Sanity Validation: Reject out-of-range readings     │
│   5. Deduplication Gate: Check (device_id, reading_id) uniqueness       │
│   6. Telemetry Persistence: Write to `iot_telemetry_readings`          │
│   7. Device Last-Seen Clock: Update `last_seen_at` (out-of-order safe) │
│   8. Advisory Alert & Condition Recovery Engine                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Relational Database Layer                          │
│                                                                        │
│   • iot_devices: Registered nodes, API key hash, last_seen_at          │
│   • iot_telemetry_readings: Time-series observations                   │
│   • iot_alerts: Active & resolved microclimate advisory records        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Farmer Web Application (/app/iot)                    │
│                                                                        │
│   • Live Telemetry Gauges (Soil Moisture, Temp, Humidity, Precip)      │
│   • Smart Irrigation Advisory (Dynamic threshold slider)               │
│   • Microclimate Alerts with One-Click Resolution                      │
│   • Node Provisioning Modal with One-Time Secret Key Copy              │
│   • Time-Series Ingestion Log                                          │
│   • Linkage to Supplementary Crop Rescue Watchdog                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Database Models & Schema Design

Database tables are defined in `app/database/models.py` and managed via Alembic migration `backend/migrations/versions/0004_iot_edge_telematics.py`:

### Table: `iot_devices`
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `VARCHAR(36)` | Primary Key (UUID) |
| `device_code` | `VARCHAR(64)` | Unique human-readable identifier (e.g. `ESP32-NIPHAD-NODE-01`) |
| `device_name` | `VARCHAR(100)` | Friendly label (e.g. `Niphad Tomato Polyhouse Node 1`) |
| `farm_id` | `VARCHAR(36)` | Foreign Key -> `farms.id` (ON DELETE CASCADE) |
| `farmer_user_id`| `VARCHAR(36)` | Foreign Key -> `users.id` (ON DELETE CASCADE) |
| `device_type` | `VARCHAR(50)` | Default `ESP32_AGRI_NODE` |
| `firmware_version`| `VARCHAR(30)` | Default `v1.2.0-sim` |
| `sensor_capabilities` | `VARCHAR(255)` | Comma-separated sensor list |
| `status` | `VARCHAR(30)` | `ACTIVE`, `INACTIVE`, `REVOKED` |
| `data_source` | `VARCHAR(30)` | `SIMULATED` or `PHYSICAL` |
| `api_key_hash`| `VARCHAR(128)`| SHA-256 hex digest of secret API key |
| `api_key_prefix`| `VARCHAR(20)`| Display-safe prefix (`a2v_dev_...`) |
| `last_seen_at`| `TIMESTAMP WITH TIME ZONE` | Latest valid telemetry observation timestamp |
| `last_reading_summary` | `TEXT` | Cached JSON snapshot of current readings |
| `created_at` / `updated_at` | `TIMESTAMP WITH TIME ZONE` | Record audit timestamps |

### Table: `iot_telemetry_readings`
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `VARCHAR(36)` | Primary Key (UUID) |
| `device_id` | `VARCHAR(36)` | Foreign Key -> `iot_devices.id` |
| `farm_id` | `VARCHAR(36)` | Foreign Key -> `farms.id` |
| `reading_id` | `VARCHAR(64)` | Client event identifier for idempotency |
| `sensor_type` | `VARCHAR(50)` | `SOIL_MOISTURE`, `AIR_TEMP`, `HUMIDITY`, `RAINFALL`, `LIGHT_INTENSITY`, `BATTERY_VOLTAGE` |
| `value` | `NUMERIC(10, 2)` | Decimal sensor observation |
| `unit` | `VARCHAR(20)` | Normalized measurement unit (`%`, `°C`, `mm`, `lux`, `V`) |
| `device_timestamp` | `TIMESTAMP WITH TIME ZONE` | Observation time recorded at edge node |
| `server_ingested_at`| `TIMESTAMP WITH TIME ZONE` | Server receipt timestamp |
| `source_type` | `VARCHAR(30)` | `SIMULATED` or `PHYSICAL` |
| `quality_flag`| `VARCHAR(30)` | `VALID`, `SUSPICIOUS`, `CALIBRATION_NEEDED` |
| `raw_metadata`| `TEXT` | Optional raw ADC counts or debugging context |
| **Constraint** | `UNIQUE(device_id, reading_id)` | Enforces strict idempotent event deduplication |

### Table: `iot_alerts`
| Column | Type | Constraints / Description |
|---|---|---|
| `id` | `VARCHAR(36)` | Primary Key (UUID) |
| `device_id` | `VARCHAR(36)` | Foreign Key -> `iot_devices.id` |
| `farm_id` | `VARCHAR(36)` | Foreign Key -> `farms.id` |
| `alert_type` | `VARCHAR(50)` | `LOW_SOIL_MOISTURE`, `HIGH_TEMPERATURE`, `HIGH_HUMIDITY`, `HEAVY_RAINFALL`, `DEVICE_OFFLINE` |
| `severity` | `VARCHAR(20)` | `CRITICAL`, `WARNING`, `INFO` |
| `threshold_used`| `VARCHAR(100)`| Explicit threshold rule behind alert |
| `source_type` | `VARCHAR(30)` | `SIMULATED` |
| `explanation` | `TEXT` | Farmer-facing actionable advisory text |
| `is_resolved` | `BOOLEAN` | Alert resolution state (supports auto-recovery) |
| `created_at` / `resolved_at` | `TIMESTAMP WITH TIME ZONE` | Lifecycle timestamps |

---

## 4. Telemetry API Endpoints & Request Examples

### 1. Telemetry Ingestion: `POST /api/v1/iot/telemetry`
- **Authentication:** `X-Device-Id` + `X-Device-Token` (or `X-Device-Key`).
- **Request Example:**
```bash
curl -X POST "http://localhost:8000/api/v1/iot/telemetry" \
  -H "Content-Type: application/json" \
  -H "X-Device-Id: ESP32-NIPHAD-NODE-01" \
  -H "X-Device-Token: a2v_dev_demo_key_niphad_node_01" \
  -d '{
    "readings": [
      {
        "reading_id": "test-reading-sm-101",
        "sensor_type": "SOIL_MOISTURE",
        "value": 24.50,
        "unit": "%",
        "device_timestamp": "2026-11-02T10:00:00Z",
        "source_type": "SIMULATED"
      }
    ]
  }'
```
- **Response (`201 Created`):**
```json
{
  "status": "INGESTED",
  "device_id": "d1e2f3a4-5b6c-7d8e-9f0a-1b2c3d4e5f6a",
  "ingested_count": 1,
  "duplicate_count": 0,
  "alerts_triggered": 1,
  "server_timestamp": "2026-11-02T10:00:01.002345Z",
  "message": "Processed 1 readings: 1 saved, 0 duplicates skipped."
}
```

### 2. Node Provisioning: `POST /api/v1/iot/devices`
- **Authentication:** JWT Bearer token (`Authorization: Bearer <token>`).
- **Response:** Returns device details along with the one-time `raw_api_key`.

### 3. Simulator Presets: `POST /api/v1/iot/simulator/run`
- **Authentication:** JWT Bearer token.
- **Payload:** `{"device_id": "...", "scenario": "LOW_MOISTURE_DROUGHT"}`.
- **Response:** Executes the simulation scenario through the standard ingestion pipeline and returns the resulting telemetry summary and alert triggers.

---

## 5. Automated Tests & Pass Evidence

### Test Suite Execution Summary:
Executed: `pytest -v` across the entire backend suite.
- **Total Backend Tests:** **80 passed, 0 failed** in 25.19s (100% pass rate).
- **Dedicated Phase 4A IoT Tests (14 Tests):**
  - `tests/unit/test_iot_service.py`:
    - `test_generate_and_hash_device_api_key` (PASSED)
    - `test_valid_sensor_ranges_coverage` (PASSED)
    - `test_simulator_scenarios_listing` (PASSED)
  - `tests/integration/test_iot_api.py`:
    - `test_device_registration_and_one_time_secret` (PASSED)
    - `test_device_authentication_and_telemetry_ingestion` (PASSED)
    - `test_invalid_credentials_and_revocation` (PASSED)
    - `test_key_rotation` (PASSED)
    - `test_duplicate_event_rejection` (PASSED)
    - `test_range_and_unit_validation` (PASSED)
    - `test_virtual_simulator_preset_and_alert_resolution` (PASSED)
    - `test_crop_rescue_supplementary_telemetry_linkage` (PASSED)
    - `test_cross_farmer_device_isolation` (PASSED)
    - `test_delayed_and_out_of_order_events` (PASSED)
    - `test_alert_deduplication_and_automatic_condition_recovery` (PASSED)
- **Frontend Production Build:** `npm run build` compiled cleanly in 389ms with 0 errors.

---

## 6. Browser Verification & Visual Evidence

Browser interactions and screenshots were captured using automated browser subagent verification:

| Screenshot File | Description | Location |
|---|---|---|
| `22-app-iot-dashboard.png` | Main IoT & Microclimate console showing registered virtual nodes, device status, online indicators, and FarmMonitor-inspired metric gauges. | `docs/complete-website-screenshots/22-app-iot-dashboard.png` |
| `23-app-iot-drought-alert.png` | Interactive simulation injection showing soil moisture drop (21.5%), active `LOW_SOIL_MOISTURE` alert, and Smart Irrigation Advisory. | `docs/complete-website-screenshots/23-app-iot-drought-alert.png` |
| `24-app-iot-provision_modal.png` | Node Provisioning Modal allowing farmers to register new virtual nodes and view one-time secret API tokens with copy actions. | `docs/complete-website-screenshots/24-app-iot-provision-modal.png` |
| `25-mobile-iot-dashboard.png` | Responsive mobile viewport (390x844) demonstrating stacked gauges, touch controls, and accessible console controls. | `docs/complete-website-screenshots/25-mobile-iot-dashboard.png` |

---

## 7. Safety, Guardrails & Remaining Limitations

1. **Advisory Decision Only:** Irrigation recommendations are strictly advisory. The system does not actuate pumps, valves, relays, or motors automatically.
2. **Simulation-First:** Data source tags (`SIMULATED`) are prominently displayed across all cards, badges, and tooltips to maintain honest provenance.
3. **No Hardware Claim:** No physical ESP32 boards have been tested with living crops; physical integration will occur in a dedicated hardware evaluation phase.
4. **Environment:** Local test suites execute cleanly on SQLite with async engine, while production deployments use PostgreSQL.
