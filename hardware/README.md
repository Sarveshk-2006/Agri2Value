# Hardware — IoT and Embedded Systems

This directory contains firmware and hardware documentation for Agri2Value's IoT components.

## Planned Scope (Phase 8)

- **ESP32 Firmware:** Reads soil moisture, temperature and humidity sensors and sends telemetry to the Agri2Value backend via HTTPS.
- **Backend Integration:** Telemetry endpoint at `POST /api/v1/iot/telemetry`.
- **Dashboard:** Real-time sensor reading display with connection status.

## Status

> **Not yet implemented.** IoT development begins in Phase 8.

## Hardware Components

| Component | Purpose | Notes |
|---|---|---|
| ESP32 Dev Board | Microcontroller | Any ESP32 variant with WiFi |
| Capacitive Soil Moisture Sensor | Soil moisture reading | Must be calibrated for demo soil |
| DHT22 or SHT31 | Temperature and humidity | Optional; improves context |
| 5V Relay Module | Pump control demo | Requires electrical safety isolation |
| Submersible Mini Pump | Irrigation demo | Low-voltage bench demo only |

## Directory Structure (When Implemented)

```
hardware/
├── esp32/
│   ├── main.py               # MicroPython firmware
│   ├── config.py             # WiFi SSID, API endpoint, device ID
│   ├── sensor.py             # Sensor read + calibration functions
│   └── README.md             # Flash instructions
├── schematics/
│   └── soil_moisture_circuit.png
└── README.md                 (this file)
```

## Safety Rules

- Pump control requires hardware emergency stop / manual override switch.
- No automatic pump actuation on stale or offline sensor data.
- Device authentication uses a per-device key stored in ESP32 flash, not in source code.
- Relay module must use electrical isolation appropriate for the mains voltage in use.

## Telemetry Payload Format

```json
{
  "device_id": "demo-field-01",
  "sequence": 184,
  "observed_at": "2026-11-01T10:30:00+05:30",
  "soil_moisture_raw": 2180,
  "soil_moisture_percent": 42.5,
  "air_temperature_c": 29.1,
  "air_humidity_percent": 61.0
}
```
