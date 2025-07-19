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
from models import Deployment
from nginx_manager import delete_nginx_config, reload_nginx
import asyncio

class Project(BaseModel):
    git_url: HttpUrl

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

@app.get("/", response_class=HTMLResponse)
async def read_root():
    html_file_path = os.path.join(static_dir, "index.html")
    with open(html_file_path, "r") as f:
        return HTMLResponse(content=f.read(), status_code=200)

@app.post("/deploy")
async def deploy(
    git_url: str = Form(...),
    frontend_env: UploadFile = File(None),
    backend_env: UploadFile = File(None)
):
    import tempfile, os
    repo_dir = tempfile.mkdtemp(prefix="butler-run-")
    # Save env files if provided
    if frontend_env:
        with open(os.path.join(repo_dir, "frontend.env"), "wb") as f:
            f.write(await frontend_env.read())
    if backend_env:
        with open(os.path.join(repo_dir, "backend.env"), "wb") as f:
            f.write(await backend_env.read())
    # Call your pipeline, passing repo_dir as the workspace
    # Example: result = await run_pipeline(git_url, repo_dir=repo_dir)
    # ...return response...

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
def list_deployments(session: Session = Depends(get_session)):
    """
    Lists all past and current deployments from the database.
    """
    statement = select(Deployment)
    deployments = session.exec(statement).all()
    return deployments

@app.delete("/deployments/clear")
def clear_all_deployments(session: Session = Depends(get_session)):
    """
    Deletes all deployment records from the database.
    """
    try:
        # Get all existing deployment records
        deployments_to_delete = session.exec(select(Deployment)).all()
        # Loop through them and delete each one
        for deployment in deployments_to_delete:
            session.delete(deployment)
        # Commit the transaction to make the deletions permanent
        session.commit()
        print("✅ Database cleared successfully.")
        return {"message": "All deployment history has been cleared."}
    except Exception as e:
        print(f"❌ Failed to clear database: {e}")
        raise HTTPException(status_code=500, detail="Could not clear the database.")

@app.post("/cleanup/orphaned-configs")
async def cleanup_orphaned_configs_endpoint():
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
async def destroy_deployment(container_name: str, session: Session = Depends(get_session)):
    """
    Destroys a deployment by stopping the container, removing nginx config, and updating the database.
    """
    try:
        # Find the deployment in the database by container_name
        deployment = session.exec(select(Deployment).where(Deployment.container_name == container_name)).first()
        if not deployment:
            raise HTTPException(status_code=404, detail="Deployment not found")
        
        print(f"🔴 Starting destruction of deployment: {container_name}")
        
        # Extract repo name from git URL for nginx config cleanup
        repo_name = extract_repo_name(deployment.git_url)
        
        # Step 1: Remove nginx configuration
        print(f"⏩ STEP: Removing nginx config for {repo_name}")
        nginx_removed = delete_nginx_config(repo_name)
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
        