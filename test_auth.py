#!/usr/bin/env python3
"""
Test script for DevOps Butler authentication system.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import create_db_and_tables, engine
from sqlmodel import Session, select
from login import User
from auth import create_user, authenticate_user, get_password_hash

def test_auth_system():
    """Test the authentication system."""
    print("🧪 Testing DevOps Butler Authentication System...")
    
    # Create database and tables
    create_db_and_tables()
    print("✅ Database and tables created.")
    
    # Test user creation
    test_username = "testuser"
    test_email = "test@example.com"
    test_password = "testpass123"
    
    user = create_user(test_username, test_email, test_password)
    if user:
        print(f"✅ User creation test passed: {user.username}")
    else:
        print("❌ User creation test failed")
        return False
    
    # Test user authentication
    auth_user = authenticate_user(test_username, test_password)
    if auth_user:
        print(f"✅ User authentication test passed: {auth_user.username}")
    else:
        print("❌ User authentication test failed")
        return False
    
    # Test duplicate user creation (should fail)
    duplicate_user = create_user(test_username, "another@example.com", "password")
    if not duplicate_user:
        print("✅ Duplicate user prevention test passed")
    else:
        print("❌ Duplicate user prevention test failed")
        return False
    
    # Test database query
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        print(f"✅ Database query test passed: {len(users)} users found")
    
    print("\n🎉 All authentication tests passed!")
    return True

if __name__ == "__main__":
    success = test_auth_system()
    sys.exit(0 if success else 1) 