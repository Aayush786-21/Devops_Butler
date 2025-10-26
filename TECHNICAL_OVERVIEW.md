# DevOps Butler - Technical Architecture Overview

## System Architecture

DevOps Butler is a **containerized deployment automation platform** built with Python/FastAPI backend and vanilla JavaScript frontend. It automates the deployment of Git repositories as Docker containers with intelligent project detection and port management.

---

## Core Technology Stack

### Backend
- **Framework**: FastAPI (Python async web framework)
- **Database**: SQLite with SQLModel ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Real-time**: WebSocket connections for live deployment logs
- **Containerization**: Docker & Docker Compose
- **Process Management**: Python subprocess/asyncio

### Frontend
- **Build Tool**: Vite (modern frontend build system)
- **Core**: Vanilla JavaScript (ES6+ modules)
- **Styling**: CSS3 with CSS Variables
- **Animations**: AOS (Animate On Scroll) library
- **Communication**: Fetch API, WebSocket API

### Infrastructure
- **Container Network**: Custom Docker network (`devops-butler-net`)
- **Port Management**: Dynamic port discovery and mapping
- **File System**: Temporary directories for repository cloning

---

## System Components

### 1. Orchestrator (`orchestrator.py`)
**Purpose**: Main FastAPI application server - entry point and API gateway

**Key Responsibilities**:
- HTTP API endpoints (REST + WebSocket)
- Authentication & authorization (JWT-based)
- Request routing and static file serving
- Deployment orchestration coordination
- User session management

**Key Endpoints**:
```
GET  /                          - Main dashboard (HTML)
GET  /login                     - Login page
GET  /applications              - Applications dashboard
POST /deploy                    - Deploy Git repository
GET  /deployments               - List user deployments
DELETE /deployments/{name}      - Destroy deployment
GET  /ws/{client_id}            - WebSocket for live logs
POST /api/auth/login            - User authentication
POST /api/auth/register         - User registration
```

### 2. Deployment Pipeline (`simple_pipeline.py`)
**Purpose**: Core deployment logic - analyzes repos and deploys containers

**Deployment Strategies** (in priority order):
1. **Docker Compose** - Multi-service applications
2. **Dockerfile** - Single container with existing Dockerfile
3. **Node.js/Next.js** - Auto-generates Dockerfile for Node projects
4. **Static Websites** - Python HTTP server wrapper
5. **Framework-specific** - Django, Flask, React, etc.

**Pipeline Flow**:
```
1. Validate Git URL
2. Clone repository to temp directory
3. Detect project type (compose, dockerfile, node, etc.)
4. Clean up conflicting containers/networks
5. Build Docker image (with caching)
6. Start container with port mapping
7. Detect running port from logs/inspection
8. Return accessible URL
9. Store deployment record in database
```

**Key Functions**:
- `run_deployment_pipeline()` - Main orchestrator
- `handle_docker_compose_deployment()` - Multi-service deployments
- `handle_dockerfile_deployment()` - Single container deployments
- `detect_running_port()` - Port discovery from logs/container inspection
- `destroy_deployment()` - Cleanup containers and resources

### 3. Docker Build (`docker_build.py`)
**Purpose**: Docker image building with intelligent caching

**Features**:
- Content-based hashing (Dockerfile + dependencies)
- Image reuse detection to avoid rebuilds
- Build optimization with layer caching
- Multi-stage build support

**Process**:
1. Calculate hash of Dockerfile + dependency files
2. Check for existing image with same hash
3. Build new image if needed (`local-registry/{repo}:{hash}`)
4. Clean up old unused images

### 4. Docker Run (`docker_run.py`)
**Purpose**: Container lifecycle management

**Features**:
- Custom Docker network management (`devops-butler-net`)
- Port mapping (host:container)
- Container cleanup before redeployment
- Idempotent operations (safe to retry)

**Process**:
1. Ensure Docker network exists
2. Stop existing container (if present)
3. Remove existing container (if present)
4. Run new container with network + port mapping

### 5. Database Layer (`database.py`, `login.py`)
**Purpose**: Data persistence with SQLModel ORM

**Models**:
- **User**: Authentication, email, password hash, GitHub token
- **Deployment**: Container name, Git URL, status, deployed URL, timestamps

**Features**:
- SQLite database (`deployments.db`)
- Automatic table creation
- Session management with FastAPI dependency injection

### 6. Authentication (`auth.py`)
**Purpose**: JWT-based user authentication

**Features**:
- Password hashing with bcrypt
- JWT token generation/validation
- Token expiration (30 minutes)
- User session management
- Protected endpoint decorators

**Flow**:
```
User Login → Verify Credentials → Generate JWT → Return Token
API Request → Validate JWT → Extract User → Allow Access
```

### 7. Connection Manager (`connection_manager.py`)
**Purpose**: WebSocket connection management for real-time logs

**Features**:
- Multiple client connection support
- Broadcast messages to all connected clients
- Automatic stale connection cleanup
- Real-time deployment log streaming

### 8. Logging & Error Handling (`robust_logging.py`, `robust_error_handler.py`)
**Purpose**: Structured logging and error management

**Features**:
- Structured JSON logging
- Deployment trace tracking
- Error categorization
- Performance timing
- Security event logging
- User action auditing

---

## Deployment Flow (Detailed)

### Step-by-Step Process

```
1. USER REQUEST
   ↓
   POST /deploy with Git URL + optional .env files
   ↓
2. VALIDATION
   - Check Git URL format
   - Verify Docker/Git availability
   - Authenticate user (JWT)
   ↓
3. REPOSITORY CLONING
   - Create temp directory
   - Clone Git repository
   - Extract repo name for container naming
   ↓
4. PROJECT DETECTION
   - Check for docker-compose.yml
   - Check for Dockerfile
   - Check for package.json (Node.js)
   - Check for framework-specific files
   ↓
5. DEPLOYMENT STRATEGY
   
   A. Docker Compose:
      - Parse compose file
      - Modify networks for custom network
      - Handle port conflicts
      - Run docker-compose up
      - Detect main service port
   
   B. Dockerfile:
      - Find EXPOSE port in Dockerfile
      - Build Docker image
      - Find free host port
      - Run container with port mapping
      - Detect actual running port
   
   C. Node.js:
      - Analyze package.json
      - Generate optimized Dockerfile
      - Build multi-stage image
      - Run container
   ↓
6. PORT DISCOVERY
   - Check Dockerfile EXPOSE directive
   - Inspect container logs for port patterns
   - Inspect container port mappings
   - Fallback to common ports (8080, 3000, etc.)
   ↓
7. DATABASE RECORD
   - Create Deployment record
   - Set status = "success"
   - Store container name + URL
   - Link to user
   ↓
8. RESPONSE
   - Return deployed URL
   - Stream logs via WebSocket
   - Update frontend UI
```

---

## Port Management Strategy

### Port Discovery Methods (in order):
1. **Dockerfile EXPOSE** - Parse Dockerfile for `EXPOSE` directive
2. **Container Logs** - Regex patterns match common port messages
3. **Container Inspection** - Docker inspect API for port mappings
4. **Priority Fallback** - Common ports: 80, 8080, 3000, 8000, 5000

### Port Conflict Resolution:
- Check if port is available (`socket.connect_ex()`)
- If busy, find next free port (8080 → 8081 → 8082...)
- Update compose file or use dynamic mapping

---

## Container Naming Convention

**Format**: `{sanitized-repo-name}-{unique-id}`

**Examples**:
- `github.com/user/react-app` → `user-react-app-a1b2c3d4`
- `git@github.com:org/backend.git` → `org-backend-x9y8z7w6`

**Uniqueness**: UUID suffix ensures no conflicts

---

## Docker Network Architecture

**Network**: `devops-butler-net` (custom bridge network)

**Purpose**:
- Isolate Butler-managed containers
- Enable inter-container communication
- Avoid conflicts with other Docker networks

**Container Connection**:
- All deployments join this network
- Containers can communicate via service names
- External access via host port mappings

---

## Frontend Architecture

### File Structure:
```
frontend/
├── src/
│   ├── js/           # JavaScript modules
│   │   ├── app.js    # Main application logic
│   │   ├── auth.js   # Authentication
│   │   └── ...
│   ├── css/          # Stylesheets
│   └── *.html        # HTML pages
└── static/           # Built output (served by FastAPI)
```

### Key Frontend Features:
- **Real-time Updates**: WebSocket connection for live logs
- **Authentication State**: localStorage for JWT tokens
- **Deployment Management**: CRUD operations via REST API
- **Repository Browser**: GitHub API integration
- **Responsive UI**: Modern CSS with glassmorphism design

### Build Process:
1. Edit files in `frontend/src/`
2. Run `npm run build` (Vite bundles & optimizes)
3. Output to `static/` directory
4. FastAPI serves static files

---

## Security Features

1. **Authentication**:
   - JWT tokens with expiration
   - Bcrypt password hashing
   - Protected API endpoints

2. **Input Validation**:
   - Git URL sanitization
   - Container name sanitization
   - File upload restrictions

3. **Resource Isolation**:
   - Per-user deployment isolation
   - Docker network isolation
   - Temporary directory cleanup

4. **Error Handling**:
   - Graceful failure handling
   - No sensitive data leakage
   - Structured error logging

---

## Database Schema

### User Table:
```sql
id (PK)
username (unique)
email (unique)
hashed_password
auth_provider (default: 'local')
github_access_token (nullable)
is_active
created_at
```

### Deployment Table:
```sql
id (PK)
container_name (indexed)
git_url
status ('starting', 'success', 'failed')
deployed_url (nullable)
created_at
user_id (FK → User.id)
```

---

## Error Handling & Resilience

### Retry Logic:
- Deployment pipeline: 1 attempt (fail fast)
- Docker operations: Automatic retry on network issues
- WebSocket: Automatic reconnection on disconnect

### Cleanup Strategy:
- Idempotent deployments (safe to retry)
- Container cleanup before redeployment
- Temporary directory cleanup after deployment
- Old image cleanup to save disk space

### Logging:
- Structured JSON logs
- Deployment trace IDs
- User action auditing
- Security event logging

---

## API Request/Response Examples

### Deploy Repository:
```http
POST /deploy
Content-Type: multipart/form-data
Authorization: Bearer {jwt_token}

git_url: https://github.com/user/repo.git
frontend_env: (optional file)
backend_env: (optional file)

Response:
{
  "message": "Deployment successful!",
  "deployed_url": "http://localhost:8080",
  "container_name": "user-repo-a1b2c3d4",
  "trace_id": "trace-123"
}
```

### List Deployments:
```http
GET /deployments
Authorization: Bearer {jwt_token}

Response:
[
  {
    "id": 1,
    "container_name": "my-app-abc123",
    "git_url": "https://github.com/user/repo",
    "status": "success",
    "deployed_url": "http://localhost:8080",
    "created_at": "2024-01-15T10:30:00"
  }
]
```

---

## Performance Optimizations

1. **Docker Image Caching**: Content-based hashing prevents rebuilds
2. **Async Operations**: Non-blocking I/O with asyncio
3. **Connection Pooling**: Database session reuse
4. **Lazy Loading**: Static files served efficiently
5. **Build Caching**: Vite build output caching

---

## Known Limitations

1. **Single Host**: All containers run on same machine
2. **No Load Balancing**: Direct port mapping only
3. **SQLite Database**: Not suitable for high concurrency
4. **No SSL/TLS**: HTTP only (can be added with reverse proxy)
5. **No Horizontal Scaling**: Single-instance architecture

---

## Extension Points

### Adding New Deployment Strategies:
1. Add detection logic in `simple_pipeline.py`
2. Create handler function (e.g., `handle_rust_deployment()`)
3. Add Dockerfile template if needed
4. Update project detection logic

### Adding New Framework Support:
1. Create Dockerfile template in `dockerfile_templates/`
2. Add detection patterns in pipeline
3. Add framework-specific optimizations

### Adding Features:
- Custom domains: Modify port mapping logic
- SSL/TLS: Add reverse proxy (Nginx/Caddy)
- Resource limits: Add Docker run options
- Health checks: Add container health monitoring

---

## Development Workflow

### Backend Development:
```bash
# Activate venv
source venv/bin/activate

# Run server
python orchestrator.py
```

### Frontend Development:
```bash
cd frontend
npm install
npm run dev  # Hot reload on :3000
```

### Testing Deployment:
```bash
# CLI deployment test
python butler_cli.py deploy https://github.com/user/repo

# Check health
python butler_cli.py health
```

---

## Deployment Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    FastAPI Server                         │
│                  (orchestrator.py)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │   REST   │  │ WebSocket │  │  Static  │             │
│  │   API    │  │  Logs     │  │  Files   │             │
│  └──────────┘  └──────────┘  └──────────┘             │
└────────────┬──────────────────────────────┬──────────────┘
             │                              │
             ▼                              ▼
    ┌────────────────┐          ┌──────────────────┐
    │   SQLite DB    │          │  Docker Engine   │
    │ (deployments)  │          │  - Containers    │
    │   (users)      │          │  - Images        │
    └────────────────┘          │  - Networks      │
                                └──────────────────┘
                                         │
                                         ▼
                            ┌────────────────────┐
                            │ Deployed Containers│
                            │  - User App 1      │
                            │  - User App 2      │
                            │  - ...             │
                            └────────────────────┘
```

---

## Key Design Decisions

1. **Simplified Architecture**: No reverse proxy (Nginx) for easier setup
2. **Direct Port Mapping**: Simpler than subdomain routing
3. **SQLite**: Single-file database for simplicity
4. **Vanilla JS**: No heavy frameworks for faster loading
5. **Docker-First**: Leverages Docker ecosystem completely
6. **User Isolation**: Each user's deployments are isolated
7. **Idempotent Operations**: Safe to retry deployments

---

This architecture enables rapid deployment of Git repositories with minimal configuration while maintaining security, reliability, and user isolation.


