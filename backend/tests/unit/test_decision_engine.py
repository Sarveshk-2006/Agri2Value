"""
Unit tests for the Profit Decision Engine.

Tests:
- Decimal precision (no float rounding errors).
- Net profit formulas: Net Profit = Gross Revenue - Total Costs.
- Scenario 1: Direct buyer wins.
- Scenario 2: Mandi wins.
- Scenario 3: Processing is infeasible (capacity exceeded / facility down).
- Scenario 4: Missing data prevents recommendation (NEEDS_MORE_DATA).
- Feasibility constraints: MOQ, capacity bounds, grade mismatch, perishability limits.
- Infeasible options NEVER winning rank 1.
- Baseline comparison against APMC raw mandi.
"""
from decimal import Decimal
import pytest

from app.decision_engine.models import (
    HarvestLotSnapshot,
    RouteType,
    FeasibilityStatus,
    RiskLevel,
)
from app.decision_engine.engine import DecisionEngine
from app.decision_engine.feasibility import (
    evaluate_buyer_feasibility,
    evaluate_processing_feasibility,
    evaluate_storage_feasibility,
    evaluate_group_selling_feasibility,
)
from app.decision_engine.option_raw import calculate_raw_mandi_option
from app.decision_engine.option_buyer import calculate_buyer_option
from app.decision_engine.option_process import calculate_processing_option
from app.decision_engine.option_store import calculate_storage_option


@pytest.fixture
def standard_tomato_lot() -> HarvestLotSnapshot:
    """Standard 4,000 kg Grade A tomato lot from Niphad, Nashik."""
    return HarvestLotSnapshot(
        lot_id="lot-test-1",
        crop_name="Tomato",
        variety="Abhinav",
        quantity_kg=Decimal("4000.00"),
        quality_grade="A",
        farm_district="Nashik",
        farm_village="Niphad",
        has_cold_storage_access=False,
    )


def test_decimal_precision_in_financial_calculations(standard_tomato_lot):
    """Verify that all calculations use Decimal and avoid binary floating-point rounding drift."""
    opt_raw = calculate_raw_mandi_option(standard_tomato_lot)

    # Values must be exact Decimal instances
    assert isinstance(opt_raw.gross_revenue, Decimal)
    assert isinstance(opt_raw.costs.total_costs, Decimal)
    assert isinstance(opt_raw.net_profit, Decimal)
    assert isinstance(opt_raw.net_profit_per_kg, Decimal)

    # Net profit formula exact equality
    assert opt_raw.net_profit == opt_raw.gross_revenue - opt_raw.costs.total_costs
    # Check that sum of cost line items equals total_costs
    sum_items = sum(item.amount for item in opt_raw.costs.line_items)
    assert sum_items == opt_raw.costs.total_costs


def test_scenario_1_direct_buyer_wins(standard_tomato_lot):
    """
    Scenario 1: Direct institutional buyer produces higher net profit than APMC mandi
    even after accounting for transport, crate sanitization, and platform fees.
    """
    engine = DecisionEngine()
    result = engine.evaluate(standard_tomato_lot)

    assert result.status == "COMPLETED"
    assert result.recommended_option is not None
    # Sahyadri Farms Direct Buyer should rank 1
    assert result.recommended_option.route_type == RouteType.DIRECT_BUYER
    assert result.recommended_option.rank == 1
    assert result.recommended_option.is_recommended is True

    # Mandi baseline comparison
    assert result.baseline_mandi_option is not None
    assert result.baseline_mandi_option.route_type == RouteType.RAW_MANDI
    # Buyer net profit must exceed Mandi net profit
    assert result.recommended_option.net_profit > result.baseline_mandi_option.net_profit
    assert result.recommended_option.additional_profit_vs_baseline > Decimal("0.00")


def test_scenario_2_mandi_wins_when_buyer_costs_spike(standard_tomato_lot):
    """
    Scenario 2: Buyer offer looks attractive on paper, but higher transport,
    longer distance, and strict rejection make APMC mandi more profitable.
    """
    engine = DecisionEngine(
        sample_overrides={
            "direct_buyer": {
                "offer_price_per_kg": Decimal("15.50"),
                "distance_km": Decimal("110"),
                "transport_cost_per_kg": Decimal("4.50"),
                "quality_sorting_loss_pct": Decimal("0.12"),  # 12% rejection
            },
            "processing": {
                "facility_operational": False,  # Turn off processing
            },
        }
    )
    result = engine.evaluate(standard_tomato_lot)

    assert result.recommended_option is not None
    # Mandi must win this scenario
    assert result.recommended_option.route_type == RouteType.RAW_MANDI
    assert result.recommended_option.rank == 1


def test_scenario_3_processing_is_infeasible_when_capacity_exceeded(standard_tomato_lot):
    """
    Scenario 3: Processing would look profitable on gross revenue,
    but fails hard capacity constraint (lot exceeds max batch size) and is never recommended.
    """
    # Create engine where processing max batch is 2,000 kg (lot is 4,000 kg)
    engine = DecisionEngine(
        sample_overrides={
            "processing": {
                "max_batch_kg": Decimal("2000.00"),
                "puree_wholesale_price_per_kg": Decimal("200.00"),  # Very high tempting price!
            }
        }
    )
    result = engine.evaluate(standard_tomato_lot)

    # Find the processing option
    proc_opt = next((o for o in result.infeasible_options if o.route_type == RouteType.PROCESSING), None)
    assert proc_opt is not None
    assert proc_opt.feasibility.status == FeasibilityStatus.INFEASIBLE
    assert proc_opt.is_recommended is False
    assert proc_opt.rank is None
    assert any("exceeds processing facility batch capacity" in msg for msg in proc_opt.feasibility.failed_checks)

    # The winner must NOT be processing, despite tempting ₹200/kg gross price
    assert result.recommended_option.route_type != RouteType.PROCESSING


def test_scenario_4_missing_data_status(standard_tomato_lot):
    """
    Scenario 4: When critical data is missing (e.g. unknown processing conversion yield),
    the route must return NEEDS_MORE_DATA rather than guessing zero.
    """
    opt_proc = calculate_processing_option(
        lot=standard_tomato_lot,
        yield_known=False,
    )
    assert opt_proc.feasibility.status == FeasibilityStatus.NEEDS_MORE_DATA
    assert "Processing conversion yield is unknown" in opt_proc.feasibility.data_gaps[0]
    assert opt_proc.saleable_quantity == Decimal("0.00")
    assert opt_proc.net_profit == Decimal("0.00")


def test_buyer_moq_constraint():
    """Verify buyer MOQ hard constraint fails when lot quantity is too small."""
    small_lot = HarvestLotSnapshot(
        lot_id="small-1",
        crop_name="Tomato",
        quantity_kg=Decimal("800.00"),  # Below 2,000 kg MOQ
        quality_grade="A",
    )
    check = evaluate_buyer_feasibility(
        lot=small_lot,
        buyer_name="Test Buyer",
        min_quantity_kg=Decimal("2000"),
        max_capacity_kg=Decimal("5000"),
        required_grade="A",
    )
    assert check.status == FeasibilityStatus.INFEASIBLE
    assert any("is below buyer MOQ" in msg for msg in check.failed_checks)


def test_buyer_grade_mismatch_constraint():
    """Verify buyer rejects lot if required grade A is not met (e.g. Grade C)."""
    grade_c_lot = HarvestLotSnapshot(
        lot_id="c-lot",
        crop_name="Tomato",
        quantity_kg=Decimal("3000.00"),
        quality_grade="C",
    )
    check = evaluate_buyer_feasibility(
        lot=grade_c_lot,
        buyer_name="Institutional Exporter",
        min_quantity_kg=Decimal("1000"),
        max_capacity_kg=Decimal("5000"),
        required_grade="A",
    )
    assert check.status == FeasibilityStatus.INFEASIBLE
    assert any("Buyer requires Grade A, but crop lot is Grade C" in msg for msg in check.failed_checks)


def test_storage_perishability_holding_constraint(standard_tomato_lot):
    """Perishable tomatoes cannot be held in ambient conditions for 21 days."""
    check = evaluate_storage_feasibility(
        lot=standard_tomato_lot,
        holding_days=21,
        cold_storage_available=False,
        max_ambient_days=4,
    )
    assert check.status == FeasibilityStatus.INFEASIBLE
    assert any("cannot be held for 21 days under ambient" in msg for msg in check.failed_checks)


def test_group_selling_missing_data_rule(standard_tomato_lot):
    """Group selling requires verified pool data; missing data returns NEEDS_MORE_DATA."""
    check = evaluate_group_selling_feasibility(
        lot=standard_tomato_lot,
        group_lot_data_exists=False,
        active_pool_quantity_kg=None,
    )
    assert check.status == FeasibilityStatus.NEEDS_MORE_DATA
    assert any("No active FPO/neighbor aggregation pool found" in msg for msg in check.data_gaps)
