"""
Agri2Value — Weather Service Unit Tests.

Verifies:
- Attribution to Open-Meteo under CC BY 4.0.
- Strict separation of observed readings vs daily forecast.
- Advisory guidelines logic and mandatory disclaimer.
- Offline reference fallback behavior.
"""
import pytest
from app.weather.schemas import WeatherObserved
from app.weather.service import (
    compute_field_work_advisory,
    _get_offline_reference_weather,
    _get_wmo_info,
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
async def test_weather_service_offline_or_live_contract():
    svc = WeatherService()
    weather = await svc.get_weather(latitude=20.0760, longitude=74.0534)
    assert weather.latitude == 20.0760
    assert weather.longitude == 74.0534
    assert weather.attribution == "Weather data by Open-Meteo.com under CC BY 4.0"
    assert weather.current.observed_at is not None
    assert weather.retrieved_at is not None
    assert len(weather.daily_forecast) >= 1
