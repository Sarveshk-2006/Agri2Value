"""
Agri2Value — Weather Schemas.

Defines typed representations for observed current weather, 7-day forecast,
and advisory field-work guidelines with mandatory attribution and disclaimers.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class WeatherObserved(BaseModel):
    """Observed meteorological readings for a specific station/coordinate."""
    temperature_c: float = Field(..., description="Observed dry-bulb temperature in degrees Celsius")
    apparent_temperature_c: float = Field(..., description="Perceived temperature accounting for humidity and wind")
    relative_humidity_pct: float = Field(..., description="Observed relative humidity percentage (0-100%)")
    precipitation_mm: float = Field(..., description="Current precipitation rate in mm")
    rain_mm: float = Field(..., description="Current rain in mm")
    wind_speed_kmh: float = Field(..., description="Wind speed at 10 meters in km/h")
    weather_code: int = Field(..., description="WMO weather code (0-99)")
    weather_description: str = Field(..., description="Human-readable condition description")
    weather_icon: str = Field(..., description="Visual unicode icon representation")
    observed_at: str = Field(..., description="Timestamp of meteorological observation (ISO-8601)")


class DailyForecastItem(BaseModel):
    """Daily forecasted weather conditions."""
    date: str = Field(..., description="Forecast date (YYYY-MM-DD)")
    weather_code: int = Field(..., description="Forecasted WMO weather code")
    weather_description: str = Field(..., description="Forecasted condition description")
    weather_icon: str = Field(..., description="Visual icon representation")
    temp_max_c: float = Field(..., description="Projected maximum daily temperature in Celsius")
    temp_min_c: float = Field(..., description="Projected minimum daily temperature in Celsius")
    precipitation_sum_mm: float = Field(..., description="Total projected daily precipitation in mm")
    max_wind_speed_kmh: float = Field(..., description="Peak projected wind gust speed in km/h")
    sunrise: Optional[str] = Field(None, description="Sunrise time")
    sunset: Optional[str] = Field(None, description="Sunset time")


class FieldWorkAdvisory(BaseModel):
    """
    Advisory guidance for field operations (spraying, harvesting, tillage).
    
    CRITICAL DISCLAIMER:
    This guidance is strictly advisory. It does NOT guarantee chemical application safety,
    which depends on pesticide formulation, crop growth stage, and local microclimates.
    """
    status: str = Field(..., description="FAVORABLE | CAUTION | UNFAVORABLE | UNKNOWN")
    headline: str = Field(..., description="Concise operator summary")
    reasons: List[str] = Field(default_factory=list, description="Specific observed meteorological factors")
    disclaimer: str = Field(
        default=(
            "Advisory notice: This guidance is strictly informational based on general "
            "meteorological models. Microclimate variations, soil saturation, crop development stage, "
            "and pesticide label instructions must be independently inspected by the operator "
            "before conducting field operations."
        ),
        description="Mandatory legal and safety disclaimer",
    )


class WeatherResponse(BaseModel):
    """Comprehensive weather response with clear separation of observed vs forecasted data."""
    latitude: float
    longitude: float
    timezone: str
    is_live: bool = Field(..., description="True if retrieved directly from Open-Meteo; False if offline reference")
    source_type: str = Field(..., description="'open_meteo_live' or 'offline_reference'")
    attribution: str = Field(
        default="Weather data by Open-Meteo.com under CC BY 4.0",
        description="Required API attribution notice",
    )
    retrieved_at: str = Field(..., description="UTC timestamp when data was fetched or cached by Agri2Value backend")
    current: WeatherObserved
    daily_forecast: List[DailyForecastItem] = Field(default_factory=list)
    advisory: FieldWorkAdvisory
