# backend/app/iot/simulator.py
"""
Virtual Sensor Simulator for Agri2Value (Phase 4A).

Generates synthetic, deterministic, and physically plausible sensor readings
and injects them through the standard telemetry ingestion path with
`source_type=SIMULATED`.
"""
import uuid
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import Dict, Any, List

from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status

from app.database.models import IoTDevice, IoTAlert
from app.iot.schemas import (
    SimulatorPresetRequest,
    SimulatorPresetResponse,
    TelemetryBatchIngest,
    TelemetryReadingItem,
)
from app.iot.service import iot_service, _now


PRESET_CONFIGURATIONS = {
    "NORMAL_OPTIMAL": {
        "title": "Optimal Microclimate",
        "description": "Favorable tomato vegetative/fruiting conditions: balanced soil moisture, mild air temperature, and normal humidity.",
        "soil_moisture": 55.0,
        "temperature": 27.5,
        "humidity": 62.0,
        "rainfall": 0.0,
        "light": 48000.0,
        "battery": 4.18,
    },
    "LOW_MOISTURE_DROUGHT": {
        "title": "Severe Soil Moisture Stress",
        "description": "Depleted rootzone hydration (<30%). Immediate drip irrigation required to prevent blossom end rot and wilt.",
        "soil_moisture": 21.5,
        "temperature": 34.2,
        "humidity": 38.0,
        "rainfall": 0.0,
        "light": 72000.0,
        "battery": 4.05,
    },
    "HEATWAVE_STRESS": {
        "title": "Extreme Heat Stress",
        "description": "Canopy heatwave (>38°C). High pollen sterility and accelerated field respiration hazard.",
        "soil_moisture": 38.0,
        "temperature": 41.5,
        "humidity": 26.0,
        "rainfall": 0.0,
        "light": 85000.0,
        "battery": 3.98,
    },
    "HIGH_HUMIDITY_BLIGHT": {
        "title": "High Humidity & Fungal Threat",
        "description": "Sustained high relative humidity (>85%). Favorable conditions for Phytophthora infestans (Late Blight) spore germination.",
        "soil_moisture": 72.0,
        "temperature": 23.5,
        "humidity": 92.0,
        "rainfall": 3.5,
        "light": 22000.0,
        "battery": 4.10,
    },
    "HEAVY_MONSOON_RAIN": {
        "title": "Torrential Downpour & Waterlogging",
        "description": "Heavy rainfall surge (>25mm). Surface waterlogging, root suffocation, and farm access delays.",
        "soil_moisture": 96.0,
        "temperature": 22.0,
        "humidity": 96.0,
        "rainfall": 38.5,
        "light": 8000.0,
        "battery": 4.02,
    },
}


class SensorSimulator:

    def list_scenarios(self) -> Dict[str, Any]:
        return {
            scenario_key: {
                "key": scenario_key,
                "title": cfg["title"],
                "description": cfg["description"],
                "baseline_values": {
                    "soil_moisture_pct": cfg["soil_moisture"],
                    "temperature_c": cfg["temperature"],
                    "humidity_pct": cfg["humidity"],
                    "rainfall_mm": cfg["rainfall"],
                }
            }
            for scenario_key, cfg in PRESET_CONFIGURATIONS.items()
        }

    async def run_simulation(
        self,
        db: AsyncSession,
        device: IoTDevice,
        req: SimulatorPresetRequest
    ) -> SimulatorPresetResponse:
        now_utc = _now()

        # Handle DEVICE_OFFLINE simulation
        if req.scenario.upper() == "DEVICE_OFFLINE":
            stale_time = now_utc - timedelta(minutes=30)
            device.last_seen_at = stale_time
            device.updated_at = now_utc

            alert = IoTAlert(
                device_id=device.id,
                farm_id=device.farm_id,
                alert_type="DEVICE_OFFLINE",
                severity="WARNING",
                threshold_used="NO_TELEMETRY > 15 Minutes (Demonstration Default)",
                source_type="SIMULATED",
                explanation=f"Virtual Node '{device.device_code}' missed heartbeat check. Last seen {stale_time.strftime('%H:%M:%S UTC')}.",
                is_resolved=False,
                created_at=now_utc,
            )
            db.add(alert)
            await db.commit()

            return SimulatorPresetResponse(
                scenario="DEVICE_OFFLINE",
                device_id=device.id,
                device_code=device.device_code,
                telemetry_response=None,
                alerts_count=1,
                summary={
                    "status": "SIMULATED_OFFLINE",
                    "simulated_last_seen": stale_time.isoformat(),
                    "message": "Device heartbeat halted. Triggered DEVICE_OFFLINE advisory."
                },
                disclaimer="SIMULATED IOT TELEMETRY: Explicitly generated for testing advisory workflows without physical hardware."
            )

        # Lookup preset baseline
        scenario_key = req.scenario.upper()
        cfg = PRESET_CONFIGURATIONS.get(scenario_key)
        if not cfg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown simulator scenario '{req.scenario}'. Allowed: {list(PRESET_CONFIGURATIONS.keys()) + ['DEVICE_OFFLINE']}"
            )

        sm_val = req.custom_soil_moisture if req.custom_soil_moisture is not None else cfg["soil_moisture"]
        temp_val = req.custom_temperature if req.custom_temperature is not None else cfg["temperature"]
        hum_val = req.custom_humidity if req.custom_humidity is not None else cfg["humidity"]
        rain_val = req.custom_rainfall if req.custom_rainfall is not None else cfg["rainfall"]
        light_val = cfg.get("light", 50000.0)
        battery_val = cfg.get("battery", 4.12)

        batch_id = uuid.uuid4().hex[:8]
        readings = [
            TelemetryReadingItem(
                reading_id=f"sim-sm-{batch_id}",
                sensor_type="SOIL_MOISTURE",
                value=Decimal(str(round(sm_val, 2))),
                unit="%",
                device_timestamp=now_utc,
                source_type="SIMULATED",
                raw_metadata=f"scenario={scenario_key}"
            ),
            TelemetryReadingItem(
                reading_id=f"sim-temp-{batch_id}",
                sensor_type="AIR_TEMP",
                value=Decimal(str(round(temp_val, 2))),
                unit="°C",
                device_timestamp=now_utc,
                source_type="SIMULATED",
                raw_metadata=f"scenario={scenario_key}"
            ),
            TelemetryReadingItem(
                reading_id=f"sim-hum-{batch_id}",
                sensor_type="HUMIDITY",
                value=Decimal(str(round(hum_val, 2))),
                unit="%",
                device_timestamp=now_utc,
                source_type="SIMULATED",
                raw_metadata=f"scenario={scenario_key}"
            ),
            TelemetryReadingItem(
                reading_id=f"sim-rain-{batch_id}",
                sensor_type="RAINFALL",
                value=Decimal(str(round(rain_val, 2))),
                unit="mm",
                device_timestamp=now_utc,
                source_type="SIMULATED",
                raw_metadata=f"scenario={scenario_key}"
            ),
            TelemetryReadingItem(
                reading_id=f"sim-lux-{batch_id}",
                sensor_type="LIGHT_INTENSITY",
                value=Decimal(str(round(light_val, 2))),
                unit="lux",
                device_timestamp=now_utc,
                source_type="SIMULATED",
                raw_metadata=f"scenario={scenario_key}"
            ),
            TelemetryReadingItem(
                reading_id=f"sim-bat-{batch_id}",
                sensor_type="BATTERY_VOLTAGE",
                value=Decimal(str(round(battery_val, 2))),
                unit="V",
                device_timestamp=now_utc,
                source_type="SIMULATED",
                raw_metadata=f"scenario={scenario_key}"
            ),
        ]

        batch_payload = TelemetryBatchIngest(
            farm_id=device.farm_id,
            readings=readings
        )

        # Ingest through the exact same standard pipeline
        ingest_res = await iot_service.ingest_telemetry(db, device, batch_payload)

        return SimulatorPresetResponse(
            scenario=scenario_key,
            device_id=device.id,
            device_code=device.device_code,
            telemetry_response=ingest_res,
            alerts_count=ingest_res.alerts_triggered,
            summary={
                "soil_moisture": float(sm_val),
                "air_temperature": float(temp_val),
                "humidity": float(hum_val),
                "rainfall": float(rain_val),
                "scenario_title": cfg["title"],
                "quality_check": "VALID",
            },
            disclaimer="SIMULATED IOT TELEMETRY: Ingested via standard validation pipeline. Visibly tagged as SIMULATED."
        )


sensor_simulator = SensorSimulator()
