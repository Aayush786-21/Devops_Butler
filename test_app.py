#!/usr/bin/env python3
"""
Comprehensive test script for DevOps Butler application.
Tests all major features including authentication, GitHub integration, and API endpoints.
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_endpoint(url, method="GET", data=None, headers=None):
    """Test an API endpoint and return the result."""
    try:
        if method == "GET":
            response = requests.get(url, headers=headers)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers)
        
        return {
            "status_code": response.status_code,
            "success": response.status_code < 400,
            "data": response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text[:200],
            "error": None
        }
    except Exception as e:
        return {
            "status_code": 0,
            "success": False,
            "data": None,
            "error": str(e)
        }

def print_test_result(test_name, result):
    """Print test result with formatting."""
    if result["success"]:
        print(f"✅ {test_name}: PASSED")
    else:
        print(f"❌ {test_name}: FAILED")
        if result["error"]:
            print(f"   Error: {result['error']}")
        else:
            print(f"   Status: {result['status_code']}")

def main():
    print("🧪 Testing DevOps Butler Application")
    print("=" * 50)
    
    # Test 1: Main page
    print("\n1. Testing Main Page...")
    result = test_endpoint(f"{BASE_URL}/")
    print_test_result("Main page loads", result)
    
    # Test 2: Login page
    print("\n2. Testing Login Page...")
    result = test_endpoint(f"{BASE_URL}/login")
    print_test_result("Login page loads", result)
    
    # Test 3: User registration
    print("\n3. Testing User Registration...")
    user_data = {
        "username": "testuser_app",
        "email": "test@example.com",
        "password": "testpass123"
    }
    result = test_endpoint(f"{BASE_URL}/api/auth/register", method="POST", data=user_data)
    print_test_result("User registration", result)
    
    # Test 4: User login
    print("\n4. Testing User Login...")
    login_data = {
        "username": "testuser_app",
        "password": "testpass123"
    }
    result = test_endpoint(f"{BASE_URL}/api/auth/login", method="POST", data=login_data)
    print_test_result("User login", result)
    
    if result["success"]:
        token = result["data"]["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test 5: Authenticated user repositories (should fail for non-GitHub users)
        print("\n5. Testing Authenticated Repositories...")
        result = test_endpoint(f"{BASE_URL}/api/user/repositories", headers=headers)
        print_test_result("Authenticated repositories (non-GitHub user)", result)
    
    # Test 6: Public repository search
    print("\n6. Testing Public Repository Search...")
    result = test_endpoint(f"{BASE_URL}/api/repositories/facebook")
    print_test_result("Facebook repositories", result)
    
    # Test 7: Demo repositories
    print("\n7. Testing Demo Repositories...")
    result = test_endpoint(f"{BASE_URL}/api/repositories/demo_user")
    print_test_result("Demo repositories", result)
    
    # Test 8: GitHub OAuth URL
    print("\n8. Testing GitHub OAuth...")
    result = test_endpoint(f"{BASE_URL}/api/auth/github")
    print_test_result("GitHub OAuth URL generation", result)
    
    # Test 9: Static files
    print("\n9. Testing Static Files...")
    result = test_endpoint(f"{BASE_URL}/static/styles.css")
    print_test_result("CSS file loads", result)
    
    result = test_endpoint(f"{BASE_URL}/static/app.js")
    print_test_result("JavaScript file loads", result)
    
    # Test 10: Icons
    print("\n10. Testing Icons...")
    result = test_endpoint(f"{BASE_URL}/icons/logo.png")
    print_test_result("Logo icon loads", result)
    
    print("\n" + "=" * 50)
    print("🎉 Application Testing Complete!")
    print("\n📝 Next Steps:")
    print("1. Open http://localhost:8000 in your browser")
    print("2. Try the repository search feature")
    print("3. Click 'Show Demo' to see demo repositories")
    print("4. Test the login functionality")
    print("5. Try deploying a repository!")

if __name__ == "__main__":
    main()