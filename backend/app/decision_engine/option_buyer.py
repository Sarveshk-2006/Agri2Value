"""
Option B: Direct Buyer Sale Calculator.

Calculates net returns for institutional and contract buyers (e.g. Sahyadri Farms).
Accounts for buyer MOQ, grade acceptance, logistics, crate fees, and payment terms.
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
from app.decision_engine.feasibility import evaluate_buyer_feasibility


def calculate_buyer_option(
    lot: HarvestLotSnapshot,
    buyer_name: str = "Sahyadri Farms Contract (Mohadi Hub)",
    offer_price_per_kg: Decimal = Decimal("18.50"),
    min_quantity_kg: Decimal = Decimal("2000"),
    max_capacity_kg: Decimal = Decimal("5000"),
    required_grade: str = "A",
    distance_km: Decimal = Decimal("30"),
    transport_cost_per_kg: Decimal = Decimal("1.25"),
    quality_sorting_loss_pct: Decimal = Decimal("0.04"),   # 4% grading sort-out for Grade A
    crate_sanitization_per_kg: Decimal = Decimal("0.35"),  # Crate & phytosanitary handling
    handling_labour_per_kg: Decimal = Decimal("0.30"),
    platform_service_fee_pct: Decimal = Decimal("0.015"),  # 1.5% aggregator/platform fee
    payment_terms_days: int = 3,
    data_source: str = "Sahyadri Agro Institutional Contract Sheet (Sample Data)",
    data_timestamp: str = "2026-11-01T09:30:00Z",
) -> CalculatedOption:
    """Calculate financials and feasibility for Direct Buyer sale."""
    feasibility = evaluate_buyer_feasibility(
        lot=lot,
        buyer_name=buyer_name,
        min_quantity_kg=min_quantity_kg,
        max_capacity_kg=max_capacity_kg,
        required_grade=required_grade,
        distance_km=distance_km,
    )

    q_in = lot.quantity_kg
    # Quantity capped by buyer capacity if lot exceeds it
    accepted_input_qty = min(q_in, max_capacity_kg)

    # Physical saleable output after buyer grading
    grading_loss_kg = round_qty(accepted_input_qty * quality_sorting_loss_pct)
    q_saleable = round_qty(accepted_input_qty - grading_loss_kg)

    gross_revenue = round_curr(q_saleable * offer_price_per_kg)

    # Costs
    transport_cost = round_curr(accepted_input_qty * transport_cost_per_kg)
    packaging_cost = round_curr(accepted_input_qty * crate_sanitization_per_kg)
    labour_cost = round_curr(accepted_input_qty * handling_labour_per_kg)
    platform_fee = round_curr(gross_revenue * platform_service_fee_pct)

    total_costs = transport_cost + packaging_cost + labour_cost + platform_fee
    net_profit = round_curr(gross_revenue - total_costs)
    net_profit_per_kg = round_curr(net_profit / q_in)
    effective_realization = round_curr(gross_revenue / q_in)

    line_items = [
        CostItem(
            name=f"Dedicated Delivery to {buyer_name}",
            category="transport",
            amount=transport_cost,
            unit_rate=transport_cost_per_kg,
            unit_name="per kg",
            is_estimated=True,
            source="Distance-based refrigerated tempo tariff",
        ),
        CostItem(
            name="Crate Sanitization & Quality Traceability Tagging",
            category="packaging",
            amount=packaging_cost,
            unit_rate=crate_sanitization_per_kg,
            unit_name="per kg",
            is_estimated=True,
            source="Buyer operational onboarding fee",
        ),
        CostItem(
            name="Farm-gate Grading & Loading Hamali",
            category="labour",
            amount=labour_cost,
            unit_rate=handling_labour_per_kg,
            unit_name="per kg",
            is_estimated=True,
            source="Local agricultural labour rate",
        ),
        CostItem(
            name="FPO / Aggregation Contract Service Fee (1.5%)",
            category="commission",
            amount=platform_fee,
            unit_rate=platform_service_fee_pct,
            unit_name="rate",
            is_estimated=False,
            source="Contract schedule",
        ),
    ]

    cost_breakdown = CostBreakdown(
        transport=transport_cost,
        labour=labour_cost,
        packaging=packaging_cost,
        commission_and_fees=platform_fee,
        processing=Decimal("0.00"),
        storage=Decimal("0.00"),
        wastage_loss=Decimal("0.00"),
        other=Decimal("0.00"),
        total_costs=total_costs,
        line_items=line_items,
    )

    explanation = (
        f"Direct contract sale to {buyer_name} offers a premium rate of ₹{offer_price_per_kg:.2f}/kg. "
        f"For {q_in:,.0f} kg harvest, after {quality_sorting_loss_pct * 100:.1f}% grading sorting, "
        f"{q_saleable:,.0f} kg is accepted, yielding ₹{gross_revenue:,.2f} gross revenue. "
        f"Deducting ₹{total_costs:,.2f} in logistics, sanitization, and platform charges leaves a net profit "
        f"of ₹{net_profit:,.2f} (₹{net_profit_per_kg:.2f}/kg). Direct bank settlement within {payment_terms_days} days."
    )

    from app.decision_engine.models import AssumptionItem, AssumptionProvenance

    assumptions = [
        AssumptionItem(
            name="Contract Quality Sorting Loss",
            value=float(quality_sorting_loss_pct * 100),
            unit="%",
            provenance=AssumptionProvenance.CONFIGURED,
            source_description="Sahyadri Institutional Buyer Quality Spec",
            is_configurable=True,
        ),
        AssumptionItem(
            name="FPO / Aggregator Platform Fee",
            value=float(platform_service_fee_pct * 100),
            unit="%",
            provenance=AssumptionProvenance.CONFIGURED,
            source_description="Agri2Value Market Facilitation Fee Schedule",
            is_configurable=False,
        ),
        AssumptionItem(
            name="Direct Dedicated Freight Tariff",
            value=float(transport_cost_per_kg),
            unit="INR/kg",
            provenance=AssumptionProvenance.CONFIGURED,
            source_description="Direct farmgate-to-hub dedicated transport quote",
            is_configurable=True,
        ),
    ]

    constraints = [
        f"Minimum order quantity (MOQ) is {min_quantity_kg} kg.",
        f"Maximum intake ceiling is {max_capacity_kg} kg.",
        f"Strict Grade {required_grade} inspection; lower grades rejected or downgraded at delivery gate.",
        f"Direct payment settled within {payment_terms_days} days post weighbridge slip confirmation.",
    ]

    return CalculatedOption(
        route_type=RouteType.DIRECT_BUYER,
        route_name=buyer_name,
        feasibility=feasibility,
        saleable_quantity=q_saleable,
        saleable_quantity_unit="kg",
        gross_revenue=gross_revenue,
        costs=cost_breakdown,
        net_profit=net_profit,
        net_profit_per_kg=net_profit_per_kg,
        effective_realization_per_kg=effective_realization,
        additional_profit_vs_baseline=Decimal("0.00"),
        time_to_payment_days=payment_terms_days,
        risk_level=RiskLevel.LOW if feasibility.is_feasible else RiskLevel.HIGH,
        confidence_label="Verified Institutional Quote (Sample Data)",
        risks_and_confidence={
            "price_certainty": "High (contractually locked quote)",
            "payment_risk": f"Low (escrow / direct bank transfer within {payment_terms_days} days)",
            "quality_rejection_risk": f"Strict Grade {required_grade} inspection at hub gate",
        },
        explanation=explanation,
        data_source=data_source,
        data_timestamp=data_timestamp,
        is_demo_data=True,
        itemized_assumptions=assumptions,
        operational_constraints=constraints,
    )
