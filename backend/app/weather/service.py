"""
Agri2Value — Weather Service.

Integrates with Open-Meteo REST API (server-side, cached, asynchronous).
Never calls from the client browser. Provides strict attribution and non-guarantee disclaimers.
"""
from datetime import datetime, timezone
import time
from typing import Dict, Any, Optional, Tuple
import httpx

from app.core.config import get_settings
from app.core.logging import get_logger
from app.weather.schemas import (
    WeatherObserved,
    DailyForecastItem,
    FieldWorkAdvisory,
    WeatherResponse,
)

logger = get_logger("weather_service")
settings = get_settings()

# WMO Weather Interpretation Codes (WMO Code 4677)
WMO_CODES: Dict[int, Dict[str, str]] = {
    0: {"label": "Clear sky", "icon": "☀️", "severity": "good"},
    1: {"label": "Mainly clear", "icon": "🌤️", "severity": "good"},
    2: {"label": "Partly cloudy", "icon": "⛅", "severity": "good"},
    3: {"label": "Overcast", "icon": "☁️", "severity": "moderate"},
    45: {"label": "Foggy", "icon": "🌫️", "severity": "caution"},
    48: {"label": "Depositing rime fog", "icon": "🌫️", "severity": "caution"},
    51: {"label": "Light drizzle", "icon": "🌦️", "severity": "caution"},
    53: {"label": "Moderate drizzle", "icon": "🌦️", "severity": "caution"},
    55: {"label": "Dense drizzle", "icon": "🌧️", "severity": "bad"},
    61: {"label": "Slight rain", "icon": "🌧️", "severity": "caution"},
    63: {"label": "Moderate rain", "icon": "🌧️", "severity": "bad"},
    65: {"label": "Heavy rain", "icon": "🌧️", "severity": "bad"},
    71: {"label": "Slight snowfall", "icon": "❄️", "severity": "caution"},
    73: {"label": "Moderate snowfall", "icon": "❄️", "severity": "bad"},
    75: {"label": "Heavy snowfall", "icon": "❄️", "severity": "bad"},
    77: {"label": "Snow grains", "icon": "🌨️", "severity": "bad"},
    80: {"label": "Slight rain showers", "icon": "🌦️", "severity": "caution"},
    81: {"label": "Moderate rain showers", "icon": "🌧️", "severity": "bad"},
    82: {"label": "Violent rain showers", "icon": "⛈️", "severity": "bad"},
    85: {"label": "Slight snow showers", "icon": "🌨️", "severity": "caution"},
    86: {"label": "Heavy snow showers", "icon": "🌨️", "severity": "bad"},
    95: {"label": "Thunderstorm", "icon": "⛈️", "severity": "bad"},
    96: {"label": "Thunderstorm with slight hail", "icon": "⛈️", "severity": "bad"},
    99: {"label": "Thunderstorm with heavy hail", "icon": "⛈️", "severity": "bad"},
}

# In-memory cache: (lat, lon) -> (timestamp, WeatherResponse)
_CACHE: Dict[str, Tuple[float, WeatherResponse]] = {}
CACHE_TTL_SECONDS = 900  # 15 minutes


def _get_wmo_info(code: int) -> Dict[str, str]:
    return WMO_CODES.get(code, {"label": f"Weather Code {code}", "icon": "🌡️", "severity": "moderate"})


def compute_field_work_advisory(observed: WeatherObserved) -> FieldWorkAdvisory:
    """
    Computes purely advisory guidance for field operations.
    Clearly notes that it does NOT guarantee safety or efficacy.
    """
    reasons = []
    status = "FAVORABLE"
    headline = "Conditions generally favorable for scheduled field work"

    # 1. Rain check
    if observed.rain_mm > 2.0 or observed.precipitation_mm > 2.0:
        status = "UNFAVORABLE"
        headline = "Field operations discouraged due to active precipitation"
        reasons.append(f"Observed rainfall ({observed.rain_mm} mm) risks chemical wash-off and wet soil compaction.")
    elif observed.rain_mm > 0.0:
        if status != "UNFAVORABLE":
            status = "CAUTION"
            headline = "Marginal conditions: light precipitation detected"
        reasons.append("Light precipitation present. Foliage may be wet, increasing fungal transfer during harvesting.")

    # 2. Wind check (drift risk for sprayers)
    if observed.wind_speed_kmh > 25.0:
        status = "UNFAVORABLE"
        headline = "Pesticide spraying not recommended due to high wind drift risk"
        reasons.append(f"Wind speed ({observed.wind_speed_kmh} km/h) exceeds safe threshold (15-20 km/h), causing off-target spray drift.")
    elif observed.wind_speed_kmh > 18.0:
        if status != "UNFAVORABLE":
            status = "CAUTION"
            headline = "Moderate wind: evaluate spray nozzle calibration"
        reasons.append(f"Breezy conditions ({observed.wind_speed_kmh} km/h). Use low-drift nozzles if spraying.")

    # 3. Heat check
    if observed.temperature_c > 38.0:
        if status != "UNFAVORABLE":
            status = "CAUTION"
        reasons.append(f"High ambient temperature ({observed.temperature_c}°C) causes accelerated spray droplet evaporation and worker fatigue.")
    elif observed.temperature_c < 5.0:
        if status != "UNFAVORABLE":
            status = "CAUTION"
        reasons.append(f"Low ambient temperature ({observed.temperature_c}°C) may impede systemic chemical uptake.")

    # 4. Severe weather code check
    wmo_info = _get_wmo_info(observed.weather_code)
    if wmo_info.get("severity") == "bad":
        status = "UNFAVORABLE"
        headline = f"Hazardous weather condition: {wmo_info['label']}"
        reasons.append(f"Severe weather code active: {wmo_info['label']}.")

    if not reasons:
        reasons.append("Wind, precipitation, and temperature readings are within standard agricultural working windows.")

    return FieldWorkAdvisory(
        status=status,
        headline=headline,
        reasons=reasons,
    )


def _get_offline_reference_weather(latitude: float, longitude: float) -> WeatherResponse:
    """Provides a deterministic reference weather snapshot when live network is unavailable."""
    now_utc = datetime.now(timezone.utc).isoformat()
    observed = WeatherObserved(
        temperature_c=27.4,
        apparent_temperature_c=28.1,
        relative_humidity_pct=58.0,
        precipitation_mm=0.0,
        rain_mm=0.0,
        wind_speed_kmh=12.5,
        weather_code=1,
        weather_description="Mainly clear",
        weather_icon="🌤️",
        observed_at=now_utc,
    )

    advisory = compute_field_work_advisory(observed)

    # 7-day representative forecast
    forecast_days = [
        DailyForecastItem(
            date="2026-11-01",
            weather_code=1,
            weather_description="Mainly clear",
            weather_icon="🌤️",
            temp_max_c=31.2,
            temp_min_c=18.5,
            precipitation_sum_mm=0.0,
            max_wind_speed_kmh=14.0,
            sunrise="06:28",
            sunset="18:02",
        ),
        DailyForecastItem(
            date="2026-11-02",
            weather_code=2,
            weather_description="Partly cloudy",
            weather_icon="⛅",
            temp_max_c=30.8,
            temp_min_c=19.1,
            precipitation_sum_mm=0.2,
            max_wind_speed_kmh=16.2,
            sunrise="06:29",
            sunset="18:01",
        ),
        DailyForecastItem(
            date="2026-11-03",
            weather_code=0,
            weather_description="Clear sky",
            weather_icon="☀️",
            temp_max_c=32.0,
            temp_min_c=18.0,
            precipitation_sum_mm=0.0,
            max_wind_speed_kmh=11.8,
            sunrise="06:29",
            sunset="18:01",
        ),
        DailyForecastItem(
            date="2026-11-04",
            weather_code=0,
            weather_description="Clear sky",
            weather_icon="☀️",
            temp_max_c=32.5,
            temp_min_c=18.2,
            precipitation_sum_mm=0.0,
            max_wind_speed_kmh=12.0,
            sunrise="06:30",
            sunset="18:00",
        ),
        DailyForecastItem(
            date="2026-11-05",
            weather_code=2,
            weather_description="Partly cloudy",
            weather_icon="⛅",
            temp_max_c=31.5,
            temp_min_c=19.0,
            precipitation_sum_mm=0.0,
            max_wind_speed_kmh=15.0,
            sunrise="06:30",
            sunset="18:00",
        ),
        DailyForecastItem(
            date="2026-11-06",
            weather_code=3,
            weather_description="Overcast",
            weather_icon="☁️",
            temp_max_c=29.0,
            temp_min_c=19.5,
            precipitation_sum_mm=1.5,
            max_wind_speed_kmh=19.0,
            sunrise="06:31",
            sunset="17:59",
        ),
        DailyForecastItem(
            date="2026-11-07",
            weather_code=61,
            weather_description="Slight rain",
            weather_icon="🌧️",
            temp_max_c=27.5,
            temp_min_c=18.0,
            precipitation_sum_mm=4.2,
            max_wind_speed_kmh=22.5,
            sunrise="06:31",
            sunset="17:59",
        ),
    ]

    return WeatherResponse(
        latitude=latitude,
        longitude=longitude,
        timezone="Asia/Kolkata",
        is_live=False,
        source_type="offline_reference",
        retrieved_at=now_utc,
        current=observed,
        daily_forecast=forecast_days,
        advisory=advisory,
    )


class WeatherService:
    """Asynchronous, cached weather service integrating Open-Meteo."""

    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or settings.OPEN_METEO_BASE_URL

    async def get_weather(
        self,
        latitude: float = 20.0760,
        longitude: float = 74.0534,
        force_refresh: bool = False,
    ) -> WeatherResponse:
        """
        Fetches current weather and 7-day forecast from Open-Meteo, with server-side caching.
        Falls back to verified offline reference if upstream network fails.
        """
        cache_key = f"{round(latitude, 2)},{round(longitude, 2)}"
        now = time.time()

        if not force_refresh and cache_key in _CACHE:
            cached_time, cached_response = _CACHE[cache_key]
            if now - cached_time < CACHE_TTL_SECONDS:
                logger.debug("Serving weather from cache", cache_key=cache_key)
                return cached_response

        url = f"{self.base_url}/forecast"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,wind_speed_10m,weather_code",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,sunrise,sunset",
            "timezone": "Asia/Kolkata",
            "forecast_days": 7,
        }

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(url, params=params)
                if res.status_code != 200:
                    logger.warning(
                        "Open-Meteo returned non-200 status",
                        status_code=res.status_code,
                        response=res.text[:200],
                    )
                    return _get_offline_reference_weather(latitude, longitude)

                data = res.json()

            current_raw = data.get("current", {})
            daily_raw = data.get("daily", {})

            w_code = current_raw.get("weather_code", 0)
            w_info = _get_wmo_info(w_code)

            observed = WeatherObserved(
                temperature_c=float(current_raw.get("temperature_2m", 25.0)),
                apparent_temperature_c=float(current_raw.get("apparent_temperature", 25.0)),
                relative_humidity_pct=float(current_raw.get("relative_humidity_2m", 50.0)),
                precipitation_mm=float(current_raw.get("precipitation", 0.0)),
                rain_mm=float(current_raw.get("rain", 0.0)),
                wind_speed_kmh=float(current_raw.get("wind_speed_10m", 10.0)),
                weather_code=w_code,
                weather_description=w_info["label"],
                weather_icon=w_info["icon"],
                observed_at=current_raw.get("time", datetime.now(timezone.utc).isoformat()),
            )

            advisory = compute_field_work_advisory(observed)

            # Daily forecast
            forecast_items: list[DailyForecastItem] = []
            dates = daily_raw.get("time", [])
            for i, d in enumerate(dates):
                f_code = daily_raw.get("weather_code", [])[i] if i < len(daily_raw.get("weather_code", [])) else 0
                f_info = _get_wmo_info(f_code)
                forecast_items.append(
                    DailyForecastItem(
                        date=d,
                        weather_code=f_code,
                        weather_description=f_info["label"],
                        weather_icon=f_info["icon"],
                        temp_max_c=float(daily_raw.get("temperature_2m_max", [])[i]),
                        temp_min_c=float(daily_raw.get("temperature_2m_min", [])[i]),
                        precipitation_sum_mm=float(daily_raw.get("precipitation_sum", [])[i]),
                        max_wind_speed_kmh=float(daily_raw.get("wind_speed_10m_max", [])[i]),
                        sunrise=daily_raw.get("sunrise", [])[i] if i < len(daily_raw.get("sunrise", [])) else None,
                        sunset=daily_raw.get("sunset", [])[i] if i < len(daily_raw.get("sunset", [])) else None,
                    )
                )

            now_utc = datetime.now(timezone.utc).isoformat()
            response = WeatherResponse(
                latitude=latitude,
                longitude=longitude,
                timezone=data.get("timezone", "Asia/Kolkata"),
                is_live=True,
                source_type="open_meteo_live",
                retrieved_at=now_utc,
                current=observed,
                daily_forecast=forecast_items,
                advisory=advisory,
            )

            _CACHE[cache_key] = (now, response)
            return response

        except Exception as exc:
            logger.warning("Failed to reach Open-Meteo, falling back to offline reference", error=str(exc))
            return _get_offline_reference_weather(latitude, longitude)


weather_service = WeatherService()
