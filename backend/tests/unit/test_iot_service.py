# backend/tests/unit/test_iot_service.py
import pytest
from decimal import Decimal
import hashlib

from app.iot.service import generate_device_api_key, hash_device_api_key
from app.iot.schemas import VALID_SENSOR_RANGES
from app.iot.simulator import PRESET_CONFIGURATIONS, sensor_simulator


def test_generate_and_hash_device_api_key():
    raw_key, key_hash, key_prefix = generate_device_api_key()

    assert raw_key.startswith("a2v_dev_")
    assert len(raw_key) > 40
    assert len(key_hash) == 64  # SHA-256 hex length
    assert key_prefix.startswith("a2v_dev_")
    assert key_prefix.endswith("...")

    # Verification
    expected_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    assert key_hash == expected_hash
    assert hash_device_api_key(raw_key) == expected_hash


def test_valid_sensor_ranges_coverage():
    expected_sensors = {
        "SOIL_MOISTURE",
        "AIR_TEMP",
        "HUMIDITY",
        "RAINFALL",
        "LIGHT_INTENSITY",
        "BATTERY_VOLTAGE",
    }
    assert expected_sensors.issubset(set(VALID_SENSOR_RANGES.keys()))

    # Verify soil moisture limits
    sm_rule = VALID_SENSOR_RANGES["SOIL_MOISTURE"]
    assert sm_rule["min"] == Decimal("0.0")
    assert sm_rule["max"] == Decimal("100.0")
    assert "%" in sm_rule["units"]

    # Verify temperature limits
    temp_rule = VALID_SENSOR_RANGES["AIR_TEMP"]
    assert temp_rule["min"] == Decimal("-20.0")
    assert temp_rule["max"] == Decimal("65.0")
    assert "°C" in temp_rule["units"] or "celsius" in temp_rule["units"]


def test_simulator_scenarios_listing():
    scenarios = sensor_simulator.list_scenarios()
    assert "NORMAL_OPTIMAL" in scenarios
    assert "LOW_MOISTURE_DROUGHT" in scenarios
    assert "HEATWAVE_STRESS" in scenarios
    assert "HIGH_HUMIDITY_BLIGHT" in scenarios
    assert "HEAVY_MONSOON_RAIN" in scenarios

    # Check drought threshold values
    drought_vals = scenarios["LOW_MOISTURE_DROUGHT"]["baseline_values"]
    assert drought_vals["soil_moisture_pct"] < 30.0  # Must be below low soil moisture threshold

    # Check heatwave threshold values
    heat_vals = scenarios["HEATWAVE_STRESS"]["baseline_values"]
    assert heat_vals["temperature_c"] > 38.0  # Must exceed high temperature threshold
