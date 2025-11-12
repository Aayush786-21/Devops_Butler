"""
Utility functions for DevOps Butler
"""

import re
import uuid
from urllib.parse import urlparse


def validate_git_url(git_url: str) -> bool:
    """Validates that the URL is a valid Git repository URL."""
    try:
        clean_url = git_url.rstrip('.git')
        
        # Check for invalid patterns (Docker registries, etc.)
        invalid_patterns = [
            'hub.docker.com', 'docker.io', 'quay.io', 
            'gcr.io', 'ecr.', 'azurecr.io'
        ]
        
        for pattern in invalid_patterns:
            if pattern in clean_url.lower():
                return False
        
        # Handle SSH URLs (git@github.com:user/repo)
        if clean_url.startswith('git@'):
            if ':' not in clean_url or clean_url.count(':') != 1:
                return False
            return True
        
        # Handle HTTPS URLs
        parsed = urlparse(clean_url)
        if not parsed.scheme or parsed.scheme not in ['http', 'https']:
            return False
        
        # Must have a path with at least 2 parts (user/repo)
        path_parts = parsed.path.strip('/').split('/')
        if len(path_parts) < 2:
            return False
        
        return True
    except Exception:
        return False


def extract_repo_name(git_url: str) -> str:
    """Extracts the repository name from a Git URL."""
    try:
        clean_url = git_url.rstrip('.git')
        
        if clean_url.startswith('git@'):
            # Handle SSH URLs
            repo_part = clean_url.split(':')[-1]
            parts = repo_part.split('/')
            if len(parts) >= 2:
                user_name = parts[-2]
                repo_name = parts[-1]
            else:
                user_name = "unknown"
                repo_name = parts[-1] if parts else "unknown"
        else:
            # Handle HTTPS URLs
            parsed = urlparse(clean_url)
            path_parts = parsed.path.strip('/').split('/')
            if len(path_parts) >= 2:
                user_name = path_parts[-2]
                repo_name = path_parts[-1]
            else:
                user_name = "unknown"
                repo_name = path_parts[-1] if path_parts else "unknown"
        
        # Clean up names (remove special characters)
        user_name = re.sub(r'[^a-zA-Z0-9-]', '-', user_name)
        repo_name = re.sub(r'[^a-zA-Z0-9-]', '-', repo_name)
        
        # Avoid redundancy if repo_name already contains user_name or vice versa
        if user_name.lower() in repo_name.lower() or repo_name.lower() in user_name.lower():
            # If there's significant overlap, just use the longer one
            unique_name = repo_name if len(repo_name) >= len(user_name) else user_name
        else:
            # Use user-repo combination for uniqueness
            unique_name = f"{user_name}-{repo_name}"
        
        # Ensure it starts with a letter or number
        if unique_name and not unique_name[0].isalnum():
            unique_name = 'repo-' + unique_name
        
        return unique_name.lower()
    except Exception as e:
        print(f"Error extracting repo name from {git_url}: {e}")
        return f"unknown-repo-{str(uuid.uuid4())[:8]}"

