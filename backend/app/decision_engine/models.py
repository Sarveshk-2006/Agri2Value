"""
Pydantic data models for the Profit Decision Engine.

Enforces:
- Decimal precision for financial calculations (no floating point currency).
- Explicit units for all physical quantities and rates.
- Strict input and output contracts.
- Deterministic and serializable structures.
"""
from decimal import Decimal, ROUND_HALF_UP
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


def round_curr(val: Decimal) -> Decimal:
    """Helper to round currency to 2 decimal places using standard half-up rounding."""
    return val.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def round_qty(val: Decimal) -> Decimal:
    """Helper to round quantities to 4 decimal places."""
    return val.quantize(Decimal("0.0001"), rounding=ROUND_HALF_UP)


class RouteType(str, Enum):
    RAW_MANDI = "RAW_MANDI"
    DIRECT_BUYER = "DIRECT_BUYER"
    PROCESSING = "PROCESSING"
    STORAGE = "STORAGE"
    GROUP_SELLING = "GROUP_SELLING"


class FeasibilityStatus(str, Enum):
    FEASIBLE = "FEASIBLE"
    CONDITIONALLY_FEASIBLE = "CONDITIONALLY_FEASIBLE"
    INFEASIBLE = "INFEASIBLE"
    NEEDS_MORE_DATA = "NEEDS_MORE_DATA"


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class CostItem(BaseModel):
    """Specific line item within a route's cost calculation."""
    model_config = ConfigDict(extra="ignore")

    name: str = Field(..., description="Cost item name, e.g. 'Transport to APMC'")
    category: str = Field(
        ...,
        description="Category: transport | labour | packaging | commission | processing | storage | wastage | other",
    )
    amount: Decimal = Field(..., description="Total cost amount in INR")
    unit_rate: Optional[Decimal] = Field(None, description="Per unit rate, e.g. ₹/km, ₹/crate, ₹/kg")
    unit_name: Optional[str] = Field(None, description="Unit name, e.g. 'km', 'crate', 'kg'")
    is_estimated: bool = Field(True, description="Whether this is an estimated or confirmed quote")
    source: Optional[str] = Field(None, description="Data source or basis of estimation")


class CostBreakdown(BaseModel):
    """Structured total and itemized costs for an evaluated route."""
    model_config = ConfigDict(extra="ignore")

    transport: Decimal = Field(default=Decimal("0.00"), description="Total transport cost in INR")
    labour: Decimal = Field(default=Decimal("0.00"), description="Total loading/unloading labour in INR")
    packaging: Decimal = Field(default=Decimal("0.00"), description="Crates, bags, or pouch packaging cost in INR")
    commission_and_fees: Decimal = Field(default=Decimal("0.00"), description="Mandi cess, commission or platform fees in INR")
    processing: Decimal = Field(default=Decimal("0.00"), description="Processing and conversion charges in INR")
    storage: Decimal = Field(default=Decimal("0.00"), description="Cold storage or warehousing fees in INR")
    wastage_loss: Decimal = Field(default=Decimal("0.00"), description="Monetary value of grading/sorting rejection or transit loss in INR")
    other: Decimal = Field(default=Decimal("0.00"), description="Miscellaneous explicit costs in INR")
    total_costs: Decimal = Field(..., description="Sum of all applicable costs in INR")
    line_items: List[CostItem] = Field(default_factory=list, description="Itemized breakdown")


class FeasibilityCheckResult(BaseModel):
    """Detailed result of the feasibility gate for a specific route."""
    model_config = ConfigDict(extra="ignore")

    status: FeasibilityStatus = Field(..., description="Feasibility classification")
    is_feasible: bool = Field(..., description="True if FEASIBLE or CONDITIONALLY_FEASIBLE")
    passed_checks: List[str] = Field(default_factory=list, description="Checks that succeeded")
    failed_checks: List[str] = Field(default_factory=list, description="Hard constraints that failed")
    unmet_prerequisites: List[str] = Field(default_factory=list, description="Requirements to confirm before execution")
    data_gaps: List[str] = Field(default_factory=list, description="Missing inputs if status is NEEDS_MORE_DATA")


class HarvestLotSnapshot(BaseModel):
    """Snapshot of crop lot and farm context used as calculation inputs."""
    model_config = ConfigDict(extra="ignore")

    lot_id: str = Field(..., description="CropLot UUID")
    crop_name: str = Field(..., description="Crop name, e.g. 'Tomato'")
    variety: Optional[str] = Field(None, description="Crop variety, e.g. 'Abhinav'")
    quantity_kg: Decimal = Field(..., gt=0, description="Available harvest quantity normalized to kg")
    quality_grade: Optional[str] = Field(None, description="Quality grade, e.g. 'A', 'B', 'C'")
    harvest_date: Optional[str] = Field(None, description="Harvest date in ISO string format")
    farm_state: str = Field(default="Maharashtra")
    farm_district: str = Field(default="Nashik")
    farm_village: str = Field(default="Niphad")
    available_crates: Optional[int] = Field(None, description="Number of harvest plastic crates on farm")
    has_cold_storage_access: bool = Field(default=False, description="Whether farmer has verified cold storage access")
    max_spoilage_days: int = Field(default=4, description="Safe ambient shelf-life in days without cold chain")


class CalculatedOption(BaseModel):
    """Evaluated option with transparent financials, feasibility, and farmer explanation."""
    model_config = ConfigDict(extra="ignore")

    route_type: RouteType
    route_name: str
    feasibility: FeasibilityCheckResult
    rank: Optional[int] = Field(None, description="Rank among feasible options (1 = highest net profit)")
    is_recommended: bool = Field(default=False, description="Whether this is the recommended route")

    saleable_quantity: Decimal = Field(..., description="Actual quantity saleable in output units")
    saleable_quantity_unit: str = Field(..., description="Unit of saleable output, e.g. 'kg', 'litre'")
    gross_revenue: Decimal = Field(..., description="Expected gross revenue in INR")
    costs: CostBreakdown = Field(..., description="Detailed cost deductions in INR")
    net_profit: Decimal = Field(..., description="Net Profit = Gross Revenue - Total Costs (INR)")
    net_profit_per_kg: Decimal = Field(..., description="Net Profit per original input kg (INR/kg)")
    effective_realization_per_kg: Decimal = Field(..., description="Gross revenue per original input kg (INR/kg)")
    additional_profit_vs_baseline: Decimal = Field(
        default=Decimal("0.00"),
        description="Incremental net profit compared to raw mandi sale baseline (INR)",
    )
    time_to_payment_days: Optional[int] = Field(None, description="Expected calendar days until farmer payment")
    risk_level: RiskLevel = Field(default=RiskLevel.MEDIUM)
    confidence_label: str = Field(
        default="Sample Data Estimate",
        description="Data confidence label: 'Verified Quote', 'Benchmark Sample', 'Low Input Certainty'",
    )
    risks_and_confidence: Dict[str, Any] = Field(default_factory=dict)
    explanation: str = Field(..., description="Farmer-friendly summary of calculation and outcome")
    data_source: str = Field(..., description="Named data source (e.g. APMC Pimpalgaon Sample)")
    data_timestamp: str = Field(..., description="Source timestamp or date")
    is_demo_data: bool = Field(default=True, description="Always true for pilot illustrative values")
    itemized_assumptions: List['AssumptionItem'] = Field(default_factory=list, description="Explicit assumptions")
    operational_constraints: List[str] = Field(default_factory=list, description="Operational requirements")


class AssumptionProvenance(str, Enum):
    VERIFIED = "VERIFIED"
    CONFIGURED = "CONFIGURED"
    ILLUSTRATIVE_BENCHMARK = "ILLUSTRATIVE_BENCHMARK"
    UNKNOWN = "UNKNOWN"


class AssumptionItem(BaseModel):
    """Explicitly disclosed assumption behind a calculation or rule."""
    model_config = ConfigDict(extra="ignore")

    name: str = Field(..., description="Assumption name, e.g. 'Processing Recovery Yield'")
    value: Any = Field(..., description="Value, e.g. 0.28 or 8")
    unit: str = Field(..., description="Measurement unit, e.g. '%', 'days', 'INR/kg'")
    provenance: AssumptionProvenance = Field(
        default=AssumptionProvenance.ILLUSTRATIVE_BENCHMARK,
        description="VERIFIED | CONFIGURED | ILLUSTRATIVE_BENCHMARK | UNKNOWN",
    )
    source_description: str = Field(..., description="Source reference, research benchmark, or empirical guideline")
    is_configurable: bool = Field(default=True)


class ScenarioVariation(BaseModel):
    """Specific sensitivity variation (e.g. Conservative, Expected, Optimistic)."""
    model_config = ConfigDict(extra="ignore")

    scenario_type: str = Field(..., description="'CONSERVATIVE' | 'EXPECTED' | 'OPTIMISTIC'")
    description: str
    assumptions_applied: Dict[str, Any]
    projected_gross_revenue: Decimal
    projected_total_costs: Decimal
    projected_net_profit: Decimal
    projected_net_profit_per_kg: Decimal
    variance_from_expected: Decimal


class SensitivityAnalysisResult(BaseModel):
    """Sensitivity analysis across price, yield, transport, and spoilage variances."""
    model_config = ConfigDict(extra="ignore")

    crop_lot_id: str
    crop_name: str
    quantity_kg: Decimal
    route_type: RouteType
    route_name: str
    expected_net_profit: Decimal
    expected_net_profit_per_kg: Decimal
    scenarios: List[ScenarioVariation]
    key_vulnerabilities: List[str]
    recommendation_stability: str = Field(
        default="ROBUST",
        description="'ROBUST' | 'SENSITIVE_TO_PRICE' | 'HIGH_LOGISTICS_RISK' | 'VOLATILE'",
    )
    sensitivity_summary: str


class OutcomeComparison(BaseModel):
    """Compares historical decision expectations with actual Phase 5 execution realizations."""
    model_config = ConfigDict(extra="ignore")

    has_actual_outcome: bool
    status: str = Field(
        ...,
        description="'OUTCOME_VERIFIED' | 'PENDING_EXECUTION' | 'CANCELLED_NO_DATA'",
    )
    decision_run_id: str
    crop_lot_id: str
    execution_request_id: Optional[str] = None
    agreement_id: Optional[str] = None
    route_type: str
    channel_name: str

    expected_quantity_kg: Decimal
    actual_quantity_kg: Optional[Decimal] = None
    quantity_variance_pct: Optional[Decimal] = None

    expected_unit_price: Decimal
    actual_unit_price: Optional[Decimal] = None
    price_variance_pct: Optional[Decimal] = None

    estimated_deductions_inr: Decimal
    actual_deductions_inr: Optional[Decimal] = None
    deductions_variance_inr: Optional[Decimal] = None

    estimated_net_profit_inr: Decimal
    actual_net_proceeds_inr: Optional[Decimal] = None
    net_profit_variance_inr: Optional[Decimal] = None
    net_profit_variance_pct: Optional[Decimal] = None

    expected_realization_days: int
    actual_realization_days: Optional[int] = None
    forecast_accuracy_summary: str


class DecisionResult(BaseModel):
    """Complete, immutable output of a decision engine execution run."""
    model_config = ConfigDict(extra="ignore")

    algorithm_version: str = Field(default="v2.0-deterministic")
    status: str = Field(default="COMPLETED", description="COMPLETED | NEEDS_MORE_DATA | FAILED | NO_FEASIBLE_PATHWAY")
    crop_lot_id: str
    input_snapshot: HarvestLotSnapshot
    recommended_option: Optional[CalculatedOption] = None
    ranked_feasible_options: List[CalculatedOption] = Field(default_factory=list)
    infeasible_options: List[CalculatedOption] = Field(default_factory=list)
    baseline_mandi_option: Optional[CalculatedOption] = None
    summary_explanation: str
    missing_data_warnings: List[str] = Field(default_factory=list)
    assumptions_disclosed: List[AssumptionItem] = Field(default_factory=list)
    sensitivity_preview: Optional[SensitivityAnalysisResult] = None
    disclaimer: str = Field(
        default="⚠️ DEMO MODE / ILLUSTRATIVE SAMPLE VALUES: All market prices, buyer quotes, processing conversion yields, and storage rates are sample illustrative values for simulation and verification. Not live market guarantees."
    )
