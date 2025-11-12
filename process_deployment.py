"""
Process-based Deployment Handler - Direct process execution (like Vercel/Netlify)
Replaces Docker containerization with direct process execution.
"""

import asyncio
import subprocess
import os
import shutil
import tempfile
import uuid
import json
import re
import socket
from typing import Optional, Tuple, Dict
from pathlib import Path

from simple_pipeline import (
    validate_git_url,
    extract_repo_name,
    find_free_port
)
from connection_manager import manager
from process_manager import process_manager as pm
from database import engine
from login import Deployment
from sqlmodel import Session, select


async def detect_build_and_start_commands(repo_dir: str) -> Tuple[Optional[str], Optional[str], Optional[int]]:
    """
    Auto-detect build and start commands from repository.
    
    Returns:
        Tuple of (build_command, start_command, default_port)
    """
    build_cmd = None
    start_cmd = None
    default_port = None
    
    # Check for package.json (Node.js)
    package_json_path = os.path.join(repo_dir, 'package.json')
    if os.path.exists(package_json_path):
        try:
            with open(package_json_path, 'r', encoding='utf-8') as f:
                pkg = json.load(f)
            
            scripts = pkg.get('scripts', {}) or {}
            deps = pkg.get('dependencies', {}) or {}
            dev_deps = pkg.get('devDependencies', {}) or {}
            
            # Detect framework
            has_next = 'next' in {**deps, **dev_deps}
            has_react = 'react' in {**deps, **dev_deps}
            
            # Detect build command
            if 'build' in scripts:
                build_cmd = 'npm run build'
            elif has_next:
                build_cmd = 'npm install && npx next build'
            elif has_react:
                build_cmd = 'npm install && npm run build'
            else:
                build_cmd = 'npm install'
            
            # Detect start command
            if 'start' in scripts:
                start_cmd = 'npm run start'
            elif has_next:
                start_cmd = 'npx next start'
                default_port = 3000
            elif 'dev' in scripts:
                start_cmd = 'npm run dev'
                default_port = 3000
            elif 'serve' in scripts:
                start_cmd = 'npm run serve'
                default_port = 3000
            else:
                # Check for server.js or app.js
                if os.path.exists(os.path.join(repo_dir, 'server.js')):
                    start_cmd = 'node server.js'
                elif os.path.exists(os.path.join(repo_dir, 'app.js')):
                    start_cmd = 'node app.js'
                else:
                    start_cmd = 'npm start'
            
            # Default port for Node.js
            if not default_port:
                default_port = 3000
                
        except Exception as e:
            print(f"Error reading package.json: {e}")
    
    # Check for requirements.txt (Python)
    requirements_path = os.path.join(repo_dir, 'requirements.txt')
    if os.path.exists(requirements_path) and not build_cmd:
        try:
            # Check for Flask
            if os.path.exists(os.path.join(repo_dir, 'app.py')):
                build_cmd = 'pip install -r requirements.txt'
                start_cmd = 'python app.py'
                default_port = 5000
            # Check for Django
            elif os.path.exists(os.path.join(repo_dir, 'manage.py')):
                build_cmd = 'pip install -r requirements.txt'
                start_cmd = 'python manage.py runserver 0.0.0.0:8000'
                default_port = 8000
            else:
                build_cmd = 'pip install -r requirements.txt'
                start_cmd = 'python main.py'
                default_port = 5000
        except Exception as e:
            print(f"Error detecting Python project: {e}")
    
    # Check for go.mod (Go)
    go_mod_path = os.path.join(repo_dir, 'go.mod')
    if os.path.exists(go_mod_path) and not build_cmd:
        build_cmd = 'go build'
        # Try to find main.go
        main_files = ['main.go', 'cmd/main.go', 'server/main.go']
        for main_file in main_files:
            if os.path.exists(os.path.join(repo_dir, main_file)):
                start_cmd = f'go run {main_file}'
                break
        if not start_cmd:
            start_cmd = './main'  # Assuming build produces 'main' binary
        default_port = 8080
    
    # Check for Cargo.toml (Rust)
    cargo_toml_path = os.path.join(repo_dir, 'Cargo.toml')
    if os.path.exists(cargo_toml_path) and not build_cmd:
        build_cmd = 'cargo build --release'
        start_cmd = './target/release/{}'.format(os.path.basename(repo_dir))
        default_port = 8080
    
    # Check for pom.xml (Java)
    pom_xml_path = os.path.join(repo_dir, 'pom.xml')
    if os.path.exists(pom_xml_path) and not build_cmd:
        build_cmd = 'mvn clean install'
        # Try to find jar file
        start_cmd = 'java -jar target/*.jar'
        default_port = 8080
    
    # Check for static HTML files
    if not build_cmd and any(f.endswith('.html') for f in os.listdir(repo_dir) if os.path.isfile(os.path.join(repo_dir, f))):
        # Simple static server
        build_cmd = None  # No build needed
        start_cmd = 'python3 -m http.server 8080'
        default_port = 8080
    
    return build_cmd, start_cmd, default_port


async def run_process_deployment(
    git_url: str,
    user_id: Optional[int] = None,
    build_command: Optional[str] = None,
    start_command: Optional[str] = None,
    port: Optional[int] = None,
    env_vars: Optional[Dict[str, str]] = None,
    existing_deployment_id: Optional[int] = None,
    parent_project_id: Optional[int] = None,
    component_type: Optional[str] = None
) -> Optional[Tuple[str, str]]:
    """
    Deploy a project using direct process execution (no Docker).
    
    Args:
        git_url: Git repository URL
        user_id: User ID
        build_command: Build command (e.g., "npm install && npm run build")
        start_command: Start command (e.g., "npm run start")
        port: Port number
        env_vars: Environment variables
        existing_deployment_id: Existing deployment ID for redeployment
        parent_project_id: Parent project ID for split repos
        component_type: Component type ('frontend' or 'backend')
    
    Returns:
        Tuple of (project_id, deployed_url) if successful, None otherwise
    """
    try:
        # Validate Git URL
        if not validate_git_url(git_url):
            await manager.broadcast(f"❌ Invalid Git repository URL: {git_url}")
            return None
        
        # Extract repository name
        repo_name = extract_repo_name(git_url)
        project_id = f"{repo_name}-{str(uuid.uuid4())[:8]}"
        
        await manager.broadcast(f"🚀 Starting process-based deployment: {project_id}")
        
        # Create or get persistent project directory
        projects_base_dir = os.path.join(os.path.dirname(__file__), "projects")
        os.makedirs(projects_base_dir, exist_ok=True)
        project_dir = os.path.join(projects_base_dir, project_id)
        
        # Handle existing deployment
        db_deployment = None
        if existing_deployment_id is not None:
            with Session(engine) as session:
                db_deployment = session.get(Deployment, existing_deployment_id)
                if db_deployment and db_deployment.project_dir:
                    # Use existing project directory
                    project_dir = db_deployment.project_dir
                elif db_deployment:
                    # Create new directory and update
                    db_deployment.project_dir = project_dir
                    session.add(db_deployment)
                    session.commit()
        elif parent_project_id is not None and component_type is not None:
            # Child component deployment
            with Session(engine) as session:
                existing_child = session.exec(
                    select(Deployment).where(
                        Deployment.parent_project_id == parent_project_id,
                        Deployment.component_type == component_type
                    )
                ).first()
                
                if existing_child:
                    db_deployment = existing_child
                    if db_deployment.project_dir:
                        project_dir = db_deployment.project_dir
                    else:
                        db_deployment.project_dir = project_dir
                        session.add(db_deployment)
                        session.commit()
                else:
                    # Create new child deployment
                    db_deployment = Deployment(
                        container_name=project_id,
                        git_url=git_url,
                        status="starting",
                        user_id=user_id,
                        parent_project_id=parent_project_id,
                        component_type=component_type,
                        project_dir=project_dir
                    )
                    session.add(db_deployment)
                    session.commit()
                    session.refresh(db_deployment)
        else:
            # New deployment
            with Session(engine) as session:
                db_deployment = Deployment(
                    container_name=project_id,
                    git_url=git_url,
                    status="starting",
                    user_id=user_id,
                    project_dir=project_dir
                )
                session.add(db_deployment)
                session.commit()
                session.refresh(db_deployment)
        
        # Clone or update repository
        if os.path.exists(project_dir) and os.path.exists(os.path.join(project_dir, '.git')):
            await manager.broadcast("📥 Updating repository...")
            # Update existing repo
            update_result = await asyncio.to_thread(
                subprocess.run,
                ["git", "pull"],
                cwd=project_dir,
                capture_output=True,
                text=True,
                timeout=120,
                env={**os.environ, "GIT_TERMINAL_PROMPT": "0"}
            )
            if update_result.returncode != 0:
                await manager.broadcast(f"⚠️ Git pull failed: {update_result.stderr}")
        else:
            await manager.broadcast("📥 Cloning repository...")
            # Clone new repo
            if os.path.exists(project_dir):
                shutil.rmtree(project_dir)
            os.makedirs(project_dir, exist_ok=True)
            
            clone_result = await asyncio.to_thread(
                subprocess.run,
                ["git", "clone", "--depth", "1", git_url, project_dir],
                capture_output=True,
                text=True,
                timeout=120,
                env={**os.environ, "GIT_TERMINAL_PROMPT": "0"}
            )
            if clone_result.returncode != 0:
                await manager.broadcast(f"❌ Failed to clone repository: {clone_result.stderr}")
                with Session(engine) as session:
                    deployment = session.get(Deployment, db_deployment.id)
                    if deployment:
                        deployment.status = "failed"
                        session.add(deployment)
                        session.commit()
                return None
        
        await manager.broadcast("✅ Repository cloned/updated successfully")
        
        # Auto-detect build and start commands if not provided
        if not build_command or not start_command:
            await manager.broadcast("🔍 Auto-detecting build and start commands...")
            detected_build, detected_start, detected_port = await detect_build_and_start_commands(project_dir)
            
            if detected_build:
                build_command = detected_build
                await manager.broadcast(f"✅ Detected build command: {build_command}")
            
            if detected_start:
                start_command = detected_start
                await manager.broadcast(f"✅ Detected start command: {start_command}")
            
            if detected_port and not port:
                port = detected_port
                await manager.broadcast(f"✅ Detected default port: {port}")
        
        # Find free port if not specified
        if not port:
            port = find_free_port(3000)
            await manager.broadcast(f"🎯 Using port: {port}")
        
        # Run build command if provided
        if build_command:
            await manager.broadcast(f"🔨 Running build command: {build_command}")
            build_result = await asyncio.to_thread(
                subprocess.run,
                build_command.split() if '&&' not in build_command and '|' not in build_command else ['sh', '-c', build_command],
                cwd=project_dir,
                capture_output=True,
                text=True,
                timeout=600,  # 10 minute timeout for builds
                env={**os.environ, **(env_vars or {})}
            )
            
            if build_result.returncode != 0:
                error_msg = f"Build failed: {build_result.stderr}"
                await manager.broadcast(f"❌ {error_msg}")
                with Session(engine) as session:
                    deployment = session.get(Deployment, db_deployment.id)
                    if deployment:
                        deployment.status = "failed"
                        session.add(deployment)
                        session.commit()
                return None
            
            await manager.broadcast("✅ Build completed successfully")
        
        # Prepare environment variables
        process_env = env_vars or {}
        
        # Start process
        await manager.broadcast(f"🚀 Starting application: {start_command}")
        success, pid, error = await pm.start_process(
            project_id=project_id,
            command=start_command,
            cwd=project_dir,
            env=process_env,
            port=port
        )
        
        if not success:
            error_msg = f"Failed to start process: {error}"
            await manager.broadcast(f"❌ {error_msg}")
            with Session(engine) as session:
                deployment = session.get(Deployment, db_deployment.id)
                if deployment:
                    deployment.status = "failed"
                    session.add(deployment)
                    session.commit()
            return None
        
        # Wait a moment for process to start
        await asyncio.sleep(2)
        
        # Detect actual running port
        detected_port = await pm.detect_running_port(project_id, port)
        if detected_port:
            port = detected_port
        
        # Update database
        deployed_url = f"http://localhost:{port}"
        with Session(engine) as session:
            deployment = session.get(Deployment, db_deployment.id)
            if deployment:
                deployment.status = "running"
                deployment.deployed_url = deployed_url
                deployment.build_command = build_command
                deployment.start_command = start_command
                deployment.port = port
                deployment.process_pid = pid
                deployment.project_dir = project_dir
                session.add(deployment)
                session.commit()
        
        await manager.broadcast(f"🎉 Deployment successful!")
        await manager.broadcast(f"🌐 Application is running at: {deployed_url}")
        
        return (project_id, deployed_url)
        
    except Exception as e:
        error_msg = f"Deployment failed: {str(e)}"
        await manager.broadcast(f"❌ {error_msg}")
        print(f"Error in process deployment: {e}")
        import traceback
        traceback.print_exc()
        return None

