# backend/app/iot/__init__.py
from app.iot.router import iot_router
from app.iot.service import iot_service
from app.iot.simulator import sensor_simulator

__all__ = ["iot_router", "iot_service", "sensor_simulator"]
