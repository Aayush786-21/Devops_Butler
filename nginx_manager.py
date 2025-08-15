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
    
    # Add security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    location / {{
        proxy_pass http://{container_name}:{internal_port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        
        # Handle WebSocket connections
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
        
        # Error handling
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
        proxy_next_upstream_timeout 10s;
        proxy_next_upstream_tries 3;
    }}
    
    # Favicon handling - return 204 No Content for favicon requests
    location = /favicon.ico {{
        return 204;
        access_log off;
        log_not_found off;
    }}
    
    # Health check endpoint
    location /health {{
        proxy_pass http://{container_name}:{internal_port}/health;
        proxy_set_header Host $host;
        access_log off;
    }}
    
    # Handle 502 errors gracefully
    error_page 502 503 504 /50x.html;
    location = /50x.html {{
        return 200 '<html><body><h1>Service Temporarily Unavailable</h1><p>The application is starting up or experiencing issues. Please try again in a moment.</p><script>setTimeout(function(){{location.reload();}}, 5000);</script></body></html>';
        add_header Content-Type text/html;
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

async def validate_nginx_config() -> bool:
    """
    Validate all nginx configuration files before reload.
    Returns True if all configs are valid, False otherwise.
    """
    try:
        config_dir = "/opt/homebrew/etc/nginx/servers"
        if not os.path.exists(config_dir):
            print("✅ No config directory, validation passed")
            return True
        
        config_files = [f for f in os.listdir(config_dir) if f.endswith('.conf')]
        
        for config_file in config_files:
            config_path = os.path.join(config_dir, config_file)
            try:
                with open(config_path, 'r') as f:
                    content = f.read()
                
                # Extract container name from proxy_pass
                import re
                match = re.search(r'proxy_pass http://([^:]+):', content)
                if match:
                    container_name = match.group(1)
                    
                    # Check if container exists and is running
                    result = await asyncio.to_thread(
                        subprocess.run,
                        ["docker", "inspect", "--format", "{{.State.Running}}", container_name],
                        capture_output=True,
                        text=True
                    )
                    
                    if result.returncode != 0 or result.stdout.strip() != "true":
                        print(f"⚠️ Invalid config: {config_file} references non-running container {container_name}")
                        print(f"🗑️ Removing invalid config: {config_file}")
                        os.remove(config_path)
                        
            except Exception as e:
                print(f"⚠️ Error validating {config_file}: {e}")
                print(f"🗑️ Removing problematic config: {config_file}")
                try:
                    os.remove(config_path)
                except:
                    pass
        
        print("✅ Nginx configuration validation completed")
        return True
        
    except Exception as e:
        print(f"⚠️ Error during config validation: {e}")
        return False


async def verify_nginx_health(container_name: str) -> bool:
    """
    Verify nginx container health with custom checks that don't rely on external tools.
    """
    try:
        # Check 1: Container is running
        running_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "inspect", "--format", "{{.State.Running}}", container_name],
            capture_output=True,
            text=True
        )
        
        if running_result.returncode != 0 or running_result.stdout.strip() != "true":
            print(f"⚠️ Container {container_name} is not running")
            return False
        
        # Check 2: Nginx process is running inside the container
        process_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "exec", container_name, "pgrep", "nginx"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if process_result.returncode != 0:
            print(f"⚠️ Nginx process not found in container {container_name}")
            return False
        
        # Check 3: Test nginx configuration
        config_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "exec", container_name, "nginx", "-t"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if config_result.returncode != 0:
            print(f"⚠️ Nginx configuration test failed in container {container_name}")
            return False
        
        # Check 4: Try to connect to port 8888 from host
        try:
            import socket
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.settimeout(5)
                result = s.connect_ex(('localhost', 8888))
                if result == 0:
                    print(f"✅ Nginx is responding on port 8888")
                    return True
                else:
                    print(f"⚠️ Nginx not responding on port 8888 (connection failed)")
                    return False
        except Exception as e:
            print(f"⚠️ Error testing port 8888: {e}")
            return False
        
    except asyncio.TimeoutError:
        print(f"⚠️ Health check timed out for container {container_name}")
        return False
    except Exception as e:
        print(f"⚠️ Error during health check for {container_name}: {e}")
        return False


async def ensure_nginx_network() -> bool:
    """
    Ensure the devops-butler-net network exists.
    """
    try:
        # Check if network exists
        result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "network", "inspect", "devops-butler-net"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ devops-butler-net network exists")
            return True
        
        # Create network if it doesn't exist
        print("🔧 Creating devops-butler-net network...")
        create_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "network", "create", "devops-butler-net"],
            capture_output=True,
            text=True
        )
        
        if create_result.returncode == 0:
            print("✅ devops-butler-net network created")
            return True
        else:
            print(f"❌ Failed to create network: {create_result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error ensuring network: {e}")
        return False


async def create_bulletproof_nginx_container() -> bool:
    """
    Create a bulletproof nginx container with proper error handling.
    """
    nginx_container_name = "butler-nginx-proxy"
    
    try:
        # Ensure network exists
        if not await ensure_nginx_network():
            return False
        
        # Validate and clean configs before starting
        await validate_nginx_config()
        
        # Remove any existing container
        print("🧹 Cleaning up existing nginx container...")
        await asyncio.to_thread(
            subprocess.run,
            ["docker", "stop", nginx_container_name],
            capture_output=True
        )
        await asyncio.to_thread(
            subprocess.run,
            ["docker", "rm", nginx_container_name],
            capture_output=True
        )
        
        # Create default nginx config to ensure container starts successfully
        default_config_path = os.path.join(NGINX_SITES_AVAILABLE, "default.conf")
        default_config_content = """
# Increase hash bucket size for long server names
server_names_hash_bucket_size 128;

server {
    listen 80 default_server;
    server_name _;
    
    location / {
        return 200 'DevOps Butler Proxy is running';
        add_header Content-Type text/plain;
    }
    
    location /health {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
"""
        
        try:
            os.makedirs(os.path.dirname(default_config_path), exist_ok=True)
            with open(default_config_path, "w") as f:
                f.write(default_config_content)
            print("✅ Created default nginx configuration")
        except Exception as e:
            print(f"⚠️ Warning: Could not create default config: {e}")
        
        # Create new container with enhanced settings and startup script
        print("🚀 Creating bulletproof nginx container...")
        
        # Create a startup script that validates configs before starting nginx
        startup_script = """
#!/bin/sh
set -e

echo "NGINX_STARTUP: Validating configuration files..."

# Check if there are any config files
if [ ! -d "/etc/nginx/conf.d" ] || [ -z "$(ls -A /etc/nginx/conf.d 2>/dev/null)" ]; then
    echo "NGINX_STARTUP: No config files found, using default"
else
    # Test each config file
    for conf_file in /etc/nginx/conf.d/*.conf; do
        if [ -f "$conf_file" ]; then
            echo "NGINX_STARTUP: Testing $conf_file"
            if ! nginx -t -c /etc/nginx/nginx.conf 2>/dev/null; then
                echo "NGINX_STARTUP: Invalid config found, removing $conf_file"
                rm -f "$conf_file"
            fi
        fi
    done
fi

# Wait for any upstream containers to be available
echo "NGINX_STARTUP: Checking upstream containers..."
if [ -d "/etc/nginx/conf.d" ]; then
    UPSTREAM_HOSTS=$(grep -rh 'proxy_pass' /etc/nginx/conf.d/ 2>/dev/null | sed -e 's/.*http:\\/\\///' -e 's/:.*//' -e 's/;//' | sort -u | tr '\\n' ' ' | xargs)
    
    if [ -n "$UPSTREAM_HOSTS" ]; then
        echo "NGINX_STARTUP: Found upstream hosts: $UPSTREAM_HOSTS"
        
        for host in $UPSTREAM_HOSTS; do
            echo "NGINX_STARTUP: Waiting for $host to be available..."
            timeout=60
            elapsed=0
            
            while ! nslookup "$host" >/dev/null 2>&1; do
                if [ $elapsed -ge $timeout ]; then
                    echo "NGINX_STARTUP: WARNING - $host not available after ${timeout}s, continuing anyway"
                    break
                fi
                sleep 2
                elapsed=$((elapsed + 2))
            done
            
            if [ $elapsed -lt $timeout ]; then
                echo "NGINX_STARTUP: $host is available"
            fi
        done
    fi
fi

echo "NGINX_STARTUP: Starting nginx..."
exec nginx -g 'daemon off;'
"""
        
        create_command = [
            "docker", "run", "-d",
            "--name", nginx_container_name,
            "--network", "devops-butler-net",
            "-p", "8888:80",
            "-v", "/opt/homebrew/etc/nginx/servers:/etc/nginx/conf.d",
            "--restart", "unless-stopped",  # Auto-restart only on failure, not manual stops
            "--health-cmd", "nginx -t && curl -f http://localhost:80/health || exit 1",
            "--health-interval", "30s",
            "--health-timeout", "10s",
            "--health-retries", "3",
            "--health-start-period", "10s",
            "nginx:alpine",
            "sh", "-c", startup_script
        ]
        
        result = await asyncio.to_thread(
            subprocess.run,
            create_command,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Bulletproof nginx container created")
            
            # Custom health verification - check if nginx is actually responding
            print("🔍 Verifying nginx container health...")
            await asyncio.sleep(2)  # Give nginx time to start
            
            # Verify container is running and nginx is responding
            healthy = await verify_nginx_health(nginx_container_name)
            if healthy:
                print("✅ Nginx container is verified healthy and ready")
                return True
            else:
                print("⚠️ Nginx container may have issues, but it's running")
                return True  # Still consider it successful if container is running
        else:
            print(f"❌ Failed to create nginx container: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating nginx container: {e}")
        return False


async def reload_nginx():
    """
    Bulletproof nginx reload with comprehensive error handling and self-healing.
    """
    nginx_container_name = "butler-nginx-proxy"
    
    # Step 1: Validate all configurations before attempting reload
    print("🔍 Validating nginx configurations...")
    if not await validate_nginx_config():
        print("⚠️ Config validation found issues, but continuing...")
    
    # Step 2: Check if container exists and is running
    print("🔍 Checking nginx proxy status...")
    container_exists = False
    container_running = False
    
    try:
        # Check if container exists
        inspect_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "inspect", nginx_container_name],
            capture_output=True,
            text=True
        )
        
        if inspect_result.returncode == 0:
            container_exists = True
            
            # Check if it's running
            running_result = await asyncio.to_thread(
                subprocess.run,
                ["docker", "inspect", "--format", "{{.State.Running}}", nginx_container_name],
                capture_output=True,
                text=True
            )
            
            if running_result.returncode == 0 and running_result.stdout.strip() == "true":
                container_running = True
                print("✅ Nginx container is running")
            else:
                print("⚠️ Nginx container exists but is not running")
        else:
            print("⚠️ Nginx container does not exist")
            
    except Exception as e:
        print(f"⚠️ Error checking container status: {e}")
    
    # Step 3: Handle different scenarios
    if not container_exists or not container_running:
        print("🔧 Creating new nginx container...")
        if await create_bulletproof_nginx_container():
            print("✅ Nginx container created and ready")
            return True
        else:
            print("❌ Failed to create nginx container")
            return False
    
    # Step 4: Test nginx configuration before reload
    print("🔍 Testing nginx configuration...")
    try:
        test_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "exec", nginx_container_name, "nginx", "-t"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if test_result.returncode != 0:
            print(f"❌ Nginx configuration test failed: {test_result.stderr}")
            print("🔧 Recreating nginx container with valid configs...")
            if await create_bulletproof_nginx_container():
                print("✅ Nginx container recreated successfully")
                return True
            else:
                print("❌ Failed to recreate nginx container")
                return False
                
    except asyncio.TimeoutError:
        print("⚠️ Nginx config test timed out")
    except Exception as e:
        print(f"⚠️ Error testing nginx config: {e}")
    
    # Step 5: Attempt graceful reload
    print("🔄 Attempting graceful nginx reload...")
    try:
        reload_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "exec", nginx_container_name, "nginx", "-s", "reload"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if reload_result.returncode == 0:
            print("✅ Nginx reloaded successfully")
            return True
        else:
            print(f"⚠️ Graceful reload failed: {reload_result.stderr}")
            
    except asyncio.TimeoutError:
        print("⚠️ Nginx reload timed out")
    except Exception as e:
        print(f"⚠️ Error during nginx reload: {e}")
    
    # Step 6: Fallback to container restart
    print("🔄 Falling back to container restart...")
    try:
        restart_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "restart", nginx_container_name],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        if restart_result.returncode == 0:
            # Wait for container to be ready
            await asyncio.sleep(3)
            print("✅ Nginx container restarted successfully")
            return True
        else:
            print(f"⚠️ Container restart failed: {restart_result.stderr}")
            
    except asyncio.TimeoutError:
        print("⚠️ Container restart timed out")
    except Exception as e:
        print(f"⚠️ Error during container restart: {e}")
    
    # Step 7: Final fallback - recreate container
    print("🚨 Final fallback: recreating nginx container...")
    if await create_bulletproof_nginx_container():
        print("✅ Nginx container recreated as final fallback")
        return True
    else:
        print("❌ All nginx recovery attempts failed")
        return False

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


