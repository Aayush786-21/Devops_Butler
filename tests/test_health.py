"""
Test health check endpoint
"""
import pytest
from httpx import AsyncClient
from orchestrator import app


@pytest.mark.asyncio
async def test_health_check():
    """Test that the health endpoint returns healthy status"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert data["version"] == "1.0.0"


@pytest.mark.asyncio
async def test_health_check_content_type():
    """Test that health check returns JSON content"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        assert "application/json" in response.headers["content-type"]


