import os
import json
import yaml
import asyncio
import subprocess
import socket
from typing import Dict, List, Tuple

class DeploymentValidator:
    """
    Validates deployment configurations and dependencies before running docker-compose.
    """
    
    def __init__(self, repo_dir: str):
        self.repo_dir = repo_dir
        # Check for both .yml and .yaml extensions
        compose_yml = os.path.join(repo_dir, 'docker-compose.yml')
        compose_yaml = os.path.join(repo_dir, 'docker-compose.yaml')
        
        if os.path.exists(compose_yml):
            self.compose_file = compose_yml
        elif os.path.exists(compose_yaml):
            self.compose_file = compose_yaml
        else:
            self.compose_file = compose_yml  # Default for error message
        
        self.issues = []
        self.warnings = []
    
    async def validate_deployment(self) -> Tuple[bool, List[str], List[str]]:
        """
        Perform comprehensive deployment validation.
        Returns: (is_valid, issues, warnings)
        """
        print("🔍 Starting deployment validation...")
        
        # Reset issues and warnings
        self.issues = []
        self.warnings = []
        
        # Check if docker-compose file exists
        if not os.path.exists(self.compose_file):
            self.issues.append(f"Docker compose file not found: {self.compose_file}")
            return False, self.issues, self.warnings
        
        # Parse docker-compose file
        compose_config = await self._parse_compose_file()
        if not compose_config:
            return False, self.issues, self.warnings
        
        # Validate services
        await self._validate_services(compose_config)
        
        # Check for missing files
        await self._check_missing_files(compose_config)
        
        # Validate Docker environment
        await self._validate_docker_environment()
        
        # Check for common issues
        await self._check_common_issues(compose_config)
        
        is_valid = len(self.issues) == 0
        
        # Print results
        if self.warnings:
            print("⚠️ Warnings found:")
            for warning in self.warnings:
                print(f"  • {warning}")
        
        if self.issues:
            print("❌ Issues found:")
            for issue in self.issues:
                print(f"  • {issue}")
        else:
            print("✅ Deployment validation passed")
        
        return is_valid, self.issues, self.warnings
    
    async def _parse_compose_file(self) -> dict:
        """Parse the docker-compose.yml file."""
        try:
            with open(self.compose_file, 'r') as f:
                content = f.read()
                
            # Check for obsolete version attribute
            if 'version:' in content:
                self.warnings.append("Obsolete 'version' attribute found in docker-compose.yml - consider removing it")
            
            compose_config = yaml.safe_load(content)
            return compose_config
            
        except yaml.YAMLError as e:
            self.issues.append(f"Invalid YAML in docker-compose.yml: {e}")
            return None
        except Exception as e:
            self.issues.append(f"Error reading docker-compose.yml: {e}")
            return None
    
    async def _validate_services(self, compose_config: dict):
        """Validate individual services in the compose file."""
        services = compose_config.get('services', {})
        
        if not services:
            self.issues.append("No services defined in docker-compose.yml")
            return
        
        print(f"📋 Validating {len(services)} services...")
        
        for service_name, service_config in services.items():
            print(f"  🔍 Validating service: {service_name}")
            
            # Check for build context
            if 'build' in service_config:
                build_config = service_config['build']
                if isinstance(build_config, str):
                    build_path = os.path.join(self.repo_dir, build_config)
                elif isinstance(build_config, dict):
                    context = build_config.get('context', '.')
                    build_path = os.path.join(self.repo_dir, context)
                else:
                    self.issues.append(f"Invalid build configuration for service '{service_name}'")
                    continue
                
                if not os.path.exists(build_path):
                    self.issues.append(f"Build context not found for service '{service_name}': {build_path}")
                
                # Check for Dockerfile
                dockerfile_path = os.path.join(build_path, 'Dockerfile')
                if not os.path.exists(dockerfile_path):
                    self.warnings.append(f"No Dockerfile found for service '{service_name}' in {build_path}")
            
            # Check volume mounts
            volumes = service_config.get('volumes', [])
            for volume in volumes:
                if isinstance(volume, str) and ':' in volume:
                    host_path = volume.split(':')[0]
                    if host_path.startswith('./') or not host_path.startswith('/'):
                        # Relative path - check if it exists
                        full_path = os.path.join(self.repo_dir, host_path)
                        if not os.path.exists(full_path):
                            self.warnings.append(f"Volume mount source not found for service '{service_name}': {host_path}")
    
    async def _check_missing_files(self, compose_config: dict):
        """Check for commonly missing files that might cause container failures."""
        services = compose_config.get('services', {})
        
        for service_name, service_config in services.items():
            # Check for database initialization files
            if any(db in service_name.lower() for db in ['mongo', 'mysql', 'postgres']):
                volumes = service_config.get('volumes', [])
                for volume in volumes:
                    if isinstance(volume, str) and ':' in volume:
                        host_path, container_path = volume.split(':', 1)
                        
                        # Check for common database init files
                        if any(pattern in container_path.lower() for pattern in ['/docker-entrypoint-initdb.d', '/data']):
                            if host_path.startswith('./'):
                                full_path = os.path.join(self.repo_dir, host_path)
                                if not os.path.exists(full_path):
                                    self.warnings.append(f"Database init directory not found for '{service_name}': {host_path}")
                                elif os.path.isdir(full_path) and not os.listdir(full_path):
                                    self.warnings.append(f"Database init directory is empty for '{service_name}': {host_path}")
            
            # Check for environment files
            env_file = service_config.get('env_file')
            if env_file:
                if isinstance(env_file, str):
                    env_files = [env_file]
                else:
                    env_files = env_file
                
                for env_file_path in env_files:
                    full_env_path = os.path.join(self.repo_dir, env_file_path)
                    if not os.path.exists(full_env_path):
                        self.issues.append(f"Environment file not found for service '{service_name}': {env_file_path}")
    
    async def _validate_docker_environment(self):
        """Validate Docker environment and connectivity."""
        try:
            # Check if Docker is running
            result = await asyncio.to_thread(subprocess.run, 
                ['docker', 'version'], 
                capture_output=True, 
                text=True
            )
            
            if result.returncode != 0:
                self.issues.append("Docker is not running or not accessible")
                return
            
            # Check Docker Compose
            result = await asyncio.to_thread(subprocess.run, 
                ['docker', 'compose', 'version'], 
                capture_output=True, 
                text=True
            )
            
            if result.returncode != 0:
                self.issues.append("Docker Compose is not available")
                return
            
            print("✅ Docker environment validated")
            
        except Exception as e:
            self.issues.append(f"Error validating Docker environment: {e}")
    
    async def _check_common_issues(self, compose_config: dict):
        """Check for common deployment issues."""
        services = compose_config.get('services', {})
        
        # Check for port conflicts
        used_ports = []
        for service_name, service_config in services.items():
            ports = service_config.get('ports', [])
            for port_mapping in ports:
                if isinstance(port_mapping, str) and ':' in port_mapping:
                    host_port = port_mapping.split(':')[0]
                    if host_port in used_ports:
                        self.issues.append(f"Port conflict detected: {host_port} is used by multiple services")
                    else:
                        used_ports.append(host_port)
        
        # Check for network configurations
        networks = compose_config.get('networks', {})
        service_networks = []
        
        for service_name, service_config in services.items():
            service_network_config = service_config.get('networks')
            if service_network_config:
                if isinstance(service_network_config, list):
                    service_networks.extend(service_network_config)
                elif isinstance(service_network_config, dict):
                    service_networks.extend(service_network_config.keys())
        
        # Check if referenced networks are defined
        for network in service_networks:
            if network not in networks and network not in ['default']:
                self.warnings.append(f"Service references undefined network: {network}")
    
    def _is_port_in_use(self, port: int) -> bool:
        """Check if a port is currently in use."""
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
                sock.settimeout(1)
                result = sock.connect_ex(('localhost', port))
                return result == 0
        except Exception:
            return False
    
    def _find_available_port(self, preferred_port: int) -> int:
        """Find an available port starting from preferred_port."""
        port = preferred_port
        while port < preferred_port + 100:  # Check up to 100 ports ahead
            if not self._is_port_in_use(port):
                return port
            port += 1
        return preferred_port  # Return original if no available port found
    
    async def fix_port_conflicts(self) -> bool:
        """Automatically fix port conflicts in docker-compose file."""
        try:
            compose_config = await self._parse_compose_file()
            if not compose_config:
                return False
            
            services = compose_config.get('services', {})
            port_changes = []
            modified = False
            
            print("🔧 Checking and fixing port conflicts...")
            
            for service_name, service_config in services.items():
                ports = service_config.get('ports', [])
                new_ports = []
                
                for port_mapping in ports:
                    if isinstance(port_mapping, str) and ':' in port_mapping:
                        host_port_str, container_port = port_mapping.split(':', 1)
                        try:
                            host_port = int(host_port_str)
                            
                            if self._is_port_in_use(host_port):
                                new_port = self._find_available_port(host_port + 1)
                                new_mapping = f"{new_port}:{container_port}"
                                new_ports.append(new_mapping)
                                port_changes.append((service_name, host_port, new_port))
                                modified = True
                                print(f"🔧 Fixed port conflict for {service_name}: {host_port} -> {new_port}")
                            else:
                                new_ports.append(port_mapping)
                        except ValueError:
                            # Not a numeric port, keep as is
                            new_ports.append(port_mapping)
                    else:
                        new_ports.append(port_mapping)
                
                if new_ports != ports:
                    service_config['ports'] = new_ports
            
            # Save the modified compose file
            if modified:
                backup_file = f"{self.compose_file}.backup"
                
                # Create backup
                import shutil
                shutil.copy2(self.compose_file, backup_file)
                print(f"📄 Created backup: {os.path.basename(backup_file)}")
                
                # Write modified config
                with open(self.compose_file, 'w') as f:
                    yaml.dump(compose_config, f, default_flow_style=False, sort_keys=False)
                
                print(f"✅ Updated docker-compose file with {len(port_changes)} port fixes")
                
                # Update any environment variables that reference the old ports
                await self._update_environment_variables(port_changes, compose_config)
                
                return True
            else:
                print("✅ No port conflicts detected")
                return True
                
        except Exception as e:
            print(f"❌ Error fixing port conflicts: {e}")
            return False
    
    async def _update_environment_variables(self, port_changes: list, compose_config: dict):
        """Update environment variables that reference changed ports."""
        try:
            services = compose_config.get('services', {})
            env_updates = []
            
            for service_name, old_port, new_port in port_changes:
                # Look for environment variables that reference the old port
                for svc_name, svc_config in services.items():
                    environment = svc_config.get('environment', [])
                    if isinstance(environment, dict):
                        env_items = list(environment.items())
                    elif isinstance(environment, list):
                        env_items = [item.split('=', 1) for item in environment if '=' in item]
                    else:
                        continue
                    
                    modified_env = False
                    for i, (key, value) in enumerate(env_items):
                        if isinstance(value, str) and str(old_port) in value:
                            new_value = value.replace(str(old_port), str(new_port))
                            env_items[i] = (key, new_value)
                            env_updates.append((svc_name, key, value, new_value))
                            modified_env = True
                    
                    # Update the environment in the config
                    if modified_env:
                        if isinstance(environment, dict):
                            svc_config['environment'] = dict(env_items)
                        else:
                            svc_config['environment'] = [f"{k}={v}" for k, v in env_items]
            
            if env_updates:
                # Write the updated config
                with open(self.compose_file, 'w') as f:
                    yaml.dump(compose_config, f, default_flow_style=False, sort_keys=False)
                
                print(f"🔧 Updated {len(env_updates)} environment variable(s) with new ports")
                for svc, key, old_val, new_val in env_updates:
                    print(f"  • {svc}.{key}: {old_val} -> {new_val}")
                    
        except Exception as e:
            print(f"⚠️ Error updating environment variables: {e}")
    
    async def create_missing_directories(self) -> bool:
        """Create any missing directories that are safe to create."""
        try:
            compose_config = await self._parse_compose_file()
            if not compose_config:
                return False
            
            services = compose_config.get('services', {})
            created_dirs = []
            
            for service_name, service_config in services.items():
                volumes = service_config.get('volumes', [])
                for volume in volumes:
                    if isinstance(volume, str) and ':' in volume:
                        host_path = volume.split(':')[0]
                        if host_path.startswith('./'):
                            full_path = os.path.join(self.repo_dir, host_path)
                            if not os.path.exists(full_path):
                                try:
                                    os.makedirs(full_path, exist_ok=True)
                                    created_dirs.append(full_path)
                                    print(f"✅ Created missing directory: {host_path}")
                                except Exception as e:
                                    print(f"⚠️ Could not create directory {host_path}: {e}")
            
            if created_dirs:
                print(f"📁 Created {len(created_dirs)} missing directories")
            
            return True
            
        except Exception as e:
            print(f"❌ Error creating missing directories: {e}")
            return False

async def validate_and_prepare_deployment(repo_dir: str) -> Tuple[bool, List[str], List[str]]:
    """
    Convenience function to validate and prepare a deployment.
    """
    validator = DeploymentValidator(repo_dir)
    
    # Create missing directories first
    await validator.create_missing_directories()
    
    # Fix port conflicts
    print("\n🔧 Checking for and fixing port conflicts...")
    await validator.fix_port_conflicts()
    
    # Then validate
    is_valid, issues, warnings = await validator.validate_deployment()
    
    return is_valid, issues, warnings
