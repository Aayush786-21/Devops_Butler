"""
Project Analyzer using Gemini AI
Analyzes project structure to detect build commands, start commands, ports, frameworks, etc.
"""

import os
import json
import asyncio
import logging
from typing import Optional, Dict, List, Any
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)

# Try to import Gemini AI, but make it optional
try:
    import google.generativeai as genai  # type: ignore
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-generativeai not installed. AI analysis will be disabled.")
    # Create a dummy genai module for type checking
    genai = None  # type: ignore


async def analyze_project_with_gemini(
    vm_name: str,
    project_dir: str,
    vm_manager,
    connection_manager=None
) -> Optional[Dict[str, Any]]:
    """
    Analyze a project using Gemini AI to detect:
    - Build commands
    - Start commands
    - Port number
    - Framework type
    - Dependencies
    - Environment variables needed
    - Configuration steps
    
    Args:
        vm_name: Name of the VM where the project is located
        project_dir: Path to the project directory inside the VM (e.g., /projects/1)
        vm_manager: VM manager instance to execute commands in VM
        connection_manager: Connection manager for broadcasting updates (optional)
    
    Returns:
        Dictionary with analysis results or None if analysis fails
    """
    if not GEMINI_AVAILABLE or genai is None:
        logger.warning("Gemini AI not available. Skipping AI analysis.")
        return None
    
    try:
        # Get Gemini API key from environment (loaded from .env file)
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY not set in .env file. Skipping AI analysis.")
            return None
        
        # Configure Gemini (type checker knows genai is not None here due to check above)
        genai.configure(api_key=api_key)  # type: ignore[union-attr]
        model = genai.GenerativeModel('gemini-1.5-flash')  # type: ignore[union-attr]
        
        logger.info(f"Starting AI analysis for project: {project_dir}")
        
        # Broadcast update if connection_manager is provided
        if connection_manager:
            await connection_manager.broadcast("🔍 Analyzing project structure...")
        
        # Step 1: Check for static HTML sites FIRST (highest priority)
        # This prevents static sites from being misclassified as Python/Node.js projects
        is_static_site = False
        html_check = await vm_manager.exec_in_vm(
            vm_name,
            f"if [ -f {project_dir}/index.html ] || [ $(find {project_dir} -maxdepth 1 -name '*.html' 2>/dev/null | wc -l) -gt 0 ]; then echo 'found'; else echo 'not_found'; fi"
        )
        
        if "found" in (html_check.stdout or "").strip():
            is_static_site = True
            logger.info("Detected static HTML site - will recommend static server, no build command")
        
        # Step 2: Get project structure (list of files and directories)
        # Include HTML files in the search to help AI detect static sites
        ls_result = await vm_manager.exec_in_vm(
            vm_name,
            f"find {project_dir} -maxdepth 2 -type f \\( -name '*.json' -o -name '*.py' -o -name '*.js' -o -name '*.ts' -o -name '*.html' -o -name '*.htm' -o -name '*.yml' -o -name '*.yaml' -o -name 'Dockerfile' -o -name 'docker-compose.yml' -o -name 'README.md' -o -name 'package.json' -o -name 'requirements.txt' -o -name 'go.mod' -o -name 'Cargo.toml' -o -name 'pom.xml' \\) | head -30"
        )
        
        files_list = ls_result.stdout.strip().split('\n') if ls_result.stdout else []
        files_list = [f.replace(project_dir, '.').strip() for f in files_list if f.strip() and f.strip() != '.']
        
        # Count HTML files
        html_files = [f for f in files_list if f.endswith('.html') or f.endswith('.htm')]
        html_count = len(html_files)
        
        # Step 3: Read key configuration files
        key_files_content = {}
        key_files = ['package.json', 'requirements.txt', 'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', 'README.md', 'go.mod', 'Cargo.toml', 'pom.xml', 'app.py', 'main.py', 'server.js', 'index.js', 'index.ts', 'index.html']
        
        for key_file in key_files:
            try:
                # Try to read the file from VM
                read_result = await vm_manager.exec_in_vm(
                    vm_name,
                    f"cat {project_dir}/{key_file} 2>/dev/null | head -300"
                )
                if read_result.returncode == 0 and read_result.stdout and read_result.stdout.strip():
                    # Limit content size for API
                    content = read_result.stdout[:3000]  # Limit to 3000 chars
                    key_files_content[key_file] = content
            except Exception as e:
                logger.debug(f"Could not read {key_file}: {e}")
                continue
        
        # If no key files found, try to list directory structure
        if not key_files_content:
            try:
                tree_result = await vm_manager.exec_in_vm(
                    vm_name,
                    f"ls -la {project_dir} | head -20"
                )
                if tree_result.returncode == 0 and tree_result.stdout:
                    key_files_content['directory_listing'] = tree_result.stdout
            except Exception as e:
                logger.debug(f"Could not list directory: {e}")
        
        # Step 3: Create a summary of the project
        project_summary = f"""
Project Structure:
- Total key files found: {len(files_list)}
- Files: {', '.join(files_list[:15])}

Key Files Content:
"""
        for file_name, content in key_files_content.items():
            # Truncate content if too long
            content_preview = content[:2000] if len(content) > 2000 else content
            project_summary += f"\n=== {file_name} ===\n{content_preview}\n"
        
        # Step 4: Create prompt for Gemini
        # CRITICAL: Check for static HTML sites FIRST before suggesting any build commands
        static_site_instruction = ""
        if is_static_site or html_count > 0:
            static_site_instruction = """
⚠️ **CRITICAL: STATIC SITE DETECTION** ⚠️
This project appears to be a STATIC HTML SITE (found {html_count} HTML file(s)).
For static HTML sites:
- build_command MUST be NULL (no build needed)
- start_command MUST be "python3 -m http.server 8080" (simple HTTP server)
- port MUST be 8080
- DO NOT suggest "pip install -r requirements.txt" or any Python dependencies
- DO NOT suggest Node.js build commands unless package.json exists AND is required
- Static sites do NOT need dependencies installed - they are just HTML/CSS/JS files

ONLY if this is NOT a static site (no HTML files or HTML files are part of a larger framework like React/Next.js), then proceed with normal analysis.
""".format(html_count=html_count)
        
        prompt = f"""
You are a DevOps expert analyzing a project repository. Analyze the following project structure and configuration files to determine how to build, run, and deploy this application.

{static_site_instruction}

**ANALYSIS PRIORITY (IMPORTANT - FOLLOW THIS ORDER):**

1. **FIRST: Check if this is a static HTML site**
   - If index.html exists OR multiple .html files exist → This is a STATIC SITE
   - For static sites: build_command = null, start_command = "python3 -m http.server 8080", port = 8080
   - DO NOT suggest dependencies or build commands for pure static sites

2. **SECOND: Check for framework-specific files**
   - package.json exists → Node.js project (check for build scripts)
   - requirements.txt exists → Python project (ONLY if Python entry points exist like app.py, manage.py, main.py)
   - Dockerfile exists → Extract commands from Dockerfile
   - docker-compose.yml exists → Extract commands from docker-compose

3. **THIRD: Validate suggestions**
   - If suggesting "pip install -r requirements.txt", VERIFY that requirements.txt exists AND Python entry points exist
   - If suggesting "npm install", VERIFY that package.json exists
   - If no build is needed, set build_command to null

**Analysis Requirements:**

1. **Framework/Technology Stack**: What framework or technology is this project using? 
   - For static sites: "Static HTML"
   - For frameworks: React, Next.js, Vue, Django, Flask, Express, Go, Rust, Java, etc.

2. **Build Command**: 
   - For static sites: null (NO BUILD NEEDED)
   - For other projects: "npm install", "pip install -r requirements.txt" (ONLY if requirements.txt exists), "npm install && npm run build", etc.
   - IMPORTANT: If requirements.txt doesn't exist, DO NOT suggest "pip install -r requirements.txt"

3. **Start Command**: 
   - For static sites: "python3 -m http.server 8080" (MANDATORY)
   - For other projects: "npm start", "npm run dev", "python app.py", "python manage.py runserver 0.0.0.0:8000", etc.

4. **Port Number**: 
   - For static sites: 8080 (MANDATORY)
   - For other projects: 3000 (Node.js), 5000 (Flask), 8000 (Django), 8080 (default), etc.

5. **Root Directory**: Is there a specific subdirectory where the application should be run from? (e.g., "./frontend", "./backend", "./", etc.) If not specified, use "./"

6. **Install Command**: Same as build_command (for compatibility)

7. **Environment Variables**: What environment variables might be needed? (e.g., DATABASE_URL, API_KEY, PORT, etc.) - return as a list

8. **Additional Notes**: Any special configuration or setup steps needed?

**Project Analysis:**
{project_summary}

**HTML Files Found: {html_count}**
**Is Static Site: {is_static_site}**

Please provide your analysis in the following JSON format (ONLY JSON, no markdown, no code blocks):
{{
    "framework": "string",
    "build_command": "string or null",
    "start_command": "string",
    "install_command": "string or null",
    "port": number,
    "root_directory": "string",
    "environment_variables": ["string"],
    "notes": "string",
    "confidence": "string"
}}

**REMEMBER:**
- If this is a static HTML site (HTML files found), build_command MUST be null and start_command MUST be "python3 -m http.server 8080"
- Do NOT suggest "pip install -r requirements.txt" unless requirements.txt EXISTS in the project
- Do NOT suggest build commands for static sites

Respond ONLY with valid JSON, no additional text or markdown.
""".format(
            static_site_instruction=static_site_instruction,
            project_summary=project_summary,
            html_count=html_count,
            is_static_site=is_static_site
        )
        
        # Step 5: Call Gemini API
        if connection_manager:
            await connection_manager.broadcast("🤖 Analyzing project with AI...")
        
        logger.info("Calling Gemini API for project analysis...")
        response = await asyncio.to_thread(model.generate_content, prompt)
        
        # Step 6: Parse response
        response_text = response.text.strip()
        logger.debug(f"Gemini response: {response_text[:500]}")
        
        # Try to extract JSON from response (sometimes Gemini adds markdown formatting)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            # Try to extract from code blocks
            parts = response_text.split("```")
            for part in parts:
                if part.strip().startswith("{"):
                    response_text = part.strip()
                    break
        elif response_text.startswith("{") and response_text.endswith("}"):
            # Already JSON, use as is
            pass
        else:
            # Try to find JSON object in response
            start_idx = response_text.find("{")
            end_idx = response_text.rfind("}")
            if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
                response_text = response_text[start_idx:end_idx+1]
        
        try:
            analysis_result = json.loads(response_text)
            logger.info(f"AI analysis completed: {json.dumps(analysis_result, indent=2)}")
            
            if connection_manager:
                await connection_manager.broadcast("✅ AI analysis completed!")
            
            return analysis_result
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {e}")
            logger.error(f"Response text (first 500 chars): {response_text[:500]}")
            # Try to fix common JSON issues
            try:
                # Remove any trailing commas
                response_text = response_text.replace(',}', '}').replace(',]', ']')
                analysis_result = json.loads(response_text)
                logger.info(f"AI analysis completed after fixing JSON: {json.dumps(analysis_result, indent=2)}")
                return analysis_result
            except:
                return None
            
    except Exception as e:
        logger.error(f"Error analyzing project with Gemini: {e}", exc_info=True)
        if connection_manager:
            await connection_manager.broadcast(f"⚠️ AI analysis failed: {str(e)}")
        return None


async def analyze_project_in_vm(
    vm_name: str,
    project_dir: str,
    deployment_id: int,
    vm_manager,
    connection_manager=None
):
    """
    Analyze a project in the background and update the deployment record.
    This function is meant to be called asynchronously after cloning.
    
    Args:
        vm_name: Name of the VM where the project is located
        project_dir: Path to the project directory inside the VM
        deployment_id: Deployment ID to update with analysis results
        vm_manager: VM manager instance
        connection_manager: Connection manager for broadcasting updates (optional)
    """
    try:
        logger.info(f"Starting background AI analysis for deployment {deployment_id}")
        
        from database import engine
        from login import Deployment
        from sqlmodel import Session
        
        # Perform AI analysis
        analysis_result = await analyze_project_with_gemini(
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
                    # Validate and sanitize AI results before storing
                    # Check if this is a static site (framework contains "Static" or "HTML")
                    framework = analysis_result.get('framework', '').lower()
                    is_static = 'static' in framework or 'html' in framework
                    
                    # Also check if HTML files exist (double-check)
                    if not is_static:
                        html_check = await vm_manager.exec_in_vm(
                            vm_name,
                            f"if [ -f {project_dir}/index.html ] || [ $(find {project_dir} -maxdepth 1 -name '*.html' 2>/dev/null | wc -l) -gt 0 ]; then echo 'found'; else echo 'not_found'; fi"
                        )
                        if "found" in (html_check.stdout or "").strip():
                            is_static = True
                            logger.info("Detected static site via HTML file check - overriding AI framework detection")
                    
                    # For static sites, force correct values (ignore AI mistakes)
                    if is_static:
                        logger.info("✅ Detected static site - forcing correct build/start commands (overriding any incorrect AI suggestions)")
                        deployment.build_command = None  # No build for static sites
                        deployment.start_command = "python3 -m http.server 8080"  # Force static server
                        deployment.port = 8080  # Force port 8080
                        logger.info("✅ Overrode AI results for static site - build_command=None, start_command=python3 -m http.server 8080, port=8080")
                    else:
                        # Update build command if detected, but validate it
                        build_cmd = analysis_result.get('build_command')
                        if build_cmd:
                            # Validate build command makes sense
                            # If it's pip install -r requirements.txt, validate requirements.txt exists
                            if "pip install -r requirements.txt" in build_cmd:
                                req_check = await vm_manager.exec_in_vm(
                                    vm_name,
                                    f"test -f {project_dir}/requirements.txt && echo 'exists' || echo 'not_exists'"
                                )
                                if "not_exists" in (req_check.stdout or "").strip():
                                    logger.warning(f"⚠️ AI suggested 'pip install -r requirements.txt' but requirements.txt not found - setting build_command to None")
                                    deployment.build_command = None
                                else:
                                    # Also check if Python entry points exist
                                    python_entry_check = await vm_manager.exec_in_vm(
                                        vm_name,
                                        f"test -f {project_dir}/app.py -o -f {project_dir}/main.py -o -f {project_dir}/manage.py && echo 'exists' || echo 'not_exists'"
                                    )
                                    if "not_exists" in (python_entry_check.stdout or "").strip():
                                        logger.warning(f"⚠️ requirements.txt exists but no Python entry points found - setting build_command to None")
                                        deployment.build_command = None
                                    else:
                                        deployment.build_command = build_cmd
                                        logger.info(f"✅ Validated and set build_command: {build_cmd}")
                            elif build_cmd.lower() == 'null' or build_cmd.lower() == 'none':
                                deployment.build_command = None
                            else:
                                deployment.build_command = build_cmd
                                logger.info(f"Updated build_command: {deployment.build_command}")
                        else:
                            # No build command from AI - check if install_command exists
                            install_cmd = analysis_result.get('install_command')
                            if install_cmd and install_cmd.lower() != 'null' and install_cmd.lower() != 'none':
                                # Validate install command
                                if "pip install -r requirements.txt" in install_cmd:
                                    req_check = await vm_manager.exec_in_vm(
                                        vm_name,
                                        f"test -f {project_dir}/requirements.txt && echo 'exists' || echo 'not_exists'"
                                    )
                                    if "exists" in (req_check.stdout or "").strip():
                                        deployment.build_command = install_cmd
                                        logger.info(f"Updated build_command from install_command: {install_cmd}")
                                    else:
                                        logger.warning(f"⚠️ AI suggested install_command with requirements.txt but file not found - skipping")
                                else:
                                    deployment.build_command = install_cmd
                                    logger.info(f"Updated build_command from install_command: {install_cmd}")
                        
                        # Update start command if detected
                        if analysis_result.get('start_command'):
                            start_cmd = analysis_result['start_command']
                            if start_cmd.lower() != 'null' and start_cmd.lower() != 'none':
                                deployment.start_command = start_cmd
                                logger.info(f"Updated start_command: {deployment.start_command}")
                        
                        # Update port if detected
                        if analysis_result.get('port'):
                            try:
                                port = int(analysis_result['port'])
                                if port > 0 and port < 65536:
                                    deployment.port = port
                                    logger.info(f"Updated port: {port}")
                                else:
                                    logger.warning(f"Invalid port value: {port}, using default 8080")
                                    deployment.port = 8080
                            except (ValueError, TypeError):
                                logger.warning(f"Invalid port value: {analysis_result.get('port')}, using default 8080")
                                deployment.port = 8080
                        else:
                            # No port from AI - set default
                            deployment.port = 8080
                            logger.info("No port from AI, using default 8080")
                    
                    # Store framework type
                    if framework:
                        logger.info(f"Detected framework: {analysis_result.get('framework', '')}")
                    
                    # Store environment variables
                    env_vars = analysis_result.get('environment_variables', [])
                    if env_vars:
                        logger.info(f"Detected environment variables: {env_vars}")
                    
                    # Store notes
                    notes = analysis_result.get('notes', '')
                    if notes:
                        logger.info(f"Analysis notes: {notes}")
                    
                    # Final validation - ensure we have at least a start command
                    if not deployment.start_command:
                        logger.warning("⚠️ AI analysis did not provide start_command, checking for static site as fallback")
                        # Check if static site (has HTML files)
                        html_check = await vm_manager.exec_in_vm(
                            vm_name,
                            f"if [ -f {project_dir}/index.html ] || [ $(find {project_dir} -maxdepth 1 -name '*.html' 2>/dev/null | wc -l) -gt 0 ]; then echo 'found'; else echo 'not_found'; fi"
                        )
                        if "found" in (html_check.stdout or "").strip():
                            deployment.start_command = "python3 -m http.server 8080"
                            deployment.port = 8080
                            deployment.build_command = None
                            logger.info("✅ Set default static site configuration as fallback")
                        else:
                            # No static site and no start command - set a safe default
                            logger.warning("⚠️ No start command and not a static site - setting safe default")
                            deployment.start_command = "echo 'No start command detected. Please configure deployment manually.'"
                            deployment.port = 8080
                            logger.info("✅ Set safe default start command")
                    
                    session.add(deployment)
                    session.commit()
                    
                    logger.info(f"✅ Successfully updated deployment {deployment_id} with AI analysis results")
                    
                    if connection_manager:
                        await connection_manager.broadcast(f"✅ AI analysis completed for project {deployment.app_name or deployment_id}!")
        else:
            logger.warning(f"AI analysis returned no results for deployment {deployment_id}")
            if connection_manager:
                await connection_manager.broadcast(f"⚠️ AI analysis returned no results for deployment {deployment_id}")
            
    except Exception as e:
        logger.error(f"Error in background AI analysis: {e}", exc_info=True)
        # Don't fail the import if analysis fails
        if connection_manager:
            await connection_manager.broadcast(f"⚠️ AI analysis failed: {str(e)}")
        pass

