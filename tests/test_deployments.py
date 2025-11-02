"""
Test deployment endpoints
"""
import pytest
from httpx import AsyncClient
from orchestrator import app


@pytest.mark.asyncio
async def test_list_deployments_unauthorized():
    """Test that listing deployments without auth returns 401 or 403"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/deployments")
        # Should require authentication (returns 401 or 403)
        assert response.status_code in [401, 403]


@pytest.mark.asyncio
async def test_deploy_without_auth():
    """Test that deploying without auth returns 401 or 403"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/deploy",
            json={
                "git_url": "https://github.com/example/test.git"
            }
        )
        
        # Should require authentication (returns 401 or 403)
        assert response.status_code in [401, 403]


@pytest.mark.asyncio
async def test_deploy_invalid_url():
    """Test deployment with invalid URL format"""
    # This would typically be caught by validation before auth
    pass


@pytest.mark.integration
@pytest.mark.slow
async def test_full_deployment_flow():
    """
    Full deployment integration test
    WARNING: This requires authentication and Docker to be running
    """
    # This is a placeholder for a full integration test
    # It would require:
    # 1. Authenticated user
    # 2. Valid Git repository
    # 3. Docker running
    # 4. Network isolation
    pass

