"""
FastAPI router for Profit Decision Engine endpoints.

Paths:
- POST /api/v1/decision-engine/evaluate
- GET /api/v1/decision-engine/decisions/{decision_id}
- GET /api/v1/decision-engine/lots/{lot_id}/decisions
"""
from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_active_farmer
from app.database.base import get_db
from app.database.models import User
from app.decision_engine.schemas import (
    DecisionEvaluateRequest,
    DecisionRunResponse,
)
from app.decision_engine.service import (
    evaluate_crop_lot_decision,
    get_decision_by_id,
    get_lot_decisions,
)

router = APIRouter(
    prefix="/decision-engine",
    tags=["Profit Decision Engine"],
)


@router.post(
    "/evaluate",
    response_model=DecisionRunResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Evaluate harvest pathways for a farmer's crop lot",
    description=(
        "Executes the feasibility-aware profit decision engine for the specified crop lot. "
        "Calculates net profit, itemized deductions, and feasibility gates across all candidate routes. "
        "Enforces farmer ownership and persists an immutable audit snapshot."
    ),
)
async def evaluate_decision(
    request: DecisionEvaluateRequest,
    current_user: User = Depends(get_current_active_farmer),
    db: AsyncSession = Depends(get_db),
):
    return await evaluate_crop_lot_decision(
        crop_lot_id=request.crop_lot_id,
        current_user_id=current_user.id,
        scenario_preset=request.scenario_preset,
        custom_params=request.custom_parameters,
        db=db,
    )


@router.get(
    "/decisions/{decision_id}",
    response_model=DecisionRunResponse,
    summary="Retrieve previously generated decision snapshot",
    description="Loads an immutable decision run by ID. Requires farmer ownership of the underlying crop lot.",
)
async def get_decision(
    decision_id: str,
    current_user: User = Depends(get_current_active_farmer),
    db: AsyncSession = Depends(get_db),
):
    return await get_decision_by_id(
        decision_id=decision_id,
        current_user_id=current_user.id,
        db=db,
    )


@router.get(
    "/lots/{lot_id}/decisions",
    response_model=List[DecisionRunResponse],
    summary="List all historical decision runs for a crop lot",
    description="Returns chronological decision run history for a farmer's crop lot.",
)
async def get_crop_lot_decisions(
    lot_id: str,
    current_user: User = Depends(get_current_active_farmer),
    db: AsyncSession = Depends(get_db),
):
    return await get_lot_decisions(
        crop_lot_id=lot_id,
        current_user_id=current_user.id,
        db=db,
    )
