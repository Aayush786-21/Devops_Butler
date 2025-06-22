# orchestrator.py

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl

from app_pipeline import run_pipeline 

class Project(BaseModel):
    git_url: HttpUrl

app = FastAPI()

@app.post("/deploy")
def create_deployment(project: Project):
    success = run_pipeline(str(project.git_url))
    
    if success:
        return {"status": "pipeline_successful", "git_url": project.git_url}
    else:
        print(f"pipeline failed")