"""
Docker Deployment Handler
Handles deployments using Docker and docker-compose
Supports multi-service docker-compose deployments with proper port forwarding
"""

import asyncio
import subprocess
import os
import json
import yaml
import logging
from typing import Optional, Dict, List, Tuple
from pathlib import Path
import tempfile

from connection_manager import manager
from vm_manager import vm_manager
from database import engine
from login import Deployment
from sqlmodel import Session, select

logger = logging.getLogger(__name__)


async def get_docker_command_prefix(vm_name: str) -> str:
    """
    Always return 'sudo ' prefix for Docker commands.
    Docker commands in VMs always require sudo.
    """
    return "sudo "


async def broadcast_docker_log(message: str, deployment_id: Optional[int] = None, log_type: str = "info"):
    """
    Broadcast Docker deployment logs to both global stream and project-specific stream, and save to database
    """
    await manager.broadcast(message)
    if deployment_id:
        await manager.broadcast_to_project(deployment_id, {"type": "log", "message": message})
        
        # Save log to database
        try:
            from login import DeploymentLog
            from database import engine
            from sqlmodel import Session
            with Session(engine) as session:
                log_entry = DeploymentLog(
                    deployment_id=deployment_id,
                    message=message,
                    log_type=log_type
                )
                session.add(log_entry)
                session.commit()
        except Exception as e:
            # Don't fail deployment if log saving fails
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to save Docker deployment log to database: {e}")


async def deploy_with_docker(
    git_url: str,
    vm_name: str,
    vm_project_dir: str,
    deployment_id: int,
    user_id: int,
    env_vars: Optional[Dict[str, str]] = None
) -> Optional[Tuple[str, str]]:
    """
    Deploy a project using Docker or docker-compose.
    
    CRITICAL: This function should ONLY be called after verifying Docker files exist!
    It performs a final verification check before proceeding.
    
    Priority:
    1. docker-compose.yml (multi-service)
    2. Dockerfile (single container)
    
    Returns:
        Tuple of (service_url, status) or None if failed
    """
    try:
        # CRITICAL: Final verification - check files exist BEFORE doing anything
        # This is a safety check - files should already be verified by caller
        compose_check = await vm_manager.exec_in_vm(
            vm_name,
            f"test -f {vm_project_dir}/docker-compose.yml -o -f {vm_project_dir}/docker-compose.yaml && echo 'exists' || echo 'not_exists'"
        )
        dockerfile_check = await vm_manager.exec_in_vm(
            vm_name,
            f"if [ -f {vm_project_dir}/Dockerfile ] || [ -f {vm_project_dir}/dockerfile ]; then echo 'exists'; else echo 'not_exists'; fi"
        )
        
        docker_compose_exists = "exists" in (compose_check.stdout or "").strip()
        dockerfile_exists = "exists" in (dockerfile_check.stdout or "").strip()
        
        # If NO Docker files exist, immediately return None - don't proceed
        if not docker_compose_exists and not dockerfile_exists:
            logger.warning(f"deploy_with_docker called but no Docker files found in {vm_project_dir}")
            await broadcast_docker_log("❌ ERROR: Docker deployment called but no Docker files found - this should not happen", deployment_id)
            return None
        
        await broadcast_docker_log("🐳 Verifying Docker configuration...", deployment_id)
        
        # Check if Docker requires sudo
        docker_prefix = await get_docker_command_prefix(vm_name)
        
        # Check for docker-compose.yml first (multi-service)
        if docker_compose_exists:
            await broadcast_docker_log("📦 Found docker-compose.yml - deploying multi-service application...", deployment_id)
            result = await deploy_docker_compose(
                vm_name, vm_project_dir, deployment_id, user_id, env_vars, docker_prefix
            )
            if result is None:
                logger.error(f"Docker compose deployment returned None for deployment {deployment_id}")
                await broadcast_docker_log("❌ Docker compose deployment failed - check logs above for details", deployment_id)
            return result
        
        # Check for Dockerfile (single container)
        if dockerfile_exists:
            await broadcast_docker_log("📦 Found Dockerfile - deploying single container...", deployment_id)
            result = await deploy_dockerfile(
                vm_name, vm_project_dir, deployment_id, user_id, env_vars, docker_prefix
            )
            if result is None:
                logger.error(f"Dockerfile deployment returned None for deployment {deployment_id}")
                await broadcast_docker_log("❌ Dockerfile deployment failed - check logs above for details", deployment_id)
            return result
        
        # Should never reach here if checks above worked, but safety fallback
        await broadcast_docker_log("⚠️ No Docker configuration found", deployment_id)
        return None
        
    except Exception as e:
        logger.error(f"Error in Docker deployment: {e}", exc_info=True)
        await broadcast_docker_log(f"❌ Docker deployment failed: {str(e)}", deployment_id)
        return None


async def deploy_docker_compose(
    vm_name: str,
    vm_project_dir: str,
    deployment_id: int,
    user_id: int,
    env_vars: Optional[Dict[str, str]] = None,
    docker_prefix: str = ""
) -> Optional[Tuple[str, str]]:
    """
    Deploy using docker-compose.yml (supports multi-service: frontend, backend, database, etc.)
    """
    try:
        await broadcast_docker_log("📖 Reading docker-compose.yml...", deployment_id)
        
        # Read docker-compose.yml
        compose_content = await vm_manager.exec_in_vm(
            vm_name,
            f"cat {vm_project_dir}/docker-compose.yml {vm_project_dir}/docker-compose.yaml 2>/dev/null | head -500"
        )
        
        if compose_content.returncode != 0 or not compose_content.stdout:
            await broadcast_docker_log("❌ Could not read docker-compose.yml", deployment_id)
            return None
        
        # Parse docker-compose.yml
        try:
            compose_data = yaml.safe_load(compose_content.stdout)
        except Exception as e:
            await broadcast_docker_log(f"❌ Failed to parse docker-compose.yml: {e}", deployment_id)
            return None
        
        if not compose_data or 'services' not in compose_data:
            await broadcast_docker_log("❌ Invalid docker-compose.yml format", deployment_id)
            return None
        
        services = compose_data.get('services', {})
        await broadcast_docker_log(f"🔍 Found {len(services)} service(s): {', '.join(services.keys())}", deployment_id)
        
        # Find main service (usually web, app, frontend, or first service)
        main_service_name = None
        for name in ['web', 'app', 'frontend', 'main']:
            if name in services:
                main_service_name = name
                break
        
        if not main_service_name:
            main_service_name = list(services.keys())[0]
        
        await broadcast_docker_log(f"🎯 Main service: {main_service_name}", deployment_id)
        
        # Get port from main service
        main_service = services[main_service_name]
        ports = main_service.get('ports', [])
        container_port = None
        host_port = None
        
        if ports:
            # Parse port mapping (format: "host:container" or "container")
            port_str = str(ports[0])
            if ':' in port_str:
                host_port_str, container_port_str = port_str.split(':')
                container_port = int(container_port_str)
                host_port = int(host_port_str) if host_port_str else None
            else:
                container_port = int(port_str)
        
        # If no port in compose, try to detect from EXPOSE in Dockerfile or default
        if not container_port:
            container_port = 8080  # Default
            await broadcast_docker_log(f"⚠️ No port specified, using default: {container_port}", deployment_id)
        
        # Find free host port if not specified
        if not host_port:
            from process_manager import process_manager as pm
            existing_ports = set()
            with Session(engine) as session:
                deployments = session.exec(
                    select(Deployment.host_port).where(
                        Deployment.host_port.is_not(None),
                        Deployment.id != deployment_id
                    )
                ).all()
                existing_ports.update([p for p in deployments if p])
            
            for candidate in range(6001, 6999):
                if candidate not in existing_ports:
                    host_port = candidate
                    break
            
            if not host_port:
                await broadcast_docker_log("❌ No free ports available", deployment_id)
                return None
        
        # Update docker-compose.yml to use host port
        # We'll modify the compose file to ensure proper port mapping
        await broadcast_docker_log(f"🔧 Configuring port mapping: {host_port}:{container_port}", deployment_id)
        
        # Stop any existing containers for this project
        await broadcast_docker_log("🛑 Stopping existing containers...", deployment_id)
        await vm_manager.exec_in_vm(
            vm_name,
            f"cd {vm_project_dir} && {docker_prefix}docker compose down 2>/dev/null || true"
        )
        
        # Build and start services
        await broadcast_docker_log("🔨 Building Docker images...", deployment_id)
        build_result = await vm_manager.exec_in_vm(
            vm_name,
            f"cd {vm_project_dir} && {docker_prefix}docker compose build",
            cwd=vm_project_dir
        )
        
        if build_result.returncode != 0:
            error_msg = build_result.stderr or build_result.stdout or "Build failed"
            await broadcast_docker_log(f"❌ Docker build failed: {error_msg[:500]}", deployment_id)
            return None
        
        await broadcast_docker_log("✅ Docker images built successfully", deployment_id)
        
        # Start services
        await broadcast_docker_log("🚀 Starting Docker containers...", deployment_id)
        
        # Prepare environment variables
        env_file_content = ""
        if env_vars:
            for key, value in env_vars.items():
                env_file_content += f"{key}={value}\n"
        
        # Write .env file if env vars exist
        if env_file_content:
            await vm_manager.exec_in_vm(
                vm_name,
                f"cat > {vm_project_dir}/.env << 'EOF'\n{env_file_content}EOF"
            )
        
        # Start with docker compose up
        up_result = await vm_manager.exec_in_vm(
            vm_name,
            f"cd {vm_project_dir} && {docker_prefix}docker compose up -d",
            cwd=vm_project_dir
        )
        
        if up_result.returncode != 0:
            error_msg = up_result.stderr or up_result.stdout or "Start failed"
            await broadcast_docker_log(f"❌ Failed to start containers: {error_msg[:500]}", deployment_id)
            return None
        
        await broadcast_docker_log("✅ Docker containers started", deployment_id)
        
        # Setup port forwarding from VM to Mac host
        await broadcast_docker_log(f"🔗 Setting up port forwarding: VM:{container_port} → Mac:{host_port}", deployment_id)
        
        # Use OrbStack port forwarding
        port_forward_result = await vm_manager.setup_port_forwarding(
            vm_name, container_port, host_port
        )
        
        if not port_forward_result:
            await broadcast_docker_log(f"⚠️ Port forwarding setup failed, but containers are running", deployment_id)
        
        # Update deployment record
        with Session(engine) as session:
            deployment = session.get(Deployment, deployment_id)
            if deployment:
                deployment.host_port = host_port
                deployment.port = container_port
                deployment.status = "running"
                session.add(deployment)
                session.commit()
        
        # Construct service URL
        service_url = f"http://localhost:{host_port}"
        
        await broadcast_docker_log(f"✅ Docker deployment successful!", deployment_id)
        await broadcast_docker_log(f"🌐 Service URL: {service_url}", deployment_id)
        
        return service_url, "running"
        
    except Exception as e:
        logger.error(f"Error in docker-compose deployment: {e}", exc_info=True)
        await broadcast_docker_log(f"❌ Docker Compose deployment failed: {str(e)}", deployment_id)
        return None


async def deploy_dockerfile(
    vm_name: str,
    vm_project_dir: str,
    deployment_id: int,
    user_id: int,
    env_vars: Optional[Dict[str, str]] = None,
    docker_prefix: str = ""
) -> Optional[Tuple[str, str]]:
    """
    Deploy using Dockerfile (single container)
    """
    try:
        await broadcast_docker_log("📖 Reading Dockerfile...", deployment_id)
        
        # Read Dockerfile to detect port (check both Dockerfile and dockerfile)
        dockerfile_content = await vm_manager.exec_in_vm(
            vm_name,
            f"if [ -f {vm_project_dir}/Dockerfile ]; then cat {vm_project_dir}/Dockerfile; elif [ -f {vm_project_dir}/dockerfile ]; then cat {vm_project_dir}/dockerfile; else echo ''; fi"
        )
        
        container_port = 8080  # Default
        if dockerfile_content.stdout:
            # Look for EXPOSE directive
            for line in dockerfile_content.stdout.split('\n'):
                line_upper = line.strip().upper()
                if line_upper.startswith('EXPOSE'):
                    try:
                        # Handle multiple ports: EXPOSE 5000 or EXPOSE 5000 8080
                        parts = line.strip().split()
                        if len(parts) > 1:
                            container_port = int(parts[1])
                            await broadcast_docker_log(f"📋 Found EXPOSE {container_port} in Dockerfile", deployment_id)
                            break
                    except (ValueError, IndexError) as e:
                        await broadcast_docker_log(f"⚠️ Could not parse EXPOSE directive: {line.strip()}", deployment_id)
                        pass
            
            # If no EXPOSE found, try to detect from common patterns
            if container_port == 8080:  # Still using default
                dockerfile_lower = dockerfile_content.stdout.lower()
                # Check for common port indicators
                if 'flask' in dockerfile_lower or 'flask_app' in dockerfile_lower:
                    container_port = 5000
                    await broadcast_docker_log("📋 Detected Flask app, using port 5000", deployment_id)
                elif 'port=5000' in dockerfile_lower or 'port 5000' in dockerfile_lower:
                    container_port = 5000
                    await broadcast_docker_log("📋 Found port 5000 in Dockerfile", deployment_id)
        
        await broadcast_docker_log(f"🔍 Detected container port: {container_port}", deployment_id)
        
        # Find free host port
        from process_manager import process_manager as pm
        existing_ports = set()
        with Session(engine) as session:
            deployments = session.exec(
                select(Deployment.host_port).where(
                    Deployment.host_port.is_not(None),
                    Deployment.id != deployment_id
                )
            ).all()
            existing_ports.update([p for p in deployments if p])
        
        host_port = None
        for candidate in range(6001, 6999):
            if candidate not in existing_ports:
                host_port = candidate
                break
        
        if not host_port:
            await broadcast_docker_log("❌ No free ports available", deployment_id)
            return None
        
        # Generate container name
        container_name = f"butler-{deployment_id}"
        
        # Stop existing container if exists
        await broadcast_docker_log("🛑 Stopping existing container...", deployment_id)
        await vm_manager.exec_in_vm(
            vm_name,
            f"{docker_prefix}docker stop {container_name} 2>/dev/null || true && {docker_prefix}docker rm {container_name} 2>/dev/null || true"
        )
        
        # Build image - check which Dockerfile exists and use appropriate flag
        await broadcast_docker_log("🔨 Building Docker image...", deployment_id)
        # Determine which Dockerfile exists (Dockerfile or dockerfile)
        dockerfile_name_check = await vm_manager.exec_in_vm(
            vm_name,
            f"if [ -f {vm_project_dir}/Dockerfile ]; then echo 'Dockerfile'; elif [ -f {vm_project_dir}/dockerfile ]; then echo 'dockerfile'; else echo ''; fi"
        )
        dockerfile_name = (dockerfile_name_check.stdout or "").strip()
        
        # Use -f flag if dockerfile (lowercase), otherwise use default Dockerfile
        if dockerfile_name == "dockerfile":
            build_cmd = f"cd {vm_project_dir} && {docker_prefix}docker build -f dockerfile -t {container_name}:latest ."
        else:
            build_cmd = f"cd {vm_project_dir} && {docker_prefix}docker build -t {container_name}:latest ."
        
        build_result = await vm_manager.exec_in_vm(
            vm_name,
            build_cmd,
            cwd=vm_project_dir
        )
        
        if build_result.returncode != 0:
            error_msg = build_result.stderr or build_result.stdout or "Build failed"
            full_error = f"Build failed (exit code {build_result.returncode}): {error_msg}"
            await broadcast_docker_log(f"❌ Docker build failed: {full_error[:1000]}", deployment_id)
            logger.error(f"Docker build failed for deployment {deployment_id}: {full_error}")
            # Log full output for debugging
            if build_result.stdout:
                logger.error(f"Build stdout: {build_result.stdout[:500]}")
            if build_result.stderr:
                logger.error(f"Build stderr: {build_result.stderr[:500]}")
            return None
        
        await broadcast_docker_log("✅ Docker image built successfully", deployment_id)
        
        # Prepare environment variables
        env_args = ""
        if env_vars:
            for key, value in env_vars.items():
                env_args += f" -e {key}={value}"
        
        # Run container
        await broadcast_docker_log("🚀 Starting Docker container...", deployment_id)
        run_result = await vm_manager.exec_in_vm(
            vm_name,
            f"{docker_prefix}docker run -d --name {container_name} -p {host_port}:{container_port}{env_args} {container_name}:latest"
        )
        
        if run_result.returncode != 0:
            error_msg = run_result.stderr or run_result.stdout or "Start failed"
            full_error = f"Container start failed (exit code {run_result.returncode}): {error_msg}"
            await broadcast_docker_log(f"❌ Failed to start container: {full_error[:1000]}", deployment_id)
            logger.error(f"Docker run failed for deployment {deployment_id}: {full_error}")
            # Log full output for debugging
            if run_result.stdout:
                logger.error(f"Run stdout: {run_result.stdout[:500]}")
            if run_result.stderr:
                logger.error(f"Run stderr: {run_result.stderr[:500]}")
            return None
        
        await broadcast_docker_log("✅ Docker container started", deployment_id)
        
        # Verify container is actually running
        await asyncio.sleep(2)  # Give container a moment to start
        check_result = await vm_manager.exec_in_vm(
            vm_name,
            f"{docker_prefix}docker ps --filter name={container_name} --format '{{{{.Status}}}}'"
        )
        
        if check_result.returncode == 0 and check_result.stdout:
            await broadcast_docker_log(f"📊 Container status: {check_result.stdout.strip()}", deployment_id)
        else:
            await broadcast_docker_log("⚠️ Could not verify container status", deployment_id)
        
        # Check if container port is listening
        port_check = await vm_manager.exec_in_vm(
            vm_name,
            f"timeout 2 {docker_prefix}docker exec {container_name} sh -c 'nc -z localhost {container_port} && echo LISTENING || echo NOT_LISTENING' 2>/dev/null || echo 'CHECK_FAILED'"
        )
        if port_check.stdout and "LISTENING" in port_check.stdout:
            await broadcast_docker_log(f"✅ Container port {container_port} is listening", deployment_id)
        else:
            await broadcast_docker_log(f"⚠️ Could not verify port {container_port} is listening (this is OK if app is still starting)", deployment_id)
        
        # Setup port forwarding
        await broadcast_docker_log(f"🔗 Setting up port forwarding: VM:{container_port} → Mac:{host_port}", deployment_id)
        port_forward_result = await vm_manager.setup_port_forwarding(
            vm_name, container_port, host_port
        )
        
        # Update deployment record
        with Session(engine) as session:
            deployment = session.get(Deployment, deployment_id)
            if deployment:
                deployment.host_port = host_port
                deployment.port = container_port
                deployment.status = "running"
                deployment.container_name = container_name  # Store container name
                session.add(deployment)
                session.commit()
        
        service_url = f"http://localhost:{host_port}"
        
        await broadcast_docker_log(f"✅ Docker deployment successful!", deployment_id)
        await broadcast_docker_log(f"🌐 Service URL: {service_url}", deployment_id)
        await broadcast_docker_log(f"🐳 Container: {container_name} (port {container_port})", deployment_id)
        
        return service_url, "running"
        
    except Exception as e:
        logger.error(f"Error in Dockerfile deployment: {e}", exc_info=True)
        await broadcast_docker_log(f"❌ Dockerfile deployment failed: {str(e)}", deployment_id)
        return None








