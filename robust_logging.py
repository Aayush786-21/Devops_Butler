"""
Comprehensive Logging and Debugging System for DevOps Butler
Provides structured logging, debugging tools, deployment tracing, and audit trails
"""

import logging
import logging.handlers
import json
import time
import threading
import traceback
import inspect
import functools
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
import sys
import uuid


class LogLevel(Enum):
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"
    AUDIT = "AUDIT"
    SECURITY = "SECURITY"
    PERFORMANCE = "PERFORMANCE"


class LogCategory(Enum):
    DEPLOYMENT = "deployment"
    SECURITY = "security"
    MONITORING = "monitoring"
    ERROR_HANDLING = "error_handling"
    USER_ACTION = "user_action"
    SYSTEM = "system"
    DOCKER = "docker"
    GIT = "git"
    NETWORK = "network"
    DATABASE = "database"


@dataclass
class LogEntry:
    """Structured log entry"""
    timestamp: datetime
    level: LogLevel
    category: LogCategory
    message: str
    component: str
    trace_id: Optional[str] = None
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    stack_trace: Optional[str] = None
    performance_metrics: Optional[Dict[str, float]] = None


@dataclass
class DeploymentTrace:
    """Deployment tracing information"""
    trace_id: str
    repo_url: str
    user_id: Optional[str]
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str = "in_progress"
    stages: List[Dict[str, Any]] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)


class PerformanceTimer:
    """Context manager for performance timing"""
    
    def __init__(self, operation_name: str, logger: 'RobustLogger'):
        self.operation_name = operation_name
        self.logger = logger
        self.start_time = None
        self.end_time = None
    
    def __enter__(self):
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end_time = time.time()
        duration = self.end_time - self.start_time
        
        level = LogLevel.INFO
        if duration > 30:  # Operations taking more than 30 seconds
            level = LogLevel.WARNING
        elif duration > 60:  # Operations taking more than 1 minute
            level = LogLevel.ERROR
        
        self.logger.log_performance(
            operation=self.operation_name,
            duration=duration,
            level=level,
            success=exc_type is None
        )


class RobustLogger:
    """Comprehensive logging system"""
    
    def __init__(self):
        # Use relative path from project root (where this file is located)
        project_root = Path(__file__).parent
        self.log_dir = project_root / 'logs'
        self.log_dir.mkdir(exist_ok=True)
        
        self.deployment_traces: Dict[str, DeploymentTrace] = {}
        self.session_data: Dict[str, Dict] = {}
        
        self.setup_loggers()
        self.setup_file_handlers()
        self.setup_audit_logger()
        
    def setup_loggers(self):
        """Setup different loggers for different components"""
        # Main application logger
        self.app_logger = logging.getLogger('devops_butler')
        self.app_logger.setLevel(logging.DEBUG)
        
        # Security logger
        self.security_logger = logging.getLogger('devops_butler.security')
        self.security_logger.setLevel(logging.INFO)
        
        # Audit logger
        self.audit_logger = logging.getLogger('devops_butler.audit')
        self.audit_logger.setLevel(logging.INFO)
        
        # Performance logger
        self.performance_logger = logging.getLogger('devops_butler.performance')
        self.performance_logger.setLevel(logging.INFO)
        
        # Error logger
        self.error_logger = logging.getLogger('devops_butler.errors')
        self.error_logger.setLevel(logging.WARNING)
    
    def setup_file_handlers(self):
        """Setup file handlers for different log types"""
        # JSON formatter for structured logging
        json_formatter = JsonFormatter()
        
        # Standard formatter for human-readable logs
        standard_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        
        # Application logs
        app_handler = logging.FileHandler(self.log_dir / 'application.log')
        app_handler.setFormatter(standard_formatter)
        self.app_logger.addHandler(app_handler)
        
        # Structured JSON logs
        json_handler = logging.FileHandler(self.log_dir / 'structured.jsonl')
        json_handler.setFormatter(json_formatter)
        self.app_logger.addHandler(json_handler)
        
        # Security logs
        security_handler = logging.FileHandler(self.log_dir / 'security.log')
        security_handler.setFormatter(standard_formatter)
        self.security_logger.addHandler(security_handler)
        
        # Audit logs
        audit_handler = logging.FileHandler(self.log_dir / 'audit.log')
        audit_handler.setFormatter(standard_formatter)
        self.audit_logger.addHandler(audit_handler)
        
        # Performance logs
        perf_handler = logging.FileHandler(self.log_dir / 'performance.log')
        perf_handler.setFormatter(json_formatter)
        self.performance_logger.addHandler(perf_handler)
        
        # Error logs
        error_handler = logging.FileHandler(self.log_dir / 'errors.log')
        error_handler.setFormatter(standard_formatter)
        self.error_logger.addHandler(error_handler)
        
        # Console handler for development
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(standard_formatter)
        console_handler.setLevel(logging.INFO)
        self.app_logger.addHandler(console_handler)
    
    def setup_audit_logger(self):
        """Setup audit trail logging"""
        # Separate audit file with rotation
        audit_handler = logging.handlers.RotatingFileHandler(
            self.log_dir / 'audit_trail.log',
            maxBytes=10*1024*1024,  # 10MB
            backupCount=10
        )
        audit_formatter = logging.Formatter(
            '%(asctime)s - AUDIT - %(message)s'
        )
        audit_handler.setFormatter(audit_formatter)
        self.audit_logger.addHandler(audit_handler)
    
    def create_trace_id(self) -> str:
        """Create a unique trace ID for operations"""
        return str(uuid.uuid4())
    
    def start_deployment_trace(self, repo_url: str, user_id: Optional[str] = None) -> str:
        """Start tracing a deployment"""
        trace_id = self.create_trace_id()
        
        deployment_trace = DeploymentTrace(
            trace_id=trace_id,
            repo_url=repo_url,
            user_id=user_id,
            start_time=datetime.now()
        )
        
        self.deployment_traces[trace_id] = deployment_trace
        
        self.log_structured(
            level=LogLevel.INFO,
            category=LogCategory.DEPLOYMENT,
            message=f"Started deployment trace for {repo_url}",
            component="deployment_tracer",
            trace_id=trace_id,
            user_id=user_id,
            metadata={'repo_url': repo_url}
        )
        
        return trace_id
    
    def add_deployment_stage(self, trace_id: str, stage_name: str, status: str, details: Optional[Dict] = None):
        """Add a stage to deployment trace"""
        if trace_id in self.deployment_traces:
            stage = {
                'name': stage_name,
                'status': status,
                'timestamp': datetime.now().isoformat(),
                'details': details or {}
            }
            self.deployment_traces[trace_id].stages.append(stage)
            
            self.log_structured(
                level=LogLevel.INFO,
                category=LogCategory.DEPLOYMENT,
                message=f"Deployment stage: {stage_name} - {status}",
                component="deployment_tracer",
                trace_id=trace_id,
                metadata={'stage': stage_name, 'status': status, 'details': details}
            )
    
    def finish_deployment_trace(self, trace_id: str, status: str, final_url: Optional[str] = None):
        """Finish a deployment trace"""
        if trace_id in self.deployment_traces:
            trace = self.deployment_traces[trace_id]
            trace.end_time = datetime.now()
            trace.status = status
            
            if final_url:
                trace.metadata['final_url'] = final_url
            
            duration = (trace.end_time - trace.start_time).total_seconds()
            
            self.log_structured(
                level=LogLevel.INFO if status == 'success' else LogLevel.ERROR,
                category=LogCategory.DEPLOYMENT,
                message=f"Finished deployment trace: {status}",
                component="deployment_tracer",
                trace_id=trace_id,
                metadata={
                    'status': status,
                    'duration_seconds': duration,
                    'final_url': final_url,
                    'total_stages': len(trace.stages)
                },
                performance_metrics={'deployment_duration': duration}
            )
    
    def log_structured(
        self,
        level: LogLevel,
        category: LogCategory,
        message: str,
        component: str,
        trace_id: Optional[str] = None,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        performance_metrics: Optional[Dict[str, float]] = None,
        include_stack: bool = False
    ):
        """Log structured entry"""
        log_entry = LogEntry(
            timestamp=datetime.now(),
            level=level,
            category=category,
            message=message,
            component=component,
            trace_id=trace_id,
            user_id=user_id,
            session_id=session_id,
            metadata=metadata or {},
            performance_metrics=performance_metrics,
            stack_trace=traceback.format_stack() if include_stack else None
        )
        
        # Log to appropriate logger based on level and category
        logger = self._get_logger_for_category(category)
        # Map custom log levels to standard logging levels
        if level.value == 'AUDIT':
            log_level = logging.INFO
        elif level.value == 'SECURITY':
            log_level = logging.WARNING
        elif level.value == 'PERFORMANCE':
            log_level = logging.INFO
        else:
            log_level = getattr(logging, level.value)
        
        # Create structured log message
        log_data = {
            'timestamp': log_entry.timestamp.isoformat(),
            'level': level.value,
            'category': category.value,
            'message': message,
            'component': component,
            'trace_id': trace_id,
            'user_id': user_id,
            'session_id': session_id,
            'metadata': metadata,
            'performance_metrics': performance_metrics
        }
        
        # Log as JSON for structured logs
        logger.log(log_level, json.dumps(log_data))
        
        # Also log stack trace if included
        if include_stack and log_entry.stack_trace:
            logger.log(log_level, f"Stack trace: {log_entry.stack_trace}")
    
    def _get_logger_for_category(self, category: LogCategory) -> logging.Logger:
        """Get appropriate logger for category"""
        if category == LogCategory.SECURITY:
            return self.security_logger
        elif category == LogCategory.USER_ACTION:
            return self.audit_logger
        elif category in [LogCategory.ERROR_HANDLING]:
            return self.error_logger
        else:
            return self.app_logger
    
    def log_user_action(self, user_id: str, action: str, details: Optional[Dict] = None):
        """Log user actions for audit trail"""
        self.audit_logger.info(
            f"USER_ACTION - User: {user_id}, Action: {action}, Details: {json.dumps(details or {})}"
        )
        
        self.log_structured(
            level=LogLevel.AUDIT,
            category=LogCategory.USER_ACTION,
            message=f"User action: {action}",
            component="audit_trail",
            user_id=user_id,
            metadata={'action': action, 'details': details}
        )
    
    def log_security_event(self, event_type: str, severity: str, details: Dict[str, Any]):
        """Log security events"""
        level = LogLevel.WARNING if severity == 'medium' else LogLevel.CRITICAL
        
        self.security_logger.log(
            getattr(logging, level.value),
            f"SECURITY_EVENT - Type: {event_type}, Severity: {severity}, Details: {json.dumps(details)}"
        )
        
        self.log_structured(
            level=level,
            category=LogCategory.SECURITY,
            message=f"Security event: {event_type}",
            component="security_monitor",
            metadata={'event_type': event_type, 'severity': severity, 'details': details}
        )
    
    def log_performance(self, operation: str, duration: float, level: LogLevel = LogLevel.INFO, success: bool = True):
        """Log performance metrics"""
        self.performance_logger.info(json.dumps({
            'timestamp': datetime.now().isoformat(),
            'operation': operation,
            'duration_seconds': duration,
            'success': success,
            'level': level.value
        }))
        
        self.log_structured(
            level=level,
            category=LogCategory.SYSTEM,
            message=f"Performance: {operation}",
            component="performance_monitor",
            performance_metrics={
                'duration': duration,
                'success': success
            },
            metadata={'operation': operation}
        )
    
    def log_error(self, error: Exception, context: Optional[Dict] = None, trace_id: Optional[str] = None):
        """Log errors with full context"""
        error_data = {
            'error_type': type(error).__name__,
            'error_message': str(error),
            'context': context or {},
            'stack_trace': traceback.format_exc()
        }
        
        self.error_logger.error(f"ERROR - {json.dumps(error_data)}")
        
        self.log_structured(
            level=LogLevel.ERROR,
            category=LogCategory.ERROR_HANDLING,
            message=f"Error occurred: {type(error).__name__}",
            component="error_handler",
            trace_id=trace_id,
            metadata=error_data,
            include_stack=True
        )
    
    def get_deployment_trace(self, trace_id: str) -> Optional[DeploymentTrace]:
        """Get deployment trace by ID"""
        return self.deployment_traces.get(trace_id)
    
    def get_recent_logs(self, minutes: int = 60, level: Optional[LogLevel] = None) -> List[Dict[str, Any]]:
        """Get recent logs from structured log file"""
        logs = []
        cutoff_time = datetime.now() - timedelta(minutes=minutes)
        
        try:
            with open(self.log_dir / 'structured.jsonl', 'r') as f:
                for line in f:
                    try:
                        log_data = json.loads(line.strip())
                        log_time = datetime.fromisoformat(log_data['timestamp'])
                        
                        if log_time >= cutoff_time:
                            if level is None or log_data.get('level') == level.value:
                                logs.append(log_data)
                    except (json.JSONDecodeError, KeyError, ValueError):
                        continue
        except FileNotFoundError:
            pass
        
        return sorted(logs, key=lambda x: x['timestamp'], reverse=True)
    
    def get_deployment_logs(self, trace_id: str) -> List[Dict[str, Any]]:
        """Get all logs for a specific deployment trace"""
        logs = []
        
        try:
            with open(self.log_dir / 'structured.jsonl', 'r') as f:
                for line in f:
                    try:
                        log_data = json.loads(line.strip())
                        if log_data.get('trace_id') == trace_id:
                            logs.append(log_data)
                    except (json.JSONDecodeError, KeyError):
                        continue
        except FileNotFoundError:
            pass
        
        return sorted(logs, key=lambda x: x['timestamp'])
    
    def timer(self, operation_name: str) -> PerformanceTimer:
        """Create a performance timer context manager"""
        return PerformanceTimer(operation_name, self)
    
    def cleanup_old_logs(self, days: int = 30):
        """Clean up logs older than specified days"""
        cutoff_time = datetime.now() - timedelta(days=days)
        
        for log_file in self.log_dir.glob('*.log*'):
            try:
                if log_file.stat().st_mtime < cutoff_time.timestamp():
                    log_file.unlink()
                    self.app_logger.info(f"Cleaned up old log file: {log_file}")
            except Exception as e:
                self.app_logger.warning(f"Failed to clean up log file {log_file}: {e}")
    
    def get_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        return datetime.now().isoformat()


class JsonFormatter(logging.Formatter):
    """JSON formatter for structured logging"""
    
    def format(self, record):
        log_data = {
            'timestamp': datetime.fromtimestamp(record.created).isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)


def log_function_calls(logger: RobustLogger, category: LogCategory = LogCategory.SYSTEM):
    """Decorator to log function calls"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            
            logger.log_structured(
                level=LogLevel.DEBUG,
                category=category,
                message=f"Function call started: {func.__name__}",
                component=func.__module__,
                metadata={
                    'function': func.__name__,
                    'args_count': len(args),
                    'kwargs_keys': list(kwargs.keys())
                }
            )
            
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                
                logger.log_structured(
                    level=LogLevel.DEBUG,
                    category=category,
                    message=f"Function call completed: {func.__name__}",
                    component=func.__module__,
                    performance_metrics={'duration': duration},
                    metadata={'function': func.__name__, 'success': True}
                )
                
                return result
            
            except Exception as e:
                duration = time.time() - start_time
                
                logger.log_structured(
                    level=LogLevel.ERROR,
                    category=LogCategory.ERROR_HANDLING,
                    message=f"Function call failed: {func.__name__}",
                    component=func.__module__,
                    performance_metrics={'duration': duration},
                    metadata={
                        'function': func.__name__,
                        'success': False,
                        'error': str(e),
                        'error_type': type(e).__name__
                    },
                    include_stack=True
                )
                
                raise
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            
            logger.log_structured(
                level=LogLevel.DEBUG,
                category=category,
                message=f"Function call started: {func.__name__}",
                component=func.__module__,
                metadata={
                    'function': func.__name__,
                    'args_count': len(args),
                    'kwargs_keys': list(kwargs.keys())
                }
            )
            
            try:
                result = func(*args, **kwargs)
                duration = time.time() - start_time
                
                logger.log_structured(
                    level=LogLevel.DEBUG,
                    category=category,
                    message=f"Function call completed: {func.__name__}",
                    component=func.__module__,
                    performance_metrics={'duration': duration},
                    metadata={'function': func.__name__, 'success': True}
                )
                
                return result
            
            except Exception as e:
                duration = time.time() - start_time
                
                logger.log_structured(
                    level=LogLevel.ERROR,
                    category=LogCategory.ERROR_HANDLING,
                    message=f"Function call failed: {func.__name__}",
                    component=func.__module__,
                    performance_metrics={'duration': duration},
                    metadata={
                        'function': func.__name__,
                        'success': False,
                        'error': str(e),
                        'error_type': type(e).__name__
                    },
                    include_stack=True
                )
                
                raise
        
        # Return appropriate wrapper based on whether function is async
        if inspect.iscoroutinefunction(func):
            return async_wrapper
        else:
            return sync_wrapper
    
    return decorator


# Global logger instance
global_logger = RobustLogger()
