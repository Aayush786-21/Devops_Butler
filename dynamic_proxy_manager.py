#!/usr/bin/env python3
"""
Dynamic Proxy Manager for DevOps Butler

This module automatically:
1. Discovers running containers
2. Generates nginx configurations
3. Creates dynamic index pages
4. Monitors and updates proxy configurations in real-time
5. Handles routing errors and mismatches
"""

import os
import subprocess
import json
import asyncio
import time
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path
import re

NGINX_SITES_AVAILABLE = "/opt/homebrew/etc/nginx/servers"
NGINX_CONTAINER_NAME = "butler-nginx-proxy"

class ContainerInfo:
    def __init__(self, name: str, image: str, ports: Dict[str, List[Dict]], 
                 networks: List[str], status: str, created: str):
        self.name = name
        self.image = image
        self.ports = ports
        self.networks = networks
        self.status = status
        self.created = created
        self.internal_port = self._detect_internal_port()
        self.external_port = self._detect_external_port()
        self.project_info = self._parse_project_info()

    def _detect_internal_port(self) -> int:
        """Detect the internal port the container is listening on"""
        if self.ports:
            for port_info in self.ports.values():
                if isinstance(port_info, list) and port_info:
                    # Extract port number from format like "80/tcp"
                    for port_key in self.ports.keys():
                        if "/tcp" in port_key:
                            return int(port_key.split("/")[0])
        return 80  # Default fallback

    def _detect_external_port(self) -> Optional[int]:
        """Detect the external port mapped to the container"""
        if self.ports:
            for port_info in self.ports.values():
                if isinstance(port_info, list) and port_info:
                    for mapping in port_info:
                        if "HostPort" in mapping:
                            return int(mapping["HostPort"])
        return None

    def _parse_project_info(self) -> Dict[str, str]:
        """Parse project information from container name"""
        # Extract meaningful info from container name
        parts = self.name.split('-')
        
        if len(parts) >= 2:
            username = parts[0]
            repo = '-'.join(parts[1:-1]) if len(parts) > 2 else parts[1]
            hash_id = parts[-1] if len(parts) > 2 else ""
            
            return {
                "username": username,
                "repo": repo,
                "hash_id": hash_id,
                "display_name": f"{username}/{repo}",
                "short_name": repo.replace('-', ' ').title()
            }
        
        return {
            "username": "unknown",
            "repo": self.name,
            "hash_id": "",
            "display_name": self.name,
            "short_name": self.name.replace('-', ' ').title()
        }

    @property
    def server_name(self) -> str:
        return f"{self.name}.localhost"

    @property
    def proxy_url(self) -> str:
        return f"http://{self.name}:{self.internal_port}"

class DynamicProxyManager:
    def __init__(self):
        self.last_update = 0
        self.containers_cache = {}
        self.config_templates = self._load_templates()

    def _load_templates(self) -> Dict[str, str]:
        """Load nginx configuration and HTML templates"""
        return {
            "nginx_config": """
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
        proxy_pass {proxy_url};
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
    
    # Health check endpoint
    location /health {{
        proxy_pass {proxy_url}/health;
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
""",
            "index_template": """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DevOps Butler - Application Directory</title>
    <style>
        :root {{
            --primary: #00ff88;
            --bg-dark: #0a0a0a;
            --bg-card: #1a1a1a;
            --text-primary: #ffffff;
            --text-secondary: #888;
            --border: #333;
        }}
        
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: var(--bg-dark);
            color: var(--text-primary);
            line-height: 1.6;
        }}
        
        .container {{
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
        }}
        
        .header {{
            text-align: center;
            margin-bottom: 40px;
        }}
        
        .header h1 {{
            color: var(--primary);
            font-size: 2.5rem;
            margin-bottom: 10px;
        }}
        
        .header p {{
            color: var(--text-secondary);
            font-size: 1.1rem;
        }}
        
        .stats {{
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-bottom: 40px;
            flex-wrap: wrap;
        }}
        
        .stat {{
            background: var(--bg-card);
            padding: 15px 25px;
            border-radius: 8px;
            text-align: center;
        }}
        
        .stat-number {{
            font-size: 2rem;
            font-weight: bold;
            color: var(--primary);
        }}
        
        .stat-label {{
            color: var(--text-secondary);
            font-size: 0.9rem;
        }}
        
        .apps-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 25px;
            margin-bottom: 40px;
        }}
        
        .app-card {{
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 25px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }}
        
        .app-card::before {{
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--primary);
            opacity: 0;
            transition: opacity 0.3s ease;
        }}
        
        .app-card:hover {{
            transform: translateY(-5px);
            border-color: var(--primary);
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.1);
        }}
        
        .app-card:hover::before {{
            opacity: 1;
        }}
        
        .app-header {{
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
        }}
        
        .app-name {{
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--primary);
            margin-bottom: 5px;
        }}
        
        .app-username {{
            font-size: 0.9rem;
            color: var(--text-secondary);
        }}
        
        .app-status {{
            background: rgba(0, 255, 136, 0.1);
            color: var(--primary);
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 500;
        }}
        
        .app-url {{
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            font-size: 0.85rem;
            color: var(--text-secondary);
            background: rgba(255, 255, 255, 0.05);
            padding: 8px 12px;
            border-radius: 6px;
            margin: 15px 0;
            word-break: break-all;
        }}
        
        .app-details {{
            display: flex;
            gap: 20px;
            margin: 15px 0;
            font-size: 0.9rem;
        }}
        
        .app-detail {{
            color: var(--text-secondary);
        }}
        
        .app-detail strong {{
            color: var(--text-primary);
        }}
        
        .app-actions {{
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }}
        
        .app-link {{
            flex: 1;
            background: var(--primary);
            color: #000;
            padding: 12px 20px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            text-align: center;
            transition: all 0.3s ease;
        }}
        
        .app-link:hover {{
            background: #00cc6a;
            transform: translateY(-2px);
        }}
        
        .direct-link {{
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-primary);
        }}
        
        .direct-link:hover {{
            border-color: var(--primary);
            color: var(--primary);
        }}
        
        .footer {{
            text-align: center;
            margin-top: 60px;
            padding: 30px 0;
            border-top: 1px solid var(--border);
        }}
        
        .footer p {{
            color: var(--text-secondary);
            margin-bottom: 10px;
        }}
        
        .last-update {{
            font-size: 0.8rem;
            color: var(--text-secondary);
            background: var(--bg-card);
            padding: 10px 15px;
            border-radius: 6px;
            display: inline-block;
        }}
        
        .refresh-btn {{
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: var(--primary);
            color: #000;
            border: none;
            padding: 15px;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            cursor: pointer;
            font-size: 1.2rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(0, 255, 136, 0.3);
        }}
        
        .refresh-btn:hover {{
            transform: scale(1.1);
            box-shadow: 0 6px 30px rgba(0, 255, 136, 0.4);
        }}
        
        @media (max-width: 768px) {{
            .container {{ padding: 15px; }}
            .header h1 {{ font-size: 2rem; }}
            .apps-grid {{ grid-template-columns: 1fr; }}
            .stats {{ gap: 15px; }}
            .app-actions {{ flex-direction: column; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 DevOps Butler</h1>
            <p>Automated Container Management & Dynamic Proxy Routing</p>
        </div>
        
        <div class="stats">
            <div class="stat">
                <div class="stat-number">{total_apps}</div>
                <div class="stat-label">Active Applications</div>
            </div>
            <div class="stat">
                <div class="stat-number">{total_ports}</div>
                <div class="stat-label">Exposed Ports</div>
            </div>
            <div class="stat">
                <div class="stat-number">{uptime}</div>
                <div class="stat-label">System Uptime</div>
            </div>
        </div>
        
        <div class="apps-grid">
            {app_cards}
        </div>
        
        <div class="footer">
            <p>🤖 Automatically discovering and routing to your containerized applications</p>
            <p>All configurations are generated dynamically and updated in real-time</p>
            <div class="last-update">
                Last updated: {last_update}
            </div>
        </div>
    </div>
    
    <button class="refresh-btn" onclick="location.reload()" title="Refresh Applications">
        🔄
    </button>
    
    <script>
        // Auto-refresh every 30 seconds
        setTimeout(function() {{
            location.reload();
        }}, 30000);
        
        // Add click tracking for analytics
        document.querySelectorAll('.app-link').forEach(link => {{
            link.addEventListener('click', function() {{
                console.log('Accessing application:', this.href);
            }});
        }});
    </script>
</body>
</html>"""
        }

    async def discover_containers(self) -> List[ContainerInfo]:
        """Discover all running application containers"""
        try:
            # Get all running containers with detailed info
            result = await asyncio.to_thread(
                subprocess.run,
                ["docker", "ps", "--format", "json", "--no-trunc"],
                capture_output=True,
                text=True,
                check=True
            )
            
            containers = []
            for line in result.stdout.strip().split('\n'):
                if line.strip():
                    try:
                        data = json.loads(line)
                        name = data['Names']
                        
                        # Skip nginx proxy and system containers
                        if name == NGINX_CONTAINER_NAME or name.startswith('devops-butler-'):
                            continue
                        
                        # Get detailed container info
                        inspect_result = await asyncio.to_thread(
                            subprocess.run,
                            ["docker", "inspect", name],
                            capture_output=True,
                            text=True
                        )
                        
                        if inspect_result.returncode == 0:
                            inspect_data = json.loads(inspect_result.stdout)[0]
                            
                            # Check if container is on our network
                            networks = list(inspect_data.get('NetworkSettings', {}).get('Networks', {}).keys())
                            if 'devops-butler-net' not in networks:
                                # Try to connect to our network
                                await asyncio.to_thread(
                                    subprocess.run,
                                    ["docker", "network", "connect", "devops-butler-net", name],
                                    capture_output=True
                                )
                            
                            container = ContainerInfo(
                                name=name,
                                image=data['Image'],
                                ports=inspect_data.get('NetworkSettings', {}).get('Ports', {}),
                                networks=networks,
                                status=data['Status'],
                                created=data['CreatedAt']
                            )
                            containers.append(container)
                            
                    except (json.JSONDecodeError, KeyError) as e:
                        print(f"Error parsing container data: {e}")
                        continue
            
            return containers
            
        except subprocess.CalledProcessError as e:
            print(f"Error discovering containers: {e}")
            return []

    async def generate_nginx_config(self, container: ContainerInfo) -> str:
        """Generate nginx configuration for a container"""
        return self.config_templates["nginx_config"].format(
            server_name=container.server_name,
            proxy_url=container.proxy_url
        )

    async def write_nginx_config(self, container: ContainerInfo) -> bool:
        """Write nginx configuration file for a container"""
        try:
            config_path = os.path.join(NGINX_SITES_AVAILABLE, f"{container.name}.conf")
            config_content = await self.generate_nginx_config(container)
            
            os.makedirs(NGINX_SITES_AVAILABLE, exist_ok=True)
            with open(config_path, 'w') as f:
                f.write(config_content)
            
            print(f"✅ Generated nginx config for {container.name}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to write nginx config for {container.name}: {e}")
            return False

    async def generate_index_page(self, containers: List[ContainerInfo]) -> str:
        """Generate dynamic index page with all applications"""
        app_cards = []
        total_ports = 0
        
        for container in containers:
            if container.external_port:
                total_ports += 1
            
            # Determine app type and icon
            app_type = "🌐 Web App"
            if "portfolio" in container.name.lower():
                app_type = "💼 Portfolio"
            elif "api" in container.name.lower():
                app_type = "🔌 API Service"
            elif "blog" in container.name.lower():
                app_type = "📝 Blog"
            elif "github" in container.name.lower():
                app_type = "📁 GitHub Pages"
            
            # Format uptime/created time
            try:
                created_time = datetime.fromisoformat(container.created.replace('Z', '+00:00'))
                uptime = datetime.now(created_time.tzinfo) - created_time
                uptime_str = f"{uptime.days}d {uptime.seconds//3600}h"
            except:
                uptime_str = "Unknown"
            
            port_info = f"Internal: {container.internal_port}"
            if container.external_port:
                port_info += f", External: {container.external_port}"
            
            app_card = f"""
            <div class="app-card">
                <div class="app-header">
                    <div>
                        <div class="app-name">{container.project_info['short_name']}</div>
                        <div class="app-username">@{container.project_info['username']}</div>
                    </div>
                    <div class="app-status">● Running</div>
                </div>
                
                <div class="app-url">http://{container.server_name}:8888</div>
                
                <div class="app-details">
                    <div class="app-detail">
                        <strong>Type:</strong> {app_type}
                    </div>
                    <div class="app-detail">
                        <strong>Uptime:</strong> {uptime_str}
                    </div>
                </div>
                
                <div class="app-details">
                    <div class="app-detail">
                        <strong>Ports:</strong> {port_info}
                    </div>
                    <div class="app-detail">
                        <strong>Hash:</strong> {container.project_info['hash_id'][:8]}
                    </div>
                </div>
                
                <div class="app-actions">
                    <a href="http://{container.server_name}:8888" class="app-link" target="_blank">
                        🚀 Open Application
                    </a>
                    <a href="http://localhost:{container.external_port or 'N/A'}" class="app-link direct-link" target="_blank">
                        🔗 Direct Access
                    </a>
                </div>
            </div>
            """
            app_cards.append(app_card)
        
        # Calculate system uptime (approximate)
        system_uptime = "2d 5h"  # Placeholder - you could implement actual uptime tracking
        
        return self.config_templates["index_template"].format(
            total_apps=len(containers),
            total_ports=total_ports,
            uptime=system_uptime,
            app_cards=''.join(app_cards),
            last_update=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )

    async def write_index_page(self, containers: List[ContainerInfo]) -> bool:
        """Write the dynamic index page"""
        try:
            index_content = await self.generate_index_page(containers)
            
            # Write index.html to a file
            index_file_path = os.path.join(NGINX_SITES_AVAILABLE, "index.html")
            with open(index_file_path, 'w') as f:
                f.write(index_content)
            
            # Write API data
            api_data = json.dumps([{"name": c.name, "status": "running", "ports": c.external_port} for c in containers])
            api_file_path = os.path.join(NGINX_SITES_AVAILABLE, "containers.json")
            with open(api_file_path, 'w') as f:
                f.write(api_data)
            
            # Update default.conf to serve from files
            default_config = f"""
# Increase hash bucket size for long server names
server_names_hash_bucket_size 128;

server {{
    listen 80 default_server;
    server_name _;
    
    root /etc/nginx/conf.d;
    index index.html;
    
    location / {{
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }}
    
    location /health {{
        return 200 'OK';
        add_header Content-Type text/plain;
    }}
    
    location /api/containers {{
        try_files /containers.json =404;
        add_header Content-Type application/json;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }}
}}
"""
            
            default_config_path = os.path.join(NGINX_SITES_AVAILABLE, "default.conf")
            with open(default_config_path, 'w') as f:
                f.write(default_config)
            
            print("✅ Generated dynamic index page")
            return True
            
        except Exception as e:
            print(f"❌ Failed to write index page: {e}")
            return False

    async def cleanup_orphaned_configs(self, active_containers: List[ContainerInfo]) -> None:
        """Remove nginx configs for containers that no longer exist"""
        try:
            if not os.path.exists(NGINX_SITES_AVAILABLE):
                return
            
            active_names = {c.name for c in active_containers}
            config_files = [f for f in os.listdir(NGINX_SITES_AVAILABLE) if f.endswith('.conf')]
            
            for config_file in config_files:
                if config_file == 'default.conf':
                    continue
                
                container_name = config_file.replace('.conf', '')
                if container_name not in active_names:
                    config_path = os.path.join(NGINX_SITES_AVAILABLE, config_file)
                    os.remove(config_path)
                    print(f"🗑️ Removed orphaned config: {config_file}")
                    
        except Exception as e:
            print(f"⚠️ Error cleaning up configs: {e}")

    async def reload_nginx(self) -> bool:
        """Reload nginx configuration"""
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                ["docker", "exec", NGINX_CONTAINER_NAME, "nginx", "-s", "reload"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                print("✅ Nginx configuration reloaded")
                return True
            else:
                print(f"⚠️ Nginx reload failed: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ Error reloading nginx: {e}")
            return False

    async def update_proxy_configuration(self) -> bool:
        """Main method to update entire proxy configuration"""
        try:
            print("🔍 Discovering containers...")
            containers = await self.discover_containers()
            
            if not containers:
                print("ℹ️ No application containers found")
                return True
            
            print(f"📋 Found {len(containers)} containers")
            
            # Generate nginx configs for all containers
            config_tasks = []
            for container in containers:
                config_tasks.append(self.write_nginx_config(container))
            
            # Execute all config generation concurrently
            results = await asyncio.gather(*config_tasks, return_exceptions=True)
            
            # Generate dynamic index page
            await self.write_index_page(containers)
            
            # Clean up orphaned configs
            await self.cleanup_orphaned_configs(containers)
            
            # Reload nginx
            reload_success = await self.reload_nginx()
            
            self.last_update = time.time()
            self.containers_cache = {c.name: c for c in containers}
            
            print(f"✅ Proxy configuration updated successfully")
            return reload_success
            
        except Exception as e:
            print(f"❌ Error updating proxy configuration: {e}")
            return False

    async def monitor_and_update(self, interval: int = 30) -> None:
        """Continuously monitor containers and update configurations"""
        print(f"🔄 Starting dynamic proxy monitoring (interval: {interval}s)")
        
        while True:
            try:
                await self.update_proxy_configuration()
                await asyncio.sleep(interval)
                
            except KeyboardInterrupt:
                print("\n⏹️ Stopping dynamic proxy monitoring")
                break
            except Exception as e:
                print(f"❌ Error in monitoring loop: {e}")
                await asyncio.sleep(interval)

async def main():
    """Main entry point"""
    manager = DynamicProxyManager()
    
    # Perform initial update
    print("🚀 Initializing Dynamic Proxy Manager...")
    await manager.update_proxy_configuration()
    
    # Start monitoring
    await manager.monitor_and_update()

if __name__ == "__main__":
    asyncio.run(main())
