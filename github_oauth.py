import os
import httpx
from typing import Optional, Dict, Any, List
from sqlmodel import Session, select
from database import engine
from login import User
from auth import get_password_hash, create_access_token
from datetime import timedelta

# GitHub OAuth Configuration
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/api/auth/github/callback")

class GitHubOAuth:
    def __init__(self):
        self.client_id = GITHUB_CLIENT_ID
        self.client_secret = GITHUB_CLIENT_SECRET
        self.redirect_uri = GITHUB_REDIRECT_URI
        
    def get_authorization_url(self) -> str:
        """Generate GitHub OAuth authorization URL."""
        if not self.client_id:
            raise ValueError("GitHub Client ID not configured")
            
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "read:user user:email repo",
            "response_type": "code"
        }
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"https://github.com/login/oauth/authorize?{query_string}"
    
    async def exchange_code_for_token(self, code: str) -> Optional[str]:
        """Exchange authorization code for access token."""
        if not self.client_id or not self.client_secret:
            return None
            
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "redirect_uri": self.redirect_uri
                },
                headers={"Accept": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("access_token")
            return None
    
    async def get_user_info(self, access_token: str) -> Optional[Dict[str, Any]]:
        """Get user information from GitHub API."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"token {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                }
            )
            
            if response.status_code == 200:
                user_data = response.json()
                
                # Get user email
                email_response = await client.get(
                    "https://api.github.com/user/emails",
                    headers={
                        "Authorization": f"token {access_token}",
                        "Accept": "application/vnd.github.v3+json"
                    }
                )
                
                emails = email_response.json() if email_response.status_code == 200 else []
                primary_email = next((email["email"] for email in emails if email["primary"]), user_data.get("email"))
                
                return {
                    "id": str(user_data["id"]),
                    "username": user_data["login"],
                    "email": primary_email,
                    "avatar_url": user_data.get("avatar_url"),
                    "name": user_data.get("name")
                }
            return None
    
    async def get_user_repositories(self, access_token: str, username: str) -> List[Dict[str, Any]]:
        """Get user repositories from GitHub API."""
        async with httpx.AsyncClient() as client:
            # Get user's repositories
            response = await client.get(
                f"https://api.github.com/users/{username}/repos",
                headers={
                    "Authorization": f"token {access_token}",
                    "Accept": "application/vnd.github.v3+json"
                },
                params={
                    "sort": "updated",
                    "per_page": 50,
                    "type": "owner"
                }
            )
            
            if response.status_code == 200:
                repos = response.json()
                return [
                    {
                        "name": repo["name"],
                        "full_name": repo["full_name"],
                        "html_url": repo["html_url"],
                        "clone_url": repo["clone_url"],
                        "description": repo.get("description", ""),
                        "language": repo.get("language"),
                        "updated_at": repo["updated_at"],
                        "private": repo["private"],
                        "fork": repo["fork"]
                    }
                    for repo in repos
                ]
            return []
    
    async def get_public_repositories_by_username(self, username: str) -> List[Dict[str, Any]]:
        """Get public repositories for any GitHub username (no authentication required)."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.github.com/users/{username}/repos",
                headers={"Accept": "application/vnd.github.v3+json"},
                params={
                    "sort": "updated",
                    "per_page": 30,
                    "type": "public"
                }
            )
            
            if response.status_code == 200:
                repos = response.json()
                return [
                    {
                        "name": repo["name"],
                        "full_name": repo["full_name"],
                        "html_url": repo["html_url"],
                        "clone_url": repo["clone_url"],
                        "description": repo.get("description", ""),
                        "language": repo.get("language"),
                        "updated_at": repo["updated_at"],
                        "private": repo["private"],
                        "fork": repo["fork"]
                    }
                    for repo in repos
                ]
            return []

# Global instance
github_oauth = GitHubOAuth() 