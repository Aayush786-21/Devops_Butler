import subprocess
import os
import shutil
import uuid
import asyncio
import tempfile
import re
from urllib.parse import urlparse
from docker_build import docker_build
from docker_up import docker_up
from docker_run import run_container
from connection_manager import manager
from nginx_manager import create_nginx_config, reload_nginx, delete_nginx_config
from sqlmodel import Session, select
from database import engine  
from models import Deployment
from ai_analyst import generate_dockerfile
import socket
import yaml


def validate_git_url(git_url: str) -> bool:
    """
    Validates that the URL is a valid Git repository URL.
    Returns True if valid, False otherwise.
    """
    try:
        # Remove .git extension if present
        clean_url = git_url.rstrip('.git')
        
        # Check for common invalid patterns
        invalid_patterns = [
            'hub.docker.com',  # Docker Hub URLs
            'docker.io',       # Docker Hub URLs
            'quay.io',         # Quay.io URLs
            'gcr.io',          # Google Container Registry
            'ecr.',            # AWS ECR
            'azurecr.io',      # Azure Container Registry
        ]
        
        for pattern in invalid_patterns:
            if pattern in clean_url.lower():
                return False
        
        # Handle SSH URLs (git@github.com:user/repo)
        if clean_url.startswith('git@'):
            # Basic SSH URL validation
            if ':' not in clean_url or clean_url.count(':') != 1:
                return False
            return True
        
        # Handle HTTPS URLs
        parsed = urlparse(clean_url)
        if not parsed.scheme or parsed.scheme not in ['http', 'https']:
            return False
        
        # Must have a path with at least 2 parts (user/repo)
        path_parts = parsed.path.strip('/').split('/')
        if len(path_parts) < 2:
            return False
        
        return True
        
    except Exception:
        return False


def extract_repo_name(git_url: str) -> str:
    """
    Extracts the repository name from a Git URL.
    Handles various Git URL formats:
    - https://github.com/user/repo.git
    - https://github.com/user/repo
    - git@github.com:user/repo.git
    - git@github.com:user/repo
    """
    try:
        # Remove .git extension if present
        clean_url = git_url.rstrip('.git')
        
        # Handle SSH URLs (git@github.com:user/repo)
        if clean_url.startswith('git@'):
            # Extract the part after the colon
            repo_part = clean_url.split(':')[-1]
            # Get the last part (repo name)
            repo_name = repo_part.split('/')[-1]
        else:
            # Handle HTTPS URLs (https://github.com/user/repo)
            parsed = urlparse(clean_url)
            path_parts = parsed.path.strip('/').split('/')
            repo_name = path_parts[-1] if path_parts else "unknown"
        
        # Clean up the repo name (remove any special characters)
        repo_name = re.sub(r'[^a-zA-Z0-9-]', '-', repo_name)
        # Ensure it starts with a letter or number
        if repo_name and not repo_name[0].isalnum():
            repo_name = 'repo-' + repo_name
        
        return repo_name.lower()
    except Exception as e:
        print(f"Error extracting repo name from {git_url}: {e}")
        return "unknown-repo"


def find_exposed_port(dockerfile_path: str) -> int | None:
    """
    Reads a Dockerfile and finds the first EXPOSE instruction.
    """
    try:
        with open(dockerfile_path, "r") as f:
            dockerfile_content = f.read()
            # Use regex to find "EXPOSE" followed by numbers
            match = re.search(r'^\s*EXPOSE\s+(\d+)', dockerfile_content, re.MULTILINE | re.IGNORECASE)
            if match:
                port = int(match.group(1))
                print(f"Discovered EXPOSE port {port} from Dockerfile.")
                return port
        return None
    except FileNotFoundError:
        return None


def find_free_port(start_port=1024, max_port=65535):
    """
    Finds and returns a free port on the host, starting from start_port.
    """
    for port in range(start_port, max_port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('localhost', port)) != 0:
                return port
    raise RuntimeError("No free ports available in range")


def patch_compose_ports(compose_file_path):
    """
    Patch the docker-compose file to use free host ports if the default is busy.
    """
    with open(compose_file_path, 'r') as f:
        compose_data = yaml.safe_load(f)

    services = compose_data.get('services', {})
    for service_name, service in services.items():
        ports = service.get('ports', [])
        new_ports = []
        for port_mapping in ports:
            # port_mapping can be 'host:container' or just 'container'
            if isinstance(port_mapping, str) and ':' in port_mapping:
                host_port, container_port = port_mapping.split(':', 1)
                try:
                    host_port_int = int(host_port)
                except ValueError:
                    new_ports.append(port_mapping)
                    continue
                # Check if host port is busy
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    if s.connect_ex(('localhost', host_port_int)) == 0:
                        free_port = find_free_port(host_port_int + 1)
                        print(f"Port {host_port_int} is busy, using {free_port} instead for service {service_name}")
                        new_ports.append(f"{free_port}:{container_port}")
                    else:
                        new_ports.append(port_mapping)
            else:
                new_ports.append(port_mapping)
        service['ports'] = new_ports
    with open(compose_file_path, 'w') as f:
        yaml.safe_dump(compose_data, f)


async def cleanup_orphaned_configs():
    """
    Cleans up Nginx config files that reference non-existent containers.
    This prevents Nginx from failing to start due to missing upstream hosts.
    """
    print("🧹 Checking for orphaned Nginx configs...")
    
    try:
        # Get all Nginx config files
        config_dir = "/opt/homebrew/etc/nginx/servers"
        if not os.path.exists(config_dir):
            print(f"Config directory {config_dir} does not exist")
            return
            
        config_files = [f for f in os.listdir(config_dir) if f.endswith('.conf')]
        
        for config_file in config_files:
            config_path = os.path.join(config_dir, config_file)
            try:
                with open(config_path, 'r') as f:
                    content = f.read()
                    
                # Extract container name from proxy_pass line
                import re
                match = re.search(r'proxy_pass http://([^:]+):', content)
                if match:
                    container_name = match.group(1)
                    
                    # Check if container exists
                    result = await asyncio.to_thread(
                        subprocess.run,
                        ["docker", "inspect", container_name],
                        capture_output=True,
                        text=True
                    )
                    
                    if result.returncode != 0:
                        print(f"🗑️ Removing orphaned config for non-existent container: {container_name}")
                        os.remove(config_path)
                        
            except Exception as e:
                print(f"⚠️ Error processing config file {config_file}: {e}")
                
        print("✅ Orphaned config cleanup completed")
        
    except Exception as e:
        print(f"❌ Error during orphaned config cleanup: {e}")


async def destroy_deployment(container_name: str, repo_name: str):
    """
    Stops and removes a container and its Nginx configuration.
    """
    print(f"--- Destroying previous deployment for {repo_name} ---")
    
    try:
        # 1. Stop the container
        print(f"⏩ STEP: Stopping container {container_name}")
        stop_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "stop", container_name],
            capture_output=True,
            text=True
        )
        if stop_result.returncode != 0:
            print(f"⚠️ Warning: Container {container_name} may not have been running: {stop_result.stderr}")
        
        # 2. Remove the container
        print(f"⏩ STEP: Removing container {container_name}")
        rm_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "rm", container_name],
            capture_output=True,
            text=True
        )
        if rm_result.returncode != 0:
            print(f"⚠️ Warning: Container {container_name} may not have existed: {rm_result.stderr}")
        
        print(f"✅ Stopped and removed container: {container_name}")
        
        # 3. Delete the Nginx config file
        print(f"⏩ STEP: Removing nginx config for {repo_name}")
        nginx_removed = delete_nginx_config(repo_name)
        if not nginx_removed:
            print(f"⚠️ Warning: Failed to remove nginx config for {repo_name}")
        
        # 4. Reload Nginx
        print("⏩ STEP: Reloading nginx configuration")
        await reload_nginx()
        print(f"✅ Removed Nginx config and reloaded.")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")


async def run_pipeline(repo_url: str):
    # Validate the Git URL first
    if not validate_git_url(repo_url):
        error_msg = f"❌ Invalid Git repository URL: {repo_url}. Please provide a valid Git repository URL (e.g., https://github.com/user/repo)."
        await manager.broadcast(error_msg)
        print(error_msg)
        return None, None
    
    # Clean up any orphaned Nginx configs first
    await cleanup_orphaned_configs()
    
    # Extract repository name for pretty URLs
    repo_name = extract_repo_name(repo_url)
    # The unique name for the *new* container we are about to create
    new_container_name = f"{repo_name}-{str(uuid.uuid4())[:4]}"  # A good pattern is name + short unique id
    
    # --- VERIFICATION PRINT ---
    print(f"PIPELINE STARTED. Master Name: {new_container_name}")
    print(f"Clean Repo Name: {repo_name}")
    # ------------------------
    
    # --- NEW CLEANUP STEP ---
    # Find any *old* deployments with the same repo_name in the database
    with Session(engine) as session:
        # Find a previous successful deployment for this repo
        old_deployment = session.exec(
            select(Deployment).where(Deployment.git_url == repo_url, Deployment.status == 'success')
        ).first()

        if old_deployment:
            print(f"🔍 Found previous deployment: {old_deployment.container_name}")
            # If we found one, destroy it completely before starting the new one.
            await destroy_deployment(old_deployment.container_name, repo_name)
            await manager.broadcast(f"🧹 Cleaned up previous deployment: {old_deployment.container_name}")
        else:
            print(f"✅ No previous deployment found for {repo_name}")
    # -----------------------
    
    with Session(engine) as session:
        # Create a new Deployment object with the starting status
        db_deployment = Deployment(
            container_name=new_container_name,
            git_url=repo_url,
            status="starting"
        )
        session.add(db_deployment)
        session.commit()
        session.refresh(db_deployment)
    await manager.broadcast(f"🔵 STATUS: Starting pipeline for {repo_url} [ID: {new_container_name}]")
    await manager.broadcast(f"🌐 Will be available at: http://{repo_name}.localhost:8888")
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
        try:
            await asyncio.to_thread(subprocess.run, command, check=True, capture_output=True, text=True)
            await manager.broadcast("✅ STEP-SUCCESS: Repository cloned.")
        except subprocess.CalledProcessError as e:
            error_msg = f"❌ Failed to clone repository: {e.stderr}"
            await manager.broadcast(error_msg)
            print(error_msg)
            # Update deployment status to failed
            with Session(engine) as session:
                deployment_to_update = session.get(Deployment, db_deployment.id)
                if deployment_to_update:
                    deployment_to_update.status = "failed"
                    session.add(deployment_to_update)
                    session.commit()
            return None, None
        await asyncio.sleep(1)

        # --- ANALYSIS PHASE WITH DEBUGGING ---
        print(f"--- Analysis Phase ---")
        print(f"Checking for compose file in: {repo_dir}")
        
        compose_path_yml = os.path.join(repo_dir, "docker-compose.yml")
        compose_path_yaml = os.path.join(repo_dir, "docker-compose.yaml")
        dockerfile_path = os.path.join(repo_dir, 'Dockerfile')

        compose_yml_exists = await asyncio.to_thread(os.path.exists, compose_path_yml)
        compose_yaml_exists = await asyncio.to_thread(os.path.exists, compose_path_yaml)
        dockerfile_exists = await asyncio.to_thread(os.path.exists, dockerfile_path)

        print(f"Does '{compose_path_yml}' exist? {compose_yml_exists}")
        print(f"Does '{compose_path_yaml}' exist? {compose_yaml_exists}")
        print(f"Does '{dockerfile_path}' exist? {dockerfile_exists}")

        # Check if docker-compose is a simple single-service setup or complex multi-service
        should_use_compose = False
        if compose_yml_exists or compose_yaml_exists:
            should_use_compose = True

        if (compose_yml_exists or compose_yaml_exists) and should_use_compose:
            await manager.broadcast("⏩ STEP: Docker Compose found. Running docker-compose up...")
            patch_compose_ports(compose_path_yml) # Patch ports before running compose
            service_ports = await docker_up(repo_dir)
            if service_ports:
                await manager.broadcast(f"✅ STEP-SUCCESS: Docker Compose services are up: {list(service_ports.keys())}")
                primary_container_name = list(service_ports.keys())[0]
                primary_service = service_ports[primary_container_name]
                primary_port = primary_service['internal_port']
                await manager.broadcast(f"⏩ STEP: Setting up Nginx for primary service '{primary_container_name}' on internal port {primary_port}")
                print(f"🔧 VERIFICATION: Creating Nginx config with repo_name='{repo_name}', container_name='{new_container_name}', port={primary_port}")
                nginx_success = create_nginx_config(repo_name, new_container_name, primary_port)
                if not nginx_success:
                    await manager.broadcast(f"🔴 [{new_container_name}] FATAL: Failed to create Nginx config.")
                    with Session(engine) as session:
                        deployment_to_update = session.get(Deployment, db_deployment.id)
                        if deployment_to_update:
                            deployment_to_update.status = "failed"
                            session.add(deployment_to_update)
                            session.commit()
                    await manager.broadcast("🔴 STATUS: Pipeline failed.")
                    return None, None
                await reload_nginx()
                server_url = f"http://{repo_name}.localhost:8888"
                with Session(engine) as session:
                    deployment_to_update = session.get(Deployment, db_deployment.id)
                    if deployment_to_update:
                        deployment_to_update.status = "success"
                        deployment_to_update.deployed_url = server_url
                        session.add(deployment_to_update)
                        session.commit()
                await manager.broadcast(f"🚀 SUCCESS! Deployed to: {server_url}")
                return new_container_name, service_ports
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
        elif dockerfile_exists:
            await manager.broadcast(f"[{new_container_name}] Analysis complete: Dockerfile found.")
            await asyncio.sleep(1)

            # --- NEW PORT DISCOVERY LOGIC ---
            dockerfile_path = os.path.join(repo_dir, 'Dockerfile')
            internal_port = find_exposed_port(dockerfile_path)
            
            if not internal_port:
                await manager.broadcast(f"🔴 [{new_container_name}] FATAL: Could not determine EXPOSE port from Dockerfile.")
                with Session(engine) as session:
                    deployment_to_update = session.get(Deployment, db_deployment.id)
                    if deployment_to_update:
                        deployment_to_update.status = "failed"
                        session.add(deployment_to_update)
                        session.commit()
                await manager.broadcast("🔴 STATUS: Pipeline failed.")
                return None, None

            await manager.broadcast(f"✅ [{new_container_name}] Discovered EXPOSE port: {internal_port}")
            # --------------------------------

            # Step 1: Build the image
            image_name = await docker_build(new_container_name, repo_dir)
            if not image_name:
                await manager.broadcast(f"🔴 [{new_container_name}] FATAL: Docker build failed.")
                with Session(engine) as session:
                    deployment_to_update = session.get(Deployment, db_deployment.id)
                    if deployment_to_update:
                        deployment_to_update.status = "failed"
                        session.add(deployment_to_update)
                        session.commit()
                await manager.broadcast("🔴 STATUS: Pipeline failed.")
                return None, None

            # Step 2: Run the container (no longer needs to publish ports with -P)
            # For direct Docker run, find a free port if the EXPOSE port is busy
            desired_port = internal_port
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                if s.connect_ex(('localhost', desired_port)) == 0:
                    print(f"Port {desired_port} is busy, finding a free one...")
                    desired_port = find_free_port(desired_port + 1)
                    print(f"Using free port {desired_port} for direct Docker run.")

            run_success = await run_container(image_name, new_container_name, host_port=desired_port, internal_port=internal_port)
            if not run_success:
                await manager.broadcast(f"🔴 [{new_container_name}] FATAL: Failed to start container.")
                with Session(engine) as session:
                    deployment_to_update = session.get(Deployment, db_deployment.id)
                    if deployment_to_update:
                        deployment_to_update.status = "failed"
                        session.add(deployment_to_update)
                        session.commit()
                await manager.broadcast("🔴 STATUS: Pipeline failed.")
                return None, None

            await manager.broadcast(f"✅ [{new_container_name}] Container started successfully.")
            
            # Step 3: Create the Nginx config with the discovered internal port
            print(f"🔧 VERIFICATION: Creating Nginx config with repo_name='{repo_name}', container_name='{new_container_name}', port={internal_port}")
            nginx_success = create_nginx_config(repo_name, new_container_name, internal_port)
            if not nginx_success:
                await manager.broadcast(f"🔴 [{new_container_name}] FATAL: Failed to create Nginx config.")
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

            server_url = f"http://{repo_name}.localhost:{desired_port}" # Use the found/assigned port
            with Session(engine) as session:
                deployment_to_update = session.get(Deployment, db_deployment.id)
                if deployment_to_update:
                    deployment_to_update.status = "success"
                    deployment_to_update.deployed_url = server_url
                    session.add(deployment_to_update)
                    session.commit()
            await manager.broadcast(f"🚀 SUCCESS! Application deployed at: {server_url}")
            return new_container_name, [server_url]
        # Priority 3: AI fallback
        else:
            await manager.broadcast("🤖 No config found. Engaging AI Analyst to create a Dockerfile...")
            generated_dockerfile_content = await generate_dockerfile(repo_dir)
            if generated_dockerfile_content:
                with open(os.path.join(repo_dir, "Dockerfile"), "w") as f:
                    f.write(generated_dockerfile_content)
                await manager.broadcast("✅ AI created a Dockerfile. Proceeding with standard build...")
                
                # --- NEW PORT DISCOVERY LOGIC FOR AI-GENERATED DOCKERFILE ---
                dockerfile_path = os.path.join(repo_dir, 'Dockerfile')
                internal_port = find_exposed_port(dockerfile_path)
                
                if not internal_port:
                    await manager.broadcast(f"🔴 [{new_container_name}] FATAL: Could not determine EXPOSE port from AI-generated Dockerfile.")
                    with Session(engine) as session:
                        deployment_to_update = session.get(Deployment, db_deployment.id)
                        if deployment_to_update:
                            deployment_to_update.status = "failed"
                            session.add(deployment_to_update)
                            session.commit()
                    await manager.broadcast("🔴 STATUS: Pipeline failed.")
                    return None, None

                await manager.broadcast(f"✅ [{new_container_name}] Discovered EXPOSE port from AI Dockerfile: {internal_port}")
                # ------------------------------------------------------------

                # Now, proceed with the NORMAL Dockerfile path logic!
                image_name = await docker_build(new_container_name, repo_dir)
                if not image_name:
                    await manager.broadcast(f"🔴 [{new_container_name}] FATAL: Docker build failed.")
                    with Session(engine) as session:
                        deployment_to_update = session.get(Deployment, db_deployment.id)
                        if deployment_to_update:
                            deployment_to_update.status = "failed"
                            session.add(deployment_to_update)
                            session.commit()
                    await manager.broadcast("🔴 STATUS: Pipeline failed.")
                    return None, None
                run_success = await run_container(image_name, new_container_name)
                if not run_success:
                    await manager.broadcast(f"🔴 [{new_container_name}] FATAL: Failed to start container.")
                    with Session(engine) as session:
                        deployment_to_update = session.get(Deployment, db_deployment.id)
                        if deployment_to_update:
                            deployment_to_update.status = "failed"
                            session.add(deployment_to_update)
                            session.commit()
                    await manager.broadcast("🔴 STATUS: Pipeline failed.")
                    return None, None

                await manager.broadcast(f"✅ [{new_container_name}] Container started successfully.")
                
                print(f"🔧 VERIFICATION: Creating Nginx config with repo_name='{repo_name}', container_name='{new_container_name}', port={internal_port}")
                nginx_success = create_nginx_config(repo_name, new_container_name, internal_port)
                if not nginx_success:
                    await manager.broadcast(f"🔴 [{new_container_name}] FATAL: Failed to create Nginx config.")
                    with Session(engine) as session:
                        deployment_to_update = session.get(Deployment, db_deployment.id)
                        if deployment_to_update:
                            deployment_to_update.status = "failed"
                            session.add(deployment_to_update)
                            session.commit()
                    await manager.broadcast("🔴 STATUS: Pipeline failed.")
                    return None, None
                await reload_nginx()
                server_url = f"http://{repo_name}.localhost:8888"
                with Session(engine) as session:
                    deployment_to_update = session.get(Deployment, db_deployment.id)
                    if deployment_to_update:
                        deployment_to_update.status = "success"
                        deployment_to_update.deployed_url = server_url
                        session.add(deployment_to_update)
                        session.commit()
                await manager.broadcast(f"🚀 SUCCESS! AI-powered Dockerfile deployment is live at: {server_url}")
                return new_container_name, [server_url]
            else:
                await manager.broadcast(f"🔴 [{new_container_name}] FATAL: AI Analyst failed to generate a Dockerfile.")
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
    