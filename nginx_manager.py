import os
import subprocess
import asyncio

NGINX_SITES_AVAILABLE = "/opt/homebrew/etc/nginx/servers"

BASE_DOMAIN = "localhost"

def create_nginx_config(repo_name: str, container_name: str, internal_port: int):
    """
    Creates an Nginx configuration file for a project.
    
    Args:
        repo_name: The clean repository name (used for the URL)
        container_name: The unique container name (used for Docker network routing)
        internal_port: The internal port the application is listening on inside the container
    """
    server_name = f"{repo_name}.localhost"
    config_path = os.path.join(NGINX_SITES_AVAILABLE, f"{repo_name}.conf")  # Use the clean repo_name for the file

    config_content = f"""
server {{
    listen 8888;
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
        print("✅ Successfully created Nginx config file.")
        return True
    except Exception as e:
        print(f"❌ Failed to create Nginx config file: {e}")
        return False

def delete_nginx_config(repo_name: str):
    """
    Removes an Nginx configuration file for a project.
    
    Args:
        repo_name: The clean repository name (used for the config file name)
    """
    config_path = os.path.join(NGINX_SITES_AVAILABLE, f"{repo_name}.conf")
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

