# backend/tests/unit/test_security.py
"""Unit tests for core security, token issuance and password hashing."""
import pytest
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_hashing():
    pwd = "secretFarmerPassword123!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("wrongPassword", hashed) is False


def test_jwt_access_token_creation_and_decoding():
    user_id = "test-uuid-12345"
    token = create_access_token(subject=user_id, role="FARMER")
    assert isinstance(token, str)

    payload = decode_token(token)
    assert payload["sub"] == user_id
    assert payload["role"] == "FARMER"
    assert payload["type"] == "access"
    assert "exp" in payload


def test_jwt_refresh_token_creation():
    user_id = "test-uuid-refresh"
    token = create_refresh_token(subject=user_id, role="FARMER")
    payload = decode_token(token)
    assert payload["sub"] == user_id
    assert payload["type"] == "refresh"
