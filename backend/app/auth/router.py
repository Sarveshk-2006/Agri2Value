# backend/app/auth/router.py
"""
Authentication endpoints.

POST /auth/demo-login  — Create or retrieve a farmer account with demo OTP.
GET  /auth/me          — Return the authenticated user profile.
POST /auth/refresh     — Exchange a refresh token for a new access token.

IMPORTANT: Demo login does NOT send a real OTP.
It accepts any phone number with the configured DEMO_OTP_CODE.
This is clearly documented and labelled in responses.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.auth.schemas import (
    DemoLoginRequest,
    SendOTPRequest,
    VerifyOTPRequest,
    RefreshRequest,
    TokenResponse,
    UserMeResponse,
    UpdateLanguageRequest,
)
from app.auth.dependencies import get_current_user
from app.core.config import get_settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.core.logging import get_logger
from app.database.base import get_db
from app.database.models import User
from app.services.otp_service import otp_service, OTPDeliveryStatus

settings = get_settings()
logger = get_logger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/send-otp",
    response_model=OTPDeliveryStatus,
    summary="Send Mobile Verification OTP via MSG91",
    description="Dispatches a 6-digit OTP to the Indian mobile number using MSG91 SMS gateway.",
)
async def send_otp(payload: SendOTPRequest) -> OTPDeliveryStatus:
    status_result = await otp_service.send_otp(payload.phone, payload.full_name)
    if not status_result.success and not status_result.rate_limited:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=status_result.message,
        )
    return status_result


@router.post(
    "/verify-otp",
    response_model=TokenResponse,
    summary="Verify Mobile OTP & Issue Session Tokens",
    description="Verifies the submitted 6-digit OTP via MSG91, locates or creates the user in PostgreSQL, and returns authenticated JWT tokens.",
)
async def verify_otp(
    payload: VerifyOTPRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    # 1. Verify code via MSG91 service (or demo bypass)
    is_valid = await otp_service.verify_otp(payload.phone, payload.otp_code)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired verification code. Please check and try again.",
        )

    # 2. Normalize phone
    phone = payload.phone.strip().lstrip("+")
    if phone.startswith("91") and len(phone) == 12:
        phone = phone[2:]

    # 3. Find or create user
    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            full_name=payload.full_name.strip() or "Farmer",
            phone=phone,
            role="FARMER",
            preferred_language="en",
            is_active=True,
        )
        db.add(user)
        await db.flush()
        logger.info("Live OTP login: new farmer created", user_id=user.id)
    else:
        logger.info("Live OTP login: existing farmer authenticated", user_id=user.id)

    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id, role=user.role)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        demo_mode=settings.DEMO_MODE,
        user_id=user.id,
        full_name=user.full_name,
        role=user.role,
        warning="Verified Session via MSG91 SMS gateway." if not settings.DEMO_MODE else "Demo mode session.",
    )


@router.post(
    "/demo-login",
    response_model=TokenResponse,
    summary="Demo Login (Development Only)",
    description=(
        "**DEMO AUTHENTICATION — NOT FOR PRODUCTION USE**\n\n"
        "Accepts any phone number with the configured demo OTP code. "
        "Creates the user account if it does not exist. "
        "Issues JWT access and refresh tokens.\n\n"
        "No real SMS is sent. No real identity is verified."
    ),
)
async def demo_login(
    payload: DemoLoginRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    # Guard: strictly disable demo login in production environments
    if settings.APP_ENV == "production":
        logger.warning("Attempted demo login in production environment - access denied", phone_suffix=payload.phone[-4:] if payload.phone else "")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Demo login is strictly disabled in production. Use the mobile OTP verification endpoint.",
        )

    # Validate demo OTP code — intentionally simple for demonstration
    if payload.demo_code != settings.DEMO_OTP_CODE:
        # Log failure without logging the submitted code
        logger.warning("Demo login: invalid code", phone_suffix=payload.phone[-4:])
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid demo code. Use the configured DEMO_OTP_CODE.",
        )

    # Normalize phone number
    phone = payload.phone.strip().lstrip("+")
    if phone.startswith("91") and len(phone) == 12:
        phone = phone[2:]  # strip country code for storage
    if not phone.isdigit() or len(phone) not in (10, 12, 15):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide a valid 10-digit Indian mobile number.",
        )

    # Find or create user
    result = await db.execute(select(User).where(User.phone == phone))
    user = result.scalar_one_or_none()

    if user is None:
        user = User(
            full_name=payload.full_name.strip(),
            phone=phone,
            role="FARMER",
            preferred_language="en",
            is_active=True,
        )
        db.add(user)
        await db.flush()  # Populate user.id before creating tokens
        logger.info("Demo login: new user created", user_id=user.id)
    else:
        logger.info("Demo login: existing user", user_id=user.id)

    # Issue tokens
    access_token = create_access_token(subject=user.id, role=user.role)
    refresh_token = create_refresh_token(subject=user.id, role=user.role)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        demo_mode=True,
        user_id=user.id,
        full_name=user.full_name,
        role=user.role,
    )


@router.get(
    "/me",
    response_model=UserMeResponse,
    summary="Get Authenticated User Profile",
)
async def get_me(
    current_user: User = Depends(get_current_user),
) -> UserMeResponse:
    return UserMeResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role,
        preferred_language=current_user.preferred_language,
        is_active=current_user.is_active,
        demo_mode=settings.DEMO_MODE,
    )


@router.patch(
    "/me/language",
    response_model=UserMeResponse,
    summary="Update User Preferred Language",
)
async def update_language(
    payload: UpdateLanguageRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserMeResponse:
    current_user.preferred_language = payload.preferred_language.strip().lower()
    await db.commit()
    await db.refresh(current_user)
    return UserMeResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        phone=current_user.phone,
        role=current_user.role,
        preferred_language=current_user.preferred_language,
        is_active=current_user.is_active,
        demo_mode=settings.DEMO_MODE,
    )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh Access Token",
)
async def refresh_token(
    payload: RefreshRequest,
    db: AsyncSession = Depends(get_db),
) -> TokenResponse:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token.",
    )
    try:
        token_data = decode_token(payload.refresh_token)
        if token_data.get("type") != "refresh":
            raise credentials_exception
        user_id = token_data.get("sub")
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise credentials_exception

    access_token = create_access_token(subject=user.id, role=user.role)
    new_refresh_token = create_refresh_token(subject=user.id, role=user.role)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        demo_mode=settings.DEMO_MODE,
        user_id=user.id,
        full_name=user.full_name,
        role=user.role,
    )
