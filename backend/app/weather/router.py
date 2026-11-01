"""
Agri2Value — Weather API Router.

Provides endpoints for server-side meteorological ingestion and field-work advisory.
"""
from fastapi import APIRouter, Query
from app.weather.schemas import WeatherResponse
from app.weather.service import weather_service

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get(
    "",
    response_model=WeatherResponse,
    summary="Get Local Agricultural Weather & Advisory",
    description=(
        "Retrieves observed weather conditions, a 7-day forecast, and operational "
        "field work guidelines for the specified coordinates. Calls Open-Meteo via backend "
        "proxy with caching. Includes mandatory CC BY 4.0 attribution and advisory disclaimers."
    ),
)
async def get_weather(
    latitude: float = Query(20.0760, description="Latitude (default: Niphad, Nashik)"),
    longitude: float = Query(74.0534, description="Longitude (default: Niphad, Nashik)"),
    force_refresh: bool = Query(False, description="Bypass cache and force upstream refresh"),
) -> WeatherResponse:
    return await weather_service.get_weather(
        latitude=latitude,
        longitude=longitude,
        force_refresh=force_refresh,
    )
