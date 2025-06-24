# orchestrator.py
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks
from pydantic import BaseModel, HttpUrl
from app_pipeline import run_pipeline 
import subprocess
import json
from connection_manager import manager

class Project(BaseModel):
    git_url: HttpUrl

app = FastAPI()

def inspect_container(container_name: str):
    try:
        result = subprocess.run(
            ["docker", "inspect", container_name],
            capture_output=True,
            text=True,
            check=True
        )
        inspect_data = json.loads(result.stdout)
        return inspect_data[0]
    except subprocess.CalledProcessError as e:
        print(f"Failed to inspect container: {e.stderr}")
        return None

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
        