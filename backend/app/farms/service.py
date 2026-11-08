# backend/app/farms/service.py
"""
Farm business logic and database operations.
All ownership checks are enforced here — never rely on client-supplied ownership claims.
"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.core.errors import NotFoundError, AuthorizationError
from app.core.logging import get_logger
from app.database.models import Farm, FarmResource, User
from app.farms.schemas import FarmCreate, FarmUpdate

logger = get_logger(__name__)


async def create_farm(
    db: AsyncSession,
    farm_data: FarmCreate,
    owner: User,
) -> Farm:
    """Create a new farm owned by the given user."""
    resources = [
        FarmResource(
            resource_type=res_data.resource_type,
            name=res_data.name,
            quantity=res_data.quantity,
            unit=res_data.unit,
            availability_status=res_data.availability_status,
        )
        for res_data in farm_data.resources
    ]

    farm = Farm(
        owner_user_id=owner.id,
        farm_name=farm_data.farm_name,
        state=farm_data.state,
        district=farm_data.district,
        village=farm_data.village,
        latitude=farm_data.latitude,
        longitude=farm_data.longitude,
        land_area=farm_data.land_area,
        land_area_unit=farm_data.land_area_unit,
        boundary_geojson=farm_data.boundary_geojson,
        resources=resources,
    )
    db.add(farm)
    await db.flush()
    logger.info("Farm created", farm_id=farm.id, owner_id=owner.id)
    return farm


async def get_farms_for_user(
    db: AsyncSession,
    user_id: str,
) -> List[Farm]:
    """Return all active farms owned by the given user."""
    result = await db.execute(
        select(Farm)
        .where(Farm.owner_user_id == user_id, Farm.is_active == True)
        .options(selectinload(Farm.resources))
        .order_by(Farm.created_at.desc())
    )
    return list(result.scalars().all())


async def get_farm_by_id(
    db: AsyncSession,
    farm_id: str,
    user_id: str,
) -> Farm:
    """
    Return a farm by ID.
    Raises NotFoundError if the farm does not exist.
    Raises AuthorizationError if the requesting user does not own it.
    Ownership is checked server-side — never trust the client.
    """
    result = await db.execute(
        select(Farm)
        .where(Farm.id == farm_id)
        .options(selectinload(Farm.resources))
    )
    farm = result.scalar_one_or_none()

    if farm is None or not farm.is_active:
        raise NotFoundError("Farm", farm_id)

    if farm.owner_user_id != user_id:
        # Do not reveal existence of other farmers' farms
        raise NotFoundError("Farm", farm_id)

    return farm


async def update_farm(
    db: AsyncSession,
    farm_id: str,
    update_data: FarmUpdate,
    user_id: str,
) -> Farm:
    """Update allowed fields on a farm. Ownership required."""
    farm = await get_farm_by_id(db, farm_id, user_id)

    update_fields = update_data.model_dump(exclude_none=True)
    resources_data = update_fields.pop("resources", None)

    for field, value in update_fields.items():
        setattr(farm, field, value)

    if resources_data is not None:
        await db.execute(delete(FarmResource).where(FarmResource.farm_id == farm.id))
        farm.resources = [
            FarmResource(
                farm_id=farm.id,
                resource_type=res_dict.get("resource_type", "storage"),
                name=res_dict.get("name", "Resource"),
                quantity=res_dict.get("quantity"),
                unit=res_dict.get("unit"),
                availability_status=res_dict.get("availability_status", "available"),
            )
            for res_dict in resources_data
        ]

    await db.flush()
    await db.refresh(farm)
    logger.info("Farm updated", farm_id=farm_id, fields=list(update_fields.keys()))
    return farm


async def delete_farm(
    db: AsyncSession,
    farm_id: str,
    user_id: str,
) -> None:
    """Soft-delete farm by marking is_active=False."""
    farm = await get_farm_by_id(db, farm_id, user_id)
    farm.is_active = False
    await db.flush()
    logger.info("Farm deactivated", farm_id=farm_id, user_id=user_id)
