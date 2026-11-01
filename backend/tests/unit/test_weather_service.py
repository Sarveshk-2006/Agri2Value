"""
Agri2Value — Weather Service Unit Tests.

Verifies:
- Attribution to Open-Meteo under CC BY 4.0.
- Strict separation of observed readings vs daily forecast.
- Advisory guidelines logic and mandatory disclaimer.
- Offline reference fallback behavior on upstream failures.
- Mocked HTTP requests (success, failure, timeout).
"""
from unittest.mock import AsyncMock, patch, MagicMock
import httpx
import pytest

from app.services.weather_service import (
    compute_field_work_advisory,
    _get_offline_reference_weather,
    _get_wmo_info,
    WeatherObserved,
    WeatherService,
)


def test_wmo_code_resolution():
    clear = _get_wmo_info(0)
    assert clear["label"] == "Clear sky"
    assert clear["severity"] == "good"
    assert clear["icon"] == "☀️"

    rain = _get_wmo_info(63)
    assert rain["label"] == "Moderate rain"
    assert rain["severity"] == "bad"

    unknown = _get_wmo_info(999)
    assert "Weather Code 999" in unknown["label"]


def test_field_work_advisory_rain_unfavorable():
    observed = WeatherObserved(
        temperature_c=26.0,
        apparent_temperature_c=26.0,
        relative_humidity_pct=80.0,
        precipitation_mm=3.5,
        rain_mm=3.5,
        wind_speed_kmh=10.0,
        weather_code=63,
        weather_description="Moderate rain",
        weather_icon="🌧️",
        observed_at="2026-11-01T10:00:00Z",
    )
    advisory = compute_field_work_advisory(observed)
    assert advisory.status == "UNFAVORABLE"
    assert any("rainfall" in r.lower() or "precipitation" in r.lower() for r in advisory.reasons)
    assert "strictly informational" in advisory.disclaimer.lower()


def test_field_work_advisory_wind_unfavorable():
    observed = WeatherObserved(
        temperature_c=28.0,
        apparent_temperature_c=28.0,
        relative_humidity_pct=45.0,
        precipitation_mm=0.0,
        rain_mm=0.0,
        wind_speed_kmh=32.0,  # > 25 km/h
        weather_code=0,
        weather_description="Clear sky",
        weather_icon="☀️",
        observed_at="2026-11-01T10:00:00Z",
    )
    advisory = compute_field_work_advisory(observed)
    assert advisory.status == "UNFAVORABLE"
    assert any("spray drift" in r.lower() or "wind speed" in r.lower() for r in advisory.reasons)


def test_field_work_advisory_favorable():
    observed = WeatherObserved(
        temperature_c=27.0,
        apparent_temperature_c=27.0,
        relative_humidity_pct=55.0,
        precipitation_mm=0.0,
        rain_mm=0.0,
        wind_speed_kmh=12.0,
        weather_code=1,
        weather_description="Mainly clear",
        weather_icon="🌤️",
        observed_at="2026-11-01T10:00:00Z",
    )
    advisory = compute_field_work_advisory(observed)
    assert advisory.status == "FAVORABLE"
    assert "favorable" in advisory.headline.lower()


def test_offline_reference_weather():
    lat = 20.0760
    lon = 74.0534
    resp = _get_offline_reference_weather(lat, lon)

    assert resp.is_live is False
    assert resp.source_type == "offline_reference"
    assert "open-meteo" in resp.attribution.lower()
    assert len(resp.daily_forecast) == 7
    assert resp.current.temperature_c > 0.0
    assert resp.advisory.disclaimer is not None


@pytest.mark.asyncio
async def test_weather_service_mocked_success():
    mock_payload = {
        "timezone": "Asia/Kolkata",
        "current": {
            "temperature_2m": 29.5,
            "apparent_temperature": 30.2,
            "relative_humidity_2m": 62.0,
            "precipitation": 0.0,
            "rain": 0.0,
            "wind_speed_10m": 14.2,
            "weather_code": 0,
            "time": "2026-11-01T14:00:00Z",
        },
        "daily": {
            "time": ["2026-11-01", "2026-11-02"],
            "weather_code": [0, 1],
            "temperature_2m_max": [31.0, 30.5],
            "temperature_2m_min": [18.0, 17.5],
            "precipitation_sum": [0.0, 0.0],
            "wind_speed_10m_max": [15.0, 14.0],
            "sunrise": ["06:28", "06:29"],
            "sunset": ["18:02", "18:01"],
        },
    }

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_payload

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        svc = WeatherService(base_url="http://mock-open-meteo.com")
        res = await svc.get_weather(latitude=19.99, longitude=73.78, force_refresh=True)

        assert res.is_live is True
        assert res.freshness_status == "LIVE"
        assert res.current.temperature_c == 29.5
        assert len(res.daily_forecast) == 2
        assert res.daily_forecast[0].date == "2026-11-01"


@pytest.mark.asyncio
async def test_weather_service_mocked_failure_fallback():
    mock_response = MagicMock()
    mock_response.status_code = 503
    mock_response.text = "Service Unavailable"

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        svc = WeatherService(base_url="http://mock-open-meteo.com")
        res = await svc.get_weather(latitude=18.52, longitude=73.85, force_refresh=True)

        # Graceful fallback
        assert res.is_live is False
        assert res.freshness_status == "DEMO"
        assert res.source_type == "offline_reference"
        assert res.current.temperature_c == 27.4


@pytest.mark.asyncio
async def test_weather_service_mocked_timeout_fallback():
    with patch("httpx.AsyncClient.get", side_effect=httpx.ConnectTimeout("Network timeout")):
        svc = WeatherService(base_url="http://mock-open-meteo.com")
        res = await svc.get_weather(latitude=18.52, longitude=73.85, force_refresh=True)

        assert res.is_live is False
        assert res.source_type == "offline_reference"
        assert len(res.daily_forecast) == 7
