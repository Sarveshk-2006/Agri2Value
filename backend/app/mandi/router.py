"""
Agri2Value — Market Prices & Mandi API Router.

Exposes endpoints for querying verified APMC mandi prices and obtaining decision-grade quotes.
Serves:
- GET /api/v1/market-prices
- GET /api/v1/mandi/prices
- GET /api/v1/mandi/quote
"""
from typing import Optional
from fastapi import APIRouter, Query

from app.services.mandi_service import (
    mandi_service,
    MarketPricesListResponse,
    MandiQuoteResponse,
)

# Router for /api/v1/market-prices
market_prices_router = APIRouter(tags=["Market Prices"])

# Router for /api/v1/mandi/*
mandi_router = APIRouter(prefix="/mandi", tags=["Mandi"])


@market_prices_router.get(
    "/market-prices",
    response_model=MarketPricesListResponse,
    summary="Get Agricultural Market Prices",
    description=(
        "Retrieves agricultural commodity prices across Maharashtra APMC mandis. "
        "Supports filtering by commodity, state, district, market, and date. "
        "Provides normalized INR/kg rates, arrival volumes, observation vs retrieval timestamps, "
        "and explicit freshness status (LIVE, CACHED, or DEMO)."
    ),
)
async def get_market_prices(
    commodity: Optional[str] = Query(None, description="Commodity filter (e.g. Tomato, Onion)"),
    state: str = Query("Maharashtra", description="State filter (default: Maharashtra)"),
    district: Optional[str] = Query(None, description="District filter (e.g. Nashik, Pune)"),
    market: Optional[str] = Query(None, description="Market name (e.g. Pimpalgaon, Lasalgaon)"),
    date: Optional[str] = Query(None, description="Observation date filter (YYYY-MM-DD)"),
    force_refresh: bool = Query(False, description="Bypass cache and force upstream refresh"),
) -> MarketPricesListResponse:
    return await mandi_service.get_market_prices(
        commodity=commodity,
        state=state,
        district=district,
        market=market,
        date=date,
        force_refresh=force_refresh,
    )


@mandi_router.get(
    "/prices",
    response_model=MarketPricesListResponse,
    summary="Get Mandi Rates (Legacy Alias)",
    description="Alias for /market-prices.",
)
async def get_mandi_prices_alias(
    commodity: Optional[str] = Query(None, description="Commodity filter (e.g. Tomato, Onion)"),
    state: str = Query("Maharashtra", description="State filter (default: Maharashtra)"),
    district: Optional[str] = Query(None, description="District filter (e.g. Nashik, Pune)"),
    market: Optional[str] = Query(None, description="Market name (e.g. Pimpalgaon, Lasalgaon)"),
    date: Optional[str] = Query(None, description="Observation date filter (YYYY-MM-DD)"),
    force_refresh: bool = Query(False, description="Bypass cache and force upstream refresh"),
) -> MarketPricesListResponse:
    return await mandi_service.get_market_prices(
        commodity=commodity,
        state=state,
        district=district,
        market=market,
        date=date,
        force_refresh=force_refresh,
    )


@mandi_router.get(
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
