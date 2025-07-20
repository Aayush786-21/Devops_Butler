#!/usr/bin/env python3
"""
Script to create a default user for DevOps Butler authentication system.
Run this script once to set up a default admin user.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import create_db_and_tables, engine
from sqlmodel import Session
from auth import create_user

def create_default_user():
    """Create a default user for testing."""
    print("🔧 Setting up DevOps Butler authentication...")
    
    # Create database and tables
    create_db_and_tables()
    print("✅ Database and tables created.")
    
    # Create default user
    default_username = "admin"
    default_email = "admin@devopsbutler.local"
    default_password = "admin123"
    
    with Session(engine) as session:
        # Check if user already exists
        from login import User
        from sqlmodel import select
        existing_user = session.exec(
            select(User).where(User.username == default_username)
        ).first()
        
        if existing_user:
            print(f"⚠️ User '{default_username}' already exists.")
            return
        
        # Create new user
        user = create_user(default_username, default_email, default_password)
        if user:
            print(f"✅ Default user created successfully!")
            print(f"   Username: {default_username}")
            print(f"   Email: {default_email}")
            print(f"   Password: {default_password}")
            print("\n🔐 You can now login with these credentials.")
        else:
            print("❌ Failed to create default user.")

if __name__ == "__main__":
    create_default_user() 