import os
import subprocess
import json
import asyncio
import time
from container_inspector import inspect_container
from docker_helpers import get_host_port, get_container_port
from deployment_validator import validate_and_prepare_deployment
from nginx_manager import create_nginx_config, reload_nginx
from setup_nginx_proxy import setup_nginx_proxy

async def cleanup_conflicting_containers():
    """
    Clean up any existing containers that might cause name conflicts.
    """
    print("🗑️ Cleaning up potential container conflicts...")
    
    try:
        # Get list of all containers (running and stopped)
        result = await asyncio.to_thread(subprocess.run,
            ["docker", "ps", "-a", "--format", "{{.Names}}"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0 and result.stdout.strip():
            containers = result.stdout.strip().split('\n')
            
            # Common container names that might conflict
            common_names = ['frontend', 'backend', 'mongodb', 'mysql', 'postgres', 'redis', 'nginx']
            conflicting_containers = []
            
            for container in containers:
                if any(name in container.lower() for name in common_names):
                    conflicting_containers.append(container)
            
            if conflicting_containers:
                print(f"⚠️ Found {len(conflicting_containers)} potentially conflicting containers")
                
                for container in conflicting_containers:
                    try:
                        print(f"🗑️ Removing container: {container}")
                        # Stop container first
                        await asyncio.to_thread(subprocess.run,
                            ["docker", "stop", container],
                            capture_output=True,
                            text=True
                        )
                        
                        # Remove container
                        remove_result = await asyncio.to_thread(subprocess.run,
                            ["docker", "rm", container],
                            capture_output=True,
                            text=True
                        )
                        
                        if remove_result.returncode == 0:
                            print(f"✅ Successfully removed: {container}")
                        else:
                            print(f"⚠️ Could not remove {container}: {remove_result.stderr}")
                            
                    except Exception as e:
                        print(f"⚠️ Error removing {container}: {e}")
                
                print("✅ Container cleanup completed")
            else:
                print("✅ No conflicting containers found")
        
    except Exception as e:
        print(f"⚠️ Error during container cleanup: {e}")

async def check_container_health(container_name: str, max_wait_time: int = 60) -> bool:
    """
    Check if a container is healthy and ready to accept connections.
    """
    print(f"⏳ Checking health of container '{container_name}'...")
    
    start_time = time.time()
    while time.time() - start_time < max_wait_time:
        try:
            # Check container status
            proc = await asyncio.create_subprocess_exec(
                "docker", "inspect", container_name, "--format", "{{.State.Status}}",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()
            
            if proc.returncode == 0:
                status = stdout.decode().strip()
                if status == "running":
                    print(f"✅ Container '{container_name}' is running")
                    return True
                elif status in ["created", "restarting"]:
                    print(f"⏳ Container '{container_name}' status: {status}, waiting...")
                else:
                    print(f"⚠️ Container '{container_name}' status: {status}")
            
        except Exception as e:
            print(f"⚠️ Error checking container health: {e}")
        
        await asyncio.sleep(2)
    
    print(f"❌ Container '{container_name}' failed to become healthy within {max_wait_time}s")
    return False

async def start_failed_containers(repo_dir: str) -> bool:
    """
    Identify and start any containers that failed to start properly.
    """
    print("🔍 Checking for failed containers...")
    
    try:
        # Get all containers defined in docker-compose
        ps_command = ["docker", "compose", "ps", "-a", "--format", "json"]
        ps_result = await asyncio.to_thread(subprocess.run,
            ps_command,
            cwd=repo_dir,
            check=True,
            text=True,
            capture_output=True
        )
        
        output_lines = ps_result.stdout.strip().split('\n')
        containers_info = [json.loads(line) for line in output_lines if line.strip()]
        
        failed_containers = []
        for container in containers_info:
            name = container["Name"]
            state = container["State"]
            
            if state in ["created", "exited", "dead"]:
                failed_containers.append(name)
                print(f"⚠️ Found failed container '{name}' with state: {state}")
        
        # Attempt to start failed containers
        if failed_containers:
            print(f"🔧 Attempting to start {len(failed_containers)} failed container(s)...")
            
            for container_name in failed_containers:
                try:
                    print(f"🚀 Starting container '{container_name}'...")
                    start_result = await asyncio.to_thread(subprocess.run,
                        ["docker", "start", container_name],
                        capture_output=True,
                        text=True
                    )
                    
                    if start_result.returncode == 0:
                        print(f"✅ Successfully started '{container_name}'")
                        
                        # Wait for container to be healthy
                        if await check_container_health(container_name):
                            print(f"✅ Container '{container_name}' is now healthy")
                        else:
                            print(f"⚠️ Container '{container_name}' started but may not be healthy")
                    else:
                        print(f"❌ Failed to start '{container_name}': {start_result.stderr}")
                        # Show container logs for debugging
                        await show_container_logs(container_name)
                        
                except Exception as e:
                    print(f"❌ Exception while starting '{container_name}': {e}")
            
            return len(failed_containers) > 0
        else:
            print("✅ No failed containers found")
            return False
            
    except Exception as e:
        print(f"❌ Error checking for failed containers: {e}")
        return False

async def show_container_logs(container_name: str, tail_lines: int = 20):
    """
    Show recent logs from a container for debugging.
    """
    try:
        print(f"📋 Last {tail_lines} log lines from '{container_name}':")
        logs_result = await asyncio.to_thread(subprocess.run,
            ["docker", "logs", "--tail", str(tail_lines), container_name],
            capture_output=True,
            text=True
        )
        
        if logs_result.stdout:
            print(f"STDOUT:\n{logs_result.stdout}")
        if logs_result.stderr:
            print(f"STDERR:\n{logs_result.stderr}")
            
    except Exception as e:
        print(f"❌ Could not retrieve logs for '{container_name}': {e}")

async def wait_for_database_containers(container_names: list, max_wait_time: int = 120) -> bool:
    """
    Wait specifically for database containers to be ready.
    """
    database_patterns = ['mongo', 'mysql', 'postgres', 'redis', 'db']
    db_containers = []
    
    for name in container_names:
        if any(pattern in name.lower() for pattern in database_patterns):
            db_containers.append(name)
    
    if not db_containers:
        print("ℹ️ No database containers detected")
        return True
    
    print(f"🗄️ Waiting for database containers: {db_containers}")
    
    for db_container in db_containers:
        print(f"⏳ Waiting for database '{db_container}' to be ready...")
        if not await check_container_health(db_container, max_wait_time):
            print(f"❌ Database container '{db_container}' failed to start properly")
            await show_container_logs(db_container)
            return False
        else:
            # Extra wait for database initialization
            print(f"⏳ Giving '{db_container}' extra time for initialization...")
            await asyncio.sleep(5)
    
    print("✅ All database containers are ready")
    return True

async def get_docker_networks(repo_dir: str) -> list:
    """
    Get the networks used by the docker-compose services.
    """
    try:
        # First try to get from running containers (most reliable)
        print("🌌 Detecting networks from running containers...")
        ps_command = ["docker", "compose", "ps", "-q"]
        ps_result = await asyncio.to_thread(subprocess.run,
            ps_command,
            cwd=repo_dir,
            capture_output=True,
            text=True,
            check=True
        )
        
        if ps_result.stdout.strip():
            container_id = ps_result.stdout.strip().split('\n')[0]
            inspect_result = await asyncio.to_thread(subprocess.run,
                ["docker", "inspect", container_id, "--format", "{{json .NetworkSettings.Networks}}"],
                capture_output=True,
                text=True
            )
            
            if inspect_result.returncode == 0:
                networks_data = json.loads(inspect_result.stdout)
                networks = [net for net in networks_data.keys() if net != "bridge"]
                if networks:
                    print(f"🌌 Detected networks from containers: {networks}")
                    return networks
        
        # Fallback - try to get from docker-compose config
        print("🌌 Trying docker-compose config...")
        networks_command = ["docker", "compose", "config", "--format", "json"]
        result = await asyncio.to_thread(subprocess.run,
            networks_command,
            cwd=repo_dir,
            capture_output=True,
            text=True,
            check=True
        )
        
        compose_config = json.loads(result.stdout)
        networks = list(compose_config.get('networks', {}).keys())
        
        if networks:
            print(f"🌌 Detected networks from config: {networks}")
            return networks
        
        # Final fallback - derive from project name
        print("🌌 Using project name-based network detection...")
        project_name = os.path.basename(repo_dir).lower().replace('-', '').replace('_', '')
        
        # Check if default network exists
        network_ls_result = await asyncio.to_thread(subprocess.run,
            ["docker", "network", "ls", "--format", "{{.Name}}"],
            capture_output=True,
            text=True
        )
        
        if network_ls_result.returncode == 0:
            existing_networks = network_ls_result.stdout.strip().split('\n')
            # Look for networks containing the project name
            matching_networks = [net for net in existing_networks if project_name in net.lower()]
            if matching_networks:
                print(f"🌌 Found matching networks: {matching_networks}")
                return matching_networks
        
        print(f"🌌 Using bridge network as fallback")
        return ["bridge"]
        
    except Exception as e:
        print(f"⚠️ Error detecting networks: {e}")
        return ["bridge"]  # Default fallback

async def connect_nginx_to_networks(networks: list) -> bool:
    """
    Connect the nginx proxy container to the required networks.
    """
    nginx_container = "butler-nginx-proxy"
    
    try:
        for network in networks:
            if network == "bridge":
                continue  # Already connected by default
                
            print(f"🌌 Connecting nginx to network: {network}")
            
            # Check if already connected
            inspect_result = await asyncio.to_thread(subprocess.run,
                ["docker", "inspect", nginx_container, "--format", "{{json .NetworkSettings.Networks}}"],
                capture_output=True,
                text=True
            )
            
            if inspect_result.returncode == 0:
                current_networks = json.loads(inspect_result.stdout)
                if network in current_networks:
                    print(f"✅ Nginx already connected to {network}")
                    continue
            
            # Connect to network with retries
            max_connect_retries = 3
            for retry in range(max_connect_retries):
                connect_result = await asyncio.to_thread(subprocess.run,
                    ["docker", "network", "connect", network, nginx_container],
                    capture_output=True,
                    text=True
                )
                
                if connect_result.returncode == 0:
                    print(f"✅ Connected nginx to {network}")
                    break
                else:
                    if "network sandbox" in connect_result.stderr:
                        print(f"⚠️ Network sandbox issue (attempt {retry + 1}/{max_connect_retries}), retrying...")
                        await asyncio.sleep(2)  # Wait for container to stabilize
                        continue
                    elif "already exists" in connect_result.stderr:
                        print(f"✅ Nginx already connected to {network} (endpoint exists)")
                        break
                    else:
                        print(f"⚠️ Failed to connect nginx to {network}: {connect_result.stderr}")
                        return False
            else:
                print(f"❌ Failed to connect nginx to {network} after {max_connect_retries} attempts")
                return False
        
        return True
        
    except Exception as e:
        print(f"❌ Error connecting nginx to networks: {e}")
        return False

async def test_nginx_connectivity(nginx_configs: dict) -> dict:
    """
    Test that nginx can connect to the configured services.
    """
    connectivity_results = {}
    nginx_container = "butler-nginx-proxy"
    
    for service, config in nginx_configs.items():
        internal_port = config['internal_port']
        
        try:
            print(f"🔍 Testing connectivity to {service}...")
            
            # Test from within nginx container to the service
            test_result = await asyncio.to_thread(subprocess.run,
                ["docker", "exec", nginx_container, "wget", "-q", "--spider", 
                 f"http://{service}:{internal_port}"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if test_result.returncode == 0:
                print(f"✅ Nginx can reach {service}")
                connectivity_results[service] = True
            else:
                print(f"⚠️ Nginx cannot reach {service}: {test_result.stderr}")
                connectivity_results[service] = False
                
        except asyncio.TimeoutError:
            print(f"⚠️ Connectivity test to {service} timed out")
            connectivity_results[service] = False
        except Exception as e:
            print(f"⚠️ Error testing connectivity to {service}: {e}")
            connectivity_results[service] = False
    
    return connectivity_results

async def setup_nginx_configurations(repo_dir: str, service_ports: dict, healthy_containers: list) -> dict:
    """
    Set up nginx configurations for frontend services.
    """
    nginx_configs = {}
    
    try:
        # Ensure nginx proxy is running
        print("🌍 Ensuring nginx proxy is available...")
        nginx_ready = await setup_nginx_proxy()
        
        if not nginx_ready:
            print("⚠️ Nginx proxy setup failed, skipping nginx configuration")
            return nginx_configs
        
        # Get and connect to the required networks
        print("🌌 Setting up network connectivity...")
        networks = await get_docker_networks(repo_dir)
        network_connected = await connect_nginx_to_networks(networks)
        
        if not network_connected:
            print("⚠️ Failed to connect nginx to application networks")
            return nginx_configs
        
        # Get repo name for nginx configuration
        repo_name = os.path.basename(repo_dir).lower().replace('_', '-').replace(' ', '-')
        
        # Configure nginx for frontend services
        frontend_services = ['frontend', 'web', 'ui', 'client']
        
        for container_name in healthy_containers:
            service_type = None
            for frontend_type in frontend_services:
                if frontend_type in container_name.lower():
                    service_type = 'frontend'
                    break
            
            if service_type == 'frontend' and container_name in service_ports:
                internal_port = service_ports[container_name]['internal_port']
                
                print(f"🌍 Creating nginx config for {container_name}...")
                
                # Create nginx configuration
                config_success = create_nginx_config(
                    project_id=f"{repo_name}-{container_name}",
                    repo_name=repo_name,
                    container_name=container_name,
                    internal_port=internal_port
                )
                
                if config_success:
                    nginx_url = f"http://{container_name}.localhost:8888"
                    nginx_configs[container_name] = {
                        'url': nginx_url,
                        'internal_port': internal_port
                    }
                    print(f"✅ Nginx config created for {container_name}")
                    print(f"🌍 Frontend accessible at: {nginx_url}")
                else:
                    print(f"⚠️ Failed to create nginx config for {container_name}")
        
        # Reload nginx if any configurations were created
        if nginx_configs:
            print("🔄 Reloading nginx with new configurations...")
            await reload_nginx()
            
            # Test connectivity to ensure nginx can reach the services
            print("🔍 Testing nginx connectivity to services...")
            connectivity_tests = await test_nginx_connectivity(nginx_configs)
            
            if connectivity_tests:
                print("✅ Nginx configurations active and connectivity verified!")
                
                print(f"\n🌍 Nginx Proxy URLs:")
                for service, config in nginx_configs.items():
                    status = "✅" if connectivity_tests.get(service) else "⚠️"
                    print(f"  {status} {service}: {config['url']}")
            else:
                print("⚠️ Nginx configurations created but connectivity issues detected")
        else:
            print("📝 No frontend services found to configure with nginx")
        
        return nginx_configs
        
    except Exception as e:
        print(f"❌ Error setting up nginx configurations: {e}")
        return nginx_configs

async def docker_up(repo_dir: str):
    print(f"🚀 Running docker compose from {repo_dir}")
    
    # Pre-deployment validation
    print("\n🔍 Running pre-deployment validation...")
    is_valid, issues, warnings = await validate_and_prepare_deployment(repo_dir)
    
    if not is_valid:
        print("❌ Pre-deployment validation failed. Issues found:")
        for issue in issues:
            print(f"  • {issue}")
        print("\n⚠️ Please fix the above issues before deployment.")
        return {}
    
    if warnings:
        print("⚠️ Pre-deployment warnings (deployment will continue):")
        for warning in warnings:
            print(f"  • {warning}")
    
    print("✅ Pre-deployment validation passed!")
    
    # Clean up any conflicting containers
    print("\n🗑️ Cleaning up potential container conflicts...")
    await cleanup_conflicting_containers()
    
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            print(f"\n📦 Attempt {retry_count + 1}/{max_retries}: Building and starting services...")
            
            up_command = [
                "docker",
                "compose",
                "up",
                "--build",
                "-d"
            ]
            
            result = await asyncio.to_thread(subprocess.run, 
                up_command, 
                cwd=repo_dir, 
                capture_output=True, 
                text=True
            )
            
            if result.returncode != 0:
                print(f"⚠️ Docker compose up failed with exit code {result.returncode}")
                print(f"Error output: {result.stderr}")
                if result.stdout:
                    print(f"Output: {result.stdout}")
                retry_count += 1
                continue
            
            print("✅ Docker compose up completed successfully.")

            # Wait a moment for containers to initialize
            await asyncio.sleep(3)
            
            print("🔍 Discovering container names...")
            ps_command_json = ["docker", "compose", "ps", "-a", "--format", "json"]
            ps_result = await asyncio.to_thread(subprocess.run,
                ps_command_json,
                cwd=repo_dir,
                check=True,
                text=True,
                capture_output=True
            )
            
            output_lines = ps_result.stdout.strip().split('\n')
            containers_info = [json.loads(line) for line in output_lines if line.strip()]
            container_names = [info["Name"] for info in containers_info]
            print(f"📋 Discovered containers: {container_names}")
            
            # Check for and fix failed containers
            print("\n🔧 Checking and fixing any failed containers...")
            had_failures = await start_failed_containers(repo_dir)
            
            if had_failures:
                print("⚠️ Some containers needed to be restarted")
                # Update container list after restart
                ps_result = await asyncio.to_thread(subprocess.run,
                    ps_command_json,
                    cwd=repo_dir,
                    check=True,
                    text=True,
                    capture_output=True
                )
                output_lines = ps_result.stdout.strip().split('\n')
                containers_info = [json.loads(line) for line in output_lines if line.strip()]
                container_names = [info["Name"] for info in containers_info]
            
            # Wait for database containers specifically
            print("\n🗄️ Ensuring database containers are ready...")
            db_ready = await wait_for_database_containers(container_names)
            
            if not db_ready:
                print("❌ Database containers failed to become ready")
                if retry_count < max_retries - 1:
                    print(f"🔄 Retrying deployment (attempt {retry_count + 2}/{max_retries})...")
                    retry_count += 1
                    await asyncio.sleep(5)
                    continue
                else:
                    print("❌ Max retries reached, returning partial results")
            
            # Final health check for all containers
            print("\n🏥 Performing final health check...")
            healthy_containers = []
            for name in container_names:
                if await check_container_health(name, 30):
                    healthy_containers.append(name)
                else:
                    print(f"⚠️ Container '{name}' may have health issues")
                    await show_container_logs(name, 10)
            
            print(f"\n✅ Healthy containers: {healthy_containers}")

            # Inspect each healthy container and get its ports
            print("\n🔍 Gathering service port information...")
            service_ports = {}
            for name in healthy_containers:
                details = await inspect_container(name)
                if details:
                    host_port = get_host_port(details)
                    internal_port = get_container_port(details)
                    if internal_port:
                        service_ports[name] = {
                            'internal_port': int(internal_port),
                            'host_port': host_port
                        }
                        print(f"✅ Service '{name}': internal_port={internal_port}, host_port={host_port}")
                    else:
                        print(f"ℹ️ Service '{name}': no exposed ports detected")
            
            print(f"\n🎯 Final service ports mapping: {service_ports}")
            
            if service_ports or healthy_containers:
                # Set up nginx proxy for frontend services
                print("\n🌍 Setting up nginx proxy for frontend services...")
                nginx_configurations = await setup_nginx_configurations(repo_dir, service_ports, healthy_containers)
                
                print(f"\n🎉 Deployment completed successfully!")
                return service_ports
            else:
                print("⚠️ No healthy containers with ports found")
                if retry_count < max_retries - 1:
                    retry_count += 1
                    await asyncio.sleep(5)
                    continue
                else:
                    return {}

        except subprocess.CalledProcessError as failed:
            print(f"❌ Docker command failed: {failed}")
            print(f"Error output: {failed.stderr}")
            if failed.stdout:
                print(f"Output: {failed.stdout}")
            
            if retry_count < max_retries - 1:
                print(f"🔄 Retrying in 5 seconds... (attempt {retry_count + 2}/{max_retries})")
                retry_count += 1
                await asyncio.sleep(5)
            else:
                print("❌ Max retries reached, deployment failed")
                return {}
        
        except Exception as e:
            print(f"❌ Unexpected error during deployment: {e}")
            if retry_count < max_retries - 1:
                print(f"🔄 Retrying in 5 seconds... (attempt {retry_count + 2}/{max_retries})")
                retry_count += 1
                await asyncio.sleep(5)
            else:
                print("❌ Max retries reached due to unexpected errors")
                return {}
    
    print("❌ All deployment attempts failed")
    return {}
