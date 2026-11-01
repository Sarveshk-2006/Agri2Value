# backend/app/iot/schemas.py
from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict, Field, field_validator


class IoTDeviceCreate(BaseModel):
    device_code: str = Field(..., min_length=3, max_length=64, description="Unique human-readable hardware/device ID")
    device_name: str = Field(..., min_length=2, max_length=100, description="Friendly device name (e.g. Field North Node)")
    farm_id: str = Field(..., description="ID of associated Farm")
    device_type: str = Field(default="ESP32_AGRI_NODE", description="Device hardware type")
    firmware_version: str = Field(default="v1.0.0-sim", description="Firmware version tag")
    sensor_capabilities: str = Field(
        default="SOIL_MOISTURE,AIR_TEMP,HUMIDITY,RAINFALL",
        description="Comma-separated list of supported sensors"
    )
    data_source: str = Field(default="SIMULATED", description="Data source: SIMULATED or PHYSICAL")

    @field_validator("data_source")
    @classmethod
    def validate_data_source(cls, v: str) -> str:
        v_upper = v.upper()
        if v_upper not in {"SIMULATED", "PHYSICAL"}:
            raise ValueError("data_source must be either 'SIMULATED' or 'PHYSICAL'")
        return v_upper


class IoTDeviceStatusUpdate(BaseModel):
    status: str = Field(..., description="ACTIVE, INACTIVE, or REVOKED")

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        v_upper = v.upper()
        if v_upper not in {"ACTIVE", "INACTIVE", "REVOKED"}:
            raise ValueError("status must be ACTIVE, INACTIVE, or REVOKED")
        return v_upper


class IoTDeviceResponse(BaseModel):
    id: str
    device_code: str
    device_name: str
    farm_id: str
    farmer_user_id: str
    device_type: str
    firmware_version: str
    sensor_capabilities: str
    status: str
    data_source: str
    api_key_prefix: str
    last_seen_at: Optional[datetime] = None
    last_reading_summary: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IoTDeviceCreatedResponse(IoTDeviceResponse):
    raw_api_key: str = Field(
        ...,
        description="Raw API Secret Key. Store securely now; this will NEVER be shown again."
    )


class IoTKeyRotateResponse(BaseModel):
    device_id: str
    device_code: str
    raw_api_key: str
    api_key_prefix: str
    message: str


# ---- Telemetry Ingestion Schemas ---------------------------------

VALID_SENSOR_RANGES: Dict[str, Dict[str, Any]] = {
    "SOIL_MOISTURE": {"min": Decimal("0.0"), "max": Decimal("100.0"), "units": {"%", "pct", "percent"}},
    "AIR_TEMP": {"min": Decimal("-20.0"), "max": Decimal("65.0"), "units": {"°c", "celsius", "c", "degc", "degree_c"}},
    "HUMIDITY": {"min": Decimal("0.0"), "max": Decimal("100.0"), "units": {"%", "pct", "percent", "%rh", "rh"}},
    "RAINFALL": {"min": Decimal("0.0"), "max": Decimal("500.0"), "units": {"mm", "millimeter", "millimeters"}},
    "LIGHT_INTENSITY": {"min": Decimal("0.0"), "max": Decimal("200000.0"), "units": {"lux", "lx"}},
    "BATTERY_VOLTAGE": {"min": Decimal("0.0"), "max": Decimal("15.0"), "units": {"v", "volt", "volts"}},
}


class TelemetryReadingItem(BaseModel):
    reading_id: str = Field(..., min_length=1, max_length=64, description="Unique client reading/event ID for deduplication")
    sensor_type: str = Field(..., description="SOIL_MOISTURE | AIR_TEMP | HUMIDITY | RAINFALL | LIGHT_INTENSITY | BATTERY_VOLTAGE")
    value: Decimal = Field(..., description="Sensor numeric value")
    unit: str = Field(..., max_length=20, description="Measurement unit (%, °C, mm, lux, V)")
    device_timestamp: datetime = Field(..., description="Timestamp recorded by device when measured")
    source_type: Optional[str] = Field(default="SIMULATED", description="SIMULATED or PHYSICAL")
    raw_metadata: Optional[str] = None

    @field_validator("sensor_type")
    @classmethod
    def validate_sensor_type(cls, v: str) -> str:
        v_upper = v.upper()
        if v_upper not in VALID_SENSOR_RANGES:
            raise ValueError(f"Unsupported sensor_type '{v}'. Must be one of: {list(VALID_SENSOR_RANGES.keys())}")
        return v_upper

    @field_validator("source_type")
    @classmethod
    def validate_source_type(cls, v: Optional[str]) -> str:
        if not v:
            return "SIMULATED"
        v_upper = v.upper()
        if v_upper not in {"SIMULATED", "PHYSICAL"}:
            raise ValueError("source_type must be either 'SIMULATED' or 'PHYSICAL'")
        return v_upper


class TelemetryBatchIngest(BaseModel):
    farm_id: Optional[str] = Field(default=None, description="Optional farm ID verification")
    readings: List[TelemetryReadingItem] = Field(..., min_length=1, max_length=100, description="Batch of sensor readings")


class TelemetryIngestResponse(BaseModel):
    status: str
    device_id: str
    ingested_count: int
    duplicate_count: int
    alerts_triggered: int
    server_timestamp: datetime
    message: str


class TelemetryReadingResponse(BaseModel):
    id: str
    device_id: str
    farm_id: str
    reading_id: str
    sensor_type: str
    value: Decimal
    unit: str
    device_timestamp: datetime
    server_ingested_at: datetime
    source_type: str
    quality_flag: str
    raw_metadata: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ---- Alert Schemas -----------------------------------------------

class IoTAlertResponse(BaseModel):
    id: str
    device_id: str
    farm_id: str
    alert_type: str
    severity: str
    trigger_reading_id: Optional[str] = None
    sensor_type: Optional[str] = None
    trigger_value: Optional[Decimal] = None
    trigger_unit: Optional[str] = None
    reading_timestamp: Optional[datetime] = None
    threshold_used: str
    source_type: str
    explanation: str
    is_resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---- Simulator Schemas -------------------------------------------

class SimulatorPresetRequest(BaseModel):
    device_id: str = Field(..., description="Target IoT Device ID to simulate")
    scenario: str = Field(
        default="NORMAL_OPTIMAL",
        description="Scenario preset: NORMAL_OPTIMAL | LOW_MOISTURE_DROUGHT | HEATWAVE_STRESS | HIGH_HUMIDITY_BLIGHT | HEAVY_MONSOON_RAIN | DEVICE_OFFLINE"
    )
    custom_soil_moisture: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    custom_temperature: Optional[float] = Field(default=None, ge=-20.0, le=65.0)
    custom_humidity: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    custom_rainfall: Optional[float] = Field(default=None, ge=0.0, le=500.0)


class SimulatorPresetResponse(BaseModel):
    scenario: str
    device_id: str
    device_code: str
    telemetry_response: Optional[TelemetryIngestResponse] = None
    alerts_count: int
    summary: Dict[str, Any]
    disclaimer: str
