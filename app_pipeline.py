import subprocess
import os
import shutil
import uuid
from docker_build import docker_build
from docker_up import docker_up
from docker_run import run_container

def run_pipeline(repo_url: str):
    project_id = f"proj-{str(uuid.uuid4())[:8]}"
    print(f"--- Starting pipeline for {repo_url} [ID: {project_id}] ---")

    repo_dir = "./temp_repo"
    if os.path.exists(repo_dir):
        shutil.rmtree(repo_dir)
    print(f"Running pipeline for {repo_url}")
    
    command = [
        "git",
        "clone",
        "--depth",
        "1",
        str(repo_url),
        repo_dir
    ]
    print(f"Cloning {repo_url} into {repo_dir}")
    subprocess.run(command, check=True)

    # Check for docker-compose file
    compose_path_yml = os.path.join(repo_dir, "docker-compose.yml")
    compose_path_yaml = os.path.join(repo_dir, "docker-compose.yaml")

    if os.path.exists(compose_path_yml) or os.path.exists(compose_path_yaml):
        print("Analysis complete: docker-compose file found. Starting compose process.")
        # Call your docker_up function
        success = docker_up(repo_url) 
        if success:
            print("--- Pipeline finished successfully via docker-compose ---")
            return True
        else:
            print("--- Pipeline FAILED during docker-compose step ---")
            return False

    # Priority 2: If no compose file, check for a Dockerfile
    elif os.path.exists(os.path.join(repo_dir, 'Dockerfile')):
        print(f"[{project_id}] Analysis complete: Dockerfile found.")
        # Pass the ID to the build function
        image_name = docker_build(repo_url, project_id) # We'll have docker_build return the name
        if image_name:
            # Pass the image_name and ID to the run function
            run_success = run_container(image_name, project_id)
            if run_success:
                print(f"--- [{project_id}] Pipeline finished successfully ---")
                return True
        print(f"--- [{project_id}] Pipeline FAILED during docker build or run step ---")
        return False
    else:
        print("Analysis failed: No 'docker-compose.yml' or 'Dockerfile' found.")
        print("--- pipeline failed ---")
        return False
    