"""
Comprehensive Monitoring and Health Check System for DevOps Butler
Provides system monitoring, container health checks, resource usage tracking, and alerting
"""

import asyncio
import psutil
import docker
import sqlite3
import json
import time
import subprocess
import logging
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import socket
import threading
from pathlib import Path


class HealthStatus(Enum):
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"


class AlertLevel(Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class HealthCheckResult:
    """Result of a health check"""
    component: str
    status: HealthStatus
    message: str
    metrics: Dict[str, Any] = field(default_factory=dict)
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class SystemMetrics:
    """System resource metrics"""
    cpu_percent: float
    memory_percent: float
    memory_available_gb: float
    disk_usage_percent: float
    disk_free_gb: float
    network_connections: int
    load_average: List[float]
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class ContainerMetrics:
    """Container-specific metrics"""
    container_name: str
    cpu_percent: float
    memory_usage_mb: float
    memory_limit_mb: float
    network_rx_mb: float
    network_tx_mb: float
    status: str
    health_status: str
    restart_count: int
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class Alert:
    """Alert notification"""
    level: AlertLevel
    component: str
    message: str
    metrics: Dict[str, Any]
    timestamp: datetime = field(default_factory=datetime.now)
    resolved: bool = False


class RobustMonitor:
    """Comprehensive monitoring system"""
    
    def __init__(self, check_interval: int = 30):
        self.check_interval = check_interval
        self.docker_client = None
        self.alerts: List[Alert] = []
        self.health_history: List[HealthCheckResult] = []
        self.metrics_history: List[SystemMetrics] = []
        self.container_metrics_history: List[ContainerMetrics] = []
        self.alert_thresholds = self._setup_alert_thresholds()
        self.setup_logging()
        self.setup_docker_client()
        self.monitoring_active = False
        
    def setup_logging(self):
        """Setup monitoring logs"""
        log_dir = Path("/Users/aayush/Documents/Devops_Butler/logs")
        log_dir.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / 'monitoring.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger('RobustMonitor')
    
    def setup_docker_client(self):
        """Setup Docker client for container monitoring"""
        try:
            self.docker_client = docker.from_env()
            self.logger.info("Docker client connected successfully")
        except Exception as e:
            self.logger.error(f"Failed to connect to Docker: {e}")
            self.docker_client = None
    
    def _setup_alert_thresholds(self) -> Dict[str, Dict[str, float]]:
        """Setup alert thresholds for various metrics"""
        return {
            'cpu': {'warning': 70.0, 'critical': 90.0},
            'memory': {'warning': 80.0, 'critical': 95.0},
            'disk': {'warning': 85.0, 'critical': 95.0},
            'container_cpu': {'warning': 80.0, 'critical': 95.0},
            'container_memory': {'warning': 85.0, 'critical': 95.0},
            'response_time': {'warning': 5.0, 'critical': 10.0}
        }
    
    async def start_monitoring(self):
        """Start the monitoring loop"""
        self.monitoring_active = True
        self.logger.info("Starting comprehensive monitoring...")
        
        # Start monitoring tasks
        tasks = [
            asyncio.create_task(self._system_monitoring_loop()),
            asyncio.create_task(self._container_monitoring_loop()),
            asyncio.create_task(self._health_check_loop()),
            asyncio.create_task(self._alert_processing_loop())
        ]
        
        try:
            await asyncio.gather(*tasks)
        except Exception as e:
            self.logger.error(f"Monitoring error: {e}")
        finally:
            self.monitoring_active = False
    
    async def stop_monitoring(self):
        """Stop the monitoring system"""
        self.monitoring_active = False
        self.logger.info("Stopping monitoring...")
    
    async def _system_monitoring_loop(self):
        """Monitor system resources"""
        while self.monitoring_active:
            try:
                metrics = await self._collect_system_metrics()
                self.metrics_history.append(metrics)
                
                # Keep only last 1000 entries
                if len(self.metrics_history) > 1000:
                    self.metrics_history = self.metrics_history[-1000:]
                
                # Check for alerts
                await self._check_system_alerts(metrics)
                
            except Exception as e:
                self.logger.error(f"System monitoring error: {e}")
            
            await asyncio.sleep(self.check_interval)
    
    async def _container_monitoring_loop(self):
        """Monitor Docker containers"""
        while self.monitoring_active:
            try:
                if self.docker_client:
                    container_metrics = await self._collect_container_metrics()
                    self.container_metrics_history.extend(container_metrics)
                    
                    # Keep only last 1000 entries per container
                    if len(self.container_metrics_history) > 5000:
                        self.container_metrics_history = self.container_metrics_history[-5000:]
                    
                    # Check for container alerts
                    for metrics in container_metrics:
                        await self._check_container_alerts(metrics)
            
            except Exception as e:
                self.logger.error(f"Container monitoring error: {e}")
            
            await asyncio.sleep(self.check_interval)
    
    async def _health_check_loop(self):
        """Perform comprehensive health checks"""
        while self.monitoring_active:
            try:
                health_results = await self._perform_health_checks()
                self.health_history.extend(health_results)
                
                # Keep only last 500 health check results
                if len(self.health_history) > 500:
                    self.health_history = self.health_history[-500:]
                
                # Process health check alerts
                for result in health_results:
                    if result.status in [HealthStatus.WARNING, HealthStatus.CRITICAL]:
                        alert_level = AlertLevel.WARNING if result.status == HealthStatus.WARNING else AlertLevel.CRITICAL
                        alert = Alert(
                            level=alert_level,
                            component=result.component,
                            message=result.message,
                            metrics=result.metrics
                        )
                        self.alerts.append(alert)
            
            except Exception as e:
                self.logger.error(f"Health check error: {e}")
            
            await asyncio.sleep(self.check_interval * 2)  # Health checks less frequent
    
    async def _alert_processing_loop(self):
        """Process and manage alerts"""
        while self.monitoring_active:
            try:
                # Clean up old resolved alerts
                cutoff_time = datetime.now() - timedelta(hours=24)
                self.alerts = [
                    alert for alert in self.alerts
                    if not alert.resolved or alert.timestamp > cutoff_time
                ]
                
                # Log critical alerts
                critical_alerts = [
                    alert for alert in self.alerts 
                    if alert.level == AlertLevel.CRITICAL and not alert.resolved
                ]
                
                if critical_alerts:
                    self.logger.critical(f"CRITICAL ALERTS: {len(critical_alerts)} unresolved critical alerts")
                    for alert in critical_alerts:
                        self.logger.critical(f"  - {alert.component}: {alert.message}")
            
            except Exception as e:
                self.logger.error(f"Alert processing error: {e}")
            
            await asyncio.sleep(60)  # Process alerts every minute
    
    async def _collect_system_metrics(self) -> SystemMetrics:
        """Collect system resource metrics"""
        # CPU usage
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # Memory usage
        memory = psutil.virtual_memory()
        memory_percent = memory.percent
        memory_available_gb = memory.available / (1024**3)
        
        # Disk usage
        disk = psutil.disk_usage('/')
        disk_usage_percent = (disk.used / disk.total) * 100
        disk_free_gb = disk.free / (1024**3)
        
        # Network connections
        network_connections = len(psutil.net_connections())
        
        # Load average
        try:
            load_average = list(psutil.getloadavg())
        except AttributeError:
            # Windows doesn't have getloadavg
            load_average = [0.0, 0.0, 0.0]
        
        return SystemMetrics(
            cpu_percent=cpu_percent,
            memory_percent=memory_percent,
            memory_available_gb=memory_available_gb,
            disk_usage_percent=disk_usage_percent,
            disk_free_gb=disk_free_gb,
            network_connections=network_connections,
            load_average=load_average
        )
    
    async def _collect_container_metrics(self) -> List[ContainerMetrics]:
        """Collect metrics for all containers"""
        container_metrics = []
        
        try:
            containers = self.docker_client.containers.list()
            
            for container in containers:
                try:
                    # Get container stats
                    stats = container.stats(stream=False)
                    
                    # Calculate CPU percentage
                    cpu_percent = self._calculate_cpu_percent(stats)
                    
                    # Memory usage
                    memory_usage = stats['memory_stats'].get('usage', 0)
                    memory_limit = stats['memory_stats'].get('limit', 0)
                    memory_usage_mb = memory_usage / (1024**2)
                    memory_limit_mb = memory_limit / (1024**2)
                    
                    # Network I/O
                    network_rx_mb = 0
                    network_tx_mb = 0
                    if 'networks' in stats:
                        for network in stats['networks'].values():
                            network_rx_mb += network.get('rx_bytes', 0) / (1024**2)
                            network_tx_mb += network.get('tx_bytes', 0) / (1024**2)
                    
                    # Container status
                    container.reload()
                    status = container.status
                    health_status = container.attrs.get('State', {}).get('Health', {}).get('Status', 'none')
                    restart_count = container.attrs.get('RestartCount', 0)
                    
                    metrics = ContainerMetrics(
                        container_name=container.name,
                        cpu_percent=cpu_percent,
                        memory_usage_mb=memory_usage_mb,
                        memory_limit_mb=memory_limit_mb,
                        network_rx_mb=network_rx_mb,
                        network_tx_mb=network_tx_mb,
                        status=status,
                        health_status=health_status,
                        restart_count=restart_count
                    )
                    
                    container_metrics.append(metrics)
                
                except Exception as e:
                    self.logger.warning(f"Failed to collect metrics for container {container.name}: {e}")
        
        except Exception as e:
            self.logger.error(f"Failed to list containers: {e}")
        
        return container_metrics
    
    def _calculate_cpu_percent(self, stats: Dict) -> float:
        """Calculate CPU percentage from Docker stats"""
        try:
            cpu_delta = stats['cpu_stats']['cpu_usage']['total_usage'] - \
                       stats['precpu_stats']['cpu_usage']['total_usage']
            system_delta = stats['cpu_stats']['system_cpu_usage'] - \
                          stats['precpu_stats']['system_cpu_usage']
            
            if system_delta > 0:
                cpu_count = len(stats['cpu_stats']['cpu_usage'].get('percpu_usage', [1]))
                return (cpu_delta / system_delta) * cpu_count * 100.0
        except (KeyError, ZeroDivisionError):
            pass
        
        return 0.0
    
    async def _perform_health_checks(self) -> List[HealthCheckResult]:
        """Perform comprehensive health checks"""
        health_results = []
        
        # Check database connectivity
        health_results.append(await self._check_database_health())
        
        # Check Docker daemon
        health_results.append(await self._check_docker_health())
        
        # Check disk space
        health_results.append(await self._check_disk_health())
        
        # Check network connectivity
        health_results.append(await self._check_network_health())
        
        # Check application endpoints
        health_results.append(await self._check_app_health())
        
        return health_results
    
    async def _check_database_health(self) -> HealthCheckResult:
        """Check database connectivity and health"""
        try:
            db_path = "/Users/aayush/Documents/Devops_Butler/deployments.db"
            conn = sqlite3.connect(db_path, timeout=5)
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM deployments")
            deployment_count = cursor.fetchone()[0]
            conn.close()
            
            return HealthCheckResult(
                component="database",
                status=HealthStatus.HEALTHY,
                message=f"Database accessible with {deployment_count} deployments",
                metrics={"deployment_count": deployment_count}
            )
        
        except Exception as e:
            return HealthCheckResult(
                component="database",
                status=HealthStatus.CRITICAL,
                message=f"Database connection failed: {str(e)}",
                metrics={"error": str(e)}
            )
    
    async def _check_docker_health(self) -> HealthCheckResult:
        """Check Docker daemon health"""
        try:
            if not self.docker_client:
                return HealthCheckResult(
                    component="docker",
                    status=HealthStatus.CRITICAL,
                    message="Docker client not available"
                )
            
            # Test Docker connection
            info = self.docker_client.info()
            container_count = info.get('Containers', 0)
            running_count = info.get('ContainersRunning', 0)
            
            return HealthCheckResult(
                component="docker",
                status=HealthStatus.HEALTHY,
                message=f"Docker daemon healthy: {running_count}/{container_count} containers running",
                metrics={
                    "total_containers": container_count,
                    "running_containers": running_count,
                    "docker_version": info.get('ServerVersion', 'unknown')
                }
            )
        
        except Exception as e:
            return HealthCheckResult(
                component="docker",
                status=HealthStatus.CRITICAL,
                message=f"Docker daemon health check failed: {str(e)}",
                metrics={"error": str(e)}
            )
    
    async def _check_disk_health(self) -> HealthCheckResult:
        """Check disk space health"""
        try:
            disk = psutil.disk_usage('/')
            usage_percent = (disk.used / disk.total) * 100
            free_gb = disk.free / (1024**3)
            
            if usage_percent > 95:
                status = HealthStatus.CRITICAL
                message = f"Critical disk usage: {usage_percent:.1f}% used, {free_gb:.1f}GB free"
            elif usage_percent > 85:
                status = HealthStatus.WARNING
                message = f"High disk usage: {usage_percent:.1f}% used, {free_gb:.1f}GB free"
            else:
                status = HealthStatus.HEALTHY
                message = f"Disk usage normal: {usage_percent:.1f}% used, {free_gb:.1f}GB free"
            
            return HealthCheckResult(
                component="disk",
                status=status,
                message=message,
                metrics={
                    "usage_percent": usage_percent,
                    "free_gb": free_gb,
                    "total_gb": disk.total / (1024**3)
                }
            )
        
        except Exception as e:
            return HealthCheckResult(
                component="disk",
                status=HealthStatus.UNKNOWN,
                message=f"Disk health check failed: {str(e)}",
                metrics={"error": str(e)}
            )
    
    async def _check_network_health(self) -> HealthCheckResult:
        """Check network connectivity"""
        try:
            # Test DNS resolution
            socket.gethostbyname('google.com')
            
            # Test HTTP connectivity
            import urllib.request
            response = urllib.request.urlopen('http://google.com', timeout=5)
            status_code = response.getcode()
            
            if status_code == 200:
                return HealthCheckResult(
                    component="network",
                    status=HealthStatus.HEALTHY,
                    message="Network connectivity healthy",
                    metrics={"http_status": status_code}
                )
            else:
                return HealthCheckResult(
                    component="network",
                    status=HealthStatus.WARNING,
                    message=f"Network connectivity issues: HTTP {status_code}",
                    metrics={"http_status": status_code}
                )
        
        except Exception as e:
            return HealthCheckResult(
                component="network",
                status=HealthStatus.WARNING,
                message=f"Network connectivity check failed: {str(e)}",
                metrics={"error": str(e)}
            )
    
    async def _check_app_health(self) -> HealthCheckResult:
        """Check application endpoint health"""
        try:
            # Test local application endpoint
            start_time = time.time()
            
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            result = sock.connect_ex(('localhost', 5000))
            sock.close()
            
            response_time = time.time() - start_time
            
            if result == 0:
                if response_time > 5.0:
                    status = HealthStatus.WARNING
                    message = f"App endpoint slow: {response_time:.2f}s response time"
                else:
                    status = HealthStatus.HEALTHY
                    message = f"App endpoint healthy: {response_time:.2f}s response time"
            else:
                status = HealthStatus.CRITICAL
                message = "App endpoint not accessible"
            
            return HealthCheckResult(
                component="app_endpoint",
                status=status,
                message=message,
                metrics={"response_time": response_time, "port_accessible": result == 0}
            )
        
        except Exception as e:
            return HealthCheckResult(
                component="app_endpoint",
                status=HealthStatus.UNKNOWN,
                message=f"App health check failed: {str(e)}",
                metrics={"error": str(e)}
            )
    
    async def _check_system_alerts(self, metrics: SystemMetrics):
        """Check system metrics against alert thresholds"""
        # CPU alerts
        if metrics.cpu_percent > self.alert_thresholds['cpu']['critical']:
            alert = Alert(
                level=AlertLevel.CRITICAL,
                component="system_cpu",
                message=f"Critical CPU usage: {metrics.cpu_percent:.1f}%",
                metrics={"cpu_percent": metrics.cpu_percent}
            )
            self.alerts.append(alert)
        elif metrics.cpu_percent > self.alert_thresholds['cpu']['warning']:
            alert = Alert(
                level=AlertLevel.WARNING,
                component="system_cpu",
                message=f"High CPU usage: {metrics.cpu_percent:.1f}%",
                metrics={"cpu_percent": metrics.cpu_percent}
            )
            self.alerts.append(alert)
        
        # Memory alerts
        if metrics.memory_percent > self.alert_thresholds['memory']['critical']:
            alert = Alert(
                level=AlertLevel.CRITICAL,
                component="system_memory",
                message=f"Critical memory usage: {metrics.memory_percent:.1f}%",
                metrics={"memory_percent": metrics.memory_percent, "available_gb": metrics.memory_available_gb}
            )
            self.alerts.append(alert)
        elif metrics.memory_percent > self.alert_thresholds['memory']['warning']:
            alert = Alert(
                level=AlertLevel.WARNING,
                component="system_memory",
                message=f"High memory usage: {metrics.memory_percent:.1f}%",
                metrics={"memory_percent": metrics.memory_percent, "available_gb": metrics.memory_available_gb}
            )
            self.alerts.append(alert)
        
        # Disk alerts
        if metrics.disk_usage_percent > self.alert_thresholds['disk']['critical']:
            alert = Alert(
                level=AlertLevel.CRITICAL,
                component="system_disk",
                message=f"Critical disk usage: {metrics.disk_usage_percent:.1f}%",
                metrics={"disk_usage_percent": metrics.disk_usage_percent, "free_gb": metrics.disk_free_gb}
            )
            self.alerts.append(alert)
        elif metrics.disk_usage_percent > self.alert_thresholds['disk']['warning']:
            alert = Alert(
                level=AlertLevel.WARNING,
                component="system_disk",
                message=f"High disk usage: {metrics.disk_usage_percent:.1f}%",
                metrics={"disk_usage_percent": metrics.disk_usage_percent, "free_gb": metrics.disk_free_gb}
            )
            self.alerts.append(alert)
    
    async def _check_container_alerts(self, metrics: ContainerMetrics):
        """Check container metrics against alert thresholds"""
        # Container CPU alerts
        if metrics.cpu_percent > self.alert_thresholds['container_cpu']['critical']:
            alert = Alert(
                level=AlertLevel.CRITICAL,
                component=f"container_{metrics.container_name}",
                message=f"Critical CPU usage in {metrics.container_name}: {metrics.cpu_percent:.1f}%",
                metrics={"container": metrics.container_name, "cpu_percent": metrics.cpu_percent}
            )
            self.alerts.append(alert)
        
        # Container memory alerts
        if metrics.memory_limit_mb > 0:
            memory_percent = (metrics.memory_usage_mb / metrics.memory_limit_mb) * 100
            if memory_percent > self.alert_thresholds['container_memory']['critical']:
                alert = Alert(
                    level=AlertLevel.CRITICAL,
                    component=f"container_{metrics.container_name}",
                    message=f"Critical memory usage in {metrics.container_name}: {memory_percent:.1f}%",
                    metrics={"container": metrics.container_name, "memory_percent": memory_percent}
                )
                self.alerts.append(alert)
        
        # Container health alerts
        if metrics.health_status == 'unhealthy':
            alert = Alert(
                level=AlertLevel.ERROR,
                component=f"container_{metrics.container_name}",
                message=f"Container {metrics.container_name} is unhealthy",
                metrics={"container": metrics.container_name, "health_status": metrics.health_status}
            )
            self.alerts.append(alert)
        
        # Container restart alerts
        if metrics.restart_count > 5:
            alert = Alert(
                level=AlertLevel.WARNING,
                component=f"container_{metrics.container_name}",
                message=f"Container {metrics.container_name} has restarted {metrics.restart_count} times",
                metrics={"container": metrics.container_name, "restart_count": metrics.restart_count}
            )
            self.alerts.append(alert)
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get current system status"""
        if not self.metrics_history:
            return {"status": "unknown", "message": "No metrics available"}
        
        latest_metrics = self.metrics_history[-1]
        
        # Determine overall status
        status = "healthy"
        issues = []
        
        if latest_metrics.cpu_percent > self.alert_thresholds['cpu']['warning']:
            status = "warning" if status == "healthy" else status
            issues.append(f"High CPU: {latest_metrics.cpu_percent:.1f}%")
        
        if latest_metrics.memory_percent > self.alert_thresholds['memory']['warning']:
            status = "warning" if status == "healthy" else status
            issues.append(f"High Memory: {latest_metrics.memory_percent:.1f}%")
        
        if latest_metrics.disk_usage_percent > self.alert_thresholds['disk']['warning']:
            status = "warning" if status == "healthy" else status
            issues.append(f"High Disk: {latest_metrics.disk_usage_percent:.1f}%")
        
        if latest_metrics.cpu_percent > self.alert_thresholds['cpu']['critical'] or \
           latest_metrics.memory_percent > self.alert_thresholds['memory']['critical'] or \
           latest_metrics.disk_usage_percent > self.alert_thresholds['disk']['critical']:
            status = "critical"
        
        return {
            "status": status,
            "issues": issues,
            "metrics": {
                "cpu_percent": latest_metrics.cpu_percent,
                "memory_percent": latest_metrics.memory_percent,
                "disk_usage_percent": latest_metrics.disk_usage_percent,
                "disk_free_gb": latest_metrics.disk_free_gb,
                "timestamp": latest_metrics.timestamp.isoformat()
            },
            "active_alerts": len([a for a in self.alerts if not a.resolved])
        }
    
    def get_container_status(self) -> Dict[str, Any]:
        """Get current container status"""
        if not self.container_metrics_history:
            return {"containers": [], "total": 0, "running": 0}
        
        # Get latest metrics for each container
        latest_container_metrics = {}
        for metrics in reversed(self.container_metrics_history):
            if metrics.container_name not in latest_container_metrics:
                latest_container_metrics[metrics.container_name] = metrics
        
        containers = []
        running_count = 0
        
        for container_name, metrics in latest_container_metrics.items():
            container_info = {
                "name": container_name,
                "status": metrics.status,
                "health_status": metrics.health_status,
                "cpu_percent": metrics.cpu_percent,
                "memory_usage_mb": metrics.memory_usage_mb,
                "memory_limit_mb": metrics.memory_limit_mb,
                "restart_count": metrics.restart_count,
                "timestamp": metrics.timestamp.isoformat()
            }
            containers.append(container_info)
            
            if metrics.status == 'running':
                running_count += 1
        
        return {
            "containers": containers,
            "total": len(containers),
            "running": running_count
        }
    
    def get_health_summary(self) -> Dict[str, Any]:
        """Get health check summary"""
        if not self.health_history:
            return {"components": [], "overall_status": "unknown"}
        
        # Get latest health check for each component
        latest_health = {}
        for health_result in reversed(self.health_history):
            if health_result.component not in latest_health:
                latest_health[health_result.component] = health_result
        
        components = []
        overall_status = HealthStatus.HEALTHY
        
        for component, health_result in latest_health.items():
            components.append({
                "component": component,
                "status": health_result.status.value,
                "message": health_result.message,
                "timestamp": health_result.timestamp.isoformat()
            })
            
            # Determine overall status
            if health_result.status == HealthStatus.CRITICAL:
                overall_status = HealthStatus.CRITICAL
            elif health_result.status == HealthStatus.WARNING and overall_status != HealthStatus.CRITICAL:
                overall_status = HealthStatus.WARNING
        
        return {
            "components": components,
            "overall_status": overall_status.value,
            "last_check": max(h.timestamp for h in latest_health.values()).isoformat() if latest_health else None
        }
    
    def get_alerts(self, include_resolved: bool = False) -> List[Dict[str, Any]]:
        """Get current alerts"""
        alerts = self.alerts if include_resolved else [a for a in self.alerts if not a.resolved]
        
        return [
            {
                "level": alert.level.value,
                "component": alert.component,
                "message": alert.message,
                "timestamp": alert.timestamp.isoformat(),
                "resolved": alert.resolved,
                "metrics": alert.metrics
            }
            for alert in sorted(alerts, key=lambda x: x.timestamp, reverse=True)
        ]


# Global monitoring instance
global_monitor = RobustMonitor()
