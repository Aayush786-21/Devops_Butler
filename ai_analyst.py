# ai_analyst.py
import os
import re  # Import the regular expressions module
import google.generativeai as genai
from config import GOOGLE_API_KEY # Import our securely loaded key

# type: ignore[attr-defined]
genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel(model_name='models/gemini-1.5-flash')

def list_files_for_prompt(directory: str) -> str:
    """
    Creates a string listing the files in a directory to be used in a prompt.
    """
    file_list = []
    for root, _, files in os.walk(directory):
        for name in files:
            # To keep the prompt clean, we'll ignore some common files
            if name.startswith('.') or '__pycache__' in root:
                continue
            # Get the relative path from the directory
            relative_path = os.path.relpath(os.path.join(root, name), directory)
            file_list.append(relative_path)
    
    return "\n".join(file_list)

def sanitize_output(raw_text: str) -> str:
    """
    Cleans up common LLM mistakes from output (YAML, Dockerfile, etc).
    """
    print("🤖 AI Analyst: Sanitizing generated output...")
    # Common mistake: LLMs often wrap the code in ```...```
    match = re.search(r'```(yaml|yml|dockerfile)?\n(.*)```', raw_text, re.DOTALL | re.IGNORECASE)
    if match:
        print("Sanitizer: Found and stripped markdown code block.")
        return match.group(2).strip()
    else:
        return raw_text.strip()

async def generate_docker_compose(code_directory: str) -> str | None:
    """
    Asks the Gemini LLM to generate a docker-compose.yml file for the given code.
    """
    print("🤖 AI Analyst: Analyzing code to generate docker-compose.yml...")

    try:
        file_structure = list_files_for_prompt(code_directory)
        
        prompt = f"""
        You are an expert DevOps engineer. Your task is to analyze the file structure of a project and generate a complete, valid `docker-compose.yml` file for it.

        Here is the file structure of the project:
        --- FILE STRUCTURE ---
        {file_structure}
        --- END FILE STRUCTURE ---

        Based on this file structure, please generate a `docker-compose.yml` file.

        IMPORTANT RULES:
        1. The output must be ONLY the YAML content for the `docker-compose.yml` file and nothing else. Do not include explanations, introductions, or the ```yaml markdown markers.
        2. Assume the user has a modern multicore processor. Create a Dockerfile for each service if not provided.
        3. For a Node.js app, if `package.json` exists, use an appropriate Node.js version and run `npm install` and the correct start command (e.g., `npm start`).
        4. For a Python app, if `requirements.txt` exists, use an appropriate Python version and run `pip install -r requirements.txt`.
        5. Expose the default port for the framework (e.g., 3000 for Node/React, 8000 for Django/FastAPI, 5000 for Flask). Do not publish it to the host. The platform will handle port mapping.
        """
        
        response = await model.generate_content_async(prompt)
        raw_yaml = response.text
        sanitized_yaml = sanitize_output(raw_yaml)
        print("✅ AI Analyst: Successfully generated and sanitized docker-compose.yml.")
        return sanitized_yaml

    except Exception as e:
        print(f"❌ AI Analyst: Failed to generate content. Error: {e}")
        return None

async def generate_dockerfile(code_directory: str, feedback: str | None = None) -> str | None:
    """
    Asks the Gemini LLM to generate a Dockerfile for the given code.
    """
    print("🤖 AI Analyst: Analyzing code to generate a Dockerfile...")

    try:
        file_structure = list_files_for_prompt(code_directory)
        
        feedback_prompt_section = ""
        if feedback:
            feedback_prompt_section = f"""
            The previous attempt to build a Docker image with your generated Dockerfile failed with this error:
            --- PREVIOUS ERROR ---
            {feedback}
            --- END PREVIOUS ERROR ---
            Please analyze this error and generate a new, corrected Dockerfile that fixes the issue. DO NOT repeat the same mistake.
            """

        prompt = f"""
        You are an expert DevOps engineer. Your task is to analyze the file structure of a project and generate a single, complete, valid `Dockerfile` for the main application.

        Here is the file structure of the project:
        --- FILE STRUCTURE ---
        {file_structure}
        --- END FILE STRUCTURE ---

        Based on this file structure, please generate a `Dockerfile`.

        IMPORTANT RULES:
        1. The output must be ONLY the Dockerfile content and nothing else. Do not include explanations, introductions, or the ```dockerfile markdown markers.
        2. Select an appropriate and modern base image (e.g., `python:3.11-slim`, `node:18-alpine`).
        3. If a `requirements.txt` (Python) or `package.json` (Node.js) exists, make sure you copy it and run the correct install command (`pip install -r requirements.txt` or `npm install`).
        4. Expose the default port for the framework (e.g., 8000 for Django/FastAPI, 5000 for Flask, 3000 for Node/Express).
        5. Set a sensible `CMD` or `ENTRYPOINT` to run the application.
        {feedback_prompt_section}
        """
        
        response = await model.generate_content_async(prompt)
        sanitized_dockerfile = sanitize_output(response.text)
        print("✅ AI Analyst: Successfully generated and sanitized Dockerfile.")
        return sanitized_dockerfile

    except Exception as e:
        print(f"❌ AI Analyst: Failed to generate content. Error: {e}")
        return None