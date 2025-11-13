"""
VM Manager - OrbStack VM management for user isolation
Creates and manages VMs for each user to isolate deployments
"""

import asyncio
import subprocess
import os
import json
import time
from typing import Optional, Dict, Tuple, List
import logging

logger = logging.getLogger(__name__)


class VMManager:
    """Manages OrbStack VMs for user deployments"""
    
    def __init__(self):
        self.vm_configs: Dict[int, Dict] = {}  # user_id -> VM config
        self.vm_base_image = "ubuntu:22.04"  # Base image for VMs
        self.vm_ssh_keys: Dict[int, str] = {}  # user_id -> SSH key path
    
    async def get_or_create_user_vm(self, user_id: int) -> Dict[str, str]:
        """
        Get or create an OrbStack VM for a user.
        
        Returns:
            Dict with vm_name, vm_id, ssh_host, ssh_port, ssh_user
        """
        vm_name = f"butler-user-{user_id}"
        
        # Check if VM already exists
        existing_vm = await self._check_vm_exists(vm_name)
        if existing_vm:
            logger.info(f"VM {vm_name} already exists, checking status...")
            # Check if VM is still being created
            status = await self._check_vm_status(vm_name)
            if status in ['creating', 'provisioning']:
                # VM exists but is still being created, wait for it
                logger.info(f"VM {vm_name} is still {status}, waiting for completion...")
                creation_complete = await self._wait_for_vm_creation(vm_name, max_wait=600)
                if not creation_complete:
                    logger.warning(f"VM {vm_name} creation did not complete, but continuing...")
                # Re-check status after waiting
                status = await self._check_vm_status(vm_name)
            
            # Get VM info
            vm_info = await self._get_vm_info(vm_name)
            
            # Ensure VM is started and ready
            if status != 'running':
                logger.info(f"Starting VM {vm_name} (current status: {status})...")
                await self._start_vm(vm_name)
                await self._wait_for_vm_ready(vm_name)
            
            # Ensure VM is set up (install dependencies if not already installed)
            # Check if git is installed, if not, run setup automatically
            try:
                git_check = await self.exec_in_vm(vm_name, "which git")
                if git_check.returncode != 0 or not git_check.stdout.strip():
                    logger.info(f"Git not found in VM {vm_name}, running automatic setup...")
                    setup_success = await self._setup_vm(vm_name, vm_info)
                    if setup_success:
                        logger.info(f"VM setup completed successfully for {vm_name}")
                    else:
                        logger.warning(f"VM setup completed with warnings for {vm_name}")
                else:
                    logger.info(f"VM {vm_name} is already set up (dependencies installed)")
            except Exception as e:
                logger.warning(f"Failed to check git installation: {e}, running setup automatically...")
                try:
                    await self._setup_vm(vm_name, vm_info)
                    logger.info(f"VM setup completed for {vm_name} after error recovery")
                except Exception as setup_error:
                    logger.error(f"Failed to run setup for {vm_name}: {setup_error}")
                    # Continue anyway - setup will be retried on first deployment
            
            return vm_info
        
        # Create new VM
        logger.info(f"Creating new VM: {vm_name}")
        vm_info = await self._create_vm(vm_name, user_id)
        
        # Store VM config
        self.vm_configs[user_id] = vm_info
        
        return vm_info
    
    async def _check_vm_exists(self, vm_name: str) -> bool:
        """Check if VM exists using OrbStack CLI"""
        try:
            # Use OrbStack CLI to list machines
            # orbctl list shows all machines
            result = await asyncio.to_thread(
                subprocess.run,
                ["orbctl", "list"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                # Parse output to check if VM exists
                # orbctl list output format: NAME    STATUS    ...
                for line in result.stdout.split('\n'):
                    if line.strip() and not line.startswith('NAME'):
                        parts = line.split()
                        if parts and parts[0] == vm_name:
                            return True
                return False
            else:
                error_msg = result.stderr or result.stdout or "Unknown error"
                logger.warning(f"Failed to check VM existence: {error_msg}")
                # If orbctl list fails, OrbStack might not be running
                if "not running" in error_msg.lower() or "connection refused" in error_msg.lower():
                    raise RuntimeError("OrbStack is not running. Please start OrbStack and try again.")
                return False
        except FileNotFoundError:
            logger.error("OrbStack CLI (orbctl) not found. Please install OrbStack.")
            raise RuntimeError("OrbStack CLI not found. Please install OrbStack from https://orbstack.dev")
        except RuntimeError:
            # Re-raise RuntimeError (like "OrbStack not running")
            raise
        except Exception as e:
            logger.error(f"Error checking VM existence: {e}")
            raise RuntimeError(f"Failed to check VM existence: {str(e)}")
    
    async def _check_vm_status(self, vm_name: str) -> Optional[str]:
        """Check VM status (creating, running, stopped, etc.)"""
        try:
            result = await asyncio.to_thread(
                subprocess.run,
                ["orbctl", "list"],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                # Parse output to get VM status
                # orbctl list output format: NAME    STATUS    ...
                for line in result.stdout.split('\n'):
                    if line.strip() and not line.startswith('NAME'):
                        parts = line.split()
                        if parts and parts[0] == vm_name:
                            # Status is typically the second column
                            if len(parts) > 1:
                                return parts[1].lower()  # e.g., "creating", "running", "stopped"
                return None
            return None
        except Exception as e:
            logger.error(f"Error checking VM status: {e}")
            return None
    
    async def _wait_for_vm_creation(self, vm_name: str, max_wait: int = 600) -> bool:
        """Wait for VM to finish creating (status changes from 'creating' to 'running' or 'stopped')"""
        start_time = time.time()
        max_attempts = max_wait // 5  # Check every 5 seconds
        
        for attempt in range(max_attempts):
            status = await self._check_vm_status(vm_name)
            
            if status is None:
                # VM doesn't exist yet
                if attempt % 6 == 0:  # Log every 30 seconds
                    logger.info(f"Waiting for VM {vm_name} to appear... (attempt {attempt + 1}/{max_attempts})")
                await asyncio.sleep(5)
                continue
            
            if status in ['running', 'stopped']:
                # VM creation is complete
                elapsed = time.time() - start_time
                logger.info(f"VM {vm_name} creation completed with status: {status} (took {elapsed:.0f}s)")
                return True
            
            if status in ['creating', 'provisioning']:
                # Still creating/provisioning, wait a bit more
                elapsed = time.time() - start_time
                if attempt % 6 == 0:  # Log every 30 seconds
                    logger.info(f"VM {vm_name} status: {status}... (elapsed: {elapsed:.0f}s, attempt {attempt + 1}/{max_attempts})")
                await asyncio.sleep(5)
                continue
            
            # Unknown status, but VM exists - might be ready
            logger.warning(f"VM {vm_name} has status: {status}, assuming it's ready")
            return True
        
        # Timeout
        elapsed = time.time() - start_time
        logger.error(f"VM {vm_name} creation timed out after {elapsed:.0f} seconds")
        return False
    
    async def _create_vm(self, vm_name: str, user_id: int) -> Dict[str, str]:
        """Create a new OrbStack VM"""
        try:
            # Create VM using OrbStack
            # OrbStack creates Linux machines (not Docker containers)
            logger.info(f"Creating VM: {vm_name}")
            
            # Create VM using OrbStack CLI
            # orbctl create <distro>[:version] [machine_name]
            # Format: orbctl create ubuntu:22.04 <vm_name>
            create_cmd = [
                "orbctl", "create",
                "ubuntu:22.04",
                vm_name
            ]
            
            # Create VM - orbctl create returns quickly and VM creation continues in background
            # So we run the command with a shorter timeout and then poll for completion
            logger.info(f"Starting VM creation: {vm_name}")
            try:
                result = await asyncio.wait_for(
                    asyncio.to_thread(
                        subprocess.run,
                        create_cmd,
                        capture_output=True,
                        text=True,
                        timeout=30  # Command should return quickly
                    ),
                    timeout=35.0
                )
            except asyncio.TimeoutError:
                # Command might be taking longer, check if VM was started
                logger.warning(f"VM creation command timed out after 30s, checking if VM exists...")
                if await self._check_vm_exists(vm_name):
                    logger.info(f"VM {vm_name} exists despite timeout, continuing...")
                    result = type('obj', (object,), {'returncode': 0, 'stdout': '', 'stderr': ''})()
                else:
                    raise RuntimeError(f"VM creation command timed out and VM does not exist")
            
            if result.returncode != 0:
                error_msg = f"Failed to create VM: {result.stderr}"
                logger.error(error_msg)
                # Check if VM already exists (might have been created partially)
                if await self._check_vm_exists(vm_name):
                    logger.info(f"VM {vm_name} exists after failed create command, continuing...")
                else:
                    raise RuntimeError(error_msg)
            
            # Wait for VM creation to complete (polling for status)
            logger.info(f"Waiting for VM {vm_name} to finish creating...")
            creation_complete = await self._wait_for_vm_creation(vm_name, max_wait=600)  # 10 minutes max
            
            if not creation_complete:
                # Check if VM exists anyway
                if await self._check_vm_exists(vm_name):
                    logger.warning(f"VM {vm_name} exists but creation may not be complete, continuing anyway...")
                else:
                    raise RuntimeError(f"VM {vm_name} creation did not complete within 10 minutes")
            
            # Wait a moment for VM to stabilize
            await asyncio.sleep(2)
            
            # Start VM
            await self._start_vm(vm_name)
            
            # Wait for VM to be fully started
            await self._wait_for_vm_ready(vm_name)
            
            # Get VM info
            vm_info = await self._get_vm_info(vm_name)
            
            # Setup VM (install dependencies, create user, etc.)
            await self._setup_vm(vm_name, vm_info)
            
            return vm_info
            
        except Exception as e:
            logger.error(f"Error creating VM: {e}")
            raise
    
    async def _start_vm(self, vm_name: str) -> bool:
        """Start an OrbStack VM"""
        try:
            # orbctl start <name>
            result = await asyncio.to_thread(
                subprocess.run,
                ["orbctl", "start", vm_name],
                capture_output=True,
                text=True,
                timeout=30
            )
            return result.returncode == 0
        except Exception as e:
            logger.error(f"Error starting VM: {e}")
            return False
    
    async def _wait_for_vm_ready(self, vm_name: str, timeout: int = 60) -> bool:
        """Wait for VM to be ready (accessible via orbctl run)"""
        max_attempts = timeout // 2
        for attempt in range(max_attempts):
            try:
                # Try to execute a simple command to check if VM is ready
                if await self._check_ssh_accessible(vm_name):
                    return True
                
                await asyncio.sleep(2)
            except Exception as e:
                logger.debug(f"Waiting for VM ready (attempt {attempt + 1}): {e}")
                await asyncio.sleep(2)
        
        return False
    
    async def _check_ssh_accessible(self, vm_name: str) -> bool:
        """Check if VM is accessible via orbctl run"""
        try:
            # Try to execute a simple command via orbctl run
            # Correct syntax: orbctl --machine <vm_name> run <command>
            result = await asyncio.to_thread(
                subprocess.run,
                ["orbctl", "--machine", vm_name, "run", "echo", "test"],
                capture_output=True,
                text=True,
                timeout=5
            )
            return result.returncode == 0
        except Exception:
            return False
    
    async def _get_vm_info(self, vm_name: str) -> Dict[str, str]:
        """Get VM information (IP, ports, etc.)"""
        try:
            # OrbStack VMs are accessible via localhost
            # Ports are automatically forwarded from VM to host
            # We can use orbctl run to execute commands
            vm_ip = "127.0.0.1"  # VMs are accessible via localhost
            
            # Try to get VM IP by running hostname -I in the VM
            # Only if VM is ready (don't call exec_in_vm if VM might not be ready)
            try:
                # Simple command to get IP
                # Correct syntax: orbctl --machine <vm_name> run <command>
                result = await asyncio.to_thread(
                    subprocess.run,
                    ["orbctl", "--machine", vm_name, "run", "hostname", "-I"],
                    capture_output=True,
                    text=True,
                    timeout=5
                )
                if result.returncode == 0 and result.stdout.strip():
                    vm_ip = result.stdout.strip().split()[0]
            except Exception:
                pass  # Use default IP if command fails
            
            return {
                "vm_name": vm_name,
                "vm_ip": vm_ip,
                "ssh_host": "localhost",
                "ssh_port": "22",
                "ssh_user": "root",
                "exec_method": "orbctl"  # Use orbctl run
            }
        except Exception as e:
            logger.error(f"Error getting VM info: {e}")
            return {
                "vm_name": vm_name,
                "vm_ip": "127.0.0.1",
                "ssh_host": "localhost",
                "ssh_port": "22",
                "ssh_user": "root",
                "exec_method": "orbctl"
            }
    
    async def _setup_vm(self, vm_name: str, vm_info: Dict[str, str]) -> bool:
        """Setup VM with necessary dependencies automatically"""
        try:
            logger.info(f"Starting automatic VM setup for: {vm_name}")
            
            # Install basic dependencies (use sudo for all commands)
            # These commands are run automatically when VM is created
            setup_commands = [
                # Update package list (required first)
                {
                    "cmd": "sudo apt-get update -y",
                    "name": "Update package list",
                    "required": True
                },
                # Install essential tools (git, curl, wget, python3, etc.)
                {
                    "cmd": "sudo apt-get install -y git curl wget python3 python3-pip build-essential",
                    "name": "Install essential tools",
                    "required": True
                },
                # Install Node.js LTS version
                {
                    "cmd": "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash - && sudo apt-get install -y nodejs",
                    "name": "Install Node.js",
                    "required": False  # Optional, can skip if fails
                },
                # Create projects directory in user's home directory with proper permissions
                # Get username first, then create projects directory
                {
                    "cmd": "mkdir -p ~/projects && chmod 755 ~/projects",
                    "name": "Create projects directory in home",
                    "required": True
                },
                # Install process manager (PM2) for Node.js apps (globally)
                {
                    "cmd": "sudo npm install -g pm2",
                    "name": "Install PM2",
                    "required": False  # Optional, can skip if fails
                },
                # Install Python package manager (upgrade pip)
                {
                    "cmd": "sudo pip3 install --upgrade pip",
                    "name": "Upgrade pip",
                    "required": False  # Optional, can skip if fails
                },
        # Install Cloudflare CLI (cloudflared) for tunnel management
        {
            "cmd": "curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cloudflared.deb && sudo dpkg -i /tmp/cloudflared.deb || sudo apt-get install -f -y && rm /tmp/cloudflared.deb",
            "name": "Install cloudflared",
            "required": False  # Optional, can skip if fails
        },
            ]
            
            success_count = 0
            failed_required = []
            
            for setup_item in setup_commands:
                cmd = setup_item["cmd"]
                name = setup_item["name"]
                required = setup_item.get("required", True)
                
                try:
                    logger.info(f"Running setup step: {name}...")
                    result = await self.exec_in_vm(vm_name, cmd)
                    if result.returncode != 0:
                        error_output = result.stderr or result.stdout or "Unknown error"
                        if required:
                            logger.error(f"Required setup step failed: {name} - {error_output}")
                            failed_required.append(name)
                        else:
                            logger.warning(f"Optional setup step failed: {name} - {error_output}")
                    else:
                        logger.info(f"Setup step completed: {name}")
                        success_count += 1
                except Exception as e:
                    if required:
                        logger.error(f"Required setup step failed: {name} - {str(e)}")
                        failed_required.append(name)
                    else:
                        logger.warning(f"Optional setup step failed: {name} - {str(e)}")
            
            # Verify critical dependencies are installed
            logger.info(f"Verifying critical dependencies for {vm_name}...")
            critical_deps = {
                "git": "which git",
                "python3": "which python3",
                "curl": "which curl"
            }
            
            missing_deps = []
            for dep_name, check_cmd in critical_deps.items():
                try:
                    check_result = await self.exec_in_vm(vm_name, check_cmd)
                    if check_result.returncode != 0 or not check_result.stdout.strip():
                        missing_deps.append(dep_name)
                        logger.warning(f"Critical dependency not found: {dep_name}")
                except Exception as e:
                    logger.warning(f"Failed to check dependency {dep_name}: {e}")
                    missing_deps.append(dep_name)
            
            if failed_required:
                logger.error(f"VM setup failed for {vm_name}: Required steps failed - {', '.join(failed_required)}")
                return False
            
            if missing_deps:
                logger.warning(f"VM setup completed for {vm_name} but some dependencies are missing: {', '.join(missing_deps)}")
                # Try to install missing dependencies
                if "git" in missing_deps:
                    logger.info(f"Retrying git installation for {vm_name}...")
                    git_result = await self.exec_in_vm(vm_name, "sudo apt-get install -y git")
                    if git_result.returncode == 0:
                        logger.info(f"Git installed successfully for {vm_name}")
                    else:
                        logger.error(f"Failed to install git for {vm_name}")
                        return False
            
            logger.info(f"VM setup completed successfully for {vm_name} ({success_count}/{len(setup_commands)} steps completed)")
            return True
            
        except Exception as e:
            logger.error(f"Error setting up VM {vm_name}: {e}", exc_info=True)
            return False
    
    async def exec_in_vm(self, vm_name: str, command: str, cwd: Optional[str] = None, env: Optional[Dict[str, str]] = None) -> subprocess.CompletedProcess:
        """Execute command in VM using orbctl run"""
        try:
            # Correct syntax: orbctl --machine <vm_name> run <command>
            # Or: orbctl run -m <vm_name> <command>
            # We use --machine flag to specify the VM name
            
            # Build the command with working directory and environment variables
            parts = []
            
            # Set working directory if provided (use cd command)
            if cwd:
                parts.append(f"cd {cwd}")
            
            # Export environment variables if provided
            # Use export to ensure they're available to the command and any subprocesses
            if env:
                # Escape values properly for shell
                export_statements = []
                for key, value in env.items():
                    # Escape single quotes in value by replacing ' with '\''
                    escaped_value = str(value).replace("'", "'\"'\"'")
                    export_statements.append(f"export {key}='{escaped_value}'")
                parts.extend(export_statements)
            
            # Add the actual command
            parts.append(command)
            
            # Join all parts
            if len(parts) > 1:
                full_command = " && ".join(parts)
            else:
                full_command = command
            
            # Execute with sh -c using --machine flag
            # Syntax: orbctl --machine <vm_name> run sh -c "<command>"
            exec_cmd = ["orbctl", "--machine", vm_name, "run", "sh", "-c", full_command]
            
            result = await asyncio.to_thread(
                subprocess.run,
                exec_cmd,
                capture_output=True,
                text=True,
                timeout=600  # 10 minute timeout
            )
            return result
        except Exception as e:
            logger.error(f"Error executing command in VM {vm_name}: {e}")
            raise
    
    async def copy_to_vm(self, vm_name: str, local_path: str, remote_path: str) -> bool:
        """Copy file/directory to VM"""
        try:
            # Use orbctl push to copy files to VM
            # orbctl push <local> <machine>:<remote>
            result = await asyncio.to_thread(
                subprocess.run,
                ["orbctl", "push", local_path, f"{vm_name}:{remote_path}"],
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout for large files
            )
            return result.returncode == 0
        except Exception as e:
            logger.error(f"Error copying to VM: {e}")
            return False
    
    async def copy_from_vm(self, vm_name: str, remote_path: str, local_path: str) -> bool:
        """Copy file/directory from VM"""
        try:
            # Use orbctl pull to copy files from VM
            # orbctl pull <machine>:<remote> <local>
            result = await asyncio.to_thread(
                subprocess.run,
                ["orbctl", "pull", f"{vm_name}:{remote_path}", local_path],
                capture_output=True,
                text=True,
                timeout=300
            )
            return result.returncode == 0
        except Exception as e:
            logger.error(f"Error copying from VM: {e}")
            return False
    
    async def find_free_host_port(self, start_port: int = 6001, max_port: int = 6999) -> Optional[int]:
        """Find a free port on the host machine starting from start_port"""
        import socket
        for port in range(start_port, max_port + 1):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.bind(('localhost', port))
                    return port
            except OSError:
                continue
        logger.error(f"No free port found in range {start_port}-{max_port}")
        return None
    
    async def setup_port_forwarding(self, vm_name: str, host_port: int, vm_port: int) -> bool:
        """Set up OrbStack port forwarding from host_port to VM's vm_port"""
        try:
            # OrbStack handles port forwarding automatically when services bind to 0.0.0.0
            # The VM service should bind to 0.0.0.0:vm_port, and OrbStack will forward it
            # to localhost:host_port on the Mac host automatically.
            # 
            # However, we can also manually set up port forwarding using:
            # orbctl port-forward <vm_name> <host_port>:<vm_port>
            # Or via OrbStack UI/API if available
            
            # Try the port-forward command (without 'vm' subcommand)
            result = await asyncio.to_thread(
                subprocess.run,
                ["orbctl", "port-forward", vm_name, f"{host_port}:{vm_port}"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                logger.info(f"✅ Port forwarding set up: localhost:{host_port} -> {vm_name}:{vm_port}")
                return True
            else:
                # OrbStack may handle port forwarding automatically when services bind to 0.0.0.0
                # If the service in the VM binds to 0.0.0.0:vm_port, OrbStack forwards it automatically
                logger.info(f"Port forwarding command not available or not needed (OrbStack may handle automatically)")
                logger.info(f"Ensure service in VM binds to 0.0.0.0:{vm_port} for automatic forwarding")
                return True  # Assume it works - OrbStack handles it automatically
        except Exception as e:
            logger.info(f"Port forwarding setup skipped (OrbStack handles automatically): {e}")
            # OrbStack handles port forwarding automatically when services bind to 0.0.0.0
            return True
    
    async def get_vm_port_mapping(self, vm_name: str, container_port: int) -> Optional[int]:
        """Get host port mapping for VM container port (deprecated - use find_free_host_port + setup_port_forwarding)"""
        # This is kept for backward compatibility
        # New code should use find_free_host_port() and setup_port_forwarding()
        return container_port
    
    async def stop_vm(self, vm_name: str) -> bool:
        """Stop an OrbStack VM"""
        try:
            # orbctl stop <name>
            result = await asyncio.to_thread(
                subprocess.run,
                ["orbctl", "stop", vm_name],
                capture_output=True,
                text=True,
                timeout=30
            )
            return result.returncode == 0
        except Exception as e:
            logger.error(f"Error stopping VM: {e}")
            return False
    
    async def delete_vm(self, vm_name: str, user_id: int) -> bool:
        """Delete an OrbStack VM completely"""
        try:
            logger.info(f"Starting VM deletion process for {vm_name} (user {user_id})...")
            
            # First, check if VM exists
            vm_exists = await self._check_vm_exists(vm_name)
            if not vm_exists:
                logger.warning(f"VM {vm_name} does not exist, nothing to delete")
                # Remove from config anyway
                if user_id in self.vm_configs:
                    del self.vm_configs[user_id]
                return True  # Consider it successful if VM doesn't exist
            
            # Stop VM first (if it's running)
            logger.info(f"Stopping VM {vm_name} before deletion...")
            stop_result = await self.stop_vm(vm_name)
            if not stop_result:
                logger.warning(f"Failed to stop VM {vm_name}, attempting deletion anyway...")
            
            # Wait a moment for VM to fully stop
            await asyncio.sleep(2)
            
            # Delete VM using orbctl delete with --force flag
            # Use --force to avoid any confirmation prompts
            logger.info(f"Deleting VM {vm_name} with force flag...")
            delete_cmd = ["orbctl", "delete", "--force", vm_name]
            result = await asyncio.to_thread(
                subprocess.run,
                delete_cmd,
                capture_output=True,
                text=True,
                timeout=60  # Increase timeout for deletion
            )
            
            # Log the output for debugging
            logger.info(f"orbctl delete --force stdout: {result.stdout}")
            logger.info(f"orbctl delete --force stderr: {result.stderr}")
            logger.info(f"orbctl delete --force returncode: {result.returncode}")
            
            # Wait a moment for deletion to complete
            await asyncio.sleep(3)
            
            # Verify VM was actually deleted
            vm_still_exists = await self._check_vm_exists(vm_name)
            
            if result.returncode == 0 and not vm_still_exists:
                logger.info(f"VM {vm_name} successfully deleted")
                # Remove from config
                if user_id in self.vm_configs:
                    del self.vm_configs[user_id]
                    logger.info(f"Removed VM config for user {user_id}")
                return True
            elif vm_still_exists:
                # VM still exists, try alternative deletion methods
                logger.error(f"VM {vm_name} still exists after delete --force command")
                logger.info(f"Attempting alternative deletion methods for VM {vm_name}...")
                
                # Try with -f flag (shorthand for --force)
                try:
                    logger.info(f"Attempting deletion with -f flag for VM {vm_name}...")
                    last_result = await asyncio.to_thread(
                        subprocess.run,
                        ["orbctl", "delete", "-f", vm_name],
                        capture_output=True,
                        text=True,
                        timeout=60
                    )
                    await asyncio.sleep(3)
                    vm_still_exists_last = await self._check_vm_exists(vm_name)
                    if not vm_still_exists_last:
                        logger.info(f"VM {vm_name} deleted successfully with -f flag")
                        if user_id in self.vm_configs:
                            del self.vm_configs[user_id]
                        return True
                    else:
                        logger.error(f"VM {vm_name} still exists after -f flag deletion attempt")
                        logger.error(f"Delete command output: {last_result.stdout}")
                        logger.error(f"Delete command error: {last_result.stderr}")
                        return False
                except Exception as last_error:
                    logger.error(f"Last resort deletion method failed: {last_error}")
                    return False
            else:
                # Command failed but VM might still be deleted
                error_msg = f"Delete command returned non-zero: {result.stderr or result.stdout}"
                logger.error(error_msg)
                if not vm_still_exists:
                    # VM was deleted despite error code
                    logger.info(f"VM {vm_name} was deleted (verified, despite error code)")
                    if user_id in self.vm_configs:
                        del self.vm_configs[user_id]
                    return True
                else:
                    logger.error(f"VM {vm_name} still exists after failed delete attempt")
                    return False
        except Exception as e:
            logger.error(f"Error deleting VM {vm_name}: {e}", exc_info=True)
            # Try to verify if VM was deleted despite the exception
            try:
                vm_still_exists = await self._check_vm_exists(vm_name)
                if not vm_still_exists:
                    logger.info(f"VM {vm_name} was deleted despite exception")
                    # Remove from config
                    if user_id in self.vm_configs:
                        del self.vm_configs[user_id]
                    return True
            except Exception as check_error:
                logger.error(f"Error checking VM existence after deletion exception: {check_error}")
            return False
    
    async def list_user_vms(self, user_id: Optional[int] = None) -> List[Dict[str, str]]:
        """List VMs for a user or all VMs"""
        try:
            # orbctl list shows all machines
            result = await asyncio.to_thread(
                subprocess.run,
                ["orbctl", "list"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                vms = []
                for line in result.stdout.split('\n'):
                    if line.strip() and not line.startswith('NAME'):
                        # Parse line to get VM name
                        parts = line.split()
                        if parts:
                            vm_name = parts[0]
                            if user_id:
                                # Filter by user ID
                                if vm_name.startswith(f"butler-user-{user_id}"):
                                    vms.append({"name": vm_name})
                            else:
                                if vm_name.startswith("butler-user-"):
                                    vms.append({"name": vm_name})
                return vms
            return []
        except Exception as e:
            logger.error(f"Error listing VMs: {e}")
            return []


# Global VM manager instance
vm_manager = VMManager()

