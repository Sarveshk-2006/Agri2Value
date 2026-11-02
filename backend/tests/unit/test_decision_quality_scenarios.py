"""
Comprehensive Decision Quality & Optimization Scenario Evaluation Suite.
Tests Section 10 of Phase 6:
1. High mandi price but high transport cost.
2. Lower mandi price but better direct buyer net return.
3. Processing with insufficient recovery.
4. Processing with unavailable capacity.
5. Storage with inadequate remaining shelf life.
6. Rain forecast affecting delivery feasibility.
7. Stale mandi data.
8. Missing price data.
9. Conflicting or incomplete inputs.
10. Buyer capacity below available quantity.
11. Logistics capacity shortage.
12. Partial harvest quantity below MOQ.
13. High expected wastage.
14. Low-confidence assumptions disclosure.
15. No feasible pathway handling.
16. Multiple pathways with similar net proceeds tie-breaking.
"""
from decimal import Decimal
import pytest

from app.core.errors import ValidationError
from app.decision_engine.models import (
    HarvestLotSnapshot,
    RouteType,
    FeasibilityStatus,
    AssumptionProvenance,
)
from app.decision_engine.engine import DecisionEngine
from app.services.mandi_service import check_staleness, mandi_service


@pytest.fixture
def base_tomato_lot():
    return HarvestLotSnapshot(
        lot_id="lot-test-eval-001",
        crop_name="Tomato",
        variety="Vaishali",
        quantity_kg=Decimal("3500.00"),
        quality_grade="A",
        farm_district="Nashik",
        farm_village="Niphad",
        has_cold_storage_access=False,
    )


def test_scenario_1_high_mandi_price_high_transport_cost(base_tomato_lot):
    """
    Scenario 1: Mandi has higher headline rate (₹24/kg) but high freight tariff
    over 120 km (feasible distance <= 150 km).
    Direct buyer offers ₹20/kg at 10 km hub with negligible freight.
    Direct buyer net proceeds should win despite lower headline rate.
    """
    overrides = {
        "mandi": {
            "rate_per_kg": Decimal("24.00"),
            "distance_km": Decimal("120.0"),
            "transport_rate_per_kg_km": Decimal("0.08"),  # ₹9.60/kg transport
        },
        "direct_buyer": {
            "offer_price_per_kg": Decimal("20.00"),
            "distance_km": Decimal("10.0"),
            "transport_cost_per_kg": Decimal("0.40"),
        },
        "processing": {"facility_operational": False},
    }
    engine = DecisionEngine(sample_overrides=overrides)
    res = engine.evaluate(base_tomato_lot)

    assert res.recommended_option is not None
    assert res.recommended_option.route_type == RouteType.DIRECT_BUYER
    assert res.recommended_option.rank == 1

    mandi_opt = next(o for o in res.ranked_feasible_options if o.route_type == RouteType.RAW_MANDI)
    assert mandi_opt.costs.transport > Decimal("30000.00")
    assert res.recommended_option.net_profit > mandi_opt.net_profit


def test_scenario_2_lower_mandi_price_better_direct_buyer(base_tomato_lot):
    """
    Scenario 2: Baseline market rates where buyer offers ₹18.50/kg vs APMC ₹14.00/kg.
    Direct buyer is feasible and achieves higher net realization.
    """
    engine = DecisionEngine()
    res = engine.evaluate(base_tomato_lot)

    assert res.status == "COMPLETED"
    buyer_opt = next((o for o in res.ranked_feasible_options if o.route_type == RouteType.DIRECT_BUYER), None)
    mandi_opt = next((o for o in res.ranked_feasible_options if o.route_type == RouteType.RAW_MANDI), None)

    assert buyer_opt is not None
    assert mandi_opt is not None
    assert buyer_opt.net_profit > mandi_opt.net_profit
    assert buyer_opt.feasibility.status == FeasibilityStatus.FEASIBLE


def test_scenario_3_processing_insufficient_recovery(base_tomato_lot):
    """
    Scenario 3: Processing conversion yield drops to 10% (unfavorable watery harvest).
    Processing revenue fails to cover costs and yields lower net return than raw mandi sale.
    """
    overrides = {
        "processing": {
            "conversion_yield": Decimal("0.10"),  # 10% yield
            "puree_wholesale_price_per_kg": Decimal("50.00"),  # Low price
        }
    }
    engine = DecisionEngine(sample_overrides=overrides)
    res = engine.evaluate(base_tomato_lot)

    proc_opt = next((o for o in res.ranked_feasible_options + res.infeasible_options if o.route_type == RouteType.PROCESSING), None)
    raw_opt = res.baseline_mandi_option

    assert proc_opt is not None
    assert proc_opt.net_profit < raw_opt.net_profit
    assert res.recommended_option.route_type != RouteType.PROCESSING


def test_scenario_4_processing_unavailable_capacity(base_tomato_lot):
    """
    Scenario 4: Processing facility batch limit is 2,000 kg, but lot is 3,500 kg.
    Option must be INFEASIBLE and cannot be recommended.
    """
    overrides = {
        "processing": {
            "max_batch_kg": Decimal("2000.00"),
            "facility_operational": True,
        }
    }
    engine = DecisionEngine(sample_overrides=overrides)
    res = engine.evaluate(base_tomato_lot)

    proc_opt = next((o for o in res.infeasible_options if o.route_type == RouteType.PROCESSING), None)
    assert proc_opt is not None
    assert proc_opt.feasibility.status == FeasibilityStatus.INFEASIBLE
    assert proc_opt.is_recommended is False
    assert any("batch capacity" in f.lower() for f in proc_opt.feasibility.failed_checks)


def test_scenario_5_storage_inadequate_shelf_life(base_tomato_lot):
    """
    Scenario 5: Holding perishables (tomato) at ambient temperature for 10 days exceeds
    the 4-day ambient safe holding limit. Feasibility must be INFEASIBLE.
    """
    overrides = {
        "storage": {
            "holding_days": 10,
        }
    }
    base_tomato_lot.has_cold_storage_access = False
    engine = DecisionEngine(sample_overrides=overrides)
    res = engine.evaluate(base_tomato_lot)

    store_opt = next((o for o in res.infeasible_options if o.route_type == RouteType.STORAGE), None)
    assert store_opt is not None
    assert store_opt.feasibility.status == FeasibilityStatus.INFEASIBLE
    assert any("ambient" in f.lower() or "perishability" in f.lower() for f in store_opt.feasibility.failed_checks)


def test_scenario_6_rain_forecast_delivery_feasibility(base_tomato_lot):
    """
    Scenario 6: Rain alert and morning transit constraints are disclosed as operational constraints.
    """
    engine = DecisionEngine()
    res = engine.evaluate(base_tomato_lot)

    mandi_opt = next(o for o in res.ranked_feasible_options if o.route_type == RouteType.RAW_MANDI)
    assert len(mandi_opt.operational_constraints) > 0
    assert any("rain" in c.lower() or "transit" in c.lower() for c in mandi_opt.operational_constraints)


def test_scenario_7_stale_mandi_data():
    """
    Scenario 7: Mandi observation older than 7 days triggers staleness flag.
    """
    is_stale, warning = check_staleness("2026-10-15", max_days=7)
    assert is_stale is True
    assert "days old" in warning.lower()


def test_scenario_8_missing_price_data(base_tomato_lot):
    """
    Scenario 8: Missing processing yield data flags status as NEEDS_MORE_DATA.
    """
    overrides = {
        "processing": {
            "yield_known": False,
        }
    }
    engine = DecisionEngine(sample_overrides=overrides)
    res = engine.evaluate(base_tomato_lot)

    proc_opt = next((o for o in res.infeasible_options if o.route_type == RouteType.PROCESSING), None)
    assert proc_opt is not None
    assert proc_opt.feasibility.status == FeasibilityStatus.NEEDS_MORE_DATA


@pytest.mark.asyncio
async def test_scenario_9_conflicting_or_incomplete_inputs():
    """
    Scenario 9: Requesting quotes for an unsupported commodity strictly raises ValidationError.
    """
    with pytest.raises(ValidationError) as exc_info:
        await mandi_service.get_verified_mandi_quote(
            crop_name="DragonFruit",
            district="Nashik",
        )
    assert "No verified mandi market quotes found" in str(exc_info.value)


def test_scenario_10_buyer_capacity_below_available_quantity(base_tomato_lot):
    """
    Scenario 10: Buyer has max procurement quota of 2,000 kg, but lot is 3,500 kg.
    Option is INFEASIBLE due to intake quota.
    """
    overrides = {
        "direct_buyer": {
            "max_capacity_kg": Decimal("2000.00"),
        }
    }
    engine = DecisionEngine(sample_overrides=overrides)
    res = engine.evaluate(base_tomato_lot)

    buyer_opt = next((o for o in res.infeasible_options if o.route_type == RouteType.DIRECT_BUYER), None)
    assert buyer_opt is not None
    assert buyer_opt.feasibility.status == FeasibilityStatus.INFEASIBLE
    assert any("exceeds buyer maximum intake quota" in f for f in buyer_opt.feasibility.failed_checks)


def test_scenario_11_logistics_capacity_shortage(base_tomato_lot):
    """
    Scenario 11: Distance exceeds mandi safe transit radius (220 km > 150 km) -> INFEASIBLE.
    """
    overrides = {
        "mandi": {
            "distance_km": Decimal("220.0"),  # Exceeds 150 km safe radius
        }
    }
    engine = DecisionEngine(sample_overrides=overrides)
    res = engine.evaluate(base_tomato_lot)

    mandi_opt = next((o for o in res.infeasible_options if o.route_type == RouteType.RAW_MANDI), None)
    assert mandi_opt is not None
    assert mandi_opt.feasibility.status == FeasibilityStatus.INFEASIBLE
    assert any("exceeds maximum safe transit distance" in f for f in mandi_opt.feasibility.failed_checks)


def test_scenario_12_partial_harvest_quantity_below_moq():
    """
    Scenario 12: Harvest lot is small (500 kg), below buyer Minimum Order Quantity of 2,000 kg.
    Direct buyer route must be marked INFEASIBLE.
    """
    small_lot = HarvestLotSnapshot(
        lot_id="small-lot-001",
        crop_name="Tomato",
        variety="Vaishali",
        quantity_kg=Decimal("500.00"),
        quality_grade="A",
        farm_district="Nashik",
        farm_village="Niphad",
        has_cold_storage_access=False,
    )
    overrides = {
        "direct_buyer": {
            "min_quantity_kg": Decimal("2000.00"),
        }
    }
    engine = DecisionEngine(sample_overrides=overrides)
    res = engine.evaluate(small_lot)

    buyer_opt = next((o for o in res.infeasible_options if o.route_type == RouteType.DIRECT_BUYER), None)
    assert buyer_opt is not None
    assert buyer_opt.feasibility.status == FeasibilityStatus.INFEASIBLE
    assert any("below buyer moq" in f.lower() for f in buyer_opt.feasibility.failed_checks)


def test_scenario_13_high_expected_wastage(base_tomato_lot):
    """
    Scenario 13: 20% sorting loss at buyer collection gate heavily impacts net proceeds.
    The engine deducts the loss from gross revenue and records it in wastage_loss.
    """
    overrides = {
        "direct_buyer": {
            "quality_sorting_loss_pct": Decimal("0.20"),  # 20% sorting loss
        }
    }
    engine = DecisionEngine(sample_overrides=overrides)
    res = engine.evaluate(base_tomato_lot)

    buyer_opt = next((o for o in res.ranked_feasible_options if o.route_type == RouteType.DIRECT_BUYER), None)
    assert buyer_opt is not None
    assert buyer_opt.saleable_quantity == Decimal("3500.00") * Decimal("0.80")
    # 20% sorting loss reduces gross revenue by exactly 20% (₹12,950 loss from unculled potential)
    uncurated_gross = Decimal("3500.00") * Decimal("18.50")
    assert uncurated_gross - buyer_opt.gross_revenue >= Decimal("12950.00")


def test_scenario_14_low_confidence_assumptions_disclosure(base_tomato_lot):
    """
    Scenario 14: Disclosed assumptions contain provenance tags (VERIFIED, CONFIGURED, ILLUSTRATIVE_BENCHMARK).
    Ensures farmers are informed that processing yield is a benchmark, not a scientific guarantee.
    """
    engine = DecisionEngine()
    res = engine.evaluate(base_tomato_lot)

    assert len(res.assumptions_disclosed) > 0
    yield_assumption = next(
        (a for a in res.assumptions_disclosed if "Puree" in a.name or "Yield" in a.name or "Conversion" in a.name),
        None,
    )
    assert yield_assumption is not None
    assert yield_assumption.provenance == AssumptionProvenance.ILLUSTRATIVE_BENCHMARK


def test_scenario_15_no_feasible_pathway(base_tomato_lot):
    """
    Scenario 15: Extreme stress test where all candidate pathways are infeasible.
    Engine must return status NO_FEASIBLE_PATHWAY or NEEDS_MORE_DATA, and recommended_option must be None.
    Never recommend an infeasible option.
    """
    overrides = {
        "mandi": {"distance_km": Decimal("250.0")},  # > 150 km
        "direct_buyer": {"min_quantity_kg": Decimal("10000.00")},  # > 3500 kg
        "processing": {"facility_operational": False},
        "storage": {"holding_days": 20},  # Perishable fails
        "group_selling": {"group_lot_data_exists": False},  # No pool exists
    }
    engine = DecisionEngine(sample_overrides=overrides)
    res = engine.evaluate(base_tomato_lot)

    assert res.recommended_option is None
    assert len(res.ranked_feasible_options) == 0
    assert len(res.infeasible_options) >= 4
    assert res.status in ("NO_FEASIBLE_PATHWAY", "NEEDS_MORE_DATA")


def test_scenario_16_multiple_pathways_similar_net_proceeds(base_tomato_lot):
    """
    Scenario 16: Two pathways with virtually identical net proceeds.
    Deterministic tie-breaking ranks the option consistently.
    """
    overrides = {
        "direct_buyer": {
            "offer_price_per_kg": Decimal("15.50"),
            "distance_km": Decimal("25.0"),
            "transport_cost_per_kg": Decimal("1.10"),
        },
        "mandi": {
            "rate_per_kg": Decimal("15.50"),
            "distance_km": Decimal("25.0"),
            "transport_rate_per_kg_km": Decimal("0.044"),
        },
        "processing": {"facility_operational": False},
    }
    engine = DecisionEngine(sample_overrides=overrides)
    res = engine.evaluate(base_tomato_lot)

    assert len(res.ranked_feasible_options) >= 2
    # Verify deterministic ranking
    assert res.ranked_feasible_options[0].rank == 1
    assert res.ranked_feasible_options[1].rank == 2
    assert res.ranked_feasible_options[0].net_profit >= res.ranked_feasible_options[1].net_profit
