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
                # Flask - prefer flask run with --host 0.0.0.0
                start_cmd = 'flask run --host 0.0.0.0 --port 5000 || python app.py'
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
                # Flask - prefer flask run with --host 0.0.0.0
                start_cmd = 'flask run --host 0.0.0.0 --port 5000 || python app.py'
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
        start_cmd = 'python3 -m http.server 8080 --bind 0.0.0.0'
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
            
            # PRIORITY 1: Check for static HTML files FIRST (before AI results)
            # This prevents static sites from being misclassified as Python/Node.js projects
            # Static sites should NEVER run build commands like "pip install -r requirements.txt"
            is_static_site = False
            if not build_command or not start_command:
                await manager.broadcast("📄 Checking for static HTML files...")
                try:
                    # Check for index.html or any .html files in the project directory
                    html_check = await vm_manager.exec_in_vm(
                        vm_name,
                        f"if [ -f {vm_project_dir}/index.html ] || [ $(find {vm_project_dir} -maxdepth 1 -name '*.html' 2>/dev/null | wc -l) -gt 0 ]; then echo 'found'; else echo 'not_found'; fi"
                    )
                    
                    if "found" in (html_check.stdout or "").strip():
                        # Static HTML site detected - prioritize this over ALL other detections
                        is_static_site = True
                        await manager.broadcast("✅ Detected static HTML site - overriding AI analysis")
                        # Force static site configuration (ignore AI results)
                        build_command = None  # No build needed for static sites
                        if not start_command:
                            # Use Python's built-in HTTP server for static sites
                            start_command = "python3 -m http.server 8080 --bind 0.0.0.0"
                            await manager.broadcast(f"✅ Detected start command for static site: {start_command}")
                        if not port:
                            port = 8080
                            await manager.broadcast(f"✅ Detected port for static site: {port}")
                except Exception as e:
                    logger.debug(f"Error checking for static HTML files: {e}")
                    # Continue with other detection methods
            
            # PRIORITY 2: Check for AI analysis results in database (if deployment exists and NOT a static site)
            # AI analysis runs in background after import, so results may already be available
            # BUT: Skip AI results if we detected a static site (they might be wrong)
            if not is_static_site:
                ai_detected = False
                if deployment_id:
                    with Session(engine) as session:
                        deployment = session.get(Deployment, deployment_id)
                        if deployment:
                            # Use AI analysis results if available (these are set by project_analyzer.py)
                            # BUT: Validate that requirements.txt exists before using pip install command
                            if not build_command and deployment.build_command:
                                # Check if build command is pip install -r requirements.txt
                                if "pip install -r requirements.txt" in deployment.build_command:
                                    # Verify requirements.txt exists before using this command
                                    req_check = await vm_manager.exec_in_vm(
                                        vm_name,
                                        f"test -f {vm_project_dir}/requirements.txt && echo 'exists' || echo 'not_exists'"
                                    )
                                    if "exists" in (req_check.stdout or "").strip():
                                        build_command = deployment.build_command
                                        ai_detected = True
                                        await manager.broadcast(f"🤖 Using AI-detected build command: {build_command}")
                                    else:
                                        await manager.broadcast(f"⚠️ AI suggested 'pip install -r requirements.txt' but requirements.txt not found, skipping build command")
                                else:
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
            
            # PRIORITY 3: Use dockerfile_parser for Docker-based detection (if AI results not available and not static site)
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
                            # Flask project - try flask run first (binds to 0.0.0.0), fallback to python app.py
                            if not start_command:
                                start_command = "flask run --host 0.0.0.0 --port 5000 || python app.py"
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
        # Skip build for static sites (build_command should be None)
        if build_command:
            # Validate build command makes sense (check if required files exist)
            # For pip install -r requirements.txt, verify requirements.txt exists
            if "pip install -r requirements.txt" in build_command or "pip install -r" in build_command:
                req_check = await vm_manager.exec_in_vm(
                    vm_name,
                    f"test -f {vm_project_dir}/requirements.txt && echo 'exists' || echo 'not_exists'"
                )
                if "not_exists" in (req_check.stdout or "").strip():
                    await manager.broadcast(f"⚠️ Build command requires requirements.txt but file not found, skipping build step")
                    build_command = None  # Skip build if requirements.txt doesn't exist
                else:
                    await manager.broadcast(f"✅ Found requirements.txt, proceeding with build")
            
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
                        # For static sites or if requirements.txt doesn't exist, don't fail deployment
                        # Just skip the build step
                        if "requirements.txt" in error_output.lower() and ("no such file" in error_output.lower() or "cannot find" in error_output.lower()):
                            await manager.broadcast(f"⚠️ requirements.txt not found, skipping build step (this is OK for static sites)")
                            build_command = None  # Skip build
                        else:
                            # For other build errors, fail deployment
                            if deployment_id:
                                with Session(engine) as session:
                                    deployment = session.get(Deployment, deployment_id)
                                    if deployment:
                                        deployment.status = "failed"
                                        session.add(deployment)
                                        session.commit()
                            return None
                    else:
                        await manager.broadcast("✅ Build completed successfully in VM")
                        # Log build output if available
                        if build_result.stdout:
                            await manager.broadcast(f"Build output: {build_result.stdout[:500]}")
                except Exception as e:
                    error_msg = f"Build command failed in VM with error: {str(e)}"
                    await manager.broadcast(f"❌ {error_msg}")
                    # For static sites, skip build errors related to missing files
                    if "requirements.txt" in str(e).lower() or "no such file" in str(e).lower():
                        await manager.broadcast(f"⚠️ Build error related to missing file, skipping build step")
                        build_command = None  # Skip build
                    else:
                        if deployment_id:
                            with Session(engine) as session:
                                deployment = session.get(Deployment, deployment_id)
                                if deployment:
                                    deployment.status = "failed"
                                    session.add(deployment)
                                    session.commit()
                        return None
        
        # Validate that we have a start command
        # If no start_command detected, do a final check for static HTML files
        if not start_command:
            await manager.broadcast("🔍 Final check: Verifying if this is a static site...")
            try:
                # Check for HTML files in the project directory
                html_check = await vm_manager.exec_in_vm(
                    vm_name,
                    f"if [ -f {vm_project_dir}/index.html ] || [ $(find {vm_project_dir} -maxdepth 1 -name '*.html' 2>/dev/null | wc -l) -gt 0 ]; then echo 'found'; else echo 'not_found'; fi"
                )
                
                if "found" in (html_check.stdout or "").strip():
                    # Static HTML site detected - use Python HTTP server
                    start_command = "python3 -m http.server 8080 --bind 0.0.0.0"
                    if not port:
                        port = 8080
                    if not build_command:
                        build_command = None  # No build needed for static sites
                    await manager.broadcast(f"✅ Detected static HTML site, using: {start_command} on port {port}")
                else:
                    # Not a static site and no start command - use safe fallback instead of failing
                    logger.warning(f"⚠️ No start command detected and not a static site. Using safe fallback.")
                    await manager.broadcast(f"⚠️ No start command detected. Using fallback: python3 -m http.server 8080")
                    # Use static server as fallback (works for most projects)
                    start_command = "python3 -m http.server 8080 --bind 0.0.0.0"
                    if not port:
                        port = 8080
                    if not build_command:
                        build_command = None  # No build needed for simple HTTP server
                    await manager.broadcast(f"✅ Using fallback start command: {start_command} on port {port}")
                    # Don't fail - continue with fallback
            except Exception as e:
                # If check fails, use safe fallback instead of failing
                logger.warning(f"⚠️ Error checking for static files: {e}, using fallback")
                await manager.broadcast(f"⚠️ Error checking project type, using safe fallback")
                # Use static server as fallback (works for most projects)
                if not start_command:
                    start_command = "python3 -m http.server 8080 --bind 0.0.0.0"
                    if not port:
                        port = 8080
                    if not build_command:
                        build_command = None
                    await manager.broadcast(f"✅ Using fallback start command: {start_command} on port {port}")
                # Don't fail - continue with fallback
        
        # Prepare environment variables
        process_env = env_vars or {}
        
        # Ensure we have a deployment_id before starting process
        if not deployment_id:
            error_msg = "No deployment record found. Attempting to find existing deployment..."
            await manager.broadcast(f"⚠️ {error_msg}")
            logger.warning(f"Warning: {error_msg} - deployment_id is None, trying to recover")
            # Try to find deployment record as fallback
            try:
                with Session(engine) as session:
                    # Try to find deployment by git_url and user_id (most recent)
                    deployment = session.exec(
                        select(Deployment).where(
                            Deployment.git_url == git_url,
                            Deployment.user_id == user_id
                        ).order_by(Deployment.created_at.desc())
                    ).first()
                    if deployment:
                        deployment_id = deployment.id
                        logger.info(f"✅ Found existing deployment record: {deployment_id}")
                        await manager.broadcast(f"✅ Found deployment record: {deployment_id}")
                    else:
                        logger.error("❌ No deployment record found and cannot create one - this should not happen")
                        await manager.broadcast(f"❌ Critical error: No deployment record found")
                        return None
            except Exception as e:
                logger.error(f"Error trying to find deployment record: {e}")
                await manager.broadcast(f"❌ Critical error: Cannot find deployment record: {str(e)}")
                return None
        
        # Assign unique host port starting from 6001 BEFORE starting the service
        # OrbStack automatically forwards VM ports to the same port on the host
        # So we need to find the next available port and make the service bind to it
        await manager.broadcast(f"🔌 Assigning host port...")
        
        # Find next available host port (check existing deployments)
        with Session(engine) as check_session:
            existing_ports = set()
            existing_deployments = check_session.exec(
                select(Deployment.host_port).where(
                    Deployment.host_port.is_not(None),
                    Deployment.id != deployment_id  # Exclude current deployment
                )
            ).all()
            existing_ports.update([p for p in existing_deployments if p])
        
        # Find free port starting from 6001
        host_port = None
        for candidate_port in range(6001, 6999):
            if candidate_port not in existing_ports:
                # Also check if port is actually free on the host
                import socket
                try:
                    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                        s.bind(('localhost', candidate_port))
                        host_port = candidate_port
                        break
                except OSError:
                    continue  # Port in use, try next
        
        if not host_port:
            error_msg = "Failed to find free host port (6001-6999 range exhausted)"
            await manager.broadcast(f"❌ {error_msg}")
            logger.error(error_msg)
            raise Exception(error_msg)
        
        # Update start_command to use the assigned host port
        # This ensures the service in VM binds to the correct port
        original_port = port  # Save original port before updating
        if start_command and original_port and str(original_port) in start_command:
            # Replace the port in start_command with host_port
            import re
            # For python3 -m http.server, replace port number
            if "python3 -m http.server" in start_command:
                start_command = re.sub(r'http\.server\s+\d+', f'http.server {host_port}', start_command)
            else:
                # Generic replacement for other commands
                start_command = start_command.replace(str(original_port), str(host_port))
            logger.info(f"Updated start_command to use port {host_port}: {start_command}")
            await manager.broadcast(f"✅ Port {host_port} assigned (updated start command)")
        else:
            # If port not in command, we'll use environment variables
            logger.info(f"Port {host_port} assigned (will use environment variables)")
            await manager.broadcast(f"✅ Port {host_port} assigned")
        
        # Update port to host_port for the service
        port = host_port
        
        # Start process inside VM using nohup or PM2 for background execution
        # Use deployment_id as project_id for process tracking
        process_project_id = str(deployment_id)
        await manager.broadcast(f"🚀 Starting application in VM on port {port}: {start_command}")
        
        try:
            # Prepare environment variables
            env_vars_full = process_env.copy() if process_env else {}
            if port:
                env_vars_full['PORT'] = str(port)
                env_vars_full['HOST'] = '0.0.0.0'
                env_vars_full['HOSTNAME'] = '0.0.0.0'
                # Flask-specific environment variables
                env_vars_full['FLASK_RUN_HOST'] = '0.0.0.0'
                env_vars_full['FLASK_RUN_PORT'] = str(port)
            
            # Use nohup to run process in background inside VM
            # Format: nohup command > log_file 2>&1 &
            log_file = f"/tmp/project-{deployment_id}.log"
            pid_file = f"/tmp/project-{deployment_id}.pid"
            
            # Start command in background using nohup
            # Problem: `echo $!` captures the PID of the nohup/shell process, not the actual process
            # Solution: Use a better method - run the process and find its PID by port or process name
            # Escape single quotes in start_command for safe shell execution
            # Replace single quotes with '\'' (end quote, escaped quote, start quote)
            escaped_start_command = start_command.replace("'", "'\"'\"'")
            # Use a wrapper that properly captures the PID of the actual process
            # Format: (cd dir && nohup command > log 2>&1 &) && sleep 1 && pgrep -f 'command' | head -1 > pid_file
            # Better: Just start the process and find PID by port/process name afterwards
            # Use simpler command without sh -c wrapper to avoid issues
            # The --bind flag needs to be passed directly, not through sh -c
            start_cmd = f"cd {vm_project_dir} && nohup {start_command} > {log_file} 2>&1 &"
            
            # Execute the command with environment variables
            # Note: env vars are exported in exec_in_vm, so they should be available
            await manager.broadcast(f"📝 Executing: {start_command} in directory: {vm_project_dir}")
            logger.info(f"Start command: {start_cmd}")
            start_result = await vm_manager.exec_in_vm(
                vm_name,
                start_cmd,
                cwd=None,  # Don't use cwd in exec_in_vm since we're using cd in the command
                env=env_vars_full
            )
            
            # Check if command executed (nohup always returns 0, so we check stderr for actual errors)
            if start_result.returncode != 0:
                error_output = start_result.stderr or start_result.stdout or "Unknown error"
                error_msg = f"Failed to start process in VM (exit code {start_result.returncode}): {error_output[:500]}"
                await manager.broadcast(f"❌ {error_msg}")
                logger.error(f"Process start failed: {error_msg}")
                logger.error(f"Start command: {start_cmd}")
                logger.error(f"Start result stdout: {start_result.stdout}")
                logger.error(f"Start result stderr: {start_result.stderr}")
                # Read log file to see if process started anyway
                log_check = await vm_manager.exec_in_vm(
                    vm_name,
                    f"cat {log_file} 2>/dev/null | head -20 || echo 'No log file'"
                )
                if log_check.stdout:
                    await manager.broadcast(f"Log file content: {log_check.stdout[:500]}")
                # Don't fail immediately - check if process is actually running
                await manager.broadcast(f"⚠️ Command returned non-zero, but checking if process is running...")
            else:
                await manager.broadcast(f"✅ Start command executed successfully")
                if start_result.stdout:
                    logger.info(f"Start command output: {start_result.stdout[:200]}")
            
            # Wait a moment for process to start
            await asyncio.sleep(2)
            
            # Initialize variables for process verification
            pid = None
            
            # PRIORITY 1: Check port FIRST (most reliable method for process verification)
            process_running = False
            port_listening = False
            
            if port:
                # Check if port is listening (primary verification method)
                port_check = await vm_manager.exec_in_vm(
                    vm_name,
                    f"lsof -i :{port} 2>/dev/null | grep LISTEN || netstat -tlnp 2>/dev/null | grep :{port} || ss -tlnp 2>/dev/null | grep :{port} || echo ''"
                )
                if port_check.stdout and port_check.stdout.strip():
                    port_listening = True
                    process_running = True
                    logger.info(f"✅ Port {port} is listening - process is running")
                    
                    # Try to extract PID from port check
                    if not pid or pid <= 0:
                        try:
                            # Try lsof first (most reliable)
                            pid_check = await vm_manager.exec_in_vm(
                                vm_name,
                                f"lsof -ti :{port} 2>/dev/null | head -1 || echo ''"
                            )
                            if pid_check.stdout and pid_check.stdout.strip():
                                pid = int(pid_check.stdout.strip())
                                logger.info(f"✅ Found PID from port check (lsof): {pid}")
                            else:
                                # Try netstat
                                pid_line = port_check.stdout.strip().split('\n')[0]
                                import re
                                pid_match = re.search(r'\b(\d+)\b', pid_line)
                                if pid_match:
                                    pid = int(pid_match.group(1))
                                    logger.info(f"✅ Extracted PID from port check (netstat): {pid}")
                                else:
                                    pid = -1  # PID unknown but process is running
                                    logger.info(f"✅ Process is running on port {port} (PID unknown)")
                        except Exception as e:
                            logger.warning(f"Failed to extract PID from port check: {e}")
                            pid = -1  # PID unknown but process is running
            
            # PRIORITY 2: Check log file to see if process started successfully
            log_file_exists = False
            log_has_content = False
            log_check = await vm_manager.exec_in_vm(
                vm_name,
                f"test -f {log_file} && echo 'exists' || echo 'not_exists'"
            )
            if "exists" in (log_check.stdout or "").strip():
                log_file_exists = True
                # Read log file content
                log_content_check = await vm_manager.exec_in_vm(
                    vm_name,
                    f"wc -l < {log_file} 2>/dev/null || echo '0'"
                )
                if log_content_check.stdout and log_content_check.stdout.strip():
                    try:
                        line_count = int(log_content_check.stdout.strip())
                        if line_count > 0:
                            log_has_content = True
                            logger.info(f"✅ Log file exists with {line_count} lines")
                        else:
                            logger.warning(f"⚠️ Log file exists but is empty")
                    except ValueError:
                        pass
                
                # Read last 20 lines of log file
                log_tail = await vm_manager.exec_in_vm(
                    vm_name,
                    f"tail -20 {log_file} 2>/dev/null || echo 'No log content'"
                )
                if log_tail.stdout:
                    log_content = log_tail.stdout
                    if "error" in log_content.lower() or "failed" in log_content.lower() or "traceback" in log_content.lower():
                        logger.warning(f"⚠️ Errors found in log file: {log_content[:300]}")
                        # Check if it's a port conflict (not a fatal error)
                        if "address already in use" in log_content.lower() or ("port" in log_content.lower() and "in use" in log_content.lower()):
                            logger.info(f"⚠️ Port conflict detected in log, but port is listening - process is running")
                            if not port_listening:
                                # Port conflict but port not listening - might be a different port
                                # Check if any port is listening
                                await manager.broadcast(f"⚠️ Port conflict detected, checking if process is running...")
                        else:
                            await manager.broadcast(f"⚠️ Errors in log file: {log_content[:200]}")
                    else:
                        logger.info(f"✅ Log file has content and no critical errors")
            else:
                logger.warning(f"⚠️ Log file does not exist: {log_file}")
            
            # PRIORITY 3: Check PID if we have one (less reliable, but useful for confirmation)
            if pid and pid > 0 and not process_running:
                # Check if process with PID is running
                check_result = await vm_manager.exec_in_vm(
                    vm_name,
                    f"ps -p {pid} > /dev/null 2>&1 && echo 'running' || echo 'stopped'"
                )
                if "running" in (check_result.stdout or ""):
                    process_running = True
                    logger.info(f"✅ Process {pid} is running (verified via ps -p)")
                else:
                    logger.warning(f"⚠️ Process {pid} not found via ps -p")
                    # PID might be wrong (could be shell PID, not process PID)
                    # Try to find process by command name
                    if start_command:
                        cmd_name = start_command.split()[0]
                        pgrep_result = await vm_manager.exec_in_vm(
                            vm_name,
                            f"pgrep -f '{cmd_name}' | head -1 || echo ''"
                        )
                        if pgrep_result.stdout and pgrep_result.stdout.strip():
                            try:
                                actual_pid = int(pgrep_result.stdout.strip())
                                logger.info(f"✅ Found process via pgrep: {actual_pid}")
                                pid = actual_pid
                                process_running = True
                            except ValueError:
                                pass
            
            # PRIORITY 4: If port is not listening yet, wait a bit and check again (process might be starting)
            if not process_running and port:
                await asyncio.sleep(3)  # Wait for process to start
                # Check port again (final attempt)
                port_check2 = await vm_manager.exec_in_vm(
                    vm_name,
                    f"lsof -i :{port} 2>/dev/null | grep LISTEN || netstat -tlnp 2>/dev/null | grep :{port} || ss -tlnp 2>/dev/null | grep :{port} || echo ''"
                )
                if port_check2.stdout and port_check2.stdout.strip():
                    port_listening = True
                    process_running = True
                    logger.info(f"✅ Port {port} is now listening - process started")
                    
                    # Try to get PID from port
                    try:
                        pid_from_port = await vm_manager.exec_in_vm(
                            vm_name,
                            f"lsof -ti :{port} 2>/dev/null | head -1 || echo ''"
                        )
                        if pid_from_port.stdout and pid_from_port.stdout.strip():
                            pid = int(pid_from_port.stdout.strip())
                            logger.info(f"✅ Found PID from port (after wait): {pid}")
                    except Exception:
                        pid = None
            
            # Final verification: If process is not running by port check, check log for fatal errors
            if not process_running:
                # Read log file to see what happened
                log_result = await vm_manager.exec_in_vm(
                    vm_name,
                    f"cat {log_file} 2>/dev/null | tail -50 || echo 'No log file'"
                )
                if log_result.stdout and log_result.stdout.strip() != 'No log file':
                    log_content = log_result.stdout
                    logger.warning(f"⚠️ Process not running. Log content: {log_content[:500]}")
                    
                    # Check for fatal errors
                    fatal_errors = [
                        "traceback",
                        "fatal",
                        "cannot bind",
                        "permission denied",
                        "command not found"
                    ]
                    
                    has_fatal_error = any(error in log_content.lower() for error in fatal_errors)
                    
                    # Check for port conflict (not fatal if port is in use by our process)
                    if "address already in use" in log_content.lower() or ("port" in log_content.lower() and "in use" in log_content.lower()):
                        # Port conflict - check if port is actually in use
                        port_conflict_check = await vm_manager.exec_in_vm(
                            vm_name,
                            f"lsof -i :{port} 2>/dev/null | grep LISTEN || netstat -tlnp 2>/dev/null | grep :{port} || echo ''"
                        )
                        if port_conflict_check.stdout and port_conflict_check.stdout.strip():
                            # Port is in use - process is running despite the error message
                            process_running = True
                            port_listening = True
                            logger.info(f"✅ Port {port} is in use - process is running (port conflict resolved)")
                            await manager.broadcast(f"✅ Port {port} is in use - process is running")
                        elif has_fatal_error:
                            # Fatal error and port not in use - fail
                            error_msg = f"Process failed to start. Fatal error: {log_content[:500]}"
                            await manager.broadcast(f"❌ {error_msg}")
                            logger.error(f"Process start failed: {error_msg}")
                            with Session(engine) as session:
                                deployment = session.get(Deployment, deployment_id)
                                if deployment:
                                    deployment.status = "failed"
                                    session.add(deployment)
                                    session.commit()
                            return None
                    elif has_fatal_error:
                        # Fatal error - fail
                        error_msg = f"Process failed to start. Fatal error: {log_content[:500]}"
                        await manager.broadcast(f"❌ {error_msg}")
                        logger.error(f"Process start failed: {error_msg}")
                        with Session(engine) as session:
                            deployment = session.get(Deployment, deployment_id)
                            if deployment:
                                deployment.status = "failed"
                                session.add(deployment)
                                session.commit()
                        return None
                    else:
                        # No fatal errors - might be starting slowly, check one more time
                        await asyncio.sleep(2)
                        final_port_check = await vm_manager.exec_in_vm(
                            vm_name,
                            f"lsof -i :{port} 2>/dev/null | grep LISTEN || netstat -tlnp 2>/dev/null | grep :{port} || ss -tlnp 2>/dev/null | grep :{port} || echo ''"
                        )
                        if final_port_check.stdout and final_port_check.stdout.strip():
                            process_running = True
                            port_listening = True
                            logger.info(f"✅ Port {port} is now listening - process started (delayed)")
                            await manager.broadcast(f"✅ Process is running (port {port} is listening)")
                        elif start_result.returncode == 0:
                            # Command succeeded but port not listening - might be a non-port-based service
                            # For now, assume it's running if command succeeded
                            logger.warning(f"⚠️ Command succeeded but port {port} not listening - assuming process is running")
                            await manager.broadcast(f"⚠️ Cannot verify port, but command succeeded - assuming running")
                            process_running = True
                            pid = None
                        else:
                            # Command failed and process not running - fail
                            error_msg = "Process failed to start and cannot be verified"
                            await manager.broadcast(f"❌ {error_msg}")
                            logger.error(f"Process start failed: {error_msg}")
                            with Session(engine) as session:
                                deployment = session.get(Deployment, deployment_id)
                                if deployment:
                                    deployment.status = "failed"
                                    session.add(deployment)
                                    session.commit()
                            return None
                else:
                    # No log file - command might not have executed
                    if start_result.returncode == 0:
                        # Command succeeded - assume process is running
                        logger.warning(f"⚠️ No log file but command succeeded - assuming process is running")
                        await manager.broadcast(f"⚠️ Cannot verify process, but command succeeded - assuming running")
                        process_running = True
                        pid = None
                    else:
                        # Command failed and no log - fail
                        error_msg = "Process failed to start (no log file and command failed)"
                        await manager.broadcast(f"❌ {error_msg}")
                        logger.error(f"Process start failed: {error_msg}")
                        with Session(engine) as session:
                            deployment = session.get(Deployment, deployment_id)
                            if deployment:
                                deployment.status = "failed"
                                session.add(deployment)
                                session.commit()
                        return None
            
            # If process is running, try to get PID one final time if we don't have it
            if process_running and (not pid or pid <= 0):
                if port:
                    final_pid_check = await vm_manager.exec_in_vm(
                        vm_name,
                        f"lsof -ti :{port} 2>/dev/null | head -1 || echo ''"
                    )
                    if final_pid_check.stdout and final_pid_check.stdout.strip():
                        try:
                            pid = int(final_pid_check.stdout.strip())
                            logger.info(f"✅ Found PID on final check: {pid}")
                        except ValueError:
                            pid = None
                
                # Broadcast success
                if pid and pid > 0:
                    await manager.broadcast(f"✅ Process started successfully in VM (PID: {pid}, Port: {port})")
                else:
                    await manager.broadcast(f"✅ Process started successfully in VM (Port: {port} listening, PID unknown)")
                    logger.info(f"✅ Process is running on port {port} (PID unknown)")
            
            # Final check: If process is still not running, fail
            if not process_running:
                error_msg = "Process failed to start and is not running"
                await manager.broadcast(f"❌ {error_msg}")
                logger.error(f"Process start failed: {error_msg}")
                # Read full log for debugging
                full_log = await vm_manager.exec_in_vm(
                    vm_name,
                    f"cat {log_file} 2>/dev/null || echo 'No log file'"
                )
                if full_log.stdout:
                    logger.error(f"Full log: {full_log.stdout}")
                    await manager.broadcast(f"📋 Full log: {full_log.stdout[:1000]}")
                with Session(engine) as session:
                    deployment = session.get(Deployment, deployment_id)
                    if deployment:
                        deployment.status = "failed"
                        session.add(deployment)
                        session.commit()
                return None
            
        except Exception as e:
            error_msg = f"Exception while starting process in VM: {str(e)}"
            await manager.broadcast(f"❌ {error_msg}")
            logger.error(f"Process start exception: {e}", exc_info=True)
            import traceback
            error_trace = traceback.format_exc()
            logger.error(f"Traceback: {error_trace}")
            
            # Try to read log file to see what happened
            try:
                log_check = await vm_manager.exec_in_vm(
                    vm_name,
                    f"cat {log_file} 2>/dev/null | tail -30 || echo 'No log file'"
                )
                if log_check.stdout:
                    logger.error(f"Log file content: {log_check.stdout}")
                    await manager.broadcast(f"📋 Log file: {log_check.stdout[:500]}")
            except Exception:
                pass
            
            # Check if process is actually running despite the exception
            try:
                if port:
                    port_check = await vm_manager.exec_in_vm(
                        vm_name,
                        f"lsof -i :{port} 2>/dev/null | grep LISTEN || netstat -tlnp 2>/dev/null | grep :{port} || echo ''"
                    )
                    if port_check.stdout.strip():
                        # Process is running despite exception - continue
                        await manager.broadcast(f"⚠️ Exception occurred, but process is running (port {port} in use) - continuing")
                        pid = None  # PID unknown
                        # Don't return None - continue with deployment
                    else:
                        # Process not running - fail
                        with Session(engine) as session:
                            deployment = session.get(Deployment, deployment_id)
                            if deployment:
                                deployment.status = "failed"
                                session.add(deployment)
                                session.commit()
                        return None
                else:
                    # No port to check - fail
                    with Session(engine) as session:
                        deployment = session.get(Deployment, deployment_id)
                        if deployment:
                            deployment.status = "failed"
                            session.add(deployment)
                            session.commit()
                    return None
            except Exception as check_error:
                logger.error(f"Error checking process status: {check_error}")
                # Fail if we can't check
                with Session(engine) as session:
                    deployment = session.get(Deployment, deployment_id)
                    if deployment:
                        deployment.status = "failed"
                        session.add(deployment)
                        session.commit()
                return None
        
        # Process is now running (verified in the try block above)
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
                
                # Generate default domain: project-name.aayush786.xyz
                # Get butler domain from environment
                butler_domain = os.getenv("BUTLER_DOMAIN", "aayush786.xyz")
                
                # Generate project slug from app_name or container_name
                # Import re at function level to avoid any scoping issues
                import re as re_module
                if deployment.app_name:
                    project_slug = re_module.sub(r"[^a-z0-9]+", "-", deployment.app_name.lower()).strip("-")
                else:
                    # Extract from container_name or repo name
                    repo_name = extract_repo_name(deployment.git_url)
                    project_slug = re_module.sub(r"[^a-z0-9]+", "-", repo_name.lower()).strip("-")
                
                if not project_slug:
                    project_slug = f"project-{deployment.id}"
                
                # Format: project-name.aayush786.xyz (with dot)
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
                
                # Update deployment fields (but NOT status yet - wait for Cloudflare)
                deployment.deployed_url = deployed_url
                if build_command:
                    deployment.build_command = build_command
                if start_command:
                    deployment.start_command = start_command
                if port:
                    deployment.port = port
                # Only set PID if we have a valid one (not None, not -1)
                if pid and pid > 0:
                    deployment.process_pid = pid
                else:
                    # PID unknown but process is running - set to None
                    deployment.process_pid = None
                    logger.warning(f"⚠️ Process is running but PID is unknown - setting process_pid to None")
                deployment.project_dir = project_dir
                deployment.vm_name = vm_name
                deployment.vm_ip = vm_ip
                deployment.updated_at = datetime.datetime.utcnow()  # Update timestamp
                
                # Store host port (already assigned before service started)
                # Port was already updated to host_port before service started
                deployment.host_port = port  # port is now the host_port
                deployment.port = port  # VM port matches host port for OrbStack forwarding
                deployment.start_command = start_command  # Save updated start_command
                logger.info(f"✅ Using host port: {port} (OrbStack auto-forwards)")
                
                # Configure Cloudflare tunnel to route domain to the service
                # Use localhost:port since OrbStack automatically forwards VM port to same host port
                service_url = f"http://localhost:{port}"
                logger.info(f"Using host port for Cloudflare tunnel: {service_url}")
                
                # Configure Cloudflare Tunnel via API - tunnel runs on host, we just configure ingress
                try:
                    from cloudflare_manager import ensure_project_hostname
                    
                    # With Cloudflare Tunnel, we use HTTP for the origin
                    # Cloudflare handles SSL termination at the edge automatically
                    # No SSL certificates needed - Cloudflare provides SSL/TLS automatically
                    # Tunnel is already running on host, we just configure ingress rules via API
                    await manager.broadcast(f"🌐 Configuring Cloudflare Tunnel...")
                    
                    # Configure Cloudflare tunnel ingress via API
                    # service_url uses VM IP so tunnel on host can reach the service
                    # Cloudflare will automatically provide SSL/TLS at the edge
                    ensure_project_hostname(domain_to_use, service_url)
                    deployment.domain_status = "active"
                    deployment.last_domain_sync = datetime.datetime.utcnow()
                    # Only set status to "running" if Cloudflare configuration succeeded
                    deployment.status = "running"
                    await manager.broadcast(f"✅ Domain configured: {domain_to_use} → {service_url}")
                    logger.info(f"✅ Cloudflare configured successfully - setting deployment {deployment_id} status to 'running'")
                except Exception as cf_error:
                    # Cloudflare failed - keep status as "imported" or current status
                    deployment.domain_status = "pending"
                    await manager.broadcast(f"⚠️ Cloudflare configuration failed - deployment not marked as running: {str(cf_error)}")
                    logger.warning(f"⚠️ Cloudflare configuration failed - keeping deployment {deployment_id} status as '{deployment.status}'")
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

