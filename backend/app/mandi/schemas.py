"""
Agri2Value — Mandi Schemas.

Defines typed representations for agricultural commodity market prices,
strictly enforcing observation date vs retrieval date separation, unit normalization
validations, staleness flags, and market provenance identity.
"""
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field


class MandiRecord(BaseModel):
    """
    Standardized mandi rate record.
    
    CRITICAL CONSTRAINTS:
    - Never label fallback data as is_live.
    - Separate observation_date (APMC arrival) from retrieval_timestamp (Agri2Value ingest).
    - Normalize units ONLY when source_unit is known (e.g. Rs/Quintal -> INR/kg).
    """
    state: str
    district: str
    market: str
    commodity: str
    variety: Optional[str] = None
    observation_date: str = Field(..., description="Date of physical market yard price observation (YYYY-MM-DD or DD/MM/YYYY)")
    retrieval_timestamp: str = Field(..., description="UTC timestamp when data was ingested by Agri2Value backend")
    min_price: float = Field(..., description="Minimum recorded price in source_unit")
    max_price: float = Field(..., description="Maximum recorded price in source_unit")
    modal_price: float = Field(..., description="Modal (most frequent) price in source_unit")
    source_unit: str = Field(..., description="Unit of source prices, e.g. 'Rs/Quintal' or 'Unknown'")
    unit_normalized: bool = Field(..., description="True if normalized to standard INR/kg; False if unit ambiguous")
    normalized_unit: Optional[str] = Field(None, description="Normalized pricing unit, e.g. 'INR/kg'")
    normalized_modal_price_per_kg: Optional[Decimal] = Field(None, description="Modal price converted to INR/kg")
    is_live: bool = Field(..., description="True if fresh from upstream live API; False if cached or curated fallback")
    source_type: str = Field(..., description="'data_gov_in_api' | 'curated_mandi_bulletin'")
    data_source: str = Field(..., description="Auditable data provenance description")
    is_stale: bool = Field(False, description="True if observation date is older than acceptable threshold (e.g. 7 days)")
    staleness_warning: Optional[str] = Field(None, description="Warning explanation if data is stale")


class MandiPricesResponse(BaseModel):
    """Response containing multiple mandi records with dataset-level metadata."""
    records: List[MandiRecord]
    total_records: int
    is_live: bool
    data_source: str
    retrieved_at: str
    disclaimer: str = Field(
        default=(
            "Mandi rates reflect APMC yard auction averages and are subject to market grading, "
            "arrival volume, and daily auction dynamics. Not a binding trade commitment."
        ),
        description="Statutory market data disclaimer",
    )


class MandiQuoteRequest(BaseModel):
    """Request for a specific commodity quote to feed the Decision Engine."""
    crop_name: str = Field(..., description="Target commodity name (e.g. 'Tomato')")
    district: Optional[str] = Field("Nashik", description="Target district (default: Nashik)")
    market: Optional[str] = Field(None, description="Specific APMC market yard name (optional)")


class MandiQuoteResponse(BaseModel):
    """
    Validated single quote suitable for direct ingestion into the Profit Decision Engine.
    Preserves market identity, timestamps, and staleness status.
    """
    commodity: str
    market_name: str
    district: str
    state: str
    rate_per_kg: Decimal = Field(..., description="Normalized effective price in INR per kg")
    observation_date: str
    retrieval_date: str
    source_unit: str
    normalized_unit: str
    is_live: bool
    source_type: str
    data_source: str
    is_stale: bool
    staleness_warning: Optional[str] = None
