"""
Process Manager - Direct process execution (like Vercel/Netlify)
Manages processes without Docker containerization.
"""

import asyncio
import subprocess
import os
import signal
import psutil
import socket
import re
from typing import Optional, Dict, Tuple
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


class ProcessManager:
    """Manages processes for deployments - start, stop, restart, logs"""
    
    def __init__(self):
        self.processes: Dict[str, subprocess.Popen] = {}
        self.process_logs: Dict[str, list] = {}
    
    async def start_process(
        self,
        project_id: str,
        command: str,
        cwd: str,
        env: Optional[Dict[str, str]] = None,
        port: Optional[int] = None
    ) -> Tuple[bool, Optional[int], Optional[str]]:
        """
        Start a process for a project.
        
        Args:
            project_id: Unique project identifier
            command: Command to run (e.g., "npm run start")
            cwd: Working directory
            env: Environment variables
            port: Port number (if specified, sets PORT env var)
        
        Returns:
            Tuple of (success, pid, error_message)
        """
        try:
            # Stop existing process if running
            if project_id in self.processes:
                await self.stop_process(project_id)
            
            # Prepare environment
            process_env = os.environ.copy()
            if env:
                process_env.update(env)
            if port:
                process_env['PORT'] = str(port)
                process_env['HOST'] = '0.0.0.0'
                process_env['HOSTNAME'] = '0.0.0.0'
            
            # Prepare log storage
            if project_id not in self.process_logs:
                self.process_logs[project_id] = []
            
            # Start process
            logger.info(f"Starting process for {project_id}: {command} in {cwd}")
            
            # Use subprocess.Popen for better control
            # Check if command needs shell (contains &&, |, etc.)
            needs_shell = '&&' in command or '|' in command or ';' in command
            
            if needs_shell:
                # Use shell for complex commands
                if os.name == 'nt':
                    # Windows
                    process = subprocess.Popen(
                        command,
                        cwd=cwd,
                        env=process_env,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                        shell=True,
                        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
                    )
                else:
                    # Unix-like
                    process = subprocess.Popen(
                        command,
                        cwd=cwd,
                        env=process_env,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                        shell=True,
                        preexec_fn=os.setsid  # Create new process group
                    )
            else:
                # Split command for direct execution
                cmd_parts = command.split()
                if os.name == 'nt':
                    process = subprocess.Popen(
                        cmd_parts,
                        cwd=cwd,
                        env=process_env,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                        creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
                    )
                else:
                    process = subprocess.Popen(
                        cmd_parts,
                        cwd=cwd,
                        env=process_env,
                        stdout=subprocess.PIPE,
                        stderr=subprocess.STDOUT,
                        preexec_fn=os.setsid
                    )
            
            # Store process
            self.processes[project_id] = process
            
            # Start log reader
            asyncio.create_task(self._read_process_logs(project_id, process))
            
            # Wait a moment to check if process started successfully
            await asyncio.sleep(1)
            
            # Check if process is still running
            if process.poll() is not None:
                # Process has exited
                returncode = process.returncode
                error_msg = f"Process exited immediately with code {returncode}"
                logger.error(error_msg)
                # Try to read error output
                try:
                    stdout, stderr = process.communicate(timeout=1)
                    if stdout:
                        error_msg += f"\nOutput: {stdout.decode('utf-8', errors='ignore')[:500]}"
                except:
                    pass
                return False, None, error_msg
            
            pid = process.pid
            logger.info(f"Process started successfully: PID {pid}")
            return True, pid, None
            
        except Exception as e:
            error_msg = f"Failed to start process: {str(e)}"
            logger.error(error_msg)
            return False, None, error_msg
    
    async def _read_process_logs(self, project_id: str, process: subprocess.Popen):
        """Read process logs asynchronously using a background thread"""
        try:
            if not process.stdout:
                return
            
            # Use threading to read logs in background
            import threading
            import queue
            
            log_queue = queue.Queue()
            
            def read_output():
                """Read output in a separate thread"""
                try:
                    for line in iter(process.stdout.readline, b''):
                        if line:
                            log_queue.put(line.decode('utf-8', errors='ignore').strip())
                    # Process has exited
                    log_queue.put(None)  # Signal end
                except Exception as e:
                    logger.error(f"Error reading output for {project_id}: {e}")
                    log_queue.put(None)
            
            # Start reader thread
            reader_thread = threading.Thread(target=read_output, daemon=True)
            reader_thread.start()
            
            # Process logs asynchronously
            while True:
                try:
                    # Try to get log line (non-blocking)
                    log_line = log_queue.get_nowait()
                    if log_line is None:
                        # End of output
                        break
                    if log_line:
                        if project_id in self.process_logs:
                            self.process_logs[project_id].append(log_line)
                        logger.info(f"[{project_id}] {log_line}")
                except queue.Empty:
                    # Check if process is still running
                    if process.poll() is not None:
                        # Process has exited, wait for remaining logs
                        await asyncio.sleep(0.5)
                        # Drain remaining logs
                        while True:
                            try:
                                log_line = log_queue.get_nowait()
                                if log_line is None:
                                    break
                                if log_line:
                                    if project_id in self.process_logs:
                                        self.process_logs[project_id].append(log_line)
                                    logger.info(f"[{project_id}] {log_line}")
                            except queue.Empty:
                                break
                        break
                    await asyncio.sleep(0.1)
        except Exception as e:
            logger.error(f"Error reading logs for {project_id}: {e}")
    
    async def stop_process(self, project_id: str) -> bool:
        """
        Stop a process for a project.
        
        Args:
            project_id: Unique project identifier
        
        Returns:
            True if stopped successfully, False otherwise
        """
        try:
            if project_id not in self.processes:
                return True  # Already stopped
            
            process = self.processes[project_id]
            
            # Try graceful shutdown first
            try:
                if os.name != 'nt':
                    # Unix-like: Send SIGTERM to process group
                    try:
                        pgid = os.getpgid(process.pid)
                        os.killpg(pgid, signal.SIGTERM)
                    except ProcessLookupError:
                        # Process group doesn't exist, try direct termination
                        process.terminate()
                else:
                    # Windows: terminate process
                    process.terminate()
                
                # Wait for process to terminate (max 10 seconds)
                try:
                    await asyncio.wait_for(asyncio.to_thread(process.wait), timeout=10.0)
                except asyncio.TimeoutError:
                    # Force kill if still running
                    logger.warning(f"Process {project_id} didn't terminate gracefully, forcing kill")
                    try:
                        if os.name != 'nt':
                            try:
                                pgid = os.getpgid(process.pid)
                                os.killpg(pgid, signal.SIGKILL)
                            except ProcessLookupError:
                                process.kill()
                        else:
                            process.kill()
                        await asyncio.to_thread(process.wait)
                    except Exception:
                        pass
                except Exception:
                    pass
                
            except ProcessLookupError:
                # Process already terminated
                pass
            except Exception as e:
                logger.error(f"Error stopping process {project_id}: {e}")
                # Try force kill
                try:
                    if os.name != 'nt':
                        try:
                            pgid = os.getpgid(process.pid)
                            os.killpg(pgid, signal.SIGKILL)
                        except ProcessLookupError:
                            process.kill()
                    else:
                        process.kill()
                except Exception:
                    pass
            
            # Remove from tracking
            del self.processes[project_id]
            logger.info(f"Process {project_id} stopped successfully")
            return True
            
        except Exception as e:
            logger.error(f"Failed to stop process {project_id}: {e}")
            return False
    
    async def restart_process(
        self,
        project_id: str,
        command: str,
        cwd: str,
        env: Optional[Dict[str, str]] = None,
        port: Optional[int] = None
    ) -> Tuple[bool, Optional[int], Optional[str]]:
        """
        Restart a process for a project.
        
        Args:
            project_id: Unique project identifier
            command: Command to run
            cwd: Working directory
            env: Environment variables
            port: Port number
        
        Returns:
            Tuple of (success, pid, error_message)
        """
        await self.stop_process(project_id)
        await asyncio.sleep(1)  # Brief pause between stop and start
        return await self.start_process(project_id, command, cwd, env, port)
    
    def is_process_running(self, project_id: str) -> bool:
        """Check if a process is running"""
        if project_id not in self.processes:
            return False
        
        process = self.processes[project_id]
        # Check if process is still running
        return process.poll() is None
    
    def get_process_pid(self, project_id: str) -> Optional[int]:
        """Get process PID"""
        if project_id not in self.processes:
            return None
        return self.processes[project_id].pid
    
    def get_process_logs(self, project_id: str, lines: int = 100) -> list:
        """Get recent process logs"""
        if project_id not in self.process_logs:
            return []
        logs = self.process_logs[project_id]
        return logs[-lines:] if len(logs) > lines else logs
    
    async def check_process_health(self, project_id: str, port: Optional[int] = None) -> bool:
        """Check if process is healthy (running and port is accessible)"""
        if not self.is_process_running(project_id):
            return False
        
        if port:
            # Check if port is accessible
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(1)
                result = sock.connect_ex(('localhost', port))
                sock.close()
                return result == 0
            except Exception:
                return False
        
        return True
    
    async def detect_running_port(self, project_id: str, default_port: Optional[int] = None) -> Optional[int]:
        """
        Detect what port a process is listening on.
        
        Args:
            project_id: Unique project identifier
            default_port: Default port to check first
        
        Returns:
            Port number if detected, None otherwise
        """
        try:
            pid = self.get_process_pid(project_id)
            if not pid:
                return default_port
            
            # Check process logs for port information
            logs = self.get_process_logs(project_id, lines=50)
            log_text = '\n'.join(logs)
            
            # Common port patterns
            port_patterns = [
                r'listening on.*?:(\d+)',
                r'server.*?running.*?on.*?:(\d+)',
                r'Local:\s+http://localhost:(\d+)',
                r'listening.*?port\s+(\d+)',
                r'started.*?on.*?port\s+(\d+)',
                r'server.*?listening.*?(\d+)',
                r'running.*?on.*?port\s+(\d+)',
                r'Listening on port (\d+)',
                r'Server running on .*:(\d+)',
            ]
            
            for pattern in port_patterns:
                matches = re.findall(pattern, log_text, re.IGNORECASE)
                if matches:
                    # Filter valid ports
                    valid_ports = [int(m) for m in matches if 1024 <= int(m) <= 65535 or int(m) == 80]
                    if valid_ports:
                        detected_port = valid_ports[-1]
                        logger.info(f"Detected port {detected_port} from logs for {project_id}")
                        return detected_port
            
            # Fallback: check process connections using psutil
            try:
                process = psutil.Process(pid)
                connections = process.connections()
                for conn in connections:
                    if conn.status == psutil.CONN_LISTEN and conn.laddr:
                        port = conn.laddr.port
                        if port and (1024 <= port <= 65535 or port == 80):
                            logger.info(f"Detected port {port} from process connections for {project_id}")
                            return port
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
            
            return default_port
            
        except Exception as e:
            logger.error(f"Error detecting port for {project_id}: {e}")
            return default_port


# Global process manager instance
process_manager = ProcessManager()

