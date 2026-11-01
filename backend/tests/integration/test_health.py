# backend/tests/integration/test_health.py
"""Integration test for API health endpoint."""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_endpoint(client: AsyncClient):
    response = await client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert data["app"] == "Agri2Value"
    assert data["version"] == "0.1.0"
    assert "demo_mode" in data
