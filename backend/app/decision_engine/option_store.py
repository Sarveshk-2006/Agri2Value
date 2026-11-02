"""
Option D: Storage Followed by Later Sale Calculator.

Calculates cold-chain holding economics: safe holding period for perishable crops,
monthly warehousing rates, shrinkage/spoilage losses, and projected post-glut realization.
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
    round_curr,
    round_qty,
)
from app.decision_engine.feasibility import evaluate_storage_feasibility


def calculate_storage_option(
    lot: HarvestLotSnapshot,
    facility_name: str = "Nashik Cold Chain Logistics Hub",
    holding_days: int = 21,
    projected_future_price_per_kg: Decimal = Decimal("19.50"),
    cold_storage_rate_per_kg_month: Decimal = Decimal("1.80"),
    spoilage_loss_pct: Decimal = Decimal("0.05"),               # 5% shrinkage and sorting loss
    inbound_transport_per_kg: Decimal = Decimal("0.60"),
    outbound_transport_per_kg: Decimal = Decimal("0.90"),
    cold_handling_labour_per_kg: Decimal = Decimal("0.30"),
    cold_storage_available: bool = True,
    data_source: str = "Nashik Cold Storage Association Tariff & Trend Model (Sample Data)",
    data_timestamp: str = "2026-11-01T10:15:00Z",
) -> CalculatedOption:
    """Calculate financials and feasibility for Storage followed by Later Sale."""
    feasibility = evaluate_storage_feasibility(
        lot=lot,
        holding_days=holding_days,
        cold_storage_available=cold_storage_available,
    )

    q_in = lot.quantity_kg

    # Spoilage & shrinkage during cold holding
    spoilage_kg = round_qty(q_in * spoilage_loss_pct)
    q_saleable = round_qty(q_in - spoilage_kg)

    gross_revenue = round_curr(q_saleable * projected_future_price_per_kg)

    # Holding fee prorated by days
    month_fraction = Decimal(str(holding_days)) / Decimal("30.0")
    holding_cost = round_curr(q_in * cold_storage_rate_per_kg_month * month_fraction)

    # Inbound and outbound logistics
    inbound_freight = round_curr(q_in * inbound_transport_per_kg)
    outbound_freight = round_curr(q_saleable * outbound_transport_per_kg)
    handling_labour = round_curr(q_in * cold_handling_labour_per_kg)

    total_costs = holding_cost + inbound_freight + outbound_freight + handling_labour
    net_profit = round_curr(gross_revenue - total_costs)
    net_profit_per_kg = round_curr(net_profit / q_in)
    effective_realization = round_curr(gross_revenue / q_in)

    line_items = [
        CostItem(
            name=f"Cold Holding Fee ({holding_days} days @ ₹{cold_storage_rate_per_kg_month}/kg/mo)",
            category="storage",
            amount=holding_cost,
            unit_rate=round_curr(cold_storage_rate_per_kg_month * month_fraction),
            unit_name="per kg",
            is_estimated=False,
            source="Cold store tariff schedule",
        ),
        CostItem(
            name="Inbound Transit from Farm to Cold Hub",
            category="transport",
            amount=inbound_freight,
            unit_rate=inbound_transport_per_kg,
            unit_name="per kg",
            is_estimated=True,
            source="Local freight rate",
        ),
        CostItem(
            name="Outbound Delivery to Market at End of Holding",
            category="transport",
            amount=outbound_freight,
            unit_rate=outbound_transport_per_kg,
            unit_name="per kg",
            is_estimated=True,
            source="Local freight rate",
        ),
        CostItem(
            name="Cold Stacking & Hamali Handling",
            category="labour",
            amount=handling_labour,
            unit_rate=cold_handling_labour_per_kg,
            unit_name="per kg",
            is_estimated=True,
            source="Warehouse labour tariff",
        ),
    ]

    cost_breakdown = CostBreakdown(
        transport=(inbound_freight + outbound_freight),
        labour=handling_labour,
        packaging=Decimal("0.00"),
        commission_and_fees=Decimal("0.00"),
        processing=Decimal("0.00"),
        storage=holding_cost,
        wastage_loss=Decimal("0.00"),
        other=Decimal("0.00"),
        total_costs=total_costs,
        line_items=line_items,
    )

    explanation = (
        f"Holding {q_in:,.0f} kg in cold storage for {holding_days} days projects a post-glut realization of "
        f"₹{projected_future_price_per_kg:.2f}/kg. After {spoilage_loss_pct * 100:.1f}% storage shrinkage ({spoilage_kg:.0f} kg), "
        f"saleable quantity is {q_saleable:,.0f} kg, generating ₹{gross_revenue:,.2f} gross. "
        f"Deducting ₹{holding_cost:,.2f} in storage fees and ₹{inbound_freight + outbound_freight + handling_labour:,.2f} in two-way freight/handling, "
        f"estimated net profit is ₹{net_profit:,.2f} (₹{net_profit_per_kg:.2f}/kg). Carries price forecast and quality holding risk."
    )

    from app.decision_engine.models import AssumptionItem, AssumptionProvenance

    assumptions = [
        AssumptionItem(
            name="Cold Storage Tariff",
            value=float(cold_storage_rate_per_kg_month),
            unit="INR/kg/month",
            provenance=AssumptionProvenance.CONFIGURED,
            source_description="Regional commercial cold chain tariff",
            is_configurable=True,
        ),
        AssumptionItem(
            name="Cold Storage Spoilage Shrinkage",
            value=float(spoilage_loss_pct * 100),
            unit="%",
            provenance=AssumptionProvenance.ILLUSTRATIVE_BENCHMARK,
            source_description="Atmospheric holding loss guideline for tomatoes at 0-4°C",
            is_configurable=True,
        ),
        AssumptionItem(
            name="Holding Duration",
            value=holding_days,
            unit="days",
            provenance=AssumptionProvenance.CONFIGURED,
            source_description="Targeted delay until mandi glut volume subsides",
            is_configurable=True,
        ),
    ]

    constraints = [
        "Farmer must possess confirmed reservation at verified cold storage facility.",
        f"Maximum safe ambient shelf-life is 4 days; tomato must enter cold room within 12 hours of harvest.",
        f"Rebound price realization is speculative; price must exceed ₹{(total_costs / q_saleable):.2f}/kg to break even.",
    ]

    return CalculatedOption(
        route_type=RouteType.STORAGE,
        route_name=f"Cold Storage ({facility_name}, {holding_days} Days)",
        feasibility=feasibility,
        saleable_quantity=q_saleable,
        saleable_quantity_unit="kg",
        gross_revenue=gross_revenue,
        costs=cost_breakdown,
        net_profit=net_profit,
        net_profit_per_kg=net_profit_per_kg,
        effective_realization_per_kg=effective_realization,
        additional_profit_vs_baseline=Decimal("0.00"),
        time_to_payment_days=holding_days + 2,
        risk_level=RiskLevel.HIGH,
        confidence_label="Forecast Scenario (Sample Data)",
        risks_and_confidence={
            "market_timing_risk": f"Future price ₹{projected_future_price_per_kg:.2f}/kg is a projection, not a guaranteed quote",
            "spoilage_exposure": f"Perishable crop quality deteriorates with extended holding ({spoilage_loss_pct * 100:.0f}% loss)",
            "cash_delay": f"Payment delayed by {holding_days + 2} days",
        },
        explanation=explanation,
        data_source=data_source,
        data_timestamp=data_timestamp,
        is_demo_data=True,
        itemized_assumptions=assumptions,
        operational_constraints=constraints,
    )
