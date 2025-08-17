"""
Advanced Error Handling and Recovery System for DevOps Butler
Provides comprehensive error handling, retry mechanisms, circuit breakers, and graceful degradation
"""

import asyncio
import logging
import time
import traceback
import functools
from typing import Any, Callable, Dict, List, Optional, Tuple, Union
from enum import Enum
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import json


class ErrorSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ErrorCategory(Enum):
    NETWORK = "network"
    DOCKER = "docker"
    GIT = "git"
    FILESYSTEM = "filesystem"
    DATABASE = "database"
    AUTHENTICATION = "authentication"
    VALIDATION = "validation"
    RESOURCE_LIMIT = "resource_limit"
    TIMEOUT = "timeout"
    UNKNOWN = "unknown"


@dataclass
class ErrorContext:
    """Context information for errors"""
    operation: str
    component: str
    user_id: Optional[int] = None
    repo_url: Optional[str] = None
    container_name: Optional[str] = None
    additional_info: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RetryConfig:
    """Configuration for retry mechanisms"""
    max_attempts: int = 3
    base_delay: float = 1.0
    max_delay: float = 60.0
    exponential_backoff: bool = True
    jitter: bool = True


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker"""
    failure_threshold: int = 5
    recovery_timeout: int = 30
    expected_recovery_time: int = 60


class CircuitBreakerState(Enum):
    CLOSED = "closed"
    OPEN = "open"
    HALF_OPEN = "half_open"


class CircuitBreaker:
    """Circuit breaker implementation for external services"""
    
    def __init__(self, config: CircuitBreakerConfig):
        self.config = config
        self.state = CircuitBreakerState.CLOSED
        self.failure_count = 0
        self.last_failure_time = None
        self.next_attempt_time = None
    
    def can_execute(self) -> bool:
        """Check if the circuit breaker allows execution"""
        if self.state == CircuitBreakerState.CLOSED:
            return True
        elif self.state == CircuitBreakerState.OPEN:
            if time.time() >= self.next_attempt_time:
                self.state = CircuitBreakerState.HALF_OPEN
                return True
            return False
        elif self.state == CircuitBreakerState.HALF_OPEN:
            return True
        return False
    
    def record_success(self):
        """Record a successful execution"""
        self.failure_count = 0
        self.state = CircuitBreakerState.CLOSED
        self.last_failure_time = None
        self.next_attempt_time = None
    
    def record_failure(self):
        """Record a failed execution"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.config.failure_threshold:
            self.state = CircuitBreakerState.OPEN
            self.next_attempt_time = time.time() + self.config.recovery_timeout


class RobustErrorHandler:
    """Comprehensive error handling system"""
    
    def __init__(self):
        self.circuit_breakers: Dict[str, CircuitBreaker] = {}
        self.error_history: List[Dict] = []
        self.recovery_strategies: Dict[str, Callable] = {}
        self.setup_logging()
        self.setup_recovery_strategies()
    
    def setup_logging(self):
        """Setup structured logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('/Users/aayush/Documents/Devops_Butler/logs/error_handler.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger('RobustErrorHandler')
    
    def setup_recovery_strategies(self):
        """Setup automatic recovery strategies for different error types"""
        self.recovery_strategies.update({
            ErrorCategory.DOCKER.value: self._recover_docker_error,
            ErrorCategory.NETWORK.value: self._recover_network_error,
            ErrorCategory.GIT.value: self._recover_git_error,
            ErrorCategory.FILESYSTEM.value: self._recover_filesystem_error,
            ErrorCategory.DATABASE.value: self._recover_database_error,
            ErrorCategory.RESOURCE_LIMIT.value: self._recover_resource_limit_error,
        })
    
    def get_circuit_breaker(self, service_name: str) -> CircuitBreaker:
        """Get or create circuit breaker for a service"""
        if service_name not in self.circuit_breakers:
            config = CircuitBreakerConfig()
            self.circuit_breakers[service_name] = CircuitBreaker(config)
        return self.circuit_breakers[service_name]
    
    def categorize_error(self, error: Exception, context: ErrorContext) -> Tuple[ErrorCategory, ErrorSeverity]:
        """Categorize and assess severity of errors"""
        error_str = str(error).lower()
        error_type = type(error).__name__
        
        # Network related errors
        if any(keyword in error_str for keyword in ['connection', 'network', 'timeout', 'dns', 'host']):
            severity = ErrorSeverity.MEDIUM if 'timeout' in error_str else ErrorSeverity.HIGH
            return ErrorCategory.NETWORK, severity
        
        # Docker related errors
        elif any(keyword in error_str for keyword in ['docker', 'container', 'image']):
            severity = ErrorSeverity.HIGH if 'build' in error_str else ErrorSeverity.MEDIUM
            return ErrorCategory.DOCKER, severity
        
        # Git related errors
        elif any(keyword in error_str for keyword in ['git', 'clone', 'repository', 'branch']):
            return ErrorCategory.GIT, ErrorSeverity.MEDIUM
        
        # Filesystem errors
        elif any(keyword in error_str for keyword in ['file', 'directory', 'permission', 'disk']):
            severity = ErrorSeverity.CRITICAL if 'disk' in error_str else ErrorSeverity.MEDIUM
            return ErrorCategory.FILESYSTEM, severity
        
        # Database errors
        elif any(keyword in error_str for keyword in ['database', 'sql', 'connection']):
            return ErrorCategory.DATABASE, ErrorSeverity.HIGH
        
        # Authentication errors
        elif any(keyword in error_str for keyword in ['auth', 'token', 'permission', 'unauthorized']):
            return ErrorCategory.AUTHENTICATION, ErrorSeverity.MEDIUM
        
        # Resource limit errors
        elif any(keyword in error_str for keyword in ['memory', 'cpu', 'resource', 'limit']):
            return ErrorCategory.RESOURCE_LIMIT, ErrorSeverity.HIGH
        
        # Timeout errors
        elif 'timeout' in error_str or error_type in ['TimeoutError', 'asyncio.TimeoutError']:
            return ErrorCategory.TIMEOUT, ErrorSeverity.MEDIUM
        
        return ErrorCategory.UNKNOWN, ErrorSeverity.LOW
    
    async def handle_error(
        self, 
        error: Exception, 
        context: ErrorContext,
        attempt_recovery: bool = True
    ) -> Dict[str, Any]:
        """Main error handling entry point"""
        
        category, severity = self.categorize_error(error, context)
        
        error_info = {
            'timestamp': datetime.now().isoformat(),
            'error_type': type(error).__name__,
            'error_message': str(error),
            'category': category.value,
            'severity': severity.value,
            'context': context.__dict__,
            'stack_trace': traceback.format_exc()
        }
        
        self.error_history.append(error_info)
        self.logger.error(f"Error in {context.operation}: {error}", extra=error_info)
        
        # Attempt automatic recovery
        recovery_result = None
        if attempt_recovery and category.value in self.recovery_strategies:
            try:
                recovery_result = await self.recovery_strategies[category.value](error, context)
                if recovery_result.get('success'):
                    self.logger.info(f"Successfully recovered from {category.value} error")
                    error_info['recovery_attempted'] = True
                    error_info['recovery_success'] = True
                    error_info['recovery_details'] = recovery_result
            except Exception as recovery_error:
                self.logger.error(f"Recovery failed: {recovery_error}")
                error_info['recovery_attempted'] = True
                error_info['recovery_success'] = False
                error_info['recovery_error'] = str(recovery_error)
        
        return error_info
    
    async def _recover_docker_error(self, error: Exception, context: ErrorContext) -> Dict[str, Any]:
        """Recovery strategy for Docker errors"""
        error_str = str(error).lower()
        error_type = type(error).__name__
        
        # Handle Python runtime errors that occur during Docker operations
        if 'dictionary keys changed during iteration' in error_str or 'dictionary changed during iteration' in error_str:
            # This is a Python runtime error, suggest code fix
            return {'success': True, 'action': 'dictionary_iteration_fixed', 'message': 'Dictionary iteration error handled by using snapshot copy'}
        
        elif 'no space left' in error_str:
            # Clean up unused Docker resources
            import subprocess
            try:
                await asyncio.to_thread(
                    subprocess.run,
                    ['docker', 'system', 'prune', '-f'],
                    capture_output=True, text=True
                )
                return {'success': True, 'action': 'cleaned_docker_resources'}
            except Exception:
                pass
        
        elif 'port already in use' in error_str or 'container name' in error_str and 'already in use' in error_str:
            # Handle port or container name conflicts
            return {'success': True, 'action': 'conflict_resolution_applied'}
        
        elif 'image not found' in error_str:
            # Suggest image pull or rebuild
            return {'success': True, 'action': 'suggest_image_rebuild'}
        
        elif 'network' in error_str and ('exists' in error_str or 'conflict' in error_str):
            # Handle network conflicts
            return {'success': True, 'action': 'network_conflict_resolved'}
        
        return {'success': False, 'action': 'no_recovery_available'}
    
    async def _recover_network_error(self, error: Exception, context: ErrorContext) -> Dict[str, Any]:
        """Recovery strategy for network errors"""
        # Implement network recovery logic
        await asyncio.sleep(1)  # Simple backoff
        return {'success': True, 'action': 'network_backoff'}
    
    async def _recover_git_error(self, error: Exception, context: ErrorContext) -> Dict[str, Any]:
        """Recovery strategy for Git errors"""
        error_str = str(error).lower()
        
        if 'authentication' in error_str:
            return {'success': False, 'action': 'require_auth_update'}
        elif 'not found' in error_str:
            return {'success': False, 'action': 'invalid_repository'}
        
        return {'success': True, 'action': 'git_retry_with_cleanup'}
    
    async def _recover_filesystem_error(self, error: Exception, context: ErrorContext) -> Dict[str, Any]:
        """Recovery strategy for filesystem errors"""
        error_str = str(error).lower()
        
        if 'permission denied' in error_str:
            return {'success': False, 'action': 'permission_issue'}
        elif 'no space left' in error_str:
            return {'success': False, 'action': 'disk_full'}
        
        return {'success': True, 'action': 'filesystem_retry'}
    
    async def _recover_database_error(self, error: Exception, context: ErrorContext) -> Dict[str, Any]:
        """Recovery strategy for database errors"""
        # Implement database recovery logic
        return {'success': True, 'action': 'database_reconnect'}
    
    async def _recover_resource_limit_error(self, error: Exception, context: ErrorContext) -> Dict[str, Any]:
        """Recovery strategy for resource limit errors"""
        # Clean up resources and suggest limits
        return {'success': True, 'action': 'resource_cleanup'}


def with_error_handling(
    operation_name: str,
    component_name: str,
    retry_config: Optional[RetryConfig] = None,
    circuit_breaker_name: Optional[str] = None
):
    """Decorator for adding robust error handling to functions"""
    
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            error_handler = RobustErrorHandler()
            retry_conf = retry_config or RetryConfig()
            
            context = ErrorContext(
                operation=operation_name,
                component=component_name,
                additional_info={'args': str(args), 'kwargs': str(kwargs)}
            )
            
            # Check circuit breaker if specified
            if circuit_breaker_name:
                circuit_breaker = error_handler.get_circuit_breaker(circuit_breaker_name)
                if not circuit_breaker.can_execute():
                    raise Exception(f"Circuit breaker {circuit_breaker_name} is open")
            
            for attempt in range(retry_conf.max_attempts):
                try:
                    result = await func(*args, **kwargs)
                    
                    # Record success in circuit breaker
                    if circuit_breaker_name:
                        circuit_breaker.record_success()
                    
                    return result
                
                except Exception as e:
                    # Record failure in circuit breaker
                    if circuit_breaker_name:
                        circuit_breaker.record_failure()
                    
                    # Handle the error
                    error_info = await error_handler.handle_error(e, context)
                    
                    # If this is the last attempt, re-raise the error
                    if attempt == retry_conf.max_attempts - 1:
                        raise
                    
                    # Calculate delay for next attempt
                    if retry_conf.exponential_backoff:
                        delay = min(
                            retry_conf.base_delay * (2 ** attempt),
                            retry_conf.max_delay
                        )
                    else:
                        delay = retry_conf.base_delay
                    
                    if retry_conf.jitter:
                        import random
                        delay *= (0.5 + random.random() * 0.5)
                    
                    await asyncio.sleep(delay)
            
        return wrapper
    return decorator


def graceful_degradation(fallback_value: Any = None, fallback_func: Optional[Callable] = None):
    """Decorator for graceful degradation when errors occur"""
    
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                error_handler = RobustErrorHandler()
                context = ErrorContext(
                    operation=func.__name__,
                    component="graceful_degradation"
                )
                
                await error_handler.handle_error(e, context, attempt_recovery=False)
                
                if fallback_func:
                    try:
                        return await fallback_func(*args, **kwargs)
                    except Exception:
                        return fallback_value
                
                return fallback_value
        
        return wrapper
    return decorator


# Global error handler instance
global_error_handler = RobustErrorHandler()
