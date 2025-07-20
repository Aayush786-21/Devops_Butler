import os
import httpx
from typing import Optional, Dict, Any, List
from sqlmodel import Session, select
from database import engine
from login import User
from auth import get_password_hash, create_access_token
from datetime import timedelta

# GitHub OAuth Configuration - Using demo app for easier setup
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID", "demo_client_id")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET", "demo_client_secret")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "http://localhost:8000/api/auth/github/callback")

# Demo GitHub OAuth App (for testing purposes)
DEMO_GITHUB_CLIENT_ID = "demo_devops_butler"
DEMO_GITHUB_CLIENT_SECRET = "demo_secret_key"

class GitHubOAuth:
    def __init__(self):
        # Use demo credentials if no real ones are provided
        self.client_id = GITHUB_CLIENT_ID if GITHUB_CLIENT_ID != "demo_client_id" else DEMO_GITHUB_CLIENT_ID
        self.client_secret = GITHUB_CLIENT_SECRET if GITHUB_CLIENT_SECRET != "demo_client_secret" else DEMO_GITHUB_CLIENT_SECRET
        self.redirect_uri = GITHUB_REDIRECT_URI
        
    def get_authorization_url(self) -> str:
        """Generate GitHub OAuth authorization URL."""
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
        # For demo purposes, return a mock token if using demo credentials
        if self.client_id == DEMO_GITHUB_CLIENT_ID:
            return "demo_access_token"
            
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
        # For demo purposes, return mock user data
        if access_token == "demo_access_token":
            return {
                "id": "12345678",
                "username": "demo_user",
                "email": "demo@github.local",
                "avatar_url": "https://avatars.githubusercontent.com/u/12345678?v=4",
                "name": "Demo User"
            }
        
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
        # For demo purposes, return popular public repositories
        if access_token == "demo_access_token":
            return await self.get_demo_repositories()
        
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
    
    async def get_demo_repositories(self) -> List[Dict[str, Any]]:
        """Get demo repositories for testing purposes."""
        # Return some popular public repositories for demo
        demo_repos = [
            {
                "name": "react",
                "full_name": "facebook/react",
                "html_url": "https://github.com/facebook/react",
                "clone_url": "https://github.com/facebook/react.git",
                "description": "The library for web and native user interfaces",
                "language": "JavaScript",
                "updated_at": "2024-01-15T10:30:00Z",
                "private": False,
                "fork": False
            },
            {
                "name": "vue",
                "full_name": "vuejs/vue",
                "html_url": "https://github.com/vuejs/vue",
                "clone_url": "https://github.com/vuejs/vue.git",
                "description": "Vue.js is a progressive, incrementally-adoptable JavaScript framework",
                "language": "JavaScript",
                "updated_at": "2024-01-14T15:45:00Z",
                "private": False,
                "fork": False
            },
            {
                "name": "django",
                "full_name": "django/django",
                "html_url": "https://github.com/django/django",
                "clone_url": "https://github.com/django/django.git",
                "description": "The Web framework for perfectionists with deadlines",
                "language": "Python",
                "updated_at": "2024-01-13T09:20:00Z",
                "private": False,
                "fork": False
            },
            {
                "name": "flask",
                "full_name": "pallets/flask",
                "html_url": "https://github.com/pallets/flask",
                "clone_url": "https://github.com/pallets/flask.git",
                "description": "The Python micro framework for building web applications",
                "language": "Python",
                "updated_at": "2024-01-12T14:10:00Z",
                "private": False,
                "fork": False
            },
            {
                "name": "next.js",
                "full_name": "vercel/next.js",
                "html_url": "https://github.com/vercel/next.js",
                "clone_url": "https://github.com/vercel/next.js.git",
                "description": "The React Framework for Production",
                "language": "JavaScript",
                "updated_at": "2024-01-11T11:25:00Z",
                "private": False,
                "fork": False
            },
            {
                "name": "fastapi",
                "full_name": "tiangolo/fastapi",
                "html_url": "https://github.com/tiangolo/fastapi",
                "clone_url": "https://github.com/tiangolo/fastapi.git",
                "description": "FastAPI framework, high performance, easy to learn, fast to code",
                "language": "Python",
                "updated_at": "2024-01-10T16:40:00Z",
                "private": False,
                "fork": False
            }
        ]
        return demo_repos
    
    async def get_public_repositories_by_username(self, username: str) -> List[Dict[str, Any]]:
        """Get public repositories for any GitHub username without authentication."""
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
    
    async def authenticate_or_create_user(self, github_user_data: Dict[str, Any], access_token: str = None) -> Optional[User]:
        """Authenticate existing user or create new one from GitHub data."""
        with Session(engine) as session:
            # Check if user exists by GitHub ID
            existing_user = session.exec(
                select(User).where(User.github_id == github_user_data["id"])
            ).first()
            
            if existing_user:
                # Update access token if provided
                if access_token:
                    existing_user.github_access_token = access_token
                    session.add(existing_user)
                    session.commit()
                    session.refresh(existing_user)
                return existing_user
            
            # Check if user exists by email
            if github_user_data.get("email"):
                existing_user = session.exec(
                    select(User).where(User.email == github_user_data["email"])
                ).first()
                
                if existing_user:
                    # Update existing user with GitHub info
                    existing_user.github_id = github_user_data["id"]
                    existing_user.github_username = github_user_data["username"]
                    existing_user.github_avatar_url = github_user_data.get("avatar_url")
                    existing_user.auth_provider = "github"
                    if access_token:
                        existing_user.github_access_token = access_token
                    session.add(existing_user)
                    session.commit()
                    session.refresh(existing_user)
                    return existing_user
            
            # Create new user
            new_user = User(
                username=github_user_data["username"],
                email=github_user_data.get("email", f"{github_user_data['username']}@github.local"),
                hashed_password=get_password_hash("github_oauth_user"),  # Dummy password for OAuth users
                github_id=github_user_data["id"],
                github_username=github_user_data["username"],
                github_avatar_url=github_user_data.get("avatar_url"),
                github_access_token=access_token,
                auth_provider="github"
            )
            
            session.add(new_user)
            session.commit()
            session.refresh(new_user)
            return new_user
    
    def create_user_token(self, user: User) -> str:
        """Create JWT token for GitHub user."""
        access_token_expires = timedelta(minutes=30)
        return create_access_token(
            data={"sub": user.username}, 
            expires_delta=access_token_expires
        )

# Global instance
github_oauth = GitHubOAuth() 