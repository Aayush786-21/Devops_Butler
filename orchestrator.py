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
import shutil
import tempfile
import uuid
import datetime
from typing import Dict, List, Optional
from pathlib import Path
from urllib.parse import urlparse

# Import core modules
from simple_pipeline import extract_repo_name, validate_git_url
import subprocess
from database import create_db_and_tables, get_session, engine
from connection_manager import manager
from sqlmodel import Session, select
from sqlalchemy import func
from login import Deployment, User, EnvironmentVariable
from auth import authenticate_user, create_user, create_access_token, get_current_user
from repository_tree_api import router as repository_tree_router, router_repos
from datetime import timedelta

from cloudflare_manager import (
    ensure_project_hostname,
    remove_project_hostname,
    CloudflareError,
)

# Import robust features (simplified versions)
from robust_error_handler import global_error_handler, with_error_handling, RetryConfig
from robust_logging import global_logger, LogLevel, LogCategory

# Helper functions - Process-based (no Docker)
from process_manager import process_manager as pm

def get_running_processes():
    """Get list of currently running process project IDs"""
    # Process manager tracks all running processes
    return set(pm.processes.keys()) if pm.processes else set()

def get_process_details():
    """Get detailed information about running processes"""
    processes = {}
    try:
        if not hasattr(pm, 'processes') or not pm.processes:
            return processes
        
        for project_id, process in list(pm.processes.items()):
            try:
                if process and process.poll() is None:  # Process is running
                    pid = process.pid
                    # Get deployment info from database
                    with Session(engine) as session:
                        deployment = session.exec(
                            select(Deployment).where(Deployment.container_name == project_id)
                        ).first()
                        if deployment:
                            processes[project_id] = {
                                "status": "running",
                                "pid": pid,
                                "port": deployment.port or "Unknown",
                                "uptime": "Running",  # Could calculate from process start time
                                "command": deployment.start_command or "Unknown"
                            }
            except (ProcessLookupError, AttributeError):
                # Process may have exited, skip it
                continue
            except Exception as e:
                # Skip this process on error
                continue
    except Exception as e:
        # Process manager may not be initialized yet
        pass
    return processes

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


class DomainConfigRequest(BaseModel):
    custom_domain: Optional[str] = None
    auto_generate: bool = False


def _get_butler_domain() -> str:
    domain = os.getenv("BUTLER_DOMAIN")
    if not domain:
        raise HTTPException(status_code=500, detail="BUTLER_DOMAIN environment variable is not configured")
    return domain.strip().lower()


def _slugify_project_name(name: Optional[str], fallback: str) -> str:
    base = name or fallback
    slug = re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-")
    return slug or fallback


def _default_project_domain(deployment: Deployment) -> str:
    base_domain = _get_butler_domain()
    fallback = f"project-{deployment.id}" if deployment.id else "project"
    slug = _slugify_project_name(deployment.app_name, fallback)
    # Format: project-name.butler.aayush786.xyz (with dot, not hyphen)
    return f"{slug}.{base_domain}"


def _derive_service_url(deployed_url: str) -> str:
    parsed = urlparse(deployed_url)
    if not parsed.scheme or not parsed.hostname:
        raise ValueError("Invalid deployed URL for domain mapping")

    port = parsed.port
    if not port:
        port = 443 if parsed.scheme == "https" else 80

    return f"{parsed.scheme}://{parsed.hostname}:{port}"


def _domain_response(deployment: Deployment) -> Dict[str, Optional[str]]:
    return {
        "custom_domain": deployment.custom_domain,
        "domain_status": deployment.domain_status,
        "last_domain_sync": deployment.last_domain_sync.isoformat() if deployment.last_domain_sync else None,
        "suggested_domain": _default_project_domain(deployment),
        "butler_domain": _get_butler_domain(),
    }


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

# Global exception handler to ensure all errors return JSON
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions and return JSON responses"""
    # HTTPException is already handled by FastAPI and returns JSON
    if isinstance(exc, HTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"detail": exc.detail}
        )
    
    # Handle all other exceptions
    import traceback
    error_trace = traceback.format_exc()
    global_logger.log_error(f"Unhandled exception: {str(exc)}")
    global_logger.log_error(f"Traceback: {error_trace}")
    
    # Return JSON error response
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error. Please try again later.",
            "error_type": type(exc).__name__
        }
    )

# Preflight checks for external dependencies
async def preflight_checks() -> dict:
    """Check Git availability (Docker no longer required)."""
    import subprocess
    checks = {
        'git_cli': False,
    }
    # git
    try:
        res = await asyncio.to_thread(subprocess.run, ["git", "--version"], capture_output=True, text=True)
        checks['git_cli'] = res.returncode == 0
    except Exception:
        checks['git_cli'] = False
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
    try:
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
        
        # Create VM for the new user asynchronously (don't block registration)
        # This runs in the background so user registration completes quickly
        try:
            from auth import create_user_vm
            # Create VM in background task - this runs after response is sent
            # Since we're in an async function, we can use create_task directly
            asyncio.create_task(create_user_vm(user.id))
            global_logger.log_user_action(
                user_id=str(user.id),
                action="vm_creation_started",
                details={"username": user.username, "vm_name": f"butler-user-{user.id}"}
            )
        except Exception as vm_error:
            # Log VM creation error but don't fail user registration
            global_logger.log_error(f"Failed to start VM creation for user {user.id}: {vm_error}")
            # User registration still succeeds even if VM creation fails
            # VM will be created on first deployment attempt
        
        global_logger.log_user_action(
            user_id=str(user.id),
            action="registration_success",
            details={"username": user.username, "email": user.email}
        )
        
        return {"message": "User created successfully"}
    except HTTPException:
        raise
    except Exception as e:
        global_logger.log_error(f"Registration error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create user. Please try again."
        )


# Applications API endpoint
@app.get("/api/applications")
async def get_applications():
    """Get all running applications/processes for the dashboard"""
    try:
        # Get all deployments from database
        with Session(engine) as session:
            deployments = session.exec(select(Deployment)).all()
        
        applications = []
        running_processes = get_running_processes()
        process_details = get_process_details()
        
        for deployment in deployments:
            # Check if process is running
            is_running = deployment.container_name in running_processes
            process_info = process_details.get(deployment.container_name, {})
            
            applications.append({
                'id': str(deployment.id),
                'name': deployment.container_name,
                'status': 'running' if is_running else deployment.status,
                'pid': process_info.get('pid'),
                'port': process_info.get('port') or deployment.port or 'Unknown',
                'created': deployment.created_at.isoformat() if deployment.created_at else None,
                'ports': [f"http://localhost:{deployment.port}"] if deployment.port else [],
                'url': deployment.deployed_url,
                'command': process_info.get('command') or deployment.start_command
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
    project_name: Optional[str] = Form(None),
    root_directory: Optional[str] = Form("./"),
    framework_preset: Optional[str] = Form(None),
    install_command: Optional[str] = Form(None),
    build_command: Optional[str] = Form(None),
    start_command: Optional[str] = Form(None),
    port: Optional[int] = Form(None),
    frontend_folder: Optional[str] = Form(None),
    backend_folder: Optional[str] = Form(None),
    is_monorepo: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """Deploy a Git repository (single or split frontend/backend)"""
    # Check VM status first
    with Session(engine) as session:
        user = session.exec(select(User).where(User.id == current_user.id)).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        vm_status = user.vm_status or 'creating'
        
        # If VM is being created, return error message
        if vm_status == 'creating':
            raise HTTPException(
                status_code=423,
                detail="Your virtual machine is being created. Please wait a few moments and try again."
            )
        
        # If VM creation failed, try to create it again
        if vm_status == 'failed':
            try:
                from auth import create_user_vm
                import asyncio
                asyncio.create_task(create_user_vm(user.id))
                raise HTTPException(
                    status_code=423,
                    detail="Your virtual machine creation failed. We're retrying. Please wait a few moments and try again."
                )
            except HTTPException:
                raise
            except Exception:
                pass
    
    # If git_url is not provided but project_id is, get git_url from database
    if not git_url and project_id is not None:
        with Session(engine) as session:
            existing = session.exec(
                select(Deployment).where(
                    Deployment.id == project_id,
                    Deployment.user_id == current_user.id
                )
            ).first()
            if existing and existing.git_url:
                git_url = existing.git_url
                await manager.broadcast(f"📝 Using stored Git URL from project: {git_url}")
    
    # Determine which URL(s) to use
    if deploy_type == "split":
        if not frontend_url or not backend_url:
            raise HTTPException(status_code=422, detail="Both frontend_url and backend_url are required for split deployment.")
        if not validate_git_url(frontend_url) or not validate_git_url(backend_url):
            raise HTTPException(status_code=422, detail="Invalid repository URL(s).")
        git_url = frontend_url  # Use frontend URL as primary for logging
    else:
        if not git_url:
            raise HTTPException(status_code=422, detail="git_url is required for single repository deployment. Please provide a Git URL or select an existing project.")
        if not validate_git_url(git_url):
            raise HTTPException(status_code=422, detail="Invalid or unsupported repository URL.")
    # Environment sanity checks (Docker is optional now - we use direct process execution)
    checks = await preflight_checks()
    if not checks['git_cli']:
        raise HTTPException(status_code=503, detail="Git CLI not available on server.")
    # Docker is optional - we use process-based deployment now
    # if not checks['docker_cli']:
    #     raise HTTPException(status_code=503, detail="Docker CLI not available on server.")
    # if not checks['docker_daemon']:
    #     raise HTTPException(status_code=503, detail="Docker daemon not reachable. Please start Docker Desktop.")
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
            
            # Use process-based deployment (like Vercel/Netlify)
            from process_deployment import run_process_deployment
            
            # Prepare environment variables
            env_vars_dict = {}
            if env_vars:
                env_vars_dict = {var.key: var.value for var in env_vars}
            
            if deploy_type == "split":
                # Handle split frontend/backend deployment (separate repos)
                await manager.broadcast("🚀 Deploying split repositories (Frontend + Backend) using process-based deployment")
                
                # Deploy backend first
                await manager.broadcast("🔧 Deploying backend repository...")
                backend_result = await run_process_deployment(
                    git_url=backend_url,
                    user_id=current_user.id,
                    build_command=build_command,
                    start_command=start_command,
                    port=port or 8000,
                    env_vars=env_vars_dict,
                    existing_deployment_id=existing_id,
                    parent_project_id=parent_id,
                    component_type="backend",
                    project_name=project_name
                )
                
                if not backend_result:
                    raise HTTPException(status_code=500, detail="Backend deployment failed")
                
                backend_url_deployed = backend_result[1] if isinstance(backend_result, tuple) else None
                
                # Deploy frontend with backend URL as environment variable
                await manager.broadcast("🎨 Deploying frontend repository...")
                frontend_env_vars = env_vars_dict.copy()
                if backend_url_deployed:
                    # Add backend URL to frontend environment variables
                    frontend_env_vars['REACT_APP_API_URL'] = backend_url_deployed
                    frontend_env_vars['VITE_API_URL'] = backend_url_deployed
                    frontend_env_vars['NEXT_PUBLIC_API_URL'] = backend_url_deployed
                    frontend_env_vars['API_URL'] = backend_url_deployed
                    frontend_env_vars['BACKEND_URL'] = backend_url_deployed
                    await manager.broadcast(f"🔗 Connected frontend to backend at: {backend_url_deployed}")
                
                result = await run_process_deployment(
                    git_url=frontend_url,
                    user_id=current_user.id,
                    build_command=build_command,
                    start_command=start_command,
                    port=port or 3000,
                    env_vars=frontend_env_vars,
                    existing_deployment_id=existing_id,
                    parent_project_id=parent_id,
                    component_type="frontend",
                    project_name=project_name
                )
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
                
                # Check if this is a monorepo deployment
                # Convert is_monorepo from string to boolean if needed
                is_monorepo_bool = False
                if is_monorepo:
                    if isinstance(is_monorepo, str):
                        is_monorepo_bool = is_monorepo.lower() in ('true', '1', 'yes')
                    else:
                        is_monorepo_bool = bool(is_monorepo)
                
                if is_monorepo_bool and (frontend_folder or backend_folder):
                    # Deploy monorepo (frontend + backend in same repo)
                    await manager.broadcast("📦 Detected monorepo structure, deploying frontend and backend separately...")
                    
                    # Create parent project if it doesn't exist
                    if not existing_id and not parent_id:
                        with Session(engine) as session:
                            parent_deployment = Deployment(
                                container_name=f"{extract_repo_name(git_url)}-parent",
                                git_url=git_url,
                                status="starting",
                                user_id=current_user.id
                            )
                            session.add(parent_deployment)
                            session.commit()
                            session.refresh(parent_deployment)
                            parent_id = parent_deployment.id
                    
                    # Deploy backend first if specified
                    backend_result = None
                    if backend_folder:
                        await manager.broadcast(f"🔧 Deploying backend from folder: {backend_folder}")
                        backend_result = await run_process_deployment(
                            git_url=git_url,
                            user_id=current_user.id,
                            build_command=build_command,
                            start_command=start_command,
                            port=port or 8000,
                            env_vars=env_vars_dict,
                            existing_deployment_id=None,
                            parent_project_id=parent_id,
                            component_type="backend",
                            root_directory=backend_folder,
                            project_name=project_name
                        )
                    
                    # Deploy frontend with backend URL as environment variable
                    if frontend_folder:
                        await manager.broadcast(f"🎨 Deploying frontend from folder: {frontend_folder}")
                        # Add backend URL to frontend env vars if backend was deployed
                        frontend_env_vars = env_vars_dict.copy()
                        if backend_result and isinstance(backend_result, tuple):
                            backend_url = backend_result[1]  # deployed_url
                            frontend_env_vars['REACT_APP_API_URL'] = backend_url
                            frontend_env_vars['VITE_API_URL'] = backend_url
                            frontend_env_vars['NEXT_PUBLIC_API_URL'] = backend_url
                            frontend_env_vars['API_URL'] = backend_url
                            frontend_env_vars['BACKEND_URL'] = backend_url
                            await manager.broadcast(f"🔗 Connected frontend to backend at: {backend_url}")
                        
                        result = await run_process_deployment(
                            git_url=git_url,
                            user_id=current_user.id,
                            build_command=build_command,
                            start_command=start_command,
                            port=port or 3000,
                            env_vars=frontend_env_vars,
                            existing_deployment_id=None,
                            parent_project_id=parent_id,
                            component_type="frontend",
                            root_directory=frontend_folder,
                            project_name=project_name
                        )
                    else:
                        result = backend_result
                else:
                    # Regular single deployment
                    result = await run_process_deployment(
                        git_url=git_url,
                        user_id=current_user.id,
                        build_command=build_command,
                        start_command=start_command,
                        port=port,
                        env_vars=env_vars_dict,
                        existing_deployment_id=existing_id,
                        parent_project_id=parent_id,
                        component_type=component_type,
                        root_directory=root_directory,
                        project_name=project_name
                    )
            
            # Check if deployment was successful
            if result is not None:
                if isinstance(result, tuple) and len(result) == 2:
                    project_id_str, deployed_url = result
                    if project_id_str and deployed_url:
                        global_logger.add_deployment_stage(
                            trace_id, "deployment_pipeline", "completed",
                            {"deployed_url": deployed_url, "project_id": project_id_str}
                        )
                        
                        global_logger.finish_deployment_trace(trace_id, "success", deployed_url)
                        
                        global_logger.log_user_action(
                            user_id=str(current_user.id),
                            action="deployment_success",
                            details={
                                "repo_url": git_url,
                                "deployed_url": deployed_url,
                                "project_id": project_id_str,
                                "trace_id": trace_id
                            }
                        )
                        
                        # If this was a redeploy of an imported project, ensure DB is updated with final details
                        if project_id is not None:
                            with Session(engine) as session:
                                dep = session.get(Deployment, project_id)
                                if dep:
                                    dep.status = "running"  # Process is running
                                    dep.deployed_url = deployed_url
                                    if dep.custom_domain:
                                        try:
                                            service_url = _derive_service_url(deployed_url)
                                            ensure_project_hostname(dep.custom_domain, service_url)
                                            dep.domain_status = "active"
                                            dep.last_domain_sync = datetime.datetime.utcnow()
                                        except (CloudflareError, ValueError) as exc:
                                            dep.domain_status = "error"
                                            global_logger.log_error(f"Domain sync failed for project {dep.id}: {exc}")
                                    session.add(dep)
                                    session.commit()
                        return {
                            "message": "Deployment successful!",
                            "deployed_url": deployed_url,
                            "project_id": project_id_str,
                            "trace_id": trace_id
                        }
                    else:
                        # Result has correct structure but empty/invalid values
                        error_msg = f"Deployment pipeline returned invalid values: project_id='{project_id_str}', deployed_url='{deployed_url}'"
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


@app.get("/api/vm-status")
async def get_vm_status(
    current_user: User = Depends(get_current_user)
):
    """Get VM status for current user"""
    try:
        with Session(engine) as session:
            user = session.exec(select(User).where(User.id == current_user.id)).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            vm_status = user.vm_status
            
            # If status is None, try to create VM
            if vm_status is None:
                try:
                    from auth import create_user_vm
                    import asyncio
                    asyncio.create_task(create_user_vm(user.id))
                    vm_status = 'creating'
                except Exception:
                    vm_status = 'creating'
            # If status is 'failed', check if VM actually exists (might have been created but status wasn't updated)
            elif vm_status == 'failed':
                try:
                    from vm_manager import vm_manager
                    vm_name = f"butler-user-{user.id}"
                    vm_exists = await vm_manager._check_vm_exists(vm_name)
                    if vm_exists:
                        # VM exists, update status to ready
                        user.vm_status = 'ready'
                        session.add(user)
                        session.commit()
                        vm_status = 'ready'
                except Exception as e:
                    # If check fails, keep status as failed but log the error
                    global_logger.log_error(f"Failed to verify VM existence: {str(e)}")
            
            return {
                "vm_status": vm_status or 'creating',
                "message": {
                    "creating": "Your virtual machine is being created. Please wait...",
                    "ready": "Virtual machine is ready!",
                    "failed": "Virtual machine creation failed. Please check that OrbStack is installed and running, then try again."
                }.get(vm_status or 'creating', "Unknown status")
            }
    except Exception as e:
        global_logger.log_error(f"Failed to get VM status: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get VM status")

@app.post("/api/import")
async def import_repository(
    git_url: str = Form(...),
    app_name: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    """Import a repository without deploying it - just create a project record"""
    try:
        # Check VM status first
        with Session(engine) as session:
            user = session.exec(select(User).where(User.id == current_user.id)).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            vm_status = user.vm_status or 'creating'
            
            # If VM is being created, return error message
            if vm_status == 'creating':
                raise HTTPException(
                    status_code=423,
                    detail="Your virtual machine is being created. Please wait a few moments and try again."
                )
            
            # If VM creation failed, try to create it again
            if vm_status == 'failed':
                try:
                    from auth import create_user_vm
                    import asyncio
                    asyncio.create_task(create_user_vm(user.id))
                    raise HTTPException(
                        status_code=423,
                        detail="Your virtual machine creation failed. We're retrying. Please wait a few moments and try again."
                    )
                except HTTPException:
                    raise
                except Exception:
                    pass
        
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
    except HTTPException:
        # Re-raise HTTPException (like 423 for VM status) without logging as error
        raise
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
        # Check VM status first
        with Session(engine) as session:
            user = session.exec(select(User).where(User.id == current_user.id)).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            vm_status = user.vm_status or 'creating'
            
            # If VM is being created, return error message
            if vm_status == 'creating':
                raise HTTPException(
                    status_code=423,
                    detail="Your virtual machine is being created. Please wait a few moments and try again."
                )
            
            # If VM creation failed, try to create it again
            if vm_status == 'failed':
                try:
                    from auth import create_user_vm
                    import asyncio
                    asyncio.create_task(create_user_vm(user.id))
                    raise HTTPException(
                        status_code=423,
                        detail="Your virtual machine creation failed. We're retrying. Please wait a few moments and try again."
                    )
                except HTTPException:
                    raise
                except Exception:
                    pass
        
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
        # Re-raise HTTPException (like 423 for VM status) without logging as error
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

@app.get("/api/detect-monorepo")
async def detect_monorepo(
    git_url: str = None,
    project_id: Optional[int] = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Detect if a repository has monorepo structure (frontend + backend folders)"""
    from dockerfile_parser import detect_monorepo_structure
    import tempfile
    import shutil
    
    # Get git_url from project if project_id provided
    if project_id and not git_url:
        deployment = session.exec(
            select(Deployment).where(
                Deployment.id == project_id,
                Deployment.user_id == current_user.id
            )
        ).first()
        if deployment:
            git_url = deployment.git_url
    
    if not git_url:
        raise HTTPException(status_code=400, detail="git_url or project_id required")
    
    # Clone repo temporarily to detect structure
    temp_dir = tempfile.mkdtemp(prefix="butler-monorepo-detect-")
    try:
        clone_result = await asyncio.to_thread(
            subprocess.run,
            ["git", "clone", "--depth", "1", git_url, temp_dir],
            capture_output=True,
            text=True,
            timeout=60,
            env={**os.environ, "GIT_TERMINAL_PROMPT": "0"}
        )
        
        if clone_result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Failed to clone repository: {clone_result.stderr}")
        
        # Detect monorepo structure
        monorepo_info = detect_monorepo_structure(temp_dir)
        
        if monorepo_info:
            return {
                "is_monorepo": True,
                "frontend_folder": monorepo_info.get('frontend_dir'),
                "backend_folder": monorepo_info.get('backend_dir')
            }
        else:
            return {
                "is_monorepo": False,
                "frontend_folder": None,
                "backend_folder": None
            }
    finally:
        # Cleanup
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)


@app.get("/deployments")
def list_deployments(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List all deployments for the current user with real-time process status and metrics"""
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
    
    # Get detailed process information
    process_details = get_process_details()
    running_processes = get_running_processes()
    
    # Convert to dict format for JSON response with real-time status and metrics
    deployment_list = []
    for deployment in deployments:
        # Check if process is actually running
        is_running = deployment.container_name in running_processes and pm.is_process_running(deployment.container_name)
        
        # Get detailed process info if running
        process_info = process_details.get(deployment.container_name, {})
        
        # Determine real status
        if is_running:
            real_status = "running"
        elif deployment.status == "success" or deployment.status == "running":
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
            "custom_domain": deployment.custom_domain,
            "domain_status": deployment.domain_status,
            "last_domain_sync": deployment.last_domain_sync,
            "created_at": deployment.created_at,
            "updated_at": deployment.updated_at,
            "user_id": deployment.user_id,
            "is_running": is_running,
            "process_pid": process_info.get("pid") or deployment.process_pid,
            "port": process_info.get("port") or deployment.port,
            "start_command": deployment.start_command,
            "build_command": deployment.build_command,
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
    
    # Get process details
    process_details = get_process_details()
    running_processes = get_running_processes()
    
    component_list = []
    for component in components:
        is_running = component.container_name in running_processes and pm.is_process_running(component.container_name)
        process_info = process_details.get(component.container_name, {})
        
        if is_running:
            real_status = "running"
        elif component.status == "success" or component.status == "running":
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
            "process_pid": process_info.get("pid") or component.process_pid,
            "port": process_info.get("port") or component.port,
            "start_command": component.start_command,
            "build_command": component.build_command,
            "created_at": component.created_at,
            "updated_at": component.updated_at
        })
    
    return {"components": component_list}


@app.get("/projects/{project_id}/domain")
def get_project_domain(
    project_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    deployment = session.exec(
        select(Deployment).where(
            Deployment.id == project_id,
            Deployment.user_id == current_user.id
        )
    ).first()

    if not deployment:
        raise HTTPException(status_code=404, detail="Project not found")

    if deployment.parent_project_id is not None:
        raise HTTPException(status_code=400, detail="Domain configuration is only available for main projects")

    return _domain_response(deployment)


@app.post("/projects/{project_id}/domain")
def configure_project_domain(
    project_id: int,
    payload: DomainConfigRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    deployment = session.exec(
        select(Deployment).where(
            Deployment.id == project_id,
            Deployment.user_id == current_user.id
        )
    ).first()

    if not deployment:
        raise HTTPException(status_code=404, detail="Project not found")

    if deployment.parent_project_id is not None:
        raise HTTPException(status_code=400, detail="Domain configuration is only available for main projects")

    base_domain = _get_butler_domain()

    desired = payload.custom_domain.strip().lower() if payload.custom_domain else ""
    if payload.auto_generate or not desired:
        desired = _default_project_domain(deployment)

    desired = desired.rstrip('.').lower()

    if not desired:
        raise HTTPException(status_code=400, detail="Domain cannot be empty")

    if not re.fullmatch(r"[a-z0-9.-]+", desired):
        raise HTTPException(status_code=400, detail="Domain may only contain letters, numbers, hyphens, and dots")

    if not desired.endswith(base_domain):
        raise HTTPException(status_code=400, detail=f"Domain must end with {base_domain}")

    if desired == base_domain:
        raise HTTPException(status_code=400, detail="Please choose a subdomain instead of the platform root domain")

    # Validate that the domain has at least one label before the platform domain
    # Extract the prefix (everything before the platform domain)
    if desired.endswith('.' + base_domain):
        prefix = desired[:-len(base_domain)-1]  # Remove '.' + base_domain
    elif desired.endswith(base_domain):
        prefix = desired[:-len(base_domain)]  # Remove base_domain
        if prefix and prefix.endswith('.'):
            prefix = prefix[:-1]  # Remove trailing dot if present
    else:
        prefix = ''
    
    if not prefix or prefix == '':
        raise HTTPException(status_code=400, detail="Domain must have at least one subdomain label before the platform domain")
    
    # Validate prefix format (no consecutive dots, no leading/trailing dots)
    if '..' in prefix:
        raise HTTPException(status_code=400, detail="Invalid domain prefix format. Cannot have consecutive dots.")
    
    if prefix.startswith('.') or prefix.endswith('.'):
        raise HTTPException(status_code=400, detail="Invalid domain prefix format. Cannot have leading or trailing dots.")

    # Ensure domain is not already used by another deployment (check across all users)
    existing_domain = session.exec(
        select(Deployment).where(
            Deployment.custom_domain.is_not(None),
            func.lower(Deployment.custom_domain) == desired,
            Deployment.id != deployment.id  # Exclude current deployment
        )
    ).first()

    if existing_domain:
        # Check if it's used by another user
        if existing_domain.user_id != current_user.id:
            # Get the user who owns this domain
            domain_owner = session.get(User, existing_domain.user_id)
            owner_name = domain_owner.username if domain_owner else "another user"
            raise HTTPException(
                status_code=409, 
                detail=f"This domain is already in use by {owner_name}. Please choose a different domain."
            )
        else:
            # Same user but different project
            raise HTTPException(
                status_code=409, 
                detail=f"This domain is already linked to project '{existing_domain.app_name or existing_domain.container_name}'. Remove it there first or choose a different domain."
            )

    # Determine if we can sync with Cloudflare now or after deployment
    service_url: Optional[str] = None
    if deployment.deployed_url:
        try:
            service_url = _derive_service_url(deployment.deployed_url)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    deployment.custom_domain = desired

    if service_url:
        try:
            ensure_project_hostname(desired, service_url)
            deployment.domain_status = "active"
            deployment.last_domain_sync = datetime.datetime.utcnow()
            action_name = "domain_configured"
        except CloudflareError as exc:
            global_logger.log_error(f"Cloudflare configuration failed: {exc}")
            deployment.domain_status = "error"
            session.add(deployment)
            session.commit()
            raise HTTPException(status_code=502, detail=f"Failed to configure Cloudflare: {exc}")
    else:
        deployment.domain_status = "pending"
        deployment.last_domain_sync = None
        action_name = "domain_pending"

    session.add(deployment)
    session.commit()

    global_logger.log_user_action(
        user_id=str(current_user.id),
        action=action_name,
        details={
            "project_id": project_id,
            "custom_domain": desired,
            "service_url": service_url,
        }
    )

    return _domain_response(deployment)


@app.delete("/projects/{project_id}/domain")
def clear_project_domain(
    project_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    deployment = session.exec(
        select(Deployment).where(
            Deployment.id == project_id,
            Deployment.user_id == current_user.id
        )
    ).first()

    if not deployment:
        raise HTTPException(status_code=404, detail="Project not found")

    if deployment.parent_project_id is not None:
        raise HTTPException(status_code=400, detail="Domain configuration is only available for main projects")

    if deployment.custom_domain:
        try:
            remove_project_hostname(deployment.custom_domain)
        except CloudflareError as exc:
            global_logger.log_error(f"Cloudflare domain removal failed: {exc}")
            raise HTTPException(status_code=502, detail=f"Failed to remove Cloudflare domain: {exc}")

    deployment.custom_domain = None
    deployment.domain_status = None
    deployment.last_domain_sync = None
    session.add(deployment)
    session.commit()

    global_logger.log_user_action(
        user_id=str(current_user.id),
        action="domain_cleared",
        details={"project_id": project_id}
    )

    return _domain_response(deployment)


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
    """Get logs for a specific project/process"""
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
            
            # Get process logs from process manager
            try:
                logs = pm.get_process_logs(deployment.container_name, lines=100)
                logs_text = "\n".join(logs) if logs else "No logs available"
            except Exception as e:
                logs_text = f"Error retrieving logs: {str(e)}"
            
            return {
                "project_id": project_id,
                "container_name": deployment.container_name,
                "logs": logs_text,
                "is_running": pm.is_process_running(deployment.container_name)
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
    """Restart a specific project/process"""
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
            
            if not deployment.start_command or not deployment.project_dir:
                raise HTTPException(status_code=400, detail="Project not properly deployed. Missing start command or project directory.")
            
            # Restart process using process manager
            try:
                # Prepare environment variables
                env_vars = {}
                env_vars_list = session.exec(
                    select(EnvironmentVariable).where(EnvironmentVariable.user_id == current_user.id)
                ).all()
                if env_vars_list:
                    env_vars = {var.key: var.value for var in env_vars_list}
                
                success, pid, error = await pm.restart_process(
                    project_id=deployment.container_name,
                    command=deployment.start_command,
                    cwd=deployment.project_dir,
                    env=env_vars,
                    port=deployment.port
                )
                
                if success:
                    # Update deployment in database
                    deployment.process_pid = pid
                    deployment.status = "running"
                    session.add(deployment)
                    session.commit()
                    
                    global_logger.log_user_action(
                        user_id=str(current_user.id),
                        action="restart_project",
                        details={"project_id": project_id, "container_name": deployment.container_name}
                    )
                    return {
                        "project_id": project_id,
                        "container_name": deployment.container_name,
                        "status": "restarted",
                        "message": "Project restarted successfully",
                        "pid": pid
                    }
                else:
                    raise HTTPException(status_code=500, detail=f"Failed to restart process: {error}")
                    
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error restarting process: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        global_logger.log_error(f"Error restarting project: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to restart project")


# Delete project: stop process, remove project directory, delete DB + env vars
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

            # Stop process if running
            try:
                await pm.stop_process(container_name)
            except Exception as e:
                global_logger.log_error(f"Error stopping process {container_name}: {e}")

            # Remove project directory if it exists
            if deployment.project_dir and os.path.exists(deployment.project_dir):
                try:
                    shutil.rmtree(deployment.project_dir, ignore_errors=True)
                except Exception as e:
                    global_logger.log_error(f"Error removing project directory {deployment.project_dir}: {e}")

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
                
                # Stop child process
                try:
                    await pm.stop_process(child_container_name)
                except Exception:
                    pass
                
                # Remove child project directory
                if child.project_dir and os.path.exists(child.project_dir):
                    try:
                        shutil.rmtree(child.project_dir, ignore_errors=True)
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
                details={"project_id": project_id, "container_name": container_name}
            )

            return {"message": "Project deleted"}
    except HTTPException:
        raise
    except Exception as e:
        global_logger.log_error(f"Error deleting project: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete project")


@app.delete("/api/user/account")
async def delete_user_account(
    current_user: User = Depends(get_current_user)
):
    """
    Delete user account and all associated data:
    - All deployments (stop processes, delete directories)
    - All environment variables
    - VM
    - User account
    """
    try:
        from vm_manager import vm_manager
        
        with Session(engine) as session:
            # Get all deployments for the user
            deployments = session.exec(
                select(Deployment).where(Deployment.user_id == current_user.id)
            ).all()
            
            # Expected VM name for this user
            expected_vm_name = f"butler-user-{current_user.id}"
            vm_name = None
            vm_exists = False
            
            # Check if VM exists (even if no deployments reference it)
            try:
                vm_exists = await vm_manager._check_vm_exists(expected_vm_name)
                if vm_exists:
                    vm_name = expected_vm_name
            except Exception as e:
                global_logger.log_error(f"Error checking VM existence: {e}")
            
            # Process each deployment
            for deployment in deployments:
                try:
                    # Use deployment's VM name if set, otherwise use expected VM name
                    deployment_vm_name = deployment.vm_name or expected_vm_name
                    
                    # Stop process if running (inside VM)
                    if deployment.process_pid:
                        try:
                            # Stop the process inside the VM using kill
                            await vm_manager.exec_in_vm(
                                deployment_vm_name,
                                f"kill -9 {deployment.process_pid} 2>/dev/null || true",
                                cwd=deployment.project_dir if deployment.project_dir else None
                            )
                        except Exception as e:
                            global_logger.log_error(f"Error stopping process {deployment.process_pid} in VM: {e}")
                    
                    # Remove Cloudflare DNS records if domain exists
                    if deployment.custom_domain:
                        try:
                            await remove_project_hostname(deployment.custom_domain)
                        except Exception as e:
                            global_logger.log_error(f"Error removing Cloudflare hostname {deployment.custom_domain}: {e}")
                    
                    # Delete project directory inside VM if it exists
                    if deployment.project_dir:
                        try:
                            # Remove project directory inside VM
                            await vm_manager.exec_in_vm(
                                deployment_vm_name,
                                f"rm -rf {deployment.project_dir} 2>/dev/null || true"
                            )
                        except Exception as e:
                            global_logger.log_error(f"Error removing project directory {deployment.project_dir} from VM: {e}")
                    
                    # Also try to remove from host if it exists (legacy deployments)
                    if deployment.project_dir and os.path.exists(deployment.project_dir):
                        try:
                            shutil.rmtree(deployment.project_dir, ignore_errors=True)
                        except Exception as e:
                            global_logger.log_error(f"Error removing project directory {deployment.project_dir} from host: {e}")
                    
                    # Delete related environment variables
                    env_vars = session.exec(
                        select(EnvironmentVariable).where(
                            EnvironmentVariable.user_id == current_user.id,
                            EnvironmentVariable.project_id == deployment.id
                        )
                    ).all()
                    for ev in env_vars:
                        session.delete(ev)
                    
                    # Delete child deployments if this is a parent project
                    child_deployments = session.exec(
                        select(Deployment).where(
                            Deployment.parent_project_id == deployment.id,
                            Deployment.user_id == current_user.id
                        )
                    ).all()
                    
                    for child in child_deployments:
                        # Use child's VM name if set, otherwise use expected VM name
                        child_vm_name = child.vm_name or expected_vm_name
                        
                        # Stop child process
                        if child.process_pid:
                            try:
                                await vm_manager.exec_in_vm(
                                    child_vm_name,
                                    f"kill -9 {child.process_pid} 2>/dev/null || true",
                                    cwd=child.project_dir if child.project_dir else None
                                )
                            except Exception:
                                pass
                        
                        # Remove child project directory
                        if child.project_dir:
                            try:
                                await vm_manager.exec_in_vm(
                                    child_vm_name,
                                    f"rm -rf {child.project_dir} 2>/dev/null || true"
                                )
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
                    
                    # Delete deployment record
                    session.delete(deployment)
                        
                except Exception as e:
                    global_logger.log_error(f"Error processing deployment {deployment.id} for deletion: {e}")
                    # Continue with other deployments even if one fails
            
            # Delete all remaining environment variables (safety net)
            remaining_env_vars = session.exec(
                select(EnvironmentVariable).where(EnvironmentVariable.user_id == current_user.id)
            ).all()
            for ev in remaining_env_vars:
                session.delete(ev)
            
            # Delete VM if it exists
            if vm_exists and vm_name:
                try:
                    vm_deleted = await vm_manager.delete_vm(vm_name, current_user.id)
                    if vm_deleted:
                        global_logger.log_user_action(
                            user_id=str(current_user.id),
                            action="vm_deleted",
                            details={"vm_name": vm_name}
                        )
                except Exception as e:
                    global_logger.log_error(f"Error deleting VM {vm_name}: {e}")
                    # Continue with user deletion even if VM deletion fails
            
            # Delete user account
            session.delete(current_user)
            session.commit()
            
            global_logger.log_user_action(
                user_id=str(current_user.id),
                action="account_deleted",
                details={"username": current_user.username, "email": current_user.email}
            )
            
            return {"message": "Account deleted successfully"}
            
    except Exception as e:
        global_logger.log_error(f"Error deleting user account: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete account")


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
    """WebSocket endpoint for project-specific process logs streaming"""
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
            "message": "Connected to process logs stream",
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
                "message": f"No project found for project {project_id}",
                "type": "error"
            })
            await websocket.close()
            return
        
        # Stream process logs
        last_log_count = 0
        while True:
            try:
                # Get recent logs from process manager
                logs = pm.get_process_logs(container_name, lines=50)
                
                if logs:
                    # Only send new lines to avoid spamming
                    new_lines = logs[-10:] if len(logs) > last_log_count else []
                    last_log_count = len(logs)
                    
                    for line in new_lines:
                        if line.strip():
                            await websocket.send_json({
                                "message": line.strip(),
                                "type": "info"
                            })
                elif not pm.is_process_running(container_name):
                    # Process is not running
                    await websocket.send_json({
                        "message": "Process is not running",
                        "type": "warning"
                    })
                    await asyncio.sleep(5)
                
                # Wait before next fetch
                await asyncio.sleep(2)
                
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
    import subprocess
    import time
    
    # Check if port 8000 is already in use and kill the process
    def free_port_8000():
        """Kill any process using port 8000 to prevent 'Address already in use' errors"""
        try:
            # Find processes using port 8000
            result = subprocess.run(
                ["lsof", "-ti", ":8000"],
                capture_output=True,
                text=True
            )
            if result.returncode == 0 and result.stdout.strip():
                pids = result.stdout.strip().split('\n')
                print(f"⚠️  Found {len(pids)} process(es) using port 8000. Cleaning up...")
                for pid in pids:
                    try:
                        subprocess.run(["kill", "-9", pid], check=True)
                        print(f"   Killed process {pid}")
                    except subprocess.CalledProcessError:
                        pass
                # Give it a moment to free the port
                time.sleep(0.5)
        except FileNotFoundError:
            # lsof not available (unlikely on macOS, but handle gracefully)
            pass
        except Exception as e:
            print(f"⚠️  Warning: Could not check port 8000: {e}")
    
    # Free port 8000 before starting
    free_port_8000()
    
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
