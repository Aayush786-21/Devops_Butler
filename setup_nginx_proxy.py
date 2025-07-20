#!/usr/bin/env python3
"""
Setup script for the Nginx proxy container used by DevOps Butler.
This creates a Docker container that acts as a reverse proxy for all deployed applications.
"""

import subprocess
import asyncio
import os
import sys

NGINX_CONTAINER_NAME = "butler-nginx-proxy"
NGINX_CONFIG_DIR = "/opt/homebrew/etc/nginx/servers"
NGINX_PORT = 8888

async def run_command(command, description=""):
    """Run a command and return success status."""
    try:
        print(f"🔄 {description}")
        result = await asyncio.to_thread(
            subprocess.run,
            command,
            capture_output=True,
            text=True,
            check=True
        )
        print(f"✅ {description} - Success")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Failed: {e.stderr}")
        return False

async def check_container_exists(container_name):
    """Check if a Docker container exists."""
    try:
        result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "inspect", container_name],
            capture_output=True,
            text=True
        )
        return result.returncode == 0
    except Exception:
        return False

async def check_container_running(container_name):
    """Check if a Docker container is running."""
    try:
        result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "inspect", "--format", "{{.State.Running}}", container_name],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip() == 'true'
    except subprocess.CalledProcessError:
        return False

async def setup_nginx_proxy():
    """Set up the Nginx proxy container."""
    print("🚀 Setting up Nginx Proxy Container for DevOps Butler")
    print("=" * 60)
    
    # Check if container already exists
    container_exists = await check_container_exists(NGINX_CONTAINER_NAME)
    container_running = await check_container_running(NGINX_CONTAINER_NAME)
    
    if container_running:
        print(f"✅ Container {NGINX_CONTAINER_NAME} is already running!")
        return True
    
    if container_exists:
        print(f"🔄 Container {NGINX_CONTAINER_NAME} exists but not running. Starting it...")
        success = await run_command(
            ["docker", "start", NGINX_CONTAINER_NAME],
            f"Starting existing container {NGINX_CONTAINER_NAME}"
        )
        if success:
            print("✅ Nginx proxy container started successfully!")
            return True
    
    # Create the Nginx config directory if it doesn't exist
    print(f"📁 Ensuring Nginx config directory exists: {NGINX_CONFIG_DIR}")
    os.makedirs(NGINX_CONFIG_DIR, exist_ok=True)
    
    # Create the main Nginx configuration
    main_config_path = "/opt/homebrew/etc/nginx/nginx.conf"
    if not os.path.exists(main_config_path):
        print(f"⚠️ Main Nginx config not found at {main_config_path}")
        print("Please ensure Nginx is installed via Homebrew: brew install nginx")
        return False
    
    # Create the Nginx proxy container
    print("🐳 Creating Nginx proxy container...")
    
    # Docker run command for the Nginx proxy
    docker_command = [
        "docker", "run", "-d",
        "--name", NGINX_CONTAINER_NAME,
        "--restart", "unless-stopped",
        "-p", f"{NGINX_PORT}:80",
        "-v", f"{NGINX_CONFIG_DIR}:/etc/nginx/conf.d",
        "-v", "/var/run/docker.sock:/var/run/docker.sock:ro",
        "--network", "bridge",
        "nginx:alpine"
    ]
    
    success = await run_command(
        docker_command,
        f"Creating Nginx proxy container {NGINX_CONTAINER_NAME}"
    )
    
    if success:
        print("✅ Nginx proxy container created successfully!")
        
        # Wait a moment for the container to start
        await asyncio.sleep(2)
        
        # Verify the container is running
        if await check_container_running(NGINX_CONTAINER_NAME):
            print("✅ Nginx proxy container is running!")
            print(f"🌐 Proxy will be available at: http://localhost:{NGINX_PORT}")
            print("📝 Deployed applications will be accessible at: http://[repo-name].localhost:8888")
            return True
        else:
            print("❌ Container was created but is not running. Check Docker logs:")
            await run_command(["docker", "logs", NGINX_CONTAINER_NAME], "Checking container logs")
            return False
    else:
        print("❌ Failed to create Nginx proxy container")
        return False

async def main():
    """Main setup function."""
    try:
        success = await setup_nginx_proxy()
        if success:
            print("\n🎉 Nginx proxy setup completed successfully!")
            print("DevOps Butler is now ready to deploy applications.")
        else:
            print("\n❌ Nginx proxy setup failed.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n⚠️ Setup interrupted by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error during setup: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 