# orchestrator.py
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks, Depends, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, HttpUrl
from app_pipeline import run_pipeline, extract_repo_name
from contextlib import asynccontextmanager
from database import create_db_and_tables, get_session
import subprocess
import json
from connection_manager import manager
import os
from sqlmodel import Session, select
from typing import List
from login import Deployment, User
from nginx_manager import delete_nginx_config, reload_nginx
import asyncio
from auth import authenticate_user, create_user, create_access_token, get_current_user
from github_oauth import github_oauth
from repository_tree_api import router as repository_tree_router
from datetime import timedelta

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
    print("Butler is coming to your home...")
    create_db_and_tables()
    print("Database is ready.")
    yield
    print("Butler is going his home...")

app = FastAPI(lifespan=lifespan)

static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")
app.mount("/icons", StaticFiles(directory="icons"), name="icons")

# Include repository tree API routes
app.include_router(repository_tree_router)

@app.get("/", response_class=HTMLResponse)
async def read_root():
    html_file_path = os.path.join(static_dir, "index.html")
    with open(html_file_path, "r") as f:
        return HTMLResponse(content=f.read(), status_code=200)

@app.get("/login", response_class=HTMLResponse)
async def login_page():
    html_file_path = os.path.join(static_dir, "login.html")
    with open(html_file_path, "r") as f:
        return HTMLResponse(content=f.read(), status_code=200)

@app.get("/repository-tree", response_class=HTMLResponse)
async def repository_tree_page():
    html_file_path = os.path.join(static_dir, "repository-tree.html")
    with open(html_file_path, "r") as f:
        return HTMLResponse(content=f.read(), status_code=200)

@app.post("/api/auth/login")
async def login(user_credentials: UserLogin):
    user = authenticate_user(user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password"
        )
    
    access_token_expires = timedelta(minutes=30)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username
    }

@app.post("/api/auth/register")
async def register(user_data: UserRegister):
    user = create_user(user_data.username, user_data.email, user_data.password)
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already exists"
        )
    
    return {"message": "User created successfully"}

@app.get("/api/auth/github")
async def github_login():
    """Redirect to GitHub OAuth authorization."""
    auth_url = github_oauth.get_authorization_url()
    return {"auth_url": auth_url}

@app.get("/api/auth/github/callback")
async def github_callback(code: str):
    """Handle GitHub OAuth callback."""
    try:
        # Exchange code for access token
        access_token = await github_oauth.exchange_code_for_token(code)
        if not access_token:
            raise HTTPException(status_code=400, detail="Failed to get access token from GitHub")
        
        # Get user info from GitHub
        user_info = await github_oauth.get_user_info(access_token)
        if not user_info:
            raise HTTPException(status_code=400, detail="Failed to get user info from GitHub")
        
        # Authenticate or create user
        user = await github_oauth.authenticate_or_create_user(user_info, access_token)
        if not user:
            raise HTTPException(status_code=400, detail="Failed to create or authenticate user")
        
        # Create JWT token
        jwt_token = github_oauth.create_user_token(user)
        
        # Redirect to frontend with token
        return {
            "access_token": jwt_token,
            "token_type": "bearer",
            "username": user.username,
            "auth_provider": "github"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GitHub authentication failed: {str(e)}")

@app.get("/api/user/repositories")
async def get_user_repositories(current_user: User = Depends(get_current_user)):
    """Get GitHub repositories for the authenticated user."""
    if current_user.auth_provider != "github" or not current_user.github_access_token:
        raise HTTPException(
            status_code=400, 
            detail="GitHub repositories only available for GitHub users"
        )
    
    try:
        repos = await github_oauth.get_user_repositories(
            current_user.github_access_token, 
            current_user.github_username
        )
        return {"repositories": repos}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch repositories: {str(e)}"
        )

@app.get("/api/repositories/{username}")
async def get_public_repositories(username: str):
    """Get public repositories for any GitHub username (no authentication required)."""
    try:
        # Special case for demo user - return demo repositories
        if username == "demo_user":
            repos = await github_oauth.get_demo_repositories()
            return {"repositories": repos, "username": "demo_user"}
        
        # For real GitHub usernames, fetch from GitHub API
        repos = await github_oauth.get_public_repositories_by_username(username)
        return {"repositories": repos, "username": username}
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to fetch repositories: {str(e)}"
        )

@app.post("/deploy")
async def deploy(
    git_url: str = Form(...),
    frontend_env: UploadFile = File(None),
    backend_env: UploadFile = File(None),
    current_user: User = Depends(get_current_user)
):
    try:
        import tempfile, os
        repo_dir = tempfile.mkdtemp(prefix="butler-run-")

        # Save env files if provided
        if frontend_env:
            with open(os.path.join(repo_dir, "frontend.env"), "wb") as f:
                f.write(await frontend_env.read())
        if backend_env:
            with open(os.path.join(repo_dir, "backend.env"), "wb") as f:
                f.write(await backend_env.read())

        # Run pipeline with user context
        result = await run_pipeline(git_url, user_id=current_user.id)
        if result and len(result) == 2:
            container_name, deployed_urls_or_service_ports = result
            if container_name and deployed_urls_or_service_ports:
                # Handle different return formats from run_pipeline
                if isinstance(deployed_urls_or_service_ports, list):
                    # Simple deployment - list of URLs
                    deployed_url = deployed_urls_or_service_ports[0]
                elif isinstance(deployed_urls_or_service_ports, dict):
                    # Docker compose deployment - service ports dict
                    # Extract the first service's URL
                    first_service = list(deployed_urls_or_service_ports.keys())[0]
                    service_info = deployed_urls_or_service_ports[first_service]
                    if 'external_url' in service_info:
                        deployed_url = service_info['external_url']
                    else:
                        # Fallback to constructing URL
                        repo_name = extract_repo_name(git_url)
                        deployed_url = f"http://{repo_name}.localhost:8888"
                else:
                    # Fallback
                    repo_name = extract_repo_name(git_url)
                    deployed_url = f"http://{repo_name}.localhost:8888"
                    
                return {
                    "message": "Deployment successful!", 
                    "deployed_url": deployed_url, 
                    "container_name": container_name
                }
        
        # If we get here, something went wrong
        raise Exception("Pipeline returned invalid or empty result")
    except Exception as e:
        print(f"❌ Deployment failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Deployment failed: {str(e)}")

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print(f"Client #{client_id} disconnected.")

@app.get("/deployments", response_model=List[Deployment])
def list_deployments(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Lists all deployments for the current user from the database.
    """
    statement = select(Deployment).where(Deployment.user_id == current_user.id)
    deployments = session.exec(statement).all()
    return deployments

@app.delete("/deployments/clear")
def clear_user_deployments(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes all deployment records for the current user from the database.
    """
    try:
        # Get all deployment records for the current user
        deployments_to_delete = session.exec(
            select(Deployment).where(Deployment.user_id == current_user.id)
        ).all()
        
        # Loop through them and delete each one
        for deployment in deployments_to_delete:
            session.delete(deployment)
        
        # Commit the transaction to make the deletions permanent
        session.commit()
        print(f"✅ Database cleared for user {current_user.username}.")
        return {"message": "Your deployment history has been cleared."}
    except Exception as e:
        print(f"❌ Failed to clear database for user {current_user.username}: {e}")
        raise HTTPException(status_code=500, detail="Could not clear the database.")

@app.post("/cleanup/orphaned-configs")
async def cleanup_orphaned_configs_endpoint(current_user: User = Depends(get_current_user)):
    """
    Manually triggers cleanup of orphaned Nginx config files.
    """
    try:
        from app_pipeline import cleanup_orphaned_configs
        await cleanup_orphaned_configs()
        return {"message": "Orphaned config cleanup completed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")

@app.delete("/deployments/{container_name}")
async def destroy_deployment(
    container_name: str, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """
    Destroys a deployment by stopping the container, removing nginx config, and updating the database.
    Only allows users to destroy their own deployments.
    """
    try:
        # Find the deployment in the database by container_name and user_id
        deployment = session.exec(
            select(Deployment).where(
                Deployment.container_name == container_name,
                Deployment.user_id == current_user.id
            )
        ).first()
        
        if not deployment:
            raise HTTPException(status_code=404, detail="Deployment not found or access denied")
        
        print(f"🔴 Starting destruction of deployment: {container_name}")
        
        # Extract repo name from git URL for nginx config cleanup
        repo_name = extract_repo_name(deployment.git_url)
        
        # Step 1: Remove nginx configuration
        print(f"⏩ STEP: Removing nginx config for {deployment.project_id}")
        nginx_removed = delete_nginx_config(deployment.project_id)
        if not nginx_removed:
            print(f"⚠️ Warning: Failed to remove nginx config for {repo_name}")
        
        # Step 2: Reload nginx to apply changes
        print("⏩ STEP: Reloading nginx configuration")
        await reload_nginx()
        
        # Step 3: Stop the container
        print(f"⏩ STEP: Stopping container {container_name}")
        stop_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "stop", container_name],
            capture_output=True,
            text=True
        )
        if stop_result.returncode != 0:
            print(f"⚠️ Warning: Container {container_name} may not have been running: {stop_result.stderr}")
        
        # Step 4: Remove the container
        print(f"⏩ STEP: Removing container {container_name}")
        rm_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "rm", container_name],
            capture_output=True,
            text=True
        )
        if rm_result.returncode != 0:
            print(f"⚠️ Warning: Container {container_name} may not have existed: {rm_result.stderr}")
        
        # Step 5: Update database status
        deployment.status = "destroyed"
        session.add(deployment)
        session.commit()
        
        print(f"✅ Successfully destroyed deployment: {container_name}")
        
        # Broadcast the destruction event
        await manager.broadcast(f"🗑️ DEPLOYMENT DESTROYED: {container_name} has been cleaned up")
        
        return {
            "status": "destroyed",
            "message": f"Deployment {container_name} has been successfully destroyed",
            "container_name": container_name
        }
        
    except Exception as e:
        print(f"❌ Failed to destroy deployment {container_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to destroy deployment: {str(e)}")
