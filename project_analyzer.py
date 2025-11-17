"""
AI-Powered Project Analyzer
Uses AI to intelligently analyze project structure and determine the best deployment strategy.
All detection logic is in the AI prompt - no hardcoded if-else chains.
"""

import os
import logging
import json
import re
from typing import Optional, Dict, Any, List, Tuple

# Try to import AI library, fallback to file-based detection if not available
AI_AVAILABLE = False
genai = None
try:
    import google.generativeai as genai
    AI_AVAILABLE = True
except ImportError:
    pass

logger = logging.getLogger(__name__)


def _clean_ai_response(response_text: str) -> str:
    """Clean AI response to extract JSON, removing markdown code blocks."""
    text = response_text.strip()
    # Remove markdown code blocks if present
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


async def analyze_project_with_ai(
    vm_name: str,
    project_dir: str,
    vm_manager,
    connection_manager=None
) -> Dict[str, Any]:
    """
    AI-Powered Project Analyzer
    Uses AI to intelligently analyze project structure and determine deployment strategy.
    All detection logic is in the AI prompt - no hardcoded if-else chains.
    
    Reads files in this order:
    1. README.md (if exists) - for deployment instructions
    2. package.json (if exists) - for Node.js projects
    3. requirements.txt (if exists) - for Python projects
    4. Other config files (vite.config.js, Dockerfile, etc.)
    5. Project structure (files and folders)
    """
    result = {
        "framework": "Unknown",
        "is_static": False,
        "is_python": False,
        "is_javascript": False,
        "build_command": None,
        "start_command": None,
        "port": 8080,
        "root_directory": "./",
        "entry_file": None
    }
    
    try:
        if connection_manager:
            await connection_manager.broadcast("🤖 AI is analyzing project structure...")
        
        # Collect all project files for AI analysis
        project_files = {}
        readme_content = None
        
        # 1. Read README.md FIRST and analyze it separately (highest priority)
        readme_check = await vm_manager.exec_in_vm(
            vm_name,
            f"test -f {project_dir}/README.md -o -f {project_dir}/readme.md -o -f {project_dir}/Readme.md && echo 'exists' || echo 'not_exists'"
        )
        if "exists" in (readme_check.stdout or "").strip():
            readme_result = await vm_manager.exec_in_vm(
                vm_name,
                f"cat {project_dir}/README.md {project_dir}/readme.md {project_dir}/Readme.md 2>/dev/null"
            )
            if readme_result.stdout:
                readme_content = readme_result.stdout
                project_files["README.md"] = readme_content
                logger.info("✅ Read README.md for AI analysis")
                if connection_manager:
                    await connection_manager.broadcast("📖 Reading README.md for deployment instructions...")
        
        # 2. Read package.json
        package_json_check = await vm_manager.exec_in_vm(
            vm_name,
            f"test -f {project_dir}/package.json && echo 'exists' || echo 'not_exists'"
        )
        if "exists" in (package_json_check.stdout or "").strip():
            package_json_content = await vm_manager.exec_in_vm(
                vm_name,
                f"cat {project_dir}/package.json 2>/dev/null"
            )
            if package_json_content.stdout:
                project_files["package.json"] = package_json_content.stdout
                logger.info("✅ Read package.json for AI analysis")
        
        # 3. Read requirements.txt
        requirements_check = await vm_manager.exec_in_vm(
            vm_name,
            f"test -f {project_dir}/requirements.txt && echo 'exists' || echo 'not_exists'"
        )
        if "exists" in (requirements_check.stdout or "").strip():
            requirements_content = await vm_manager.exec_in_vm(
                vm_name,
                f"cat {project_dir}/requirements.txt 2>/dev/null"
            )
            if requirements_content.stdout:
                project_files["requirements.txt"] = requirements_content.stdout
                logger.info("✅ Read requirements.txt for AI analysis")
        
        # 4. Read other config files
        config_files = ["vite.config.js", "vite.config.ts", "next.config.js", "Dockerfile", "docker-compose.yml", "Pipfile", "pyproject.toml"]
        for config_file in config_files:
            config_check = await vm_manager.exec_in_vm(
                vm_name,
                f"test -f {project_dir}/{config_file} && echo 'exists' || echo 'not_exists'"
            )
            if "exists" in (config_check.stdout or "").strip():
                config_content = await vm_manager.exec_in_vm(
                    vm_name,
                    f"cat {project_dir}/{config_file} 2>/dev/null | head -200"
                )
                if config_content.stdout:
                    project_files[config_file] = config_content.stdout
                    logger.info(f"✅ Read {config_file} for AI analysis")
        
        # 5. Get project structure (list of files and folders)
        structure_check = await vm_manager.exec_in_vm(
            vm_name,
            f"ls -la {project_dir} 2>/dev/null | head -50"
        )
        if structure_check.stdout:
            project_files["project_structure"] = structure_check.stdout
            logger.info("✅ Read project structure for AI analysis")
        
        # 6. Check for Python entry points
        python_files_check = await vm_manager.exec_in_vm(
            vm_name,
            f"find {project_dir} -maxdepth 1 -name '*.py' ! -name '__*' -type f 2>/dev/null | head -10"
        )
        if python_files_check.stdout:
            project_files["python_files"] = python_files_check.stdout
            logger.info("✅ Found Python files for AI analysis")
        
        # Now use AI to analyze all collected files with comprehensive multi-stage prompts
        if AI_AVAILABLE and genai and project_files:
            try:
                import os
                from dotenv import load_dotenv
                load_dotenv()
                
                api_key = os.getenv("GOOGLE_AI_API_KEY") or os.getenv("GOOGLE_API_KEY")
                if api_key:
                    genai.configure(api_key=api_key)  # type: ignore
                    model = genai.GenerativeModel('gemini-pro')  # type: ignore
                    
                    # Stage 0: README.md Analysis (HIGHEST PRIORITY - if exists)
                    readme_insights = {}
                    if readme_content:
                        if connection_manager:
                            await connection_manager.broadcast("🤖 AI analyzing README.md for deployment instructions...")
                        
                        readme_analysis_prompt = f"""You are an expert DevOps engineer. Analyze this README.md file to extract deployment and running instructions.

README.md CONTENT:
{readme_content[:5000]}

EXTRACT FROM README.md:
1. **How to run/start the project?** Look for sections like "Running", "Getting Started", "Installation", "Deployment", "Usage"
2. **What commands are mentioned?** Look for npm start, python app.py, docker run, etc.
3. **What is the framework/technology?** Look for mentions of React, Django, Flask, FastAPI, etc.
4. **What dependencies need to be installed?** Look for npm install, pip install, etc.
5. **What is the build process?** Look for npm run build, yarn build, etc.
6. **What port does it run on?** Look for port numbers mentioned
7. **What environment variables are needed?** Look for .env, environment setup
8. **What is the entry point?** Look for main file mentioned (app.py, index.js, etc.)

IMPORTANT: README.md is the PRIMARY SOURCE OF TRUTH. Extract all deployment-related information from it.

Return JSON with all information found:
{{
    "how_to_run": "string or null - exact command or instructions from README",
    "framework_detected": "string or null - framework mentioned in README",
    "build_command_from_readme": "string or null - build command from README",
    "start_command_from_readme": "string or null - start/run command from README",
    "port_from_readme": "number or null - port mentioned in README",
    "entry_file_from_readme": "string or null - entry file mentioned",
    "dependencies_from_readme": ["string"] - dependencies mentioned,
    "environment_variables": ["string"] - env vars mentioned,
    "deployment_notes": "string or null - any deployment-specific notes",
    "has_deployment_instructions": boolean,
    "confidence": "high|medium|low"
}}"""

                        readme_response = model.generate_content(readme_analysis_prompt)  # type: ignore
                        readme_text = _clean_ai_response(readme_response.text)
                        readme_insights = json.loads(readme_text)
                        
                        logger.info(f"✅ README.md analyzed: has_deployment={readme_insights.get('has_deployment_instructions', False)}")
                        if connection_manager:
                            if readme_insights.get('has_deployment_instructions'):
                                await connection_manager.broadcast("✅ Found deployment instructions in README.md!")
                            else:
                                await connection_manager.broadcast("ℹ️ README.md analyzed (no specific deployment instructions)")
                    
                    # Stage 1: Initial Project Discovery (use README insights if available)
                    # Build project files list (excluding README.md)
                    other_files = "\n".join([f"=== {filename} ===\n{content[:3000]}\n" for filename, content in project_files.items() if filename != "README.md"])
                    readme_insights_json = json.dumps(readme_insights, indent=2) if readme_insights else 'No README.md found'
                    
                    discovery_prompt = f"""You are an expert DevOps engineer performing initial project discovery.

{'='*80}
README.md ANALYSIS (HIGHEST PRIORITY - USE THIS INFORMATION):
{readme_insights_json}
{'='*80}

PROJECT FILES COLLECTED:
{other_files}

STEP 1: PROJECT TYPE DETECTION
1. List all files found in the project
2. Check for: package.json, requirements.txt, index.html, Dockerfile, composer.json, go.mod
3. Identify framework-specific files (manage.py, next.config.js, vite.config.js, etc.)

STEP 2: FRAMEWORK IDENTIFICATION
- If README.md has framework information, USE IT
- Otherwise, determine from files found
- What programming language(s) are used?
- Is this frontend, backend, or full-stack?

STEP 3: DEPENDENCIES ANALYSIS
- What dependencies are listed?
- Are there known frameworks in dependencies?
- What build tools are being used?

STEP 4: ENTRY POINTS
- If README.md mentions entry file, USE IT
- Otherwise, find main entry file (app.py, index.js, main.py, server.js, etc.)
- Are there server configuration files?

CRITICAL: README.md is the PRIMARY SOURCE. If README.md has deployment instructions, prioritize them over file detection.

Return JSON:
{{
    "project_type": "static|python|javascript|docker|unknown",
    "framework": "string",
    "languages": ["string"],
    "is_frontend": boolean,
    "is_backend": boolean,
    "is_fullstack": boolean,
    "dependencies_found": ["string"],
    "build_tools": ["string"],
    "entry_files": ["string"],
    "config_files": ["string"],
    "readme_used": boolean,
    "confidence": "high|medium|low"
}}"""

                    discovery_response = model.generate_content(discovery_prompt)  # type: ignore
                    discovery_text = _clean_ai_response(discovery_response.text)
                    discovery_data = json.loads(discovery_text)
                    
                    framework = discovery_data.get("framework", "Unknown")
                    project_type = discovery_data.get("project_type", "unknown")
                    entry_files = discovery_data.get("entry_files", [])
                    
                    if connection_manager:
                        await connection_manager.broadcast(f"🔍 Stage 1: Detected {framework} ({project_type})")
                    
                    # Stage 2: Build Strategy (use README insights)
                    build_strategy_prompt = f"""Based on this project analysis, determine the optimal build strategy.

{'='*80}
README.md BUILD INFORMATION (USE THIS IF AVAILABLE):
- Build command from README: {readme_insights.get('build_command_from_readme', 'Not found')}
- Dependencies from README: {readme_insights.get('dependencies_from_readme', [])}
{'='*80}

PROJECT CONTEXT:
- Framework: {framework}
- Project Type: {project_type}
- Dependencies: {discovery_data.get('dependencies_found', [])}
- Build Tools: {discovery_data.get('build_tools', [])}
- Entry Files: {entry_files}

PACKAGE.JSON (if exists):
{project_files.get('package.json', 'N/A')}

REQUIREMENTS.TXT (if exists):
{project_files.get('requirements.txt', 'N/A')}

DETERMINE:
1. Does this project need a build step?
   - Static sites: No build needed
   - React/Vue/Angular: Yes, needs build
   - Python/Node backend: No build, but needs dependency installation

2. What is the correct build command?
   - For npm projects: Check package.json scripts
   - For Python: pip install -r requirements.txt
   - Consider: npm install && npm run build, yarn build, etc.

3. What is the build output directory?
   - Common: dist/, build/, out/, public/, _site/
   - Check configuration files for custom output paths

4. Are there pre-build or post-build steps needed?

Return JSON:
{{
    "needs_build": boolean,
    "build_command": "string or null",
    "build_output_directory": "string or null",
    "pre_build_steps": ["string"],
    "post_build_steps": ["string"],
    "dependency_install_command": "string or null"
}}"""

                    build_response = model.generate_content(build_strategy_prompt)  # type: ignore
                    build_text = _clean_ai_response(build_response.text)
                    build_data = json.loads(build_text)
                    
                    if connection_manager:
                        await connection_manager.broadcast(f"🔨 Stage 2: Build strategy determined")
                    
                    # Stage 3: Start Command Detection (use README insights - HIGHEST PRIORITY)
                    start_command_prompt = f"""Analyze this project to determine the correct start command.

{'='*80}
README.md START COMMAND (HIGHEST PRIORITY - USE THIS IF AVAILABLE):
- How to run from README: {readme_insights.get('how_to_run', 'Not found')}
- Start command from README: {readme_insights.get('start_command_from_readme', 'Not found')}
- Entry file from README: {readme_insights.get('entry_file_from_readme', 'Not found')}
{'='*80}

PROJECT CONTEXT:
- Framework: {framework}
- Project Type: {project_type}
- Entry Files: {entry_files}
- Build Output Directory: {build_data.get('build_output_directory')}
- Needs Build: {build_data.get('needs_build', False)}

PACKAGE.JSON SCRIPTS:
{json.dumps(json.loads(project_files.get('package.json', '{}')).get('scripts', {}) if project_files.get('package.json') else {}, indent=2)}

DETERMINE START COMMAND:

1. FOR STATIC SITES:
   - Serve from root or build directory?
   - Command: `python3 -m http.server 8080 --directory [DIR]`

2. FOR PYTHON WEB APPS:
   - Flask: `FLASK_APP=<entry> flask run --host 0.0.0.0 --port 5000` or `python3 <entry>`
   - Django: `python3 manage.py runserver 0.0.0.0:8000`
   - FastAPI: `uvicorn <module>:app --host 0.0.0.0 --port 8000`
   - Generic: `python3 <entry_file>`

3. FOR NODE.JS APPS:
   - Check package.json "start" script
   - Production: `npm start` or `node server.js`
   - Development: `npm run dev`
   - Built React/Vue: Serve from dist/build directory (NOT npm start)

4. FOR PYTHON SCRIPTS (non-web):
   - Run: `python3 <script_name>`
   - Keep running: `nohup python3 <script_name> &`

5. FOR DOCKER PROJECTS:
   - **CRITICAL: ONLY suggest Docker if docker-compose.yml OR Dockerfile ACTUALLY EXISTS in project_files**
   - Check project_files dictionary - if "docker-compose.yml" or "Dockerfile" is NOT in project_files, DO NOT suggest Docker
   - If docker-compose.yml exists: `docker compose up -d`
   - If Dockerfile exists (but no docker-compose.yml): `docker build -t app . && docker run -d -p 8080:8080 app`
   - **NEVER suggest Docker commands if Docker files are not in the project_files dictionary**

IMPORTANT RULES:
- **IF README.md HAS START COMMAND, USE IT AS PRIMARY SOURCE** - it knows best how to run the project
- For React/Vue after build: Use `python3 -m http.server 3000 --bind 0.0.0.0 --directory <build_dir>` (NOT npm start)
- For Next.js: Use `npm start` (Next.js handles production)
- If "start" script is dev mode (react-scripts start, vite), serve built files instead
- Specify if app runs continuously or executes once

Return JSON:
{{
    "start_command": "string",
    "requires_continuous_running": boolean,
    "entry_file": "string or null",
    "start_command_type": "static|python|node|other"
}}"""

                    start_response = model.generate_content(start_command_prompt)  # type: ignore
                    start_text = _clean_ai_response(start_response.text)
                    start_data = json.loads(start_text)
                    
                    if connection_manager:
                        await connection_manager.broadcast(f"🚀 Stage 3: Start command determined")
                    
                    # Stage 4: Port Detection (use README insights)
                    port_detection_prompt = f"""Determine the correct port for this application.

{'='*80}
README.md PORT INFORMATION (USE THIS IF AVAILABLE):
- Port from README: {readme_insights.get('port_from_readme', 'Not found')}
{'='*80}

CONTEXT:
- Framework: {framework}
- Project Type: {project_type}
- Start Command: {start_data.get('start_command')}

CONFIGURATION FILES:
{chr(10).join([f"{k}: {v[:500]}" for k, v in project_files.items() if any(x in k.lower() for x in ['config', '.env', 'settings', 'package.json'])])}

PORT DETECTION STRATEGY:
1. Check configuration files for PORT=, port:, PORT_NUMBER
2. Framework defaults:
   - Flask: 5000
   - Django: 8000
   - FastAPI: 8000
   - Express/Node: 3000
   - React Dev: 3000, React Build: any
   - Next.js: 3000
   - Static: 8080
3. Check start command for port specification
4. Fallback: 8080 for unknown/static, 3000 for Node.js, 8000 for Python

Return JSON:
{{
    "port": number,
    "port_source": "config|framework_default|start_command|fallback",
    "confidence": "high|medium|low"
}}"""

                    port_response = model.generate_content(port_detection_prompt)  # type: ignore
                    port_text = _clean_ai_response(port_response.text)
                    port_data = json.loads(port_text)
                    
                    # Combine all analysis results
                    result["framework"] = framework
                    result["build_command"] = build_data.get("build_command")
                    result["start_command"] = start_data.get("start_command", "echo 'No start command determined'")
                    result["port"] = port_data.get("port", 8080)
                    result["is_static"] = project_type == "static"
                    result["is_python"] = project_type == "python"
                    result["is_javascript"] = project_type == "javascript"
                    result["entry_file"] = start_data.get("entry_file") or (entry_files[0] if entry_files else None)
                    
                    logger.info(f"✅ AI Analysis complete: {result['framework']} on port {result['port']}")
                    if connection_manager:
                        await connection_manager.broadcast(f"🤖 AI Analysis: {result['framework']} → {result['start_command']}")
                    
                    return result
                    
            except Exception as ai_error:
                logger.warning(f"AI analysis failed: {ai_error}, falling back to file-based detection")
                if connection_manager:
                    await connection_manager.broadcast(f"⚠️ AI analysis failed, using fallback detection")
        
        # Fallback to simple file-based detection if AI fails or not available
        logger.info("Using fallback file-based detection")
        return await analyze_project_simple(vm_name, project_dir, vm_manager, connection_manager)
        
    except Exception as e:
        logger.error(f"Error in AI project analysis: {e}", exc_info=True)
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
            "root_directory": "./",
            "entry_file": None
        }


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
            "root_directory": str,
            "entry_file": str or None  # Python entry file (app.py, bot.py, etc.)
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
        "root_directory": "./",
        "entry_file": None  # Python entry file (app.py, main.py, bot.py, etc.)
    }
    
    try:
        if connection_manager:
            await connection_manager.broadcast("🔍 Analyzing project structure...")
        
        # Step 0: Check for Docker files (HIGHEST PRIORITY - if Docker is available)
        docker_compose_check = await vm_manager.exec_in_vm(
            vm_name,
            f"test -f {project_dir}/docker-compose.yml -o -f {project_dir}/docker-compose.yaml && echo 'exists' || echo 'not_exists'"
        )
        dockerfile_check = await vm_manager.exec_in_vm(
            vm_name,
            f"test -f {project_dir}/Dockerfile && echo 'exists' || echo 'not_exists'"
        )
        
        # Check if Docker is available in VM
        docker_available = False
        try:
            docker_check = await vm_manager.exec_in_vm(vm_name, "which docker")
            docker_available = docker_check.returncode == 0 and docker_check.stdout.strip()
        except:
            pass
        
        if docker_available and ("exists" in (docker_compose_check.stdout or "").strip() or "exists" in (dockerfile_check.stdout or "").strip()):
            logger.info("✅ Detected: Docker-based project")
            result["framework"] = "Docker"
            result["is_docker"] = True
            result["build_command"] = None  # Docker handles build
            if "exists" in (docker_compose_check.stdout or "").strip():
                result["start_command"] = "docker compose up -d"
                result["deployment_type"] = "docker-compose"
            else:
                result["start_command"] = "docker build -t app . && docker run -d -p 8080:8080 app"
                result["deployment_type"] = "dockerfile"
            result["port"] = 8080
            if connection_manager:
                await connection_manager.broadcast("🐳 Framework: Docker (will use Docker deployment)")
            return result
        
        # Step 1: Check for static HTML sites
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
        python_entry_file = None
        
        req_check = await vm_manager.exec_in_vm(
            vm_name,
            f"test -f {project_dir}/requirements.txt && echo 'exists' || echo 'not_exists'"
        )
        if "exists" in (req_check.stdout or "").strip():
            has_requirements = True
        
        # Check for standard Python entry points first
        python_entry_check = await vm_manager.exec_in_vm(
            vm_name,
            f"test -f {project_dir}/app.py -o -f {project_dir}/main.py -o -f {project_dir}/manage.py -o -f {project_dir}/server.py -o -f {project_dir}/run.py && echo 'exists' || echo 'not_exists'"
        )
        if "exists" in (python_entry_check.stdout or "").strip():
            has_python_entry = True
            # Find which file exists
            for entry_file in ['app.py', 'main.py', 'manage.py', 'server.py', 'run.py']:
                file_check = await vm_manager.exec_in_vm(
                    vm_name,
                    f"test -f {project_dir}/{entry_file} && echo 'exists' || echo 'not_exists'"
                )
                if "exists" in (file_check.stdout or "").strip():
                    python_entry_file = entry_file
                    break
        
        # If no standard entry point found, check for ANY .py file in root directory
        # This handles cases like bot.py, barsha.py, turuturu.py, etc.
        if not has_python_entry and has_requirements:
            # Find all .py files in root directory (excluding __pycache__ and hidden files)
            py_files_check = await vm_manager.exec_in_vm(
                vm_name,
                f"find {project_dir} -maxdepth 1 -name '*.py' ! -name '__*' -type f 2>/dev/null | head -1"
            )
            py_file_path = (py_files_check.stdout or "").strip()
            if py_file_path:
                # Extract just the filename
                python_entry_file = py_file_path.split('/')[-1]
                has_python_entry = True
                logger.info(f"Found non-standard Python entry point: {python_entry_file}")
        
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
                result["entry_file"] = "manage.py"
            else:
                # Check for Flask in requirements.txt
                flask_check = await vm_manager.exec_in_vm(
                    vm_name,
                    f"grep -q 'Flask\\|flask' {project_dir}/requirements.txt 2>/dev/null && echo 'found' || echo 'not_found'"
                )
                if "found" in (flask_check.stdout or "").strip():
                    # Flask detected - now find the actual Flask app file
                    # Check if the entry file contains Flask app creation
                    flask_app_found = False
                    if python_entry_file:
                        # Check if the entry file contains Flask app initialization
                        flask_app_check = await vm_manager.exec_in_vm(
                            vm_name,
                            f"grep -q 'Flask\\|from flask import\\|app = Flask' {project_dir}/{python_entry_file} 2>/dev/null && echo 'found' || echo 'not_found'"
                        )
                        if "found" in (flask_app_check.stdout or "").strip():
                            flask_app_found = True
                    
                    # If not found in entry file, search all .py files for Flask app
                    if not flask_app_found:
                        flask_search = await vm_manager.exec_in_vm(
                            vm_name,
                            f"grep -l 'Flask\\|from flask import\\|app = Flask' {project_dir}/*.py 2>/dev/null | head -1"
                        )
                        flask_file = (flask_search.stdout or "").strip()
                        if flask_file:
                            python_entry_file = flask_file.split('/')[-1]
                            flask_app_found = True
                    
                    if flask_app_found and python_entry_file:
                        # Use the detected Flask file
                        # Set FLASK_APP environment variable and try flask run first, fallback to python3
                        result["start_command"] = f"FLASK_APP={python_entry_file} flask run --host 0.0.0.0 --port 5000 || python3 {python_entry_file}"
                        result["port"] = 5000
                        result["framework"] = "Flask"
                        result["entry_file"] = python_entry_file
                    else:
                        # Flask in requirements but app not found - use generic Flask command
                        entry_cmd = f"python3 {python_entry_file}" if python_entry_file else "python3 app.py"
                        flask_app_var = f"FLASK_APP={python_entry_file} " if python_entry_file else ""
                        result["start_command"] = f"{flask_app_var}flask run --host 0.0.0.0 --port 5000 || {entry_cmd}"
                        result["port"] = 5000
                        result["framework"] = "Flask"
                        result["entry_file"] = python_entry_file
                else:
                    # Check for FastAPI
                    fastapi_check = await vm_manager.exec_in_vm(
                        vm_name,
                        f"grep -q 'fastapi\\|uvicorn' {project_dir}/requirements.txt 2>/dev/null && echo 'found' || echo 'not_found'"
                    )
                    if "found" in (fastapi_check.stdout or "").strip():
                        # Try to find FastAPI app in entry file
                        if python_entry_file:
                            fastapi_app_check = await vm_manager.exec_in_vm(
                                vm_name,
                                f"grep -q 'FastAPI\\|from fastapi import' {project_dir}/{python_entry_file} 2>/dev/null && echo 'found' || echo 'not_found'"
                            )
                            if "found" in (fastapi_app_check.stdout or "").strip():
                                # Extract app variable name (usually 'app')
                                app_var_check = await vm_manager.exec_in_vm(
                                    vm_name,
                                    f"grep -o 'app\\|application' {project_dir}/{python_entry_file} 2>/dev/null | head -1"
                                )
                                app_var = (app_var_check.stdout or "").strip() or "app"
                                module_name = python_entry_file.replace('.py', '')
                                result["start_command"] = f"uvicorn {module_name}:{app_var} --host 0.0.0.0 --port 8000"
                            else:
                                result["start_command"] = f"uvicorn {python_entry_file.replace('.py', '')}:app --host 0.0.0.0 --port 8000"
                        else:
                            result["start_command"] = "uvicorn app:app --host 0.0.0.0 --port 8000"
                        result["port"] = 8000
                        result["framework"] = "FastAPI"
                    else:
                        # Generic Python - use the detected entry file or default
                        if python_entry_file:
                            # Check if entry file has web server code (app.run, uvicorn.run, etc.)
                            web_server_check = await vm_manager.exec_in_vm(
                                vm_name,
                                f"grep -q 'app\\.run\\|if __name__.*==.*__main__' {project_dir}/{python_entry_file} 2>/dev/null && echo 'found' || echo 'not_found'"
                            )
                            if "found" in (web_server_check.stdout or "").strip():
                                result["start_command"] = f"python3 {python_entry_file}"
                            else:
                                # Still try to run it - might be a web app
                                result["start_command"] = f"python3 {python_entry_file}"
                            result["entry_file"] = python_entry_file
                        else:
                            result["start_command"] = "python3 app.py"
                            result["entry_file"] = "app.py"
                        result["port"] = 8000
                        result["framework"] = "Python"
            
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
            
            # Read package.json fully to parse as JSON
            package_json_content = await vm_manager.exec_in_vm(
                vm_name,
                f"cat {project_dir}/package.json 2>/dev/null"
            )
            
            package_json_text = package_json_content.stdout or ""
            
            # Try to parse package.json as JSON to extract scripts and dependencies intelligently
            package_json = None
            scripts = {}
            dependencies = {}
            dev_dependencies = {}
            
            try:
                if package_json_text:
                    package_json = json.loads(package_json_text)
                    scripts = package_json.get("scripts", {})
                    dependencies = package_json.get("dependencies", {})
                    dev_dependencies = package_json.get("devDependencies", {})
                    logger.info(f"✅ Parsed package.json: scripts={list(scripts.keys())}, has react={'react' in str(dependencies).lower()}")
            except json.JSONDecodeError as e:
                logger.warning(f"Could not parse package.json as JSON: {e}, using text-based detection")
            
            # Detect framework from package.json
            if '"next"' in package_json_text:
                result["framework"] = "Next.js"
                result["build_command"] = "npm install && npm run build"
                result["start_command"] = "npm start"
                result["port"] = 3000
            elif '"react"' in package_json_text or '"react-dom"' in package_json_text:
                result["framework"] = "React"
                
                # Intelligently determine build and start commands
                # Check if "build" script exists in package.json
                has_build_script = scripts.get("build") is not None if scripts else '"build"' in package_json_text
                has_start_script = scripts.get("start") is not None if scripts else '"start"' in package_json_text
                
                # Check for build tools
                has_vite = any('vite' in str(dep).lower() for dep in list(dependencies.keys()) + list(dev_dependencies.keys())) if package_json else '"vite"' in package_json_text
                has_cra = 'react-scripts' in str(dependencies) if package_json else '"react-scripts"' in package_json_text
                
                # Determine build output directory
                # Check vite.config.js or other config files for output directory
                vite_config_check = await vm_manager.exec_in_vm(
                    vm_name,
                    f"test -f {project_dir}/vite.config.js -o -f {project_dir}/vite.config.ts && echo 'exists' || echo 'not_exists'"
                )
                has_vite_config = "exists" in (vite_config_check.stdout or "").strip()
                
                # Check actual build output folders (might exist from previous build)
                build_dir_check = await vm_manager.exec_in_vm(
                    vm_name,
                    f"if [ -d {project_dir}/build ]; then echo 'build'; elif [ -d {project_dir}/dist ]; then echo 'dist'; elif [ -d {project_dir}/out ]; then echo 'out'; else echo 'none'; fi"
                )
                existing_build_dir = (build_dir_check.stdout or "").strip()
                
                # Determine build command
                if has_build_script:
                    result["build_command"] = "npm install && npm run build"
                else:
                    result["build_command"] = "npm install && npm run build"  # Still try build, might work
                
                # Determine output directory based on tools and config
                if has_vite or has_vite_config:
                    output_dir = "dist"
                elif has_cra:
                    output_dir = "build"
                elif existing_build_dir != "none":
                    output_dir = existing_build_dir
                else:
                    # Default: check package.json build output or common defaults
                    output_dir = "build"  # Most common for React
                
                # Determine start command
                # If there's a "start" script, check if it's production-ready
                if has_start_script and scripts:
                    start_script_cmd = scripts.get("start", "")
                    # If start script runs a dev server (like "react-scripts start"), we need to serve built files instead
                    if "react-scripts start" in start_script_cmd or "vite" in start_script_cmd.lower():
                        # This is a dev server, serve built files instead
                        result["start_command"] = f"python3 -m http.server 3000 --bind 0.0.0.0 --directory {output_dir}"
                    else:
                        # Might be a production start command, try it first
                        result["start_command"] = f"npm start || python3 -m http.server 3000 --bind 0.0.0.0 --directory {output_dir}"
                else:
                    # No start script or can't parse - serve built files
                    result["start_command"] = f"python3 -m http.server 3000 --bind 0.0.0.0 --directory {output_dir}"
                
                result["port"] = 3000
                logger.info(f"React app detected: build_output={output_dir}, has_build={has_build_script}, has_start={has_start_script}")
            elif '"vue"' in package_json_text:
                result["framework"] = "Vue.js"
                result["build_command"] = "npm install && npm run build"
                # Vue.js builds to dist/ folder, serve from there
                result["start_command"] = "npx serve -s dist -l 8080 --host 0.0.0.0 || python3 -m http.server 8080 --bind 0.0.0.0 --directory dist"
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
            "root_directory": "./",
            "entry_file": None
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
        
        # Perform AI-powered analysis (falls back to simple if AI unavailable)
        analysis_result = await analyze_project_with_ai(
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
