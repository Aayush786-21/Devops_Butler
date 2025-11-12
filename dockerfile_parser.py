"""
Dockerfile and Docker Compose Parser
Extracts run commands from Docker files to use for process-based deployment
"""

import os
import re
import yaml
from typing import Optional, Tuple, Dict, List


def parse_dockerfile(dockerfile_path: str) -> Optional[Dict[str, any]]:
    """
    Parse Dockerfile to extract build and run commands.
    
    Returns:
        Dict with keys: build_command, start_command, install_command, port, working_dir
    """
    if not os.path.exists(dockerfile_path):
        return None
    
    try:
        with open(dockerfile_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        result = {
            'build_command': None,
            'start_command': None,
            'install_command': None,
            'port': None,
            'working_dir': None,
            'env_vars': {}
        }
        
        lines = content.split('\n')
        in_run = False
        run_commands = []
        
        for line in lines:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            
            # Extract WORKDIR
            if line.upper().startswith('WORKDIR'):
                match = re.match(r'WORKDIR\s+(.+)', line, re.IGNORECASE)
                if match:
                    result['working_dir'] = match.group(1).strip()
            
            # Extract EXPOSE port
            if line.upper().startswith('EXPOSE'):
                match = re.match(r'EXPOSE\s+(\d+)', line, re.IGNORECASE)
                if match:
                    result['port'] = int(match.group(1))
            
            # Extract ENV variables
            if line.upper().startswith('ENV'):
                # Handle ENV KEY=value or ENV KEY value
                match = re.match(r'ENV\s+(.+?)(?:\s+|=)(.+)', line, re.IGNORECASE)
                if match:
                    key = match.group(1).strip()
                    value = match.group(2).strip().strip('"\'')
                    result['env_vars'][key] = value
            
            # Extract RUN commands (build/install steps)
            if line.upper().startswith('RUN'):
                # Remove RUN keyword
                cmd = re.sub(r'^RUN\s+', '', line, flags=re.IGNORECASE)
                # Handle multi-line RUN commands
                if cmd.endswith('\\'):
                    in_run = True
                    run_commands.append(cmd.rstrip('\\').strip())
                else:
                    if in_run:
                        run_commands.append(cmd)
                        in_run = False
                        full_cmd = ' && '.join(run_commands)
                        run_commands = []
                    else:
                        full_cmd = cmd
                    
                    # Categorize RUN commands
                    if any(keyword in full_cmd.lower() for keyword in ['npm install', 'yarn install', 'pip install', 'apt-get install', 'apk add']):
                        if not result['install_command']:
                            result['install_command'] = full_cmd
                        else:
                            result['install_command'] += f' && {full_cmd}'
                    elif any(keyword in full_cmd.lower() for keyword in ['npm run build', 'yarn build', 'next build', 'react-scripts build']):
                        if not result['build_command']:
                            result['build_command'] = full_cmd
                        else:
                            result['build_command'] += f' && {full_cmd}'
            
            # Extract CMD or ENTRYPOINT (start command)
            if line.upper().startswith('CMD') or line.upper().startswith('ENTRYPOINT'):
                # Handle JSON format: CMD ["npm", "start"] or shell format: CMD npm start
                if '[' in line and ']' in line:
                    # JSON format
                    match = re.search(r'\[(.*?)\]', line)
                    if match:
                        parts = [p.strip().strip('"\'') for p in match.group(1).split(',')]
                        result['start_command'] = ' '.join(parts)
                else:
                    # Shell format
                    cmd = re.sub(r'^(CMD|ENTRYPOINT)\s+', '', line, flags=re.IGNORECASE)
                    result['start_command'] = cmd.strip()
        
        return result if any([result['build_command'], result['start_command'], result['install_command']]) else None
        
    except Exception as e:
        print(f"Error parsing Dockerfile: {e}")
        return None


def parse_docker_compose(compose_path: str) -> Optional[Dict[str, any]]:
    """
    Parse docker-compose.yml to extract service commands.
    
    Returns:
        Dict with services and their commands, or None if not found
    """
    if not os.path.exists(compose_path):
        return None
    
    try:
        with open(compose_path, 'r', encoding='utf-8') as f:
            content = yaml.safe_load(f)
        
        if not content or 'services' not in content:
            return None
        
        services = {}
        for service_name, service_config in content.get('services', {}).items():
            service_info = {
                'command': service_config.get('command'),
                'build': service_config.get('build'),
                'ports': service_config.get('ports', []),
                'environment': service_config.get('environment', {}),
                'working_dir': service_config.get('working_dir'),
                'volumes': service_config.get('volumes', [])
            }
            
            # Extract port
            if service_info['ports']:
                # Handle format: "8080:3000" or - "8080:3000"
                port_str = str(service_info['ports'][0])
                if ':' in port_str:
                    service_info['port'] = int(port_str.split(':')[0])
                else:
                    service_info['port'] = int(port_str)
            
            # Convert command to string if it's a list
            if isinstance(service_info['command'], list):
                service_info['command'] = ' '.join(service_info['command'])
            
            services[service_name] = service_info
        
        return services if services else None
        
    except Exception as e:
        print(f"Error parsing docker-compose.yml: {e}")
        return None


def detect_monorepo_structure(repo_dir: str) -> Optional[Dict[str, str]]:
    """
    Detect if repository has frontend and backend folders (monorepo).
    
    Returns:
        Dict with 'frontend_dir' and 'backend_dir' if detected, None otherwise
    """
    common_frontend_dirs = ['frontend', 'client', 'web', 'app', 'src/frontend', 'packages/frontend']
    common_backend_dirs = ['backend', 'server', 'api', 'src/backend', 'packages/backend', 'services/backend']
    
    frontend_dir = None
    backend_dir = None
    
    # Check for frontend directory
    for dir_name in common_frontend_dirs:
        potential_path = os.path.join(repo_dir, dir_name)
        if os.path.isdir(potential_path):
            # Check if it looks like a frontend (has package.json, index.html, etc.)
            if (os.path.exists(os.path.join(potential_path, 'package.json')) or
                os.path.exists(os.path.join(potential_path, 'index.html')) or
                os.path.exists(os.path.join(potential_path, 'src', 'index.js')) or
                os.path.exists(os.path.join(potential_path, 'src', 'index.tsx'))):
                frontend_dir = dir_name
                break
    
    # Check for backend directory
    for dir_name in common_backend_dirs:
        potential_path = os.path.join(repo_dir, dir_name)
        if os.path.isdir(potential_path):
            # Check if it looks like a backend (has package.json, requirements.txt, main.py, etc.)
            if (os.path.exists(os.path.join(potential_path, 'package.json')) or
                os.path.exists(os.path.join(potential_path, 'requirements.txt')) or
                os.path.exists(os.path.join(potential_path, 'main.py')) or
                os.path.exists(os.path.join(potential_path, 'app.py')) or
                os.path.exists(os.path.join(potential_path, 'server.js'))):
                backend_dir = dir_name
                break
    
    if frontend_dir or backend_dir:
        return {
            'frontend_dir': frontend_dir,
            'backend_dir': backend_dir,
            'is_monorepo': True
        }
    
    return None

