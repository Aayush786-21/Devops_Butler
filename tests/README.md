# DevOps Butler Test Suite

This directory contains tests for the DevOps Butler project.

## Test Structure

- `test_health.py` - Health check endpoint tests
- `test_auth.py` - Authentication endpoint tests  
- `test_deployments.py` - Deployment endpoint tests
- `unit/` - Unit tests for individual components
- `integration/` - Integration tests requiring full stack

## Running Tests

### Run all tests
```bash
pytest
```

### Run with coverage
```bash
pytest --cov=orchestrator --cov=simple_pipeline --cov=login
```

### Run specific test file
```bash
pytest tests/test_health.py
```

### Run specific test
```bash
pytest tests/test_health.py::test_health_check
```

### Run marked tests only
```bash
pytest -m unit
pytest -m integration
```

## Test Markers

- `@pytest.mark.unit` - Unit tests (fast, isolated)
- `@pytest.mark.integration` - Integration tests (slower, requires dependencies)
- `@pytest.mark.slow` - Slow running tests
- `@pytest.mark.e2e` - End-to-end tests

## Frontend Tests

Frontend tests using Playwright are located in `frontend/tests/`

Run frontend tests:
```bash
cd frontend
npm test
```

Run with UI mode:
```bash
cd frontend
npm run test:ui
```

