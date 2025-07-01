import os
import platform
import subprocess
import asyncio
from tabnanny import check

NGINX_SITES_AVAILABLE = "/opt/homebrew/etc/nginx/servers"

BASE_DOMAIN = "localhost"

def create_nginx_config(project_id: str, container_port: int):
    server_name = f"{project_id}.{BASE_DOMAIN}"
    config_content = f"""
server {{
    listen 8888;
    server_name {server_name};

    location / {{
        proxy_pass http://localhost:{container_port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
}}
"""
    config_path = os.path.join(NGINX_SITES_AVAILABLE, f"{project_id}.conf")
    print(f"Creating Nginx config for {server_name} at {config_path}")
    try:
        with open(config_path, "w") as config_file:
            config_file.write(config_content)
        print(f"✅ Successfully created Nginx config file.")
        return True
    except Exception as e:
        print(f"❌ Failed to create Nginx config: {e}")
        return False

async def reload_nginx():
    """
    Executes the command to reload Nginx configuration.
    """
    print("Reloading Nginx configuration...")
    try:
        _os = platform.system()
        if _os == 'darwin':
            await asyncio.to_thread(subprocess.run, ["sudo", "brew", "services", "restart", "nginx"], check=True)
        if _os=="liunx":
            await asyncio.to_thread(subprocess.run,['sudo','systemctl','restart','nginx'],check=True)

        print("✅ Nginx reloaded successfully.")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to reload Nginx: {e}")

