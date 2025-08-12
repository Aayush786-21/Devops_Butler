import os
import subprocess
import asyncio

NGINX_SITES_AVAILABLE = "/opt/homebrew/etc/nginx/servers"

BASE_DOMAIN = "localhost"

DOCKERFILE_CONTENT = """\
FROM nginx:alpine

# Install required tools for waiting
RUN apk add --no-cache bind-tools

# Copy our custom startup script into the container's entrypoint directory
COPY wait-for-upstream.sh /docker-entrypoint.d/40-wait-for-upstream.sh

# Make the script executable
RUN chmod +x /docker-entrypoint.d/40-wait-for-upstream.sh

# Create a health check endpoint
COPY health-check.sh /usr/local/bin/health-check.sh
RUN chmod +x /usr/local/bin/health-check.sh

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD /usr/local/bin/health-check.sh
"""

WAIT_FOR_UPSTREAM_SH = """\
#!/bin/sh
# nginx/wait-for-upstream.sh

set -e

echo "NGINX_WAIT: Starting up, will wait for upstream hosts..."

# Read all .conf files and find all the proxy_pass hostnames
# This 'grep' command finds lines with 'proxy_pass', extracts the hostname,
# and removes duplicates.
UPSTREAM_HOSTS=$(grep -rh 'proxy_pass' /etc/nginx/conf.d | sed -e 's/.*http:\\/\\///' -e 's/:.*//' -e 's/;//' | sort -u)

if [ -z "$UPSTREAM_HOSTS" ]; then
    echo "NGINX_WAIT: No upstream hosts found in configs. Starting Nginx immediately."
else
    echo "NGINX_WAIT: Found upstream hosts to wait for: $UPSTREAM_HOSTS"
    
    # Maximum wait time in seconds (5 minutes)
    MAX_WAIT=300
    ELAPSED=0
    
    for host in $UPSTREAM_HOSTS; do
        echo "NGINX_WAIT: Waiting for host '$host' to be available..."
        
        # Use 'nslookup' to check DNS resolution instead of ping (more reliable in containers)
        while ! nslookup "$host" >/dev/null 2>&1; do
            if [ $ELAPSED -ge $MAX_WAIT ]; then
                echo "NGINX_WAIT: ERROR - Host '$host' is still not available after $MAX_WAIT seconds!"
                echo "NGINX_WAIT: This might indicate a problem with the upstream container."
                exit 1
            fi
            
            echo "NGINX_WAIT: Host '$host' is not yet available, sleeping... (elapsed: ${ELAPSED}s)"
            sleep 2
            ELAPSED=$((ELAPSED + 2))
        done
        
        echo "NGINX_WAIT: Host '$host' is now available."
    done
    
    echo "NGINX_WAIT: All upstream hosts are available. Starting Nginx."
fi

# The original entrypoint script will now continue and start Nginx.
"""

HEALTH_CHECK_SH = """\
#!/bin/sh
# nginx/health-check.sh

# Simple health check script for Nginx container
# This checks if Nginx is responding to HTTP requests

set -e

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "Nginx is not running"
    exit 1
fi

# Check if nginx is responding on port 80
if ! curl -f -s http://localhost:80 > /dev/null; then
    echo "Nginx is not responding on port 80"
    exit 1
fi

echo "Nginx is healthy"
exit 0
"""

def create_nginx_config(project_id: str, repo_name: str, container_name: str, internal_port: int):
    """
    Creates an Nginx configuration file for a project.
    
    Args:
        project_id: The unique project identifier (used for the config file name)
        repo_name: The clean repository name (used for the URL)
        container_name: The unique container name (used for Docker network routing)
        internal_port: The internal port the application is listening on inside the container
    """
    print(f"🔧 Creating Nginx config for project: {project_id}, repo: {repo_name}, container: {container_name}, port: {internal_port}")
    server_name = f"{container_name}.localhost"  # Use unique container_name for server_name
    config_path = os.path.join(NGINX_SITES_AVAILABLE, f"{container_name}.conf")  # Use unique container_name for config file

    config_content = f"""
server {{
    listen 80;
    server_name {server_name};
    location / {{
        proxy_pass http://{container_name}:{internal_port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
}}
"""
    print(f"Creating Nginx config at: {config_path}")
    try:
        # Ensure the parent directory exists
        os.makedirs(os.path.dirname(config_path), exist_ok=True)
        # This writes the file to your Mac, and the volume mount does the rest.
        with open(config_path, "w") as config_file:
            config_file.write(config_content)
        print(f"✅ Successfully created Nginx config for {repo_name}")
        return True
    except Exception as e:
        print(f"❌ Failed to create Nginx config for {repo_name}. Error: {e}")
        return False

def delete_nginx_config(project_id: str):
    """
    Removes an Nginx configuration file for a project.
    
    Args:
        project_id: The unique project identifier (used for the config file name)
    """
    config_path = os.path.join(NGINX_SITES_AVAILABLE, f"{project_id}.conf")
    print(f"Removing Nginx config at: {config_path}")
    try:
        if os.path.exists(config_path):
            os.remove(config_path)
            print("✅ Successfully removed Nginx config file.")
            return True
        else:
            print("⚠️ Nginx config file not found (may have been already removed).")
            return True
    except Exception as e:
        print(f"❌ Failed to remove Nginx config file: {e}")
        return False

async def is_container_running(container_name: str) -> bool:
    """Checks if a container is currently in a 'running' state."""
    command = [
        "docker", "inspect",
        "--format", "{{.State.Running}}",
        container_name
    ]
    try:
        result = await asyncio.to_thread(
            subprocess.run,
            command,
            capture_output=True, text=True, check=True
        )
        return result.stdout.strip() == 'true'
    except subprocess.CalledProcessError:
        # This will happen if the container doesn't exist at all
        return False

async def reload_nginx():
    """
    Waits for the Nginx proxy to be running, then gracefully reloads it.
    """
    nginx_container_name = "butler-nginx-proxy"
    print("Ensuring Nginx proxy container is running...")

    max_wait_attempts = 5
    is_running = False
    for attempt in range(max_wait_attempts):
        is_running = await is_container_running(nginx_container_name)
        if is_running:
            print("✅ Nginx proxy is running.")
            break
        print(f"    (Attempt {attempt+1}) Nginx proxy not ready, waiting...")
        await asyncio.sleep(1)

    if not is_running:
        print("❌ Nginx proxy did not start. Attempting a full restart...")
        # Your fallback logic can go here
        await asyncio.to_thread(subprocess.run, ["docker", "restart", nginx_container_name])
        await asyncio.sleep(2) # Give it time to come up after a restart
        return

    print("Reloading Nginx configuration...")
    try:
        reload_command = ["docker", "exec", nginx_container_name, "nginx", "-s", "reload"]
        await asyncio.to_thread(subprocess.run, reload_command, check=True, capture_output=True)
        print("✅ Nginx reloaded successfully.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Graceful reload failed, even though container is running: {e.stderr}")
        # As a final fallback, you could still do a full restart here if needed.
        try:
            print("Attempting fallback: restarting nginx container...")
            restart_command = ["docker", "restart", nginx_container_name]
            await asyncio.to_thread(subprocess.run, restart_command, check=True)
            print("✅ Nginx container restarted successfully.")
        except subprocess.CalledProcessError as restart_error:
            print(f"❌ Failed to restart Nginx container: {restart_error}")

def get_dockerfile_content() -> str:
    """
    Returns the content of the Dockerfile for the nginx container.
    """
    return DOCKERFILE_CONTENT

def get_wait_for_upstream_sh() -> str:
    """
    Returns the content of the wait-for-upstream.sh script.
    """
    return WAIT_FOR_UPSTREAM_SH

def get_health_check_sh() -> str:
    """
    Returns the content of the health-check.sh script.
    """
    return HEALTH_CHECK_SH


