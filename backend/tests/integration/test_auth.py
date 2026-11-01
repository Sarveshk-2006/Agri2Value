# backend/tests/integration/test_auth.py
"""Integration tests for authentication endpoints."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_demo_login_success(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/demo-login",
        json={"phone": "9876543210", "demo_code": "123456", "full_name": "Ramesh Patil"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["role"] == "FARMER"
    assert data["demo_mode"] is True
    assert data["full_name"] == "Ramesh Patil"


@pytest.mark.asyncio
async def test_demo_login_invalid_code(client: AsyncClient):
    resp = await client.post(
        "/api/v1/auth/demo-login",
        json={"phone": "9876543210", "demo_code": "999999", "full_name": "Ramesh Patil"},
    )
    assert resp.status_code == 401
    err = resp.json()
    assert "Invalid demo code" in err.get("message", err.get("detail", ""))


@pytest.mark.asyncio
async def test_get_me_profile(client: AsyncClient, auth_headers: dict):
    resp = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["full_name"] == "Ramesh Patil"
    assert data["role"] == "FARMER"
    assert data["demo_mode"] is True


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected(client: AsyncClient):
    resp = await client.get("/api/v1/auth/me")
    assert resp.status_code == 401 or resp.status_code == 403
