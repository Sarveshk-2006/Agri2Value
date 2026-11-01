"""
Option A: Raw Mandi Sale Calculator.

Calculates realistic returns for open-auction APMC mandi sale.
Applies transport, APMC market cess, commission, crate handling, and labour.
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
from app.decision_engine.feasibility import evaluate_raw_mandi_feasibility


def calculate_raw_mandi_option(
    lot: HarvestLotSnapshot,
    mandi_name: str = "APMC Pimpalgaon (Nashik)",
    mandi_rate_per_kg: Decimal = Decimal("14.00"),
    distance_km: Decimal = Decimal("25"),
    transport_rate_per_kg_km: Decimal = Decimal("0.045"),  # ~₹1.12/kg for 25 km
    apmc_cess_pct: Decimal = Decimal("0.0105"),             # 1.05% APMC cess
    commission_pct: Decimal = Decimal("0.0400"),            # 4.0% agent commission
    handling_per_kg: Decimal = Decimal("0.35"),             # loading/unloading
    crates_handling_per_kg: Decimal = Decimal("0.25"),      # crate wear/cleaning
    sorting_loss_pct: Decimal = Decimal("0.02"),            # 2% handling discard
    data_source: str = "APMC Pimpalgaon Daily Benchmark Bulletin (Sample Data)",
    data_timestamp: str = "2026-11-01T08:00:00Z",
) -> CalculatedOption:
    """Calculate financials and feasibility for Raw Mandi sale."""
    feasibility = evaluate_raw_mandi_feasibility(lot, distance_km=distance_km)

    # Physical quantities
    q_in = lot.quantity_kg
    sorting_loss_kg = round_qty(q_in * sorting_loss_pct)
    q_saleable = round_qty(q_in - sorting_loss_kg)

    # Gross revenue
    gross_revenue = round_curr(q_saleable * mandi_rate_per_kg)

    # Detailed costs
    transport_cost = round_curr(q_in * distance_km * transport_rate_per_kg_km)
    apmc_cess = round_curr(gross_revenue * apmc_cess_pct)
    commission = round_curr(gross_revenue * commission_pct)
    labour_cost = round_curr(q_in * handling_per_kg)
    packaging_cost = round_curr(q_in * crates_handling_per_kg)

    total_costs = transport_cost + apmc_cess + commission + labour_cost + packaging_cost
    net_profit = round_curr(gross_revenue - total_costs)
    net_profit_per_kg = round_curr(net_profit / q_in)
    effective_realization = round_curr(gross_revenue / q_in)

    line_items = [
        CostItem(
            name=f"Transport to {mandi_name}",
            category="transport",
            amount=transport_cost,
            unit_rate=round_curr(distance_km * transport_rate_per_kg_km),
            unit_name="per kg",
            is_estimated=True,
            source="Local Nashik tempo tariff",
        ),
        CostItem(
            name="APMC Cess & Market Fee (1.05%)",
            category="commission",
            amount=apmc_cess,
            unit_rate=apmc_cess_pct,
            unit_name="rate",
            is_estimated=False,
            source="APMC statutory schedule",
        ),
        CostItem(
            name="Commission Agent Fee (4.0%)",
            category="commission",
            amount=commission,
            unit_rate=commission_pct,
            unit_name="rate",
            is_estimated=True,
            source="Mandi trade practice",
        ),
        CostItem(
            name="Loading & Unloading Labour",
            category="labour",
            amount=labour_cost,
            unit_rate=handling_per_kg,
            unit_name="per kg",
            is_estimated=True,
            source="Hamali standard rate",
        ),
        CostItem(
            name="Harvest Crate Handling & Wash",
            category="packaging",
            amount=packaging_cost,
            unit_rate=crates_handling_per_kg,
            unit_name="per kg",
            is_estimated=True,
            source="Farm resource amortized cost",
        ),
    ]

    cost_breakdown = CostBreakdown(
        transport=transport_cost,
        labour=labour_cost,
        packaging=packaging_cost,
        commission_and_fees=(apmc_cess + commission),
        processing=Decimal("0.00"),
        storage=Decimal("0.00"),
        wastage_loss=Decimal("0.00"),  # Accounted in reduced saleable quantity
        other=Decimal("0.00"),
        total_costs=total_costs,
        line_items=line_items,
    )

    explanation = (
        f"Raw Mandi sale at {mandi_name} generates ₹{gross_revenue:,.2f} gross at ₹{mandi_rate_per_kg:.2f}/kg benchmark. "
        f"After ₹{total_costs:,.2f} in transport, APMC cess, commission, and labour, net profit is ₹{net_profit:,.2f} "
        f"(₹{net_profit_per_kg:.2f}/kg). Payment is immediate (1 day), but returns remain exposed to daily auction price swings."
    )

    return CalculatedOption(
        route_type=RouteType.RAW_MANDI,
        route_name=mandi_name,
        feasibility=feasibility,
        saleable_quantity=q_saleable,
        saleable_quantity_unit="kg",
        gross_revenue=gross_revenue,
        costs=cost_breakdown,
        net_profit=net_profit,
        net_profit_per_kg=net_profit_per_kg,
        effective_realization_per_kg=effective_realization,
        additional_profit_vs_baseline=Decimal("0.00"),  # Mandi is the baseline
        time_to_payment_days=1,
        risk_level=RiskLevel.MEDIUM,
        confidence_label="Benchmark Sample (Daily APMC)",
        risks_and_confidence={
            "price_volatility": "High (open auction price fluctuates hourly)",
            "payment_risk": "Low (settled via APMC authorized trader within 24h)",
            "sorting_risk": f"{sorting_loss_pct * 100:.1f}% estimated handling loss",
        },
        explanation=explanation,
        data_source=data_source,
        data_timestamp=data_timestamp,
        is_demo_data=True,
    )
