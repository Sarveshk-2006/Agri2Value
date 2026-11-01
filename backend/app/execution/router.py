"""
Agri2Value — Smart Execution Network & Crop Rescue API Router.

Endpoints for:
- Discovering buyers, transport, cold storage, and processing infrastructure.
- Submitting and tracking execution requests with explicit status transitions.
- Recording post-execution realizations (actual revenue and expenses).
- Evaluating and triggering Crop Rescue Mode for at-risk harvest lots.
"""
from decimal import Decimal
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.database.base import get_db
from app.database.models import User
from app.execution.schemas import (
    BuyerResponse,
    BuyerOfferResponse,
    LogisticsProviderResponse,
    ColdStorageFacilityResponse,
    ProcessingFacilityResponse,
    ExecutionRequestCreate,
    ExecutionRequestResponse,
    ExecutionStatusTransitionRequest,
    ExecutionRequestCompleteRequest,
    CropRescueAssessment,
)
from app.execution.service import execution_service
from app.execution.crop_rescue_service import crop_rescue_service

execution_router = APIRouter(prefix="/execution", tags=["Smart Execution Network"])
crop_rescue_router = APIRouter(prefix="/crop-rescue", tags=["Crop Rescue Mode"])


# ---- Buyer Endpoints --------------------------------------------

@execution_router.get(
    "/buyers",
    response_model=List[BuyerResponse],
    summary="Discover Verified and Demo Agricultural Buyers",
)
async def list_buyers(
    commodity: Optional[str] = Query(None, description="Filter by crop (e.g. Tomato, Onion)"),
    district: Optional[str] = Query(None, description="Filter by district (e.g. Nashik, Pune)"),
    buyer_type: Optional[str] = Query(None, description="Filter by type (DIRECT_RETAIL, WHOLESALER, etc.)"),
    verified_only: bool = Query(False, description="Filter only genuine verified buyers"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    buyers = await execution_service.get_buyers(
        db=db,
        commodity=commodity,
        district=district,
        buyer_type=buyer_type,
        verified_only=verified_only,
    )
    return buyers


@execution_router.get(
    "/buyer-offers",
    response_model=List[BuyerOfferResponse],
    summary="List Open Commercial Purchase Demands",
)
async def list_buyer_offers(
    commodity: Optional[str] = Query(None, description="Filter by crop"),
    district: Optional[str] = Query(None, description="Filter by buyer district"),
    grade: Optional[str] = Query(None, description="Filter by grade acceptance (e.g. A, B)"),
    status: str = Query("OPEN", description="Offer status (OPEN, FULFILLED, etc.)"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await execution_service.get_buyer_offers(
        db=db,
        commodity=commodity,
        district=district,
        grade=grade,
        status=status,
    )


# ---- Infrastructure Endpoints -----------------------------------

@execution_router.get(
    "/logistics",
    response_model=List[LogisticsProviderResponse],
    summary="Find Transport and Agricultural Freight Providers",
)
async def list_logistics_providers(
    district: Optional[str] = Query(None, description="Operating district"),
    min_capacity_kg: Optional[Decimal] = Query(None, description="Minimum payload capacity in kg"),
    temperature_controlled: Optional[bool] = Query(None, description="Reefer van / chilled transport"),
    available_only: bool = Query(False, description="Filter currently available fleet only"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await execution_service.get_logistics_providers(
        db=db,
        district=district,
        min_capacity_kg=min_capacity_kg,
        temperature_controlled=temperature_controlled,
        available_only=available_only,
    )


@execution_router.get(
    "/cold-storage",
    response_model=List[ColdStorageFacilityResponse],
    summary="Locate Cold Storage Hubs and Chilling Facilities",
)
async def list_cold_storage_facilities(
    district: Optional[str] = Query(None, description="Facility district"),
    commodity: Optional[str] = Query(None, description="Crop compatibility"),
    min_capacity_kg: Optional[Decimal] = Query(None, description="Minimum available storage capacity"),
    available_only: bool = Query(False, description="Exclude full warehouses"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await execution_service.get_cold_storage_facilities(
        db=db,
        district=district,
        commodity=commodity,
        min_capacity_kg=min_capacity_kg,
        available_only=available_only,
    )


@execution_router.get(
    "/processing",
    response_model=List[ProcessingFacilityResponse],
    summary="Discover Food Processing and Puree/Pulping Units",
)
async def list_processing_facilities(
    commodity: Optional[str] = Query(None, description="Input crop accepted"),
    district: Optional[str] = Query(None, description="Facility district"),
    facility_type: Optional[str] = Query(None, description="Processing technology type"),
    available_only: bool = Query(False, description="Exclude units under maintenance"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await execution_service.get_processing_facilities(
        db=db,
        commodity=commodity,
        district=district,
        facility_type=facility_type,
        available_only=available_only,
    )


# ---- Execution Request Workflows --------------------------------

@execution_router.post(
    "/requests",
    response_model=ExecutionRequestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Initiate Execution Request from Decision Option or Crop Lot",
)
async def create_execution_request(
    payload: ExecutionRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await execution_service.create_execution_request(
        payload=payload,
        farmer_user_id=current_user.id,
        db=db,
    )


@execution_router.get(
    "/requests",
    response_model=List[ExecutionRequestResponse],
    summary="List Authenticated Farmer's Execution Orders",
)
async def list_execution_requests(
    status: Optional[str] = Query(None, description="Filter by lifecycle status"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await execution_service.get_user_execution_requests(
        user_id=current_user.id,
        db=db,
        status=status,
    )


@execution_router.get(
    "/requests/{request_id}",
    response_model=ExecutionRequestResponse,
    summary="Get Execution Request Details and Complete Audit Timeline",
)
async def get_execution_request(
    request_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await execution_service.get_execution_request_by_id(
        request_id=request_id,
        user_id=current_user.id,
        db=db,
    )


@execution_router.post(
    "/requests/{request_id}/transition",
    response_model=ExecutionRequestResponse,
    summary="Advance Execution Lifecycle State (Accept, Confirm, Dispatch, Cancel)",
)
async def transition_execution_status(
    request_id: str,
    payload: ExecutionStatusTransitionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await execution_service.transition_execution_status(
        request_id=request_id,
        transition=payload,
        actor_user_id=current_user.id,
        actor_role=current_user.role,
        db=db,
    )


@execution_router.post(
    "/requests/{request_id}/complete",
    response_model=ExecutionRequestResponse,
    summary="Record Post-Execution Realization and Settlement Details",
)
async def complete_execution_request(
    request_id: str,
    payload: ExecutionRequestCompleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await execution_service.complete_execution_request(
        request_id=request_id,
        completion=payload,
        actor_user_id=current_user.id,
        db=db,
    )


# ---- Crop Rescue Mode Endpoints ---------------------------------

@crop_rescue_router.get(
    "/lot/{crop_lot_id}",
    response_model=CropRescueAssessment,
    summary="Evaluate Crop Lot Emergency Risks & Compute Rescue Plan",
)
async def assess_crop_rescue(
    crop_lot_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await crop_rescue_service.assess_lot_for_rescue(
        crop_lot_id=crop_lot_id,
        farmer_user_id=current_user.id,
        db=db,
    )
