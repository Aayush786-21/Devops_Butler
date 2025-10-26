# login.py - Authentication and User Management Models
from typing import Optional
from sqlmodel import Field, SQLModel
import datetime

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    # Ensure compatibility with existing DB schema having NOT NULL auth_provider
    auth_provider: str = Field(default='local')
    # Optional token field used by repository API (safe to be nullable)
    github_access_token: Optional[str] = Field(default=None)
    # Profile fields
    display_name: Optional[str] = Field(default=None)
    avatar_url: Optional[str] = Field(default=None)
    is_active: bool = Field(default=True)
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)

# This class defines the structure of our 'deployment' table in the database.
class Deployment(SQLModel, table=True):
    # The primary key for the table. It will be an auto-incrementing integer (1, 2, 3, ...).
    id: Optional[int] = Field(default=None, primary_key=True)
    
    # The unique ID we generate for the container/project (e.g., "proj-a1b2c3d4").
    # We add 'index=True' because we will often want to search for deployments by this ID.
    container_name: str = Field(index=True)

    # The Git URL of the deployed repository.
    git_url: str
    
    # The status of the deployment, e.g., "running", "failed", "starting".
    status: str
    
    # The pretty URL provided by Nginx (e.g., "http://proj-a1b2c3d4.localhost:8888").
    # It's 'Optional' because a deployment might fail before a URL is created.
    deployed_url: Optional[str] = None
    
    # The timestamp when the deployment was created.
    # 'default_factory=datetime.datetime.utcnow' automatically sets the current time.
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    
    # User who created this deployment
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")

class EnvironmentVariable(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    key: str = Field(index=True)
    value: str
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    updated_at: datetime.datetime = Field(default_factory=datetime.datetime.utcnow)
    
    class Config:
        # Ensure unique key per user
        indexes = [("user_id", "key")] 