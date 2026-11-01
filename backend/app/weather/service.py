"""
Agri2Value — Weather Service (Alias & Re-export).
Canonical service implementation resides in app.services.weather_service.
"""
from app.services.weather_service import (
    weather_service,
    WeatherService,
    WeatherObserved,
    DailyForecastItem,
    FieldWorkAdvisory,
    WeatherResponse,
    FarmWeatherResponse,
    compute_field_work_advisory,
    _get_offline_reference_weather,
    _get_wmo_info,
    WMO_CODES,
)

__all__ = [
    "weather_service",
    "WeatherService",
    "WeatherObserved",
    "DailyForecastItem",
    "FieldWorkAdvisory",
    "WeatherResponse",
    "FarmWeatherResponse",
    "compute_field_work_advisory",
    "_get_offline_reference_weather",
    "_get_wmo_info",
    "WMO_CODES",
]
