#!/usr/bin/env python3
"""
Service Manager for DevOps Butler

Manages background services like the Dynamic Proxy Manager
"""

import os
import signal
import subprocess
import sys
import time
import asyncio
from pathlib import Path
import json

class ServiceManager:
    def __init__(self):
        self.services_dir = Path(__file__).parent / "services"
        self.logs_dir = Path(__file__).parent / "logs"
        self.pids_dir = Path(__file__).parent / "pids"
        
        # Create directories
        for dir_path in [self.services_dir, self.logs_dir, self.pids_dir]:
            dir_path.mkdir(exist_ok=True)

    def get_pid_file(self, service_name: str) -> Path:
        """Get PID file path for a service"""
        return self.pids_dir / f"{service_name}.pid"

    def get_log_file(self, service_name: str) -> Path:
        """Get log file path for a service"""
        return self.logs_dir / f"{service_name}.log"

    def is_service_running(self, service_name: str) -> bool:
        """Check if a service is currently running"""
        pid_file = self.get_pid_file(service_name)
        
        if not pid_file.exists():
            return False
        
        try:
            with open(pid_file, 'r') as f:
                pid = int(f.read().strip())
            
            # Check if process is still alive
            os.kill(pid, 0)  # This will raise OSError if process doesn't exist
            return True
            
        except (ValueError, OSError, ProcessLookupError):
            # Process doesn't exist, clean up stale PID file
            pid_file.unlink(missing_ok=True)
            return False

    def start_service(self, service_name: str, script_path: str, *args) -> bool:
        """Start a service as a background process"""
        if self.is_service_running(service_name):
            print(f"✅ Service '{service_name}' is already running")
            return True
        
        pid_file = self.get_pid_file(service_name)
        log_file = self.get_log_file(service_name)
        
        try:
            # Start the service process
            with open(log_file, 'w') as log:
                process = subprocess.Popen(
                    [sys.executable, script_path] + list(args),
                    stdout=log,
                    stderr=subprocess.STDOUT,
                    stdin=subprocess.DEVNULL,
                    preexec_fn=os.setsid  # Create new process group
                )
            
            # Write PID file
            with open(pid_file, 'w') as f:
                f.write(str(process.pid))
            
            # Give it a moment to start
            time.sleep(2)
            
            if self.is_service_running(service_name):
                print(f"🚀 Service '{service_name}' started successfully (PID: {process.pid})")
                return True
            else:
                print(f"❌ Service '{service_name}' failed to start")
                return False
                
        except Exception as e:
            print(f"❌ Error starting service '{service_name}': {e}")
            return False

    def stop_service(self, service_name: str) -> bool:
        """Stop a running service"""
        if not self.is_service_running(service_name):
            print(f"⚠️ Service '{service_name}' is not running")
            return True
        
        pid_file = self.get_pid_file(service_name)
        
        try:
            with open(pid_file, 'r') as f:
                pid = int(f.read().strip())
            
            # Send SIGTERM to the process group
            os.killpg(os.getpgid(pid), signal.SIGTERM)
            
            # Wait for graceful shutdown
            for _ in range(10):  # Wait up to 10 seconds
                if not self.is_service_running(service_name):
                    break
                time.sleep(1)
            
            # Force kill if still running
            if self.is_service_running(service_name):
                print(f"⚠️ Service '{service_name}' didn't stop gracefully, force killing...")
                os.killpg(os.getpgid(pid), signal.SIGKILL)
                time.sleep(1)
            
            # Clean up PID file
            pid_file.unlink(missing_ok=True)
            
            if not self.is_service_running(service_name):
                print(f"⏹️ Service '{service_name}' stopped successfully")
                return True
            else:
                print(f"❌ Failed to stop service '{service_name}'")
                return False
                
        except Exception as e:
            print(f"❌ Error stopping service '{service_name}': {e}")
            return False

    def restart_service(self, service_name: str, script_path: str, *args) -> bool:
        """Restart a service"""
        print(f"🔄 Restarting service '{service_name}'...")
        self.stop_service(service_name)
        time.sleep(1)
        return self.start_service(service_name, script_path, *args)

    def get_service_status(self, service_name: str) -> dict:
        """Get detailed status of a service"""
        status = {
            "name": service_name,
            "running": False,
            "pid": None,
            "uptime": None,
            "log_size": 0,
            "last_log_lines": []
        }
        
        if self.is_service_running(service_name):
            status["running"] = True
            
            pid_file = self.get_pid_file(service_name)
            if pid_file.exists():
                with open(pid_file, 'r') as f:
                    status["pid"] = int(f.read().strip())
                
                # Get process start time for uptime calculation
                try:
                    import psutil
                    process = psutil.Process(status["pid"])
                    start_time = process.create_time()
                    uptime_seconds = time.time() - start_time
                    status["uptime"] = f"{int(uptime_seconds//3600)}h {int((uptime_seconds%3600)//60)}m"
                except:
                    status["uptime"] = "Unknown"
        
        # Get log info
        log_file = self.get_log_file(service_name)
        if log_file.exists():
            status["log_size"] = log_file.stat().st_size
            
            # Get last few lines of log
            try:
                with open(log_file, 'r') as f:
                    lines = f.readlines()
                    status["last_log_lines"] = [line.strip() for line in lines[-5:]]
            except:
                status["last_log_lines"] = ["Error reading log file"]
        
        return status

    def list_services(self) -> list:
        """List all known services"""
        services = []
        
        # Check for known services
        known_services = {
            "dynamic-proxy": "dynamic_proxy_manager.py",
            "error-recovery": "error_recovery.py",
            "health-monitor": "health_monitor.py"
        }
        
        for service_name, script_name in known_services.items():
            script_path = Path(__file__).parent / script_name
            if script_path.exists():
                status = self.get_service_status(service_name)
                services.append(status)
        
        return services

def main():
    """CLI interface for service management"""
    if len(sys.argv) < 2:
        print("""
DevOps Butler Service Manager

Usage:
    python service_manager.py start <service_name>
    python service_manager.py stop <service_name>
    python service_manager.py restart <service_name>
    python service_manager.py status [service_name]
    python service_manager.py list

Available services:
    dynamic-proxy    - Dynamic proxy configuration manager
    error-recovery   - Error recovery and healing service  
    health-monitor   - Container health monitoring service
""")
        return
    
    manager = ServiceManager()
    command = sys.argv[1].lower()
    
    if command == "list":
        services = manager.list_services()
        print(f"\n{'Service':<20} {'Status':<10} {'PID':<8} {'Uptime':<12} {'Log Size':<10}")
        print("-" * 70)
        
        for service in services:
            status_text = "🟢 Running" if service["running"] else "🔴 Stopped"
            pid_text = str(service["pid"]) if service["pid"] else "-"
            uptime_text = service["uptime"] if service["uptime"] else "-"
            log_size_text = f"{service['log_size']} bytes" if service["log_size"] else "-"
            
            print(f"{service['name']:<20} {status_text:<10} {pid_text:<8} {uptime_text:<12} {log_size_text:<10}")
    
    elif command == "status":
        if len(sys.argv) > 2:
            service_name = sys.argv[2]
            status = manager.get_service_status(service_name)
            
            print(f"\nService: {status['name']}")
            print(f"Status: {'🟢 Running' if status['running'] else '🔴 Stopped'}")
            if status["running"]:
                print(f"PID: {status['pid']}")
                print(f"Uptime: {status['uptime']}")
                print(f"Log Size: {status['log_size']} bytes")
                
                if status["last_log_lines"]:
                    print("\nRecent Log Lines:")
                    for line in status["last_log_lines"]:
                        print(f"  {line}")
        else:
            # Show status of all services
            services = manager.list_services()
            for service in services:
                status_text = "🟢 Running" if service["running"] else "🔴 Stopped"
                print(f"{service['name']}: {status_text}")
    
    elif command in ["start", "stop", "restart"]:
        if len(sys.argv) < 3:
            print("Error: Service name required")
            return
        
        service_name = sys.argv[2]
        
        # Map service names to script paths
        service_scripts = {
            "dynamic-proxy": "dynamic_proxy_manager.py",
            "error-recovery": "error_recovery.py", 
            "health-monitor": "health_monitor.py"
        }
        
        if service_name not in service_scripts:
            print(f"Error: Unknown service '{service_name}'")
            print(f"Available services: {', '.join(service_scripts.keys())}")
            return
        
        script_path = str(Path(__file__).parent / service_scripts[service_name])
        
        if not Path(script_path).exists():
            print(f"Error: Service script not found: {script_path}")
            return
        
        if command == "start":
            manager.start_service(service_name, script_path)
        elif command == "stop":
            manager.stop_service(service_name)
        elif command == "restart":
            manager.restart_service(service_name, script_path)
    
    else:
        print(f"Error: Unknown command '{command}'")

if __name__ == "__main__":
    main()
