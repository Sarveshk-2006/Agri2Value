"""
Agri2Value — Mandi Service (Alias & Re-export).
Canonical service implementation resides in app.services.mandi_service.
"""
from app.services.mandi_service import (
    mandi_service,
    MandiService,
    MarketPriceItem,
    MarketPricesListResponse,
    MandiQuoteResponse,
    check_staleness,
    parse_observation_date,
    normalize_mandi_item,
    CURATED_BENCHMARK_RECORDS,
)

# Backward-compatibility alias for normalize_record
normalize_record = normalize_mandi_item

__all__ = [
    "mandi_service",
    "MandiService",
    "MarketPriceItem",
    "MarketPricesListResponse",
    "MandiQuoteResponse",
    "check_staleness",
    "parse_observation_date",
    "normalize_mandi_item",
    "normalize_record",
    "CURATED_BENCHMARK_RECORDS",
]
