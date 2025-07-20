#!/usr/bin/env python3
"""
Setup script for DevOps Butler Nginx Proxy Container
Creates and starts the Nginx proxy container with proper configuration.
"""

import subprocess
import os
import sys

# Configuration
NGINX_CONTAINER_NAME = "butler-nginx-proxy"
NGINX_CONFIG_DIR = "/opt/homebrew/etc/nginx/servers"
NGINX_PORT = 80  # Changed from 8888 to 80

def run_command(command, description):
    """Run a command and handle errors."""
    print(f"🔄 {description}")
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print(f"✅ {description} - Success")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} - Failed: {e.stderr}")
        return False

def main():
    print("🚀 Setting up Nginx Proxy Container for DevOps Butler")
    print("=" * 60)
    
    # Step 1: Ensure Nginx config directory exists
    print(f"📁 Ensuring Nginx config directory exists: {NGINX_CONFIG_DIR}")
    os.makedirs(NGINX_CONFIG_DIR, exist_ok=True)
    
    # Step 2: Stop and remove existing container if it exists
    print("🐳 Creating Nginx proxy container...")
    
    # Stop existing container
    stop_command = ["docker", "stop", NGINX_CONTAINER_NAME]
    subprocess.run(stop_command, capture_output=True)  # Ignore errors if container doesn't exist
    
    # Remove existing container
    remove_command = ["docker", "rm", NGINX_CONTAINER_NAME]
    subprocess.run(remove_command, capture_output=True)  # Ignore errors if container doesn't exist
    
    # Step 3: Create new Nginx proxy container
    print(f"🔄 Creating Nginx proxy container {NGINX_CONTAINER_NAME}")
    
    # Docker run command for the Nginx proxy
    docker_command = [
        "docker", "run", "-d",
        "--name", NGINX_CONTAINER_NAME,
        "--restart", "unless-stopped",
        "-p", f"{NGINX_PORT}:80",
        "-v", f"{NGINX_CONFIG_DIR}:/etc/nginx/conf.d",
        "-v", "/var/run/docker.sock:/var/run/docker.sock:ro",
        "--network", "devops-butler-net",
        "nginx:alpine"
    ]
    
    if run_command(docker_command, f"Creating Nginx proxy container {NGINX_CONTAINER_NAME}"):
        print("✅ Nginx proxy container created successfully!")
    else:
        print("❌ Failed to create Nginx proxy container")
        sys.exit(1)
    
    # Step 4: Verify container is running
    print("🔍 Verifying container status...")
    status_command = ["docker", "ps", "--filter", f"name={NGINX_CONTAINER_NAME}", "--format", "{{.Status}}"]
    try:
        result = subprocess.run(status_command, check=True, capture_output=True, text=True)
        if result.stdout.strip():
            print("✅ Nginx proxy container is running!")
        else:
            print("❌ Nginx proxy container is not running")
            sys.exit(1)
    except subprocess.CalledProcessError:
        print("❌ Failed to check container status")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print(f"🌐 Proxy will be available at: http://localhost:{NGINX_PORT}")
    print(f"📝 Deployed applications will be accessible at: http://[repo-name].localhost")
    print("\n🎉 Nginx proxy setup completed successfully!")
    print("DevOps Butler is now ready to deploy applications.")

if __name__ == "__main__":
    main() 