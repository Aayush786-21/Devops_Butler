# orchestrator.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
from app_pipeline import run_pipeline 
import subprocess
import json

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
def create_deployment(project: Project):
    container_name, container_names = run_pipeline(str(project.git_url))
    
    if container_name and container_names:
        ports_info = {}
        for name in container_names:
            details = inspect_container(name)
            if details and "NetworkSettings" in details and "Ports" in details["NetworkSettings"]:
                ports_info[name] = details["NetworkSettings"]["Ports"]
            else:
                ports_info[name] = {}
        return {
            "status": "pipeline_successful",
            "git_url": project.git_url,
            "container_name": container_name,
            "containers": ports_info
        }
    else:
        print(f"pipeline failed")
        raise HTTPException(status_code=500, detail="Pipeline failed")