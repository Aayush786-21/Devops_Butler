# DevOps Butler Testing Guide

This document provides comprehensive information about testing DevOps Butler.

## 🎯 Test Suite Overview

DevOps Butler has a complete test suite covering both backend (Python) and frontend (JavaScript/Playwright) testing.

### Test Results

- ✅ **Backend Tests**: 11 tests passing
- ✅ **Frontend Tests**: 7 tests passing
- 📊 **Total Coverage**: Endpoints, authentication, deployments, UI, and API integration

## 🧪 Backend Tests (pytest)

### Test Files

- `tests/test_health.py` - Health check endpoint tests
- `tests/test_auth.py` - Authentication tests (registration, login)
- `tests/test_deployments.py` - Deployment endpoint tests

### Running Backend Tests

```bash
# Run all tests
source venv/bin/activate
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_health.py

# Run specific test
pytest tests/test_health.py::test_health_check

# Run with coverage report
pytest --cov=orchestrator --cov=simple_pipeline --cov=login --cov-report=html

# Run marked tests only
pytest -m unit           # Unit tests only
pytest -m integration    # Integration tests only
pytest -m slow           # Slow running tests only
```

### Test Markers

```python
@pytest.mark.unit        # Fast, isolated unit tests
@pytest.mark.integration # Integration tests requiring dependencies
@pytest.mark.slow        # Slow running tests
@pytest.mark.e2e         # End-to-end tests
```

## 🎨 Frontend Tests (Playwright)

### Test Files

- `frontend/tests/app.spec.js` - Frontend UI and API integration tests

### Running Frontend Tests

```bash
# Run all tests
cd frontend
npm test

# Run in headed mode (visible browser)
npm run test:headed

# Run in UI mode (interactive)
npm run test:ui

# Run specific test
npx playwright test app.spec.js --grep "should load the home page"

# Show last test report
npx playwright show-report

# Run tests on specific browser
npx playwright test --project=chromium
```

## 🔧 Test Configuration

### Backend Configuration (`pytest.ini`)

```ini
[pytest]
python_files = test_*.py *_test.py
python_classes = Test*
python_functions = test_*
testpaths = tests
asyncio_mode = auto
addopts = -v --tb=short --strict-markers --disable-warnings
```

### Frontend Configuration (`playwright.config.js`)

- Browser: Chromium
- Base URL: http://localhost:8000
- Auto-starts server if not running
- Test directory: `frontend/tests`
- Reporter: HTML report

## 📝 Writing New Tests

### Backend Test Example

```python
import pytest
from httpx import AsyncClient
from orchestrator import app

@pytest.mark.asyncio
async def test_my_endpoint():
    """Test description"""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.get("/my-endpoint")
        assert response.status_code == 200
        data = response.json()
        assert "expected_key" in data
```

### Frontend Test Example

```javascript
import { test, expect } from '@playwright/test';

test('my feature', async ({ page }) => {
  await page.goto('/');
  
  // Your test code
  await expect(page.locator('h1')).toHaveText('Expected Text');
});
```

## 🎯 Current Test Coverage

### Backend Coverage

✅ **Health Check**
- Returns healthy status
- Returns JSON format
- Includes timestamp and version

✅ **Authentication**
- User registration with valid credentials
- Login with valid credentials
- Invalid login credentials rejected
- Registration accepts various inputs

✅ **Deployments**
- Requires authentication
- Returns proper error codes
- Validates URL format

### Frontend Coverage

✅ **Pages**
- Home page loads correctly
- Login page accessible
- Applications page loads
- Proper meta tags

✅ **UI Elements**
- Login link/button present
- Proper viewport configuration
- Static assets load correctly

✅ **API Integration**
- Health check endpoint returns 200
- CSS and JS files load properly

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: '3.13'
      - run: pip install -r requirements.txt
      - run: pytest

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd frontend && npm install
      - run: cd frontend && npm test
```

## 📊 Test Reports

### Generate HTML Coverage Report

```bash
# Backend coverage
pytest --cov=orchestrator --cov=simple_pipeline --cov-report=html
open htmlcov/index.html

# Frontend report
cd frontend
npm test
npx playwright show-report
```

## 🐛 Debugging Tests

### Backend Debugging

```bash
# Run with extra output
pytest -vvv --tb=long

# Stop on first failure
pytest -x

# Drop into debugger on failure
pytest --pdb
```

### Frontend Debugging

```bash
# Run in headed mode
cd frontend
npm run test:headed

# Run in debug mode
npx playwright test --debug

# Generate trace
npx playwright test --trace on
```

## 📦 Test Dependencies

### Backend
- pytest==8.4.2
- pytest-asyncio==1.2.0
- pytest-cov==7.0.0
- httpx==0.27.0

### Frontend
- @playwright/test==^1.56.1

All dependencies are listed in `requirements.txt` and `frontend/package.json`.

## 🔍 Best Practices

1. **Write descriptive test names** that explain what is being tested
2. **Keep tests isolated** - each test should be independent
3. **Use fixtures** for common setup and teardown
4. **Test edge cases** and error conditions
5. **Keep tests fast** - mark slow tests appropriately
6. **Use appropriate markers** to categorize tests
7. **Write tests before fixing bugs** (TDD)
8. **Maintain high coverage** for critical paths

## 📚 Additional Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Playwright Documentation](https://playwright.dev/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

## 🎉 Current Status

✅ Test suite is fully functional
✅ All tests passing
✅ Coverage includes critical paths
✅ Both backend and frontend covered
✅ Ready for CI/CD integration

---

For questions or contributions to the test suite, please refer to the main project README or open an issue.

