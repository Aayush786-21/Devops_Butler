"""
DevOps Butler - Unified Clean Orchestrator
A simplified, reliable deployment automation platform with essential robustness features.
No Nginx proxy, no GitHub OAuth, no OpenAI dependencies - just clean, working deployment.
"""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, HttpUrl
from contextlib import asynccontextmanager
import asyncio
import os
import tempfile
from typing import List, Optional
from pathlib import Path

# Import core modules
from simple_pipeline import run_deployment_pipeline, extract_repo_name
from database import create_db_and_tables, get_session
from connection_manager import manager
from sqlmodel import Session, select
from login import Deployment, User
from auth import authenticate_user, create_user, create_access_token, get_current_user
from repository_tree_api import router as repository_tree_router, router_repos
from datetime import timedelta

# Import robust features (simplified versions)
from robust_error_handler import global_error_handler, with_error_handling, RetryConfig
from robust_logging import global_logger, LogLevel, LogCategory

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

# Setup static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")
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
@with_error_handling("user_login", "auth", RetryConfig(max_attempts=2))
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


# Deployment endpoints
@app.post("/deploy")
@with_error_handling("deployment", "deploy", RetryConfig(max_attempts=1))
async def deploy(
    git_url: str = Form(...),
    frontend_env: UploadFile = File(None),
    backend_env: UploadFile = File(None),
    current_user: User = Depends(get_current_user)
):
    """Deploy a Git repository"""
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
        # Create temporary directory for env files if provided
        repo_dir = None
        if frontend_env or backend_env:
            repo_dir = tempfile.mkdtemp(prefix="butler-env-")
            
            # Save env files
            if frontend_env:
                with open(os.path.join(repo_dir, "frontend.env"), "wb") as f:
                    f.write(await frontend_env.read())
            if backend_env:
                with open(os.path.join(repo_dir, "backend.env"), "wb") as f:
                    f.write(await backend_env.read())
        
        # Run deployment pipeline with error handling and logging
        with global_logger.timer("deployment_pipeline"):
            global_logger.add_deployment_stage(trace_id, "deployment_pipeline", "started")
            
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
        
        raise HTTPException(status_code=500, detail=f"Deployment failed: {str(e)}")


@app.get("/deployments", response_model=List[Deployment])
def list_deployments(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """List all deployments for the current user"""
    global_logger.log_user_action(
        user_id=str(current_user.id),
        action="list_deployments"
    )
    
    statement = select(Deployment).where(Deployment.user_id == current_user.id)
    deployments = session.exec(statement).all()
    return deployments

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
