import subprocess
import os
import shutil
import uuid
import asyncio
from docker_build import docker_build
from docker_up import docker_up
from docker_run import run_container
from connection_manager import manager

async def run_pipeline(repo_url: str):
    container_name = f"proj-{str(uuid.uuid4())[:8]}"
    await manager.broadcast(f"🔵 STATUS: Starting pipeline for {repo_url} [ID: {container_name}]")
    await asyncio.sleep(1)

    repo_dir = "./temp_repo"
    if os.path.exists(repo_dir):
        shutil.rmtree(repo_dir)
    await manager.broadcast(f"Running pipeline for {repo_url}")
    await asyncio.sleep(1)
    
    command = [
        "git",
        "clone",
        "--depth",
        "1",
        str(repo_url),
        repo_dir
    ]
    await manager.broadcast("⏩ STEP: Cloning repository...")
    subprocess.run(command, check=True)
    await manager.broadcast("✅ STEP-SUCCESS: Repository cloned.")
    await asyncio.sleep(1)

    # Check for docker-compose file
    compose_path_yml = os.path.join(repo_dir, "docker-compose.yml")
    compose_path_yaml = os.path.join(repo_dir, "docker-compose.yaml")

    if os.path.exists(compose_path_yml) or os.path.exists(compose_path_yaml):
        await manager.broadcast("⏩ STEP: Docker Compose found. Running docker-compose up...")
        container_names = docker_up(repo_url)
        if container_names:
            await manager.broadcast("✅ STEP-SUCCESS: Docker Compose finished.")
            await manager.broadcast("🟢 STATUS: Pipeline finished successfully.")
            return container_name, container_names
        else:
            await manager.broadcast("❌ STEP-FAILED: Docker Compose failed.")
            await manager.broadcast("🔴 STATUS: Pipeline failed.")
            return None, None

    # Priority 2: If no compose file, check for a Dockerfile
    elif os.path.exists(os.path.join(repo_dir, 'Dockerfile')):
        await manager.broadcast(f"[{container_name}] Analysis complete: Dockerfile found.")
        image_name = docker_build(repo_url, container_name) # We'll have docker_build return the name
        if image_name:
            await manager.broadcast("⏩ STEP: Running container from built image...")
            run_success = run_container(image_name, container_name)
            if run_success: 
                await manager.broadcast(f"--- [{container_name}] Pipeline finished successfully ---")
                await manager.broadcast("🟢 STATUS: Pipeline finished successfully.")
                return container_name, [container_name]
        await manager.broadcast(f"--- [{container_name}] Pipeline FAILED during docker build or run step ---")
        await manager.broadcast("🔴 STATUS: Pipeline failed.")
        return None, None
    else:
        await manager.broadcast("Analysis failed: No 'docker-compose.yml' or 'Dockerfile' found.")
        await manager.broadcast("--- pipeline failed ---")
        await manager.broadcast("🔴 STATUS: Pipeline failed.")
        return None, None
    