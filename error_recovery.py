#!/usr/bin/env python3
"""
Error Recovery and Monitoring System for DevOps Butler

This module provides comprehensive error recovery, self-healing, and monitoring
capabilities to ensure maximum uptime and reliability.
"""

import asyncio
import subprocess
import logging
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('error_recovery')


class ErrorSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class ErrorEvent:
    timestamp: datetime
    component: str
    severity: ErrorSeverity
    error_type: str
    message: str
    context: Dict[str, Any]
    recovery_attempted: bool = False
    recovery_successful: bool = False


class ErrorRecoverySystem:
    """
    Comprehensive error recovery system that monitors and automatically fixes issues.
    """
    
    def __init__(self):
        self.error_history: List[ErrorEvent] = []
        self.recovery_strategies = {
            'nginx_failed': self._recover_nginx,
            'container_stopped': self._recover_container,
            'network_issue': self._recover_network,
            'config_invalid': self._recover_config,
            'port_conflict': self._recover_port_conflict,
            'disk_full': self._recover_disk_space,
            'memory_exhausted': self._recover_memory,
        }
        self.monitoring_active = False
        
    async def start_monitoring(self):
        """Start continuous monitoring of the system."""
        self.monitoring_active = True
        logger.info("🔍 Starting comprehensive system monitoring...")
        
        # Start monitoring tasks
        tasks = [
            asyncio.create_task(self._monitor_nginx()),
            asyncio.create_task(self._monitor_containers()),
            asyncio.create_task(self._monitor_network()),
            asyncio.create_task(self._monitor_resources()),
            asyncio.create_task(self._monitor_configs()),
        ]
        
        try:
            await asyncio.gather(*tasks)
        except Exception as e:
            logger.error(f"Monitoring system error: {e}")
            await self._record_error("monitoring", ErrorSeverity.HIGH, "monitoring_failure", str(e))
    
    async def _monitor_nginx(self):
        """Monitor nginx proxy health."""
        while self.monitoring_active:
            try:
                # Check nginx container status
                result = await asyncio.to_thread(
                    subprocess.run,
                    ["docker", "inspect", "--format", "{{.State.Running}}", "butler-nginx-proxy"],
                    capture_output=True,
                    text=True
                )
                
                if result.returncode != 0 or result.stdout.strip() != "true":
                    await self._record_error(
                        "nginx", ErrorSeverity.CRITICAL, "nginx_failed",
                        "Nginx proxy container is not running"
                    )
                    await self._attempt_recovery("nginx_failed", {"container": "butler-nginx-proxy"})
                
                # Check nginx health endpoint
                health_result = await asyncio.to_thread(
                    subprocess.run,
                    ["curl", "-f", "-s", "http://localhost:8888/health", "--connect-timeout", "5"],
                    capture_output=True,
                    text=True
                )
                
                if health_result.returncode != 0:
                    logger.warning("Nginx health check failed, but container might still be functional")
                
            except Exception as e:
                await self._record_error("nginx", ErrorSeverity.MEDIUM, "monitoring_error", str(e))
            
            await asyncio.sleep(30)  # Check every 30 seconds
    
    async def _monitor_containers(self):
        """Monitor application containers health."""
        while self.monitoring_active:
            try:
                # Get all containers in devops-butler-net
                result = await asyncio.to_thread(
                    subprocess.run,
                    ["docker", "network", "inspect", "devops-butler-net", "--format", "{{json .}}"],
                    capture_output=True,
                    text=True
                )
                
                if result.returncode == 0:
                    network_data = json.loads(result.stdout)
                    containers = network_data.get("Containers", {})
                    
                    for container_id, container_info in containers.items():
                        container_name = container_info["Name"]
                        if container_name == "butler-nginx-proxy":
                            continue
                        
                        # Check container status
                        status_result = await asyncio.to_thread(
                            subprocess.run,
                            ["docker", "inspect", "--format", "{{.State.Status}}", container_name],
                            capture_output=True,
                            text=True
                        )
                        
                        if status_result.returncode == 0:
                            status = status_result.stdout.strip()
                            if status != "running":
                                await self._record_error(
                                    "container", ErrorSeverity.HIGH, "container_stopped",
                                    f"Container {container_name} is in state: {status}"
                                )
                                await self._attempt_recovery("container_stopped", {
                                    "container_name": container_name,
                                    "status": status
                                })
                
            except Exception as e:
                await self._record_error("containers", ErrorSeverity.MEDIUM, "monitoring_error", str(e))
            
            await asyncio.sleep(60)  # Check every minute
    
    async def _monitor_network(self):
        """Monitor Docker network health."""
        while self.monitoring_active:
            try:
                # Check if devops-butler-net exists
                result = await asyncio.to_thread(
                    subprocess.run,
                    ["docker", "network", "inspect", "devops-butler-net"],
                    capture_output=True,
                    text=True
                )
                
                if result.returncode != 0:
                    await self._record_error(
                        "network", ErrorSeverity.HIGH, "network_issue",
                        "devops-butler-net network does not exist"
                    )
                    await self._attempt_recovery("network_issue", {"network": "devops-butler-net"})
                
            except Exception as e:
                await self._record_error("network", ErrorSeverity.MEDIUM, "monitoring_error", str(e))
            
            await asyncio.sleep(300)  # Check every 5 minutes
    
    async def _monitor_resources(self):
        """Monitor system resources (disk, memory)."""
        while self.monitoring_active:
            try:
                # Check disk space
                disk_result = await asyncio.to_thread(
                    subprocess.run,
                    ["df", "-h", "/"],
                    capture_output=True,
                    text=True
                )
                
                if disk_result.returncode == 0:
                    lines = disk_result.stdout.strip().split('\n')
                    if len(lines) > 1:
                        disk_line = lines[1].split()
                        if len(disk_line) >= 5:
                            usage_percent = disk_line[4].rstrip('%')
                            if usage_percent.isdigit() and int(usage_percent) > 90:
                                await self._record_error(
                                    "resources", ErrorSeverity.HIGH, "disk_full",
                                    f"Disk usage is {usage_percent}%"
                                )
                                await self._attempt_recovery("disk_full", {"usage": usage_percent})
                
                # Check Docker daemon status
                docker_result = await asyncio.to_thread(
                    subprocess.run,
                    ["docker", "info"],
                    capture_output=True,
                    text=True
                )
                
                if docker_result.returncode != 0:
                    await self._record_error(
                        "resources", ErrorSeverity.CRITICAL, "docker_daemon",
                        "Docker daemon is not responding"
                    )
                
            except Exception as e:
                await self._record_error("resources", ErrorSeverity.MEDIUM, "monitoring_error", str(e))
            
            await asyncio.sleep(600)  # Check every 10 minutes
    
    async def _monitor_configs(self):
        """Monitor nginx configuration validity."""
        while self.monitoring_active:
            try:
                from nginx_manager import validate_nginx_config
                
                if not await validate_nginx_config():
                    await self._record_error(
                        "config", ErrorSeverity.MEDIUM, "config_invalid",
                        "Invalid nginx configurations detected"
                    )
                    await self._attempt_recovery("config_invalid", {})
                
            except Exception as e:
                await self._record_error("config", ErrorSeverity.MEDIUM, "monitoring_error", str(e))
            
            await asyncio.sleep(180)  # Check every 3 minutes
    
    async def _record_error(self, component: str, severity: ErrorSeverity, error_type: str, message: str, context: Optional[Dict] = None):
        """Record an error event."""
        error_event = ErrorEvent(
            timestamp=datetime.now(),
            component=component,
            severity=severity,
            error_type=error_type,
            message=message,
            context=context or {}
        )
        
        self.error_history.append(error_event)
        
        # Log the error
        log_level = {
            ErrorSeverity.LOW: logging.INFO,
            ErrorSeverity.MEDIUM: logging.WARNING,
            ErrorSeverity.HIGH: logging.ERROR,
            ErrorSeverity.CRITICAL: logging.CRITICAL
        }.get(severity, logging.WARNING)
        
        logger.log(log_level, f"[{component}] {error_type}: {message}")
        
        # Keep only last 1000 error events
        if len(self.error_history) > 1000:
            self.error_history = self.error_history[-1000:]
    
    async def _attempt_recovery(self, error_type: str, context: Dict[str, Any]):
        """Attempt to recover from an error."""
        if error_type not in self.recovery_strategies:
            logger.warning(f"No recovery strategy for error type: {error_type}")
            return False
        
        logger.info(f"🔧 Attempting recovery for: {error_type}")
        
        try:
            recovery_func = self.recovery_strategies[error_type]
            success = await recovery_func(context)
            
            # Update error history
            if self.error_history:
                last_error = self.error_history[-1]
                if last_error.error_type == error_type:
                    last_error.recovery_attempted = True
                    last_error.recovery_successful = success
            
            if success:
                logger.info(f"✅ Recovery successful for: {error_type}")
            else:
                logger.error(f"❌ Recovery failed for: {error_type}")
            
            return success
            
        except Exception as e:
            logger.error(f"Recovery attempt failed: {e}")
            return False
    
    async def _recover_nginx(self, context: Dict[str, Any]) -> bool:
        """Recover nginx proxy issues."""
        try:
            from nginx_manager import create_bulletproof_nginx_container
            
            logger.info("🔧 Recovering nginx proxy...")
            return await create_bulletproof_nginx_container()
            
        except Exception as e:
            logger.error(f"Nginx recovery failed: {e}")
            return False
    
    async def _recover_container(self, context: Dict[str, Any]) -> bool:
        """Recover stopped containers."""
        container_name = context.get("container_name")
        if not container_name:
            return False
        
        try:
            logger.info(f"🔧 Recovering container: {container_name}")
            
            # Try to start the container
            result = await asyncio.to_thread(
                subprocess.run,
                ["docker", "start", container_name],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                logger.info(f"✅ Container {container_name} restarted successfully")
                return True
            else:
                logger.error(f"Failed to restart container {container_name}: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Container recovery failed: {e}")
            return False
    
    async def _recover_network(self, context: Dict[str, Any]) -> bool:
        """Recover network issues."""
        try:
            from nginx_manager import ensure_nginx_network
            
            logger.info("🔧 Recovering Docker network...")
            return await ensure_nginx_network()
            
        except Exception as e:
            logger.error(f"Network recovery failed: {e}")
            return False
    
    async def _recover_config(self, context: Dict[str, Any]) -> bool:
        """Recover configuration issues."""
        try:
            from nginx_manager import validate_nginx_config, reload_nginx
            
            logger.info("🔧 Recovering configuration issues...")
            
            # Clean up invalid configs
            await validate_nginx_config()
            
            # Reload nginx
            await reload_nginx()
            
            return True
            
        except Exception as e:
            logger.error(f"Config recovery failed: {e}")
            return False
    
    async def _recover_port_conflict(self, context: Dict[str, Any]) -> bool:
        """Recover from port conflicts."""
        # This would involve more complex logic to reassign ports
        logger.info("🔧 Port conflict recovery not implemented yet")
        return False
    
    async def _recover_disk_space(self, context: Dict[str, Any]) -> bool:
        """Recover from disk space issues."""
        try:
            logger.info("🔧 Recovering disk space...")
            
            # Clean up old Docker images
            cleanup_result = await asyncio.to_thread(
                subprocess.run,
                ["docker", "system", "prune", "-f"],
                capture_output=True,
                text=True
            )
            
            if cleanup_result.returncode == 0:
                logger.info("✅ Docker cleanup completed")
                
                # Clean up old volumes
                volume_cleanup = await asyncio.to_thread(
                    subprocess.run,
                    ["docker", "volume", "prune", "-f"],
                    capture_output=True,
                    text=True
                )
                
                return volume_cleanup.returncode == 0
            
            return False
            
        except Exception as e:
            logger.error(f"Disk space recovery failed: {e}")
            return False
    
    async def _recover_memory(self, context: Dict[str, Any]) -> bool:
        """Recover from memory exhaustion."""
        logger.info("🔧 Memory recovery not implemented yet")
        return False
    
    def get_error_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get error summary for the last N hours."""
        cutoff_time = datetime.now() - timedelta(hours=hours)
        recent_errors = [e for e in self.error_history if e.timestamp > cutoff_time]
        
        summary = {
            "total_errors": len(recent_errors),
            "by_severity": {},
            "by_component": {},
            "by_type": {},
            "recovery_rate": 0,
        }
        
        if recent_errors:
            # Count by severity
            for severity in ErrorSeverity:
                summary["by_severity"][severity.value] = len([e for e in recent_errors if e.severity == severity])
            
            # Count by component
            for error in recent_errors:
                component = error.component
                summary["by_component"][component] = summary["by_component"].get(component, 0) + 1
            
            # Count by type
            for error in recent_errors:
                error_type = error.error_type
                summary["by_type"][error_type] = summary["by_type"].get(error_type, 0) + 1
            
            # Calculate recovery rate
            attempted_recoveries = [e for e in recent_errors if e.recovery_attempted]
            if attempted_recoveries:
                successful_recoveries = [e for e in attempted_recoveries if e.recovery_successful]
                summary["recovery_rate"] = len(successful_recoveries) / len(attempted_recoveries) * 100
        
        return summary
    
    async def health_check(self) -> Dict[str, Any]:
        """Perform comprehensive health check."""
        health_status = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": "healthy",
            "components": {},
            "issues": [],
            "recommendations": []
        }
        
        try:
            # Check nginx
            nginx_result = await asyncio.to_thread(
                subprocess.run,
                ["docker", "inspect", "--format", "{{.State.Running}}", "butler-nginx-proxy"],
                capture_output=True,
                text=True
            )
            
            nginx_healthy = nginx_result.returncode == 0 and nginx_result.stdout.strip() == "true"
            health_status["components"]["nginx"] = "healthy" if nginx_healthy else "unhealthy"
            
            if not nginx_healthy:
                health_status["overall_status"] = "degraded"
                health_status["issues"].append("Nginx proxy is not running")
                health_status["recommendations"].append("Run: python butler_cli.py fix-502")
            
            # Check containers
            network_result = await asyncio.to_thread(
                subprocess.run,
                ["docker", "network", "inspect", "devops-butler-net"],
                capture_output=True,
                text=True
            )
            
            network_healthy = network_result.returncode == 0
            health_status["components"]["network"] = "healthy" if network_healthy else "unhealthy"
            
            if not network_healthy:
                health_status["overall_status"] = "critical"
                health_status["issues"].append("Docker network is missing")
                health_status["recommendations"].append("Run: python butler_cli.py cleanup")
            
            # Check recent errors
            recent_errors = [e for e in self.error_history 
                           if e.timestamp > datetime.now() - timedelta(hours=1)]
            
            if recent_errors:
                critical_errors = [e for e in recent_errors if e.severity == ErrorSeverity.CRITICAL]
                if critical_errors:
                    health_status["overall_status"] = "critical"
                    health_status["issues"].extend([f"Critical error: {e.message}" for e in critical_errors])
            
        except Exception as e:
            health_status["overall_status"] = "unknown"
            health_status["issues"].append(f"Health check failed: {e}")
        
        return health_status


# Global error recovery system instance
recovery_system = ErrorRecoverySystem()


async def start_error_recovery_system():
    """Start the global error recovery system."""
    await recovery_system.start_monitoring()


def get_system_health():
    """Get current system health status."""
    return asyncio.run(recovery_system.health_check())


def get_error_summary(hours: int = 24):
    """Get error summary for the last N hours."""
    return recovery_system.get_error_summary(hours)


if __name__ == "__main__":
    # For testing
    async def test_monitoring():
        print("🚀 Starting error recovery system test...")
        await recovery_system.start_monitoring()
    
    try:
        asyncio.run(test_monitoring())
    except KeyboardInterrupt:
        print("\n⏹️ Monitoring stopped")
