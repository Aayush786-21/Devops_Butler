import subprocess
import os
import shutil
import uuid
import asyncio
import tempfile
from docker_build import docker_build
from docker_up import docker_up
from docker_run import run_container
from connection_manager import manager
from container_inspector import inspect_container
from nginx_manager import create_nginx_config, reload_nginx
from docker_helpers import get_host_port
from sqlmodel import Session 
from database import engine  
from models import Deployment
from ai_analyst import generate_dockerfile



async def run_pipeline(repo_url: str):
    container_name = f"proj-{str(uuid.uuid4())[:8]}"
    with Session(engine) as session:
        # Create a new Deployment object with the starting status
        db_deployment = Deployment(
            container_name=container_name,
            git_url=repo_url,
            status="starting"
        )
        session.add(db_deployment)
        session.commit()
        session.refresh(db_deployment)
    await manager.broadcast(f"🔵 STATUS: Starting pipeline for {repo_url} [ID: {container_name}]")
    await asyncio.sleep(1)

    # Instead of a local directory, create a unique temporary one
    repo_dir = tempfile.mkdtemp(prefix="butler-run-")
    print(f"Created temporary workspace: {repo_dir}")

    try:
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
                    with Session(engine) as session:
                        deployment_to_update = session.get(Deployment, db_deployment.id)
                        if deployment_to_update:
                            deployment_to_update.status = "failed"
                            session.add(deployment_to_update)
                            session.commit()
                    await manager.broadcast("🔴 STATUS: Pipeline failed.")
                    return None, None
                await reload_nginx()
                server_url = f"http://{container_name}.localhost:8888"
                with Session(engine) as session:
                    deployment_to_update = session.get(Deployment, db_deployment.id)
                    if deployment_to_update:
                        deployment_to_update.status = "success"
                        deployment_to_update.deployed_url = server_url
                        session.add(deployment_to_update)
                        session.commit()
                await manager.broadcast(f"🚀 SUCCESS! Deployed to: {server_url}")
                return container_name, service_ports
            else:
                await manager.broadcast("❌ STEP-FAILED: Docker Compose failed to expose any services.")
                with Session(engine) as session:
                    deployment_to_update = session.get(Deployment, db_deployment.id)
                    if deployment_to_update:
                        deployment_to_update.status = "failed"
                        session.add(deployment_to_update)
                        session.commit()
                await manager.broadcast("🔴 STATUS: Pipeline failed.")
                return None, None

        # Priority 2: If no compose file, check for a Dockerfile
        elif await asyncio.to_thread(os.path.exists, os.path.join(repo_dir, 'Dockerfile')) or ("ai_generated_dockerfile_content" in locals() and ai_generated_dockerfile_content is not None):
            await manager.broadcast(f"[{container_name}] Analysis complete: Dockerfile found.")
            await asyncio.sleep(1)

            # Step 1: Build the image
            image_name = await docker_build(container_name)
            if not image_name:
                await manager.broadcast(f"🔴 [{container_name}] FATAL: Docker build failed.")
                with Session(engine) as session:
                    deployment_to_update = session.get(Deployment, db_deployment.id)
                    if deployment_to_update:
                        deployment_to_update.status = "failed"
                        session.add(deployment_to_update)
                        session.commit()
                await manager.broadcast("🔴 STATUS: Pipeline failed.")
                return None, None

            # Step 2: Run the container
            run_success = await run_container(image_name, container_name)
            if not run_success:
                await manager.broadcast(f"🔴 [{container_name}] FATAL: Failed to start container.")
                with Session(engine) as session:
                    deployment_to_update = session.get(Deployment, db_deployment.id)
                    if deployment_to_update:
                        deployment_to_update.status = "failed"
                        session.add(deployment_to_update)
                        session.commit()
                await manager.broadcast("🔴 STATUS: Pipeline failed.")
                return None, None

            # Step 3: Inspect the container to find the port
            container_details = await inspect_container(container_name)
            if not container_details:
                await manager.broadcast(f"🔴 [{container_name}] FATAL: Could not inspect container.")
                with Session(engine) as session:
                    deployment_to_update = session.get(Deployment, db_deployment.id)
                    if deployment_to_update:
                        deployment_to_update.status = "failed"
                        session.add(deployment_to_update)
                        session.commit()
                await manager.broadcast("🔴 STATUS: Pipeline failed.")
                return None, None

            # Helper to extract the port
            host_port = get_host_port(container_details)
            if not host_port:
                await manager.broadcast(f"🔴 [{container_name}] FATAL: Could not find published port.")
                with Session(engine) as session:
                    deployment_to_update = session.get(Deployment, db_deployment.id)
                    if deployment_to_update:
                        deployment_to_update.status = "failed"
                        session.add(deployment_to_update)
                        session.commit()
                await manager.broadcast("🔴 STATUS: Pipeline failed.")
                return None, None

            await manager.broadcast(f"✅ [{container_name}] Container is running on localhost:{host_port}")

            # Step 4: Create the Nginx config
            nginx_success = create_nginx_config(container_name, int(host_port))
            if not nginx_success:
                await manager.broadcast(f"🔴 [{container_name}] FATAL: Failed to create Nginx config.")
                with Session(engine) as session:
                    deployment_to_update = session.get(Deployment, db_deployment.id)
                    if deployment_to_update:
                        deployment_to_update.status = "failed"
                        session.add(deployment_to_update)
                        session.commit()
                await manager.broadcast("🔴 STATUS: Pipeline failed.")
                return None, None

            # Step 5: Reload Nginx
            await reload_nginx()

            server_url = f"http://{container_name}.localhost:8888"
            with Session(engine) as session:
                deployment_to_update = session.get(Deployment, db_deployment.id)
                if deployment_to_update:
                    deployment_to_update.status = "success"
                    deployment_to_update.deployed_url = server_url
                    session.add(deployment_to_update)
                    session.commit()
            await manager.broadcast(f"🚀 SUCCESS! Application deployed at: {server_url}")
            return container_name, [server_url]
        # Priority 3: AI fallback
        else:
            await manager.broadcast("🤖 No config found. Engaging AI Analyst to create a Dockerfile...")
            generated_dockerfile_content = await generate_dockerfile(repo_dir)
            if generated_dockerfile_content:
                with open(os.path.join(repo_dir, "Dockerfile"), "w") as f:
                    f.write(generated_dockerfile_content)
                await manager.broadcast("✅ AI created a Dockerfile. Proceeding with standard build...")
                # Now, proceed with the NORMAL Dockerfile path logic!
                image_name = await docker_build(container_name)
                if not image_name:
                    await manager.broadcast(f"🔴 [{container_name}] FATAL: Docker build failed.")
                    with Session(engine) as session:
                        deployment_to_update = session.get(Deployment, db_deployment.id)
                        if deployment_to_update:
                            deployment_to_update.status = "failed"
                            session.add(deployment_to_update)
                            session.commit()
                    await manager.broadcast("🔴 STATUS: Pipeline failed.")
                    return None, None
                run_success = await run_container(image_name, container_name)
                if not run_success:
                    await manager.broadcast(f"🔴 [{container_name}] FATAL: Failed to start container.")
                    with Session(engine) as session:
                        deployment_to_update = session.get(Deployment, db_deployment.id)
                        if deployment_to_update:
                            deployment_to_update.status = "failed"
                            session.add(deployment_to_update)
                            session.commit()
                    await manager.broadcast("🔴 STATUS: Pipeline failed.")
                    return None, None
                container_details = await inspect_container(container_name)
                if not container_details:
                    await manager.broadcast(f"🔴 [{container_name}] FATAL: Could not inspect container.")
                    with Session(engine) as session:
                        deployment_to_update = session.get(Deployment, db_deployment.id)
                        if deployment_to_update:
                            deployment_to_update.status = "failed"
                            session.add(deployment_to_update)
                            session.commit()
                    await manager.broadcast("🔴 STATUS: Pipeline failed.")
                    return None, None
                host_port = get_host_port(container_details)
                if not host_port:
                    await manager.broadcast(f"🔴 [{container_name}] FATAL: Could not find published port.")
                    with Session(engine) as session:
                        deployment_to_update = session.get(Deployment, db_deployment.id)
                        if deployment_to_update:
                            deployment_to_update.status = "failed"
                            session.add(deployment_to_update)
                            session.commit()
                    await manager.broadcast("🔴 STATUS: Pipeline failed.")
                    return None, None
                await manager.broadcast(f"✅ [{container_name}] Container is running on localhost:{host_port}")
                nginx_success = create_nginx_config(container_name, int(host_port))
                if not nginx_success:
                    await manager.broadcast(f"🔴 [{container_name}] FATAL: Failed to create Nginx config.")
                    with Session(engine) as session:
                        deployment_to_update = session.get(Deployment, db_deployment.id)
                        if deployment_to_update:
                            deployment_to_update.status = "failed"
                            session.add(deployment_to_update)
                            session.commit()
                    await manager.broadcast("🔴 STATUS: Pipeline failed.")
                    return None, None
                await reload_nginx()
                server_url = f"http://{container_name}.localhost:8888"
                with Session(engine) as session:
                    deployment_to_update = session.get(Deployment, db_deployment.id)
                    if deployment_to_update:
                        deployment_to_update.status = "success"
                        deployment_to_update.deployed_url = server_url
                        session.add(deployment_to_update)
                        session.commit()
                await manager.broadcast(f"🚀 SUCCESS! AI-powered Dockerfile deployment is live at: {server_url}")
                return container_name, [server_url]
            else:
                await manager.broadcast(f"🔴 [{container_name}] FATAL: AI Analyst failed to generate a Dockerfile.")
                with Session(engine) as session:
                    deployment_to_update = session.get(Deployment, db_deployment.id)
                    if deployment_to_update:
                        deployment_to_update.status = "failed"
                        session.add(deployment_to_update)
                        session.commit()
                return None, None
    finally:
        # This 'finally' block ensures the temp directory is always cleaned up
        print(f"Cleaning up workspace: {repo_dir}")
        shutil.rmtree(repo_dir)
    