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
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-generativeai not installed. AI analysis will be disabled.")


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
    if not GEMINI_AVAILABLE:
        logger.warning("Gemini AI not available. Skipping AI analysis.")
        return None
    
    try:
        # Get Gemini API key from environment (loaded from .env file)
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY not set in .env file. Skipping AI analysis.")
            return None
        
        # Configure Gemini
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        logger.info(f"Starting AI analysis for project: {project_dir}")
        
        # Broadcast update if connection_manager is provided
        if connection_manager:
            await connection_manager.broadcast("🔍 Analyzing project structure...")
        
        # Step 1: Get project structure (list of files and directories)
        ls_result = await vm_manager.exec_in_vm(
            vm_name,
            f"find {project_dir} -maxdepth 2 -type f \\( -name '*.json' -o -name '*.py' -o -name '*.js' -o -name '*.ts' -o -name '*.yml' -o -name '*.yaml' -o -name 'Dockerfile' -o -name 'docker-compose.yml' -o -name 'README.md' -o -name 'package.json' -o -name 'requirements.txt' -o -name 'go.mod' -o -name 'Cargo.toml' -o -name 'pom.xml' \\) | head -30"
        )
        
        files_list = ls_result.stdout.strip().split('\n') if ls_result.stdout else []
        files_list = [f.replace(project_dir, '.').strip() for f in files_list if f.strip() and f.strip() != '.']
        
        # Step 2: Read key configuration files
        key_files_content = {}
        key_files = ['package.json', 'requirements.txt', 'Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', 'README.md', 'go.mod', 'Cargo.toml', 'pom.xml', 'app.py', 'main.py', 'server.js', 'index.js', 'index.ts']
        
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
        prompt = f"""
You are a DevOps expert analyzing a project repository. Analyze the following project structure and configuration files to determine how to build, run, and deploy this application.

Analyze the project and provide:

1. **Framework/Technology Stack**: What framework or technology is this project using? (e.g., React, Next.js, Vue, Django, Flask, Express, Go, Rust, Java, etc.)
2. **Build Command**: What command should be used to build/install dependencies? (e.g., "npm install", "pip install -r requirements.txt", "npm install && npm run build", etc.)
3. **Start Command**: What command should be used to start/run the application? (e.g., "npm start", "npm run dev", "python app.py", "python manage.py runserver 0.0.0.0:8000", etc.)
4. **Port Number**: What port does this application typically run on? (e.g., 3000, 5000, 8000, 8080, etc.)
5. **Root Directory**: Is there a specific subdirectory where the application should be run from? (e.g., "./frontend", "./backend", "./", etc.) If not specified, use "./"
6. **Install Command**: What command should be used to install dependencies? (e.g., "npm install", "pip install -r requirements.txt", etc.)
7. **Environment Variables**: What environment variables might be needed? (e.g., DATABASE_URL, API_KEY, PORT, etc.) - return as a list
8. **Additional Notes**: Any special configuration or setup steps needed?

{project_summary}

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

Respond ONLY with valid JSON, no additional text or markdown.
"""
        
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
                    # Update build command if detected
                    if analysis_result.get('build_command'):
                        deployment.build_command = analysis_result['build_command']
                        logger.info(f"Updated build_command: {analysis_result['build_command']}")
                    
                    # Update install command if detected (can be used as build command if no build_command)
                    if analysis_result.get('install_command') and not deployment.build_command:
                        deployment.build_command = analysis_result['install_command']
                        logger.info(f"Updated build_command from install_command: {analysis_result['install_command']}")
                    
                    # Update start command if detected
                    if analysis_result.get('start_command'):
                        deployment.start_command = analysis_result['start_command']
                        logger.info(f"Updated start_command: {analysis_result['start_command']}")
                    
                    # Update port if detected
                    if analysis_result.get('port'):
                        try:
                            port = int(analysis_result['port'])
                            deployment.port = port
                            logger.info(f"Updated port: {port}")
                        except (ValueError, TypeError):
                            logger.warning(f"Invalid port value: {analysis_result.get('port')}")
                    
                    # Store framework type (we can add this field later)
                    framework = analysis_result.get('framework', '')
                    if framework:
                        logger.info(f"Detected framework: {framework}")
                    
                    # Store environment variables (we can add this field later)
                    env_vars = analysis_result.get('environment_variables', [])
                    if env_vars:
                        logger.info(f"Detected environment variables: {env_vars}")
                    
                    # Store notes (we can add this field later)
                    notes = analysis_result.get('notes', '')
                    if notes:
                        logger.info(f"Analysis notes: {notes}")
                    
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

