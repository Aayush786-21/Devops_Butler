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
import datetime
import logging
from typing import Optional, Tuple, Dict
from pathlib import Path

logger = logging.getLogger(__name__)

from utils import (
    validate_git_url,
    extract_repo_name
)
from connection_manager import manager
from process_manager import process_manager as pm
from database import engine
from login import Deployment
from sqlmodel import Session, select
from dockerfile_parser import parse_dockerfile, parse_docker_compose, detect_monorepo_structure


def parse_readme_for_commands(readme_path: str) -> Tuple[Optional[str], Optional[str], Optional[int]]:
    """
    Parse README.md file to extract build and start commands.
    Looks for common patterns like 'npm install', 'npm run build', 'npm start', etc.
    
    Returns:
        Tuple of (build_command, start_command, default_port)
    """
    try:
        with open(readme_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        build_cmd = None
        start_cmd = None
        default_port = None
        
        # Look for common build/start command patterns
        # Check for npm/yarn commands
        if 'npm install' in content or 'yarn install' in content:
            if 'npm run build' in content or 'yarn build' in content:
                build_cmd = 'npm install && npm run build'
            elif 'npm install' in content:
                build_cmd = 'npm install'
        
        # Check for start commands
        if 'npm start' in content or 'yarn start' in content:
            start_cmd = 'npm start'
            default_port = 3000
        elif 'npm run dev' in content or 'yarn dev' in content:
            start_cmd = 'npm run dev'
            default_port = 3000
        elif 'npm run serve' in content or 'yarn serve' in content:
            start_cmd = 'npm run serve'
            default_port = 3000
        
        # Check for Python commands
        if 'pip install' in content or 'pip install -r requirements.txt' in content:
            if not build_cmd:
                build_cmd = 'pip install -r requirements.txt'
            if 'python app.py' in content or 'flask run' in content:
                start_cmd = 'python app.py'
                default_port = 5000
            elif 'python manage.py runserver' in content or 'django' in content.lower():
                start_cmd = 'python manage.py runserver 0.0.0.0:8000'
                default_port = 8000
            elif 'python main.py' in content:
                start_cmd = 'python main.py'
                default_port = 5000
        
        # Check for port information
        port_match = re.search(r'port[:\s]+(\d+)', content, re.IGNORECASE)
        if port_match:
            default_port = int(port_match.group(1))
        
        return build_cmd, start_cmd, default_port
    except Exception as e:
        print(f"Error parsing README.md: {e}")
        return None, None, None

async def detect_build_and_start_commands(repo_dir: str) -> Tuple[Optional[str], Optional[str], Optional[int]]:
    """
    Auto-detect build and start commands from repository.
    Priority: docker-compose.yml > Dockerfile > README.md > project analysis
    
    Returns:
        Tuple of (build_command, start_command, default_port)
    """
    build_cmd = None
    start_cmd = None
    default_port = None
    
    # PRIORITY 1: Check for docker-compose.yml first
    compose_files = ['docker-compose.yml', 'docker-compose.yaml']
    for compose_file in compose_files:
        compose_path = os.path.join(repo_dir, compose_file)
        if os.path.exists(compose_path):
            compose_info = parse_docker_compose(compose_path)
            if compose_info:
                # Try to find the main service (usually 'web', 'app', 'frontend', or first service)
                main_service = None
                for service_name in ['web', 'app', 'frontend', 'main']:
                    if service_name in compose_info:
                        main_service = compose_info[service_name]
                        break
                if not main_service and compose_info:
                    # Use first service
                    main_service = list(compose_info.values())[0]
                
                if main_service and main_service.get('command'):
                    start_cmd = main_service['command']
                    if main_service.get('port'):
                        default_port = main_service['port']
                    # If we got command from docker-compose, use it
                    if start_cmd:
                        return build_cmd, start_cmd, default_port
    
    # PRIORITY 2: Check for Dockerfile (extract commands from it)
    dockerfile_path = os.path.join(repo_dir, 'Dockerfile')
    if os.path.exists(dockerfile_path):
        dockerfile_info = parse_dockerfile(dockerfile_path)
        if dockerfile_info:
            build_cmd = dockerfile_info.get('build_command')
            start_cmd = dockerfile_info.get('start_command')
            if dockerfile_info.get('port'):
                default_port = dockerfile_info['port']
            # If we got commands from Dockerfile, use them
            if start_cmd:
                return build_cmd, start_cmd, default_port
    
    # PRIORITY 3: Check for README.md
    readme_files = ['README.md', 'README.txt', 'README', 'readme.md']
    for readme_file in readme_files:
        readme_path = os.path.join(repo_dir, readme_file)
        if os.path.exists(readme_path):
            build_cmd, start_cmd, default_port = parse_readme_for_commands(readme_path)
            if start_cmd:
                return build_cmd, start_cmd, default_port
    
    # PRIORITY 4: Project analysis - Check for package.json (Node.js) - ALWAYS prioritize Node.js if package.json exists
    package_json_path = os.path.join(repo_dir, 'package.json')
    if os.path.exists(package_json_path):
        try:
            with open(package_json_path, 'r', encoding='utf-8') as f:
                pkg = json.load(f)
            
            scripts = pkg.get('scripts', {}) or {}
            deps = pkg.get('dependencies', {}) or {}
            dev_deps = pkg.get('devDependencies', {}) or {}
            
            # Detect framework
            has_next = 'next' in deps or 'next' in dev_deps
            has_react = 'react' in deps or 'react' in dev_deps
            has_vue = 'vue' in deps or 'vue' in dev_deps
            
            # Detect build command - always install dependencies first
            if 'build' in scripts:
                build_cmd = 'npm install && npm run build'
            elif has_next:
                build_cmd = 'npm install && npx next build'
            elif has_react:
                build_cmd = 'npm install && npm run build'
            elif has_vue:
                build_cmd = 'npm install && npm run build'
            else:
                # Even if no build script, install dependencies
                build_cmd = 'npm install'
            
            # Detect start command
            if 'start' in scripts:
                start_cmd = 'npm run start'
                default_port = 3000
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
                # Check for common entry points
                if os.path.exists(os.path.join(repo_dir, 'src', 'index.js')):
                    start_cmd = 'node src/index.js'
                elif os.path.exists(os.path.join(repo_dir, 'src', 'server.js')):
                    start_cmd = 'node src/server.js'
                elif os.path.exists(os.path.join(repo_dir, 'server.js')):
                    start_cmd = 'node server.js'
                elif os.path.exists(os.path.join(repo_dir, 'app.js')):
                    start_cmd = 'node app.js'
                elif os.path.exists(os.path.join(repo_dir, 'index.js')):
                    start_cmd = 'node index.js'
                else:
                    # Fallback to npm start (will fail if no start script, but that's better than wrong command)
                    start_cmd = 'npm start'
            
            # Default port for Node.js
            if not default_port:
                default_port = 3000
            
            # Return early - don't check for Python if package.json exists
            return build_cmd, start_cmd, default_port
                
        except Exception as e:
            # Even if package.json can't be read, if it exists, assume it's a Node.js project
            print(f"Error reading package.json: {e}, but assuming Node.js project")
            build_cmd = 'npm install'
            start_cmd = 'npm start'
            default_port = 3000
            return build_cmd, start_cmd, default_port
    
    # Check for requirements.txt (Python) - only if package.json doesn't exist
    requirements_path = os.path.join(repo_dir, 'requirements.txt')
    if os.path.exists(requirements_path):
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
            # Check for main.py (only use if it actually exists)
            elif os.path.exists(os.path.join(repo_dir, 'main.py')):
                build_cmd = 'pip install -r requirements.txt'
                start_cmd = 'python main.py'
                default_port = 5000
            else:
                # requirements.txt exists but no standard entry point found
                # Don't set start_cmd - let user specify it manually
                build_cmd = 'pip install -r requirements.txt'
                start_cmd = None
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
    component_type: Optional[str] = None,
    root_directory: Optional[str] = "./",
    project_name: Optional[str] = None
) -> Optional[Tuple[str, str]]:
    """
    Deploy a project using VM-based process execution (inside OrbStack VM).
    
    Args:
        git_url: Git repository URL
        user_id: User ID (required for VM access)
        build_command: Build command (e.g., "npm install && npm run build")
        start_command: Start command (e.g., "npm run start")
        port: Port number
        env_vars: Environment variables
        existing_deployment_id: Existing deployment ID for redeployment
        parent_project_id: Parent project ID for split repos
        component_type: Component type ('frontend' or 'backend')
        root_directory: Root directory path (for monorepo or subdirectory deployments)
        project_name: Project name (for domain generation)
    
    Returns:
        Tuple of (project_id, deployed_url) if successful, None otherwise
    """
    deployment_id = None  # Initialize early for exception handling
    try:
        # Validate user_id is provided
        if not user_id:
            error_msg = "user_id is required for VM-based deployment"
            await manager.broadcast(f"❌ {error_msg}")
            print(f"Validation error: {error_msg}")
            return None
        
        # Validate Git URL
        if not validate_git_url(git_url):
            error_msg = f"Invalid Git repository URL: {git_url}"
            await manager.broadcast(f"❌ {error_msg}")
            print(f"Validation error: {error_msg}")
            return None
        
        # Get or create user's VM
        await manager.broadcast(f"🔧 Getting or creating VM for user {user_id}...")
        from vm_manager import vm_manager
        vm_info = await vm_manager.get_or_create_user_vm(user_id)
        vm_name = vm_info.get("vm_name")
        vm_ip = vm_info.get("vm_ip", "127.0.0.1")
        
        if not vm_name:
            error_msg = f"Failed to get or create VM for user {user_id}"
            await manager.broadcast(f"❌ {error_msg}")
            print(f"VM error: {error_msg}")
            return None
        
        await manager.broadcast(f"✅ Using VM: {vm_name}")
        
        # Get the username from the VM dynamically
        try:
            username_result = await vm_manager.exec_in_vm(vm_name, "whoami")
            if username_result.returncode == 0 and username_result.stdout.strip():
                vm_username = username_result.stdout.strip()
                logger.info(f"VM username detected: {vm_username}")
            else:
                # Fallback to $USER environment variable
                user_env_result = await vm_manager.exec_in_vm(vm_name, "echo $USER")
                if user_env_result.returncode == 0 and user_env_result.stdout.strip():
                    vm_username = user_env_result.stdout.strip()
                    logger.info(f"VM username from $USER: {vm_username}")
                else:
                    # Fallback: extract from $HOME
                    home_result = await vm_manager.exec_in_vm(vm_name, "echo $HOME")
                    if home_result.returncode == 0 and home_result.stdout.strip():
                        home_path = home_result.stdout.strip()
                        vm_username = home_path.split('/')[-1] if home_path.startswith('/home/') else 'ubuntu'
                        logger.info(f"VM username from $HOME: {vm_username}")
                    else:
                        # Last resort: default to 'ubuntu'
                        vm_username = 'ubuntu'
                        logger.warning(f"Could not detect VM username, using default: {vm_username}")
        except Exception as e:
            logger.warning(f"Failed to get VM username: {e}, using default")
            vm_username = 'ubuntu'  # Default fallback
        
        # Extract repository name
        repo_name = extract_repo_name(git_url)
        project_id = f"{repo_name}-{str(uuid.uuid4())[:8]}"
        
        await manager.broadcast(f"🚀 Starting VM-based deployment: {project_id}")
        
        # Project directory inside VM user's home directory
        # Use format: /home/{username}/projects/{project_id}
        vm_project_dir = f"/home/{vm_username}/projects/{project_id}"
        
        # Resolve root directory within VM project directory
        if root_directory and root_directory != "./":
            # Combine VM project dir with root directory
            if root_directory.startswith("/"):
                vm_project_dir = root_directory  # Absolute path in VM
            else:
                vm_project_dir = f"{vm_project_dir}/{root_directory.lstrip('./')}"
        
        project_dir = vm_project_dir  # Use VM path for all operations
        
        # Handle existing deployment
        # Store deployment_id early to avoid SQLAlchemy detached instance errors
        deployment_id = existing_deployment_id
        db_deployment = None
        
        if existing_deployment_id is not None:
            with Session(engine) as session:
                db_deployment = session.get(Deployment, existing_deployment_id)
                if db_deployment:
                    deployment_id = db_deployment.id  # Store ID for later use
                    if db_deployment.project_dir:
                        # Check if project_dir is in old format (/projects/...) and migrate to home directory
                        old_project_dir = db_deployment.project_dir
                        if old_project_dir.startswith('/projects/'):
                            # Migrate from old /projects/ format to /home/username/projects/ format
                            deployment_id_from_path = old_project_dir.split('/')[-1]
                            new_project_dir = f"/home/{vm_username}/projects/{deployment_id_from_path}"
                            logger.info(f"Migrating project directory from {old_project_dir} to {new_project_dir}")
                            # Move the directory if it exists
                            try:
                                move_result = await vm_manager.exec_in_vm(
                                    vm_name,
                                    f"mv {old_project_dir} {new_project_dir} 2>&1 || echo 'MOVE_FAILED'"
                                )
                                if 'MOVE_FAILED' not in move_result.stdout:
                                    logger.info(f"Successfully migrated project directory")
                                else:
                                    logger.warning(f"Directory migration may have failed: {move_result.stdout}")
                            except Exception as e:
                                logger.warning(f"Failed to migrate directory: {e}")
                            project_dir = new_project_dir
                            db_deployment.project_dir = new_project_dir
                        else:
                            # Use existing project directory in VM (already in home directory format)
                            project_dir = db_deployment.project_dir
                        vm_project_dir = project_dir  # Update vm_project_dir to match existing project_dir
                    else:
                        # Create new directory and update with home directory path
                        db_deployment.project_dir = project_dir
                        db_deployment.vm_name = vm_name
                        db_deployment.vm_ip = vm_ip
                        session.add(db_deployment)
                        session.commit()
                    # Update VM info if changed
                    if db_deployment.vm_name != vm_name:
                        db_deployment.vm_name = vm_name
                        db_deployment.vm_ip = vm_ip
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
                    deployment_id = db_deployment.id  # Store ID for later use
                    if db_deployment.project_dir:
                        # Check if project_dir is in old format (/projects/...) and migrate to home directory
                        old_project_dir = db_deployment.project_dir
                        if old_project_dir.startswith('/projects/'):
                            # Migrate from old /projects/ format to /home/username/projects/ format
                            deployment_id_from_path = old_project_dir.split('/')[-1]
                            new_project_dir = f"/home/{vm_username}/projects/{deployment_id_from_path}"
                            logger.info(f"Migrating child project directory from {old_project_dir} to {new_project_dir}")
                            # Move the directory if it exists
                            try:
                                move_result = await vm_manager.exec_in_vm(
                                    vm_name,
                                    f"mv {old_project_dir} {new_project_dir} 2>&1 || echo 'MOVE_FAILED'"
                                )
                                if 'MOVE_FAILED' not in move_result.stdout:
                                    logger.info(f"Successfully migrated child project directory")
                            except Exception as e:
                                logger.warning(f"Failed to migrate child directory: {e}")
                            project_dir = new_project_dir
                            db_deployment.project_dir = new_project_dir
                        else:
                            project_dir = db_deployment.project_dir
                        vm_project_dir = project_dir  # Update vm_project_dir to match existing project_dir
                    else:
                        db_deployment.project_dir = project_dir
                        db_deployment.vm_name = vm_name
                        db_deployment.vm_ip = vm_ip
                        session.add(db_deployment)
                        session.commit()
                    # Update VM info if changed
                    if db_deployment.vm_name != vm_name:
                        db_deployment.vm_name = vm_name
                        db_deployment.vm_ip = vm_ip
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
                        project_dir=project_dir,
                        vm_name=vm_name,
                        vm_ip=vm_ip
                    )
                    session.add(db_deployment)
                    session.commit()
                    session.refresh(db_deployment)
                    deployment_id = db_deployment.id  # Store ID for later use
        else:
            # New deployment
            with Session(engine) as session:
                db_deployment = Deployment(
                    container_name=project_id,
                    git_url=git_url,
                    status="starting",
                    user_id=user_id,
                    project_dir=project_dir,
                    vm_name=vm_name,
                    vm_ip=vm_ip
                )
                # Set project name if provided
                if project_name:
                    db_deployment.app_name = project_name
                session.add(db_deployment)
                session.commit()
                session.refresh(db_deployment)
                deployment_id = db_deployment.id  # Store ID for later use
        
        # Clone or update repository inside VM
        await manager.broadcast(f"📥 Cloning repository to VM: {vm_project_dir}...")
        
        # Check if repository already exists in VM
        check_result = await vm_manager.exec_in_vm(
            vm_name,
            f"test -d {vm_project_dir}/.git && echo 'exists' || echo 'not_exists'"
        )
        
        repo_exists = "exists" in (check_result.stdout or "")
        
        if repo_exists:
            await manager.broadcast("📥 Updating repository in VM...")
            # Update existing repo
            update_result = await vm_manager.exec_in_vm(
                vm_name,
                f"cd {vm_project_dir} && git pull",
                cwd=vm_project_dir
            )
            
            if update_result.returncode != 0:
                await manager.broadcast(f"⚠️ Git pull failed: {update_result.stderr}")
        else:
            # Create project directory in user's home directory if it doesn't exist
            # Extract parent directory from vm_project_dir (e.g., /home/username/projects from /home/username/projects/project-id)
            parent_dir = "/".join(vm_project_dir.rstrip("/").split("/")[:-1])
            if not parent_dir:
                # Fallback: use user's home directory projects folder
                parent_dir = f"/home/{vm_username}/projects"
            
            # Create parent directory in user's home (no sudo needed)
            mkdir_result = await vm_manager.exec_in_vm(
                vm_name,
                f"mkdir -p {parent_dir} && chmod 755 {parent_dir}"
            )
            if mkdir_result.returncode != 0:
                error_output = mkdir_result.stderr or mkdir_result.stdout or "Unknown error"
                error_msg = f"Failed to create parent directory {parent_dir} in VM: {error_output}"
                await manager.broadcast(f"❌ {error_msg}")
                raise Exception(error_msg)
            
            # Clone repository inside VM
            clone_result = await vm_manager.exec_in_vm(
                vm_name,
                f"git clone --depth 1 {git_url} {vm_project_dir}",
                env={**os.environ, "GIT_TERMINAL_PROMPT": "0"} if os.environ else {}
            )
            
            if clone_result.returncode != 0:
                error_msg = f"Failed to clone repository in VM: {clone_result.stderr}"
                await manager.broadcast(f"❌ {error_msg}")
                if deployment_id:
                    with Session(engine) as session:
                        deployment = session.get(Deployment, deployment_id)
                        if deployment:
                            deployment.status = "failed"
                            session.add(deployment)
                            session.commit()
                return None
            
            await manager.broadcast("✅ Repository cloned successfully in VM")
        
        # Auto-detect build and start commands if not provided
        # Priority: 1. User-provided, 2. AI analysis results from DB, 3. File-based detection
        if not build_command or not start_command or not port:
            await manager.broadcast("🔍 Auto-detecting build and start commands...")
            
            # PRIORITY 1: Check for AI analysis results in database (if deployment exists)
            # AI analysis runs in background after import, so results may already be available
            ai_detected = False
            if deployment_id:
                with Session(engine) as session:
                    deployment = session.get(Deployment, deployment_id)
                    if deployment:
                        # Use AI analysis results if available (these are set by project_analyzer.py)
                        if not build_command and deployment.build_command:
                            build_command = deployment.build_command
                            ai_detected = True
                            await manager.broadcast(f"🤖 Using AI-detected build command: {build_command}")
                        
                        if not start_command and deployment.start_command:
                            start_command = deployment.start_command
                            ai_detected = True
                            await manager.broadcast(f"🤖 Using AI-detected start command: {start_command}")
                        
                        if not port and deployment.port:
                            port = deployment.port
                            ai_detected = True
                            await manager.broadcast(f"🤖 Using AI-detected port: {port}")
            
            # PRIORITY 2: Use dockerfile_parser for Docker-based detection (if AI results not available)
            if not build_command or not start_command:
                await manager.broadcast("📁 Checking project files for build/start commands...")
                
                # Check for docker-compose.yml first (use dockerfile_parser)
                compose_files = ['docker-compose.yml', 'docker-compose.yaml']
                for compose_file in compose_files:
                    compose_check = await vm_manager.exec_in_vm(
                        vm_name,
                        f"test -f {vm_project_dir}/{compose_file} && echo 'found' || echo 'not_found'"
                    )
                    if "found" in (compose_check.stdout or ""):
                        # Read docker-compose file
                        compose_content = await vm_manager.exec_in_vm(
                            vm_name,
                            f"cat {vm_project_dir}/{compose_file}"
                        )
                        if compose_content.returncode == 0 and compose_content.stdout:
                            # Use dockerfile_parser to parse docker-compose
                            try:
                                # Write content to temp file for parsing
                                import tempfile
                                with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as tmp_file:
                                    tmp_file.write(compose_content.stdout)
                                    tmp_compose_path = tmp_file.name
                                
                                compose_info = parse_docker_compose(tmp_compose_path)
                                if compose_info:
                                    # Find main service
                                    main_service = None
                                    for service_name in ['web', 'app', 'frontend', 'main']:
                                        if service_name in compose_info:
                                            main_service = compose_info[service_name]
                                            break
                                    if not main_service and compose_info:
                                        main_service = list(compose_info.values())[0]
                                    
                                    if main_service:
                                        if not start_command and main_service.get('command'):
                                            start_command = main_service['command']
                                            await manager.broadcast(f"✅ Detected start command from docker-compose: {start_command}")
                                        if not port and main_service.get('port'):
                                            port = main_service['port']
                                            await manager.broadcast(f"✅ Detected port from docker-compose: {port}")
                                
                                # Clean up temp file
                                os.unlink(tmp_compose_path)
                            except Exception as e:
                                logger.debug(f"Error parsing docker-compose: {e}")
                                pass
                        break
                
                # Check for Dockerfile (use dockerfile_parser)
                if not start_command:
                    dockerfile_check = await vm_manager.exec_in_vm(
                        vm_name,
                        f"test -f {vm_project_dir}/Dockerfile && echo 'found' || echo 'not_found'"
                    )
                    
                    if "found" in (dockerfile_check.stdout or ""):
                        # Read Dockerfile
                        dockerfile_content = await vm_manager.exec_in_vm(
                            vm_name,
                            f"cat {vm_project_dir}/Dockerfile"
                        )
                        if dockerfile_content.returncode == 0 and dockerfile_content.stdout:
                            try:
                                # Write content to temp file for parsing
                                import tempfile
                                with tempfile.NamedTemporaryFile(mode='w', suffix='.Dockerfile', delete=False) as tmp_file:
                                    tmp_file.write(dockerfile_content.stdout)
                                    tmp_dockerfile_path = tmp_file.name
                                
                                dockerfile_info = parse_dockerfile(tmp_dockerfile_path)
                                if dockerfile_info:
                                    if not build_command and dockerfile_info.get('build_command'):
                                        build_command = dockerfile_info['build_command']
                                        await manager.broadcast(f"✅ Detected build command from Dockerfile: {build_command}")
                                    if not start_command and dockerfile_info.get('start_command'):
                                        start_command = dockerfile_info['start_command']
                                        await manager.broadcast(f"✅ Detected start command from Dockerfile: {start_command}")
                                    if not port and dockerfile_info.get('port'):
                                        port = dockerfile_info['port']
                                        await manager.broadcast(f"✅ Detected port from Dockerfile: {port}")
                                
                                # Clean up temp file
                                os.unlink(tmp_dockerfile_path)
                            except Exception as e:
                                logger.debug(f"Error parsing Dockerfile: {e}")
                                pass
                
                # Check for package.json (Node.js) - detailed detection
                if not build_command or not start_command:
                    package_json_check = await vm_manager.exec_in_vm(
                        vm_name,
                        f"test -f {vm_project_dir}/package.json && echo 'found' || echo 'not_found'"
                    )
                    
                    if "found" in (package_json_check.stdout or ""):
                        # Read package.json
                        package_json_content = await vm_manager.exec_in_vm(
                            vm_name,
                            f"cat {vm_project_dir}/package.json"
                        )
                        if package_json_content.returncode == 0 and package_json_content.stdout:
                            try:
                                package_data = json.loads(package_json_content.stdout)
                                scripts = package_data.get('scripts', {})
                                deps = package_data.get('dependencies', {})
                                dev_deps = package_data.get('devDependencies', {})
                                
                                # Detect build command
                                if not build_command:
                                    if 'build' in scripts:
                                        build_command = "npm install && npm run build"
                                    elif 'next' in deps or 'next' in dev_deps:
                                        build_command = "npm install && npx next build"
                                    else:
                                        build_command = "npm install"
                                    await manager.broadcast(f"✅ Detected build command: {build_command}")
                                
                                # Detect start command
                                if not start_command:
                                    if 'start' in scripts:
                                        start_command = "npm start"
                                    elif 'next' in deps or 'next' in dev_deps:
                                        start_command = "npx next start"
                                    elif 'dev' in scripts:
                                        start_command = "npm run dev"
                                    elif 'serve' in scripts:
                                        start_command = "npm run serve"
                                    else:
                                        # Check for common entry points (single VM call)
                                        entry_points = [
                                            'src/index.js',
                                            'src/server.js',
                                            'server.js',
                                            'app.js',
                                            'index.js'
                                        ]
                                        entry_check = await vm_manager.exec_in_vm(
                                            vm_name,
                                            f"for file in {' '.join([f'{vm_project_dir}/{ep}' for ep in entry_points])}; do if [ -f \"$file\" ]; then echo $(basename $(dirname \"$file\"))/$(basename \"$file\") 2>/dev/null || echo $(basename \"$file\"); break; fi; done"
                                        )
                                        entry_point = (entry_check.stdout or "").strip()
                                        if entry_point:
                                            # Clean up the path
                                            if entry_point.startswith(f'{vm_project_dir}/'):
                                                entry_point = entry_point.replace(f'{vm_project_dir}/', '')
                                            start_command = f"node {entry_point}"
                                        else:
                                            start_command = "npm start"  # Fallback
                                    await manager.broadcast(f"✅ Detected start command: {start_command}")
                                
                                # Default port for Node.js
                                if not port:
                                    port = 3000
                                    await manager.broadcast(f"✅ Using default Node.js port: {port}")
                            except json.JSONDecodeError as e:
                                # Fallback to simple detection
                                if not build_command:
                                    build_command = "npm install"
                                if not start_command:
                                    start_command = "npm start"
                                if not port:
                                    port = 3000
                
                # Check for requirements.txt (Python)
                if not build_command or not start_command:
                    requirements_check = await vm_manager.exec_in_vm(
                        vm_name,
                        f"test -f {vm_project_dir}/requirements.txt && echo 'found' || echo 'not_found'"
                    )
                    
                    if "found" in (requirements_check.stdout or ""):
                        # Check for Python entry points (single VM call)
                        python_files = ['app.py', 'manage.py', 'main.py']
                        python_check = await vm_manager.exec_in_vm(
                            vm_name,
                            f"for file in {' '.join(python_files)}; do if [ -f {vm_project_dir}/$file ]; then echo $file; break; fi; done"
                        )
                        python_file = (python_check.stdout or "").strip()
                        
                        if not build_command:
                            build_command = "pip install -r requirements.txt"
                        
                        if python_file == 'app.py':
                            # Flask project
                            if not start_command:
                                start_command = "python app.py"
                            if not port:
                                port = 5000
                            await manager.broadcast(f"✅ Detected Python Flask project")
                        elif python_file == 'manage.py':
                            # Django project
                            if not start_command:
                                start_command = "python manage.py runserver 0.0.0.0:8000"
                            if not port:
                                port = 8000
                            await manager.broadcast(f"✅ Detected Python Django project")
                        elif python_file == 'main.py':
                            # Python project with main.py
                            if not start_command:
                                start_command = "python main.py"
                            if not port:
                                port = 5000
                            await manager.broadcast(f"✅ Detected Python project with main.py")
                        else:
                            # requirements.txt exists but no standard entry point
                            # Don't set start_command - let user specify it manually
                            await manager.broadcast(f"⚠️ Python project detected but no standard entry point found")
        
        # Find free port if not specified (ports are forwarded from VM to host)
        if not port:
            port = 3000  # Default port
            await manager.broadcast(f"🎯 Using default port: {port}")
        
        # Update deployment record with detected commands (if not already set)
        if deployment_id and (build_command or start_command or port):
            with Session(engine) as session:
                deployment = session.get(Deployment, deployment_id)
                if deployment:
                    updated = False
                    if build_command and not deployment.build_command:
                        deployment.build_command = build_command
                        updated = True
                    if start_command and not deployment.start_command:
                        deployment.start_command = start_command
                        updated = True
                    if port and not deployment.port:
                        deployment.port = port
                        updated = True
                    if updated:
                        session.add(deployment)
                        session.commit()
                        await manager.broadcast("💾 Saved detected commands to deployment record")
        
        # Run build command inside VM if provided
        if build_command:
            await manager.broadcast(f"🔨 Running build command in VM: {build_command}")
            try:
                # Execute build command inside VM
                build_result = await vm_manager.exec_in_vm(
                    vm_name,
                    build_command,
                    cwd=vm_project_dir,
                    env=env_vars
                )
                
                if build_result.returncode != 0:
                    error_output = build_result.stderr or build_result.stdout or "Unknown build error"
                    error_msg = f"Build failed in VM (exit code {build_result.returncode}): {error_output[:500]}"
                    await manager.broadcast(f"❌ {error_msg}")
                    # Log build output for debugging
                    if build_result.stdout:
                        await manager.broadcast(f"Build stdout: {build_result.stdout[:1000]}")
                    if build_result.stderr:
                        await manager.broadcast(f"Build stderr: {build_result.stderr[:1000]}")
                    if deployment_id:
                        with Session(engine) as session:
                            deployment = session.get(Deployment, deployment_id)
                            if deployment:
                                deployment.status = "failed"
                                session.add(deployment)
                                session.commit()
                    return None
                
                await manager.broadcast("✅ Build completed successfully in VM")
                # Log build output if available
                if build_result.stdout:
                    await manager.broadcast(f"Build output: {build_result.stdout[:500]}")
            except Exception as e:
                error_msg = f"Build command failed in VM with error: {str(e)}"
                await manager.broadcast(f"❌ {error_msg}")
                if deployment_id:
                    with Session(engine) as session:
                        deployment = session.get(Deployment, deployment_id)
                        if deployment:
                            deployment.status = "failed"
                            session.add(deployment)
                            session.commit()
                return None
        
        # Validate that we have a start command
        if not start_command:
            error_msg = "No start command provided or detected. Please specify a start command in the deployment settings."
            await manager.broadcast(f"❌ {error_msg}")
            if deployment_id:
                with Session(engine) as session:
                    deployment = session.get(Deployment, deployment_id)
                    if deployment:
                        deployment.status = "failed"
                        session.add(deployment)
                        session.commit()
            return None
        
        # Prepare environment variables
        process_env = env_vars or {}
        
        # Ensure we have a deployment_id before starting process
        if not deployment_id:
            error_msg = "No deployment record found. Cannot start process."
            await manager.broadcast(f"❌ {error_msg}")
            print(f"Error: {error_msg} - deployment_id is None")
            return None
        
        # Start process inside VM using nohup or PM2 for background execution
        # Use deployment_id as project_id for process tracking
        process_project_id = str(deployment_id)
        await manager.broadcast(f"🚀 Starting application in VM: {start_command}")
        
        try:
            # Prepare environment variables
            env_vars_full = process_env.copy() if process_env else {}
            if port:
                env_vars_full['PORT'] = str(port)
                env_vars_full['HOST'] = '0.0.0.0'
                env_vars_full['HOSTNAME'] = '0.0.0.0'
            
            # Use nohup to run process in background inside VM
            # Format: nohup command > log_file 2>&1 &
            log_file = f"/tmp/project-{deployment_id}.log"
            pid_file = f"/tmp/project-{deployment_id}.pid"
            
            # Start command in background using nohup
            # The exec_in_vm function will handle cwd and env variables
            # Format: nohup command > log 2>&1 & echo $! > pid_file
            start_cmd = f"nohup {start_command} > {log_file} 2>&1 & echo $! > {pid_file}"
            
            # Execute the command with environment variables
            # The exec_in_vm function will handle setting env vars and cwd
            start_result = await vm_manager.exec_in_vm(
                vm_name,
                start_cmd,
                cwd=vm_project_dir,
                env=env_vars_full
            )
            
            if start_result.returncode != 0:
                error_msg = f"Failed to start process in VM: {start_result.stderr}"
                await manager.broadcast(f"❌ {error_msg}")
                print(f"Process start failed: {error_msg}")
                if start_result.stdout:
                    await manager.broadcast(f"Output: {start_result.stdout[:500]}")
                with Session(engine) as session:
                    deployment = session.get(Deployment, deployment_id)
                    if deployment:
                        deployment.status = "failed"
                        session.add(deployment)
                        session.commit()
                return None
            
            # Wait a moment for process to start and PID file to be created
            await asyncio.sleep(1)
            
            # Read PID from file
            pid_result = await vm_manager.exec_in_vm(
                vm_name,
                f"cat {pid_file} 2>/dev/null || echo ''"
            )
            
            pid = None
            if pid_result.returncode == 0 and pid_result.stdout.strip():
                try:
                    pid = int(pid_result.stdout.strip())
                except ValueError:
                    pass
            
            # If PID file is empty, try to find the process by command
            if not pid:
                # Try to find process by command pattern
                find_pid_result = await vm_manager.exec_in_vm(
                    vm_name,
                    f"ps aux | grep '{start_command}' | grep -v grep | awk '{{print $2}}' | head -1"
                )
                if find_pid_result.returncode == 0 and find_pid_result.stdout.strip():
                    try:
                        pid = int(find_pid_result.stdout.strip())
                    except ValueError:
                        pass
            
            # Verify process is running
            if pid:
                check_result = await vm_manager.exec_in_vm(
                    vm_name,
                    f"ps -p {pid} > /dev/null 2>&1 && echo 'running' || echo 'stopped'"
                )
                if "stopped" in (check_result.stdout or ""):
                    error_msg = "Process started but exited immediately"
                    await manager.broadcast(f"❌ {error_msg}")
                    # Read log file for error details
                    log_result = await vm_manager.exec_in_vm(
                        vm_name,
                        f"tail -50 {log_file} 2>/dev/null || echo 'No log file'"
                    )
                    if log_result.stdout:
                        await manager.broadcast(f"Log output: {log_result.stdout[:500]}")
                    with Session(engine) as session:
                        deployment = session.get(Deployment, deployment_id)
                        if deployment:
                            deployment.status = "failed"
                            session.add(deployment)
                            session.commit()
                    return None
            else:
                # Process might still be starting, check logs
                await asyncio.sleep(1)
                # Check if process is actually running (by checking port or process name)
                check_process = await vm_manager.exec_in_vm(
                    vm_name,
                    f"pgrep -f '{start_command.split()[0]}' || echo 'not_found'"
                )
                if "not_found" in (check_process.stdout or ""):
                    error_msg = "Process failed to start - no process found"
                    await manager.broadcast(f"❌ {error_msg}")
                    # Read log file
                    log_result = await vm_manager.exec_in_vm(
                        vm_name,
                        f"cat {log_file} 2>/dev/null || echo 'No log file'"
                    )
                    if log_result.stdout:
                        await manager.broadcast(f"Process logs: {log_result.stdout[:1000]}")
                    with Session(engine) as session:
                        deployment = session.get(Deployment, deployment_id)
                        if deployment:
                            deployment.status = "failed"
                            session.add(deployment)
                            session.commit()
                    return None
                else:
                    # Extract PID from pgrep output
                    try:
                        pid = int(check_process.stdout.strip().split()[0])
                    except (ValueError, IndexError):
                        pid = None
            
            await manager.broadcast(f"✅ Process started in VM (PID: {pid})")
            
        except Exception as e:
            error_msg = f"Exception while starting process in VM: {str(e)}"
            await manager.broadcast(f"❌ {error_msg}")
            print(f"Process start exception: {e}")
            import traceback
            traceback.print_exc()
            with Session(engine) as session:
                deployment = session.get(Deployment, deployment_id)
                if deployment:
                    deployment.status = "failed"
                    session.add(deployment)
                    session.commit()
            return None
        
        # Wait a moment for process to start
        await asyncio.sleep(2)
        
        # Check if process is still running
        if pid:
            check_result = await vm_manager.exec_in_vm(
                vm_name,
                f"ps -p {pid} > /dev/null 2>&1 && echo 'running' || echo 'stopped'"
            )
            if "stopped" in (check_result.stdout or ""):
                error_msg = "Process exited after startup"
                await manager.broadcast(f"❌ {error_msg}")
                # Read log file
                log_result = await vm_manager.exec_in_vm(
                    vm_name,
                    f"cat {log_file} 2>/dev/null || echo 'No log file'"
                )
                if log_result.stdout:
                    await manager.broadcast(f"Process logs: {log_result.stdout[:1000]}")
                with Session(engine) as session:
                    deployment = session.get(Deployment, deployment_id)
                    if deployment:
                        deployment.status = "failed"
                        session.add(deployment)
                        session.commit()
                return None
        
        # Generate deployed URL - use custom domain if available, otherwise use localhost
        # For VM-based deployment, we'll use the custom domain format
        deployed_url = None
        try:
            with Session(engine) as session:
                deployment = session.get(Deployment, deployment_id)
                if not deployment:
                    error_msg = f"Deployment record {deployment_id} not found in database"
                    await manager.broadcast(f"❌ {error_msg}")
                    print(f"Error: {error_msg}")
                    return None
                
                # Generate default domain: project-name.butler.aayush786.xyz
                # Get butler domain from environment
                butler_domain = os.getenv("BUTLER_DOMAIN", "butler.aayush786.xyz")
                
                # Generate project slug from app_name or container_name
                if deployment.app_name:
                    project_slug = re.sub(r"[^a-z0-9]+", "-", deployment.app_name.lower()).strip("-")
                else:
                    # Extract from container_name or repo name
                    repo_name = extract_repo_name(deployment.git_url)
                    project_slug = re.sub(r"[^a-z0-9]+", "-", repo_name.lower()).strip("-")
                
                if not project_slug:
                    project_slug = f"project-{deployment.id}"
                
                # Format: project-name.butler.aayush786.xyz (with dot)
                default_domain = f"{project_slug}.{butler_domain}"
                
                # Check if custom domain is configured
                if deployment.custom_domain:
                    # Use custom domain (already configured)
                    domain_to_use = deployment.custom_domain
                else:
                    # Use generated default domain
                    domain_to_use = default_domain
                    # Store the generated domain
                    deployment.custom_domain = default_domain
                
                deployed_url = f"https://{domain_to_use}"
                
                deployment.status = "running"
                deployment.deployed_url = deployed_url
                deployment.build_command = build_command
                deployment.start_command = start_command
                deployment.port = port
                deployment.process_pid = pid
                deployment.project_dir = project_dir
                deployment.vm_name = vm_name
                deployment.vm_ip = vm_ip
                deployment.host_port = port  # Port in VM, forwarded to host
                
                # Configure Cloudflare tunnel to route domain to localhost:port
                # For VM-based deployment, OrbStack forwards ports from VM to host
                # So we use localhost:{port} as the service URL
                service_url = f"http://localhost:{port}"
                
                try:
                    from cloudflare_manager import ensure_project_hostname
                    ensure_project_hostname(domain_to_use, service_url)
                    deployment.domain_status = "active"
                    deployment.last_domain_sync = datetime.datetime.utcnow()
                    await manager.broadcast(f"✅ Domain configured: {domain_to_use} → {service_url}")
                except Exception as cf_error:
                    # Log error but don't fail deployment
                    deployment.domain_status = "pending"
                    await manager.broadcast(f"⚠️ Cloudflare configuration failed (will retry later): {str(cf_error)}")
                    print(f"Cloudflare configuration error: {cf_error}")
                
                session.add(deployment)
                session.commit()
                
            await manager.broadcast(f"🎉 Deployment successful!")
            await manager.broadcast(f"🌐 Application is running at: {deployed_url}")
            await manager.broadcast(f"📍 VM: {vm_name}, Port: {port}")
            
            # Return the database ID as string, not the project_id string
            return (str(deployment_id), deployed_url)
        except Exception as e:
            error_msg = f"Failed to update deployment record: {str(e)}"
            await manager.broadcast(f"❌ {error_msg}")
            print(f"Database update error: {e}")
            import traceback
            traceback.print_exc()
            return None
        
    except Exception as e:
        error_msg = f"Deployment failed: {str(e)}"
        await manager.broadcast(f"❌ {error_msg}")
        print(f"Error in process deployment: {e}")
        import traceback
        error_trace = traceback.format_exc()
        print(error_trace)
        
        # Update deployment status to failed if we have a deployment_id
        if deployment_id:
            try:
                with Session(engine) as session:
                    deployment = session.get(Deployment, deployment_id)
                    if deployment:
                        deployment.status = "failed"
                        session.add(deployment)
                        session.commit()
                        print(f"Updated deployment {deployment_id} status to failed")
            except Exception as db_error:
                print(f"Failed to update deployment status in database: {db_error}")
                import traceback
                traceback.print_exc()
        else:
            print("Warning: deployment_id is None, cannot update deployment status")
        
        return None

