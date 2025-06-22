import subprocess
import os
import shutil
from docker_build import docker_build
from docker_up import docker_up

def run_pipeline(repo_url: str):

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
        print("Analysis complete: Dockerfile found. Starting build process.")
        build_success = docker_build(repo_url)
        if build_success:
            print("--- Pipeline finished build successfully ---")
            return True
        else:
            print("--- Pipeline FAILED during docker build step ---")
            return False
            
    else:
        print("Analysis failed: No 'docker-compose.yml' or 'Dockerfile' found.")
        print("--- pipeline failed ---")
        return False
    