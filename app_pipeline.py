import subprocess
import os
import shutil
import uuid
import asyncio
import tempfile
import re
from urllib.parse import urlparse
from docker_build import docker_build, cleanup_old_images
from docker_up import docker_up
from docker_run import run_container
from connection_manager import manager
from nginx_manager import create_nginx_config, reload_nginx, delete_nginx_config

async def ensure_nginx_proxy_running():
    """
    Ensures the nginx proxy container is running before deployment using bulletproof methods.
    """
    from nginx_manager import create_bulletproof_nginx_container, validate_nginx_config
    
    print("🛡️ Ensuring bulletproof nginx proxy is ready...")
    
    # First validate and clean any problematic configs
    await validate_nginx_config()
    
    # Use the bulletproof container creation
    if await create_bulletproof_nginx_container():
        print("✅ Bulletproof nginx proxy is ready")
        return True
    else:
        print("❌ Failed to ensure nginx proxy readiness")
        return False
from sqlmodel import Session, select
from database import engine  
from login import Deployment
from ai_analyst import generate_dockerfile, ai_patch_docker_compose
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
    Handles various Git URL formats and creates a more unique identifier.
    """
    try:
        # Remove .git extension if present
        clean_url = git_url.rstrip('.git')
        
        # Handle SSH URLs (git@github.com:user/repo)
        if clean_url.startswith('git@'):
            # Extract the part after the colon
            repo_part = clean_url.split(':')[-1]
            # Get user and repo parts
            parts = repo_part.split('/')
            if len(parts) >= 2:
                user_name = parts[-2]
                repo_name = parts[-1]
            else:
                user_name = "unknown"
                repo_name = parts[-1] if parts else "unknown"
        else:
            # Handle HTTPS URLs (https://github.com/user/repo)
            parsed = urlparse(clean_url)
            path_parts = parsed.path.strip('/').split('/')
            if len(path_parts) >= 2:
                user_name = path_parts[-2]
                repo_name = path_parts[-1]
            else:
                user_name = "unknown"
                repo_name = path_parts[-1] if path_parts else "unknown"
        
        # Clean up names (remove any special characters)
        user_name = re.sub(r'[^a-zA-Z0-9-]', '-', user_name)
        repo_name = re.sub(r'[^a-zA-Z0-9-]', '-', repo_name)
        
        # Create a more unique identifier that includes user
        unique_name = f"{user_name}-{repo_name}"
        
        # Ensure it starts with a letter or number
        if unique_name and not unique_name[0].isalnum():
            unique_name = 'repo-' + unique_name
        
        return unique_name.lower()
    except Exception as e:
        print(f"Error extracting repo name from {git_url}: {e}")
        return f"unknown-repo-{str(uuid.uuid4())[:8]}"


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


async def detect_running_port(container_name: str) -> int | None:
    """
    Detects what port a running container is actually listening on by inspecting its logs, processes, and configuration.
    Enhanced to handle nginx containers and various application types.
    """
    try:
        # First, check if this is an nginx container by inspecting the image
        inspect_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "inspect", container_name, "--format", "{{.Config.Image}}"],
            capture_output=True,
            text=True
        )
        
        is_nginx = False
        if inspect_result.returncode == 0:
            image_name = inspect_result.stdout.strip().lower()
            is_nginx = 'nginx' in image_name
            print(f"🔍 Container image: {image_name}, is_nginx: {is_nginx}")
        
        # For nginx containers, default to port 80
        if is_nginx:
            print(f"🌐 Detected nginx container, using port 80")
            return 80
        
        # For non-nginx containers, try to detect from logs
        logs_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "logs", "--tail", "50", container_name],
            capture_output=True,
            text=True
        )
        
        if logs_result.returncode == 0:
            logs = logs_result.stdout + logs_result.stderr  # Check both stdout and stderr
            print(f"📋 Container logs for port detection (last 500 chars):\n{logs[-500:]}")
            
            # Enhanced patterns for port detection in logs
            port_patterns = [
                r'listening on.*?:(\d+)',
                r'server.*?running.*?on.*?:(\d+)',
                r'Local:\s+http://localhost:(\d+)',
                r'➜\s+Local:\s+http://localhost:(\d+)',
                r'listening.*?port\s+(\d+)',
                r'started.*?on.*?port\s+(\d+)',
                r'server.*?listening.*?(\d+)',
                r'running.*?on.*?port\s+(\d+)',
                r'Listening on port (\d+)',
                r'Server running on .*:(\d+)',
                r'listening on (\d+)',
                r'.*:(\d+)',  # Generic pattern as last resort
            ]
            
            for pattern in port_patterns:
                matches = re.findall(pattern, logs, re.IGNORECASE)
                if matches:
                    # Filter out common non-port numbers
                    valid_ports = [int(m) for m in matches if 1024 <= int(m) <= 65535 or int(m) == 80]
                    if valid_ports:
                        detected_port = valid_ports[-1]  # Use the most recent valid match
                        print(f"🔍 Detected port {detected_port} from container logs")
                        return detected_port
        
        # If log parsing fails, try to inspect the container's network settings
        ports_inspect_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "inspect", container_name, "--format", "{{json .NetworkSettings.Ports}}"],
            capture_output=True,
            text=True
        )
        
        if ports_inspect_result.returncode == 0:
            import json
            ports_data = json.loads(ports_inspect_result.stdout.strip())
            print(f"🔍 Container port mappings: {ports_data}")
            
            # Look for exposed ports, prioritize common web ports
            port_priority = [80, 8080, 3000, 8000, 5000, 4000, 8888, 9000]
            found_ports = []
            
            for port_spec, mappings in ports_data.items():
                if '/' in port_spec:
                    port_num = int(port_spec.split('/')[0])
                    found_ports.append(port_num)
            
            # Return the highest priority port if found
            for priority_port in port_priority:
                if priority_port in found_ports:
                    print(f"🔍 Found priority port {priority_port} from container inspection")
                    return priority_port
            
            # If no priority port found, return the first exposed port
            if found_ports:
                detected_port = found_ports[0]
                print(f"🔍 Found exposed port {detected_port} from container inspection")
                return detected_port
        
        # Try to check what process is listening inside the container
        try:
            netstat_result = await asyncio.to_thread(
                subprocess.run,
                ["docker", "exec", container_name, "sh", "-c", "netstat -tuln 2>/dev/null || ss -tuln 2>/dev/null || echo 'no netstat'"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if netstat_result.returncode == 0 and 'no netstat' not in netstat_result.stdout:
                netstat_output = netstat_result.stdout
                print(f"🔍 Netstat output: {netstat_output}")
                
                # Parse netstat output to find listening ports
                listen_pattern = r':(\d+)\s'
                matches = re.findall(listen_pattern, netstat_output)
                if matches:
                    # Filter and prioritize ports
                    valid_ports = [int(m) for m in matches if int(m) >= 80]
                    port_priority = [80, 8080, 3000, 8000, 5000, 4000, 8888, 9000]
                    
                    for priority_port in port_priority:
                        if priority_port in valid_ports:
                            print(f"🔍 Found listening port {priority_port} from netstat")
                            return priority_port
                    
                    if valid_ports:
                        detected_port = valid_ports[0]
                        print(f"🔍 Found listening port {detected_port} from netstat")
                        return detected_port
        except Exception as e:
            print(f"⚠️ Could not run netstat in container: {e}")
        
        return None
        
    except Exception as e:
        print(f"⚠️ Error detecting running port for {container_name}: {e}")
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


def patch_compose_network(compose_file_path):
    """
    Patch the docker-compose file to ensure all services use the devops-butler-net network.
    """
    with open(compose_file_path, 'r') as f:
        compose_data = yaml.safe_load(f)

    # Ensure networks section exists
    if 'networks' not in compose_data:
        compose_data['networks'] = {}
    
    # Add devops-butler-net as external network
    compose_data['networks']['devops-butler-net'] = {
        'external': True
    }
    
    # Add network to all services
    services = compose_data.get('services', {})
    for service_name, service in services.items():
        if 'networks' not in service:
            service['networks'] = []
        
        # Add devops-butler-net if not already present
        if 'devops-butler-net' not in service['networks']:
            service['networks'].append('devops-butler-net')
        
        print(f"✅ Added devops-butler-net network to service: {service_name}")
    
    with open(compose_file_path, 'w') as f:
        yaml.safe_dump(compose_data, f)
    
    print("✅ Successfully patched docker-compose file with network configuration")


def patch_env_files_in_compose(compose_file_path, repo_dir):
    import yaml, os
    with open(compose_file_path, 'r') as f:
        compose_data = yaml.safe_load(f)
    services = compose_data.get('services', {})
    if os.path.exists(os.path.join(repo_dir, "frontend.env")) and 'frontend' in services:
        services['frontend']['env_file'] = ['./frontend.env']
    if os.path.exists(os.path.join(repo_dir, "backend.env")) and 'backend' in services:
        services['backend']['env_file'] = ['./backend.env']
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


async def run_pipeline(repo_url: str, user_id: int = None):
    # Initialize state variables
    final_status = "failed"
    server_url = None
    
    # Validate the Git URL first
    if not validate_git_url(repo_url):
        error_msg = f"❌ Invalid Git repository URL: {repo_url}. Please provide a valid Git repository URL (e.g., https://github.com/user/repo)."
        await manager.broadcast(error_msg)
        print(error_msg)
        return None, None
    
    # Clean up any orphaned Nginx configs first
    await cleanup_orphaned_configs()
    
    # Ensure nginx proxy container is running
    nginx_ready = await ensure_nginx_proxy_running()
    if not nginx_ready:
        error_msg = "❌ Failed to start nginx proxy container"
        await manager.broadcast(error_msg)
        print(error_msg)
        return None, None
    
    # Extract repository name for pretty URLs
    repo_name = extract_repo_name(repo_url)
    # The unique name for the *new* container we are about to create
    new_container_name = f"{repo_name}-{str(uuid.uuid4())[:8]}"  # Use longer unique ID
    
    # --- VERIFICATION PRINT ---
    print(f"PIPELINE STARTED. Container Name: {new_container_name}")
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
            status="starting",
            user_id=user_id
        )
        session.add(db_deployment)
        session.commit()
        session.refresh(db_deployment)
    await manager.broadcast(f"🔵 STATUS: Starting pipeline for {repo_url} [ID: {new_container_name}]")
    await manager.broadcast(f"🌐 Will be available at: http://{new_container_name}.localhost:8888")
    await asyncio.sleep(1)

    # Instead of a local directory, create a unique temporary one
    repo_dir = tempfile.mkdtemp(prefix="butler-run-")
    print(f"Created temporary workspace: {repo_dir}")

    try:
        final_status = "starting"
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

        # After cloning the repo, check for .env file in the repo_dir
        repo_env_path = os.path.join(repo_dir, '.env')
        if os.path.exists(repo_env_path):
            warning_msg = (
                "⚠️ Warning: A .env file was found in your repository. "
                "For security, do NOT commit .env files to your repo. "
                "Please use the upload feature to provide your .env file securely during deployment. "
                "The deployment will use the uploaded .env file if provided."
            )
            print(warning_msg)
            await manager.broadcast(warning_msg)

        # Fallback: If no uploaded .env file but repo .env exists, use it for deployment
        frontend_env_path = os.path.join(repo_dir, "frontend.env")
        backend_env_path = os.path.join(repo_dir, "backend.env")
        if os.path.exists(repo_env_path):
            if not os.path.exists(frontend_env_path) and not os.path.exists(backend_env_path):
                # Use repo .env as fallback for both frontend and backend
                shutil.copy(repo_env_path, frontend_env_path)
                shutil.copy(repo_env_path, backend_env_path)
                fallback_msg = (
                    "⚠️ No uploaded .env file found. Using the .env file from your repository as a fallback for deployment. "
                    "For best security, please use the upload feature instead."
                )
                print(fallback_msg)
                await manager.broadcast(fallback_msg)

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
            compose_file = compose_path_yml if compose_yml_exists else compose_path_yaml
            # AI-powered patching of the compose file
            patched_yaml = await ai_patch_docker_compose(compose_file)
            if patched_yaml:
                with open(compose_file, 'w') as f:
                    f.write(patched_yaml)
                print(f"AI-patched docker-compose file written to {compose_file}")
            patch_compose_ports(compose_file) # Patch ports before running compose (fallback/manual)
            patch_compose_network(compose_file) # Ensure all services use devops-butler-net network
            patch_env_files_in_compose(compose_file, repo_dir) # Patch env files before running compose
            service_ports = await docker_up(repo_dir)
            if service_ports:
                await manager.broadcast(f"✅ STEP-SUCCESS: Docker Compose services are up: {list(service_ports.keys())}")
                primary_container_name = list(service_ports.keys())[0]
                primary_service = service_ports[primary_container_name]
                primary_port = primary_service['internal_port']
                await manager.broadcast(f"⏩ STEP: Setting up Nginx for primary service '{primary_container_name}' on internal port {primary_port}")
                print(f"🔧 VERIFICATION: Creating Nginx config with repo_name='{repo_name}', container_name='{primary_container_name}', port={primary_port}")
                nginx_success = create_nginx_config(
                    project_id=f"{repo_name}-{primary_container_name}",
                    repo_name=repo_name,
                    container_name=primary_container_name,
                    internal_port=primary_port
                )
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
                final_status = "success"
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

            # --- ENHANCED PORT DISCOVERY LOGIC ---
            dockerfile_path = os.path.join(repo_dir, 'Dockerfile')
            internal_port = find_exposed_port(dockerfile_path)
            
            # If no EXPOSE port found, we'll detect it after container starts
            if internal_port:
                await manager.broadcast(f"✅ [{new_container_name}] Discovered EXPOSE port: {internal_port}")
            else:
                await manager.broadcast(f"ℹ️ [{new_container_name}] No EXPOSE port found, will detect after container starts")
                internal_port = 80  # Default assumption for containers
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
            
            # Step 3: Wait a moment and detect the actual running port
            await asyncio.sleep(3)  # Give container time to start
            await manager.broadcast(f"🔍 [{new_container_name}] Detecting actual running port...")
            
            detected_port = await detect_running_port(new_container_name)
            if detected_port:
                print(f"🎯 Detected actual running port: {detected_port}")
                internal_port = detected_port  # Use the detected port
                await manager.broadcast(f"✅ [{new_container_name}] Using detected port: {internal_port}")
            else:
                print(f"⚠️ Could not detect running port, using default: {internal_port}")
                await manager.broadcast(f"⚠️ [{new_container_name}] Port detection failed, using default: {internal_port}")
            
            # Step 4: Create the Nginx config with the discovered internal port
            print(f"🔧 VERIFICATION: Creating Nginx config with repo_name='{repo_name}', container_name='{new_container_name}', port={internal_port}")
            nginx_success = create_nginx_config(
                project_id=f"{repo_name}-{new_container_name}",
                repo_name=repo_name,
                container_name=new_container_name,
                internal_port=internal_port
            )
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
            final_status = "success"
            return new_container_name, [server_url]
        # Priority 3: AI fallback
        else:
            await manager.broadcast("🤖 No config found. Engaging AI Analyst to create a Dockerfile...")
            generated_dockerfile_content = await generate_dockerfile(repo_dir)
            if generated_dockerfile_content:
                # Save the Dockerfile in the repo directory for Docker build
                dockerfile_path = os.path.join(repo_dir, "Dockerfile")
                with open(dockerfile_path, "w") as dockerfile:
                    dockerfile.write(generated_dockerfile_content)
                print(f"✅ Dockerfile saved at {dockerfile_path}")

                # Also save a copy in generated_dockerfiles for reference
                reference_dockerfile_path = f"/Users/aayush/Documents/Devops_Butler/generated_dockerfiles/{repo_name}.Dockerfile"
                with open(reference_dockerfile_path, "w") as dockerfile:
                    dockerfile.write(generated_dockerfile_content)
                print(f"✅ Reference Dockerfile saved at {reference_dockerfile_path}")

                # Build the Docker image
                # Patch for PHP projects: Install oniguruma dependency if any docker-php-ext-install is present
                dockerfile_full_path = os.path.join(repo_dir, "Dockerfile")
                with open(dockerfile_full_path, "r") as f:
                    dockerfile_content = f.read()

                # Regex to find any 'RUN docker-php-ext-install' command
                pattern = r"^(RUN\s+docker-php-ext-install.*)$"
                # Replacement to prepend the oniguruma dependency installation on a new line
                replacement = r"RUN apt-get update && apt-get install -y libonig-dev pkg-config\n\1"

                if re.search(pattern, dockerfile_content, re.MULTILINE):
                    fixed_dockerfile_content = re.sub(pattern, replacement, dockerfile_content, flags=re.MULTILINE)
                    with open(dockerfile_full_path, "w") as f:
                        f.write(fixed_dockerfile_content)
                    print("✅ Patched Dockerfile to install oniguruma dependency for PHP extensions")

                image_name = await docker_build(new_container_name, repo_dir)
                if not image_name:
                    print(f"❌ Failed to build Docker image for {new_container_name}")
                    # Update deployment status to failed
                    with Session(engine) as session:
                        deployment_to_update = session.get(Deployment, db_deployment.id)
                        if deployment_to_update:
                            deployment_to_update.status = "failed"
                            session.add(deployment_to_update)
                            session.commit()
                    await manager.broadcast("🔴 STATUS: Pipeline failed.")
                    return None, None

                # Discover exposed port from generated Dockerfile
                internal_port = find_exposed_port(dockerfile_path)
                if not internal_port:
                    internal_port = 8888  # Default fallback
                    print(f"⚠️ Could not determine EXPOSE port, using default: {internal_port}")

                # Run the container
                desired_port = internal_port
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    if s.connect_ex(('localhost', desired_port)) == 0:
                        print(f"Port {desired_port} is busy, finding a free one...")
                        desired_port = find_free_port(desired_port + 1)
                        print(f"Using free port {desired_port}")

                run_success = await run_container(image_name, new_container_name, host_port=desired_port, internal_port=internal_port)
                if not run_success:
                    print(f"❌ Failed to start container {new_container_name}")
                    # Update deployment status to failed
                    with Session(engine) as session:
                        deployment_to_update = session.get(Deployment, db_deployment.id)
                        if deployment_to_update:
                            deployment_to_update.status = "failed"
                            session.add(deployment_to_update)
                            session.commit()
                    await manager.broadcast("🔴 STATUS: Pipeline failed.")
                    return None, None

                print(f"✅ Container {new_container_name} started successfully.")
                
                # Create Nginx config - use consistent port (8888 for nginx proxy)
                nginx_success = create_nginx_config(
                    project_id=f"{repo_name}-{new_container_name}",
                    repo_name=repo_name,
                    container_name=new_container_name,
                    internal_port=internal_port
                )
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

                # Reload Nginx
                await reload_nginx()

                # Always use port 8888 for nginx proxy access
                server_url = f"http://{repo_name}.localhost:8888"
                final_status = "success"
                return new_container_name, [server_url]
            else:
                print("❌ Failed to generate Dockerfile.")
                # Update deployment status to failed
                with Session(engine) as session:
                    deployment_to_update = session.get(Deployment, db_deployment.id)
                    if deployment_to_update:
                        deployment_to_update.status = "failed"
                        session.add(deployment_to_update)
                        session.commit()
                await manager.broadcast("🔴 STATUS: Pipeline failed.")
                return None, None
    finally:
        # This block is GUARANTEED to run.
        print(f"--- Pipeline Concluding: Status is '{final_status}' ---")
        
        # Update the database with the final outcome
        with Session(engine) as session:
            deployment_to_update = session.get(Deployment, db_deployment.id)
            if deployment_to_update:
                deployment_to_update.status = final_status
                if server_url:  # Only add the URL if it was successful
                    deployment_to_update.deployed_url = server_url
                session.add(deployment_to_update)
                session.commit()
        
        # Clean up the temporary workspace
        if os.path.exists(repo_dir):
            print(f"Cleaning up workspace: {repo_dir}")
            shutil.rmtree(repo_dir)
        
        # Clean up old Docker images to save disk space (keep last 3 images per repo)
        try:
            print(f"🧹 Cleaning up old images for {repo_name}...")
            await cleanup_old_images(repo_name, keep_count=3)
            print(f"✅ Image cleanup completed successfully")
        except Exception as e:
            print(f"⚠️ Warning: Image cleanup failed: {e}")
            # Don't let cleanup failures affect the deployment result

        # Broadcast the final status
        if final_status == "success":
            await manager.broadcast(f"🚀 SUCCESS! Deployment is live at: {server_url}")
        else:
            # The 'server_url' error came from here!
            # Now we just report a generic failure.
            await manager.broadcast(f"🔴 ERROR: Deployment failed. Check server logs for details.")
