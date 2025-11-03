"""
DevOps Butler - Unified Clean Orchestrator
A simplified, reliable deployment automation platform with essential robustness features.
No Nginx proxy, no GitHub OAuth, no OpenAI dependencies - just clean, working deployment.
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, UploadFile, File, Form, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, HttpUrl
from contextlib import asynccontextmanager
import asyncio
import os
import re
import tempfile
import uuid
import datetime
from typing import List, Optional
from pathlib import Path

# Import core modules
from simple_pipeline import run_deployment_pipeline, extract_repo_name, validate_git_url, run_split_deployment
import subprocess
from database import create_db_and_tables, get_session, engine
from connection_manager import manager
from sqlmodel import Session, select
from login import Deployment, User, EnvironmentVariable
from auth import authenticate_user, create_user, create_access_token, get_current_user
from repository_tree_api import router as repository_tree_router, router_repos
from datetime import timedelta

# Import robust features (simplified versions)
from robust_error_handler import global_error_handler, with_error_handling, RetryConfig
from robust_logging import global_logger, LogLevel, LogCategory

# Helper functions
def get_running_containers():
    """Get list of currently running container names"""
    try:
        result = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            return set(result.stdout.strip().split('\n')) if result.stdout.strip() else set()
        else:
            global_logger.log_error(f"Docker ps failed: {result.stderr}")
            return set()
    except subprocess.TimeoutExpired:
        global_logger.log_error("Docker ps command timed out")
        return set()
    except Exception as e:
        global_logger.log_error(f"Error running docker ps: {str(e)}")
        return set()

def get_container_details():
    """Get detailed information about running containers"""
    try:
        result = subprocess.run(
            ["docker", "ps", "--format", "{{.Names}}|{{.Status}}|{{.Ports}}|{{.Image}}"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            containers = {}
            for line in result.stdout.strip().split('\n'):
                if line.strip():
                    parts = line.split('|')
                    if len(parts) >= 4:
                        name = parts[0]
                        status = parts[1]
                        ports = parts[2]
                        image = parts[3]
                        
                        # Parse uptime from status (e.g., "Up 2 hours", "Up 3 days")
                        uptime = "Unknown"
                        if "Up" in status:
                            uptime_match = status.split("Up ")[1].split(",")[0] if "Up " in status else "Unknown"
                            uptime = uptime_match.strip()
                        
                        # Parse port information
                        port_info = "No ports"
                        if ports and ports != "":
                            port_info = ports
                        
                        containers[name] = {
                            "status": status,
                            "uptime": uptime,
                            "ports": port_info,
                            "image": image
                        }
            return containers
        else:
            global_logger.log_error(f"Docker ps failed: {result.stderr}")
            return {}
    except subprocess.TimeoutExpired:
        global_logger.log_error("Docker ps command timed out")
        return {}
    except Exception as e:
        global_logger.log_error(f"Error running docker ps: {str(e)}")
        return {}

# Pydantic models
class Project(BaseModel):
    git_url: HttpUrl

class UserLogin(BaseModel):
    username: str
    password: str

class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class EnvVarsRequest(BaseModel):
    variables: dict
    project_id: Optional[int] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    global_logger.log_structured(
        level=LogLevel.INFO,
        category=LogCategory.SYSTEM,
        message="DevOps Butler starting up...",
        component="main"
    )
    
    # Initialize database
    create_db_and_tables()
    global_logger.log_structured(
        level=LogLevel.INFO,
        category=LogCategory.DATABASE,
        message="Database initialized",
        component="database"
    )
    
    global_logger.log_structured(
        level=LogLevel.INFO,
        category=LogCategory.SYSTEM,
        message="DevOps Butler ready for service",
        component="main"
    )
    
    yield
    
    # Cleanup
    global_logger.log_structured(
        level=LogLevel.INFO,
        category=LogCategory.SYSTEM,
        message="DevOps Butler shutdown complete",
        component="main"
    )


# Create FastAPI app
app = FastAPI(
    title="DevOps Butler",
    description="Clean, reliable deployment automation platform",
    version="1.0.0",
    lifespan=lifespan
)
# Preflight checks for external dependencies
async def preflight_checks() -> dict:
    """Check Docker and Git availability and Docker daemon connectivity."""
    import subprocess
    checks = {
        'git_cli': False,
        'docker_cli': False,
        'docker_daemon': False,
    }
    # git
    try:
        res = await asyncio.to_thread(subprocess.run, ["git", "--version"], capture_output=True, text=True)
        checks['git_cli'] = res.returncode == 0
    except Exception:
        checks['git_cli'] = False
    # docker cli
    try:
        res = await asyncio.to_thread(subprocess.run, ["docker", "--version"], capture_output=True, text=True)
        checks['docker_cli'] = res.returncode == 0
    except Exception:
        checks['docker_cli'] = False
    # docker daemon
    try:
        res = await asyncio.to_thread(subprocess.run, ["docker", "info"], capture_output=True, text=True)
        checks['docker_daemon'] = res.returncode == 0
    except Exception:
        checks['docker_daemon'] = False
    return checks


# Setup static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")
app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")
# Create avatars directory if it doesn't exist (outside static/ so builds don't delete it)
avatars_dir = os.path.join(os.path.dirname(__file__), "uploads", "avatars")
os.makedirs(avatars_dir, exist_ok=True)
app.mount("/avatars", StaticFiles(directory=avatars_dir), name="avatars")
app.mount("/icons", StaticFiles(directory="icons"), name="icons")

# Include repository tree API routes
app.include_router(repository_tree_router)
app.include_router(router_repos)


# Web interface endpoints
@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve main dashboard"""
    html_file_path = os.path.join(static_dir, "index.html")
    with open(html_file_path, "r") as f:
        return HTMLResponse(content=f.read(), status_code=200)

@app.get("/login", response_class=HTMLResponse)
async def login_page():
    """Serve login page"""
    html_file_path = os.path.join(static_dir, "login.html")
    with open(html_file_path, "r") as f:
        return HTMLResponse(content=f.read(), status_code=200)

@app.get("/applications", response_class=HTMLResponse)
async def applications_dashboard():
    """Serve applications dashboard page"""
    # Serve SPA index for applications; page routing handled client-side
    html_file_path = os.path.join(static_dir, "index.html")
    with open(html_file_path, "r") as f:
        return HTMLResponse(content=f.read(), status_code=200)

@app.get("/repositories", response_class=HTMLResponse)
async def repositories_page():
    """Serve repositories page"""
    html_file_path = os.path.join(static_dir, "index.html")
    with open(html_file_path, "r") as f:
        return HTMLResponse(content=f.read(), status_code=200)


@app.get("/repository-tree", response_class=HTMLResponse)
async def repository_tree_page():
    """Serve repository browser page"""
    html_file_path = os.path.join(static_dir, "repository-tree.html")
    with open(html_file_path, "r") as f:
        return HTMLResponse(content=f.read(), status_code=200)



# Health check endpoint
@app.get("/health")
async def health_check():
    """Basic health check endpoint"""
    try:
        # Simple health check - just verify database engine
        from database import engine
        import sqlalchemy
        with engine.connect() as conn:
            conn.execute(sqlalchemy.text('SELECT 1'))  # Simple connectivity test
        
        return {
            "status": "healthy",
            "timestamp": global_logger.get_timestamp(),
            "version": "1.0.0"
        }
    except Exception as e:
        global_logger.log_error(e, {"endpoint": "health_check"})
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": "Health check failed"}
        )


# Authentication endpoints
@app.post("/api/auth/login")
async def login(user_credentials: UserLogin):
    """User login endpoint"""
    global_logger.log_user_action(
        user_id=user_credentials.username,
        action="login_attempt",
        details={"username": user_credentials.username}
    )
    
    user = authenticate_user(user_credentials.username, user_credentials.password)
    if not user:
        global_logger.log_security_event(
            event_type="failed_login",
            severity="medium",
            details={"username": user_credentials.username}
        )
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    global_logger.log_user_action(
        user_id=str(user.id),
        action="login_success",
        details={"username": user.username}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username
    }

@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    """User registration endpoint"""
    global_logger.log_user_action(
        user_id=user_data.username,
        action="registration_attempt",
        details={"username": user_data.username, "email": user_data.email}
    )
    
    user = create_user(user_data.username, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already exists"
        )
    
    global_logger.log_user_action(
        user_id=str(user.id),
        action="registration_success",
        details={"username": user.username, "email": user.email}
    )
    
    return {"message": "User created successfully"}


# Applications API endpoint
@app.get("/api/applications")
async def get_applications():
    """Get all running applications/containers for the dashboard"""
    try:
        import docker
        client = docker.from_env()
        containers = client.containers.list()
        
        applications = []
        for container in containers:
            # Filter out system containers
            if any(system_name in container.name.lower() for system_name in ['nginx', 'proxy', 'db', 'postgres', 'mysql']):
                continue
            
            # Get port mappings
            ports = []
            if container.attrs.get('NetworkSettings', {}).get('Ports'):
                port_mappings = container.attrs['NetworkSettings']['Ports']
                for internal_port, mappings in port_mappings.items():
                    if mappings:
                        for mapping in mappings:
                            if mapping.get('HostPort'):
                                ports.append(f"http://localhost:{mapping['HostPort']}")
            
            applications.append({
                'id': container.id[:12],
                'name': container.name,
                'status': container.status,
                'image': container.image.tags[0] if container.image.tags else 'unknown',
                'created': container.attrs['Created'],
                'ports': ports,
                'url': ports[0] if ports else None
            })
        
        return {'applications': applications, 'count': len(applications)}
        
    except Exception as e:
        global_logger.log_error(e, {'endpoint': 'get_applications'})
        raise HTTPException(status_code=500, detail=f"Failed to get applications: {str(e)}")

# Environment Variables API endpoints
@app.get("/api/env-vars")
async def get_env_vars(
    project_id: Optional[int] = None,
    current_user: User = Depends(get_current_user)
):
    """Get environment variables for the current user, optionally filtered by project"""
    with Session(engine) as session:
        query = select(EnvironmentVariable).where(EnvironmentVariable.user_id == current_user.id)
        
        if project_id is not None:
            query = query.where(EnvironmentVariable.project_id == project_id)
        
        env_vars = session.exec(query).all()
        
        variables = {var.key: var.value for var in env_vars}
        vars_list = [
            {
                "key": var.key,
                "value": var.value,
                "project_id": var.project_id,
                "updated_at": var.updated_at.isoformat() if var.updated_at else None
            }
            for var in env_vars
        ]
        return {"variables": variables, "vars_list": vars_list}

@app.post("/api/env-vars")
async def save_env_vars(
    data: EnvVarsRequest,
    current_user: User = Depends(get_current_user)
):
    """Save environment variables for the current user, optionally for a specific project"""
    with Session(engine) as session:
        # Determine which variables to manage
        if data.project_id is not None:
            # Project-specific variables
            query = select(EnvironmentVariable).where(
                EnvironmentVariable.user_id == current_user.id,
                EnvironmentVariable.project_id == data.project_id
            )
        else:
            # Global variables (no project_id)
            query = select(EnvironmentVariable).where(
                EnvironmentVariable.user_id == current_user.id,
                EnvironmentVariable.project_id.is_(None)
            )
        
        existing_vars = session.exec(query).all()
        existing_dict = {var.key: var for var in existing_vars}
        
        # Process variables from request
        if data.variables:
            new_keys = set(data.variables.keys())
            
            # Update or create variables
            for key, value in data.variables.items():
                if key in existing_dict:
                    # Update existing
                    existing_dict[key].value = value
                    existing_dict[key].updated_at = datetime.datetime.utcnow()
                else:
                    # Create new
                    env_var = EnvironmentVariable(
                        user_id=current_user.id,
                        project_id=data.project_id,
                        key=key,
                        value=value
                    )
                    session.add(env_var)
            
            # Delete variables that are no longer in the request
            for var in existing_vars:
                if var.key not in new_keys:
                    session.delete(var)
        
        session.commit()
        return {"message": "Environment variables saved successfully"}

@app.get("/api/env-vars/detect")
async def detect_env_vars(
    frontend_url: Optional[str] = None,
    backend_url: Optional[str] = None,
    git_url: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Detect required environment variables from repository code"""
    try:
        suggestions = {}
        temp_dir = None
        
        try:
            # Clone repository to temp directory
            temp_dir = tempfile.mkdtemp(prefix="butler-env-detect-")
            
            if frontend_url or backend_url:
                # Multi-repo deployment - detect from both repos
                if frontend_url:
                    repo_dir = os.path.join(temp_dir, "frontend")
                    proc = await asyncio.to_thread(subprocess.run, 
                        ["git", "clone", "--depth", "1", frontend_url, repo_dir],
                        capture_output=True, text=True, timeout=60,
                        env={**os.environ, "GIT_TERMINAL_PROMPT": "0"}
                    )
                    if proc.returncode == 0:
                        fe_suggestions = _detect_env_from_repo(repo_dir, "frontend")
                        suggestions.update(fe_suggestions)
                
                if backend_url:
                    repo_dir = os.path.join(temp_dir, "backend")
                    proc = await asyncio.to_thread(subprocess.run,
                        ["git", "clone", "--depth", "1", backend_url, repo_dir],
                        capture_output=True, text=True, timeout=60,
                        env={**os.environ, "GIT_TERMINAL_PROMPT": "0"}
                    )
                    if proc.returncode == 0:
                        be_suggestions = _detect_env_from_repo(repo_dir, "backend")
                        suggestions.update(be_suggestions)
            elif git_url:
                # Single repo deployment
                repo_dir = os.path.join(temp_dir, "repo")
                proc = await asyncio.to_thread(subprocess.run,
                    ["git", "clone", "--depth", "1", git_url, repo_dir],
                    capture_output=True, text=True, timeout=60,
                    env={**os.environ, "GIT_TERMINAL_PROMPT": "0"}
                )
                if proc.returncode == 0:
                    suggestions = _detect_env_from_repo(repo_dir, "app")
            
            return {"suggestions": suggestions}
            
        finally:
            # Cleanup
            if temp_dir and os.path.exists(temp_dir):
                import shutil
                shutil.rmtree(temp_dir, ignore_errors=True)
                
    except Exception as e:
        global_logger.log_error(f"Error detecting env vars: {str(e)}")
        return {"suggestions": {}}

def _detect_env_from_repo(repo_dir: str, component: str) -> dict:
    """Detect environment variables from repository code"""
    suggestions = {}
    
    # Common patterns to detect env vars
    patterns = {
        r'process\.env\.([A-Z0-9_]+)': 'process.env',  # Node.js
        r'os\.getenv\([\'"]([A-Z0-9_]+)[\'"]\)': 'os.getenv',  # Python
        r'os\.environ\[[\'"]([A-Z0-9_]+)[\'"]\]': 'os.environ',  # Python
        r'\$\{([A-Z0-9_]+)\}': 'shell variable',  # Shell/Bash
        r'env\([\'"]([A-Z0-9_]+)[\'"]\)': 'env()',  # Laravel/PHP
    }
    
    # Common built-in environment variables to ignore
    common_vars = {
        'NODE_ENV', 'PATH', 'HOME', 'USER', 'PWD', 'LANG', 'SHELL',
        'TMPDIR', 'HOSTNAME', 'PORT', 'HOST', 'HOSTNAME',
        'PYTHONPATH', 'VIRTUAL_ENV', 'PIP_REQUIRE_VIRTUALENV',
        'NEXT_TELEMETRY_DISABLED', 'NPM_CONFIG', 'CI', 'DEBUG'
    }
    
    # Check common config files
    config_files = [
        'next.config.js', 'next.config.mjs', 'next.config.ts', 'next.config.cjs',
        '.env.example', '.env.sample', '.env.template',
        'package.json', 'composer.json',
        'config.js', 'config.ts', 'config.py',
        'settings.py', 'settings.js', 'environment.js',
        'webpack.config.js', 'vite.config.js', 'vite.config.ts',
    ]
    
    # Scan repository
    for root, dirs, files in os.walk(repo_dir):
        # Skip node_modules, .git, etc.
        dirs[:] = [d for d in dirs if d not in {'.git', 'node_modules', 'venv', 'env', '__pycache__'}]
        
        for file in files:
            # Only check relevant files
            if not any(file.endswith(ext) for ext in ['.js', '.jsx', '.ts', '.tsx', '.py', '.env', '.json', '.sh', '.yml', '.yaml']):
                continue
            
            # Prioritize config files
            is_config = file in config_files
            
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                    # Check all patterns
                    for pattern, source in patterns.items():
                        matches = re.findall(pattern, content, re.IGNORECASE)
                        for match in matches:
                            # Clean up the match
                            var_name = match.strip().upper()
                            # Filter out common built-in vars
                            if len(var_name) > 1 and var_name not in suggestions and var_name not in common_vars:
                                suggestions[var_name] = {
                                    "detected_from": file,
                                    "source": source,
                                    "component": component,
                                    "priority": 10 if is_config else 5
                                }
            except Exception:
                continue
    
    # Sort by priority
    suggestions = dict(sorted(suggestions.items(), key=lambda x: x[1]['priority'], reverse=True))
    
    return suggestions

# User Profile API endpoints
@app.get("/api/user/profile")
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile"""
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "display_name": current_user.display_name,
        "avatar_url": current_user.avatar_url
    }

@app.put("/api/user/profile")
async def update_user_profile(
    email: Optional[str] = Form(None),
    display_name: Optional[str] = Form(None),
    current_password: Optional[str] = Form(None),
    new_password: Optional[str] = Form(None),
    remove_avatar: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user)
):
    """Update user profile"""
    try:
        with Session(engine) as session:
            # Get fresh user data
            user = session.exec(select(User).where(User.id == current_user.id)).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            # Update email if provided
            if email and email != user.email:
                # Check if email already exists
                existing = session.exec(select(User).where(User.email == email, User.id != user.id)).first()
                if existing:
                    raise HTTPException(status_code=400, detail="Email already in use")
                user.email = email
            
            # Update display name
            if display_name is not None:
                user.display_name = display_name
            
            # Handle password change
            if new_password:
                if not current_password:
                    raise HTTPException(status_code=400, detail="Current password required")
                from auth import verify_password
                if not verify_password(current_password, user.hashed_password):
                    raise HTTPException(status_code=400, detail="Current password incorrect")
                from auth import get_password_hash
                user.hashed_password = get_password_hash(new_password)
            
            # Handle avatar upload
            if avatar:
                # Create avatars directory outside static/ so it doesn't get deleted on frontend rebuild
                avatars_dir = os.path.join(os.path.dirname(__file__), "uploads", "avatars")
                os.makedirs(avatars_dir, exist_ok=True)
                
                # Save avatar file
                file_ext = os.path.splitext(avatar.filename)[1] or ".jpg"
                avatar_filename = f"{user.id}_{uuid.uuid4().hex[:8]}{file_ext}"
                avatar_path = os.path.join(avatars_dir, avatar_filename)
                
                with open(avatar_path, "wb") as f:
                    content = await avatar.read()
                    f.write(content)
                
                user.avatar_url = f"/avatars/{avatar_filename}"
            
            # Handle avatar removal
            if remove_avatar == "true":
                if user.avatar_url:
                    # Delete old avatar file
                    old_avatar_path = os.path.join(os.path.dirname(__file__), "uploads", user.avatar_url.lstrip("/"))
                    if os.path.exists(old_avatar_path):
                        try:
                            os.remove(old_avatar_path)
                        except:
                            pass
                user.avatar_url = None
            
            session.add(user)
            session.commit()
            session.refresh(user)
            
            return {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "display_name": user.display_name,
                "avatar_url": user.avatar_url,
                "message": "Profile updated successfully"
            }
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = str(e)
        error_trace = traceback.format_exc()
        print(f"ERROR updating profile: {error_msg}")
        print(error_trace)
        global_logger.log_error_message(f"Error updating profile: {error_msg}")
        raise HTTPException(
            status_code=500, 
            detail=f"Error updating profile: {error_msg}"
        )

# Deployment endpoints
@app.get("/deploy", response_class=HTMLResponse)
async def deploy_page():
    """Serve deploy page"""
    html_file_path = os.path.join(static_dir, "index.html")
    with open(html_file_path, "r") as f:
        return HTMLResponse(content=f.read(), status_code=200)

@app.post("/deploy")
@with_error_handling("deployment", "deploy", RetryConfig(max_attempts=1))
async def deploy(
    deploy_type: str = Form("single"),
    git_url: Optional[str] = Form(None),
    frontend_url: Optional[str] = Form(None),
    backend_url: Optional[str] = Form(None),
    project_id: Optional[int] = Form(None),
    component_type: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """Deploy a Git repository (single or split frontend/backend)"""
    # Determine which URL(s) to use
    if deploy_type == "split":
        if not frontend_url or not backend_url:
            raise HTTPException(status_code=422, detail="Both frontend_url and backend_url are required for split deployment.")
        if not validate_git_url(frontend_url) or not validate_git_url(backend_url):
            raise HTTPException(status_code=422, detail="Invalid repository URL(s).")
        git_url = frontend_url  # Use frontend URL as primary for logging
    else:
        if not git_url:
            raise HTTPException(status_code=422, detail="git_url is required for single repository deployment.")
        if not validate_git_url(git_url):
            raise HTTPException(status_code=422, detail="Invalid or unsupported repository URL.")
    # Environment sanity checks
    checks = await preflight_checks()
    if not checks['git_cli']:
        raise HTTPException(status_code=503, detail="Git CLI not available on server.")
    if not checks['docker_cli']:
        raise HTTPException(status_code=503, detail="Docker CLI not available on server.")
    if not checks['docker_daemon']:
        raise HTTPException(status_code=503, detail="Docker daemon not reachable. Please start Docker Desktop.")
    # Start deployment trace
    trace_id = global_logger.start_deployment_trace(
        repo_url=git_url,
        user_id=str(current_user.id)
    )
    
    global_logger.log_user_action(
        user_id=str(current_user.id),
        action="deployment_started",
        details={"repo_url": git_url, "trace_id": trace_id}
    )
    
    try:
        # Get user's environment variables and create temp directory for them
        repo_dir = None
        with Session(engine) as session:
            env_vars = session.exec(
                select(EnvironmentVariable).where(EnvironmentVariable.user_id == current_user.id)
            ).all()
            
            if env_vars:
                repo_dir = tempfile.mkdtemp(prefix="butler-env-")
                # Create frontend.env with all env vars
                with open(os.path.join(repo_dir, "frontend.env"), "w") as f:
                    for env_var in env_vars:
                        f.write(f"{env_var.key}={env_var.value}\n")
                # Also create backend.env with same vars (or separate if needed)
                with open(os.path.join(repo_dir, "backend.env"), "w") as f:
                    for env_var in env_vars:
                        f.write(f"{env_var.key}={env_var.value}\n")
                await manager.broadcast(f"📝 Loaded {len(env_vars)} environment variables")
        
        # Run deployment pipeline with error handling and logging
        with global_logger.timer("deployment_pipeline"):
            global_logger.add_deployment_stage(trace_id, "deployment_pipeline", "started")
            
            if deploy_type == "split":
                # Handle split frontend/backend deployment
                await manager.broadcast("🚀 Deploying split repositories (Frontend + Backend)")
                # If deploying from an imported split project, use its id as parent
                parent_id = project_id if project_id is not None else None
                result = await run_split_deployment(frontend_url, backend_url, user_id=current_user.id, env_dir=repo_dir, parent_project_id=parent_id)
            else:
                # Handle single deployment - either standalone or as a component of split repo
                existing_id: Optional[int] = None
                parent_id: Optional[int] = None
                
                if project_id is not None:
                    with Session(engine) as session:
                        existing = session.exec(
                            select(Deployment).where(
                                Deployment.id == project_id,
                                Deployment.user_id == current_user.id
                            )
                        ).first()
                        if not existing:
                            raise HTTPException(status_code=404, detail="Project not found")
                        
                        # If component_type is provided, this is deploying a component (frontend/backend)
                        # of a split repo. Use project_id as parent_id instead of existing_id
                        if component_type:
                            parent_id = existing.id
                        else:
                            # Regular redeployment - reuse existing deployment record
                            existing_id = existing.id
                
                result = await run_deployment_pipeline(
                    git_url, 
                    user_id=current_user.id, 
                    env_dir=repo_dir, 
                    existing_deployment_id=existing_id,
                    parent_project_id=parent_id,
                    component_type=component_type
                )
            
            # Check if deployment was successful
            if result is not None:
                if isinstance(result, tuple) and len(result) == 2:
                    container_name, deployed_url = result
                    if container_name and deployed_url:
                        global_logger.add_deployment_stage(
                            trace_id, "deployment_pipeline", "completed",
                            {"deployed_url": deployed_url, "container_name": container_name}
                        )
                        
                        global_logger.finish_deployment_trace(trace_id, "success", deployed_url)
                        
                        global_logger.log_user_action(
                            user_id=str(current_user.id),
                            action="deployment_success",
                            details={
                                "repo_url": git_url,
                                "deployed_url": deployed_url,
                                "container_name": container_name,
                                "trace_id": trace_id
                            }
                        )
                        
                        # If this was a redeploy of an imported project, ensure DB is updated with final details
                        if project_id is not None:
                            with Session(engine) as session:
                                dep = session.get(Deployment, project_id)
                                if dep:
                                    dep.status = "success"
                                    dep.deployed_url = deployed_url
                                    dep.container_name = container_name
                                    session.add(dep)
                                    session.commit()
                        return {
                            "message": "Deployment successful!",
                            "deployed_url": deployed_url,
                            "container_name": container_name,
                            "trace_id": trace_id
                        }
                    else:
                        # Result has correct structure but empty/invalid values
                        error_msg = f"Deployment pipeline returned invalid values: container_name='{container_name}', deployed_url='{deployed_url}'"
                        global_logger.add_deployment_stage(
                            trace_id, "deployment_pipeline", "failed",
                            {"error": error_msg}
                        )
                        raise Exception(error_msg)
                else:
                    # Result is not None but has wrong structure
                    error_msg = f"Deployment pipeline returned unexpected result format: {type(result)} - {result}"
                    global_logger.add_deployment_stage(
                        trace_id, "deployment_pipeline", "failed",
                        {"error": error_msg}
                    )
                    raise Exception(error_msg)
            else:
                # Result is None, indicating deployment failure
                error_msg = "Deployment pipeline failed and returned None"
                global_logger.add_deployment_stage(
                    trace_id, "deployment_pipeline", "failed",
                    {"error": error_msg}
                )
                raise Exception(error_msg)
    
    except HTTPException:
        raise
    except Exception as e:
        global_logger.log_error(e, {"trace_id": trace_id, "repo_url": git_url}, trace_id)
        global_logger.finish_deployment_trace(trace_id, "failed")
        
        global_logger.log_user_action(
            user_id=str(current_user.id),
            action="deployment_failed",
            details={
                "repo_url": git_url,
                "error": str(e),
                "trace_id": trace_id
            }
        )
        
        # Provide user-friendly error without leaking internals
        raise HTTPException(status_code=500, detail="Deployment failed. Check logs for details.")


@app.post("/api/import")
async def import_repository(
    git_url: str = Form(...),
    app_name: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    """Import a repository without deploying it - just create a project record"""
    try:
        # Validate git URL
        if not validate_git_url(git_url):
            raise HTTPException(status_code=422, detail="Invalid or unsupported repository URL.")
        
        # Extract repository name if not provided
        if not app_name or app_name == "Untitled Project":
            app_name = extract_repo_name(git_url)
        
        # Create a deployment record with 'imported' status
        with Session(engine) as session:
            deployment = Deployment(
                user_id=current_user.id,
                git_url=git_url,
                status='imported',  # Set status as imported, not deployed
                deployed_url=None,  # No URL since not deployed
                container_name=f"{app_name.lower().replace(' ', '-')}-{current_user.id}",
                app_name=app_name,
                created_at=datetime.datetime.utcnow()
            )
            
            session.add(deployment)
            session.commit()
            session.refresh(deployment)
            
            global_logger.log_user_action(
                user_id=str(current_user.id),
                action="repository_imported",
                details={
                    "repo_url": git_url,
                    "app_name": app_name,
                    "project_id": deployment.id
                }
            )
            
            return {
                "message": "Repository imported successfully!",
                "project_id": deployment.id,
                "app_name": app_name,
                "git_url": git_url
            }
            
    except Exception as e:
        global_logger.log_error(f"Import failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to import repository: {str(e)}")


# Split repository import (frontend + backend)
@app.post("/api/import-split")
async def import_split_repository(
    frontend_url: str = Form(...),
    backend_url: str = Form(...),
    app_name: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """Import two repositories as a split project without deploying them."""
    try:
        # Basic validation
        if not validate_git_url(frontend_url) or not validate_git_url(backend_url):
            raise HTTPException(status_code=422, detail="Invalid repository URL(s).")

        if not app_name:
            fe_name = extract_repo_name(frontend_url)
            be_name = extract_repo_name(backend_url)
            app_name = f"{fe_name}-{be_name}"

        combined_git_url = f"split::{frontend_url}|{backend_url}"

        with Session(engine) as session:
            deployment = Deployment(
                user_id=current_user.id,
                git_url=combined_git_url,
                status='imported_split',
                deployed_url=None,
                container_name=f"{app_name.lower().replace(' ', '-')}-{current_user.id}",
                app_name=app_name,
                created_at=datetime.datetime.utcnow()
            )
            session.add(deployment)
            session.commit()
            session.refresh(deployment)

            global_logger.log_user_action(
                user_id=str(current_user.id),
                action="repository_imported_split",
                details={
                    "frontend_url": frontend_url,
                    "backend_url": backend_url,
                    "app_name": app_name,
                    "project_id": deployment.id
                }
            )

            return {
                "message": "Split repository imported successfully!",
                "project_id": deployment.id,
                "app_name": app_name,
                "frontend_url": frontend_url,
                "backend_url": backend_url
            }

    except HTTPException:
        raise
    except Exception as e:
        global_logger.log_error(f"Split import failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to import split repository: {str(e)}")

@app.put("/projects/{project_id}/name")
async def update_project_name(
    project_id: int,
    app_name: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    """Update project name"""
    try:
        with Session(engine) as session:
            deployment = session.exec(
                select(Deployment).where(
                    Deployment.id == project_id,
                    Deployment.user_id == current_user.id
                )
            ).first()
            
            if not deployment:
                raise HTTPException(status_code=404, detail="Project not found")
            
            old_name = deployment.app_name
            deployment.app_name = app_name
            deployment.updated_at = datetime.datetime.utcnow()
            session.add(deployment)
            session.commit()
            
            global_logger.log_user_action(
                user_id=str(current_user.id),
                action="project_name_updated",
                details={
                    "project_id": project_id,
                    "old_name": old_name,
                    "new_name": app_name
                }
            )
            
            return {
                "message": "Project name updated successfully",
                "project_id": project_id,
                "app_name": app_name
            }
            
    except HTTPException:
        raise
    except Exception as e:
        global_logger.log_error(f"Failed to update project name: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to update project name: {str(e)}")

@app.get("/deployments")
def list_deployments(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List all deployments for the current user with real-time container status and metrics"""
    global_logger.log_user_action(
        user_id=str(current_user.id),
        action="list_deployments"
    )
    
    # Filter out child deployments (frontend/backend components) - only show parent projects
    statement = select(Deployment).where(
        Deployment.user_id == current_user.id,
        Deployment.parent_project_id.is_(None)  # Only return parent projects, not child components
    )
    deployments = session.exec(statement).all()
    
    # Get detailed container information
    container_details = get_container_details()
    running_containers = get_running_containers()
    
    # Convert to dict format for JSON response with real-time status and metrics
    deployment_list = []
    for deployment in deployments:
        # Check if container is actually running
        is_running = deployment.container_name in running_containers
        
        # Get detailed container info if running
        container_info = container_details.get(deployment.container_name, {})
        
        # Determine real status
        if is_running:
            real_status = "running"
        elif deployment.status == "success":
            real_status = "stopped"  # Was successful but not currently running
        else:
            real_status = deployment.status
        
        deployment_dict = {
            "id": deployment.id,
            "container_name": deployment.container_name,
            "git_url": deployment.git_url,
            "app_name": deployment.app_name,
            "status": real_status,
            "deployed_url": deployment.deployed_url,
            "created_at": deployment.created_at,
            "updated_at": deployment.updated_at,
            "user_id": deployment.user_id,
            "is_running": is_running,
            "container_uptime": container_info.get("uptime", "Unknown"),
            "container_ports": container_info.get("ports", "No ports"),
            "container_image": container_info.get("image", "Unknown"),
            "container_status": container_info.get("status", "Unknown"),
            "parent_project_id": getattr(deployment, 'parent_project_id', None),
            "component_type": getattr(deployment, 'component_type', None)
        }
        deployment_list.append(deployment_dict)
    
    return deployment_list

@app.get("/projects/{project_id}/components")
def get_project_components(
    project_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get frontend and backend component deployments for a split project"""
    # Verify project belongs to user
    parent = session.exec(
        select(Deployment).where(
            Deployment.id == project_id,
            Deployment.user_id == current_user.id
        )
    ).first()
    
    if not parent:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Get child components
    components = session.exec(
        select(Deployment).where(
            Deployment.parent_project_id == project_id,
            Deployment.user_id == current_user.id
        )
    ).all()
    
    # Get container details
    container_details = get_container_details()
    running_containers = get_running_containers()
    
    component_list = []
    for component in components:
        is_running = component.container_name in running_containers
        container_info = container_details.get(component.container_name, {})
        
        if is_running:
            real_status = "running"
        elif component.status == "success":
            real_status = "stopped"
        else:
            real_status = component.status
        
        component_list.append({
            "id": component.id,
            "container_name": component.container_name,
            "git_url": component.git_url,
            "component_type": component.component_type,
            "status": real_status,
            "deployed_url": component.deployed_url,
            "is_running": is_running,
            "container_uptime": container_info.get("uptime", "Unknown"),
            "container_ports": container_info.get("ports", "No ports"),
            "container_image": container_info.get("image", "Unknown"),
            "container_status": container_info.get("status", "Unknown"),
            "created_at": component.created_at,
            "updated_at": component.updated_at
        })
    
    return {"components": component_list}

@app.delete("/deployments/clear")
def clear_user_deployments(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Clear all deployment records for the current user"""
    try:
        # Get all deployment records for the current user
        deployments_to_delete = session.exec(
            select(Deployment).where(Deployment.user_id == current_user.id)
        ).all()
        
        # Delete each one
        for deployment in deployments_to_delete:
            session.delete(deployment)
        
        # Commit the transaction
        session.commit()
        
        global_logger.log_user_action(
            user_id=str(current_user.id),
            action="deployments_cleared",
            details={"count": len(deployments_to_delete)}
        )
        
        return {"message": "Your deployment history has been cleared."}
    except Exception as e:
        global_logger.log_error(e, {"user_id": current_user.id})
        raise HTTPException(status_code=500, detail="Could not clear the database.")

@app.get("/deployment/{trace_id}/logs")
async def get_deployment_logs(
    trace_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get logs for a specific deployment"""
    trace = global_logger.get_deployment_trace(trace_id)
    if not trace or (trace.user_id and trace.user_id != str(current_user.id)):
        raise HTTPException(status_code=404, detail="Deployment trace not found")
    
    logs = global_logger.get_deployment_logs(trace_id)
    
    return {
        "trace_id": trace_id,
        "trace_info": trace.__dict__ if trace else None,
        "logs": logs
    }

@app.get("/projects/{project_id}/logs")
async def get_project_logs(
    project_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get logs for a specific project/container"""
    try:
        with Session(engine) as session:
            # Verify project belongs to user
            deployment = session.exec(
                select(Deployment).where(
                    Deployment.id == project_id,
                    Deployment.user_id == current_user.id
                )
            ).first()
            
            if not deployment:
                raise HTTPException(status_code=404, detail="Project not found")
            
            # Get container logs using docker logs
            try:
                result = subprocess.run(
                    ["docker", "logs", "--tail", "100", deployment.container_name],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                
                if result.returncode == 0:
                    logs = result.stdout
                else:
                    logs = f"Error getting logs: {result.stderr}"
                    
            except subprocess.TimeoutExpired:
                logs = "Log retrieval timed out"
            except Exception as e:
                logs = f"Error retrieving logs: {str(e)}"
            
            return {
                "project_id": project_id,
                "container_name": deployment.container_name,
                "logs": logs,
                "is_running": deployment.container_name in get_running_containers()
            }
            
    except HTTPException:
        raise
    except Exception as e:
        global_logger.log_error(f"Error getting project logs: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get project logs")

@app.post("/projects/{project_id}/restart")
async def restart_project(
    project_id: int,
    current_user: User = Depends(get_current_user)
):
    """Restart a specific project/container"""
    try:
        with Session(engine) as session:
            # Verify project belongs to user
            deployment = session.exec(
                select(Deployment).where(
                    Deployment.id == project_id,
                    Deployment.user_id == current_user.id
                )
            ).first()
            
            if not deployment:
                raise HTTPException(status_code=404, detail="Project not found")
            
            # Restart container using docker restart
            try:
                result = subprocess.run(
                    ["docker", "restart", deployment.container_name],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                if result.returncode == 0:
                    global_logger.log_user_action(
                        user_id=str(current_user.id),
                        action="restart_project",
                        details={"project_id": project_id, "container_name": deployment.container_name}
                    )
                    return {
                        "project_id": project_id,
                        "container_name": deployment.container_name,
                        "status": "restarted",
                        "message": "Project restarted successfully"
                    }
                else:
                    raise HTTPException(status_code=500, detail=f"Failed to restart container: {result.stderr}")
                    
            except subprocess.TimeoutExpired:
                raise HTTPException(status_code=500, detail="Restart operation timed out")
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error restarting container: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        global_logger.log_error(f"Error restarting project: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to restart project")


# Delete project: stop/remove container, remove image if possible, delete DB + env vars
@app.delete("/projects/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user)
):
    try:
        with Session(engine) as session:
            deployment = session.exec(
                select(Deployment).where(
                    Deployment.id == project_id,
                    Deployment.user_id == current_user.id
                )
            ).first()
            if not deployment:
                raise HTTPException(status_code=404, detail="Project not found")

            container_name = deployment.container_name

            # Attempt to detect image name for the container (if present)
            image_name = None
            try:
                proc = subprocess.run(
                    ["docker", "ps", "-a", "--filter", f"name={container_name}", "--format", "{{.Image}}"],
                    capture_output=True,
                    text=True,
                    timeout=10
                )
                if proc.returncode == 0 and proc.stdout.strip():
                    image_name = proc.stdout.strip().splitlines()[0].strip()
            except Exception:
                image_name = None

            # Stop container if running
            try:
                subprocess.run(["docker", "stop", container_name], capture_output=True, text=True, timeout=20)
            except Exception:
                pass

            # Remove container (force)
            try:
                subprocess.run(["docker", "rm", "-f", container_name], capture_output=True, text=True, timeout=20)
            except Exception:
                pass

            # Remove image if known
            if image_name:
                try:
                    subprocess.run(["docker", "rmi", "-f", image_name], capture_output=True, text=True, timeout=30)
                except Exception:
                    pass

            # Delete related environment variables
            env_vars = session.exec(
                select(EnvironmentVariable).where(
                    EnvironmentVariable.user_id == current_user.id,
                    EnvironmentVariable.project_id == project_id
                )
            ).all()
            for ev in env_vars:
                session.delete(ev)

            # Delete child deployments if this is a parent project
            child_deployments = session.exec(
                select(Deployment).where(
                    Deployment.parent_project_id == project_id,
                    Deployment.user_id == current_user.id
                )
            ).all()
            
            for child in child_deployments:
                child_container_name = child.container_name
                
                # Stop and remove child container
                try:
                    subprocess.run(["docker", "stop", child_container_name], capture_output=True, text=True, timeout=20)
                except Exception:
                    pass
                
                try:
                    subprocess.run(["docker", "rm", "-f", child_container_name], capture_output=True, text=True, timeout=20)
                except Exception:
                    pass
                
                # Get child image for deletion
                child_image_name = None
                try:
                    proc = subprocess.run(
                        ["docker", "ps", "-a", "--filter", f"name={child_container_name}", "--format", "{{.Image}}"],
                        capture_output=True,
                        text=True,
                        timeout=10
                    )
                    if proc.returncode == 0 and proc.stdout.strip():
                        child_image_name = proc.stdout.strip().splitlines()[0].strip()
                except Exception:
                    pass
                
                # Remove child image
                if child_image_name:
                    try:
                        subprocess.run(["docker", "rmi", "-f", child_image_name], capture_output=True, text=True, timeout=30)
                    except Exception:
                        pass
                
                # Delete child's environment variables
                child_env_vars = session.exec(
                    select(EnvironmentVariable).where(
                        EnvironmentVariable.user_id == current_user.id,
                        EnvironmentVariable.project_id == child.id
                    )
                ).all()
                for ev in child_env_vars:
                    session.delete(ev)
                
                # Delete child deployment record
                session.delete(child)
                
                global_logger.log_user_action(
                    user_id=str(current_user.id),
                    action="child_project_deleted",
                    details={
                        "parent_id": project_id,
                        "child_id": child.id,
                        "component_type": child.component_type,
                        "container_name": child_container_name
                    }
                )

            # Delete deployment record
            session.delete(deployment)
            session.commit()

            global_logger.log_user_action(
                user_id=str(current_user.id),
                action="project_deleted",
                details={"project_id": project_id, "container_name": container_name, "image": image_name}
            )

            return {"message": "Project deleted"}
    except HTTPException:
        raise
    except Exception as e:
        global_logger.log_error(f"Error deleting project: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete project")

# WebSocket endpoint for real-time updates
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time deployment updates"""
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        global_logger.log_structured(
            level=LogLevel.INFO,
            category=LogCategory.SYSTEM,
            message=f"Client #{client_id} disconnected",
            component="websocket"
        )

@app.websocket("/ws/logs")
async def logs_websocket(websocket: WebSocket):
    """WebSocket endpoint for real-time application logs streaming"""
    await websocket.accept()
    global_logger.log_structured(
        level=LogLevel.INFO,
        category=LogCategory.SYSTEM,
        message="Logs WebSocket client connected",
        component="websocket"
    )
    
    try:
        # Send initial connection message
        await websocket.send_json({
            "message": "Connected to application logs stream",
            "type": "success"
        })
        
        # Stream application logs from logs/application.log
        log_file_path = Path("logs/application.log")
        last_position = 0
        
        while True:
            try:
                if log_file_path.exists():
                    # Read new lines from log file
                    with open(log_file_path, 'r') as f:
                        f.seek(last_position)
                        new_lines = f.readlines()
                        last_position = f.tell()
                        
                        # Send new log lines
                        for line in new_lines:
                            if line.strip():
                                await websocket.send_json({
                                    "message": line.strip(),
                                    "type": "info"
                                })
                else:
                    # Log file doesn't exist yet
                    await asyncio.sleep(1)
                
                # Wait before next fetch
                await asyncio.sleep(1)
                
            except Exception as e:
                global_logger.log_error(f"Error in logs loop: {str(e)}")
                await asyncio.sleep(2)
                
    except WebSocketDisconnect:
        global_logger.log_structured(
            level=LogLevel.INFO,
            category=LogCategory.SYSTEM,
            message="Logs WebSocket client disconnected",
            component="websocket"
        )
    except Exception as e:
        global_logger.log_error(f"Logs WebSocket error: {str(e)}")
        global_logger.log_structured(
            level=LogLevel.ERROR,
            category=LogCategory.SYSTEM,
            message=f"Logs WebSocket error: {str(e)}",
            component="websocket"
        )


@app.websocket("/ws/project/{project_id}/logs")
async def project_logs_websocket(websocket: WebSocket, project_id: int):
    """WebSocket endpoint for project-specific container logs streaming"""
    await websocket.accept()
    global_logger.log_structured(
        level=LogLevel.INFO,
        category=LogCategory.SYSTEM,
        message=f"Project logs WebSocket client connected for project {project_id}",
        component="websocket"
    )
    
    try:
        # Send initial connection message
        await websocket.send_json({
            "message": "Connected to container logs stream",
            "type": "success"
        })
        
        # Get container name from project
        container_name = None
        with Session(engine) as session:
            deployment = session.exec(
                select(Deployment).where(Deployment.id == project_id)
            ).first()
            if deployment and deployment.container_name:
                container_name = deployment.container_name
        
        if not container_name:
            await websocket.send_json({
                "message": f"No container found for project {project_id}",
                "type": "error"
            })
            await websocket.close()
            return
        
        # Stream Docker container logs
        last_log_count = 0
        while True:
            try:
                # Get recent logs from container with ANSI color codes stripped
                result = subprocess.run(
                    ["docker", "logs", "--tail", "50", "--no-color", container_name],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if result.returncode == 0 and result.stdout:
                    # Send logs line by line
                    lines = result.stdout.strip().split('\n')
                    # Only send new lines to avoid spamming
                    new_lines = lines[-10:] if len(lines) > last_log_count else []
                    last_log_count = len(lines)
                    
                    for line in new_lines:
                        if line.strip():
                            # Clean up ANSI escape codes
                            ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
                            clean_line = ansi_escape.sub('', line)
                            await websocket.send_json({
                                "message": clean_line,
                                "type": "info"
                            })
                
                # Wait before next fetch
                await asyncio.sleep(2)
                
            except subprocess.TimeoutExpired:
                await websocket.send_json({
                    "message": "Container logs timeout",
                    "type": "warning"
                })
            except Exception as e:
                global_logger.log_error(f"Error in logs loop: {str(e)}")
                await websocket.send_json({
                    "message": f"Error fetching logs: {str(e)}",
                    "type": "error"
                })
                await asyncio.sleep(5)
                
    except WebSocketDisconnect:
        global_logger.log_structured(
            level=LogLevel.INFO,
            category=LogCategory.SYSTEM,
            message=f"Project logs WebSocket client disconnected for project {project_id}",
            component="websocket"
        )
    except Exception as e:
        global_logger.log_error(f"WebSocket error for project {project_id}: {str(e)}")
        global_logger.log_structured(
            level=LogLevel.ERROR,
            category=LogCategory.SYSTEM,
            message=f"Project logs WebSocket error for project {project_id}: {str(e)}",
            component="websocket"
        )


# Catch-all route for SPA - serve index.html for all frontend routes
# This must be LAST after all other routes
@app.get("/{path:path}", response_class=HTMLResponse)
async def serve_spa(path: str):
    """Serve index.html for all non-API frontend routes"""
    # Don't intercept API routes or static assets
    if path.startswith("api/") or path.startswith("static/") or path.startswith("assets/") or \
       path.startswith("avatars/") or path.startswith("icons/") or path.startswith("ws") or \
       path == "health" or path.startswith("docs") or path.startswith("openapi.json") or \
       path == "deployments" or path.startswith("deployment/") or \
       path.endswith(".html") or ("." in path.split("/")[-1] and not path.split("/")[-1].endswith(".html")):
        raise HTTPException(status_code=404, detail="Not Found")
    
    # Serve index.html for all frontend routes (dashboard, deploy, env-vars, settings, etc.)
    html_file_path = os.path.join(static_dir, "index.html")
    if os.path.exists(html_file_path):
        with open(html_file_path, "r") as f:
            return HTMLResponse(content=f.read(), status_code=200)
    else:
        raise HTTPException(status_code=404, detail="index.html not found")


if __name__ == "__main__":
    import uvicorn
    
    global_logger.log_structured(
        level=LogLevel.INFO,
        category=LogCategory.SYSTEM,
        message="Starting DevOps Butler server",
        component="main"
    )
    
    uvicorn.run(
        "orchestrator:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
