# backend/app/ai_advisor/router.py
"""FastAPI Router for AI Post-Harvest Advisor & Intelligence."""
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.auth.dependencies import get_current_user
from app.database.base import get_db
from app.database.models import User, Farm, CropLot
from app.ai_advisor.schemas import AIAdvisorRequest, AIAdvisorResponseSchema
from app.services.ai_advisor_service import ai_advisor_service

router = APIRouter(prefix="/ai-advisor", tags=["AI Advisor & Intelligence"])


@router.post(
    "/chat",
    response_model=AIAdvisorResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Ask AI Post-Harvest Advisor",
    description=(
        "Submits an agronomic or market query to the AI Advisor. "
        "Tailors response using authenticated farmer's verified farm holdings and crop lots. "
        "Strictly discloses provenance (LLM vs Deterministic Rules)."
    ),
)
async def ask_advisor(
    payload: AIAdvisorRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    farm_ctx: Optional[Dict[str, Any]] = None
    crop_ctx: Optional[Dict[str, Any]] = None

    # Resolve Crop Context if specified or default to primary lot
    if payload.crop_lot_id:
        lot_res = await db.execute(
            select(CropLot).where(CropLot.id == payload.crop_lot_id, CropLot.owner_user_id == current_user.id)
        )
        lot = lot_res.scalar_one_or_none()
        if lot:
            crop_ctx = {
                "id": lot.id,
                "crop_name": lot.crop_name,
                "variety": lot.variety,
                "quantity_kg_normalized": float(lot.quantity_kg_normalized),
                "quality_grade": lot.quality_grade,
                "status": lot.status,
            }
    else:
        # Load most recent crop lot for context
        lot_res = await db.execute(
            select(CropLot)
            .where(CropLot.owner_user_id == current_user.id)
            .order_by(CropLot.created_at.desc())
            .limit(1)
        )
        lot = lot_res.scalar_one_or_none()
        if lot:
            crop_ctx = {
                "id": lot.id,
                "crop_name": lot.crop_name,
                "variety": lot.variety,
                "quantity_kg_normalized": float(lot.quantity_kg_normalized),
                "quality_grade": lot.quality_grade,
                "status": lot.status,
            }

    # Resolve Farm Context
    if payload.farm_id:
        farm_res = await db.execute(
            select(Farm).where(Farm.id == payload.farm_id, Farm.owner_user_id == current_user.id)
        )
        farm = farm_res.scalar_one_or_none()
        if farm:
            farm_ctx = {
                "id": farm.id,
                "farm_name": farm.farm_name,
                "district": farm.district,
                "village": farm.village,
            }
    else:
        farm_res = await db.execute(
            select(Farm)
            .where(Farm.owner_user_id == current_user.id, Farm.is_active == True)
            .order_by(Farm.created_at.desc())
            .limit(1)
        )
        farm = farm_res.scalar_one_or_none()
        if farm:
            farm_ctx = {
                "id": farm.id,
                "farm_name": farm.farm_name,
                "district": farm.district,
                "village": farm.village,
            }

    lang = payload.language or current_user.preferred_language or "en"

    result = await ai_advisor_service.get_advice(
        query=payload.query,
        farmer_name=current_user.full_name,
        language=lang,
        farm_context=farm_ctx,
        crop_context=crop_ctx,
    )

    return AIAdvisorResponseSchema(**result.to_dict())
