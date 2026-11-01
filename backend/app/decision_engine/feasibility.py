"""
Feasibility Gate for Agri2Value Profit Decision Engine.

Enforces hard and soft feasibility constraints BEFORE ranking.
An infeasible route is NEVER presented as the best recommendation.
"""
from decimal import Decimal
from typing import Optional, List, Tuple
from app.decision_engine.models import (
    FeasibilityStatus,
    FeasibilityCheckResult,
    HarvestLotSnapshot,
    RouteType,
)


def evaluate_raw_mandi_feasibility(
    lot: HarvestLotSnapshot,
    distance_km: Decimal = Decimal("25"),
    max_safe_distance_km: Decimal = Decimal("150"),
) -> FeasibilityCheckResult:
    """Evaluate feasibility of selling raw crop at APMC Mandi."""
    passed: List[str] = []
    failed: List[str] = []
    unmet: List[str] = []

    if lot.quantity_kg <= 0:
        failed.append("Harvest quantity must be greater than 0 kg.")
    else:
        passed.append(f"Quantity {lot.quantity_kg} kg is valid for APMC auction.")

    if distance_km > max_safe_distance_km:
        failed.append(
            f"Distance {distance_km} km exceeds maximum safe transit distance {max_safe_distance_km} km."
        )
    else:
        passed.append(f"APMC distance {distance_km} km is within feasible transport radius.")

    # APMC takes any grade (A, B, C or ungraded) via open auction
    passed.append(f"APMC auction accepts grade '{lot.quality_grade or 'ungraded'}'.")

    status = FeasibilityStatus.FEASIBLE if not failed else FeasibilityStatus.INFEASIBLE
    return FeasibilityCheckResult(
        status=status,
        is_feasible=(status == FeasibilityStatus.FEASIBLE),
        passed_checks=passed,
        failed_checks=failed,
        unmet_prerequisites=unmet,
    )


def evaluate_buyer_feasibility(
    lot: HarvestLotSnapshot,
    buyer_name: str,
    min_quantity_kg: Decimal,
    max_capacity_kg: Decimal,
    required_grade: Optional[str] = "A",
    distance_km: Decimal = Decimal("35"),
) -> FeasibilityCheckResult:
    """Evaluate feasibility of direct institutional buyer sale."""
    passed: List[str] = []
    failed: List[str] = []
    unmet: List[str] = []

    # Check MOQ
    if lot.quantity_kg < min_quantity_kg:
        failed.append(
            f"Lot quantity {lot.quantity_kg} kg is below buyer MOQ ({min_quantity_kg} kg) for {buyer_name}."
        )
    else:
        passed.append(f"Lot quantity {lot.quantity_kg} kg meets buyer MOQ ({min_quantity_kg} kg).")

    # Check Max Capacity
    if lot.quantity_kg > max_capacity_kg:
        failed.append(
            f"Lot quantity {lot.quantity_kg} kg exceeds buyer maximum intake quota ({max_capacity_kg} kg)."
        )
    else:
        passed.append(f"Lot quantity is within buyer intake capacity ({max_capacity_kg} kg).")

    # Check Quality Grade
    if required_grade and lot.quality_grade:
        grade_order = {"A": 3, "B": 2, "C": 1, "ungraded": 0}
        lot_val = grade_order.get(lot.quality_grade.upper(), 0)
        req_val = grade_order.get(required_grade.upper(), 3)
        if lot_val < req_val:
            failed.append(
                f"Buyer requires Grade {required_grade}, but crop lot is Grade {lot.quality_grade}."
            )
        else:
            passed.append(f"Crop lot grade '{lot.quality_grade}' meets buyer requirement (Grade {required_grade}).")
    elif required_grade and not lot.quality_grade:
        unmet.append(f"Buyer requires Grade {required_grade}. Lot is currently ungraded and requires formal sorting.")

    # Distance check
    if distance_km > Decimal("100"):
        unmet.append(f"Buyer hub is {distance_km} km away; confirmed refrigerated transit required.")
    else:
        passed.append(f"Buyer pickup/delivery radius {distance_km} km is feasible.")

    if failed:
        status = FeasibilityStatus.INFEASIBLE
    elif unmet:
        status = FeasibilityStatus.CONDITIONALLY_FEASIBLE
    else:
        status = FeasibilityStatus.FEASIBLE

    return FeasibilityCheckResult(
        status=status,
        is_feasible=(status in (FeasibilityStatus.FEASIBLE, FeasibilityStatus.CONDITIONALLY_FEASIBLE)),
        passed_checks=passed,
        failed_checks=failed,
        unmet_prerequisites=unmet,
    )


def evaluate_processing_feasibility(
    lot: HarvestLotSnapshot,
    facility_name: str,
    min_batch_kg: Decimal,
    max_batch_kg: Decimal,
    facility_operational: bool = True,
    yield_known: bool = True,
    output_buyer_identified: bool = True,
    distance_km: Decimal = Decimal("20"),
) -> FeasibilityCheckResult:
    """Evaluate feasibility of processing / value addition (e.g. Tomato Puree)."""
    passed: List[str] = []
    failed: List[str] = []
    unmet: List[str] = []
    data_gaps: List[str] = []

    if not yield_known:
        data_gaps.append("Processing conversion yield is unknown for this variety/facility.")

    if not facility_operational:
        failed.append(f"Processing facility '{facility_name}' is currently unavailable or under maintenance.")
    else:
        passed.append(f"Processing facility '{facility_name}' is operational.")

    # Capacity check
    if lot.quantity_kg < min_batch_kg:
        failed.append(
            f"Lot quantity {lot.quantity_kg} kg is below minimum processing batch size ({min_batch_kg} kg)."
        )
    elif lot.quantity_kg > max_batch_kg:
        failed.append(
            f"Lot quantity {lot.quantity_kg} kg exceeds processing facility batch capacity ({max_batch_kg} kg)."
        )
    else:
        passed.append(
            f"Quantity {lot.quantity_kg} kg fits facility capacity ({min_batch_kg}-{max_batch_kg} kg)."
        )

    # Output market check
    if not output_buyer_identified:
        unmet.append("Puree wholesale buyer not yet locked; inventory off-take risk exists.")
    else:
        passed.append("Cluster off-take wholesale buyer identified for processed puree.")

    if data_gaps:
        status = FeasibilityStatus.NEEDS_MORE_DATA
    elif failed:
        status = FeasibilityStatus.INFEASIBLE
    elif unmet:
        status = FeasibilityStatus.CONDITIONALLY_FEASIBLE
    else:
        status = FeasibilityStatus.FEASIBLE

    return FeasibilityCheckResult(
        status=status,
        is_feasible=(status in (FeasibilityStatus.FEASIBLE, FeasibilityStatus.CONDITIONALLY_FEASIBLE)),
        passed_checks=passed,
        failed_checks=failed,
        unmet_prerequisites=unmet,
        data_gaps=data_gaps,
    )


def evaluate_storage_feasibility(
    lot: HarvestLotSnapshot,
    holding_days: int,
    cold_storage_available: bool,
    max_safe_cold_days: int = 30,
    max_ambient_days: int = 4,
) -> FeasibilityCheckResult:
    """Evaluate feasibility of storage followed by later sale."""
    passed: List[str] = []
    failed: List[str] = []
    unmet: List[str] = []
    data_gaps: List[str] = []

    # Tomato perishability check
    if not cold_storage_available:
        if holding_days > max_ambient_days:
            failed.append(
                f"Perishable crop '{lot.crop_name}' cannot be held for {holding_days} days under ambient farm conditions. "
                f"Maximum safe ambient shelf-life is {max_ambient_days} days without cold chain."
            )
        else:
            unmet.append(f"Ambient short holding ({holding_days} days) carries high spoilage risk.")
    else:
        passed.append("Controlled cold storage facility (0-4°C) is verified and available.")
        if holding_days > max_safe_cold_days:
            failed.append(
                f"Holding time {holding_days} days exceeds safe cold storage limit ({max_safe_cold_days} days) for {lot.crop_name}."
            )
        else:
            passed.append(f"Holding duration of {holding_days} days is within safe cold chain limits ({max_safe_cold_days} days).")

    if failed:
        status = FeasibilityStatus.INFEASIBLE
    elif unmet:
        status = FeasibilityStatus.CONDITIONALLY_FEASIBLE
    else:
        status = FeasibilityStatus.FEASIBLE

    return FeasibilityCheckResult(
        status=status,
        is_feasible=(status in (FeasibilityStatus.FEASIBLE, FeasibilityStatus.CONDITIONALLY_FEASIBLE)),
        passed_checks=passed,
        failed_checks=failed,
        unmet_prerequisites=unmet,
        data_gaps=data_gaps,
    )


def evaluate_group_selling_feasibility(
    lot: HarvestLotSnapshot,
    group_lot_data_exists: bool,
    active_pool_quantity_kg: Optional[Decimal] = None,
    min_pool_threshold_kg: Decimal = Decimal("8000"),
) -> FeasibilityCheckResult:
    """
    Evaluate feasibility of collective group selling and shared logistics.
    Only feasible when required group-lot and logistics data exist.
    """
    passed: List[str] = []
    failed: List[str] = []
    unmet: List[str] = []
    data_gaps: List[str] = []

    if not group_lot_data_exists or active_pool_quantity_kg is None:
        data_gaps.append(
            "No active FPO/neighbor aggregation pool found in Niphad cluster for current date. "
            "Requires active group-lot registration and logistics vehicle booking data."
        )
        status = FeasibilityStatus.NEEDS_MORE_DATA
    else:
        total_combined = lot.quantity_kg + active_pool_quantity_kg
        if total_combined < min_pool_threshold_kg:
            unmet.append(
                f"Current pool ({total_combined} kg) has not reached full truckload threshold ({min_pool_threshold_kg} kg)."
            )
            status = FeasibilityStatus.CONDITIONALLY_FEASIBLE
        else:
            passed.append(
                f"Active aggregation pool confirmed: {total_combined} kg combined volume enables shared 10-tonne truck."
            )
            status = FeasibilityStatus.FEASIBLE

    return FeasibilityCheckResult(
        status=status,
        is_feasible=(status in (FeasibilityStatus.FEASIBLE, FeasibilityStatus.CONDITIONALLY_FEASIBLE)),
        passed_checks=passed,
        failed_checks=failed,
        unmet_prerequisites=unmet,
        data_gaps=data_gaps,
    )
