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
from app.decision_engine.models import (
    AssumptionItem,
    SensitivityAnalysisResult,
    OutcomeComparison,
)
from app.decision_engine.schemas import (
    DecisionEvaluateRequest,
    DecisionRunResponse,
    SensitivityRequest,
)
from app.decision_engine.service import (
    evaluate_crop_lot_decision,
    get_decision_by_id,
    get_lot_decisions,
    get_decision_actual_outcome_comparison,
    run_sensitivity_analysis,
    get_benchmark_assumptions,
)

router = APIRouter(
    prefix="/decision-engine",
    tags=["Profit Decision Engine"],
)


@router.get(
    "/assumptions-config",
    response_model=List[AssumptionItem],
    summary="List benchmark cost, tariff, and conversion assumptions",
    description="Returns itemized decision assumptions with provenance tags (VERIFIED, CONFIGURED, ILLUSTRATIVE_BENCHMARK).",
)
async def list_benchmark_assumptions():
    return get_benchmark_assumptions()


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
        data_source_mode=request.data_source_mode,
        custom_params=request.custom_parameters,
        db=db,
    )


@router.post(
    "/sensitivity/{lot_id}",
    response_model=SensitivityAnalysisResult,
    summary="Perform scenario sensitivity analysis on a crop lot",
    description="Evaluates conservative, expected, and optimistic scenarios against price, transport, and wastage variations.",
)
async def evaluate_sensitivity(
    lot_id: str,
    request: SensitivityRequest = SensitivityRequest(),
    current_user: User = Depends(get_current_active_farmer),
    db: AsyncSession = Depends(get_db),
):
    return await run_sensitivity_analysis(
        crop_lot_id=lot_id,
        current_user_id=current_user.id,
        req=request,
        db=db,
    )


@router.get(
    "/outcome-comparison/{decision_id}",
    response_model=OutcomeComparison,
    summary="Compare decision run expectations against actual delivery and payment realizations",
    description="Reconciles decision expectations against actual weighbridge deliveries and payment records from Phase 5.",
)
async def get_outcome_comparison(
    decision_id: str,
    current_user: User = Depends(get_current_active_farmer),
    db: AsyncSession = Depends(get_db),
):
    return await get_decision_actual_outcome_comparison(
        decision_id=decision_id,
        current_user_id=current_user.id,
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
