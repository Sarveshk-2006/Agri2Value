# backend/app/crop_lots/router.py
"""
CropLot management endpoints.

POST  /farms/{farm_id}/crop-lots    — Create a crop lot under a farm
GET   /crop-lots                    — List all crop lots for current user
GET   /crop-lots/{lot_id}           — Get a specific crop lot
PATCH /crop-lots/{lot_id}           — Update crop lot details
"""
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_active_farmer
from app.crop_lots import service as lot_service
from app.crop_lots.schemas import (
    CropLotCreate,
    CropLotListResponse,
    CropLotResponse,
    CropLotUpdate,
)
from app.database.base import get_db
from app.database.models import User

# Router for /farms/{farm_id}/crop-lots
farm_crop_lots_router = APIRouter(tags=["Crop Lots"])

# Router for /crop-lots routes
crop_lots_router = APIRouter(prefix="/crop-lots", tags=["Crop Lots"])


@farm_crop_lots_router.post(
    "/farms/{farm_id}/crop-lots",
    response_model=CropLotResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a Harvest / Crop Lot",
    description=(
        "Create a new crop lot (harvest) under the specified farm. "
        "The farm must be owned by the authenticated user. "
        "Quantity is automatically normalized to kilograms for calculations."
    ),
)
async def create_crop_lot(
    farm_id: str,
    lot_data: CropLotCreate,
    current_user: User = Depends(get_current_active_farmer),
    db: AsyncSession = Depends(get_db),
) -> CropLotResponse:
    # Override farm_id from path parameter (canonical source of truth)
    lot_data = lot_data.model_copy(update={"farm_id": farm_id})
    lot = await lot_service.create_crop_lot(db, lot_data, current_user)
    return CropLotResponse.model_validate(lot)


@crop_lots_router.get(
    "",
    response_model=CropLotListResponse,
    summary="List My Crop Lots",
)
async def list_crop_lots(
    farm_id: Optional[str] = Query(None, description="Filter by farm ID"),
    current_user: User = Depends(get_current_active_farmer),
    db: AsyncSession = Depends(get_db),
) -> CropLotListResponse:
    lots = await lot_service.get_crop_lots_for_user(db, current_user.id, farm_id)
    return CropLotListResponse(
        crop_lots=[CropLotResponse.model_validate(l) for l in lots],
        total=len(lots),
    )


@crop_lots_router.get(
    "/{lot_id}",
    response_model=CropLotResponse,
    summary="Get Crop Lot",
)
async def get_crop_lot(
    lot_id: str,
    current_user: User = Depends(get_current_active_farmer),
    db: AsyncSession = Depends(get_db),
) -> CropLotResponse:
    lot = await lot_service.get_crop_lot_by_id(db, lot_id, current_user.id)
    return CropLotResponse.model_validate(lot)


@crop_lots_router.patch(
    "/{lot_id}",
    response_model=CropLotResponse,
    summary="Update Crop Lot",
)
async def update_crop_lot(
    lot_id: str,
    update_data: CropLotUpdate,
    current_user: User = Depends(get_current_active_farmer),
    db: AsyncSession = Depends(get_db),
) -> CropLotResponse:
    lot = await lot_service.update_crop_lot(db, lot_id, update_data, current_user.id)
    return CropLotResponse.model_validate(lot)
