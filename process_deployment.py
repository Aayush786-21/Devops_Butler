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

def log_step(deployment_id: int, step: str, message: str, level: str = "INFO") -> None:
    """
    Structured per-deployment logging helper.
    """
    log_fn = getattr(logger, level.lower(), logger.info)
    log_fn(f"[DEPLOY {deployment_id}] [{step}] {message}")

from utils import (
    validate_git_url,
    extract_repo_name
)
from connection_manager import manager
from process_manager import process_manager as pm
from database import engine
from login import Deployment
from sqlmodel import Session, select
from sqlalchemy import func
import logging
from utils import set_status, DeploymentError
from vm_manager import VMError, safe_exec
from cloudflare_manager import CloudflareError, safe_configure_domain
# dockerfile_parser removed - Docker files are now handled by docker_deployment.py


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
    
    # Docker files are now handled by docker_deployment.py
    # Skip Docker file parsing here - they will be detected and handled in the main deployment flow
    
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
    Includes retry logic: if first attempt fails, AI re-analyzes and retries.
    
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
    max_retries = 2  # Try up to 2 times (initial attempt + 1 retry)
    
    for attempt in range(max_retries):
        try:
            if attempt > 0:
                await manager.broadcast(f"🔄 Retry attempt {attempt + 1}/{max_retries} - AI re-analyzing project...")
                # On retry, clear previous commands to force re-analysis
                build_command = None
                start_command = None
                port = None
            
            result = await _run_deployment_attempt(
                git_url=git_url,
                user_id=user_id,
                build_command=build_command,
                start_command=start_command,
                port=port,
                env_vars=env_vars,
                existing_deployment_id=existing_deployment_id,
                parent_project_id=parent_project_id,
                component_type=component_type,
                root_directory=root_directory,
                project_name=project_name,
                is_retry=(attempt > 0)
            )
            
            if result:
                return result
            else:
                if attempt < max_retries - 1:
                    await manager.broadcast(f"⚠️ Deployment attempt {attempt + 1} failed, retrying with AI re-analysis...")
                    await asyncio.sleep(2)  # Brief pause before retry
                    continue
                else:
                    await manager.broadcast(f"❌ All {max_retries} deployment attempts failed")
                    return None
                    
        except DeploymentError as e:
            if attempt < max_retries - 1:
                await manager.broadcast(f"⚠️ Deployment failed: {str(e)}")
                await manager.broadcast(f"🔄 Retrying with AI re-analysis...")
                await asyncio.sleep(2)
                continue
            else:
                await manager.broadcast(f"❌ Deployment failed after {max_retries} attempts: {str(e)}")
                return None
        except Exception as e:
            # Non-retryable errors (validation, etc.)
            await manager.broadcast(f"❌ Deployment error: {str(e)}")
            return None
    
    return None


async def _run_deployment_attempt(
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
    project_name: Optional[str] = None,
    is_retry: bool = False
) -> Optional[Tuple[str, str]]:
    """
    Internal deployment attempt function (called by run_process_deployment with retry logic)
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
                            set_status(deployment, "failed")
                            session.add(deployment)
                            session.commit()
                return None
            
            await manager.broadcast("✅ Repository cloned successfully in VM")
        
        # PRIORITY 0: AI ANALYSIS FIRST - Let AI understand the project by reading files
        # AI will check for Dockerfile, docker-compose.yml, and read all relevant files
        # This gives us intelligent deployment decisions based on actual project structure
        ai_analysis_result = None
        if is_retry:
            await manager.broadcast("🤖 AI is re-analyzing project - reading Dockerfile, docker-compose.yml, package.json, requirements.txt, and other files...")
        else:
            await manager.broadcast("🤖 AI is analyzing project structure - reading Dockerfile, docker-compose.yml, package.json, requirements.txt, and other files...")
        try:
            from project_analyzer import analyze_project_with_ai, analyze_project_simple
            # Check if AI is available
            try:
                import google.generativeai as genai  # type: ignore
                AI_AVAILABLE = True
            except ImportError:
                AI_AVAILABLE = False
            
            # Try AI analysis first (if available)
            if AI_AVAILABLE:
                try:
                    ai_analysis_result = await analyze_project_with_ai(
                        vm_name, vm_project_dir, vm_manager, manager
                    )
                    if ai_analysis_result and ai_analysis_result.get("start_command"):
                        await manager.broadcast(f"✅ AI analysis complete: {ai_analysis_result.get('framework', 'Unknown')} project detected")
                except Exception as ai_error:
                    logger.warning(f"AI analysis failed: {ai_error}, falling back to simple analysis")
                    ai_analysis_result = None
            
            # Fallback to simple analysis if AI not available or failed
            if not ai_analysis_result:
                ai_analysis_result = await analyze_project_simple(
                    vm_name, vm_project_dir, vm_manager, manager
                )
                if ai_analysis_result and ai_analysis_result.get("start_command"):
                    await manager.broadcast(f"✅ Project analysis complete: {ai_analysis_result.get('framework', 'Unknown')} project detected")
            
            # Use AI analysis results if available and user hasn't provided commands
            if ai_analysis_result:
                if not build_command and ai_analysis_result.get("build_command"):
                    build_command = ai_analysis_result["build_command"]
                    await manager.broadcast(f"🤖 Using AI-detected build command: {build_command}")
                
                if not start_command and ai_analysis_result.get("start_command"):
                    start_command = ai_analysis_result["start_command"]
                    await manager.broadcast(f"🤖 Using AI-detected start command: {start_command}")
                
                if not port and ai_analysis_result.get("port"):
                    port = ai_analysis_result["port"]
                    await manager.broadcast(f"🤖 Using AI-detected port: {port}")
                
                # Check if AI detected Docker - BUT VERIFY FILES ACTUALLY EXIST
                is_docker = ai_analysis_result.get("is_docker", False) or "docker" in (ai_analysis_result.get("framework", "") or "").lower()
                deployment_type = ai_analysis_result.get("deployment_type", "")
                
                # CRITICAL: Always verify Docker files actually exist before using Docker deployment
                # Don't trust AI - verify the files are really there!
                if is_docker:
                    await manager.broadcast("🔍 Verifying Docker files actually exist...")
                    docker_compose_check = await vm_manager.exec_in_vm(
                        vm_name,
                        f"test -f {vm_project_dir}/docker-compose.yml -o -f {vm_project_dir}/docker-compose.yaml && echo 'exists' || echo 'not_exists'"
                    )
                    dockerfile_check = await vm_manager.exec_in_vm(
                        vm_name,
                        f"test -f {vm_project_dir}/Dockerfile && echo 'exists' || echo 'not_exists'"
                    )
                    
                    docker_compose_exists = "exists" in (docker_compose_check.stdout or "").strip()
                    dockerfile_exists = "exists" in (dockerfile_check.stdout or "").strip()
                    
                    if not docker_compose_exists and not dockerfile_exists:
                        # AI was wrong - no Docker files exist!
                        await manager.broadcast("⚠️ AI suggested Docker but no Docker files found - ignoring Docker suggestion")
                        logger.warning(f"AI incorrectly detected Docker for project without Docker files")
                        # Clear Docker detection to use other deployment methods
                        is_docker = False
                        if start_command and ("docker" in start_command.lower()):
                            start_command = None  # Clear incorrect Docker command
                            await manager.broadcast("🔄 Clearing incorrect Docker command, will detect proper deployment method")
                    else:
                        # Docker files DO exist - proceed with Docker deployment
                        # Check if Docker is available
                        docker_available = False
                        try:
                            docker_check = await vm_manager.exec_in_vm(vm_name, "which docker")
                            docker_available = docker_check.returncode == 0 and docker_check.stdout.strip()
                        except:
                            pass
                        
                        if docker_available and (docker_compose_exists or dockerfile_exists):
                            await manager.broadcast("🐳 AI detected Docker configuration - using Docker deployment...")
                            try:
                                from docker_deployment import deploy_with_docker
                                docker_result = await deploy_with_docker(
                                    git_url, vm_name, vm_project_dir, deployment_id, user_id, env_vars
                                )
                                if docker_result:
                                    service_url, status = docker_result
                                    # Update deployment with service URL
                                    with Session(engine) as session:
                                        deployment = session.get(Deployment, deployment_id)
                                        if deployment:
                                            deployment.deployed_url = service_url
                                            set_status(deployment, status)
                                            session.add(deployment)
                                            session.commit()
                                    return docker_result
                                else:
                                    await manager.broadcast("⚠️ Docker deployment failed, falling back to process-based deployment")
                            except Exception as docker_error:
                                logger.warning(f"Docker deployment failed: {docker_error}, falling back to process-based")
                                await manager.broadcast(f"⚠️ Docker deployment error: {str(docker_error)}, using process-based deployment")
        except Exception as analysis_error:
            logger.warning(f"Project analysis failed: {analysis_error}, continuing with manual detection")
            await manager.broadcast(f"⚠️ Analysis error: {str(analysis_error)}, using fallback detection")
        
        # Auto-detect build and start commands if not provided (fallback if AI didn't provide)
        # Priority: 1. User-provided, 2. AI analysis (already done), 3. File-based detection
        if not build_command or not start_command or not port:
            await manager.broadcast("🔍 Auto-detecting build and start commands...")
            
            # AI analysis already done at PRIORITY 0, skip if already got results
            
            # PRIORITY 2: Check for AI analysis results in database (if deployment exists)
            # AI analysis runs in background after import, so results may already be available
            # Only use if we didn't get fresh AI analysis results above
            if not ai_analysis_result:
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
            
            # Docker files are now handled by docker_deployment.py at PRIORITY 0
            # Skip Docker file parsing here - they are detected and deployed using Docker directly
            
            # PRIORITY 3: Check for package.json (Node.js) - detailed detection
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
                                        set_status(deployment, "failed")
                                        session.add(deployment)
                                        session.commit()
                            return None
                    else:
                        await manager.broadcast("✅ Build completed successfully in VM")
                        # Log build output if available
                        if build_result.stdout:
                            await manager.broadcast(f"Build output: {build_result.stdout[:500]}")
                        
                        # POST-BUILD VERIFICATION: Intelligently adjust start command based on what was actually built
                        # This fixes issues where React apps need to serve from build/ or dist/ folders
                        await manager.broadcast("🔍 Verifying build output and adjusting start command...")
                        try:
                            # Check what build output folders exist after build
                            build_output_check = await vm_manager.exec_in_vm(
                                vm_name,
                                f"cd {vm_project_dir} && "
                                f"if [ -d build ] && [ -f build/index.html ]; then echo 'build'; "
                                f"elif [ -d dist ] && [ -f dist/index.html ]; then echo 'dist'; "
                                f"elif [ -d out ] && [ -f out/index.html ]; then echo 'out'; "
                                f"elif [ -d .next ]; then echo 'next'; "
                                f"else echo 'none'; fi"
                            )
                            build_output = (build_output_check.stdout or "").strip()
                            
                            # Check if this is a React/static frontend build that needs to be served from a folder
                            # Read package.json to understand the project structure
                            package_json_check = await vm_manager.exec_in_vm(
                                vm_name,
                                f"cat {vm_project_dir}/package.json 2>/dev/null"
                            )
                            is_react_app = False
                            is_vite = False
                            if package_json_check.returncode == 0 and package_json_check.stdout:
                                try:
                                    package_data = json.loads(package_json_check.stdout)
                                    deps = package_data.get('dependencies', {})
                                    dev_deps = package_data.get('devDependencies', {})
                                    all_deps = {**deps, **dev_deps}
                                    
                                    # Check for React
                                    is_react = any('react' in str(k).lower() for k in all_deps.keys())
                                    # Check for Vite
                                    is_vite = any('vite' in str(k).lower() for k in all_deps.keys())
                                    # Check for Next.js
                                    is_next = any('next' in str(k).lower() for k in all_deps.keys())
                                    
                                    # Determine if this is a frontend build
                                    is_react_app = is_react and not is_next
                                    
                                    logger.info(f"Post-build check: react={is_react}, vite={is_vite}, next={is_next}, build_output={build_output}")
                                except:
                                    pass
                            
                            # If React app and build output exists, serve from that folder
                            if is_react_app and build_output in ['build', 'dist', 'out']:
                                # ALWAYS serve from build output folder for React apps
                                original_start = start_command or ""
                                new_port = port or 3000
                                
                                # Extract port from original command if present
                                port_match = re.search(r'\b(\d{4})\b', original_start)
                                if port_match:
                                    new_port = int(port_match.group(1))
                                
                                # Force serve from build directory
                                new_start = f"python3 -m http.server {new_port} --bind 0.0.0.0 --directory {build_output}"
                                start_command = new_start
                                await manager.broadcast(f"🔄 React app detected: Serving from {build_output}/ folder (NOT root directory)")
                                await manager.broadcast(f"✅ Start command: {new_start}")
                                logger.info(f"Post-build adjustment: React app, serving from {build_output}, changed from '{original_start}' to '{new_start}'")
                            
                            # If build output exists but no start command, serve from that folder
                            elif build_output in ['build', 'dist', 'out'] and not start_command:
                                new_port = port or 3000
                                start_command = f"python3 -m http.server {new_port} --bind 0.0.0.0 --directory {build_output}"
                                await manager.broadcast(f"✅ Detected build output in {build_output}/ folder, serving from there")
                                logger.info(f"Post-build detection: Found {build_output} folder, using it for start command")
                            
                        except Exception as post_build_error:
                            logger.warning(f"Error in post-build verification: {post_build_error}")
                            # Don't fail deployment if post-build check fails, continue with original start command
                            pass
                            
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
                                    set_status(deployment, "failed")
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
        
        # Find next available host port (check globally across all users and VMs)
        # IMPORTANT: Ports are forwarded from VMs to Mac host (localhost:port)
        # Since all VMs forward to the same Mac host, ports must be unique globally
        # Example: User 1's VM port 6001 → Mac localhost:6001
        #          User 2's VM port 6002 → Mac localhost:6002 (6001 already taken)
        # This prevents port collisions on the Mac host across all users/VMs
        with Session(engine) as check_session:
            existing_ports = set()
            # Check ALL deployments across ALL users and ALL VMs (no user_id filter)
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
                # Also verify port is actually free on the Mac host machine
                # This double-checks in case something else is using the port
                import socket
                try:
                    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                        s.bind(('localhost', candidate_port))
                        host_port = candidate_port
                        break
                except OSError:
                    continue  # Port in use on host, try next
        
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
            # Handle both formats: "http.server 3000" and "http.server 3000 --bind"
            if "python3 -m http.server" in start_command:
                # Replace port number in http.server command (handles --directory and --bind flags)
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
        
        # CRITICAL: Stop the SPECIFIC project's existing process before starting a new one
        # IMPORTANT: Only stop THIS project's process, NOT other projects
        # This ensures clean redeployment without affecting other running projects
        await manager.broadcast(f"🛑 Stopping existing process for this project...")
        old_port = None
        old_pid = None
        
        try:
            # Get the existing deployment record to find its OLD port and PID
            if deployment_id:
                with Session(engine) as session:
                    existing_deployment = session.get(Deployment, deployment_id)
                    if existing_deployment:
                        # Get the OLD port (from existing deployment, not the new one)
                        old_port = existing_deployment.host_port or existing_deployment.port
                        old_pid = existing_deployment.process_pid
                        
                        if old_port or old_pid:
                            await manager.broadcast(f"📋 Found existing deployment: port={old_port}, pid={old_pid}")
                        
                        # Method 1: Stop process by PID (specific to this deployment)
                        if old_pid:
                            try:
                                kill_result = await vm_manager.exec_in_vm(
                                    vm_name,
                                    f"kill -9 {old_pid} 2>/dev/null || true"
                                )
                                logger.info(f"Stopped process {old_pid} for deployment {deployment_id}")
                                await manager.broadcast(f"✅ Stopped process {old_pid}")
                            except Exception as e:
                                logger.warning(f"Error killing process by PID {old_pid}: {e}")
                        
                        # Method 2: Kill process using the OLD port (specific to this deployment)
                        # CRITICAL: Use OLD port, not the new port (new port might be used by another project!)
                        # If port is the same, we still need to kill the old process on that port
                        if old_port:
                            try:
                                # Kill any process using the OLD port (this project's old process)
                                # This is safe because:
                                # - If port changed: We're killing the old port (this project's old process)
                                # - If port is same: We're killing this project's process on the same port (needed for redeploy)
                                kill_old_port_result = await vm_manager.exec_in_vm(
                                    vm_name,
                                    f"lsof -ti :{old_port} 2>/dev/null | while read pid; do kill -9 $pid 2>/dev/null; done || "
                                    f"fuser -k {old_port}/tcp 2>/dev/null || "
                                    f"true"
                                )
                                logger.info(f"Cleaned up old port {old_port} for deployment {deployment_id}")
                                await manager.broadcast(f"✅ Cleaned up old port {old_port}")
                            except Exception as e:
                                logger.warning(f"Error killing process on old port {old_port}: {e}")
                        
                        # Method 3: Kill process by log file (specific to this deployment)
                        log_file = f"/tmp/project-{deployment_id}.log"
                        try:
                            # Kill any process that might be writing to THIS deployment's log file
                            kill_log_result = await vm_manager.exec_in_vm(
                                vm_name,
                                f"lsof {log_file} 2>/dev/null | awk 'NR>1 {{print $2}}' | while read pid; do kill -9 $pid 2>/dev/null; done || true"
                            )
                            logger.info(f"Cleaned up processes using log file for deployment {deployment_id}")
                        except Exception as e:
                            logger.warning(f"Error cleaning up log file processes: {e}")
            
            # Wait a moment for processes to fully stop
            await asyncio.sleep(1)
            
            # Verify the NEW port is free before starting (check if it's actually available)
            if port:
                port_check = await vm_manager.exec_in_vm(
                    vm_name,
                    f"lsof -i :{port} 2>/dev/null | grep LISTEN || netstat -tlnp 2>/dev/null | grep :{port} || ss -tlnp 2>/dev/null | grep :{port} || echo 'FREE'"
                )
                if port_check.stdout and 'FREE' not in port_check.stdout and port_check.stdout.strip():
                    # NEW port is in use - this shouldn't happen if port assignment worked correctly
                    # But if it does, we need to handle it
                    error_msg = f"New port {port} is already in use. This may indicate a port assignment issue."
                    logger.error(error_msg)
                    await manager.broadcast(f"⚠️ {error_msg}")
                    # Don't fail - the port assignment should have prevented this
                    # But log it as a warning
                else:
                    logger.info(f"New port {port} is free - ready to start")
                    await manager.broadcast(f"✅ New port {port} verified free")
            
            await manager.broadcast(f"✅ Cleanup complete for deployment {deployment_id} - ready to start new process")
        except Exception as e:
            error_msg = f"Error during process cleanup for deployment {deployment_id}: {e}"
            logger.error(error_msg)
            await manager.broadcast(f"⚠️ {error_msg} (continuing anyway)")
            # Don't fail completely - try to continue, but log the error
            # The process might still start successfully
        
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
            
            # Start command in background using nohup with proper detaching
            # Escape single quotes in start_command for safe shell execution
            escaped_start_command = start_command.replace("'", "'\"'\"'")
            
            # Improved start command that ensures process stays alive:
            # Use nohup with proper shell execution to ensure process survives shell exit
            # Format: cd dir && nohup bash -c 'command' > log 2>&1 &
            # The nohup command ensures the process continues running after the shell exits
            # We use bash -c to properly execute the command with environment variables
            # The & runs it in background, and nohup ensures it survives
            start_cmd = f"cd {vm_project_dir} && nohup bash -c '{escaped_start_command}' > {log_file} 2>&1 &"
            
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
            await asyncio.sleep(3)  # Increased wait time for process to fully start
            
            # Initialize variables for process verification
            pid = None
            
            # PRIORITY 1: Check port FIRST (most reliable method for process verification)
            process_running = False
            port_listening = False
            
            # PRIORITY 0: Verify the command actually executed by checking log file exists
            log_exists_check = await vm_manager.exec_in_vm(
                vm_name,
                f"test -f {log_file} && echo 'exists' || echo 'missing'"
            )
            if "missing" in (log_exists_check.stdout or "").strip():
                # Log file doesn't exist - command might not have executed
                error_msg = f"Start command may not have executed - log file not found: {log_file}"
                await manager.broadcast(f"⚠️ {error_msg}")
                logger.warning(error_msg)
                # Try to read any error output from the start command
                if start_result.stderr:
                    await manager.broadcast(f"Error output: {start_result.stderr[:500]}")
            
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
                            # Method 1: Try lsof first (if installed)
                            pid_check = await vm_manager.exec_in_vm(
                                vm_name,
                                f"lsof -ti :{port} 2>/dev/null | head -1 || echo ''"
                            )
                            if pid_check.stdout and pid_check.stdout.strip():
                                pid = int(pid_check.stdout.strip())
                                logger.info(f"✅ Found PID from port check (lsof): {pid}")
                            else:
                                # Method 2: Extract PID from port_check output (works with ss, netstat, or lsof)
                                # ss format: users:(("python3",pid=4307,fd=3))
                                # netstat format: tcp 0 0 0.0.0.0:6001 0.0.0.0:* LISTEN 4307/python3
                                import re
                                port_output = port_check.stdout.strip()
                                # Try to extract PID from ss format: pid=4307
                                pid_match = re.search(r'pid=(\d+)', port_output)
                                if pid_match:
                                    pid = int(pid_match.group(1))
                                    logger.info(f"✅ Extracted PID from port check (ss format): {pid}")
                                else:
                                    # Try to extract PID from netstat format: last number before process name
                                    # Pattern: ... LISTEN 4307/python3
                                    pid_match = re.search(r'\b(\d+)/(?:python|node|npm|java|go)\w*\b', port_output)
                                    if pid_match:
                                        pid = int(pid_match.group(1))
                                        logger.info(f"✅ Extracted PID from port check (netstat format): {pid}")
                                    else:
                                        # Method 3: Use pgrep as fallback (most reliable)
                                        pgrep_check = await vm_manager.exec_in_vm(
                                            vm_name,
                                            f"pgrep -f 'http.server {port}' 2>/dev/null | head -1 || pgrep -f ':{port}' 2>/dev/null | head -1 || echo ''"
                                        )
                                        if pgrep_check.stdout and pgrep_check.stdout.strip():
                                            pid = int(pgrep_check.stdout.strip())
                                            logger.info(f"✅ Found PID from pgrep: {pid}")
                                        else:
                                            pid = -1  # PID unknown but process is running
                                            logger.info(f"✅ Process is running on port {port} (PID unknown)")
                        except Exception as e:
                            logger.warning(f"Failed to extract PID from port check: {e}")
                            # Last resort: try pgrep
                            try:
                                pgrep_check = await vm_manager.exec_in_vm(
                                    vm_name,
                                    f"pgrep -f 'http.server {port}' 2>/dev/null | head -1 || echo ''"
                                )
                                if pgrep_check.stdout and pgrep_check.stdout.strip():
                                    pid = int(pgrep_check.stdout.strip())
                                    logger.info(f"✅ Found PID via pgrep fallback: {pid}")
                                else:
                                    pid = -1  # PID unknown but process is running
                            except Exception:
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
                # Try multiple times with increasing wait intervals
                max_retries = 3
                for retry in range(max_retries):
                    wait_time = 2 + (retry * 2)  # 2s, 4s, 6s
                    await manager.broadcast(f"⏳ Waiting for process to start on port {port} (attempt {retry + 1}/{max_retries})...")
                    await asyncio.sleep(wait_time)
                    
                    # Check port again
                    port_check2 = await vm_manager.exec_in_vm(
                        vm_name,
                        f"lsof -i :{port} 2>/dev/null | grep LISTEN || netstat -tlnp 2>/dev/null | grep :{port} || ss -tlnp 2>/dev/null | grep :{port} || echo ''"
                    )
                    if port_check2.stdout and port_check2.stdout.strip():
                        port_listening = True
                        logger.info(f"✅ Port {port} is now listening (after {wait_time}s wait)")
                        
                        # CRITICAL: Also verify HTTP accessibility before marking as running
                        http_verified = False
                        try:
                            await manager.broadcast(f"🔍 Verifying HTTP accessibility...")
                            http_check = await vm_manager.exec_in_vm(
                                vm_name,
                                f"curl -s -o /dev/null -w '%{{http_code}}' --max-time 10 --connect-timeout 5 http://localhost:{port} 2>&1 || echo '000'"
                            )
                            http_code = (http_check.stdout or "").strip()
                            # HTTP status codes are 3 digits (200, 404, 500, etc.)
                            # "000" means connection failed
                            if http_code and len(http_code) == 3 and http_code.isdigit() and http_code != "000":
                                http_verified = True
                                process_running = True
                                logger.info(f"✅ HTTP check passed - service returned status {http_code}")
                                await manager.broadcast(f"✅ Service is accessible via HTTP (status: {http_code})")
                            else:
                                logger.warning(f"⚠️ Port is listening but HTTP check failed (returned: {http_code})")
                                await manager.broadcast(f"⚠️ Port {port} is listening but HTTP check failed - will retry...")
                                # Don't mark as running if HTTP check fails - continue to next retry
                                port_listening = False
                        except Exception as e:
                            logger.warning(f"⚠️ HTTP check failed: {e}")
                            await manager.broadcast(f"⚠️ HTTP check error: {e} - will retry...")
                            port_listening = False
                        
                        # Only break if both port is listening AND HTTP is verified
                        if port_listening and http_verified:
                            process_running = True
                            # Try to get PID from port (use multiple methods since lsof might not be installed)
                            try:
                                # Method 1: Try lsof
                                pid_from_port = await vm_manager.exec_in_vm(
                                    vm_name,
                                    f"lsof -ti :{port} 2>/dev/null | head -1 || echo ''"
                                )
                                if pid_from_port.stdout and pid_from_port.stdout.strip():
                                    pid = int(pid_from_port.stdout.strip())
                                    logger.info(f"✅ Found PID from port (after wait, lsof): {pid}")
                                else:
                                    # Method 2: Use pgrep (more reliable, doesn't require lsof)
                                    pgrep_result = await vm_manager.exec_in_vm(
                                        vm_name,
                                        f"pgrep -f 'http.server {port}' 2>/dev/null | head -1 || pgrep -f ':{port}' 2>/dev/null | head -1 || echo ''"
                                    )
                                    if pgrep_result.stdout and pgrep_result.stdout.strip():
                                        pid = int(pgrep_result.stdout.strip())
                                        logger.info(f"✅ Found PID from port (after wait, pgrep): {pid}")
                                    else:
                                        pid = None
                            except Exception as e:
                                logger.warning(f"Failed to get PID after wait: {e}")
                                pid = None
                            
                            break
                    elif not port_listening:
                        # Port not listening, continue retry
                        continue
                    else:
                        # Port listening but HTTP failed - continue retry
                        continue
            
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
                                    set_status(deployment, "failed")
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
                                set_status(deployment, "failed")
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
                            # Command succeeded but port not listening - need to actually verify
                            # Check if it's a Docker Compose command
                            is_docker_compose = "docker compose" in start_command.lower() or "docker-compose" in start_command.lower()
                            
                            if is_docker_compose:
                                # For Docker Compose, check if containers are actually running
                                await manager.broadcast(f"🐳 Checking Docker containers status...")
                                container_check = await vm_manager.exec_in_vm(
                                    vm_name,
                                    f"cd {vm_project_dir} && docker compose ps --format json 2>/dev/null || docker-compose ps --format json 2>/dev/null || echo '[]'"
                                )
                                
                                if container_check.stdout and container_check.stdout.strip() and container_check.stdout.strip() != '[]':
                                    try:
                                        import json
                                        containers = json.loads(container_check.stdout)
                                        if isinstance(containers, list) and len(containers) > 0:
                                            running_containers = [c for c in containers if c.get('State') == 'running']
                                            if running_containers:
                                                await manager.broadcast(f"✅ Found {len(running_containers)} running container(s)")
                                                # Check if any container is exposing the port
                                                port_check_docker = await vm_manager.exec_in_vm(
                                                    vm_name,
                                                    f"docker ps --format '{{{{.Ports}}}}' | grep -o ':{port}' || echo ''"
                                                )
                                                if port_check_docker.stdout and port_check_docker.stdout.strip():
                                                    process_running = True
                                                    port_listening = True
                                                    logger.info(f"✅ Docker containers running and port {port} is exposed")
                                                else:
                                                    # Containers running but port not exposed - check what ports are actually exposed
                                                    exposed_ports = await vm_manager.exec_in_vm(
                                                        vm_name,
                                                        f"docker ps --format '{{{{.Ports}}}}' | head -5"
                                                    )
                                                    if exposed_ports.stdout:
                                                        await manager.broadcast(f"⚠️ Containers running but port {port} not found. Exposed ports: {exposed_ports.stdout[:200]}")
                                                    # Still mark as running if containers are up
                                                    process_running = True
                                                    logger.info(f"✅ Docker containers running (port verification inconclusive)")
                                            else:
                                                await manager.broadcast(f"❌ Docker containers exist but none are running")
                                                logger.warning(f"⚠️ Docker containers not running")
                                    except Exception as e:
                                        logger.warning(f"⚠️ Could not parse Docker container status: {e}")
                                        # Fall through to HTTP check
                                else:
                                    await manager.broadcast(f"⚠️ Could not verify Docker containers - checking HTTP directly...")
                            
                            # For any command, verify via HTTP check (most reliable)
                            if not process_running:
                                await manager.broadcast(f"🔍 Performing HTTP health check to verify service...")
                                http_verify = await vm_manager.exec_in_vm(
                                    vm_name,
                                    f"curl -s -o /dev/null -w '%{{http_code}}' --max-time 10 --connect-timeout 5 http://localhost:{port} 2>&1 || echo 'FAILED'"
                                )
                                http_result = (http_verify.stdout or "").strip()
                                
                                # HTTP status codes are 3 digits (200, 404, 500, etc.)
                                # "000" or "FAILED" means connection failed
                                if http_result and len(http_result) == 3 and http_result.isdigit() and http_result != "000":
                                    process_running = True
                                    port_listening = True
                                    logger.info(f"✅ HTTP check passed - service returned {http_result}")
                                    await manager.broadcast(f"✅ Service verified via HTTP (status: {http_result})")
                                else:
                                    # HTTP check failed - read logs to understand why
                                    log_diagnosis = await vm_manager.exec_in_vm(
                                        vm_name,
                                        f"tail -30 {log_file} 2>/dev/null | tail -10 || echo 'No logs'"
                                    )
                                    log_snippet = (log_diagnosis.stdout or "").strip()
                                    error_msg = f"Service not accessible via HTTP (curl returned: {http_result})"
                                    if log_snippet and log_snippet != 'No logs':
                                        error_msg += f"\nRecent logs: {log_snippet[:300]}"
                                    await manager.broadcast(f"❌ {error_msg}")
                                    logger.error(f"Service verification failed: {error_msg}")
                                    # Don't assume - fail the deployment
                                    process_running = False
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
                        # Command succeeded but no log file - need to verify
                        await manager.broadcast(f"⚠️ No log file found - verifying service is actually running...")
                        
                        # Check if it's Docker Compose
                        is_docker_compose = "docker compose" in start_command.lower() or "docker-compose" in start_command.lower()
                        if is_docker_compose:
                            container_check = await vm_manager.exec_in_vm(
                                vm_name,
                                f"cd {vm_project_dir} && docker compose ps 2>/dev/null | grep -i running || docker-compose ps 2>/dev/null | grep -i running || echo ''"
                            )
                            if container_check.stdout and "running" in container_check.stdout.lower():
                                process_running = True
                                await manager.broadcast(f"✅ Docker containers verified as running")
                            else:
                                await manager.broadcast(f"❌ Docker containers not running")
                                process_running = False
                        elif port:
                            # For non-Docker, verify via HTTP
                            http_verify = await vm_manager.exec_in_vm(
                                vm_name,
                                f"curl -s -o /dev/null -w '%{{http_code}}' --max-time 10 http://localhost:{port} 2>&1 || echo 'FAILED'"
                            )
                            http_result = (http_verify.stdout or "").strip()
                            if http_result and len(http_result) == 3 and http_result.isdigit() and http_result != "000":
                                process_running = True
                                port_listening = True
                                await manager.broadcast(f"✅ Service verified via HTTP (status: {http_result})")
                            else:
                                await manager.broadcast(f"❌ Service not accessible via HTTP (returned: {http_result})")
                                process_running = False
                        else:
                            # No port specified and no Docker - can't verify
                            await manager.broadcast(f"❌ Cannot verify service (no port specified and not Docker)")
                            process_running = False
                        
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
                
                # Final HTTP health check to ensure service is actually accessible
                if port and process_running:
                    try:
                        await manager.broadcast(f"🔍 Verifying HTTP accessibility on port {port}...")
                        http_health_check = await vm_manager.exec_in_vm(
                            vm_name,
                            f"curl -s -o /dev/null -w '%{{http_code}}' --max-time 5 http://localhost:{port} || echo '000'"
                        )
                        http_code = (http_health_check.stdout or "").strip()
                        # HTTP status codes are 3 digits (200, 404, 500, etc.)
                        # "000" or empty means connection failed
                        if http_code and len(http_code) == 3 and http_code.isdigit() and http_code != "000":
                            logger.info(f"✅ HTTP health check passed - service returned status {http_code}")
                            await manager.broadcast(f"✅ Service is accessible via HTTP (status: {http_code})")
                        else:
                            # HTTP check failed - this is a problem, don't assume success
                            error_msg = f"HTTP health check failed - service returned: {http_code or 'no response'}"
                            logger.error(f"❌ {error_msg}")
                            await manager.broadcast(f"❌ {error_msg}")
                            
                            # Try to diagnose the issue
                            await manager.broadcast(f"🔍 Diagnosing service issue...")
                            
                            # Check if port is actually listening
                            port_listen_check = await vm_manager.exec_in_vm(
                                vm_name,
                                f"lsof -i :{port} 2>/dev/null | grep LISTEN || netstat -tlnp 2>/dev/null | grep :{port} || ss -tlnp 2>/dev/null | grep :{port} || echo 'NOT_LISTENING'"
                            )
                            if "NOT_LISTENING" in (port_listen_check.stdout or ""):
                                await manager.broadcast(f"❌ Port {port} is not listening")
                                process_running = False
                            else:
                                # Port is listening but HTTP fails - might be wrong port or service not ready
                                await manager.broadcast(f"⚠️ Port {port} is listening but HTTP check failed - service may not be ready")
                                # Read logs to see what's happening
                                recent_logs = await vm_manager.exec_in_vm(
                                    vm_name,
                                    f"tail -20 {log_file} 2>/dev/null || echo 'No logs'"
                                )
                                if recent_logs.stdout and recent_logs.stdout.strip() != 'No logs':
                                    await manager.broadcast(f"📋 Recent logs: {recent_logs.stdout[:300]}")
                    except Exception as e:
                        logger.warning(f"⚠️ HTTP health check failed: {e}")
                        await manager.broadcast(f"⚠️ Could not verify HTTP accessibility: {e}")
                
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
                
                # Raise exception to trigger retry logic
                raise DeploymentError(f"Deployment failed: {error_msg}")
            
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
                            set_status(deployment, "failed")
                            session.add(deployment)
                            session.commit()
                    return None
            except Exception as check_error:
                logger.error(f"Error checking process status: {check_error}")
                # Fail if we can't check
                with Session(engine) as session:
                    deployment = session.get(Deployment, deployment_id)
                    if deployment:
                        set_status(deployment, "failed")
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
                    # Check if generated domain is already taken globally (across all users)
                    # If taken, append a number suffix (e.g., project-name-2.aayush786.xyz)
                    domain_to_use = default_domain
                    counter = 1
                    while True:
                        existing_domain = session.exec(
                            select(Deployment).where(
                                Deployment.custom_domain.is_not(None),
                                func.lower(Deployment.custom_domain) == domain_to_use.lower(),
                                Deployment.id != deployment_id  # Exclude current deployment
                            )
                        ).first()
                        
                        if not existing_domain:
                            # Domain is available
                            break
                        
                        # Domain is taken, try with suffix
                        counter += 1
                        domain_to_use = f"{project_slug}-{counter}.{butler_domain}"
                    
                    # Store the generated domain
                    deployment.custom_domain = domain_to_use
                
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
                    safe_configure_domain(domain_to_use, service_url)
                    deployment.domain_status = "active"
                    deployment.last_domain_sync = datetime.datetime.utcnow()
                    # Only set status to "running" if Cloudflare configuration succeeded
                    set_status(deployment, "running")
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
                        set_status(deployment, "failed")
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

