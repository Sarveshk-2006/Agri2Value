# backend/app/crop_lots/service.py
"""
CropLot business logic and database operations.
Ownership checks are enforced here — the farm must belong to the user.
"""
from decimal import Decimal
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.errors import NotFoundError, AuthorizationError, ValidationError
from app.core.logging import get_logger
from app.database.models import CropLot, CropLotEvent, Farm, User
from app.crop_lots.schemas import CropLotCreate, CropLotUpdate, normalize_to_kg

logger = get_logger(__name__)


async def _get_farm_owned_by_user(
    db: AsyncSession, farm_id: str, user_id: str
) -> Farm:
    """Return a farm if it exists and is owned by user_id. Raises NotFoundError otherwise."""
    result = await db.execute(
        select(Farm).where(Farm.id == farm_id, Farm.is_active == True)
    )
    farm = result.scalar_one_or_none()
    if farm is None:
        raise NotFoundError("Farm", farm_id)
    if farm.owner_user_id != user_id:
        raise NotFoundError("Farm", farm_id)  # Do not reveal existence
    return farm


async def create_crop_lot(
    db: AsyncSession,
    lot_data: CropLotCreate,
    owner: User,
) -> CropLot:
    """Create a crop lot. The farm must be owned by the user."""
    farm = await _get_farm_owned_by_user(db, lot_data.farm_id, owner.id)

    # Normalize quantity to kg
    qty_kg = normalize_to_kg(lot_data.quantity, lot_data.quantity_unit)

    event = CropLotEvent(
        event_type="CREATED",
        description=f"Crop lot created: {lot_data.crop_name} {lot_data.quantity}{lot_data.quantity_unit} ({qty_kg} kg)",
        actor_user_id=owner.id,
    )

    crop_lot = CropLot(
        farm_id=farm.id,
        owner_user_id=owner.id,
        crop_name=lot_data.crop_name.strip(),
        variety=lot_data.variety.strip() if lot_data.variety else None,
        quantity=lot_data.quantity,
        quantity_unit=lot_data.quantity_unit,
        quantity_kg_normalized=qty_kg,
        harvest_date=lot_data.harvest_date,
        quality_grade=lot_data.quality_grade,
        status="DRAFT",
        data_mode=lot_data.data_mode,
        notes=lot_data.notes,
        events=[event],
    )
    db.add(crop_lot)
    await db.flush()

    logger.info(
        "CropLot created",
        lot_id=crop_lot.id,
        crop=crop_lot.crop_name,
        qty_kg=str(qty_kg),
        owner_id=owner.id,
    )
    return crop_lot


async def get_crop_lot_by_id(
    db: AsyncSession,
    lot_id: str,
    user_id: str,
) -> CropLot:
    """Return a crop lot by ID with ownership check."""
    result = await db.execute(
        select(CropLot)
        .where(CropLot.id == lot_id)
        .options(selectinload(CropLot.events))
    )
    lot = result.scalar_one_or_none()

    if lot is None:
        raise NotFoundError("CropLot", lot_id)
    if lot.owner_user_id != user_id:
        raise NotFoundError("CropLot", lot_id)

    return lot


async def get_crop_lots_for_user(
    db: AsyncSession,
    user_id: str,
    farm_id: str = None,
) -> List[CropLot]:
    """Return all crop lots owned by user, optionally filtered by farm."""
    query = (
        select(CropLot)
        .where(CropLot.owner_user_id == user_id)
        .options(selectinload(CropLot.events))
        .order_by(CropLot.created_at.desc())
    )
    if farm_id:
        query = query.where(CropLot.farm_id == farm_id)

    result = await db.execute(query)
    return list(result.scalars().all())


async def update_crop_lot(
    db: AsyncSession,
    lot_id: str,
    update_data: CropLotUpdate,
    user_id: str,
) -> CropLot:
    """Update allowed fields on a crop lot. Re-normalizes quantity if changed."""
    lot = await get_crop_lot_by_id(db, lot_id, user_id)

    update_fields = update_data.model_dump(exclude_none=True)

    # Handle quantity + unit update atomically
    new_qty = update_fields.pop("quantity", None)
    new_unit = update_fields.pop("quantity_unit", None)

    if new_qty is not None or new_unit is not None:
        qty = new_qty if new_qty is not None else lot.quantity
        unit = new_unit if new_unit is not None else lot.quantity_unit
        if qty <= 0:
            raise ValidationError("Quantity must be greater than zero.")
        lot.quantity = qty
        lot.quantity_unit = unit
        lot.quantity_kg_normalized = normalize_to_kg(qty, unit)

    for field, value in update_fields.items():
        setattr(lot, field, value)

    event = CropLotEvent(
        crop_lot_id=lot.id,
        event_type="UPDATED",
        description=f"Lot updated. Fields changed: {', '.join(update_fields.keys())}",
        actor_user_id=user_id,
    )
    db.add(event)
    await db.flush()

    logger.info("CropLot updated", lot_id=lot_id)
    return lot
