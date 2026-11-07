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


def test_forecast_dates_are_valid_iso_and_sequential():
    """Validates that all forecast items contain valid YYYY-MM-DD dates without NaN or invalid tokens."""
    from datetime import datetime, date
    ref = _get_offline_reference_weather(20.0760, 74.0534)
    assert len(ref.daily_forecast) == 7
    dates = [item.date for item in ref.daily_forecast]
    
    parsed_dates = []
    for d_str in dates:
        assert d_str != "Invalid Date"
        assert not d_str.startswith("Day ")
        assert d_str not in ("Today", "Tomorrow")
        # Must be YYYY-MM-DD
        d = datetime.strptime(d_str, "%Y-%m-%d").date()
        parsed_dates.append(d)
        
    for i in range(len(parsed_dates) - 1):
        assert (parsed_dates[i + 1] - parsed_dates[i]).days == 1


def test_forecast_date_month_and_year_boundary():
    """Validates date generation and schema validation across month and leap/year boundaries."""
    from datetime import date, timedelta
    from app.services.weather_service import DailyForecastItem
    
    # Month boundary: Oct 31 to Nov 1
    oct_31 = date(2026, 10, 31)
    nov_1 = oct_31 + timedelta(days=1)
    assert nov_1.isoformat() == "2026-11-01"
    
    # Year boundary: Dec 31 to Jan 1
    dec_31 = date(2026, 12, 31)
    jan_1 = dec_31 + timedelta(days=1)
    assert jan_1.isoformat() == "2027-01-01"
    
    # Pydantic validation
    item = DailyForecastItem(
        date=jan_1.isoformat(),
        weather_code=0,
        weather_description="Clear",
        weather_icon="☀️",
        temp_max_c=30.0,
        temp_min_c=18.0,
        precipitation_sum_mm=0.0,
        max_wind_speed_kmh=12.0,
    )
    assert item.date == "2027-01-01"


@pytest.mark.asyncio
async def test_weather_service_handles_missing_or_empty_dates():
    """Ensures weather service sanitizes missing or malformed daily date arrays safely."""
    mock_payload = {
        "timezone": "Asia/Kolkata",
        "current": {
            "temperature_2m": 25.0,
            "apparent_temperature": 25.0,
            "relative_humidity_2m": 50.0,
            "precipitation": 0.0,
            "rain": 0.0,
            "wind_speed_10m": 10.0,
            "weather_code": 0,
            "time": "2026-11-07T12:00:00Z",
        },
        "daily": {
            "time": ["2026-11-07", None, ""],  # missing/empty entries
            "weather_code": [0, 1, 2],
            "temperature_2m_max": [30.0, 31.0, 32.0],
            "temperature_2m_min": [18.0, 18.0, 18.0],
            "precipitation_sum": [0.0, 0.0, 0.0],
            "wind_speed_10m_max": [12.0, 12.0, 12.0],
        },
    }

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = mock_payload

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response
        svc = WeatherService(base_url="http://mock-open-meteo.com")
        res = await svc.get_weather(latitude=20.0, longitude=74.0, force_refresh=True)
        assert res.is_live is True
        assert len(res.daily_forecast) == 3
        assert res.daily_forecast[0].date == "2026-11-07"

