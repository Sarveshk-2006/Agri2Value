"""
Option C: Processing / Value Addition Calculator (Tomato Puree Pilot).

Calculates value-addition economics: conversion yield, processing charges,
aseptic packaging, finished goods logistics, and wholesale off-take realization.
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
from app.decision_engine.feasibility import evaluate_processing_feasibility


def calculate_processing_option(
    lot: HarvestLotSnapshot,
    facility_name: str = "Nashik Agro Cluster Food Park (Dindori Hub)",
    puree_wholesale_price_per_kg: Decimal = Decimal("95.00"),
    conversion_yield: Decimal = Decimal("0.28"),              # 28% yield (28° Brix puree)
    processing_charge_per_kg_raw: Decimal = Decimal("4.50"),   # Cluster job-work rate
    packaging_cost_per_kg_output: Decimal = Decimal("6.00"),   # Aseptic pouch & carton
    transport_to_facility_per_kg_raw: Decimal = Decimal("0.85"),
    output_delivery_per_kg_output: Decimal = Decimal("2.50"),
    quality_testing_fee_total: Decimal = Decimal("1500.00"),   # Lab batch testing
    processing_loss_pct: Decimal = Decimal("0.02"),            # 2% line spillage/waste
    min_batch_kg: Decimal = Decimal("1000"),
    max_batch_kg: Decimal = Decimal("10000"),
    facility_operational: bool = True,
    yield_known: bool = True,
    output_buyer_identified: bool = True,
    data_source: str = "Nashik Mega Food Park Processing Schedule (Sample Data)",
    data_timestamp: str = "2026-11-01T10:00:00Z",
) -> CalculatedOption:
    """Calculate financials and feasibility for Processing into Tomato Puree."""
    feasibility = evaluate_processing_feasibility(
        lot=lot,
        facility_name=facility_name,
        min_batch_kg=min_batch_kg,
        max_batch_kg=max_batch_kg,
        facility_operational=facility_operational,
        yield_known=yield_known,
        output_buyer_identified=output_buyer_identified,
    )

    q_in = lot.quantity_kg

    if not yield_known:
        # Cannot calculate without yield
        return CalculatedOption(
            route_type=RouteType.PROCESSING,
            route_name=f"Tomato Puree Processing ({facility_name})",
            feasibility=feasibility,
            saleable_quantity=Decimal("0.00"),
            saleable_quantity_unit="kg puree",
            gross_revenue=Decimal("0.00"),
            costs=CostBreakdown(
                total_costs=Decimal("0.00"),
                line_items=[],
            ),
            net_profit=Decimal("0.00"),
            net_profit_per_kg=Decimal("0.00"),
            effective_realization_per_kg=Decimal("0.00"),
            additional_profit_vs_baseline=Decimal("0.00"),
            time_to_payment_days=14,
            risk_level=RiskLevel.HIGH,
            confidence_label="Missing Yield Data",
            explanation="Processing conversion yield is unknown for this harvest batch. Needs laboratory or historical test data before calculating.",
            data_source=data_source,
            data_timestamp=data_timestamp,
            is_demo_data=True,
        )

    # Physical output calculations
    raw_puree_output_kg = round_qty(q_in * conversion_yield)
    line_loss_kg = round_qty(raw_puree_output_kg * processing_loss_pct)
    q_saleable_puree = round_qty(raw_puree_output_kg - line_loss_kg)

    gross_revenue = round_curr(q_saleable_puree * puree_wholesale_price_per_kg)

    # Costs
    raw_transport = round_curr(q_in * transport_to_facility_per_kg_raw)
    processing_charge = round_curr(q_in * processing_charge_per_kg_raw)
    packaging_cost = round_curr(q_saleable_puree * packaging_cost_per_kg_output)
    finished_transport = round_curr(q_saleable_puree * output_delivery_per_kg_output)
    labour_testing = quality_testing_fee_total

    total_costs = raw_transport + processing_charge + packaging_cost + finished_transport + labour_testing
    net_profit = round_curr(gross_revenue - total_costs)
    net_profit_per_kg = round_curr(net_profit / q_in)
    effective_realization = round_curr(gross_revenue / q_in)

    line_items = [
        CostItem(
            name="Raw Harvest Transit to Processing Hub",
            category="transport",
            amount=raw_transport,
            unit_rate=transport_to_facility_per_kg_raw,
            unit_name="per kg raw",
            is_estimated=True,
            source="Cluster freight quote",
        ),
        CostItem(
            name="Cluster Puree Extraction & Evaporation Charge",
            category="processing",
            amount=processing_charge,
            unit_rate=processing_charge_per_kg_raw,
            unit_name="per kg raw",
            is_estimated=False,
            source="Agro Cluster published tariff",
        ),
        CostItem(
            name="Food-Grade Aseptic Pouches & Cartons",
            category="packaging",
            amount=packaging_cost,
            unit_rate=packaging_cost_per_kg_output,
            unit_name="per kg puree",
            is_estimated=True,
            source="Packaging vendor catalog",
        ),
        CostItem(
            name="Finished Puree Transit to Wholesale Off-taker",
            category="transport",
            amount=finished_transport,
            unit_rate=output_delivery_per_kg_output,
            unit_name="per kg puree",
            is_estimated=True,
            source="Local distributor rate",
        ),
        CostItem(
            name="Batch Quality Assurance & Brix Certification",
            category="labour",
            amount=labour_testing,
            unit_rate=None,
            unit_name="fixed batch",
            is_estimated=False,
            source="FSSAI testing lab fee",
        ),
    ]

    cost_breakdown = CostBreakdown(
        transport=(raw_transport + finished_transport),
        labour=labour_testing,
        packaging=packaging_cost,
        commission_and_fees=Decimal("0.00"),
        processing=processing_charge,
        storage=Decimal("0.00"),
        wastage_loss=Decimal("0.00"),
        other=Decimal("0.00"),
        total_costs=total_costs,
        line_items=line_items,
    )

    explanation = (
        f"Processing {q_in:,.0f} kg tomato at {conversion_yield * 100:.0f}% yield yields {q_saleable_puree:,.1f} kg "
        f"puree. Sold at wholesale benchmark ₹{puree_wholesale_price_per_kg:.2f}/kg, gross revenue is ₹{gross_revenue:,.2f}. "
        f"After ₹{total_costs:,.2f} in processing (₹{processing_charge:,.2f}), aseptic packaging (₹{packaging_cost:,.2f}), "
        f"and logistics, net profit is ₹{net_profit:,.2f} (₹{net_profit_per_kg:.2f}/kg raw input equivalent). "
        f"Off-take payment is settled in 10-14 days."
    )

    from app.decision_engine.models import AssumptionItem, AssumptionProvenance

    assumptions = [
        AssumptionItem(
            name="Tomato Puree Conversion Yield (28° Brix)",
            value=float(conversion_yield * 100),
            unit="%",
            provenance=AssumptionProvenance.ILLUSTRATIVE_BENCHMARK,
            source_description="Food Processing Cluster standard for ripe industrial paste/puree",
            is_configurable=True,
        ),
        AssumptionItem(
            name="Job-work Processing Charge",
            value=float(processing_charge_per_kg_raw),
            unit="INR/kg raw",
            provenance=AssumptionProvenance.CONFIGURED,
            source_description="Nashik Agro Cluster Food Park processing schedule",
            is_configurable=True,
        ),
        AssumptionItem(
            name="Industrial Aseptic Packaging Cost",
            value=float(packaging_cost_per_kg_output),
            unit="INR/kg output",
            provenance=AssumptionProvenance.CONFIGURED,
            source_description="Food-grade multi-layer pouch and corrugated carton cost",
            is_configurable=True,
        ),
    ]

    constraints = [
        f"Facility batch capacity: Minimum {min_batch_kg} kg, Maximum {max_batch_kg} kg.",
        "Facility operational status must be actively verified before raw intake dispatch.",
        "Wholesale puree off-take buyer agreement must be confirmed prior to batch processing.",
    ]

    return CalculatedOption(
        route_type=RouteType.PROCESSING,
        route_name=f"Tomato Puree Processing ({facility_name})",
        feasibility=feasibility,
        saleable_quantity=q_saleable_puree,
        saleable_quantity_unit="kg puree",
        gross_revenue=gross_revenue,
        costs=cost_breakdown,
        net_profit=net_profit,
        net_profit_per_kg=net_profit_per_kg,
        effective_realization_per_kg=effective_realization,
        additional_profit_vs_baseline=Decimal("0.00"),
        time_to_payment_days=14,
        risk_level=RiskLevel.MEDIUM if feasibility.is_feasible else RiskLevel.HIGH,
        confidence_label="Cluster Economic Model (Sample Data)",
        risks_and_confidence={
            "yield_variance": "±2% Brix-dependent yield fluctuation",
            "working_capital_required": f"₹{total_costs:,.2f} required upfront for processing and packaging",
            "shelf_life_extension": "6-12 months ambient storage once sealed in aseptic pouches",
        },
        explanation=explanation,
        data_source=data_source,
        data_timestamp=data_timestamp,
        is_demo_data=True,
        itemized_assumptions=assumptions,
        operational_constraints=constraints,
    )
