"""
Pydantic API schemas for the Profit Decision Engine endpoints.
"""
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field

from app.decision_engine.models import (
    RouteType,
    FeasibilityStatus,
    CostBreakdown,
    RiskLevel,
    HarvestLotSnapshot,
    AssumptionItem,
    SensitivityAnalysisResult,
    OutcomeComparison,
)


class DecisionEvaluateRequest(BaseModel):
    """Request payload to trigger decision engine evaluation."""
    model_config = ConfigDict(extra="ignore")

    crop_lot_id: str = Field(..., description="UUID of the farmer's crop lot to evaluate")
    scenario_preset: Optional[str] = Field(
        None,
        description="Optional simulation scenario: 'PILOT_BASELINE' | 'MANDI_WINS' | 'PROCESSING_BOTTLENECK' | 'MISSING_DATA'",
    )
    data_source_mode: Optional[str] = Field(
        "PILOT_BENCHMARK",
        description="Data source mode: 'PILOT_BENCHMARK' | 'LIVE_MANDI' | 'CUSTOM'",
    )
    custom_parameters: Optional[Dict[str, Any]] = Field(
        None,
        description="Optional price/cost overrides for custom what-if scenario testing",
    )


class SensitivityRequest(BaseModel):
    """Request payload to evaluate sensitivity for a crop lot."""
    model_config = ConfigDict(extra="ignore")

    price_variance_pct: Optional[Decimal] = Field(
        default=Decimal("15.0"),
        description="Percentage price shift for optimistic/conservative scenarios (+/-%)",
    )
    transport_variance_pct: Optional[Decimal] = Field(
        default=Decimal("20.0"),
        description="Percentage transport tariff shift (+/-%)",
    )
    wastage_variance_pct: Optional[Decimal] = Field(
        default=Decimal("5.0"),
        description="Sorting/transit loss variance (+/-%)",
    )
    holding_days_shift: Optional[int] = Field(
        default=7,
        description="Extra days in storage for delay scenarios",
    )


class DecisionOptionResponse(BaseModel):
    """Evaluated pathway option within a decision run."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    decision_run_id: str
    route_type: RouteType
    route_name: str
    feasibility_status: FeasibilityStatus
    rank: Optional[int] = None
    is_recommended: bool = False
    saleable_quantity: Decimal
    saleable_quantity_unit: str
    gross_revenue: Decimal
    total_costs: Decimal
    net_profit: Decimal
    net_profit_per_kg: Decimal
    effective_realization_per_kg: Decimal
    additional_profit_vs_baseline: Decimal
    time_to_payment_days: Optional[int] = None
    cost_breakdown: Dict[str, Any]
    feasibility_reasons: Dict[str, Any]
    risks_and_confidence: Dict[str, Any]
    explanation: str
    data_source: str
    data_timestamp: datetime
    itemized_assumptions: List[AssumptionItem] = Field(default_factory=list)
    operational_constraints: List[str] = Field(default_factory=list)


class DecisionRunResponse(BaseModel):
    """Immutable decision run snapshot returned from evaluation."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    crop_lot_id: str
    owner_user_id: str
    algorithm_version: str
    status: str
    recommended_option_id: Optional[str] = None
    recommended_route_type: Optional[str] = None
    recommended_net_profit: Optional[Decimal] = None
    baseline_net_profit: Optional[Decimal] = None
    additional_profit_vs_baseline: Optional[Decimal] = None
    input_snapshot: Dict[str, Any]
    disclaimer: str
    created_at: datetime
    options: List[DecisionOptionResponse] = Field(default_factory=list)
    assumptions_disclosed: List[AssumptionItem] = Field(default_factory=list)
    sensitivity_preview: Optional[SensitivityAnalysisResult] = None
