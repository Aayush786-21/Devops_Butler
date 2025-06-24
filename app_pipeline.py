import subprocess
import os
import shutil
import uuid
from docker_build import docker_build
from docker_up import docker_up
from docker_run import run_container

def run_pipeline(repo_url: str):
    container_name = f"proj-{str(uuid.uuid4())[:8]}"
    print(f"--- Starting pipeline for {repo_url} [ID: {container_name}] ---")

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
        container_names = docker_up(repo_url)
        if container_names:
            print("--- Pipeline finished successfully via docker-compose ---")
            return container_name, container_names
        else:
            print("--- Pipeline FAILED during docker-compose step ---")
            return None, None

    # Priority 2: If no compose file, check for a Dockerfile
    elif os.path.exists(os.path.join(repo_dir, 'Dockerfile')):
        print(f"[{container_name}] Analysis complete: Dockerfile found.")
        image_name = docker_build(repo_url, container_name) # We'll have docker_build return the name
        if image_name:
            run_success = run_container(image_name, container_name)
            if run_success: 
                print(f"--- [{container_name}] Pipeline finished successfully ---")
                return container_name, [container_name]
        print(f"--- [{container_name}] Pipeline FAILED during docker build or run step ---")
        return None, None
    else:
        print("Analysis failed: No 'docker-compose.yml' or 'Dockerfile' found.")
        print("--- pipeline failed ---")
        return None, None
    