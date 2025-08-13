import asyncio
import subprocess
import re
import os
import json
from app_pipeline import detect_running_port
from nginx_manager import create_nginx_config, reload_nginx


async def check_deployment_health(container_name: str) -> dict:
    """
    Comprehensive health check for a deployed container.
    Returns a dict with health status and recommendations.
    """
    health_report = {
        'container_running': False,
        'port_accessible': False,
        'nginx_config_exists': False,
        'nginx_config_correct': False,
        'detected_port': None,
        'configured_port': None,
        'recommendations': []
    }
    
    try:
        # Check if container is running
        result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "inspect", "--format", "{{.State.Running}}", container_name],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0 and result.stdout.strip() == "true":
            health_report['container_running'] = True
            print(f"✅ Container {container_name} is running")
        else:
            health_report['recommendations'].append(f"Container {container_name} is not running")
            return health_report
        
        # Detect the actual port the container is using
        detected_port = await detect_running_port(container_name)
        if detected_port:
            health_report['detected_port'] = detected_port
            print(f"🔍 Detected container is using port {detected_port}")
        else:
            health_report['recommendations'].append(f"Could not detect port for {container_name}")
        
        # Check if nginx config exists
        config_path = f"/opt/homebrew/etc/nginx/servers/{container_name}.conf"
        if os.path.exists(config_path):
            health_report['nginx_config_exists'] = True
            
            # Read and parse nginx config
            with open(config_path, 'r') as f:
                config_content = f.read()
            
            # Extract configured port from nginx config
            match = re.search(r'proxy_pass http://[^:]+:(\d+)', config_content)
            if match:
                configured_port = int(match.group(1))
                health_report['configured_port'] = configured_port
                
                # Check if configured port matches detected port
                if detected_port and configured_port == detected_port:
                    health_report['nginx_config_correct'] = True
                    print(f"✅ Nginx configuration is correct (port {configured_port})")
                else:
                    health_report['recommendations'].append(
                        f"Port mismatch: Nginx config uses {configured_port}, container uses {detected_port}"
                    )
            else:
                health_report['recommendations'].append("Could not parse port from nginx config")
        else:
            health_report['recommendations'].append(f"Nginx config missing for {container_name}")
        
        # Test if the detected port is accessible from nginx
        if detected_port and health_report['container_running']:
            try:
                # Try to connect to the container port from within the docker network
                test_result = await asyncio.to_thread(
                    subprocess.run,
                    ["docker", "exec", "butler-nginx-proxy", "wget", "-q", "--spider", 
                     f"http://{container_name}:{detected_port}"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                
                if test_result.returncode == 0:
                    health_report['port_accessible'] = True
                    print(f"✅ Port {detected_port} is accessible from nginx")
                else:
                    health_report['recommendations'].append(
                        f"Port {detected_port} is not accessible from nginx - may need --host flag"
                    )
                    
            except asyncio.TimeoutError:
                health_report['recommendations'].append(
                    f"Timeout testing port {detected_port} accessibility"
                )
        
    except Exception as e:
        health_report['recommendations'].append(f"Health check error: {e}")
    
    return health_report


async def auto_heal_deployment(container_name: str, repo_name: str = None) -> bool:
    """
    Automatically attempts to fix common deployment issues.
    Returns True if healing was successful.
    """
    print(f"🔧 Starting auto-healing for {container_name}")
    
    health_report = await check_deployment_health(container_name)
    
    if not health_report['container_running']:
        print(f"❌ Cannot heal: Container {container_name} is not running")
        return False
    
    healing_performed = False
    
    # Fix port mismatch in nginx config
    if health_report['detected_port'] and health_report['configured_port']:
        if health_report['detected_port'] != health_report['configured_port']:
            print(f"🔧 Fixing port mismatch: {health_report['configured_port']} -> {health_report['detected_port']}")
            
            # Extract repo name if not provided
            if not repo_name:
                repo_name = container_name.rsplit('-', 1)[0]  # Remove UUID part
            
            # Create new nginx config with correct port
            success = create_nginx_config(
                project_id=f"{repo_name}-{container_name}",
                repo_name=repo_name,
                container_name=container_name,
                internal_port=health_report['detected_port']
            )
            
            if success:
                await reload_nginx()
                healing_performed = True
                print(f"✅ Fixed nginx configuration with port {health_report['detected_port']}")
    
    # Create missing nginx config
    elif health_report['detected_port'] and not health_report['nginx_config_exists']:
        print(f"🔧 Creating missing nginx config for port {health_report['detected_port']}")
        
        if not repo_name:
            repo_name = container_name.rsplit('-', 1)[0]  # Remove UUID part
        
        success = create_nginx_config(
            project_id=f"{repo_name}-{container_name}",
            repo_name=repo_name,
            container_name=container_name,
            internal_port=health_report['detected_port']
        )
        
        if success:
            await reload_nginx()
            healing_performed = True
            print(f"✅ Created nginx configuration for port {health_report['detected_port']}")
    
    if healing_performed:
        # Re-run health check to verify healing
        print("🔍 Verifying healing results...")
        await asyncio.sleep(2)  # Give nginx time to apply changes
        
        new_health_report = await check_deployment_health(container_name)
        if new_health_report['nginx_config_correct'] and new_health_report['port_accessible']:
            print("🎉 Auto-healing successful!")
            return True
        else:
            print("⚠️ Auto-healing completed but issues remain:")
            for rec in new_health_report['recommendations']:
                print(f"  - {rec}")
            return False
    else:
        print("ℹ️ No healing actions were needed or possible")
        return False


async def monitor_all_deployments():
    """
    Monitor all running containers and auto-heal issues.
    """
    print("🔍 Monitoring all deployments...")
    
    try:
        # Get all running containers in the devops-butler-net network
        result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "network", "inspect", "devops-butler-net", 
             "--format", "{{range .Containers}}{{.Name}} {{end}}"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            container_names = result.stdout.strip().split()
            # Filter out nginx proxy
            app_containers = [name for name in container_names if name != "butler-nginx-proxy"]
            
            print(f"Found {len(app_containers)} application containers: {app_containers}")
            
            for container_name in app_containers:
                print(f"\n--- Checking {container_name} ---")
                health_report = await check_deployment_health(container_name)
                
                if health_report['recommendations']:
                    print("🔧 Issues found, attempting auto-healing...")
                    await auto_heal_deployment(container_name)
                else:
                    print("✅ Container is healthy")
        
    except Exception as e:
        print(f"❌ Error monitoring deployments: {e}")


if __name__ == "__main__":
    # For testing
    asyncio.run(monitor_all_deployments())
