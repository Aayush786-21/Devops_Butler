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
# Create avatars directory if it doesn't exist
avatars_dir = os.path.join(static_dir, "avatars")
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
    html_file_path = os.path.join(static_dir, "applications.html")
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
                # Create avatars directory if it doesn't exist
                avatars_dir = os.path.join(os.path.dirname(__file__), "static", "avatars")
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
                    old_avatar_path = os.path.join(os.path.dirname(__file__), "static", user.avatar_url.lstrip("/"))
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
                result = await run_split_deployment(frontend_url, backend_url, user_id=current_user.id, env_dir=repo_dir)
            else:
                result = await run_deployment_pipeline(git_url, user_id=current_user.id, env_dir=repo_dir)
            
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


@app.get("/deployments")
def list_deployments(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List all deployments for the current user with real-time container status"""
    global_logger.log_user_action(
        user_id=str(current_user.id),
        action="list_deployments"
    )
    
    statement = select(Deployment).where(Deployment.user_id == current_user.id)
    deployments = session.exec(statement).all()
    
    # Get running containers
    running_containers = get_running_containers()
    
    # Convert to dict format for JSON response with real-time status
    deployment_list = []
    for deployment in deployments:
        # Check if container is actually running
        is_running = deployment.container_name in running_containers
        
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
            "status": real_status,
            "deployed_url": deployment.deployed_url,
            "created_at": deployment.created_at,
            "user_id": deployment.user_id,
            "is_running": is_running
        }
        deployment_list.append(deployment_dict)
    
    return deployment_list

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
    """WebSocket endpoint for real-time logs streaming"""
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
            "message": "Connected to logs stream",
            "type": "success"
        })
        
        # Keep connection alive and send periodic heartbeat
        while True:
            await asyncio.sleep(1)
            # Send heartbeat to keep connection alive
            await websocket.send_json({
                "message": f"Heartbeat - {datetime.datetime.utcnow().isoformat()}",
                "type": "debug"
            })
    except WebSocketDisconnect:
        global_logger.log_structured(
            level=LogLevel.INFO,
            category=LogCategory.SYSTEM,
            message="Logs WebSocket client disconnected",
            component="websocket"
        )
    except Exception as e:
        global_logger.log_structured(
            level=LogLevel.ERROR,
            category=LogCategory.SYSTEM,
            message=f"Logs WebSocket error: {str(e)}",
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
