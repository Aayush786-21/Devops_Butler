import subprocess
import os
import shutil
import uuid
import asyncio
import tempfile
import re
import socket
import yaml
import json
import datetime
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
        
        # Avoid redundancy if repo_name already contains user_name or vice versa
        if user_name.lower() in repo_name.lower() or repo_name.lower() in user_name.lower():
            # If there's significant overlap, just use the longer one
            unique_name = repo_name if len(repo_name) >= len(user_name) else user_name
        else:
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


async def cleanup_conflicting_networks(repo_dir: str, compose_file_path: str):
    """Clean up conflicting Docker networks that might cause label issues."""
    try:
        # Read the compose file to find network names
        with open(compose_file_path, 'r') as f:
            compose_data = yaml.safe_load(f)
        
        networks = compose_data.get('networks', {})
        
        for network_name in networks.keys():
            try:
                # Try to remove the network if it exists
                result = await asyncio.to_thread(
                    subprocess.run,
                    ["docker", "network", "rm", network_name],
                    capture_output=True,
                    text=True
                )
                if result.returncode == 0:
                    print(f"🗑️ Removed conflicting network: {network_name}")
            except Exception:
                # Network might not exist or be in use, ignore
                pass
                
        # Also try to remove networks with common conflicting patterns
        conflicting_patterns = [
            f"{os.path.basename(repo_dir)}_default",
            "wanderlust",
            "wanderlust_default",
            "wanderlust_0"
        ]
        
        for pattern in conflicting_patterns:
            try:
                result = await asyncio.to_thread(
                    subprocess.run,
                    ["docker", "network", "rm", pattern],
                    capture_output=True,
                    text=True
                )
                if result.returncode == 0:
                    print(f"🗑️ Removed conflicting network pattern: {pattern}")
            except Exception:
                pass
                
    except Exception as e:
        print(f"⚠️ Warning during network cleanup: {e}")


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
        
        # First, stop and remove any existing containers from this compose file
        await manager.broadcast("🧹 Cleaning up any existing containers and networks...")
        try:
            # Try to stop and remove containers from this compose project
            # Try both docker-compose and docker compose
            cleanup_result = await asyncio.to_thread(
                subprocess.run,
                ["docker-compose", "-f", compose_file_path, "down", "--remove-orphans", "-v", "--rmi", "local"],
                cwd=repo_dir,
                capture_output=True,
                text=True
            )
            if cleanup_result.returncode == 0:
                await manager.broadcast("✅ Cleaned up existing containers and networks")
            else:
                print(f"⚠️ Cleanup warning (might be first deployment): {cleanup_result.stderr}")
                alt_cleanup = await asyncio.to_thread(
                    subprocess.run,
                    ["docker", "compose", "-f", compose_file_path, "down", "--remove-orphans", "-v"],
                    cwd=repo_dir,
                    capture_output=True,
                    text=True
                )
                if alt_cleanup.returncode == 0:
                    await manager.broadcast("✅ Cleaned up existing containers and networks")
                
            # Additional cleanup: remove conflicting networks manually
            await cleanup_conflicting_networks(repo_dir, compose_file_path)
            
        except Exception as e:
            print(f"⚠️ Cleanup warning: {e}")
        
        # Read and modify docker-compose file for localhost deployment
        with open(compose_file_path, 'r') as f:
            compose_data = yaml.safe_load(f)
        
        # Remove version if present (it's obsolete in newer compose versions)
        if 'version' in compose_data:
            del compose_data['version']
        
        # Update environment variables, ports, and container names
        services = compose_data.get('services', {})
        main_service_port = None
        unique_suffix = container_name.split('-')[-1]  # Get the UUID part
        
        for service_name, service_config in services.items():
            # Add unique container names to avoid conflicts
            service_config['container_name'] = f"{service_name}-{unique_suffix}"
            
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
                                await manager.broadcast(f"⚠️ Port {host_port_int} busy, using {new_port} for {service_name}")
                            
                            # Track the main service port
                            if service_name in ['frontend', 'web', 'app'] or 'frontend' in service_name.lower():
                                main_service_port = int(ports[i].split(':')[0])
                        except ValueError:
                            continue
        
        # Handle networks - create unique network names or use external if specified
        if 'networks' in compose_data:
            networks = compose_data['networks']
            # Create a copy of the items to avoid "dictionary changed during iteration" error
            network_items = list(networks.items())
            networks_to_update = {}
            
            for network_name, network_config in network_items:
                if isinstance(network_config, dict) and not network_config.get('external', False):
                    # Make network name unique
                    new_network_name = f"{network_name}-{unique_suffix}"
                    
                    # Update services to use the new network name
                    for service_config in services.values():
                        if 'networks' in service_config:
                            if isinstance(service_config['networks'], list):
                                service_config['networks'] = [new_network_name if n == network_name else n 
                                                             for n in service_config['networks']]
                            elif isinstance(service_config['networks'], dict):
                                if network_name in service_config['networks']:
                                    service_config['networks'][new_network_name] = service_config['networks'].pop(network_name)
                    
                    # Store the updates to apply later
                    networks_to_update[new_network_name] = network_config
                    # Mark old network for removal
                    if network_name != new_network_name:
                        networks_to_update[network_name] = None
            
            # Apply the network updates
            for network_name, network_config in networks_to_update.items():
                if network_config is None:
                    # Remove old network
                    if network_name in compose_data['networks']:
                        del compose_data['networks'][network_name]
                else:
                    # Add/update new network
                    compose_data['networks'][network_name] = network_config
        
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
            # Fallback to docker compose
            compose_result = await asyncio.to_thread(
                subprocess.run,
                ["docker", "compose", "-f", compose_file_path, "up", "-d"],
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


async def handle_static_website_deployment(repo_dir: str, repo_name: str, container_name: str) -> Optional[str]:
    """Handle static website deployment by generating a Dockerfile with Python HTTP server."""
    try:
        await manager.broadcast("🌐 Generating Dockerfile for static website...")
        
        # Create the Python server script first
        server_script = '''import http.server
import socketserver
import os
from urllib.parse import unquote

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def do_GET(self):
        # Handle SPA routing - serve index.html for routes
        if self.path != "/" and not os.path.exists(self.path.lstrip("/")) and not "." in os.path.basename(self.path):
            self.path = "/index.html"
        return super().do_GET()

PORT = int(os.environ.get("PORT", 8080))
with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"Serving static files on port {PORT}")
    httpd.serve_forever()
'''
        
        # Write the server script to the repo directory
        server_script_path = os.path.join(repo_dir, 'server.py')
        with open(server_script_path, 'w') as f:
            f.write(server_script)
        
        # Create a simple Dockerfile
        dockerfile_content = '''FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy static files and server script
COPY . /app/

# Expose port 8080
EXPOSE 8080

# Start the Python server
CMD ["python", "server.py"]
'''
        
        # Write Dockerfile
        dockerfile_path = os.path.join(repo_dir, 'Dockerfile')
        with open(dockerfile_path, 'w') as f:
            f.write(dockerfile_content)
        
        await manager.broadcast("✅ Generated Python-based Dockerfile and server script for static website")
        
        # Now deploy using the standard Dockerfile deployment
        return await handle_dockerfile_deployment(repo_dir, repo_name, container_name)
        
    except Exception as e:
        print(f"❌ Error in static website deployment: {e}")
        return None


async def handle_node_project_deployment(repo_dir: str, repo_name: str, container_name: str) -> Optional[str]:
    """Handle Node.js/Next.js project by generating a suitable Dockerfile and deploying."""
    try:
        package_json_path = os.path.join(repo_dir, 'package.json')
        if not os.path.exists(package_json_path):
            return None

        await manager.broadcast("🟩 Node.js project detected. Preparing Dockerfile...")

        # Read package.json to detect framework and scripts
        with open(package_json_path, 'r', encoding='utf-8') as f:
            pkg = json.load(f)

        deps = pkg.get('dependencies', {}) or {}
        dev_deps = pkg.get('devDependencies', {}) or {}
        scripts = pkg.get('scripts', {}) or {}
        has_next = 'next' in {**deps, **dev_deps}
        start_script = scripts.get('start', '')
        build_script = scripts.get('build', '')

        # Choose internal port
        internal_port = 3000 if has_next else 3000

        # Pre-build validation: ensure env vars used in Next.js config are defined
        def _collect_env_from_next_config() -> set[str]:
            envs: set[str] = set()
            for cfg_name in [
                'next.config.ts', 'next.config.js', 'next.config.mjs', 'next.config.cjs'
            ]:
                cfg_path = os.path.join(repo_dir, cfg_name)
                if os.path.exists(cfg_path):
                    try:
                        with open(cfg_path, 'r', encoding='utf-8') as cf:
                            content = cf.read()
                            for match in re.findall(r'process\.env\.([A-Z0-9_]+)', content):
                                envs.add(match)
                    except Exception:
                        continue
            return envs

        def _load_local_env_files() -> dict:
            env_map: dict[str, str] = {}
            # Typical env files to consider
            for name in ['frontend.env', '.env', '.env.local', '.env.production']:
                path = os.path.join(repo_dir, name)
                if os.path.exists(path):
                    try:
                        with open(path, 'r', encoding='utf-8') as ef:
                            for line in ef:
                                line = line.strip()
                                if not line or line.startswith('#') or '=' not in line:
                                    continue
                                k, v = line.split('=', 1)
                                env_map[k.strip()] = v.strip().strip('"').strip("'")
                    except Exception:
                        continue
            return env_map

        # Only run validation for Next.js projects
        if has_next:
            referenced = _collect_env_from_next_config()
            local_envs = _load_local_env_files()
            missing: list[str] = []
            # Check env presence in local env files or current process env
            for var in referenced:
                if var not in local_envs and not os.environ.get(var):
                    missing.append(var)
            if missing:
                await manager.broadcast(
                    "❌ Next.js configuration references undefined environment variables: " + ", ".join(missing)
                )
                await manager.broadcast(
                    "💡 Provide them via 'frontend.env' upload or include a .env(.local/.production) in your repo."
                )
                return None

        # Decide commands
        # Build command
        if build_script:
            build_cmd = 'npm run build'
        elif has_next:
            build_cmd = 'npx next build'
        else:
            build_cmd = ''

        # Start command
        if start_script:
            start_cmd = 'npm run start'
        elif has_next:
            start_cmd = f'npx next start -p {internal_port}'
        elif 'dev' in scripts:
            start_cmd = 'npm run dev'
        else:
            # last resort
            start_cmd = 'node server.js'

        # Create a robust multi-stage Dockerfile for Next.js or generic Node app
        if has_next or 'next' in build_script or 'next' in start_script:
            dockerfile_content = f'''# Auto-generated Dockerfile for Next.js (Debian-based for compatibility)
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund

FROM node:20-bookworm-slim AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
{f'RUN {build_cmd}' if build_cmd else ''}

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV HOST=0.0.0.0
ENV PORT={internal_port}
# Ensure undefined rewrite destinations don't crash Next.js
# If the app uses NEXT_PUBLIC_API_BASE in next.config, forward it here when present
ARG NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_API_BASE=${{NEXT_PUBLIC_API_BASE}}
COPY --from=builder /app ./
EXPOSE {internal_port}
CMD ["/bin/sh", "-lc", "{start_cmd}"]
'''
        else:
            # Generic Node app: run start script
            dockerfile_content = f'''# Auto-generated Dockerfile for Node.js
FROM node:20-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ENV HOST=0.0.0.0
ENV HOSTNAME=0.0.0.0
ENV PORT={internal_port}
EXPOSE {internal_port}
CMD ["/bin/sh", "-lc", "{start_cmd}"]
'''

        # Write Dockerfile
        dockerfile_path = os.path.join(repo_dir, 'Dockerfile')
        with open(dockerfile_path, 'w', encoding='utf-8') as f:
            f.write(dockerfile_content)

        await manager.broadcast("✅ Generated Dockerfile for Node.js project")

        # Proceed with standard Dockerfile deployment
        return await handle_dockerfile_deployment(repo_dir, repo_name, container_name)
    except Exception as e:
        print(f"❌ Error in node project deployment: {e}")
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


async def run_deployment_pipeline(git_url: str, user_id: Optional[int] = None, env_dir: Optional[str] = None, existing_deployment_id: Optional[int] = None, parent_project_id: Optional[int] = None, component_type: Optional[str] = None) -> Optional[Tuple[str, str]]:
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
    
    # Use existing deployment record if provided, otherwise create new
    with Session(engine) as session:
        if existing_deployment_id is not None:
            db_deployment = session.get(Deployment, existing_deployment_id)
            if not db_deployment:
                return None
            # Reuse existing container name to represent same project
            if db_deployment.container_name:
                new_container_name = db_deployment.container_name
            db_deployment.git_url = git_url
            db_deployment.status = "starting"
            session.add(db_deployment)
            session.commit()
            session.refresh(db_deployment)
        else:
            db_deployment = Deployment(
                container_name=new_container_name,
                git_url=git_url,
                status="starting",
                user_id=user_id,
                parent_project_id=parent_project_id,
                component_type=component_type
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
        # Non-interactive Git and timeout to avoid hangs
        git_env = os.environ.copy()
        git_env.setdefault("GIT_TERMINAL_PROMPT", "0")
        
        try:
            await asyncio.to_thread(
                subprocess.run,
                command,
                check=True,
                capture_output=True,
                text=True,
                env=git_env,
                timeout=120
            )
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
        except subprocess.TimeoutExpired:
            error_msg = "❌ Failed to clone repository: operation timed out"
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
        
        # Debug: List repository contents
        try:
            repo_contents = os.listdir(repo_dir)
            await manager.broadcast(f"📁 Repository contents: {', '.join(repo_contents)}")
            print(f"📁 Repository contents: {repo_contents}")
        except Exception as e:
            print(f"⚠️ Could not list repository contents: {e}")
        
        # Debug: Log deployment strategy detection
        await manager.broadcast(f"🔍 Deployment strategy detection:")
        await manager.broadcast(f"   - Docker Compose files found: {has_compose}")
        await manager.broadcast(f"   - Dockerfile found: {has_dockerfile}")
        print(f"🔍 Strategy detection - Compose: {has_compose}, Dockerfile: {has_dockerfile}")
        
        # Strategy 1: Docker Compose (highest priority for multi-service)
        if has_compose:
            await manager.broadcast("🐳 Docker-compose detected, deploying multi-service application...")
            print("🐳 Using Docker Compose deployment strategy")
            server_url = await handle_docker_compose_deployment(repo_dir, repo_name, new_container_name)
            if server_url:
                final_status = "success"
                print(f"✅ Docker Compose deployment successful: {server_url}")
            else:
                print("❌ Docker Compose deployment failed")
        
        # Strategy 2: Dockerfile (single container)
        elif has_dockerfile:
            await manager.broadcast("🐳 Dockerfile detected, deploying single container application...")
            print("🐳 Using Dockerfile deployment strategy")
            
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
                print(f"✅ Dockerfile deployment successful: {server_url}")
            else:
                print("❌ Dockerfile deployment failed")
        
        # Strategy 3: Node.js/Next.js project (package.json present)
        elif os.path.exists(os.path.join(repo_dir, 'package.json')):
            await manager.broadcast("🟩 package.json detected, deploying Node.js application...")
            print("🟩 Using Node.js deployment strategy")
            server_url = await handle_node_project_deployment(repo_dir, repo_name, new_container_name)
            if server_url:
                final_status = "success"
                print(f"✅ Node.js deployment successful: {server_url}")
            else:
                print("❌ Node.js deployment failed")

        # Strategy 4: Check for static website
        elif any(f.endswith('.html') for f in os.listdir(repo_dir) if os.path.isfile(os.path.join(repo_dir, f))):
            await manager.broadcast("🌐 Static website detected, deploying with auto-generated Dockerfile...")
            print("🌐 Using static website deployment strategy")
            server_url = await handle_static_website_deployment(repo_dir, repo_name, new_container_name)
            if server_url:
                final_status = "success"
                print(f"✅ Static website deployment successful: {server_url}")
            else:
                print("❌ Static website deployment failed")
        
        # Strategy 5: AI-generated Dockerfile (fallback)
        else:
            await manager.broadcast("🤖 No recognized deployment pattern found.")
            print("🤖 Repository analysis:")
            print(f"   - Has docker-compose files: {has_compose}")
            print(f"   - Has Dockerfile: {has_dockerfile}")
            html_files = [f for f in os.listdir(repo_dir) if f.endswith('.html') and os.path.isfile(os.path.join(repo_dir, f))]
            print(f"   - HTML files found: {html_files}")
            
            # Check if it's just documentation/files without code
            all_files = [f for f in os.listdir(repo_dir) if os.path.isfile(os.path.join(repo_dir, f))]
            code_files = [f for f in all_files if any(f.endswith(ext) for ext in ['.js', '.py', '.java', '.go', '.rs', '.php', '.rb', '.cs', '.cpp', '.c', '.ts', '.jsx', '.tsx', '.vue', '.html', '.css'])]
            
            await manager.broadcast(f"📁 Repository contains {len(all_files)} files, {len(code_files)} appear to be code files")
            print(f"📁 All files: {all_files}")
            print(f"📁 Code files: {code_files}")
            
            if not code_files:
                error_msg = f"❌ Repository appears to contain only documentation/assets, no deployable code found. Files: {all_files}"
                await manager.broadcast(error_msg)
                print(error_msg)
                final_status = "failed"
            else:
                await manager.broadcast("🤖 Attempting AI-generated Dockerfile...")
                print("🤖 Using AI Dockerfile generation strategy")
                server_url = await handle_ai_dockerfile_deployment(repo_dir, repo_name, new_container_name)
                if server_url:
                    final_status = "success"
                    print(f"✅ AI Dockerfile deployment successful: {server_url}")
                else:
                    print("❌ AI Dockerfile deployment failed")
        
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


async def run_split_deployment(frontend_url: str, backend_url: str, user_id: Optional[int] = None, env_dir: Optional[str] = None, parent_project_id: Optional[int] = None) -> Optional[Tuple[str, str]]:
    """
    Deploy split frontend and backend repositories.
    
    Args:
        frontend_url: Frontend repository URL
        backend_url: Backend repository URL
        user_id: User ID for tracking
        env_dir: Optional directory containing environment files
    
    Returns:
        Tuple of (container_name, deployed_url) if successful, None if failed
    """
    await manager.broadcast(f"🔄 Starting split deployment...")
    await manager.broadcast(f"📦 Frontend: {frontend_url}")
    await manager.broadcast(f"📦 Backend: {backend_url}")
    
    # If no parent_project_id provided, create a parent deployment record first
    if parent_project_id is None:
        fe_name = extract_repo_name(frontend_url)
        be_name = extract_repo_name(backend_url)
        parent_name = f"{fe_name}-{be_name}"
        combined_git_url = f"split::{frontend_url}|{backend_url}"
        
        with Session(engine) as session:
            parent_deployment = Deployment(
                user_id=user_id,
                git_url=combined_git_url,
                status='starting',
                deployed_url=None,
                container_name=f"{parent_name.lower().replace(' ', '-')}-{str(uuid.uuid4())[:8]}",
                app_name=parent_name,
                created_at=datetime.datetime.utcnow(),
                parent_project_id=None,
                component_type=None
            )
            session.add(parent_deployment)
            session.commit()
            session.refresh(parent_deployment)
            parent_project_id = parent_deployment.id
            await manager.broadcast(f"📋 Created parent project: {parent_name} (ID: {parent_project_id})")
    
    # Deploy backend first
    await manager.broadcast("🔧 Deploying backend repository...")
    backend_result = await run_deployment_pipeline(backend_url, user_id=user_id, env_dir=env_dir, parent_project_id=parent_project_id, component_type='backend')
    
    if not backend_result:
        await manager.broadcast("❌ Backend deployment failed")
        return None
    
    backend_container, backend_url_deployed = backend_result
    await manager.broadcast(f"✅ Backend deployed: {backend_url_deployed}")
    
    # Deploy frontend (can use backend URL as environment variable)
    await manager.broadcast("🎨 Deploying frontend repository...")
    
    # If we have env_dir, add backend URL to frontend env vars
    if env_dir and backend_url_deployed:
        frontend_env_path = os.path.join(env_dir, "frontend.env")
        backend_api_url = backend_url_deployed.rstrip('/')
        with open(frontend_env_path, "a") as f:
            f.write(f"\n# Backend API URL\nREACT_APP_API_URL={backend_api_url}\nNEXT_PUBLIC_API_URL={backend_api_url}\nVITE_API_URL={backend_api_url}\nAPI_URL={backend_api_url}\n")
        await manager.broadcast(f"🔗 Added backend URL to frontend env vars: {backend_api_url}")
    
    frontend_result = await run_deployment_pipeline(frontend_url, user_id=user_id, env_dir=env_dir, parent_project_id=parent_project_id, component_type='frontend')
    
    if not frontend_result:
        await manager.broadcast("❌ Frontend deployment failed")
        return None
    
    frontend_container, frontend_url_deployed = frontend_result
    await manager.broadcast(f"✅ Frontend deployed: {frontend_url_deployed}")
    await manager.broadcast(f"🎉 Split deployment complete!")
    await manager.broadcast(f"   Frontend: {frontend_url_deployed}")
    await manager.broadcast(f"   Backend: {backend_url_deployed}")
    
    # Update parent project status to success
    with Session(engine) as session:
        parent = session.get(Deployment, parent_project_id)
        if parent:
            parent.status = "success"
            parent.deployed_url = frontend_url_deployed  # Use frontend as primary URL
            parent.updated_at = datetime.datetime.utcnow()
            session.add(parent)
            session.commit()
    
    # Return frontend URL as primary (user-facing)
    return (frontend_container, frontend_url_deployed)
