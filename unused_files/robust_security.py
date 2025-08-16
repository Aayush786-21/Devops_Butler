"""
Comprehensive Security and Validation System for DevOps Butler
Provides input validation, security scanning, vulnerability checks, and secure secrets management
"""

import re
import hashlib
import secrets
import base64
import subprocess
import json
import yaml
import asyncio
import logging
from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from pathlib import Path
import urllib.parse
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import os


class SecurityLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class VulnerabilityType(Enum):
    CODE_INJECTION = "code_injection"
    PATH_TRAVERSAL = "path_traversal"
    PRIVILEGE_ESCALATION = "privilege_escalation"
    INSECURE_DEPENDENCIES = "insecure_dependencies"
    SECRETS_EXPOSURE = "secrets_exposure"
    MALICIOUS_CODE = "malicious_code"
    RESOURCE_ABUSE = "resource_abuse"
    NETWORK_SECURITY = "network_security"


@dataclass
class SecurityViolation:
    """Security violation details"""
    violation_type: VulnerabilityType
    severity: SecurityLevel
    message: str
    details: Dict[str, Any]
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    timestamp: datetime = field(default_factory=datetime.now)


@dataclass
class ValidationResult:
    """Result of security validation"""
    is_valid: bool
    violations: List[SecurityViolation] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    score: float = 100.0  # Security score out of 100


class SecureSecretsManager:
    """Secure secrets management"""
    
    def __init__(self):
        self.secrets_dir = Path("/Users/aayush/Documents/Devops_Butler/secrets")
        self.secrets_dir.mkdir(exist_ok=True, mode=0o700)  # Only owner can access
        self.key_file = self.secrets_dir / ".master.key"
        self.secrets_file = self.secrets_dir / "secrets.enc"
        self._fernet = None
        self.setup_encryption()
    
    def setup_encryption(self):
        """Setup encryption for secrets"""
        if self.key_file.exists():
            with open(self.key_file, 'rb') as f:
                key = f.read()
        else:
            # Generate new key
            password = os.environ.get('BUTLER_MASTER_PASSWORD', 'default-insecure-password').encode()
            salt = os.urandom(16)
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(password))
            
            with open(self.key_file, 'wb') as f:
                f.write(salt + key)
            os.chmod(self.key_file, 0o600)  # Only owner can read/write
            
            key = base64.urlsafe_b64encode(kdf.derive(password))
        
        self._fernet = Fernet(key[-44:])  # Fernet keys are 44 bytes when base64 encoded
    
    def store_secret(self, name: str, value: str, metadata: Optional[Dict] = None):
        """Store an encrypted secret"""
        secrets_data = self.load_secrets()
        
        secrets_data[name] = {
            'value': self._fernet.encrypt(value.encode()).decode(),
            'created': datetime.now().isoformat(),
            'metadata': metadata or {}
        }
        
        self.save_secrets(secrets_data)
    
    def get_secret(self, name: str) -> Optional[str]:
        """Retrieve a decrypted secret"""
        secrets_data = self.load_secrets()
        
        if name in secrets_data:
            encrypted_value = secrets_data[name]['value'].encode()
            return self._fernet.decrypt(encrypted_value).decode()
        
        return None
    
    def load_secrets(self) -> Dict[str, Any]:
        """Load secrets from encrypted file"""
        if not self.secrets_file.exists():
            return {}
        
        try:
            with open(self.secrets_file, 'rb') as f:
                encrypted_data = f.read()
            
            if encrypted_data:
                decrypted_data = self._fernet.decrypt(encrypted_data)
                return json.loads(decrypted_data.decode())
        except Exception:
            pass
        
        return {}
    
    def save_secrets(self, secrets_data: Dict[str, Any]):
        """Save secrets to encrypted file"""
        json_data = json.dumps(secrets_data).encode()
        encrypted_data = self._fernet.encrypt(json_data)
        
        with open(self.secrets_file, 'wb') as f:
            f.write(encrypted_data)
        os.chmod(self.secrets_file, 0o600)


class RobustSecurityValidator:
    """Comprehensive security validation system"""
    
    def __init__(self):
        self.secrets_manager = SecureSecretsManager()
        self.setup_logging()
        self.setup_security_patterns()
        self.vulnerability_database = self.load_vulnerability_database()
    
    def setup_logging(self):
        """Setup security logging"""
        log_dir = Path("/Users/aayush/Documents/Devops_Butler/logs")
        log_dir.mkdir(exist_ok=True)
        
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_dir / 'security.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger('RobustSecurity')
    
    def setup_security_patterns(self):
        """Setup security pattern detection"""
        self.dangerous_patterns = {
            # Code injection patterns
            'code_injection': [
                r'eval\s*\(',
                r'exec\s*\(',
                r'subprocess\.call\s*\([^)]*shell\s*=\s*True',
                r'os\.system\s*\(',
                r'os\.popen\s*\(',
                r'__import__\s*\(',
                r'getattr\s*\([^)]*__',
                r'setattr\s*\([^)]*__'
            ],
            
            # Path traversal patterns
            'path_traversal': [
                r'\.\./.*\.\.',
                r'\.\.\\.*\.\.',
                r'/etc/passwd',
                r'/etc/shadow',
                r'\\windows\\system32',
                r'%SystemRoot%',
                r'\$HOME/\.\.'
            ],
            
            # Secrets exposure patterns
            'secrets_exposure': [
                r'password\s*=\s*["\'][^"\']+["\']',
                r'api_key\s*=\s*["\'][^"\']+["\']',
                r'secret\s*=\s*["\'][^"\']+["\']',
                r'token\s*=\s*["\'][^"\']+["\']',
                r'aws_access_key_id\s*=\s*["\'][^"\']+["\']',
                r'private_key\s*=\s*["\'][^"\']+["\']',
                r'-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----'
            ],
            
            # Malicious code patterns
            'malicious_code': [
                r'rm\s+-rf\s+/',
                r'chmod\s+777',
                r'curl.*\|\s*sh',
                r'wget.*\|\s*sh',
                r'nc\s+-l.*-e',
                r'/bin/sh.*-i',
                r'python.*-c.*import.*pty.*spawn',
                r'socat.*exec.*sh'
            ],
            
            # Network security patterns
            'network_security': [
                r'bind\s*\(\s*["\']0\.0\.0\.0["\']',
                r'host\s*=\s*["\']0\.0\.0\.0["\']',
                r'--host\s+0\.0\.0\.0',
                r'telnet\s+',
                r'ftp\s+.*anonymous'
            ]
        }
        
        # Compile patterns for performance
        self.compiled_patterns = {}
        for category, patterns in self.dangerous_patterns.items():
            self.compiled_patterns[category] = [re.compile(pattern, re.IGNORECASE) for pattern in patterns]
    
    def load_vulnerability_database(self) -> Dict[str, Dict]:
        """Load known vulnerability database"""
        return {
            'known_malicious_domains': [
                'malware.com', 'phishing.net', 'virus.org',
                'suspicious-domain.xyz', 'malicious-site.tk'
            ],
            'dangerous_docker_images': [
                'alpine:latest',  # Too generic, prefer specific versions
                'ubuntu:latest',  # Too generic, prefer specific versions
                'unknown/suspicious-image'
            ],
            'insecure_ports': [
                21, 23, 25, 53, 69, 79, 110, 119, 135, 139, 143, 161, 389, 445, 993, 995
            ],
            'suspicious_file_extensions': [
                '.exe', '.bat', '.cmd', '.scr', '.vbs', '.js', '.jar', '.war'
            ]
        }
    
    async def validate_git_url(self, git_url: str) -> ValidationResult:
        """Validate Git repository URL for security"""
        violations = []
        warnings = []
        
        try:
            parsed = urllib.parse.urlparse(git_url)
            
            # Check for local file access
            if parsed.scheme in ['file', '']:
                violations.append(SecurityViolation(
                    violation_type=VulnerabilityType.PATH_TRAVERSAL,
                    severity=SecurityLevel.HIGH,
                    message="Local file system access not allowed",
                    details={'url': git_url, 'scheme': parsed.scheme}
                ))
            
            # Check for suspicious domains
            if parsed.hostname:
                for malicious_domain in self.vulnerability_database['known_malicious_domains']:
                    if malicious_domain in parsed.hostname:
                        violations.append(SecurityViolation(
                            violation_type=VulnerabilityType.MALICIOUS_CODE,
                            severity=SecurityLevel.CRITICAL,
                            message=f"Malicious domain detected: {parsed.hostname}",
                            details={'url': git_url, 'domain': parsed.hostname}
                        ))
            
            # Check for non-standard ports
            if parsed.port and parsed.port in self.vulnerability_database['insecure_ports']:
                warnings.append(f"Using potentially insecure port: {parsed.port}")
            
            # Check for private/internal networks (basic check)
            if parsed.hostname:
                if any(pattern in parsed.hostname for pattern in ['127.', '10.', '192.168.', 'localhost']):
                    warnings.append("Repository from private/internal network")
        
        except Exception as e:
            violations.append(SecurityViolation(
                violation_type=VulnerabilityType.VALIDATION,
                severity=SecurityLevel.MEDIUM,
                message=f"URL validation error: {str(e)}",
                details={'url': git_url, 'error': str(e)}
            ))
        
        score = 100.0 - (len(violations) * 20) - (len(warnings) * 5)
        
        return ValidationResult(
            is_valid=len(violations) == 0,
            violations=violations,
            warnings=warnings,
            score=max(0, score)
        )
    
    async def scan_repository_content(self, repo_path: str) -> ValidationResult:
        """Scan repository content for security issues"""
        violations = []
        warnings = []
        
        try:
            # Scan all files in repository
            for file_path in Path(repo_path).rglob('*'):
                if file_path.is_file():
                    file_violations = await self._scan_file_content(file_path)
                    violations.extend(file_violations)
            
            # Check for suspicious file types
            suspicious_files = []
            for file_path in Path(repo_path).rglob('*'):
                if file_path.is_file():
                    suffix = file_path.suffix.lower()
                    if suffix in self.vulnerability_database['suspicious_file_extensions']:
                        suspicious_files.append(str(file_path))
            
            if suspicious_files:
                warnings.append(f"Suspicious file types found: {', '.join(suspicious_files)}")
            
            # Check for hidden files with potential secrets
            hidden_files = list(Path(repo_path).rglob('.*'))
            if hidden_files:
                for hidden_file in hidden_files:
                    if hidden_file.is_file() and hidden_file.name in ['.env', '.secret', '.key']:
                        violations.append(SecurityViolation(
                            violation_type=VulnerabilityType.SECRETS_EXPOSURE,
                            severity=SecurityLevel.HIGH,
                            message=f"Potential secrets file: {hidden_file.name}",
                            details={'file': str(hidden_file)},
                            file_path=str(hidden_file)
                        ))
        
        except Exception as e:
            violations.append(SecurityViolation(
                violation_type=VulnerabilityType.VALIDATION,
                severity=SecurityLevel.MEDIUM,
                message=f"Repository scan error: {str(e)}",
                details={'path': repo_path, 'error': str(e)}
            ))
        
        score = 100.0 - (len(violations) * 15) - (len(warnings) * 3)
        
        return ValidationResult(
            is_valid=len([v for v in violations if v.severity in [SecurityLevel.HIGH, SecurityLevel.CRITICAL]]) == 0,
            violations=violations,
            warnings=warnings,
            score=max(0, score)
        )
    
    async def _scan_file_content(self, file_path: Path) -> List[SecurityViolation]:
        """Scan individual file for security issues"""
        violations = []
        
        try:
            # Skip binary files and large files
            if file_path.stat().st_size > 10 * 1024 * 1024:  # 10MB limit
                return violations
            
            try:
                content = file_path.read_text(encoding='utf-8')
            except UnicodeDecodeError:
                # Likely a binary file, skip
                return violations
            
            lines = content.split('\n')
            
            # Scan for dangerous patterns
            for category, patterns in self.compiled_patterns.items():
                for pattern in patterns:
                    for line_num, line in enumerate(lines, 1):
                        if pattern.search(line):
                            severity = self._get_pattern_severity(category)
                            violations.append(SecurityViolation(
                                violation_type=self._get_vulnerability_type(category),
                                severity=severity,
                                message=f"Dangerous pattern detected: {pattern.pattern}",
                                details={'pattern': pattern.pattern, 'line': line.strip()},
                                file_path=str(file_path),
                                line_number=line_num
                            ))
            
            # Check for hardcoded credentials
            cred_violations = self._check_hardcoded_credentials(content, str(file_path))
            violations.extend(cred_violations)
        
        except Exception as e:
            violations.append(SecurityViolation(
                violation_type=VulnerabilityType.VALIDATION,
                severity=SecurityLevel.LOW,
                message=f"File scan error: {str(e)}",
                details={'file': str(file_path), 'error': str(e)},
                file_path=str(file_path)
            ))
        
        return violations
    
    def _check_hardcoded_credentials(self, content: str, file_path: str) -> List[SecurityViolation]:
        """Check for hardcoded credentials and secrets"""
        violations = []
        
        # Common credential patterns
        credential_patterns = [
            (r'password\s*[:=]\s*["\'][^"\']{6,}["\']', 'password'),
            (r'api[_-]?key\s*[:=]\s*["\'][^"\']{10,}["\']', 'api_key'),
            (r'secret[_-]?key\s*[:=]\s*["\'][^"\']{10,}["\']', 'secret_key'),
            (r'access[_-]?token\s*[:=]\s*["\'][^"\']{10,}["\']', 'access_token'),
            (r'private[_-]?key\s*[:=]\s*["\'][^"\']{20,}["\']', 'private_key'),
            (r'["\'][A-Za-z0-9]{32,}["\']', 'potential_token'),  # Generic long strings
        ]
        
        for pattern, cred_type in credential_patterns:
            matches = re.finditer(pattern, content, re.IGNORECASE)
            for match in matches:
                # Skip if it looks like a placeholder or example
                matched_text = match.group(0).lower()
                if any(placeholder in matched_text for placeholder in ['example', 'placeholder', 'your_', 'xxx', '***']):
                    continue
                
                violations.append(SecurityViolation(
                    violation_type=VulnerabilityType.SECRETS_EXPOSURE,
                    severity=SecurityLevel.HIGH,
                    message=f"Potential hardcoded {cred_type} detected",
                    details={'type': cred_type, 'pattern': pattern},
                    file_path=file_path
                ))
        
        return violations
    
    def _get_pattern_severity(self, category: str) -> SecurityLevel:
        """Get severity level for pattern category"""
        severity_map = {
            'code_injection': SecurityLevel.CRITICAL,
            'path_traversal': SecurityLevel.HIGH,
            'secrets_exposure': SecurityLevel.HIGH,
            'malicious_code': SecurityLevel.CRITICAL,
            'network_security': SecurityLevel.MEDIUM
        }
        return severity_map.get(category, SecurityLevel.LOW)
    
    def _get_vulnerability_type(self, category: str) -> VulnerabilityType:
        """Get vulnerability type for pattern category"""
        type_map = {
            'code_injection': VulnerabilityType.CODE_INJECTION,
            'path_traversal': VulnerabilityType.PATH_TRAVERSAL,
            'secrets_exposure': VulnerabilityType.SECRETS_EXPOSURE,
            'malicious_code': VulnerabilityType.MALICIOUS_CODE,
            'network_security': VulnerabilityType.NETWORK_SECURITY
        }
        return type_map.get(category, VulnerabilityType.MALICIOUS_CODE)
    
    async def validate_dockerfile(self, dockerfile_path: str) -> ValidationResult:
        """Validate Dockerfile for security issues"""
        violations = []
        warnings = []
        
        try:
            with open(dockerfile_path, 'r') as f:
                content = f.read()
            
            lines = content.split('\n')
            
            for line_num, line in enumerate(lines, 1):
                line = line.strip()
                
                # Check for running as root
                if line.upper().startswith('USER ROOT') or 'USER 0' in line.upper():
                    violations.append(SecurityViolation(
                        violation_type=VulnerabilityType.PRIVILEGE_ESCALATION,
                        severity=SecurityLevel.HIGH,
                        message="Container running as root user",
                        details={'line': line},
                        file_path=dockerfile_path,
                        line_number=line_num
                    ))
                
                # Check for dangerous commands
                if any(cmd in line.upper() for cmd in ['RM -RF /', 'CHMOD 777', 'WGET | SH', 'CURL | SH']):
                    violations.append(SecurityViolation(
                        violation_type=VulnerabilityType.MALICIOUS_CODE,
                        severity=SecurityLevel.CRITICAL,
                        message="Dangerous command in Dockerfile",
                        details={'line': line},
                        file_path=dockerfile_path,
                        line_number=line_num
                    ))
                
                # Check for using latest tag
                if 'FROM' in line.upper() and ':LATEST' in line.upper():
                    warnings.append(f"Using 'latest' tag in FROM instruction (line {line_num})")
                
                # Check for exposed sensitive ports
                if line.upper().startswith('EXPOSE'):
                    ports = re.findall(r'\d+', line)
                    for port in ports:
                        if int(port) in self.vulnerability_database['insecure_ports']:
                            warnings.append(f"Exposing potentially insecure port {port} (line {line_num})")
        
        except Exception as e:
            violations.append(SecurityViolation(
                violation_type=VulnerabilityType.VALIDATION,
                severity=SecurityLevel.MEDIUM,
                message=f"Dockerfile validation error: {str(e)}",
                details={'file': dockerfile_path, 'error': str(e)}
            ))
        
        score = 100.0 - (len(violations) * 20) - (len(warnings) * 5)
        
        return ValidationResult(
            is_valid=len([v for v in violations if v.severity in [SecurityLevel.HIGH, SecurityLevel.CRITICAL]]) == 0,
            violations=violations,
            warnings=warnings,
            score=max(0, score)
        )
    
    async def validate_docker_compose(self, compose_path: str) -> ValidationResult:
        """Validate docker-compose.yml for security issues"""
        violations = []
        warnings = []
        
        try:
            with open(compose_path, 'r') as f:
                compose_data = yaml.safe_load(f)
            
            services = compose_data.get('services', {})
            
            for service_name, service_config in services.items():
                # Check for privileged containers
                if service_config.get('privileged', False):
                    violations.append(SecurityViolation(
                        violation_type=VulnerabilityType.PRIVILEGE_ESCALATION,
                        severity=SecurityLevel.HIGH,
                        message=f"Service '{service_name}' running in privileged mode",
                        details={'service': service_name}
                    ))
                
                # Check for host network mode
                if service_config.get('network_mode') == 'host':
                    violations.append(SecurityViolation(
                        violation_type=VulnerabilityType.NETWORK_SECURITY,
                        severity=SecurityLevel.MEDIUM,
                        message=f"Service '{service_name}' using host network mode",
                        details={'service': service_name}
                    ))
                
                # Check for volume mounts
                volumes = service_config.get('volumes', [])
                for volume in volumes:
                    if isinstance(volume, str) and ('/' in volume or '\\' in volume):
                        if volume.startswith('/') or ':\\' in volume:
                            warnings.append(f"Service '{service_name}' mounting host directory: {volume}")
                
                # Check for environment variables with secrets
                environment = service_config.get('environment', {})
                if isinstance(environment, dict):
                    for key, value in environment.items():
                        if any(secret_key in key.lower() for secret_key in ['password', 'secret', 'key', 'token']):
                            if value and not str(value).startswith('${'):  # Not using env variable substitution
                                violations.append(SecurityViolation(
                                    violation_type=VulnerabilityType.SECRETS_EXPOSURE,
                                    severity=SecurityLevel.MEDIUM,
                                    message=f"Hardcoded secret in environment variable: {key}",
                                    details={'service': service_name, 'env_var': key}
                                ))
        
        except Exception as e:
            violations.append(SecurityViolation(
                violation_type=VulnerabilityType.VALIDATION,
                severity=SecurityLevel.MEDIUM,
                message=f"Docker Compose validation error: {str(e)}",
                details={'file': compose_path, 'error': str(e)}
            ))
        
        score = 100.0 - (len(violations) * 15) - (len(warnings) * 3)
        
        return ValidationResult(
            is_valid=len([v for v in violations if v.severity in [SecurityLevel.HIGH, SecurityLevel.CRITICAL]]) == 0,
            violations=violations,
            warnings=warnings,
            score=max(0, score)
        )
    
    async def check_dependencies_security(self, repo_path: str) -> ValidationResult:
        """Check dependencies for known vulnerabilities"""
        violations = []
        warnings = []
        
        try:
            # Check for common dependency files
            dependency_files = [
                'requirements.txt', 'package.json', 'Gemfile', 'go.mod', 
                'pom.xml', 'build.gradle', 'composer.json', 'Cargo.toml'
            ]
            
            found_files = []
            for dep_file in dependency_files:
                file_path = Path(repo_path) / dep_file
                if file_path.exists():
                    found_files.append(dep_file)
            
            if not found_files:
                warnings.append("No dependency files found for security scanning")
                return ValidationResult(is_valid=True, warnings=warnings, score=90.0)
            
            # Basic checks for Python requirements.txt
            requirements_path = Path(repo_path) / 'requirements.txt'
            if requirements_path.exists():
                with open(requirements_path, 'r') as f:
                    requirements = f.read()
                
                # Check for unpinned versions
                unpinned_packages = re.findall(r'^([a-zA-Z0-9\-_]+)(?!\s*[=<>])', requirements, re.MULTILINE)
                if unpinned_packages:
                    warnings.append(f"Unpinned package versions found: {', '.join(unpinned_packages[:5])}")
                
                # Check for known vulnerable packages (simplified check)
                known_vulnerable = ['django<3.0', 'flask<1.0', 'requests<2.20']
                for vuln_pkg in known_vulnerable:
                    if vuln_pkg.split('<')[0] in requirements:
                        violations.append(SecurityViolation(
                            violation_type=VulnerabilityType.INSECURE_DEPENDENCIES,
                            severity=SecurityLevel.MEDIUM,
                            message=f"Potentially vulnerable dependency: {vuln_pkg}",
                            details={'package': vuln_pkg}
                        ))
            
            # Basic checks for package.json
            package_json_path = Path(repo_path) / 'package.json'
            if package_json_path.exists():
                with open(package_json_path, 'r') as f:
                    package_data = json.loads(f.read())
                
                dependencies = package_data.get('dependencies', {})
                
                # Check for known vulnerable packages
                vulnerable_js_packages = ['lodash', 'moment', 'jquery']
                for pkg_name in vulnerable_js_packages:
                    if pkg_name in dependencies:
                        warnings.append(f"Package with known vulnerabilities: {pkg_name}")
        
        except Exception as e:
            violations.append(SecurityViolation(
                violation_type=VulnerabilityType.VALIDATION,
                severity=SecurityLevel.LOW,
                message=f"Dependency check error: {str(e)}",
                details={'path': repo_path, 'error': str(e)}
            ))
        
        score = 100.0 - (len(violations) * 10) - (len(warnings) * 2)
        
        return ValidationResult(
            is_valid=len(violations) == 0,
            violations=violations,
            warnings=warnings,
            score=max(0, score)
        )
    
    async def comprehensive_security_scan(self, repo_path: str, git_url: str) -> Dict[str, ValidationResult]:
        """Perform comprehensive security scan"""
        self.logger.info(f"Starting comprehensive security scan for {git_url}")
        
        results = {}
        
        # Validate Git URL
        results['git_url'] = await self.validate_git_url(git_url)
        
        # Scan repository content
        results['content'] = await self.scan_repository_content(repo_path)
        
        # Validate Dockerfile if present
        dockerfile_path = Path(repo_path) / 'Dockerfile'
        if dockerfile_path.exists():
            results['dockerfile'] = await self.validate_dockerfile(str(dockerfile_path))
        
        # Validate docker-compose.yml if present
        for compose_file in ['docker-compose.yml', 'docker-compose.yaml']:
            compose_path = Path(repo_path) / compose_file
            if compose_path.exists():
                results['docker_compose'] = await self.validate_docker_compose(str(compose_path))
                break
        
        # Check dependencies
        results['dependencies'] = await self.check_dependencies_security(repo_path)
        
        self.logger.info(f"Security scan completed for {git_url}")
        
        return results
    
    def generate_security_report(self, scan_results: Dict[str, ValidationResult]) -> Dict[str, Any]:
        """Generate comprehensive security report"""
        total_violations = 0
        total_warnings = 0
        critical_violations = 0
        high_violations = 0
        overall_score = 0
        
        component_results = {}
        
        for component, result in scan_results.items():
            total_violations += len(result.violations)
            total_warnings += len(result.warnings)
            
            critical_violations += len([v for v in result.violations if v.severity == SecurityLevel.CRITICAL])
            high_violations += len([v for v in result.violations if v.severity == SecurityLevel.HIGH])
            
            overall_score += result.score
            
            component_results[component] = {
                'score': result.score,
                'violations': len(result.violations),
                'warnings': len(result.warnings),
                'is_valid': result.is_valid,
                'details': [
                    {
                        'type': v.violation_type.value,
                        'severity': v.severity.value,
                        'message': v.message,
                        'file': v.file_path,
                        'line': v.line_number
                    } for v in result.violations
                ]
            }
        
        overall_score = overall_score / len(scan_results) if scan_results else 0
        
        # Determine overall security status
        if critical_violations > 0:
            status = "CRITICAL"
        elif high_violations > 0:
            status = "HIGH_RISK"
        elif total_violations > 5:
            status = "MEDIUM_RISK"
        elif total_warnings > 10:
            status = "LOW_RISK"
        else:
            status = "SECURE"
        
        return {
            'overall_status': status,
            'overall_score': round(overall_score, 2),
            'summary': {
                'total_violations': total_violations,
                'critical_violations': critical_violations,
                'high_violations': high_violations,
                'total_warnings': total_warnings
            },
            'components': component_results,
            'timestamp': datetime.now().isoformat(),
            'recommendations': self._generate_recommendations(scan_results)
        }
    
    def _generate_recommendations(self, scan_results: Dict[str, ValidationResult]) -> List[str]:
        """Generate security recommendations based on scan results"""
        recommendations = []
        
        for component, result in scan_results.items():
            for violation in result.violations:
                if violation.severity == SecurityLevel.CRITICAL:
                    recommendations.append(f"CRITICAL: Fix {violation.violation_type.value} in {component}")
                elif violation.severity == SecurityLevel.HIGH:
                    recommendations.append(f"HIGH: Address {violation.violation_type.value} in {component}")
        
        if not recommendations:
            recommendations.append("No critical security issues found. Continue following security best practices.")
        
        return recommendations


# Global security validator instance
global_security_validator = RobustSecurityValidator()
