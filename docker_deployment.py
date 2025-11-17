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
    
    Priority:
    1. docker-compose.yml (multi-service)
    2. Dockerfile (single container)
    
    Returns:
        Tuple of (service_url, status) or None if failed
    """
    try:
        await manager.broadcast("🐳 Checking for Docker configuration...")
        
        # Check for docker-compose.yml first (multi-service)
        compose_check = await vm_manager.exec_in_vm(
            vm_name,
            f"test -f {vm_project_dir}/docker-compose.yml -o -f {vm_project_dir}/docker-compose.yaml && echo 'exists' || echo 'not_exists'"
        )
        
        if "exists" in (compose_check.stdout or "").strip():
            await manager.broadcast("📦 Found docker-compose.yml - deploying multi-service application...")
            return await deploy_docker_compose(
                vm_name, vm_project_dir, deployment_id, user_id, env_vars
            )
        
        # Check for Dockerfile (single container)
        dockerfile_check = await vm_manager.exec_in_vm(
            vm_name,
            f"test -f {vm_project_dir}/Dockerfile && echo 'exists' || echo 'not_exists'"
        )
        
        if "exists" in (dockerfile_check.stdout or "").strip():
            await manager.broadcast("📦 Found Dockerfile - deploying single container...")
            return await deploy_dockerfile(
                vm_name, vm_project_dir, deployment_id, user_id, env_vars
            )
        
        await manager.broadcast("⚠️ No Docker configuration found")
        return None
        
    except Exception as e:
        logger.error(f"Error in Docker deployment: {e}", exc_info=True)
        await manager.broadcast(f"❌ Docker deployment failed: {str(e)}")
        return None


async def deploy_docker_compose(
    vm_name: str,
    vm_project_dir: str,
    deployment_id: int,
    user_id: int,
    env_vars: Optional[Dict[str, str]] = None
) -> Optional[Tuple[str, str]]:
    """
    Deploy using docker-compose.yml (supports multi-service: frontend, backend, database, etc.)
    """
    try:
        await manager.broadcast("📖 Reading docker-compose.yml...")
        
        # Read docker-compose.yml
        compose_content = await vm_manager.exec_in_vm(
            vm_name,
            f"cat {vm_project_dir}/docker-compose.yml {vm_project_dir}/docker-compose.yaml 2>/dev/null | head -500"
        )
        
        if compose_content.returncode != 0 or not compose_content.stdout:
            await manager.broadcast("❌ Could not read docker-compose.yml")
            return None
        
        # Parse docker-compose.yml
        try:
            compose_data = yaml.safe_load(compose_content.stdout)
        except Exception as e:
            await manager.broadcast(f"❌ Failed to parse docker-compose.yml: {e}")
            return None
        
        if not compose_data or 'services' not in compose_data:
            await manager.broadcast("❌ Invalid docker-compose.yml format")
            return None
        
        services = compose_data.get('services', {})
        await manager.broadcast(f"🔍 Found {len(services)} service(s): {', '.join(services.keys())}")
        
        # Find main service (usually web, app, frontend, or first service)
        main_service_name = None
        for name in ['web', 'app', 'frontend', 'main']:
            if name in services:
                main_service_name = name
                break
        
        if not main_service_name:
            main_service_name = list(services.keys())[0]
        
        await manager.broadcast(f"🎯 Main service: {main_service_name}")
        
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
            await manager.broadcast(f"⚠️ No port specified, using default: {container_port}")
        
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
                await manager.broadcast("❌ No free ports available")
                return None
        
        # Update docker-compose.yml to use host port
        # We'll modify the compose file to ensure proper port mapping
        await manager.broadcast(f"🔧 Configuring port mapping: {host_port}:{container_port}")
        
        # Stop any existing containers for this project
        await manager.broadcast("🛑 Stopping existing containers...")
        await vm_manager.exec_in_vm(
            vm_name,
            f"cd {vm_project_dir} && docker compose down 2>/dev/null || true"
        )
        
        # Build and start services
        await manager.broadcast("🔨 Building Docker images...")
        build_result = await vm_manager.exec_in_vm(
            vm_name,
            f"cd {vm_project_dir} && docker compose build",
            cwd=vm_project_dir
        )
        
        if build_result.returncode != 0:
            error_msg = build_result.stderr or build_result.stdout or "Build failed"
            await manager.broadcast(f"❌ Docker build failed: {error_msg[:500]}")
            return None
        
        await manager.broadcast("✅ Docker images built successfully")
        
        # Start services
        await manager.broadcast("🚀 Starting Docker containers...")
        
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
            f"cd {vm_project_dir} && docker compose up -d",
            cwd=vm_project_dir
        )
        
        if up_result.returncode != 0:
            error_msg = up_result.stderr or up_result.stdout or "Start failed"
            await manager.broadcast(f"❌ Failed to start containers: {error_msg[:500]}")
            return None
        
        await manager.broadcast("✅ Docker containers started")
        
        # Setup port forwarding from VM to Mac host
        await manager.broadcast(f"🔗 Setting up port forwarding: VM:{container_port} → Mac:{host_port}")
        
        # Use OrbStack port forwarding
        port_forward_result = await vm_manager.setup_port_forwarding(
            vm_name, container_port, host_port
        )
        
        if not port_forward_result:
            await manager.broadcast(f"⚠️ Port forwarding setup failed, but containers are running")
        
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
        
        await manager.broadcast(f"✅ Docker deployment successful!")
        await manager.broadcast(f"🌐 Service URL: {service_url}")
        
        return service_url, "running"
        
    except Exception as e:
        logger.error(f"Error in docker-compose deployment: {e}", exc_info=True)
        await manager.broadcast(f"❌ Docker Compose deployment failed: {str(e)}")
        return None


async def deploy_dockerfile(
    vm_name: str,
    vm_project_dir: str,
    deployment_id: int,
    user_id: int,
    env_vars: Optional[Dict[str, str]] = None
) -> Optional[Tuple[str, str]]:
    """
    Deploy using Dockerfile (single container)
    """
    try:
        await manager.broadcast("📖 Reading Dockerfile...")
        
        # Read Dockerfile to detect port
        dockerfile_content = await vm_manager.exec_in_vm(
            vm_name,
            f"cat {vm_project_dir}/Dockerfile"
        )
        
        container_port = 8080  # Default
        if dockerfile_content.stdout:
            # Look for EXPOSE directive
            for line in dockerfile_content.stdout.split('\n'):
                if line.strip().upper().startswith('EXPOSE'):
                    try:
                        container_port = int(line.strip().split()[1])
                        break
                    except:
                        pass
        
        await manager.broadcast(f"🔍 Detected container port: {container_port}")
        
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
            await manager.broadcast("❌ No free ports available")
            return None
        
        # Generate container name
        container_name = f"butler-{deployment_id}"
        
        # Stop existing container if exists
        await manager.broadcast("🛑 Stopping existing container...")
        await vm_manager.exec_in_vm(
            vm_name,
            f"docker stop {container_name} 2>/dev/null || true && docker rm {container_name} 2>/dev/null || true"
        )
        
        # Build image
        await manager.broadcast("🔨 Building Docker image...")
        build_result = await vm_manager.exec_in_vm(
            vm_name,
            f"cd {vm_project_dir} && docker build -t {container_name}:latest .",
            cwd=vm_project_dir
        )
        
        if build_result.returncode != 0:
            error_msg = build_result.stderr or build_result.stdout or "Build failed"
            await manager.broadcast(f"❌ Docker build failed: {error_msg[:500]}")
            return None
        
        await manager.broadcast("✅ Docker image built successfully")
        
        # Prepare environment variables
        env_args = ""
        if env_vars:
            for key, value in env_vars.items():
                env_args += f" -e {key}={value}"
        
        # Run container
        await manager.broadcast("🚀 Starting Docker container...")
        run_result = await vm_manager.exec_in_vm(
            vm_name,
            f"docker run -d --name {container_name} -p {host_port}:{container_port}{env_args} {container_name}:latest"
        )
        
        if run_result.returncode != 0:
            error_msg = run_result.stderr or run_result.stdout or "Start failed"
            await manager.broadcast(f"❌ Failed to start container: {error_msg[:500]}")
            return None
        
        await manager.broadcast("✅ Docker container started")
        
        # Setup port forwarding
        await manager.broadcast(f"🔗 Setting up port forwarding: VM:{container_port} → Mac:{host_port}")
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
                session.add(deployment)
                session.commit()
        
        service_url = f"http://localhost:{host_port}"
        
        await manager.broadcast(f"✅ Docker deployment successful!")
        await manager.broadcast(f"🌐 Service URL: {service_url}")
        
        return service_url, "running"
        
    except Exception as e:
        logger.error(f"Error in Dockerfile deployment: {e}", exc_info=True)
        await manager.broadcast(f"❌ Dockerfile deployment failed: {str(e)}")
        return None








