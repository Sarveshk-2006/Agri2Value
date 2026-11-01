# backend/app/iot/service.py
import json
import secrets
import hashlib
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional, Tuple, Dict, Any

from fastapi import HTTPException, status
from sqlalchemy import select, and_, desc, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import (
    Farm,
    User,
    IoTDevice,
    IoTTelemetryReading,
    IoTAlert,
)
from app.iot.schemas import (
    IoTDeviceCreate,
    IoTDeviceResponse,
    IoTDeviceCreatedResponse,
    IoTKeyRotateResponse,
    TelemetryBatchIngest,
    TelemetryIngestResponse,
    TelemetryReadingItem,
    VALID_SENSOR_RANGES,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def generate_device_api_key() -> Tuple[str, str, str]:
    """
    Generate raw device API key, its SHA-256 hash, and a safe prefix for display.
    """
    token = secrets.token_urlsafe(32)
    raw_key = f"a2v_dev_{token}"
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    key_prefix = f"{raw_key[:12]}..."
    return raw_key, key_hash, key_prefix


def hash_device_api_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


class IoTService:

    # ---- Device Management -----------------------------------------

    async def register_device(self, db: AsyncSession, user: User, data: IoTDeviceCreate) -> Tuple[IoTDevice, str]:
        # 1. Enforce farm ownership
        res_farm = await db.execute(
            select(Farm).where(Farm.id == data.farm_id, Farm.owner_user_id == user.id)
        )
        farm = res_farm.scalar_one_or_none()
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farm '{data.farm_id}' not found or not owned by current user"
            )

        # 2. Check device_code uniqueness
        res_existing = await db.execute(
            select(IoTDevice).where(IoTDevice.device_code == data.device_code)
        )
        existing = res_existing.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Device code '{data.device_code}' is already registered"
            )

        # 3. Generate secure credentials
        raw_key, key_hash, key_prefix = generate_device_api_key()

        device = IoTDevice(
            device_code=data.device_code,
            device_name=data.device_name,
            farm_id=farm.id,
            farmer_user_id=user.id,
            device_type=data.device_type,
            firmware_version=data.firmware_version,
            sensor_capabilities=data.sensor_capabilities,
            status="ACTIVE",
            data_source=data.data_source,
            api_key_hash=key_hash,
            api_key_prefix=key_prefix,
            created_at=_now(),
            updated_at=_now(),
        )
        db.add(device)
        await db.commit()
        await db.refresh(device)
        return device, raw_key

    async def get_device(self, db: AsyncSession, device_id: str, user: Optional[User] = None) -> IoTDevice:
        stmt = select(IoTDevice).where(IoTDevice.id == device_id)
        if user:
            stmt = stmt.where(IoTDevice.farmer_user_id == user.id)
        res = await db.execute(stmt)
        device = res.scalar_one_or_none()
        if not device:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"IoT device '{device_id}' not found"
            )
        return device

    async def list_devices(
        self,
        db: AsyncSession,
        user: User,
        farm_id: Optional[str] = None,
        status_filter: Optional[str] = None
    ) -> List[IoTDevice]:
        stmt = select(IoTDevice).where(IoTDevice.farmer_user_id == user.id)
        if farm_id:
            stmt = stmt.where(IoTDevice.farm_id == farm_id)
        if status_filter:
            stmt = stmt.where(IoTDevice.status == status_filter.upper())
        stmt = stmt.order_by(desc(IoTDevice.created_at))
        res = await db.execute(stmt)
        return list(res.scalars().all())

    async def update_device_status(self, db: AsyncSession, device_id: str, user: User, new_status: str) -> IoTDevice:
        device = await self.get_device(db, device_id, user)
        device.status = new_status
        device.updated_at = _now()
        await db.commit()
        await db.refresh(device)
        return device

    async def rotate_device_key(self, db: AsyncSession, device_id: str, user: User) -> Tuple[IoTDevice, str]:
        device = await self.get_device(db, device_id, user)
        raw_key, key_hash, key_prefix = generate_device_api_key()
        device.api_key_hash = key_hash
        device.api_key_prefix = key_prefix
        device.updated_at = _now()
        await db.commit()
        await db.refresh(device)
        return device, raw_key

    # ---- Device Authentication -------------------------------------

    async def authenticate_device(self, db: AsyncSession, device_id_or_code: str, raw_api_key: str) -> IoTDevice:
        stmt = select(IoTDevice).where(
            (IoTDevice.id == device_id_or_code) | (IoTDevice.device_code == device_id_or_code)
        )
        res = await db.execute(stmt)
        device = res.scalar_one_or_none()
        if not device:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid device credentials: Device not recognized"
            )

        if device.status == "REVOKED":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Device access revoked. Contact farm administrator."
            )

        if device.status == "INACTIVE":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Device is currently disabled/inactive."
            )

        submitted_hash = hash_device_api_key(raw_api_key)
        if not secrets.compare_digest(submitted_hash, device.api_key_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid device credentials: API Key mismatch"
            )

        return device

    # ---- Telemetry Ingestion ---------------------------------------

    async def ingest_telemetry(
        self,
        db: AsyncSession,
        device: IoTDevice,
        payload: TelemetryBatchIngest
    ) -> TelemetryIngestResponse:
        # Enforce device-to-farm authorization
        if payload.farm_id and payload.farm_id != device.farm_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Device '{device.device_code}' belongs to farm '{device.farm_id}', unauthorized for farm '{payload.farm_id}'"
            )

        now_utc = _now()
        ingested_count = 0
        duplicate_count = 0
        latest_reading_time = device.last_seen_at
        if latest_reading_time is not None and latest_reading_time.tzinfo is None:
            latest_reading_time = latest_reading_time.replace(tzinfo=timezone.utc)
        current_readings_map: Dict[str, Any] = {}

        if device.last_reading_summary:
            try:
                current_readings_map = json.loads(device.last_reading_summary)
            except Exception:
                current_readings_map = {}

        new_alerts: List[IoTAlert] = []

        for item in payload.readings:
            # 1. Validate range and unit
            rule = VALID_SENSOR_RANGES.get(item.sensor_type)
            if not rule:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Unsupported sensor type: '{item.sensor_type}'"
                )

            unit_clean = item.unit.strip().lower()
            allowed_units = rule["units"]
            if unit_clean not in allowed_units:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid unit '{item.unit}' for sensor '{item.sensor_type}'. Allowed: {list(allowed_units)}"
                )

            val_dec = Decimal(str(item.value))
            if val_dec < rule["min"] or val_dec > rule["max"]:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Sensor value {val_dec} for '{item.sensor_type}' outside realistic range [{rule['min']}, {rule['max']}]"
                )

            # 2. Check duplicate reading_id for this device
            res_existing = await db.execute(
                select(IoTTelemetryReading).where(
                    IoTTelemetryReading.device_id == device.id,
                    IoTTelemetryReading.reading_id == item.reading_id
                )
            )
            existing = res_existing.scalar_one_or_none()

            if existing:
                duplicate_count += 1
                continue

            unit_norm = "%" if unit_clean in {"%", "pct"} else ("°C" if unit_clean in {"°c", "celsius", "c"} else item.unit)

            reading_dt = item.device_timestamp
            if reading_dt.tzinfo is None:
                reading_dt = reading_dt.replace(tzinfo=timezone.utc)

            reading_record = IoTTelemetryReading(
                device_id=device.id,
                farm_id=device.farm_id,
                reading_id=item.reading_id,
                sensor_type=item.sensor_type,
                value=val_dec,
                unit=unit_norm,
                device_timestamp=reading_dt,
                server_ingested_at=now_utc,
                source_type=item.source_type or device.data_source,
                quality_flag="VALID",
                raw_metadata=item.raw_metadata,
            )
            db.add(reading_record)
            ingested_count += 1

            current_readings_map[item.sensor_type] = {
                "value": float(val_dec),
                "unit": unit_norm,
                "timestamp": reading_dt.isoformat(),
                "source_type": reading_record.source_type,
            }

            if latest_reading_time is None or reading_dt > latest_reading_time:
                latest_reading_time = reading_dt

            # Automated Alert Evaluation & Condition Recovery
            alert = await self._evaluate_reading_alert(db, device, reading_record, new_alerts)
            if alert:
                db.add(alert)
                new_alerts.append(alert)

        # 3. Update device state
        if latest_reading_time:
            if latest_reading_time.tzinfo is None:
                latest_reading_time = latest_reading_time.replace(tzinfo=timezone.utc)
            if device.last_seen_at is None:
                device.last_seen_at = latest_reading_time
            else:
                curr_seen = device.last_seen_at
                if curr_seen.tzinfo is None:
                    curr_seen = curr_seen.replace(tzinfo=timezone.utc)
                if latest_reading_time > curr_seen:
                    device.last_seen_at = latest_reading_time

        device.last_reading_summary = json.dumps(current_readings_map)
        device.updated_at = now_utc

        await db.commit()

        return TelemetryIngestResponse(
            status="INGESTED",
            device_id=device.id,
            ingested_count=ingested_count,
            duplicate_count=duplicate_count,
            alerts_triggered=len(new_alerts),
            server_timestamp=now_utc,
            message=f"Processed {len(payload.readings)} readings: {ingested_count} saved, {duplicate_count} duplicates skipped."
        )

    async def _evaluate_reading_alert(
        self,
        db: AsyncSession,
        device: IoTDevice,
        reading: IoTTelemetryReading,
        pending_alerts: List[IoTAlert]
    ) -> Optional[IoTAlert]:
        """
        Evaluate advisory alerts based on demonstration agronomic thresholds.
        Includes automatic condition recovery and duplicate suppression.
        """
        val = float(reading.value)
        stype = reading.sensor_type
        now_time = _now()

        # Helper to check if an active unresolved alert already exists for this device & alert type
        async def has_active_alert(atype: str) -> bool:
            if any(a.alert_type == atype and a.device_id == device.id for a in pending_alerts):
                return True
            res = await db.execute(
                select(IoTAlert).where(
                    IoTAlert.device_id == device.id,
                    IoTAlert.alert_type == atype,
                    IoTAlert.is_resolved == False
                )
            )
            return res.scalar_one_or_none() is not None

        # Helper to auto-resolve alerts when conditions return to safe ranges
        async def auto_resolve_alerts(atype: str):
            res = await db.execute(
                select(IoTAlert).where(
                    IoTAlert.device_id == device.id,
                    IoTAlert.alert_type == atype,
                    IoTAlert.is_resolved == False
                )
            )
            for a in res.scalars().all():
                a.is_resolved = True
                a.resolved_at = now_time

        if stype == "SOIL_MOISTURE":
            if val < 30.0:
                if not await has_active_alert("LOW_SOIL_MOISTURE"):
                    severity = "CRITICAL" if val < 20.0 else "WARNING"
                    return IoTAlert(
                        device_id=device.id,
                        farm_id=device.farm_id,
                        alert_type="LOW_SOIL_MOISTURE",
                        severity=severity,
                        trigger_reading_id=reading.reading_id,
                        sensor_type=stype,
                        trigger_value=reading.value,
                        trigger_unit=reading.unit,
                        reading_timestamp=reading.device_timestamp,
                        threshold_used="SOIL_MOISTURE < 30.0% (Configured Dry-Soil Threshold)",
                        source_type=reading.source_type,
                        explanation=f"Advisory: Soil moisture dropped to {val}%, below the 30.0% configured threshold. Inspect the field rootzone and consider irrigation. Note: Automated pump actuation is disabled (Advisory Only).",
                        is_resolved=False,
                        created_at=now_time,
                    )
            elif val >= 35.0:
                await auto_resolve_alerts("LOW_SOIL_MOISTURE")

        if stype == "AIR_TEMP":
            if val > 38.0:
                if not await has_active_alert("HIGH_TEMPERATURE"):
                    return IoTAlert(
                        device_id=device.id,
                        farm_id=device.farm_id,
                        alert_type="HIGH_TEMPERATURE",
                        severity="WARNING",
                        trigger_reading_id=reading.reading_id,
                        sensor_type=stype,
                        trigger_value=reading.value,
                        trigger_unit=reading.unit,
                        reading_timestamp=reading.device_timestamp,
                        threshold_used="AIR_TEMP > 38.0°C (Configured Heat-Stress Threshold)",
                        source_type=reading.source_type,
                        explanation=f"Advisory: Microclimate air temperature spiked to {val}°C, exceeding the 38.0°C threshold. Monitor for sunscald and consider shaded net inspection or protective mulching.",
                        is_resolved=False,
                        created_at=now_time,
                    )
            elif val <= 35.0:
                await auto_resolve_alerts("HIGH_TEMPERATURE")

        if stype == "HUMIDITY":
            if val > 85.0:
                if not await has_active_alert("HIGH_HUMIDITY"):
                    return IoTAlert(
                        device_id=device.id,
                        farm_id=device.farm_id,
                        alert_type="HIGH_HUMIDITY",
                        severity="WARNING",
                        trigger_reading_id=reading.reading_id,
                        sensor_type=stype,
                        trigger_value=reading.value,
                        trigger_unit=reading.unit,
                        reading_timestamp=reading.device_timestamp,
                        threshold_used="HUMIDITY > 85.0% (Configured Fungal-Risk Threshold)",
                        source_type=reading.source_type,
                        explanation=f"Advisory: Relative humidity reached {val}%, exceeding the 85.0% threshold. Favorable conditions for fungal sporulation and early blight. Inspect lower canopy foliage.",
                        is_resolved=False,
                        created_at=now_time,
                    )
            elif val <= 80.0:
                await auto_resolve_alerts("HIGH_HUMIDITY")

        if stype == "RAINFALL":
            if val > 25.0:
                if not await has_active_alert("HEAVY_RAINFALL"):
                    return IoTAlert(
                        device_id=device.id,
                        farm_id=device.farm_id,
                        alert_type="HEAVY_RAINFALL",
                        severity="WARNING",
                        trigger_reading_id=reading.reading_id,
                        sensor_type=stype,
                        trigger_value=reading.value,
                        trigger_unit=reading.unit,
                        reading_timestamp=reading.device_timestamp,
                        threshold_used="RAINFALL > 25.0mm (Configured Waterlogging Threshold)",
                        source_type=reading.source_type,
                        explanation=f"Advisory: Field sensor logged {val}mm heavy precipitation. Risk of furrow waterlogging and field access delays.",
                        is_resolved=False,
                        created_at=now_time,
                    )
            elif val <= 5.0:
                await auto_resolve_alerts("HEAVY_RAINFALL")

        return None

    # ---- Telemetry & Alerts Retrieval ------------------------------

    async def get_device_telemetry(
        self,
        db: AsyncSession,
        user: User,
        device_id: str,
        sensor_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[IoTTelemetryReading]:
        # Enforce device ownership
        await self.get_device(db, device_id, user)

        stmt = select(IoTTelemetryReading).where(IoTTelemetryReading.device_id == device_id)
        if sensor_type:
            stmt = stmt.where(IoTTelemetryReading.sensor_type == sensor_type.upper())
        if start_time:
            stmt = stmt.where(IoTTelemetryReading.device_timestamp >= start_time)
        if end_time:
            stmt = stmt.where(IoTTelemetryReading.device_timestamp <= end_time)

        stmt = stmt.order_by(desc(IoTTelemetryReading.device_timestamp)).offset(offset).limit(limit)
        res = await db.execute(stmt)
        return list(res.scalars().all())

    async def get_farm_telemetry(
        self,
        db: AsyncSession,
        user: User,
        farm_id: str,
        sensor_type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[IoTTelemetryReading]:
        # Enforce farm ownership
        res_farm = await db.execute(
            select(Farm).where(Farm.id == farm_id, Farm.owner_user_id == user.id)
        )
        farm = res_farm.scalar_one_or_none()
        if not farm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Farm '{farm_id}' not found or unauthorized"
            )

        stmt = select(IoTTelemetryReading).where(IoTTelemetryReading.farm_id == farm_id)
        if sensor_type:
            stmt = stmt.where(IoTTelemetryReading.sensor_type == sensor_type.upper())
        if start_time:
            stmt = stmt.where(IoTTelemetryReading.device_timestamp >= start_time)
        if end_time:
            stmt = stmt.where(IoTTelemetryReading.device_timestamp <= end_time)

        stmt = stmt.order_by(desc(IoTTelemetryReading.device_timestamp)).offset(offset).limit(limit)
        res = await db.execute(stmt)
        return list(res.scalars().all())

    async def get_alerts(
        self,
        db: AsyncSession,
        user: User,
        farm_id: Optional[str] = None,
        is_resolved: Optional[bool] = None,
        limit: int = 50
    ) -> List[IoTAlert]:
        stmt = select(IoTAlert).join(IoTDevice, IoTAlert.device_id == IoTDevice.id).where(
            IoTDevice.farmer_user_id == user.id
        )
        if farm_id:
            stmt = stmt.where(IoTAlert.farm_id == farm_id)
        if is_resolved is not None:
            stmt = stmt.where(IoTAlert.is_resolved == is_resolved)

        stmt = stmt.order_by(desc(IoTAlert.created_at)).limit(limit)
        res = await db.execute(stmt)
        return list(res.scalars().all())

    async def resolve_alert(self, db: AsyncSession, user: User, alert_id: str) -> IoTAlert:
        stmt = select(IoTAlert).join(IoTDevice, IoTAlert.device_id == IoTDevice.id).where(
            IoTAlert.id == alert_id,
            IoTDevice.farmer_user_id == user.id
        )
        res = await db.execute(stmt)
        alert = res.scalar_one_or_none()
        if not alert:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Alert '{alert_id}' not found or unauthorized"
            )
        alert.is_resolved = True
        alert.resolved_at = _now()
        await db.commit()
        await db.refresh(alert)
        return alert


iot_service = IoTService()
