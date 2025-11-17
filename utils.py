"""
Utility functions for DevOps Butler
"""

import os
from typing import Optional, Dict
import re
from urllib.parse import urlparse
import logging
from typing import Optional, Dict

logger = logging.getLogger(__name__)

def validate_git_url(git_url: str) -> bool:
    """Validate if a string is a valid Git URL"""
    if not git_url:
        return False
    
    # Check for common Git URL patterns
    patterns = [
        r'^https?://.*\.git$',
        r'^git@.*\.git$',
        r'^https?://github\.com/.*',
        r'^https?://gitlab\.com/.*',
        r'^https?://bitbucket\.org/.*',
    ]
    
    for pattern in patterns:
        if re.match(pattern, git_url):
            return True
    
    return False


def extract_repo_name(git_url: str) -> str:
    """Extract repository name from Git URL"""
    if not git_url:
        return "unknown"
    
    # Remove .git extension if present
    git_url = git_url.rstrip('.git')
    
    # Extract name from URL
    try:
        parsed = urlparse(git_url)
        path = parsed.path.strip('/')
        if path:
            # Get last part of path (repo name)
            repo_name = path.split('/')[-1]
            return repo_name
    except:
        pass
    
    # Fallback: try to extract from any format
    parts = git_url.split('/')
    if parts:
        last_part = parts[-1].rstrip('.git')
        return last_part
    
    return "unknown"


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


# -------------------------------
# Deployment State Machine Guards
# -------------------------------

# Centralized state transition table to prevent illegal status changes
ALLOWED_TRANSITIONS = {
    "imported": {"running", "failed"},
    "imported_split": {"running", "failed"},
    "starting": {"running", "failed"},
    "running": {"success", "failed"},
    "success": {"running"},  # allow redeploy
    "failed": {"running"},
}


def set_status(deployment, new_status: str) -> bool:
    """
    Safely update deployment.status using a central state machine.
    Returns True if transition applied, False if blocked.
    """
    current = (deployment.status or "").strip() or "imported"
    allowed = ALLOWED_TRANSITIONS.get(current, set())
    if new_status not in allowed:
        logger.warning(
            f"Illegal status transition {current} -> {new_status} for deployment {getattr(deployment, 'id', 'unknown')}"
        )
        return False
    deployment.status = new_status
    return True


# -------------------------------
# Invariant Assertions
# -------------------------------

class DeploymentError(Exception):
    """Raised when deployment invariants are violated."""


def assert_parent_is_split(deployment) -> None:
    git_url = (deployment.git_url or "")
    if not git_url.startswith("split::"):
        raise DeploymentError(f"Parent {deployment.id} is not split:: project")
    if deployment.parent_project_id is not None:
        raise DeploymentError(f"Parent {deployment.id} must not have parent_project_id")
    if getattr(deployment, "component_type", None) is not None:
        raise DeploymentError(f"Parent {deployment.id} must not have component_type set")


def assert_child_component(deployment) -> None:
    if deployment.parent_project_id is None:
        raise DeploymentError(f"Child {deployment.id} must have parent_project_id")
    ctype = getattr(deployment, "component_type", None)
    if ctype not in {"frontend", "backend"}:
        raise DeploymentError(f"Child {deployment.id} component_type invalid: {ctype}")


def assert_vm_running_fields(deployment) -> None:
    if deployment.status == "running":
        for field in ("vm_name", "host_port", "port"):
            if getattr(deployment, field, None) in (None, "", 0):
                raise DeploymentError(f"Deployment {deployment.id} missing required field: {field} for running status")


def assert_domain_service_localhost(service_url: str) -> None:
    # service_url must be http://localhost:<port>
    if not service_url.startswith("http://localhost:"):
        raise DeploymentError(f"service_url must be http://localhost:<port>, got: {service_url}")
