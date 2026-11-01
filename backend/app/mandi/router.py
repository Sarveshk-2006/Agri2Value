"""
Agri2Value — Mandi API Router.

Exposes endpoints for querying verified APMC mandi prices and obtaining decision-grade quotes.
"""
from typing import Optional
from fastapi import APIRouter, Query

from app.mandi.schemas import (
    MandiPricesResponse,
    MandiQuoteResponse,
)
from app.mandi.service import mandi_service

router = APIRouter(prefix="/mandi", tags=["Mandi"])


@router.get(
    "/prices",
    response_model=MandiPricesResponse,
    summary="Get Mandi Rates",
    description=(
        "Retrieves agricultural mandi prices for Maharashtra APMCs. "
        "Separates observation date from retrieval date. Strictly labels data as live only "
        "when fetched fresh from Data.gov.in."
    ),
)
async def get_mandi_prices(
    state: str = Query("Maharashtra", description="State filter (default: Maharashtra)"),
    commodity: Optional[str] = Query(None, description="Commodity filter (e.g. Tomato, Onion)"),
    force_refresh: bool = Query(False, description="Bypass cache and force refresh"),
) -> MandiPricesResponse:
    return await mandi_service.get_mandi_prices(
        state=state,
        commodity=commodity,
        force_refresh=force_refresh,
    )


@router.get(
    "/quote",
    response_model=MandiQuoteResponse,
    summary="Get Verified Mandi Quote for Decision Engine",
    description=(
        "Obtains a validated single commodity price quote for decision analysis. "
        "Guarantees unit normalization to INR/kg, checks staleness, and strictly prevents "
        "commodity substitution."
    ),
)
async def get_mandi_quote(
    crop_name: str = Query(..., description="Crop commodity name (e.g. 'Tomato')"),
    district: str = Query("Nashik", description="Target district"),
    market: Optional[str] = Query(None, description="Specific market name (optional)"),
) -> MandiQuoteResponse:
    return await mandi_service.get_verified_mandi_quote(
        crop_name=crop_name,
        district=district,
        market=market,
    )
