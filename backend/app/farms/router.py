# backend/app/farms/router.py
"""
Farm management endpoints.

POST   /farms                     — Create a new farm
GET    /farms                     — List farms owned by current user
GET    /farms/{farm_id}           — Get a specific farm
PATCH  /farms/{farm_id}           — Update farm details

POST   /farms/{farm_id}/crop-lots — Create crop lot (defined in crop_lots/router.py,
                                    registered here for the URL prefix)
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_active_farmer
from app.database.base import get_db
from app.database.models import User
from app.farms import service as farm_service
from app.farms.schemas import (
    FarmCreate,
    FarmListResponse,
    FarmResponse,
    FarmUpdate,
)

router = APIRouter(prefix="/farms", tags=["Farms"])


@router.post(
    "",
    response_model=FarmResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Farm",
    description="Create a new farm profile for the authenticated farmer.",
)
async def create_farm(
    farm_data: FarmCreate,
    current_user: User = Depends(get_current_active_farmer),
    db: AsyncSession = Depends(get_db),
) -> FarmResponse:
    farm = await farm_service.create_farm(db, farm_data, current_user)
    return FarmResponse.model_validate(farm)


@router.get(
    "",
    response_model=FarmListResponse,
    summary="List My Farms",
    description="Return all farms owned by the authenticated farmer.",
)
async def list_farms(
    current_user: User = Depends(get_current_active_farmer),
    db: AsyncSession = Depends(get_db),
) -> FarmListResponse:
    farms = await farm_service.get_farms_for_user(db, current_user.id)
    farm_responses = [FarmResponse.model_validate(f) for f in farms]
    return FarmListResponse(farms=farm_responses, total=len(farm_responses))


@router.get(
    "/{farm_id}",
    response_model=FarmResponse,
    summary="Get Farm",
    description="Return a specific farm. Returns 404 if not found or not owned by current user.",
)
async def get_farm(
    farm_id: str,
    current_user: User = Depends(get_current_active_farmer),
    db: AsyncSession = Depends(get_db),
) -> FarmResponse:
    farm = await farm_service.get_farm_by_id(db, farm_id, current_user.id)
    return FarmResponse.model_validate(farm)


@router.patch(
    "/{farm_id}",
    response_model=FarmResponse,
    summary="Update Farm",
    description="Update farm details. Only the farm owner can update.",
)
async def update_farm(
    farm_id: str,
    update_data: FarmUpdate,
    current_user: User = Depends(get_current_active_farmer),
    db: AsyncSession = Depends(get_db),
) -> FarmResponse:
    farm = await farm_service.update_farm(db, farm_id, update_data, current_user.id)
    return FarmResponse.model_validate(farm)
