# Agri2Value — IoT Hardware & Future ESP32 Integration Contract

> **IMPORTANT DISCLOSURE:**  
> **Physical hardware has NOT been physically tested.** No physical ESP32 microcontroller boards or physical sensors are connected.  
> Phase 4A implements a **Simulation-First Virtual IoT Telemetry Foundation** that transmits data through the exact authenticated backend API endpoint (`POST /api/v1/iot/telemetry`) that future physical ESP32 devices will use.

---

## 1. Overview & Architecture

Agri2Value provides an open, standard HTTPS REST contract for edge agro-telemetry devices (ESP32, Raspberry Pi Pico W, or virtual simulators).

```
   ┌───────────────────────────────────────────────┐
   │        Edge Hardware / Virtual Simulator      │
   │  (ESP32 Node / BH1750 / Capacitive Soil /     │
   │   DHT22 / Rain Gauge / Battery ADC)           │
   └───────────────────────┬───────────────────────┘
                           │
                           │ HTTPS POST /api/v1/iot/telemetry
                           │ Headers:
                           │   X-Device-Id: ESP32-NIPHAD-NODE-01
                           │   X-Device-Token: a2v_dev_...
                           ▼
   ┌───────────────────────────────────────────────┐
   │             FastAPI IoT Ingestion API         │
   │  • Device credential validation (SHA-256)     │
   │  • Range & unit sanity enforcement            │
   │  • De-duplication of reading IDs              │
   │  • Timezone-aware timestamp retention         │
   │  • Automated condition recovery evaluation    │
   └───────────────────────┬───────────────────────┘
                           │
                           ▼
   ┌───────────────────────────────────────────────┐
   │         PostgreSQL / SQLite Database          │
   │  • iot_devices (status, last_seen_at)         │
   │  • iot_telemetry_readings (time-series)       │
   │  • iot_alerts (dry soil, heatwave, blight)    │
   └───────────────────────────────────────────────┘
```

---

## 2. Device Provisioning & Authentication

Each edge device must be registered by an authorized farmer on their farm:

1. **Provisioning Endpoint:** `POST /api/v1/iot/devices`
2. **One-Time Secret Key:** Generates a secure random API key (e.g., `a2v_dev_AbC123...`).
3. **Database Security:** Only the SHA-256 hash of the API key is stored in `iot_devices.api_key_hash`. The raw key is never stored, returned in subsequent requests, or written to logs.
4. **Authentication Headers:**
   Every telemetry ingestion request must supply either:
   - `X-Device-Id`: Hardware device code (e.g., `ESP32-NIPHAD-NODE-01`)
   - `X-Device-Token` (or `X-Device-Key`): The raw device secret key
   - *OR* Standard HTTP `Authorization: Bearer <raw_device_key>` with `X-Device-Id`.

---

## 3. Telemetry Payload Specification

### Endpoint:
```http
POST /api/v1/iot/telemetry
Content-Type: application/json
X-Device-Id: ESP32-NIPHAD-NODE-01
X-Device-Token: a2v_dev_EXAMPLE_SECRET_TOKEN_DO_NOT_HARDCODE
```

### Request Payload (`TelemetryBatchIngest`):
```json
{
  "farm_id": "1a30d9c6-3e7f-409e-8a5b-ea4a7065c4a9",
  "readings": [
    {
      "reading_id": "node01-sm-1730502000",
      "sensor_type": "SOIL_MOISTURE",
      "value": 42.50,
      "unit": "%",
      "device_timestamp": "2026-11-02T10:00:00Z",
      "source_type": "PHYSICAL",
      "raw_metadata": "sensor_pin=GPIO34;adc_raw=2150"
    },
    {
      "reading_id": "node01-temp-1730502000",
      "sensor_type": "AIR_TEMP",
      "value": 28.40,
      "unit": "°C",
      "device_timestamp": "2026-11-02T10:00:00Z",
      "source_type": "PHYSICAL",
      "raw_metadata": "sensor=DHT22"
    },
    {
      "reading_id": "node01-hum-1730502000",
      "sensor_type": "HUMIDITY",
      "value": 64.00,
      "unit": "%",
      "device_timestamp": "2026-11-02T10:00:00Z",
      "source_type": "PHYSICAL"
    },
    {
      "reading_id": "node01-rain-1730502000",
      "sensor_type": "RAINFALL",
      "value": 0.00,
      "unit": "mm",
      "device_timestamp": "2026-11-02T10:00:00Z",
      "source_type": "PHYSICAL"
    },
    {
      "reading_id": "node01-lux-1730502000",
      "sensor_type": "LIGHT_INTENSITY",
      "value": 45000.00,
      "unit": "lux",
      "device_timestamp": "2026-11-02T10:00:00Z",
      "source_type": "PHYSICAL"
    },
    {
      "reading_id": "node01-bat-1730502000",
      "sensor_type": "BATTERY_VOLTAGE",
      "value": 4.15,
      "unit": "V",
      "device_timestamp": "2026-11-02T10:00:00Z",
      "source_type": "PHYSICAL"
    }
  ]
}
```

### Supported Sensors & Realistic Validation Ranges:

| Sensor Type | Realistic Min | Realistic Max | Allowed Units | Description |
| :--- | :--- | :--- | :--- | :--- |
| `SOIL_MOISTURE` | `0.0%` | `100.0%` | `%`, `pct`, `percent` | Volumetric soil moisture content |
| `AIR_TEMP` | `-20.0°C` | `65.0°C` | `°C`, `celsius`, `c`, `degC` | Microclimate canopy air temperature |
| `HUMIDITY` | `0.0%` | `100.0%` | `%`, `pct`, `%rh`, `rh` | Relative atmospheric humidity |
| `RAINFALL` | `0.0 mm` | `500.0 mm` | `mm`, `millimeter` | Tipping-bucket precipitation |
| `LIGHT_INTENSITY`| `0.0 lux` | `200000.0 lux`| `lux`, `lx` | Ambient solar illuminance (BH1750) |
| `BATTERY_VOLTAGE`| `0.0 V` | `15.0 V` | `V`, `volt`, `volts` | LiPo/Solar storage voltage |

---

## 4. Structured Server Responses

### Success Response (`201 Created`):
```json
{
  "status": "INGESTED",
  "device_id": "d1e2f3a4-5b6c-7d8e-9f0a-1b2c3d4e5f6a",
  "ingested_count": 6,
  "duplicate_count": 0,
  "alerts_triggered": 0,
  "server_timestamp": "2026-11-02T10:00:01.123456Z",
  "message": "Processed 6 readings: 6 saved, 0 duplicates skipped."
}
```

### Duplicate Event Skipped (`201 Created`):
If an edge node retransmits due to WiFi timeout, the unique `(device_id, reading_id)` constraint automatically deduplicates without generating errors:
```json
{
  "status": "INGESTED",
  "device_id": "d1e2f3a4-5b6c-7d8e-9f0a-1b2c3d4e5f6a",
  "ingested_count": 0,
  "duplicate_count": 6,
  "alerts_triggered": 0,
  "server_timestamp": "2026-11-02T10:00:05.987654Z",
  "message": "Processed 6 readings: 0 saved, 6 duplicates skipped."
}
```

### Invalid Credentials (`401 Unauthorized`):
```json
{
  "detail": "Invalid device credentials: API Key mismatch"
}
```

### Revoked Device (`403 Forbidden`):
```json
{
  "detail": "Device access revoked. Contact farm administrator."
}
```

### Out-of-Range or Malformed Value (`422 Unprocessable Content`):
```json
{
  "detail": "Sensor value 125.0 for 'SOIL_MOISTURE' outside realistic range [0.0, 100.0]"
}
```

---

## 5. Sample MicroPython ESP32 Integration Script

```python
"""
Agri2Value — Sample ESP32 MicroPython Telemetry Ingestion Client
Target Hardware: ESP32 DevKit v1 with WiFi + DeepSleep
"""
import time
import urequests
import ujson
import machine

# Hardware Configuration (Store in config.py or NVS flash)
WIFI_SSID = "Kisan_Krishi_WiFi"
WIFI_PASS = "secure_password"
API_URL = "https://your-domain.com/api/v1/iot/telemetry"
DEVICE_CODE = "ESP32-NIPHAD-NODE-01"
DEVICE_TOKEN = "a2v_dev_your_secret_provisioned_token"

def connect_wifi():
    import network
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        wlan.connect(WIFI_SSID, WIFI_PASS)
        for _ in range(20):
            if wlan.isconnected():
                break
            time.sleep(0.5)
    return wlan.isconnected()

def read_sensors():
    # Example reading from ADC & I2C
    # Replace with real hardware drivers (e.g. machine.ADC, machine.I2C)
    return {
        "soil_moisture": 42.5,
        "temperature": 28.2,
        "humidity": 63.0,
        "rainfall": 0.0,
        "battery": 4.12
    }

def send_telemetry():
    if not connect_wifi():
        print("[!] WiFi Connection Failed")
        return False

    sensors = read_sensors()
    timestamp_str = "2026-11-02T10:00:00Z" # Obtained via NTP
    event_seq = int(time.time())

    payload = {
        "readings": [
            {
                "reading_id": f"esp32-sm-{event_seq}",
                "sensor_type": "SOIL_MOISTURE",
                "value": sensors["soil_moisture"],
                "unit": "%",
                "device_timestamp": timestamp_str,
                "source_type": "PHYSICAL"
            },
            {
                "reading_id": f"esp32-temp-{event_seq}",
                "sensor_type": "AIR_TEMP",
                "value": sensors["temperature"],
                "unit": "°C",
                "device_timestamp": timestamp_str,
                "source_type": "PHYSICAL"
            },
            {
                "reading_id": f"esp32-hum-{event_seq}",
                "sensor_type": "HUMIDITY",
                "value": sensors["humidity"],
                "unit": "%",
                "device_timestamp": timestamp_str,
                "source_type": "PHYSICAL"
            },
            {
                "reading_id": f"esp32-bat-{event_seq}",
                "sensor_type": "BATTERY_VOLTAGE",
                "value": sensors["battery"],
                "unit": "V",
                "device_timestamp": timestamp_str,
                "source_type": "PHYSICAL"
            }
        ]
    }

    headers = {
        "Content-Type": "application/json",
        "X-Device-Id": DEVICE_CODE,
        "X-Device-Token": DEVICE_TOKEN
    }

    try:
        response = urequests.post(API_URL, data=ujson.dumps(payload), headers=headers)
        print(f"[+] Server Response ({response.status_code}): {response.text}")
        response.close()
        return True
    except Exception as e:
        print(f"[!] HTTP POST Failed: {e}")
        return False

if __name__ == "__main__":
    send_telemetry()
    # Enter Deep Sleep for 15 minutes to preserve battery
    # machine.deepsleep(15 * 60 * 1000)
```

---

## 6. Safety & Advisory Guardrails

1. **Advisory Decision Only:** All irrigation recommendations produced by the backend are strictly advisory.
2. **No Automated Actuation:** Agri2Value does **not** send actuation commands to pumps, solenoids, or motors in Phase 4A.
3. **Farmer Verification:** Farmers must inspect physical field conditions before engaging manual valves or irrigation equipment.
