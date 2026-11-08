# backend/app/ai_advisor/schemas.py
from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class AIAdvisorRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="Farmer query or agronomy question")
    crop_lot_id: Optional[str] = Field(None, description="Optional Crop Lot UUID for tailored harvest context")
    farm_id: Optional[str] = Field(None, description="Optional Farm UUID for micro-climate context")
    language: Optional[str] = Field("en", description="Preferred response language (en, mr, hi, etc.)")


class SuggestedAction(BaseModel):
    label: str
    route: str


class AIAdvisorResponseSchema(BaseModel):
    answer: str
    provider: str
    is_ai_generated: bool
    model_name: str
    confidence_score: float
    suggested_actions: List[SuggestedAction]
    disclaimer: str

