"""
Simple and Robust Project Analyzer
Uses file detection to identify project types: Static, Python, JavaScript, etc.
Simple, effective, and robust - no complex AI needed for basic detection.
"""

import os
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


async def analyze_project_simple(
    vm_name: str,
    project_dir: str,
    vm_manager,
    connection_manager=None
) -> Dict[str, Any]:
    """
    Simple, robust project analysis using file detection.
    
    Detection Priority:
    1. Static HTML sites (index.html or multiple .html files)
    2. Python projects (requirements.txt + Python entry points)
    3. JavaScript/Node projects (package.json)
    4. Other frameworks (Dockerfile, etc.)
    
    Args:
        vm_name: Name of the VM where the project is located
        project_dir: Path to the project directory inside the VM
        vm_manager: VM manager instance to execute commands in VM
        connection_manager: Connection manager for broadcasting updates (optional)
    
    Returns:
        Dictionary with analysis results:
        {
            "framework": str,
            "is_static": bool,
            "is_python": bool,
            "is_javascript": bool,
            "build_command": str or None,
            "start_command": str,
            "port": int,
            "root_directory": str
        }
    """
    result = {
        "framework": "Unknown",
        "is_static": False,
        "is_python": False,
        "is_javascript": False,
        "build_command": None,
        "start_command": None,
        "port": 8080,
        "root_directory": "./"
    }
    
    try:
        if connection_manager:
            await connection_manager.broadcast("🔍 Analyzing project structure...")
        
        # Step 1: Check for static HTML sites (HIGHEST PRIORITY)
        html_check = await vm_manager.exec_in_vm(
            vm_name,
            f"if [ -f {project_dir}/index.html ] || [ $(find {project_dir} -maxdepth 1 -name '*.html' 2>/dev/null | wc -l) -gt 0 ]; then echo 'found'; else echo 'not_found'; fi"
        )
        
        if "found" in (html_check.stdout or "").strip():
            logger.info("✅ Detected: Static HTML site")
            result["framework"] = "Static HTML"
            result["is_static"] = True
            result["build_command"] = None  # No build needed
            result["start_command"] = "python3 -m http.server 8080 --bind 0.0.0.0"
            result["port"] = 8080
            if connection_manager:
                await connection_manager.broadcast("📊 Framework: Static HTML (Static Site)")
            return result
        
        # Step 2: Check for Python projects
        # Must have BOTH requirements.txt AND Python entry points
        has_requirements = False
        has_python_entry = False
        
        req_check = await vm_manager.exec_in_vm(
            vm_name,
            f"test -f {project_dir}/requirements.txt && echo 'exists' || echo 'not_exists'"
        )
        if "exists" in (req_check.stdout or "").strip():
            has_requirements = True
        
        # Check for Python entry points
        python_entry_check = await vm_manager.exec_in_vm(
            vm_name,
            f"test -f {project_dir}/app.py -o -f {project_dir}/main.py -o -f {project_dir}/manage.py -o -f {project_dir}/server.py -o -f {project_dir}/run.py && echo 'exists' || echo 'not_exists'"
        )
        if "exists" in (python_entry_check.stdout or "").strip():
            has_python_entry = True
        
        if has_requirements and has_python_entry:
            logger.info("✅ Detected: Python project")
            result["framework"] = "Python"
            result["is_python"] = True
            result["build_command"] = "pip install -r requirements.txt"
            
            # Detect framework-specific start commands
            # Check for Django
            django_check = await vm_manager.exec_in_vm(
                vm_name,
                f"test -f {project_dir}/manage.py && echo 'exists' || echo 'not_exists'"
            )
            if "exists" in (django_check.stdout or "").strip():
                result["start_command"] = "python3 manage.py runserver 0.0.0.0:8000"
                result["port"] = 8000
                result["framework"] = "Django"
            else:
                # Check for Flask
                flask_check = await vm_manager.exec_in_vm(
                    vm_name,
                    f"grep -q 'Flask\\|flask' {project_dir}/requirements.txt 2>/dev/null && echo 'found' || echo 'not_found'"
                )
                if "found" in (flask_check.stdout or "").strip():
                    # Flask needs to bind to 0.0.0.0 to be accessible from outside VM
                    # Use flask run with --host flag, or set FLASK_RUN_HOST env var
                    result["start_command"] = "flask run --host 0.0.0.0 --port 5000 || python3 app.py"
                    result["port"] = 5000
                    result["framework"] = "Flask"
                else:
                    # Check for FastAPI
                    fastapi_check = await vm_manager.exec_in_vm(
                        vm_name,
                        f"grep -q 'fastapi\\|uvicorn' {project_dir}/requirements.txt 2>/dev/null && echo 'found' || echo 'not_found'"
                    )
                    if "found" in (fastapi_check.stdout or "").strip():
                        result["start_command"] = "uvicorn app:app --host 0.0.0.0 --port 8000"
                        result["port"] = 8000
                        result["framework"] = "FastAPI"
                    else:
                        # Generic Python - try to bind to 0.0.0.0 if possible
                        # Most Python web frameworks respect HOST env var
                        result["start_command"] = "python3 app.py"
                        result["port"] = 8000
            
            if connection_manager:
                await connection_manager.broadcast(f"📊 Framework: {result['framework']} (Python)")
            return result
        
        # Step 3: Check for JavaScript/Node projects
        package_json_check = await vm_manager.exec_in_vm(
            vm_name,
            f"test -f {project_dir}/package.json && echo 'exists' || echo 'not_exists'"
        )
        
        if "exists" in (package_json_check.stdout or "").strip():
            logger.info("✅ Detected: JavaScript/Node.js project")
            result["framework"] = "JavaScript/Node.js"
            result["is_javascript"] = True
            
            # Read package.json to detect framework and scripts
            package_json_content = await vm_manager.exec_in_vm(
                vm_name,
                f"cat {project_dir}/package.json 2>/dev/null | head -100"
            )
            
            package_json_text = package_json_content.stdout or ""
            
            # Detect framework from package.json
            if '"next"' in package_json_text:
                result["framework"] = "Next.js"
                result["build_command"] = "npm install && npm run build"
                result["start_command"] = "npm start"
                result["port"] = 3000
            elif '"react"' in package_json_text:
                result["framework"] = "React"
                result["build_command"] = "npm install && npm run build"
                result["start_command"] = "npm start"
                result["port"] = 3000
            elif '"vue"' in package_json_text:
                result["framework"] = "Vue.js"
                result["build_command"] = "npm install && npm run build"
                result["start_command"] = "npm run serve"
                result["port"] = 8080
            elif '"express"' in package_json_text:
                result["framework"] = "Express.js"
                result["build_command"] = "npm install"
                # Check for start script in package.json
                if '"start"' in package_json_text:
                    result["start_command"] = "npm start"
                elif '"dev"' in package_json_text:
                    result["start_command"] = "npm run dev"
                else:
                    result["start_command"] = "node index.js"
                result["port"] = 3000
            elif '"@nestjs/core"' in package_json_text:
                result["framework"] = "NestJS"
                result["build_command"] = "npm install"
                if '"start"' in package_json_text:
                    result["start_command"] = "npm start"
                elif '"dev"' in package_json_text:
                    result["start_command"] = "npm run dev"
                else:
                    result["start_command"] = "node index.js"
                result["port"] = 3000
            else:
                # Generic Node.js
                result["build_command"] = "npm install"
                # Check for scripts in package.json
                if '"start"' in package_json_text:
                    result["start_command"] = "npm start"
                elif '"dev"' in package_json_text:
                    result["start_command"] = "npm run dev"
                else:
                    result["start_command"] = "node index.js"
                result["port"] = 3000
            
            if connection_manager:
                await connection_manager.broadcast(f"📊 Framework: {result['framework']} (JavaScript/Node.js)")
            return result
        
        # Step 4: Check for Dockerfile (fallback)
        dockerfile_check = await vm_manager.exec_in_vm(
            vm_name,
            f"test -f {project_dir}/Dockerfile && echo 'exists' || echo 'not_exists'"
        )
        
        if "exists" in (dockerfile_check.stdout or "").strip():
            logger.info("✅ Detected: Docker-based project")
            result["framework"] = "Docker"
            result["build_command"] = None  # Docker handles build
            result["start_command"] = "echo 'Docker deployment not supported - use process-based deployment'"
            result["port"] = 8080
            if connection_manager:
                await connection_manager.broadcast("📊 Framework: Docker")
            return result
        
        # Step 5: Unknown project type - use safe defaults
        logger.warning("⚠️ Unknown project type - using safe defaults")
        result["framework"] = "Unknown"
        result["build_command"] = None
        result["start_command"] = "echo 'Project type not detected. Please configure deployment manually.'"
        result["port"] = 8080
        if connection_manager:
            await connection_manager.broadcast("⚠️ Framework: Unknown - using defaults")
        
        return result
        
    except Exception as e:
        logger.error(f"Error in simple project analysis: {e}", exc_info=True)
        if connection_manager:
            await connection_manager.broadcast(f"⚠️ Analysis error: {str(e)}")
        # Return safe defaults on error
        return {
            "framework": "Unknown",
            "is_static": False,
            "is_python": False,
            "is_javascript": False,
            "build_command": None,
            "start_command": "python3 -m http.server 8080",
            "port": 8080,
            "root_directory": "./"
        }


async def analyze_project_in_vm(
    vm_name: str,
    project_dir: str,
    deployment_id: int,
    vm_manager,
    connection_manager=None
):
    """
    Analyze a project and update the deployment record.
    This function uses simple file-based detection (not AI).
    
    Args:
        vm_name: Name of the VM where the project is located
        project_dir: Path to the project directory inside the VM
        deployment_id: Deployment ID to update with analysis results
        vm_manager: VM manager instance
        connection_manager: Connection manager for broadcasting updates (optional)
    """
    try:
        logger.info(f"Starting project analysis for deployment {deployment_id}")
        
        from database import engine
        from login import Deployment
        from sqlmodel import Session
        
        # Perform simple file-based analysis
        analysis_result = await analyze_project_simple(
            vm_name,
            project_dir,
            vm_manager,
            connection_manager
        )
        
        if analysis_result:
            # Update deployment record with analysis results
            with Session(engine) as session:
                deployment = session.get(Deployment, deployment_id)
                if deployment:
                    framework = analysis_result.get("framework", "Unknown")
                    is_static = analysis_result.get("is_static", False)
                    is_python = analysis_result.get("is_python", False)
                    is_javascript = analysis_result.get("is_javascript", False)
                    
                    # Update build command
                    build_cmd = analysis_result.get("build_command")
                    if build_cmd:
                        deployment.build_command = build_cmd
                    else:
                        deployment.build_command = None
                    
                    # Update start command
                    start_cmd = analysis_result.get("start_command")
                    if start_cmd:
                        deployment.start_command = start_cmd
                    
                    # Update port
                    port = analysis_result.get("port")
                    if port:
                        deployment.port = port
                    
                    session.add(deployment)
                    session.commit()
                    
                    logger.info(f"✅ Successfully updated deployment {deployment_id} with analysis results")
                    logger.info(f"  Framework: {framework}")
                    logger.info(f"  Build: {build_cmd or 'None'}")
                    logger.info(f"  Start: {start_cmd}")
                    logger.info(f"  Port: {port}")
                    
                    if connection_manager:
                        await connection_manager.broadcast(f"✅ Analysis completed for {deployment.app_name or deployment_id}!")
        else:
            logger.warning(f"Analysis returned no results for deployment {deployment_id}")
            if connection_manager:
                await connection_manager.broadcast(f"⚠️ Analysis returned no results for deployment {deployment_id}")
            
    except Exception as e:
        logger.error(f"Error in project analysis: {e}", exc_info=True)
        # Don't fail the import if analysis fails
        if connection_manager:
            await connection_manager.broadcast(f"⚠️ Analysis failed: {str(e)}")
        pass
