# backend/app/iot/router.py
"""
Agri2Value — IoT & Edge Telematics API Router (Phase 4A).

Endpoints for:
- Device lifecycle: registration, key rotation, status management, device list.
- Hardware telemetry ingestion: authenticated via X-Device-Id and X-Device-Key.
- Microclimate telemetry history and time-series querying.
- Environmental anomaly alerts and advisory management.
- Virtual sensor simulator controls.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database.base import get_db
from app.database.models import User
from app.iot.schemas import (
    IoTDeviceCreate,
    IoTDeviceResponse,
    IoTDeviceCreatedResponse,
    IoTDeviceStatusUpdate,
    IoTKeyRotateResponse,
    TelemetryBatchIngest,
    TelemetryIngestResponse,
    TelemetryReadingResponse,
    IoTAlertResponse,
    SimulatorPresetRequest,
    SimulatorPresetResponse,
)
from app.iot.service import iot_service
from app.iot.simulator import sensor_simulator

iot_router = APIRouter(prefix="/iot", tags=["IoT & Edge Telematics"])


# ---- Device Management Endpoints ---------------------------------

@iot_router.post(
    "/devices",
    response_model=IoTDeviceCreatedResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new IoT node for a farm"
)
async def register_device(
    payload: IoTDeviceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device, raw_key = await iot_service.register_device(db, current_user, payload)
    return IoTDeviceCreatedResponse(
        id=device.id,
        device_code=device.device_code,
        device_name=device.device_name,
        farm_id=device.farm_id,
        farmer_user_id=device.farmer_user_id,
        device_type=device.device_type,
        firmware_version=device.firmware_version,
        sensor_capabilities=device.sensor_capabilities,
        status=device.status,
        data_source=device.data_source,
        api_key_prefix=device.api_key_prefix,
        last_seen_at=device.last_seen_at,
        last_reading_summary=device.last_reading_summary,
        created_at=device.created_at,
        updated_at=device.updated_at,
        raw_api_key=raw_key,
    )


@iot_router.get(
    "/devices",
    response_model=List[IoTDeviceResponse],
    summary="List all registered IoT nodes for current farmer"
)
async def list_devices(
    farm_id: Optional[str] = Query(None, description="Filter by farm ID"),
    status: Optional[str] = Query(None, description="Filter by status: ACTIVE, INACTIVE, REVOKED"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    devices = await iot_service.list_devices(db, current_user, farm_id=farm_id, status_filter=status)
    return devices


@iot_router.get(
    "/devices/{device_id}",
    response_model=IoTDeviceResponse,
    summary="Get single device details"
)
async def get_device(
    device_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await iot_service.get_device(db, device_id, current_user)


@iot_router.patch(
    "/devices/{device_id}/status",
    response_model=IoTDeviceResponse,
    summary="Update device operational status (ACTIVE, INACTIVE, REVOKED)"
)
async def update_device_status(
    device_id: str,
    payload: IoTDeviceStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await iot_service.update_device_status(db, device_id, current_user, payload.status)


@iot_router.post(
    "/devices/{device_id}/rotate-key",
    response_model=IoTKeyRotateResponse,
    summary="Rotate credentials for a device"
)
async def rotate_device_key(
    device_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device, new_raw_key = await iot_service.rotate_device_key(db, device_id, current_user)
    return IoTKeyRotateResponse(
        device_id=device.id,
        device_code=device.device_code,
        raw_api_key=new_raw_key,
        api_key_prefix=device.api_key_prefix,
        message="Key rotated successfully. Store this secret key now; it will never be displayed again."
    )


# ---- Hardware Telemetry Ingestion Endpoint -----------------------

@iot_router.post(
    "/telemetry",
    response_model=TelemetryIngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest batch telemetry from an edge IoT device (ESP32 / Virtual Node)"
)
async def ingest_telemetry(
    payload: TelemetryBatchIngest,
    x_device_id: Optional[str] = Header(None, alias="X-Device-Id"),
    x_device_key: Optional[str] = Header(None, alias="X-Device-Key"),
    x_device_token: Optional[str] = Header(None, alias="X-Device-Token"),
    authorization: Optional[str] = Header(None),
    db: AsyncSession = Depends(get_db),
):
    # Extract credentials
    device_id_or_code = x_device_id
    raw_key = x_device_key or x_device_token

    # Check Bearer format fallback: Authorization: Bearer <key> with X-Device-Id
    if not raw_key and authorization and authorization.startswith("Bearer "):
        raw_key = authorization.split(" ", 1)[1].strip()

    if not device_id_or_code or not raw_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing required device credentials. Provide X-Device-Id and X-Device-Key or X-Device-Token headers."
        )

    # Authenticate device
    device = await iot_service.authenticate_device(db, device_id_or_code, raw_key)

    # Ingest telemetry
    return await iot_service.ingest_telemetry(db, device, payload)


# ---- Telemetry History & Query Endpoints -------------------------

@iot_router.get(
    "/devices/{device_id}/telemetry",
    response_model=List[TelemetryReadingResponse],
    summary="Get historical time-series telemetry for a device"
)
async def get_device_telemetry(
    device_id: str,
    sensor_type: Optional[str] = Query(None, description="SOIL_MOISTURE, AIR_TEMP, HUMIDITY, RAINFALL"),
    start_time: Optional[datetime] = Query(None, description="ISO timestamp start filter"),
    end_time: Optional[datetime] = Query(None, description="ISO timestamp end filter"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await iot_service.get_device_telemetry(
        db, current_user, device_id, sensor_type, start_time, end_time, limit, offset
    )


@iot_router.get(
    "/farms/{farm_id}/telemetry",
    response_model=List[TelemetryReadingResponse],
    summary="Get farm-wide aggregate sensor telemetry"
)
async def get_farm_telemetry(
    farm_id: str,
    sensor_type: Optional[str] = Query(None, description="Sensor type filter"),
    start_time: Optional[datetime] = Query(None, description="ISO start filter"),
    end_time: Optional[datetime] = Query(None, description="ISO end filter"),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await iot_service.get_farm_telemetry(
        db, current_user, farm_id, sensor_type, start_time, end_time, limit, offset
    )


# ---- Environmental Advisory Alerts -------------------------------

@iot_router.get(
    "/alerts",
    response_model=List[IoTAlertResponse],
    summary="List active and historical microclimate advisory alerts"
)
async def list_alerts(
    farm_id: Optional[str] = Query(None, description="Filter by farm ID"),
    is_resolved: Optional[bool] = Query(None, description="Filter by resolved status"),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await iot_service.get_alerts(db, current_user, farm_id=farm_id, is_resolved=is_resolved, limit=limit)


@iot_router.post(
    "/alerts/{alert_id}/resolve",
    response_model=IoTAlertResponse,
    summary="Mark an environmental alert as resolved"
)
async def resolve_alert(
    alert_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await iot_service.resolve_alert(db, current_user, alert_id)


# ---- Virtual Sensor Simulator Endpoints --------------------------

@iot_router.get(
    "/simulator/scenarios",
    response_model=Dict[str, Any],
    summary="List available virtual simulation scenario presets"
)
async def list_simulator_scenarios():
    return sensor_simulator.list_scenarios()


@iot_router.post(
    "/simulator/run",
    response_model=SimulatorPresetResponse,
    summary="Run an authenticated simulation scenario on a virtual device"
)
async def run_simulator_preset(
    payload: SimulatorPresetRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    device = await iot_service.get_device(db, payload.device_id, current_user)
    return await sensor_simulator.run_simulation(db, device, payload)
