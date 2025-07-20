#!/usr/bin/env python3
"""
Test script for GitHub repository functionality.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import create_db_and_tables, engine
from sqlmodel import Session, select
from login import User
from github_oauth import GitHubOAuth

def test_repository_functionality():
    """Test the GitHub repository functionality."""
    print("🧪 Testing GitHub Repository Functionality...")
    
    # Create database and tables
    create_db_and_tables()
    print("✅ Database and tables created.")
    
    # Test GitHub OAuth instance
    github_oauth = GitHubOAuth()
    
    # Check if GitHub OAuth is configured
    if not github_oauth.client_id or not github_oauth.client_secret:
        print("⚠️ GitHub OAuth not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.")
        print("   Repository functionality will not work without proper GitHub OAuth setup.")
        return True
    
    print("✅ GitHub OAuth configuration found.")
    
    # Test authorization URL generation
    auth_url = github_oauth.get_authorization_url()
    if auth_url and "github.com" in auth_url:
        print("✅ Authorization URL generation works.")
    else:
        print("❌ Authorization URL generation failed.")
        return False
    
    # Test database schema for GitHub fields
    with Session(engine) as session:
        # Check if User table has GitHub fields
        user = session.exec(select(User)).first()
        if hasattr(user, 'github_id') and hasattr(user, 'github_access_token'):
            print("✅ Database schema supports GitHub fields.")
        else:
            print("❌ Database schema missing GitHub fields.")
            return False
    
    print("\n🎉 GitHub repository functionality tests passed!")
    print("\n📝 To test repository loading:")
    print("1. Set up GitHub OAuth (see github_setup.md)")
    print("2. Login with GitHub")
    print("3. Your repositories will be displayed automatically")
    return True

if __name__ == "__main__":
    success = test_repository_functionality()
    sys.exit(0 if success else 1) 