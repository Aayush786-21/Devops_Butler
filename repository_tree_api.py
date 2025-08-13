"""
Repository Tree API Endpoints
Provides endpoints for browsing repository contents as a tree structure
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
import httpx
from auth import get_current_user
from login import User

router = APIRouter(prefix="/api/repository", tags=["repository"])

@router.get("/{owner}/{repo}/contents")
async def get_repository_contents(
    owner: str,
    repo: str,
    path: str = "",
    branch: str = "main",
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Get repository contents (files and directories) for a given path
    """
    try:
        async with httpx.AsyncClient() as client:
            url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
            headers = {
                "Accept": "application/vnd.github.v3+json"
            }
            
            # Add authorization if user is authenticated and has GitHub token
            if current_user and hasattr(current_user, 'github_access_token') and current_user.github_access_token:
                headers["Authorization"] = f"token {current_user.github_access_token}"
            params = {"ref": branch}
            
            response = await client.get(url, headers=headers, params=params)
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Repository or path not found")
            elif response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            contents = response.json()
            
            # Ensure we always return a list
            if not isinstance(contents, list):
                contents = [contents]
            
            return {"contents": contents}
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"GitHub API error: {str(e)}")

@router.get("/{owner}/{repo}/contents/{path:path}")
async def get_file_content(
    owner: str,
    repo: str,
    path: str,
    branch: str = "main",
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Get content of a specific file in the repository
    """
    try:
        async with httpx.AsyncClient() as client:
            url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
            headers = {
                "Accept": "application/vnd.github.v3+json"
            }
            
            # Add authorization if user is authenticated and has GitHub token
            if current_user and hasattr(current_user, 'github_access_token') and current_user.github_access_token:
                headers["Authorization"] = f"token {current_user.github_access_token}"
            params = {"ref": branch}
            
            response = await client.get(url, headers=headers, params=params)
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="Repository or path not found")
            elif response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=response.text)
            
            file_data = response.json()
            
            # Handle case where GitHub returns a list (directory contents) instead of a single file
            if isinstance(file_data, list):
                # This path is a directory, not a file
                raise HTTPException(status_code=400, detail="Path is a directory, not a file")
            
            # Ensure this is a file, not a directory
            if file_data.get("type") != "file":
                raise HTTPException(status_code=400, detail="Path is not a file")
            
            return {
                "name": file_data.get("name", ""),
                "path": file_data.get("path", ""),
                "type": file_data.get("type", ""),
                "size": file_data.get("size", 0),
                "content": file_data.get("content", ""),
                "encoding": file_data.get("encoding", ""),
                "html_url": file_data.get("html_url", ""),
                "download_url": file_data.get("download_url", "")
            }
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"GitHub API error: {str(e)}")

# Export the router
__all__ = ["router"]
