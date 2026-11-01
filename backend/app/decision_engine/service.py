"""
Decision Engine Application Service.

Hydrates farm, crop lot, and market data, executes the deterministic engine,
and persists an immutable DecisionRun snapshot with ownership isolation.
"""
from datetime import datetime, timezone
from decimal import Decimal
import json
from typing import Any, Dict, List, Optional
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import NotFoundError, AuthorizationError, ValidationError
from app.database.models import (
    CropLot,
    CropLotEvent,
    DecisionRun,
    DecisionOption,
    Farm,
)
from app.decision_engine.models import (
    HarvestLotSnapshot,
    DecisionResult,
    CalculatedOption,
)
from app.decision_engine.engine import DecisionEngine
from app.decision_engine.schemas import (
    DecisionOptionResponse,
    DecisionRunResponse,
)


def _serialize_for_db(obj: Any) -> str:
    """Helper to dump dicts/lists to JSON text with Decimal handling."""
    def decimal_default(val: Any) -> Any:
        if isinstance(val, Decimal):
            return str(val)
        raise TypeError(f"Object of type {type(val)} is not JSON serializable")

    return json.dumps(obj, default=decimal_default)


def _format_option_response(opt_model: DecisionOption) -> DecisionOptionResponse:
    """Helper to parse a DecisionOption ORM model into DecisionOptionResponse."""
    return DecisionOptionResponse(
        id=opt_model.id,
        decision_run_id=opt_model.decision_run_id,
        route_type=opt_model.route_type,
        route_name=opt_model.route_name,
        feasibility_status=opt_model.feasibility_status,
        rank=opt_model.rank,
        is_recommended=opt_model.is_recommended,
        saleable_quantity=opt_model.saleable_quantity,
        saleable_quantity_unit=opt_model.saleable_quantity_unit,
        gross_revenue=opt_model.gross_revenue,
        total_costs=opt_model.total_costs,
        net_profit=opt_model.net_profit,
        net_profit_per_kg=opt_model.net_profit_per_kg,
        effective_realization_per_kg=opt_model.effective_realization_per_kg,
        additional_profit_vs_baseline=opt_model.additional_profit_vs_baseline,
        time_to_payment_days=opt_model.time_to_payment_days,
        cost_breakdown=json.loads(opt_model.cost_breakdown),
        feasibility_reasons=json.loads(opt_model.feasibility_reasons),
        risks_and_confidence=json.loads(opt_model.risks_and_confidence),
        explanation=opt_model.explanation,
        data_source=opt_model.data_source,
        data_timestamp=opt_model.data_timestamp,
    )


def _format_run_response(run_model: DecisionRun) -> DecisionRunResponse:
    """Helper to parse a DecisionRun ORM model with its options into DecisionRunResponse."""
    options_responses = [_format_option_response(opt) for opt in run_model.options]
    return DecisionRunResponse(
        id=run_model.id,
        crop_lot_id=run_model.crop_lot_id,
        owner_user_id=run_model.owner_user_id,
        algorithm_version=run_model.algorithm_version,
        status=run_model.status,
        recommended_option_id=run_model.recommended_option_id,
        recommended_route_type=run_model.recommended_route_type,
        recommended_net_profit=run_model.recommended_net_profit,
        baseline_net_profit=run_model.baseline_net_profit,
        additional_profit_vs_baseline=run_model.additional_profit_vs_baseline,
        input_snapshot=json.loads(run_model.input_snapshot),
        disclaimer=run_model.disclaimer,
        created_at=run_model.created_at,
        options=options_responses,
    )


async def evaluate_crop_lot_decision(
    crop_lot_id: str,
    current_user_id: str,
    scenario_preset: Optional[str] = None,
    data_source_mode: Optional[str] = "PILOT_BENCHMARK",
    custom_params: Optional[Dict[str, Any]] = None,
    db: AsyncSession = None,
) -> DecisionRunResponse:
    """
    Evaluates harvest pathways for a farmer's crop lot.
    Enforces ownership isolation, executes pure decision engine,
    and records an immutable audit snapshot with market provenance.
    """
    # 1. Fetch CropLot and ensure it belongs to authenticated user
    stmt = (
        select(CropLot)
        .options(selectinload(CropLot.farm), selectinload(CropLot.events))
        .where(CropLot.id == crop_lot_id)
    )
    result = await db.execute(stmt)
    crop_lot = result.scalar_one_or_none()

    if not crop_lot:
        raise NotFoundError("Crop lot", crop_lot_id)

    if crop_lot.owner_user_id != current_user_id:
        raise AuthorizationError("You do not have permission to evaluate this crop lot.")

    # 2. Extract input snapshot
    farm: Optional[Farm] = crop_lot.farm
    lot_snapshot = HarvestLotSnapshot(
        lot_id=crop_lot.id,
        crop_name=crop_lot.crop_name,
        variety=crop_lot.variety,
        quantity_kg=crop_lot.quantity_kg_normalized,
        quality_grade=crop_lot.quality_grade,
        harvest_date=crop_lot.harvest_date.isoformat() if crop_lot.harvest_date else None,
        farm_state=farm.state if farm else "Maharashtra",
        farm_district=farm.district if farm else "Nashik",
        farm_village=farm.village if farm else "Niphad",
        has_cold_storage_access=False,
    )

    # 3. Configure scenario overrides
    overrides: Dict[str, Any] = {}
    if scenario_preset == "MANDI_WINS":
        overrides["direct_buyer"] = {
            "offer_price_per_kg": Decimal("15.50"),
            "distance_km": Decimal("90"),
            "transport_cost_per_kg": Decimal("4.20"),
            "quality_sorting_loss_pct": Decimal("0.12"),  # 12% rejection
        }
        overrides["processing"] = {
            "facility_operational": False,
        }
    elif scenario_preset == "PROCESSING_BOTTLENECK":
        overrides["processing"] = {
            "facility_operational": False,
            "max_batch_kg": Decimal("2000"),
        }
    elif scenario_preset == "MISSING_DATA":
        overrides["processing"] = {
            "yield_known": False,
        }

    # Validate custom mandi parameters for commodity mismatch
    if custom_params and "mandi" in custom_params:
        custom_mandi = custom_params["mandi"]
        if "commodity" in custom_mandi and custom_mandi["commodity"]:
            if custom_mandi["commodity"].strip().lower() != crop_lot.crop_name.strip().lower():
                raise ValidationError(
                    f"Commodity mismatch: custom mandi parameter is for '{custom_mandi['commodity']}', "
                    f"but harvest lot is '{crop_lot.crop_name}'. Mismatched commodity rates are rejected."
                )

    # Ingest market data based on data_source_mode
    freshness_status = "DEMO"
    mandi_source_desc = "APMC Pimpalgaon Bulletin (Pilot Benchmark Archive)"
    mandi_market_name = "APMC Pimpalgaon (Nashik)"
    mandi_obs_date = "2026-11-01"
    mandi_retrieved_at = datetime.now(timezone.utc).isoformat()

    if data_source_mode == "LIVE_MANDI":
        from app.services.mandi_service import mandi_service
        try:
            quote = await mandi_service.get_verified_mandi_quote(
                crop_name=crop_lot.crop_name,
                district=farm.district if farm else "Nashik",
            )
            if "mandi" not in overrides:
                overrides["mandi"] = {}
            overrides["mandi"]["rate_per_kg"] = quote.rate_per_kg
            overrides["mandi"]["mandi_name"] = quote.market_name
            overrides["mandi"]["data_source"] = quote.data_source
            overrides["mandi"]["data_timestamp"] = f"Observed: {quote.observation_date} | Ingested: {quote.retrieval_date}"
            overrides["mandi"]["is_live"] = quote.is_live
            overrides["mandi"]["is_stale"] = quote.is_stale
            overrides["mandi"]["staleness_warning"] = quote.staleness_warning

            freshness_status = quote.freshness_status
            mandi_source_desc = quote.data_source
            mandi_market_name = quote.market_name
            mandi_obs_date = quote.observation_date
            mandi_retrieved_at = quote.retrieval_date
        except ValidationError:
            raise
        except Exception as exc:
            raise ValidationError(
                f"Reliable market data unavailable for '{crop_lot.crop_name}'. "
                f"Status: NEEDS_MORE_DATA. Error: {str(exc)}"
            )

    if custom_params:
        for k, v in custom_params.items():
            if k == "mandi" and "mandi" in overrides:
                overrides["mandi"].update(v)
            else:
                overrides[k] = v
        freshness_status = "CUSTOM"

    # 4. Run pure, deterministic DecisionEngine
    engine = DecisionEngine(sample_overrides=overrides)
    decision_result = engine.evaluate(lot_snapshot)

    # 5. Build and persist immutable database snapshot
    run_id = str(uuid.uuid4())
    all_evaluated_options: List[CalculatedOption] = (
        decision_result.ranked_feasible_options + decision_result.infeasible_options
    )

    rec_opt = decision_result.recommended_option
    baseline_opt = decision_result.baseline_mandi_option

    snapshot_data = lot_snapshot.model_dump(mode="json")
    snapshot_data.update({
        "data_source_mode": data_source_mode or "PILOT_BENCHMARK",
        "data_mode": freshness_status,
        "mandi_name": mandi_market_name,
        "price_observation_date": mandi_obs_date,
        "retrieval_timestamp": mandi_retrieved_at,
        "source": mandi_source_desc,
        "unit_conversion": "1 Quintal = 100 kg",
        "assumptions": [
            "Local tempo transport tariff: ₹0.045/kg/km",
            "APMC statutory cess: 1.05%, agent commission: 4.0%",
            "Handling loss: 2.0% during transit and yard handling"
        ]
    })

    db_run = DecisionRun(
        id=run_id,
        crop_lot_id=crop_lot.id,
        owner_user_id=current_user_id,
        algorithm_version=decision_result.algorithm_version,
        status=decision_result.status,
        recommended_option_id=rec_opt.route_name if rec_opt else None,
        recommended_route_type=rec_opt.route_type.value if rec_opt else None,
        recommended_net_profit=rec_opt.net_profit if rec_opt else None,
        baseline_net_profit=baseline_opt.net_profit if baseline_opt else None,
        additional_profit_vs_baseline=rec_opt.additional_profit_vs_baseline if rec_opt else None,
        input_snapshot=_serialize_for_db(snapshot_data),
        disclaimer=decision_result.disclaimer,
    )
    db.add(db_run)

    for opt in all_evaluated_options:
        db_opt = DecisionOption(
            id=str(uuid.uuid4()),
            decision_run_id=run_id,
            route_type=opt.route_type.value,
            route_name=opt.route_name,
            feasibility_status=opt.feasibility.status.value,
            rank=opt.rank,
            is_recommended=opt.is_recommended,
            saleable_quantity=opt.saleable_quantity,
            saleable_quantity_unit=opt.saleable_quantity_unit,
            gross_revenue=opt.gross_revenue,
            total_costs=opt.costs.total_costs,
            net_profit=opt.net_profit,
            net_profit_per_kg=opt.net_profit_per_kg,
            effective_realization_per_kg=opt.effective_realization_per_kg,
            additional_profit_vs_baseline=opt.additional_profit_vs_baseline,
            time_to_payment_days=opt.time_to_payment_days,
            cost_breakdown=_serialize_for_db(opt.costs.model_dump(mode="json")),
            feasibility_reasons=_serialize_for_db(opt.feasibility.model_dump(mode="json")),
            risks_and_confidence=_serialize_for_db(opt.risks_and_confidence),
            explanation=opt.explanation,
            data_source=opt.data_source,
        )
        db.add(db_opt)

    # 6. Update CropLot status and log event
    crop_lot.status = "ANALYZED"
    rec_text = f"Recommended: {rec_opt.route_name} (₹{rec_opt.net_profit:,.2f})" if rec_opt else "No feasible route"
    event = CropLotEvent(
        crop_lot_id=crop_lot.id,
        event_type="DECISION_EVALUATED",
        actor_user_id=current_user_id,
        description=f"Profit Decision Engine evaluation completed. {rec_text}",
    )
    db.add(event)

    await db.commit()

    # 7. Reload saved run with options for return
    stmt_reload = (
        select(DecisionRun)
        .options(selectinload(DecisionRun.options))
        .where(DecisionRun.id == run_id)
    )
    res_reload = await db.execute(stmt_reload)
    persisted_run = res_reload.scalar_one()

    return _format_run_response(persisted_run)


async def get_decision_by_id(
    decision_id: str,
    current_user_id: str,
    db: AsyncSession,
) -> DecisionRunResponse:
    """Retrieve a previously generated decision run snapshot with ownership isolation."""
    stmt = (
        select(DecisionRun)
        .options(selectinload(DecisionRun.options))
        .where(DecisionRun.id == decision_id)
    )
    result = await db.execute(stmt)
    run = result.scalar_one_or_none()

    if not run:
        raise NotFoundError("Decision run", decision_id)

    if run.owner_user_id != current_user_id:
        raise AuthorizationError("You do not have permission to view this decision run.")

    return _format_run_response(run)


async def get_lot_decisions(
    crop_lot_id: str,
    current_user_id: str,
    db: AsyncSession,
) -> List[DecisionRunResponse]:
    """Retrieve all historical decision runs for a specific crop lot."""
    # Ensure lot exists and belongs to farmer
    stmt_lot = select(CropLot).where(CropLot.id == crop_lot_id)
    res_lot = await db.execute(stmt_lot)
    lot = res_lot.scalar_one_or_none()

    if not lot:
        raise NotFoundError("Crop lot", crop_lot_id)

    if lot.owner_user_id != current_user_id:
        raise AuthorizationError("You do not have permission to view decisions for this crop lot.")

    stmt = (
        select(DecisionRun)
        .options(selectinload(DecisionRun.options))
        .where(DecisionRun.crop_lot_id == crop_lot_id)
        .order_by(DecisionRun.created_at.desc())
    )
    result = await db.execute(stmt)
    runs = result.scalars().all()

    return [_format_run_response(r) for r in runs]
