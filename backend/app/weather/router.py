"""
Agri2Value — Weather API Router.

Provides endpoints for server-side meteorological ingestion and field-work advisory.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_active_farmer
from app.database.base import get_db
from app.database.models import User
from app.services.weather_service import (
    weather_service,
    WeatherResponse,
    FarmWeatherResponse,
)

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


@router.get(
    "/farm/{farm_id}",
    response_model=FarmWeatherResponse,
    summary="Get Farm-Specific Agricultural Weather",
    description=(
        "Retrieves localized weather and forecast tailored to farm coordinates. "
        "Strictly enforces farmer ownership check."
    ),
)
async def get_farm_weather(
    farm_id: str,
    force_refresh: bool = Query(False, description="Bypass cache and force upstream refresh"),
    current_user: User = Depends(get_current_active_farmer),
    db: AsyncSession = Depends(get_db),
) -> FarmWeatherResponse:
    return await weather_service.get_farm_weather(
        db=db,
        farm_id=farm_id,
        current_user_id=current_user.id,
        force_refresh=force_refresh,
    )

