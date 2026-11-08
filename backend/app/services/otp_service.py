"""
Agri2Value — Production OTP Service & Provider Abstraction.

Integrates MSG91 (Enterprise SMS Gateway for India) with fallback detection.
Never claims an OTP was delivered if credentials are missing or API fails.
"""

from abc import ABC, abstractmethod
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
import httpx
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.core.errors import AppError, ValidationError
from app.core.logging import get_logger

logger = get_logger("otp_service")
settings = get_settings()


class OTPDeliveryStatus(BaseModel):
    success: bool
    phone: str
    message: str
    request_id: Optional[str] = None
    provider: str = "MSG91"
    is_simulated: bool = False
    rate_limited: bool = False
    cooldown_seconds: int = 60


class BaseOTPProvider(ABC):
    """Abstract interface for multi-channel OTP delivery providers."""

    @abstractmethod
    async def send_otp(self, phone: str, full_name: Optional[str] = None) -> OTPDeliveryStatus:
        pass

    @abstractmethod
    async def verify_otp(self, phone: str, otp_code: str) -> bool:
        pass

    @abstractmethod
    async def retry_otp(self, phone: str, retry_type: str = "text") -> OTPDeliveryStatus:
        pass


# In-memory tracking for rate-limiting (per-phone)
_RATE_LIMIT_STORE: Dict[str, Dict[str, Any]] = {}


def _check_rate_limit(phone: str) -> Optional[int]:
    """Returns cooldown seconds remaining if rate-limited, or None if clear."""
    now = datetime.now(timezone.utc)
    entry = _RATE_LIMIT_STORE.get(phone)
    if not entry:
        return None

    last_sent: datetime = entry["last_sent"]
    count: int = entry["count"]
    first_sent: datetime = entry["first_sent"]

    # Cooldown between immediate requests (60s)
    if (now - last_sent).total_seconds() < 60:
        return int(60 - (now - last_sent).total_seconds())

    # Window of 10 minutes: max 4 OTPs
    if (now - first_sent).total_seconds() < 600:
        if count >= 4:
            return int(600 - (now - first_sent).total_seconds())
    else:
        # Reset window
        _RATE_LIMIT_STORE[phone] = {"count": 0, "first_sent": now, "last_sent": now}

    return None


def _record_otp_sent(phone: str):
    now = datetime.now(timezone.utc)
    if phone not in _RATE_LIMIT_STORE:
        _RATE_LIMIT_STORE[phone] = {"count": 1, "first_sent": now, "last_sent": now}
    else:
        _RATE_LIMIT_STORE[phone]["count"] += 1
        _RATE_LIMIT_STORE[phone]["last_sent"] = now


class MSG91OTPProvider(BaseOTPProvider):
    """
    MSG91 Production SMS Provider for Indian Agricultural Market (+91).
    Uses MSG91 SendOTP API v5.
    """

    def __init__(self):
        self.auth_key = settings.MSG91_AUTH_KEY.strip()
        self.template_id = settings.MSG91_TEMPLATE_ID.strip()
        self.sender_id = settings.MSG91_SENDER_ID.strip()
        self.base_url = settings.MSG91_BASE_URL.rstrip("/")
        self.is_configured = bool(self.auth_key and not self.auth_key.startswith("CHANGE_ME"))

    def _normalize_phone(self, phone: str) -> str:
        clean = phone.strip().lstrip("+")
        if clean.startswith("91") and len(clean) == 12:
            return clean
        if len(clean) == 10:
            return f"91{clean}"
        return clean

    async def send_otp(self, phone: str, full_name: Optional[str] = None) -> OTPDeliveryStatus:
        norm_phone = self._normalize_phone(phone)

        # 1. Check rate limits
        cooldown = _check_rate_limit(norm_phone)
        if cooldown:
            logger.warning("OTP rate limit exceeded", phone_suffix=norm_phone[-4:], cooldown=cooldown)
            return OTPDeliveryStatus(
                success=False,
                phone=norm_phone,
                message=f"Please wait {cooldown} seconds before requesting a new OTP.",
                rate_limited=True,
                cooldown_seconds=cooldown,
            )

        # 2. Check if MSG91 credentials are configured
        if not self.is_configured:
            logger.info("MSG91 unconfigured: MSG91_AUTH_KEY is not set or placeholder.")
            if settings.DEMO_MODE:
                _record_otp_sent(norm_phone)
                return OTPDeliveryStatus(
                    success=True,
                    phone=norm_phone,
                    message="[DEMO MODE] MSG91 SMS gateway unconfigured. Use configured test OTP 123456.",
                    provider="SIMULATED",
                    is_simulated=True,
                    cooldown_seconds=60,
                )
            else:
                return OTPDeliveryStatus(
                    success=False,
                    phone=norm_phone,
                    message="SMS delivery service is unconfigured. Please contact support or provide MSG91 credentials.",
                    provider="MSG91",
                    is_simulated=False,
                )

        # 3. Call MSG91 API v5
        url = f"{self.base_url}/otp"
        headers = {
            "authkey": self.auth_key,
            "content-type": "application/json",
        }
        params: Dict[str, Any] = {
            "mobile": norm_phone,
            "template_id": self.template_id,
        }
        if self.sender_id:
            params["sender"] = self.sender_id

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(url, headers=headers, params=params, json={})
                data = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}

                if res.status_code == 200 and data.get("type") == "success":
                    _record_otp_sent(norm_phone)
                    logger.info("MSG91 OTP dispatched successfully", phone_suffix=norm_phone[-4:])
                    return OTPDeliveryStatus(
                        success=True,
                        phone=norm_phone,
                        message="OTP dispatched successfully to your mobile number.",
                        request_id=data.get("request_id"),
                        provider="MSG91",
                        is_simulated=False,
                    )
                else:
                    err_msg = data.get("message") or f"MSG91 error status {res.status_code}"
                    logger.error("MSG91 send failed", error=err_msg, phone_suffix=norm_phone[-4:])
                    return OTPDeliveryStatus(
                        success=False,
                        phone=norm_phone,
                        message=f"SMS delivery failed: {err_msg}",
                        provider="MSG91",
                        is_simulated=False,
                    )
        except Exception as e:
            logger.error("MSG91 connection exception", exc=str(e), phone_suffix=norm_phone[-4:])
            return OTPDeliveryStatus(
                success=False,
                phone=norm_phone,
                message="Unable to reach SMS gateway. Please check network connection.",
                provider="MSG91",
                is_simulated=False,
            )

    async def verify_otp(self, phone: str, otp_code: str) -> bool:
        norm_phone = self._normalize_phone(phone)
        code = otp_code.strip()

        # Demo mode bypass check
        if settings.DEMO_MODE and code == settings.DEMO_OTP_CODE:
            logger.info("OTP verified via DEMO_MODE bypass code", phone_suffix=norm_phone[-4:])
            return True

        if not self.is_configured:
            logger.warning("MSG91 unconfigured for live verification", phone_suffix=norm_phone[-4:])
            return False

        # Live verification against MSG91 API v5
        url = f"{self.base_url}/otp/verify"
        headers = {"authkey": self.auth_key}
        params = {
            "mobile": norm_phone,
            "otp": code,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, headers=headers, params=params)
                data = res.json() if res.headers.get("content-type", "").startswith("application/json") else {}

                if res.status_code == 200 and data.get("type") == "success":
                    logger.info("MSG91 OTP verified successfully", phone_suffix=norm_phone[-4:])
                    return True
                else:
                    logger.warning("MSG91 verification rejected", message=data.get("message"), phone_suffix=norm_phone[-4:])
                    return False
        except Exception as e:
            logger.error("MSG91 verify exception", exc=str(e), phone_suffix=norm_phone[-4:])
            return False

    async def retry_otp(self, phone: str, retry_type: str = "text") -> OTPDeliveryStatus:
        norm_phone = self._normalize_phone(phone)

        if not self.is_configured:
            if settings.DEMO_MODE:
                return OTPDeliveryStatus(
                    success=True,
                    phone=norm_phone,
                    message="[DEMO MODE] Retry simulated. Code remains 123456.",
                    is_simulated=True,
                )
            return OTPDeliveryStatus(
                success=False,
                phone=norm_phone,
                message="SMS service unconfigured.",
                is_simulated=False,
            )

        url = f"{self.base_url}/otp/retry"
        headers = {"authkey": self.auth_key}
        params = {
            "mobile": norm_phone,
            "retrytype": retry_type,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(url, headers=headers, params=params)
                data = res.json()
                if res.status_code == 200 and data.get("type") == "success":
                    return OTPDeliveryStatus(
                        success=True,
                        phone=norm_phone,
                        message="OTP resent successfully.",
                        provider="MSG91",
                    )
                return OTPDeliveryStatus(
                    success=False,
                    phone=norm_phone,
                    message=data.get("message") or "Failed to resend OTP.",
                    provider="MSG91",
                )
        except Exception as e:
            return OTPDeliveryStatus(
                success=False,
                phone=norm_phone,
                message="Error contacting SMS service.",
                provider="MSG91",
            )


# Default Singleton Instance
otp_service = MSG91OTPProvider()
