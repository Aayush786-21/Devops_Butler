import subprocess
import os
import shutil
import uuid
import asyncio
from docker_build import docker_build
from docker_up import docker_up
from docker_run import run_container
from connection_manager import manager
from container_inspector import inspect_container
from nginx_manager import create_nginx_config, reload_nginx
from docker_helpers import get_host_port

async def run_pipeline(repo_url: str):
    container_name = f"proj-{str(uuid.uuid4())[:8]}"
    await manager.broadcast(f"🔵 STATUS: Starting pipeline for {repo_url} [ID: {container_name}]")
    await asyncio.sleep(1)

    repo_dir = "./temp_repo"
    if await asyncio.to_thread(os.path.exists, repo_dir):
        await asyncio.to_thread(shutil.rmtree, repo_dir)
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
    await asyncio.to_thread(subprocess.run, command, check=True)
    await manager.broadcast("✅ STEP-SUCCESS: Repository cloned.")
    await asyncio.sleep(1)

    # Check for docker-compose file
    compose_path_yml = os.path.join(repo_dir, "docker-compose.yml")
    compose_path_yaml = os.path.join(repo_dir, "docker-compose.yaml")

    if await asyncio.to_thread(os.path.exists, compose_path_yml) or await asyncio.to_thread(os.path.exists, compose_path_yaml):
        await manager.broadcast("⏩ STEP: Docker Compose found. Running docker-compose up...")
        service_ports = await docker_up(repo_url)
        if service_ports:
            await manager.broadcast(f"✅ STEP-SUCCESS: Docker Compose services are up: {list(service_ports.keys())}")
            primary_container_name = list(service_ports.keys())[0]
            primary_port = service_ports[primary_container_name]
            await manager.broadcast(f"⏩ STEP: Setting up Nginx for primary service '{primary_container_name}' on port {primary_port}")
            nginx_success = create_nginx_config(container_name, int(primary_port))
            if not nginx_success:
                await manager.broadcast(f"🔴 [{container_name}] FATAL: Failed to create Nginx config.")
                return None, None
            await reload_nginx()
            server_url = f"http://{container_name}.localhost:8888"
            await manager.broadcast(f"🚀 SUCCESS! Primary service is available at: {server_url}")
            return container_name, service_ports
        else:
            await manager.broadcast("❌ STEP-FAILED: Docker Compose failed to expose any services.")
            await manager.broadcast("🔴 STATUS: Pipeline failed.")
            return None, None

    # Priority 2: If no compose file, check for a Dockerfile
    elif await asyncio.to_thread(os.path.exists, os.path.join(repo_dir, 'Dockerfile')):
        await manager.broadcast(f"[{container_name}] Analysis complete: Dockerfile found.")
        await asyncio.sleep(1)

        # Step 1: Build the image
        image_name = await docker_build(repo_url, container_name)
        if not image_name:
            await manager.broadcast(f"🔴 [{container_name}] FATAL: Docker build failed.")
            return None, None

        # Step 2: Run the container
        run_success = await run_container(image_name, container_name)
        if not run_success:
            await manager.broadcast(f"🔴 [{container_name}] FATAL: Failed to start container.")
            return None, None

        # Step 3: Inspect the container to find the port
        container_details = await inspect_container(container_name)
        if not container_details:
            await manager.broadcast(f"🔴 [{container_name}] FATAL: Could not inspect container.")
            return None, None

        # Helper to extract the port
        host_port = get_host_port(container_details)
        if not host_port:
            await manager.broadcast(f"🔴 [{container_name}] FATAL: Could not find published port.")
            return None, None

        await manager.broadcast(f"✅ [{container_name}] Container is running on localhost:{host_port}")

        # Step 4: Create the Nginx config
        nginx_success = create_nginx_config(container_name, int(host_port))
        if not nginx_success:
            await manager.broadcast(f"🔴 [{container_name}] FATAL: Failed to create Nginx config.")
            return None, None

        # Step 5: Reload Nginx
        await reload_nginx()

        server_url = f"http://{container_name}.localhost:8888"
        await manager.broadcast(f"🚀 SUCCESS! Application deployed at: {server_url}")
        return container_name, [server_url]
    else:
        await manager.broadcast("Analysis failed: No 'docker-compose.yml' or 'Dockerfile' found.")
        await manager.broadcast("--- pipeline failed ---")
        await manager.broadcast("🔴 STATUS: Pipeline failed.")
        return None, None
    