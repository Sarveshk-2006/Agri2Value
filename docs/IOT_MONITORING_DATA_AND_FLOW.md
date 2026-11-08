# Agri2Value — IoT Data Architecture & Telematics Flow Guide
**Module:** Phase 4A IoT & Edge Microclimate Telematics  
**Grounded Source Files:**
- `backend/app/iot/router.py`
- `backend/app/iot/service.py`
- `backend/app/iot/simulator.py`
- `backend/app/iot/schemas.py`
- `backend/app/database/models.py` (`IoTDevice`, `IoTTelemetryReading`, `IoTAlert`)
- `frontend/src/components/IoTMonitoringView.tsx`

---

## 1. Database Entity Models & Persistence Schema

### 1. `IoTDevice` (`iot_devices`)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | `VARCHAR(36)` | PK | UUID Primary Key |
| `device_code` | `VARCHAR(64)` | Unique | Human-readable node identifier (e.g. `ESP32-POLY-101`) |
| `device_name` | `VARCHAR(100)` | No | Friendly device description |
| `farm_id` | `VARCHAR(36)` | FK | References `farms.id` |
| `farmer_user_id` | `VARCHAR(36)` | FK | Tenant isolation key referencing `users.id` |
| `device_type` | `VARCHAR(50)` | No | Hardware node type (`ESP32_AGRI_NODE`) |
| `firmware_version` | `VARCHAR(20)` | No | Firmware tag (`v1.0.0-sim`) |
| `sensor_capabilities` | `VARCHAR(255)` | No | CSV of supported sensors |
| `status` | `VARCHAR(20)` | No | `ACTIVE`, `INACTIVE`, `REVOKED` |
| `data_source` | `VARCHAR(20)` | No | `SIMULATED` or `PHYSICAL` |
| `api_key_hash` | `VARCHAR(128)` | No | SHA-256 hash of device secret token |
| `api_key_prefix` | `VARCHAR(16)` | No | Safe display prefix (e.g. `a2v_dev_4f8e...`) |
| `last_seen_at` | `TIMESTAMP(UTC)` | Yes | Heartbeat / telemetry ingestion timestamp |
| `last_reading_summary`| `TEXT` | Yes | JSON summary of latest sensor readings |

### 2. `IoTTelemetryReading` (`iot_telemetry_readings`)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | `VARCHAR(36)` | PK | UUID Primary Key |
| `device_id` | `VARCHAR(36)` | FK | References `iot_devices.id` |
| `farm_id` | `VARCHAR(36)` | FK | References `farms.id` |
| `reading_id` | `VARCHAR(64)` | Unique | Client event ID for strict deduplication |
| `sensor_type` | `VARCHAR(40)` | No | `SOIL_MOISTURE`, `AIR_TEMP`, `HUMIDITY`, `RAINFALL`, etc. |
| `value` | `NUMERIC(10,2)` | No | Sensor value |
| `unit` | `VARCHAR(20)` | No | Normalized unit (`%`, `°C`, `mm`, `lux`, `V`) |
| `device_timestamp` | `TIMESTAMP(UTC)` | No | Measurement timestamp recorded by device |
| `server_ingested_at` | `TIMESTAMP(UTC)` | No | Server ingestion timestamp |
| `source_type` | `VARCHAR(20)` | No | `SIMULATED` or `PHYSICAL` |
| `quality_flag` | `VARCHAR(20)` | No | `VALID`, `WARNING`, `INVALID` |

### 3. `IoTAlert` (`iot_alerts`)
| Column | Type | Nullable | Description |
| :--- | :--- | :---: | :--- |
| `id` | `VARCHAR(36)` | PK | UUID Primary Key |
| `device_id` | `VARCHAR(36)` | FK | References `iot_devices.id` |
| `farm_id` | `VARCHAR(36)` | FK | References `farms.id` |
| `alert_type` | `VARCHAR(50)` | No | `LOW_SOIL_MOISTURE`, `HIGH_TEMPERATURE`, `HIGH_HUMIDITY`, `HEAVY_RAINFALL`, `DEVICE_OFFLINE` |
| `severity` | `VARCHAR(20)` | No | `CRITICAL`, `WARNING`, `INFO` |
| `threshold_used` | `VARCHAR(100)` | No | Threshold explanation string |
| `explanation` | `TEXT` | No | Agronomic plain-language explanation |
| `is_resolved` | `BOOLEAN` | No | Resolved state flag |

---

## 2. Ingestion & Simulation Flow

1. **Preset Selection / Custom Sliders:** User configures microclimate scenario in `IoTMonitoringView.tsx`.
2. **API Request:** Frontend calls `POST /api/v1/iot/simulator/run` with payload:
   ```json
   {
     "device_id": "d820...",
     "scenario": "LOW_MOISTURE_DROUGHT",
     "custom_soil_moisture": 21.5,
     "custom_temperature": 34.2
   }
   ```
3. **Synthesis Engine:** `sensor_simulator.run_simulation` packages 6 normalized `TelemetryReadingItem`s tagged with `source_type="SIMULATED"`.
4. **Standard Ingestion:** Injected into `iot_service.ingest_telemetry`:
   - Validates ranges: Soil Moisture (0–100%), Air Temp (-20–65°C), Humidity (0–100%), Rainfall (0–500mm).
   - Skips duplicate `reading_id`s.
   - Evaluates agronomic alerts against demonstration thresholds.
   - Auto-resolves previous alerts if readings return to safe bounds (e.g. soil moisture ≥35%).
   - Updates `device.last_seen_at` and `device.last_reading_summary`.
5. **Real-Time Client Refresh:** Frontend updates gauges, adds readings to the telemetry ledger, and triggers alert notification banners.
