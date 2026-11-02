"""
Main Orchestration Engine for Agri2Value Profit Decision Engine.

Pure, deterministic, side-effect-free calculation and ranking.
Evaluates all feasible and infeasible pathways, calculates itemized costs,
enforces feasibility constraints before ranking, and generates farmer explanations.
"""
from decimal import Decimal
from typing import Dict, Any, Optional, List

from app.decision_engine.models import (
    HarvestLotSnapshot,
    DecisionResult,
    CalculatedOption,
    FeasibilityStatus,
)
from app.decision_engine.sample_data import PILOT_SAMPLE_DATA
from app.decision_engine.option_raw import calculate_raw_mandi_option
from app.decision_engine.option_buyer import calculate_buyer_option
from app.decision_engine.option_process import calculate_processing_option
from app.decision_engine.option_store import calculate_storage_option
from app.decision_engine.option_group import calculate_group_selling_option
from app.decision_engine.ranking import (
    rank_and_compare_options,
    generate_decision_summary,
)


class DecisionEngine:
    """
    Deterministic Decision Engine.
    Takes farmer harvest lot and parameters, calculates financial models,
    applies hard feasibility constraints, and ranks feasible outcomes.
    """

    def __init__(self, sample_overrides: Optional[Dict[str, Any]] = None):
        """Optionally accept custom market or facility parameters."""
        self.params = {**PILOT_SAMPLE_DATA}
        if sample_overrides:
            for category, values in sample_overrides.items():
                if category in self.params and isinstance(values, dict):
                    self.params[category] = {**self.params[category], **values}
                else:
                    self.params[category] = values

    def evaluate(self, lot: HarvestLotSnapshot) -> DecisionResult:
        """
        Execute deterministic evaluation across all 5 pathways for a harvest lot.
        
        Returns immutable DecisionResult.
        """
        options: List[CalculatedOption] = []
        data_warnings: List[str] = []

        # 1. Option A: Raw Mandi Sale
        mandi_cfg = self.params.get("mandi", {})
        opt_raw = calculate_raw_mandi_option(
            lot=lot,
            mandi_name=mandi_cfg.get("mandi_name", "APMC Pimpalgaon (Nashik)"),
            mandi_rate_per_kg=mandi_cfg.get("rate_per_kg", Decimal("14.00")),
            distance_km=mandi_cfg.get("distance_km", Decimal("25")),
            transport_rate_per_kg_km=mandi_cfg.get("transport_rate_per_kg_km", Decimal("0.045")),
            apmc_cess_pct=mandi_cfg.get("apmc_cess_pct", Decimal("0.0105")),
            commission_pct=mandi_cfg.get("commission_pct", Decimal("0.0400")),
            handling_per_kg=mandi_cfg.get("handling_per_kg", Decimal("0.35")),
            crates_handling_per_kg=mandi_cfg.get("crates_handling_per_kg", Decimal("0.25")),
            sorting_loss_pct=mandi_cfg.get("sorting_loss_pct", Decimal("0.02")),
            data_source=mandi_cfg.get("data_source", "APMC Pimpalgaon Bulletin (Sample Data)"),
            data_timestamp=mandi_cfg.get("data_timestamp", "2026-11-01T08:00:00Z"),
            is_live=mandi_cfg.get("is_live", False),
            is_stale=mandi_cfg.get("is_stale", False),
            staleness_warning=mandi_cfg.get("staleness_warning", None),
        )
        options.append(opt_raw)

        # 2. Option B: Direct Buyer Sale
        buyer_cfg = self.params.get("direct_buyer", {})
        opt_buyer = calculate_buyer_option(
            lot=lot,
            buyer_name=buyer_cfg.get("buyer_name", "Sahyadri Farms Contract (Mohadi Hub)"),
            offer_price_per_kg=buyer_cfg.get("offer_price_per_kg", Decimal("18.50")),
            min_quantity_kg=buyer_cfg.get("min_quantity_kg", Decimal("2000")),
            max_capacity_kg=buyer_cfg.get("max_capacity_kg", Decimal("6000")),
            required_grade=buyer_cfg.get("required_grade", "A"),
            distance_km=buyer_cfg.get("distance_km", Decimal("32")),
            transport_cost_per_kg=buyer_cfg.get("transport_cost_per_kg", Decimal("1.25")),
            quality_sorting_loss_pct=buyer_cfg.get("quality_sorting_loss_pct", Decimal("0.04")),
            crate_sanitization_per_kg=buyer_cfg.get("crate_sanitization_per_kg", Decimal("0.35")),
            handling_labour_per_kg=buyer_cfg.get("handling_labour_per_kg", Decimal("0.30")),
            platform_service_fee_pct=buyer_cfg.get("platform_service_fee_pct", Decimal("0.015")),
            payment_terms_days=buyer_cfg.get("payment_terms_days", 3),
            data_source=buyer_cfg.get("data_source", "Sahyadri Agro Quote (Sample Data)"),
            data_timestamp=buyer_cfg.get("data_timestamp", "2026-11-01T09:00:00Z"),
        )
        options.append(opt_buyer)

        # 3. Option C: Processing (Tomato Puree)
        proc_cfg = self.params.get("processing", {})
        opt_proc = calculate_processing_option(
            lot=lot,
            facility_name=proc_cfg.get("facility_name", "Nashik Agro Cluster Food Park (Dindori Hub)"),
            puree_wholesale_price_per_kg=proc_cfg.get("puree_wholesale_price_per_kg", Decimal("95.00")),
            conversion_yield=proc_cfg.get("conversion_yield", Decimal("0.28")),
            processing_charge_per_kg_raw=proc_cfg.get("processing_charge_per_kg_raw", Decimal("4.50")),
            packaging_cost_per_kg_output=proc_cfg.get("packaging_cost_per_kg_output", Decimal("6.00")),
            transport_to_facility_per_kg_raw=proc_cfg.get("transport_to_facility_per_kg_raw", Decimal("0.85")),
            output_delivery_per_kg_output=proc_cfg.get("output_delivery_per_kg_output", Decimal("2.50")),
            quality_testing_fee_total=proc_cfg.get("quality_testing_fee_total", Decimal("1500.00")),
            processing_loss_pct=proc_cfg.get("processing_loss_pct", Decimal("0.02")),
            min_batch_kg=proc_cfg.get("min_batch_kg", Decimal("1000")),
            max_batch_kg=proc_cfg.get("max_batch_kg", Decimal("10000")),
            facility_operational=proc_cfg.get("facility_operational", True),
            yield_known=proc_cfg.get("yield_known", True),
            output_buyer_identified=proc_cfg.get("output_buyer_identified", True),
            data_source=proc_cfg.get("data_source", "Nashik Processing Cluster Matrix (Sample Data)"),
            data_timestamp=proc_cfg.get("data_timestamp", "2026-11-01T09:30:00Z"),
        )
        options.append(opt_proc)

        # 4. Option D: Storage Followed by Later Sale
        store_cfg = self.params.get("storage", {})
        has_cold_access = store_cfg.get("cold_storage_available", True) and lot.has_cold_storage_access
        opt_store = calculate_storage_option(
            lot=lot,
            facility_name=store_cfg.get("facility_name", "Nashik Cold Chain Logistics Hub"),
            holding_days=store_cfg.get("holding_days", 21),
            projected_future_price_per_kg=store_cfg.get("projected_future_price_per_kg", Decimal("19.50")),
            cold_storage_rate_per_kg_month=store_cfg.get("cold_storage_rate_per_kg_month", Decimal("1.80")),
            spoilage_loss_pct=store_cfg.get("spoilage_loss_pct", Decimal("0.05")),
            inbound_transport_per_kg=store_cfg.get("inbound_transport_per_kg", Decimal("0.60")),
            outbound_transport_per_kg=store_cfg.get("outbound_transport_per_kg", Decimal("0.90")),
            cold_handling_labour_per_kg=store_cfg.get("cold_handling_labour_per_kg", Decimal("0.30")),
            cold_storage_available=has_cold_access,
            data_source=store_cfg.get("data_source", "Nashik Cold Chain Hub Tariff (Sample Data)"),
            data_timestamp=store_cfg.get("data_timestamp", "2026-11-01T10:00:00Z"),
        )
        options.append(opt_store)

        # 5. Option E: Group Selling and Collective Logistics
        grp_cfg = self.params.get("group_selling", {})
        opt_group = calculate_group_selling_option(
            lot=lot,
            group_name=grp_cfg.get("group_name", "Niphad Tomato Farmers Collective (FPO Pool)"),
            destination_market=grp_cfg.get("destination_market", "Vashi Wholesale Terminal (Navi Mumbai)"),
            target_price_per_kg=grp_cfg.get("target_price_per_kg", Decimal("17.50")),
            group_lot_data_exists=grp_cfg.get("group_lot_data_exists", False),
            active_pool_quantity_kg=grp_cfg.get("active_pool_quantity_kg", None),
            total_truck_freight_inr=grp_cfg.get("total_truck_freight_inr", Decimal("9500.00")),
            fpo_handling_per_kg=grp_cfg.get("fpo_handling_per_kg", Decimal("0.30")),
            transit_wastage_pct=grp_cfg.get("transit_wastage_pct", Decimal("0.025")),
            data_source=grp_cfg.get("data_source", "MahaFPC Collective Dispatch Registry (Sample Data)"),
            data_timestamp=grp_cfg.get("data_timestamp", "2026-11-01T10:00:00Z"),
        )
        options.append(opt_group)

        # Track missing data
        for opt in options:
            if opt.feasibility.status == FeasibilityStatus.NEEDS_MORE_DATA:
                data_warnings.extend(opt.feasibility.data_gaps)

        # Ranking and baseline comparison
        recommended, feasible, infeasible, baseline = rank_and_compare_options(options)
        summary = generate_decision_summary(recommended, feasible, infeasible, baseline)

        overall_status = "COMPLETED"
        if not feasible:
            overall_status = "NEEDS_MORE_DATA" if data_warnings else "NO_FEASIBLE_PATHWAY"

        # Collect disclosed assumptions
        all_assumptions: List[Any] = []
        seen_names = set()
        for opt in options:
            for assump in opt.itemized_assumptions:
                if assump.name not in seen_names:
                    all_assumptions.append(assump)
                    seen_names.add(assump.name)

        # Build sensitivity preview for primary option (recommended or baseline)
        primary_opt = recommended or baseline or (feasible[0] if feasible else None)
        sensitivity_preview: Optional[Any] = None
        if primary_opt and primary_opt.net_profit > Decimal("0.00"):
            from app.decision_engine.models import (
                ScenarioVariation,
                SensitivityAnalysisResult,
                round_curr,
            )

            exp_rev = primary_opt.gross_revenue
            exp_cost = primary_opt.costs.total_costs
            exp_profit = primary_opt.net_profit
            q_in = lot.quantity_kg

            # Conservative scenario: -15% gross revenue, +15% operational costs
            con_rev = round_curr(exp_rev * Decimal("0.85"))
            con_cost = round_curr(exp_cost * Decimal("1.15"))
            con_profit = round_curr(con_rev - con_cost)
            con_profit_per_kg = round_curr(con_profit / q_in)

            # Optimistic scenario: +15% gross revenue, -10% logistics/handling costs
            opt_rev = round_curr(exp_rev * Decimal("1.15"))
            opt_cost = round_curr(exp_cost * Decimal("0.90"))
            opt_profit = round_curr(opt_rev - opt_cost)
            opt_profit_per_kg = round_curr(opt_profit / q_in)

            variations = [
                ScenarioVariation(
                    scenario_type="CONSERVATIVE",
                    description="15% market price softening & 15% freight/handling spike",
                    assumptions_applied={"price_shift_pct": -15, "cost_shift_pct": 15},
                    projected_gross_revenue=con_rev,
                    projected_total_costs=con_cost,
                    projected_net_profit=con_profit,
                    projected_net_profit_per_kg=con_profit_per_kg,
                    variance_from_expected=round_curr(con_profit - exp_profit),
                ),
                ScenarioVariation(
                    scenario_type="EXPECTED",
                    description="Baseline market parameters & contracted quotations",
                    assumptions_applied={"price_shift_pct": 0, "cost_shift_pct": 0},
                    projected_gross_revenue=exp_rev,
                    projected_total_costs=exp_cost,
                    projected_net_profit=exp_profit,
                    projected_net_profit_per_kg=primary_opt.net_profit_per_kg,
                    variance_from_expected=Decimal("0.00"),
                ),
                ScenarioVariation(
                    scenario_type="OPTIMISTIC",
                    description="15% premium realization & 10% streamlined dispatch savings",
                    assumptions_applied={"price_shift_pct": 15, "cost_shift_pct": -10},
                    projected_gross_revenue=opt_rev,
                    projected_total_costs=opt_cost,
                    projected_net_profit=opt_profit,
                    projected_net_profit_per_kg=opt_profit_per_kg,
                    variance_from_expected=round_curr(opt_profit - exp_profit),
                ),
            ]

            stability = "ROBUST" if con_profit > Decimal("0.00") else "SENSITIVE_TO_PRICE"
            vulnerabilities = []
            if con_profit <= Decimal("0.00"):
                vulnerabilities.append("Downward price drop of 15% eliminates positive farmer net margin.")
            if exp_cost > (exp_rev * Decimal("0.40")):
                vulnerabilities.append("High cost structure (deductions >40% of gross); highly sensitive to fuel or labour tariffs.")

            sensitivity_preview = SensitivityAnalysisResult(
                crop_lot_id=lot.lot_id,
                crop_name=lot.crop_name,
                quantity_kg=lot.quantity_kg,
                route_type=primary_opt.route_type,
                route_name=primary_opt.route_name,
                expected_net_profit=exp_profit,
                expected_net_profit_per_kg=primary_opt.net_profit_per_kg,
                scenarios=variations,
                key_vulnerabilities=vulnerabilities or ["Resilient across reasonable price movements."],
                recommendation_stability=stability,
                sensitivity_summary=(
                    f"Net profit spans from ₹{con_profit:,.2f} (conservative) to ₹{opt_profit:,.2f} (optimistic). "
                    f"Recommendation stability: {stability}."
                ),
            )

        return DecisionResult(
            algorithm_version="v2.0-deterministic",
            status=overall_status,
            crop_lot_id=lot.lot_id,
            input_snapshot=lot,
            recommended_option=recommended,
            ranked_feasible_options=feasible,
            infeasible_options=infeasible,
            baseline_mandi_option=baseline,
            summary_explanation=summary,
            missing_data_warnings=data_warnings,
            assumptions_disclosed=all_assumptions,
            sensitivity_preview=sensitivity_preview,
            disclaimer=(
                "⚠️ DEMO MODE / ILLUSTRATIVE SAMPLE VALUES: All market prices, buyer quotes, processing conversion yields, "
                "and storage rates are sample illustrative values for simulation and verification. Not live market guarantees."
            ),
        )
