"""
Option E: Group Selling and Shared Logistics Calculator.

Evaluates collective aggregation economics: shared truckload freight,
proportional weight-based cost allocation, and FPO aggregation.
Strictly returns NEEDS_MORE_DATA if active cluster aggregation pool data is missing.
"""
from decimal import Decimal
from typing import Optional, List
from app.decision_engine.models import (
    RouteType,
    CalculatedOption,
    CostBreakdown,
    CostItem,
    HarvestLotSnapshot,
    RiskLevel,
    FeasibilityStatus,
    round_curr,
    round_qty,
)
from app.decision_engine.feasibility import evaluate_group_selling_feasibility


def calculate_group_selling_option(
    lot: HarvestLotSnapshot,
    group_name: str = "Niphad Tomato Farmers Collective (FPO Pool)",
    destination_market: str = "Vashi Wholesale Terminal (Navi Mumbai)",
    target_price_per_kg: Decimal = Decimal("17.50"),
    group_lot_data_exists: bool = False,
    active_pool_quantity_kg: Optional[Decimal] = None,
    total_truck_freight_inr: Decimal = Decimal("9500.00"),  # 10-tonne truck Mumbai run
    fpo_handling_per_kg: Decimal = Decimal("0.30"),
    transit_wastage_pct: Decimal = Decimal("0.025"),
    data_source: str = "MahaFPC Collective Dispatch Registry (Sample Data)",
    data_timestamp: str = "2026-11-01T10:30:00Z",
) -> CalculatedOption:
    """Calculate financials and feasibility for Group Selling and Shared Logistics."""
    feasibility = evaluate_group_selling_feasibility(
        lot=lot,
        group_lot_data_exists=group_lot_data_exists,
        active_pool_quantity_kg=active_pool_quantity_kg,
    )

    q_in = lot.quantity_kg

    if feasibility.status == FeasibilityStatus.NEEDS_MORE_DATA or not group_lot_data_exists or active_pool_quantity_kg is None:
        return CalculatedOption(
            route_type=RouteType.GROUP_SELLING,
            route_name=f"Shared Logistics & Group Sale ({group_name})",
            feasibility=feasibility,
            saleable_quantity=Decimal("0.00"),
            saleable_quantity_unit="kg",
            gross_revenue=Decimal("0.00"),
            costs=CostBreakdown(
                total_costs=Decimal("0.00"),
                line_items=[],
            ),
            net_profit=Decimal("0.00"),
            net_profit_per_kg=Decimal("0.00"),
            effective_realization_per_kg=Decimal("0.00"),
            additional_profit_vs_baseline=Decimal("0.00"),
            time_to_payment_days=None,
            risk_level=RiskLevel.MEDIUM,
            confidence_label="Missing Group Pool Data",
            risks_and_confidence={
                "data_status": "No active group pool or shared transport dispatch registered in cluster today",
                "prerequisite": "Requires minimum 2 other participating farmers or FPO aggregator dispatch booking",
            },
            explanation=(
                "Group selling requires an active aggregation pool and confirmed vehicle load to calculate accurate "
                "freight allocation. No verified neighbor pool is currently active in Niphad cluster for this harvest window."
            ),
            data_source=data_source,
            data_timestamp=data_timestamp,
            is_demo_data=True,
        )

    # Active pool calculations
    total_pool_kg = q_in + active_pool_quantity_kg
    farmer_weight_share = q_in / total_pool_kg

    allocated_freight = round_curr(total_truck_freight_inr * farmer_weight_share)
    freight_rate_per_kg = round_curr(allocated_freight / q_in)

    transit_loss_kg = round_qty(q_in * transit_wastage_pct)
    q_saleable = round_qty(q_in - transit_loss_kg)

    gross_revenue = round_curr(q_saleable * target_price_per_kg)
    fpo_handling = round_curr(q_in * fpo_handling_per_kg)

    total_costs = allocated_freight + fpo_handling
    net_profit = round_curr(gross_revenue - total_costs)
    net_profit_per_kg = round_curr(net_profit / q_in)
    effective_realization = round_curr(gross_revenue / q_in)

    line_items = [
        CostItem(
            name=f"Proportional Freight Share ({farmer_weight_share * 100:.1f}% of 10-Tonne Truck)",
            category="transport",
            amount=allocated_freight,
            unit_rate=freight_rate_per_kg,
            unit_name="per kg",
            is_estimated=False,
            source="FPO vehicle charter contract",
        ),
        CostItem(
            name="FPO Weighment & Collective Sorting Labour",
            category="labour",
            amount=fpo_handling,
            unit_rate=fpo_handling_per_kg,
            unit_name="per kg",
            is_estimated=True,
            source="Collective operating charge",
        ),
    ]

    cost_breakdown = CostBreakdown(
        transport=allocated_freight,
        labour=fpo_handling,
        packaging=Decimal("0.00"),
        commission_and_fees=Decimal("0.00"),
        processing=Decimal("0.00"),
        storage=Decimal("0.00"),
        wastage_loss=Decimal("0.00"),
        other=Decimal("0.00"),
        total_costs=total_costs,
        line_items=line_items,
    )

    explanation = (
        f"Aggregating {q_in:,.0f} kg with neighbor lots into a {total_pool_kg:,.0f} kg shared truckload reduces freight "
        f"to just ₹{freight_rate_per_kg:.2f}/kg (versus ₹1.25/kg for individual tempo). Sold at {destination_market} for "
        f"₹{target_price_per_kg:.2f}/kg, gross revenue is ₹{gross_revenue:,.2f}. After shared freight (₹{allocated_freight:,.2f}) "
        f"and FPO handling, net profit is ₹{net_profit:,.2f} (₹{net_profit_per_kg:.2f}/kg)."
    )

    from app.decision_engine.models import AssumptionItem, AssumptionProvenance

    assumptions = [
        AssumptionItem(
            name="Shared Freight Full-Truck Tariff",
            value=float(total_truck_freight_inr),
            unit="INR/truck",
            provenance=AssumptionProvenance.CONFIGURED,
            source_description="Vashi Wholesale Terminal round-trip 10-tonne truck freight",
            is_configurable=True,
        ),
        AssumptionItem(
            name="Pooling Aggregation Threshold",
            value=8000,
            unit="kg",
            provenance=AssumptionProvenance.CONFIGURED,
            source_description="Minimum collective volume required for freight economy",
            is_configurable=False,
        ),
    ]

    constraints = [
        "Farmer must register lot into verified Niphad cluster pooling pool.",
        "Dispatch schedule synchronized; individual lot delay delays entire collective consignment.",
    ]

    return CalculatedOption(
        route_type=RouteType.GROUP_SELLING,
        route_name=f"Shared Logistics & Group Sale ({group_name})",
        feasibility=feasibility,
        saleable_quantity=q_saleable,
        saleable_quantity_unit="kg",
        gross_revenue=gross_revenue,
        costs=cost_breakdown,
        net_profit=net_profit,
        net_profit_per_kg=net_profit_per_kg,
        effective_realization_per_kg=effective_realization,
        additional_profit_vs_baseline=Decimal("0.00"),
        time_to_payment_days=4,
        risk_level=RiskLevel.LOW if feasibility.is_feasible else RiskLevel.MEDIUM,
        confidence_label="FPO Aggregation Schedule (Sample Data)",
        risks_and_confidence={
            "coordination_risk": f"Pool volume {total_pool_kg:,.0f} kg depends on all member dispatches arriving on schedule",
            "logistics_saving": f"Saves ₹{(Decimal('1.25') - freight_rate_per_kg):.2f}/kg in transport through truck pooling",
        },
        explanation=explanation,
        data_source=data_source,
        data_timestamp=data_timestamp,
        is_demo_data=True,
        itemized_assumptions=assumptions,
        operational_constraints=constraints,
    )
