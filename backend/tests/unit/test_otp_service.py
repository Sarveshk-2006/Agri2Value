"""
Unit tests for MSG91 OTP Provider and rate-limiting service.
"""
import pytest
from app.services.otp_service import MSG91OTPProvider, _check_rate_limit, _record_otp_sent, _RATE_LIMIT_STORE
from app.core.config import get_settings

settings = get_settings()

def test_msg91_phone_normalization():
    provider = MSG91OTPProvider()
    assert provider._normalize_phone("9876543210") == "919876543210"
    assert provider._normalize_phone("+919876543210") == "919876543210"
    assert provider._normalize_phone("919876543210") == "919876543210"

@pytest.mark.asyncio
async def test_msg91_unconfigured_demo_mode():
    provider = MSG91OTPProvider()
    provider.is_configured = False
    
    # In demo mode, it should be marked as simulated and not claim real delivery
    status = await provider.send_otp("9876543210", "Ramesh")
    assert status.success is True
    assert status.is_simulated is True
    assert "DEMO MODE" in status.message

@pytest.mark.asyncio
async def test_msg91_rate_limiting():
    phone = "919999999999"
    _RATE_LIMIT_STORE.pop(phone, None)

    # First send should succeed
    cooldown = _check_rate_limit(phone)
    assert cooldown is None

    _record_otp_sent(phone)

    # Immediate second check should enforce 60s cooldown
    cooldown2 = _check_rate_limit(phone)
    assert cooldown2 is not None
    assert cooldown2 <= 60
