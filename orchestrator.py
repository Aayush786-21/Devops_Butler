# orchestrator.py
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, HttpUrl
from app_pipeline import run_pipeline 
from contextlib import asynccontextmanager
from database import create_db_and_tables, get_session
import subprocess
import json
from connection_manager import manager
import os
from sqlmodel import Session, select
from typing import List
from models import Deployment

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
async def create_deployment(project: Project, background_tasks: BackgroundTasks):
    background_tasks.add_task(run_pipeline, str(project.git_url))
    return {
        "status": "pipeline_started_in_background",
        "message": "The deployment process has begun. Check server logs for progress."
    }

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
        