"""
DevOps Butler - Unified Deployment Pipeline
Clean, reliable deployment pipeline without Nginx proxy dependencies.
Supports Docker Compose, Dockerfile, and AI-generated Dockerfile deployments.
"""

import subprocess
import os
import shutil
import uuid
import asyncio
import tempfile
import re
import socket
import yaml
from urllib.parse import urlparse
from typing import Optional, Tuple, Dict, Any
from pathlib import Path

# Import core modules
from docker_build import docker_build, cleanup_old_images
from docker_run import run_container
from connection_manager import manager
from sqlmodel import Session, select
from database import engine  
from login import Deployment

# Import AI capabilities (can be replaced with Gemini or removed)
# from ai_analyst import generate_dockerfile


def validate_git_url(git_url: str) -> bool:
    """Validates that the URL is a valid Git repository URL."""
    try:
        clean_url = git_url.rstrip('.git')
        
        # Check for invalid patterns (Docker registries, etc.)
        invalid_patterns = [
            'hub.docker.com', 'docker.io', 'quay.io', 
            'gcr.io', 'ecr.', 'azurecr.io'
        ]
        
        for pattern in invalid_patterns:
            if pattern in clean_url.lower():
                return False
        
        # Handle SSH URLs (git@github.com:user/repo)
        if clean_url.startswith('git@'):
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
    """Extracts the repository name from a Git URL."""
    try:
        clean_url = git_url.rstrip('.git')
        
        if clean_url.startswith('git@'):
            # Handle SSH URLs
            repo_part = clean_url.split(':')[-1]
            parts = repo_part.split('/')
            if len(parts) >= 2:
                user_name = parts[-2]
                repo_name = parts[-1]
            else:
                user_name = "unknown"
                repo_name = parts[-1] if parts else "unknown"
        else:
            # Handle HTTPS URLs
            parsed = urlparse(clean_url)
            path_parts = parsed.path.strip('/').split('/')
            if len(path_parts) >= 2:
                user_name = path_parts[-2]
                repo_name = path_parts[-1]
            else:
                user_name = "unknown"
                repo_name = path_parts[-1] if path_parts else "unknown"
        
        # Clean up names (remove special characters)
        user_name = re.sub(r'[^a-zA-Z0-9-]', '-', user_name)
        repo_name = re.sub(r'[^a-zA-Z0-9-]', '-', repo_name)
        
        # Use user-repo combination for uniqueness
        unique_name = f"{user_name}-{repo_name}"
        
        # Ensure it starts with a letter or number
        if unique_name and not unique_name[0].isalnum():
            unique_name = 'repo-' + unique_name
        
        return unique_name.lower()
    except Exception as e:
        print(f"Error extracting repo name from {git_url}: {e}")
        return f"unknown-repo-{str(uuid.uuid4())[:8]}"


def find_exposed_port(dockerfile_path: str) -> Optional[int]:
    """Reads a Dockerfile and finds the first EXPOSE instruction."""
    try:
        with open(dockerfile_path, "r") as f:
            dockerfile_content = f.read()
            match = re.search(r'^\s*EXPOSE\s+(\d+)', dockerfile_content, re.MULTILINE | re.IGNORECASE)
            if match:
                port = int(match.group(1))
                print(f"Discovered EXPOSE port {port} from Dockerfile.")
                return port
        return None
    except FileNotFoundError:
        return None


def find_free_port(start_port=8080, max_port=65535) -> int:
    """Finds and returns a free port on the host."""
    for port in range(start_port, max_port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('localhost', port)) != 0:
                return port
    raise RuntimeError("No free ports available in range")


async def check_port_available(port: int) -> bool:
    """Check if a port is available."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('localhost', port)) != 0
    except Exception:
        return False


async def detect_running_port(container_name: str) -> Optional[int]:
    """Detects what port a running container is listening on by inspecting logs and processes."""
    try:
        # Check container logs for port information
        logs_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "logs", "--tail", "50", container_name],
            capture_output=True,
            text=True
        )
        
        if logs_result.returncode == 0:
            logs = logs_result.stdout + logs_result.stderr
            print(f"📋 Container logs for port detection (last 500 chars):\n{logs[-500:]}")
            
            # Common port detection patterns
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
            ]
            
            for pattern in port_patterns:
                matches = re.findall(pattern, logs, re.IGNORECASE)
                if matches:
                    # Filter out common non-port numbers
                    valid_ports = [int(m) for m in matches if 1024 <= int(m) <= 65535 or int(m) == 80]
                    if valid_ports:
                        detected_port = valid_ports[-1]  # Use the most recent match
                        print(f"🔍 Detected port {detected_port} from container logs")
                        return detected_port
        
        # Fallback: inspect container port mappings
        ports_inspect_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "inspect", container_name, "--format", "{{json .NetworkSettings.Ports}}"],
            capture_output=True,
            text=True
        )
        
        if ports_inspect_result.returncode == 0:
            import json
            try:
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
            except json.JSONDecodeError:
                print("⚠️ Could not parse container port mappings")
        
        return None
        
    except Exception as e:
        print(f"⚠️ Error detecting running port for {container_name}: {e}")
        return None


async def destroy_deployment(container_name: str):
    """Clean up a deployment by stopping and removing the container."""
    print(f"🗑️ Cleaning up deployment: {container_name}")
    
    try:
        # Stop the container
        await asyncio.to_thread(
            subprocess.run,
            ["docker", "stop", container_name],
            capture_output=True, text=True
        )
        
        # Remove the container
        await asyncio.to_thread(
            subprocess.run,
            ["docker", "rm", container_name],
            capture_output=True, text=True
        )
        
        print(f"✅ Container {container_name} cleaned up")
    except Exception as e:
        print(f"⚠️ Error cleaning up {container_name}: {e}")


async def handle_docker_compose_deployment(repo_dir: str, repo_name: str, container_name: str) -> Optional[str]:
    """Handle docker-compose deployment with simplified port mapping."""
    try:
        # Find compose file
        compose_files = ['docker-compose.yaml', 'docker-compose.yml']
        compose_file_path = None
        
        for compose_file in compose_files:
            potential_path = os.path.join(repo_dir, compose_file)
            if os.path.exists(potential_path):
                compose_file_path = potential_path
                break
        
        if not compose_file_path:
            return None
        
        await manager.broadcast("🐳 Found docker-compose file, setting up multi-service deployment...")
        
        # Read and modify docker-compose file for localhost deployment
        with open(compose_file_path, 'r') as f:
            compose_data = yaml.safe_load(f)
        
        # Update environment variables and ports for localhost
        services = compose_data.get('services', {})
        main_service_port = None
        
        for service_name, service_config in services.items():
            # Update environment variables to use localhost
            if 'environment' in service_config:
                env = service_config['environment']
                if isinstance(env, list):
                    for i, env_var in enumerate(env):
                        if isinstance(env_var, str):
                            # Replace IP addresses with localhost
                            env[i] = re.sub(r'http://\d+\.\d+\.\d+\.\d+:', 'http://localhost:', env_var)
                elif isinstance(env, dict):
                    for key, value in env.items():
                        if isinstance(value, str) and 'http://' in value:
                            env[key] = re.sub(r'http://\d+\.\d+\.\d+\.\d+:', 'http://localhost:', value)
            
            # Handle ports
            if 'ports' in service_config:
                ports = service_config['ports']
                for i, port_mapping in enumerate(ports):
                    if isinstance(port_mapping, str) and ':' in port_mapping:
                        host_port, container_port = port_mapping.split(':', 1)
                        try:
                            host_port_int = int(host_port)
                            # Check if port is available, if not find a free one
                            if not await check_port_available(host_port_int):
                                new_port = find_free_port(host_port_int + 1)
                                ports[i] = f"{new_port}:{container_port}"
                                print(f"⚠️ Port {host_port_int} busy, using {new_port} for {service_name}")
                            
                            # Track the main service port
                            if service_name in ['frontend', 'web', 'app'] or 'frontend' in service_name.lower():
                                main_service_port = int(ports[i].split(':')[0])
                        except ValueError:
                            continue
        
        # Write updated compose file
        with open(compose_file_path, 'w') as f:
            yaml.dump(compose_data, f, default_flow_style=False)
        
        await manager.broadcast("⚙️ Starting multi-service deployment with docker-compose...")
        
        # Run docker-compose up
        compose_result = await asyncio.to_thread(
            subprocess.run,
            ["docker-compose", "-f", compose_file_path, "up", "-d"],
            cwd=repo_dir,
            capture_output=True,
            text=True
        )
        
        if compose_result.returncode != 0:
            print(f"❌ Docker compose failed: {compose_result.stderr}")
            return None
        
        await manager.broadcast("✅ Multi-service deployment successful!")
        
        # Return the main service port or the first available port
        if main_service_port:
            return f"http://localhost:{main_service_port}"
        else:
            # Find the first mapped port
            for service_name, service_config in services.items():
                if 'ports' in service_config and service_config['ports']:
                    port_mapping = service_config['ports'][0]
                    if isinstance(port_mapping, str) and ':' in port_mapping:
                        host_port = port_mapping.split(':')[0]
                        return f"http://localhost:{host_port}"
        
        return "http://localhost:8080"  # Fallback
    
    except Exception as e:
        print(f"❌ Error in compose deployment: {e}")
        return None


async def handle_dockerfile_deployment(repo_dir: str, repo_name: str, container_name: str) -> Optional[str]:
    """Handle Dockerfile-based deployment."""
    try:
        await manager.broadcast(f"📜 Building application from Dockerfile...")
        
        # Find the port from Dockerfile
        dockerfile_path = os.path.join(repo_dir, 'Dockerfile')
        internal_port = find_exposed_port(dockerfile_path)
        
        if internal_port:
            await manager.broadcast(f"✅ Discovered EXPOSE port: {internal_port}")
        else:
            await manager.broadcast("ℹ️ No EXPOSE port found, will detect after container starts")
            internal_port = 80  # Default assumption
        
        # Build the Docker image
        image_name = await docker_build(container_name, repo_dir)
        if not image_name:
            await manager.broadcast("❌ Docker build failed")
            return None
        
        # Find a free port for direct access
        desired_port = find_free_port(internal_port if internal_port != 80 else 8080)
        
        # Run the container with port mapping
        run_success = await run_container(
            image_name, 
            container_name, 
            host_port=desired_port, 
            internal_port=internal_port
        )
        
        if not run_success:
            await manager.broadcast("❌ Failed to start container")
            return None
        
        await manager.broadcast(f"✅ Container started successfully")
        
        # Wait a moment and detect the actual running port
        await asyncio.sleep(3)
        detected_port = await detect_running_port(container_name)
        if detected_port and detected_port != internal_port:
            print(f"🎯 Detected actual running port: {detected_port}")
            internal_port = detected_port
        
        await manager.broadcast(f"🌐 Application is accessible at: http://localhost:{desired_port}")
        return f"http://localhost:{desired_port}"
        
    except Exception as e:
        print(f"❌ Error in Dockerfile deployment: {e}")
        return None


async def handle_ai_dockerfile_deployment(repo_dir: str, repo_name: str, container_name: str) -> Optional[str]:
    """Handle AI-generated Dockerfile deployment (placeholder - can be implemented with Gemini)."""
    try:
        await manager.broadcast("🤖 No Dockerfile found, would generate one with AI...")
        # Note: AI generation can be implemented here with Gemini API
        # For now, we'll return None to indicate this feature is not available
        
        await manager.broadcast("⚠️ AI Dockerfile generation not implemented - please provide a Dockerfile")
        return None
        
    except Exception as e:
        print(f"❌ Error in AI dockerfile deployment: {e}")
        return None


async def run_deployment_pipeline(git_url: str, user_id: Optional[int] = None, env_dir: Optional[str] = None) -> Optional[Tuple[str, str]]:
    """
    Main deployment pipeline that handles the entire deployment process.
    
    Args:
        git_url: The Git repository URL to deploy
        user_id: The user ID for tracking
        env_dir: Optional directory containing environment files
    
    Returns:
        Tuple of (container_name, deployed_url) if successful, None if failed
    """
    final_status = "failed"
    server_url = None
    
    # Validate the Git URL
    if not validate_git_url(git_url):
        error_msg = f"❌ Invalid Git repository URL: {git_url}"
        await manager.broadcast(error_msg)
        return None
    
    # Extract repository name and create container name
    repo_name = extract_repo_name(git_url)
    new_container_name = f"{repo_name}-{str(uuid.uuid4())[:8]}"
    
    print(f"🚀 DEPLOYMENT PIPELINE: {new_container_name}")
    
    # Clean up old deployments
    with Session(engine) as session:
        old_deployment = session.exec(
            select(Deployment).where(Deployment.git_url == git_url, Deployment.status == 'success')
        ).first()
        
        if old_deployment:
            print(f"🔍 Found previous deployment: {old_deployment.container_name}")
            await destroy_deployment(old_deployment.container_name)
            await manager.broadcast("🧹 Cleaned up previous deployment")
    
    # Create new deployment record
    with Session(engine) as session:
        db_deployment = Deployment(
            container_name=new_container_name,
            git_url=git_url,
            status="starting",
            user_id=user_id
        )
        session.add(db_deployment)
        session.commit()
        session.refresh(db_deployment)
    
    await manager.broadcast(f"🔵 Starting deployment - Container: {new_container_name}")
    
    # Create temporary workspace
    repo_dir = tempfile.mkdtemp(prefix="butler-deploy-")
    print(f"📁 Created workspace: {repo_dir}")
    
    try:
        # Clone repository
        await manager.broadcast("📥 Cloning repository...")
        command = ["git", "clone", "--depth", "1", str(git_url), repo_dir]
        
        try:
            await asyncio.to_thread(subprocess.run, command, check=True, capture_output=True, text=True)
            await manager.broadcast("✅ Repository cloned successfully")
        except subprocess.CalledProcessError as e:
            error_msg = f"❌ Failed to clone repository: {e.stderr}"
            await manager.broadcast(error_msg)
            with Session(engine) as session:
                deployment_to_update = session.get(Deployment, db_deployment.id)
                if deployment_to_update:
                    deployment_to_update.status = "failed"
                    session.add(deployment_to_update)
                    session.commit()
            return None
        
        # Copy env files if provided
        if env_dir:
            for env_file in ['frontend.env', 'backend.env']:
                src_path = os.path.join(env_dir, env_file)
                if os.path.exists(src_path):
                    dst_path = os.path.join(repo_dir, env_file)
                    shutil.copy2(src_path, dst_path)
                    await manager.broadcast(f"📄 Environment file {env_file} copied")
        
        # Detect framework and create .dockerignore if needed
        await create_dockerignore_if_needed(repo_dir)
        
        # Deployment strategy selection
        compose_files = ['docker-compose.yaml', 'docker-compose.yml']
        dockerfile_names = ['Dockerfile', 'dockerfile', 'DOCKERFILE']
        
        has_compose = any(os.path.exists(os.path.join(repo_dir, f)) for f in compose_files)
        has_dockerfile = any(os.path.exists(os.path.join(repo_dir, f)) for f in dockerfile_names)
        
        # Strategy 1: Docker Compose (highest priority for multi-service)
        if has_compose:
            await manager.broadcast("🐳 Docker-compose detected, deploying multi-service application...")
            server_url = await handle_docker_compose_deployment(repo_dir, repo_name, new_container_name)
            if server_url:
                final_status = "success"
        
        # Strategy 2: Dockerfile (single container)
        elif has_dockerfile:
            # Normalize dockerfile name
            dockerfile_path = None
            for dockerfile_name in dockerfile_names:
                potential_path = os.path.join(repo_dir, dockerfile_name)
                if os.path.exists(potential_path):
                    dockerfile_path = potential_path
                    break
            
            if dockerfile_path and os.path.basename(dockerfile_path) != 'Dockerfile':
                normalized_dockerfile = os.path.join(repo_dir, 'Dockerfile')
                shutil.copy2(dockerfile_path, normalized_dockerfile)
                await manager.broadcast("⚙️ Normalized dockerfile name for Docker compatibility")
            
            server_url = await handle_dockerfile_deployment(repo_dir, repo_name, new_container_name)
            if server_url:
                final_status = "success"
        
        # Strategy 3: AI-generated Dockerfile (fallback)
        else:
            server_url = await handle_ai_dockerfile_deployment(repo_dir, repo_name, new_container_name)
            if server_url:
                final_status = "success"
        
        # Return results
        if final_status == "success" and server_url:
            await manager.broadcast(f"🎉 Deployment successful!")
            await manager.broadcast(f"🌐 Access your app at: {server_url}")
            return new_container_name, server_url
        else:
            await manager.broadcast("❌ Deployment failed")
            return None
    
    finally:
        # Update database with final status
        with Session(engine) as session:
            deployment_to_update = session.get(Deployment, db_deployment.id)
            if deployment_to_update:
                deployment_to_update.status = final_status
                if server_url:
                    deployment_to_update.deployed_url = server_url
                session.add(deployment_to_update)
                session.commit()
        
        # Clean up workspace
        if os.path.exists(repo_dir):
            print(f"🧹 Cleaning up workspace: {repo_dir}")
            shutil.rmtree(repo_dir)
        
        # Clean up old Docker images
        try:
            print(f"🧹 Cleaning up old images for {repo_name}...")
            await cleanup_old_images(repo_name, keep_count=3)
        except Exception as e:
            print(f"⚠️ Warning: Image cleanup failed: {e}")


async def create_dockerignore_if_needed(repo_dir: str):
    """Create .dockerignore for JavaScript/Node.js projects to prevent permission issues."""
    package_json_path = os.path.join(repo_dir, 'package.json')
    if os.path.exists(package_json_path):
        try:
            with open(package_json_path, 'r') as f:
                package_data = f.read()
                
                # Detect framework type
                if any(framework in package_data for framework in ['"next":', '"react":', '"vue":', '"angular":', '"svelte":']):
                    dockerignore_path = os.path.join(repo_dir, '.dockerignore')
                    if not os.path.exists(dockerignore_path):
                        await manager.broadcast("📝 Creating .dockerignore file for JavaScript compatibility")
                        js_dockerignore = """# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs and cache
.next/
out/
build/
dist/
.cache/

# Environment variables
.env*
!.env.example

# IDE and editor files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Git
.git/
.gitignore
"""
                        with open(dockerignore_path, 'w') as f:
                            f.write(js_dockerignore)
                        await manager.broadcast("✅ Created .dockerignore file for optimal build")
        except Exception as e:
            print(f"⚠️ Error creating .dockerignore: {e}")
