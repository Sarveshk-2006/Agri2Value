# backend/app/auth/schemas.py
"""
Pydantic schemas for authentication endpoints.
"""
from pydantic import BaseModel, Field


class DemoLoginRequest(BaseModel):
    phone: str = Field(
        ...,
        description="Mobile phone number in E.164 format or 10-digit Indian mobile number.",
        examples=["+919876543210", "9876543210"],
        min_length=10,
        max_length=15,
    )
    demo_code: str = Field(
        ...,
        description=(
            "Demo OTP code. In this demo authentication mode, any valid phone number "
            "combined with the configured demo code will be accepted. "
            "THIS IS NOT REAL OTP VERIFICATION."
        ),
        min_length=6,
        max_length=6,
        examples=["123456"],
    )
    full_name: str = Field(
        ...,
        description="Farmer's full name for account creation if new.",
        min_length=2,
        max_length=200,
        examples=["Rajesh Patil"],
    )


class SendOTPRequest(BaseModel):
    phone: str = Field(
        ...,
        description="10-digit Indian mobile number or with +91 country prefix.",
        examples=["9876543210", "+919876543210"],
        min_length=10,
        max_length=15,
    )
    full_name: str = Field(
        default="Farmer",
        description="Full name of the user for greeting or profile setup.",
        max_length=200,
    )


class VerifyOTPRequest(BaseModel):
    phone: str = Field(
        ...,
        description="10-digit Indian mobile number.",
        min_length=10,
        max_length=15,
    )
    otp_code: str = Field(
        ...,
        description="6-digit verification code delivered via MSG91 SMS.",
        min_length=6,
        max_length=6,
        examples=["123456"],
    )
    full_name: str = Field(
        default="Farmer",
        description="Full name for profile creation if first-time user.",
        max_length=200,
    )


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    demo_mode: bool
    user_id: str
    full_name: str
    role: str
    warning: str = (
        "DEMO AUTHENTICATION ACTIVE: This token was issued by a demo login system. "
        "No real OTP was sent. Do not use this in a production deployment."
    )


class RefreshRequest(BaseModel):
    refresh_token: str


class UpdateLanguageRequest(BaseModel):
    preferred_language: str = Field(
        ...,
        max_length=10,
        examples=["en", "hi", "mr", "te", "ta", "kn", "gu", "pa", "bn", "ml"]
    )


class UserMeResponse(BaseModel):
    id: str
    full_name: str
    phone: str
    role: str
    preferred_language: str
    is_active: bool
    demo_mode: bool
