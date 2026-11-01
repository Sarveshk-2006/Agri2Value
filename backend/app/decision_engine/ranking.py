"""
Ranking and Comparison Engine for Agri2Value.

Enforces:
1. Feasibility gating before ranking (infeasible options NEVER win).
2. Pure deterministic ranking based on net profit per input kg.
3. Baseline comparison against Raw Mandi sale.
4. Explainable, farmer-friendly summary generation.
"""
from decimal import Decimal
from typing import List, Tuple, Optional
from app.decision_engine.models import (
    CalculatedOption,
    FeasibilityStatus,
    RouteType,
    round_curr,
)


def rank_and_compare_options(
    options: List[CalculatedOption],
) -> Tuple[Optional[CalculatedOption], List[CalculatedOption], List[CalculatedOption], Optional[CalculatedOption]]:
    """
    Ranks feasible options and segregates infeasible ones.
    
    Returns:
        (recommended_option, ranked_feasible_options, infeasible_options, baseline_mandi_option)
    """
    # 1. Identify baseline mandi option
    baseline_mandi: Optional[CalculatedOption] = None
    for opt in options:
        if opt.route_type == RouteType.RAW_MANDI:
            baseline_mandi = opt
            break

    baseline_net_profit = baseline_mandi.net_profit if baseline_mandi else Decimal("0.00")

    # 2. Segregate by feasibility
    feasible_candidates: List[CalculatedOption] = []
    infeasible_or_incomplete: List[CalculatedOption] = []

    for opt in options:
        # Calculate comparison against baseline
        diff = round_curr(opt.net_profit - baseline_net_profit)
        opt.additional_profit_vs_baseline = diff

        if opt.feasibility.is_feasible:
            feasible_candidates.append(opt)
        else:
            opt.rank = None
            opt.is_recommended = False
            infeasible_or_incomplete.append(opt)

    # 3. Deterministic ranking: highest net profit per kg first
    # Break ties with higher total net profit, then shorter payment days
    feasible_candidates.sort(
        key=lambda x: (
            x.net_profit_per_kg,
            x.net_profit,
            -(x.time_to_payment_days or 999),
        ),
        reverse=True,
    )

    # 4. Assign ranks and select recommended winner
    recommended: Optional[CalculatedOption] = None
    for index, opt in enumerate(feasible_candidates, start=1):
        opt.rank = index
        if index == 1:
            opt.is_recommended = True
            recommended = opt
        else:
            opt.is_recommended = False

    return recommended, feasible_candidates, infeasible_or_incomplete, baseline_mandi


def generate_decision_summary(
    recommended: Optional[CalculatedOption],
    feasible: List[CalculatedOption],
    infeasible: List[CalculatedOption],
    baseline: Optional[CalculatedOption],
) -> str:
    """Generate simple, actionable farmer-friendly explanation of the decision run."""
    if not recommended:
        return (
            "No feasible route could be confirmed for this harvest lot under current market parameters. "
            "Please review the rejected options below or update harvest quantity/grade."
        )

    baseline_profit = baseline.net_profit if baseline else Decimal("0.00")
    additional_profit = recommended.additional_profit_vs_baseline

    summary = (
        f"Recommendation: '{recommended.route_name}' ({recommended.route_type.value}) is the best feasible route, "
        f"projecting a net profit of ₹{recommended.net_profit:,.2f} (₹{recommended.net_profit_per_kg:.2f}/kg). "
    )

    if baseline and recommended.route_type != RouteType.RAW_MANDI:
        if additional_profit > Decimal("0.00"):
            summary += (
                f"This yields ₹{additional_profit:,.2f} more net profit (+{((recommended.net_profit / baseline_profit) - 1) * 100:.1f}%) "
                f"than selling raw at the local APMC mandi. "
            )
        else:
            summary += "This performs similarly to the mandi baseline after accounting for all quality and logistics deductions. "
    elif baseline and recommended.route_type == RouteType.RAW_MANDI:
        summary += (
            "Selling raw at APMC Pimpalgaon is the safest and highest net return option today because alternative buyer transport "
            "and processing charges exceed their gross premium. "
        )

    if infeasible:
        rejected_names = [f"{opt.route_name} ({', '.join(opt.feasibility.failed_checks or opt.feasibility.data_gaps or ['Infeasible'])})" for opt in infeasible]
        summary += f"Excluded routes: {'; '.join(rejected_names)}."

    return summary
