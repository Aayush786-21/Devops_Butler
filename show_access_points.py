#!/usr/bin/env python3
"""
DevOps Butler - Access Points Summary

This script shows all available access points for the DevOps Butler system.
"""

import requests
import json
from datetime import datetime

def check_endpoint(url, name):
    """Check if an endpoint is accessible"""
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return f"✅ {name}: {url}"
        else:
            return f"⚠️ {name}: {url} (Status: {response.status_code})"
    except requests.exceptions.RequestException as e:
        return f"❌ {name}: {url} (Error: {str(e)})"

def main():
    print("🚀 DevOps Butler - Access Points Summary")
    print("=" * 60)
    print(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Main endpoints
    endpoints = [
        ("http://localhost:5000", "🏠 Main DevOps Butler Frontend"),
        ("http://localhost:8888", "📱 Applications Dashboard"),
        ("http://localhost:8888/api/containers", "🔗 Containers API"),
        ("http://localhost:8888/health", "❤️ Health Check"),
    ]
    
    print("📡 System Endpoints:")
    print("-" * 30)
    for url, name in endpoints:
        print(check_endpoint(url, name))
    
    # Try to get container information
    try:
        response = requests.get("http://localhost:8888/api/containers", timeout=5)
        if response.status_code == 200:
            containers = response.json()
            print(f"\n🐳 Active Containers: {len(containers)}")
            print("-" * 30)
            for i, container in enumerate(containers, 1):
                container_url = f"http://{container['name']}.localhost:8888"
                print(f"{i}. {container['name']}")
                print(f"   📍 URL: {container_url}")
                print(f"   🔌 Port: {container['ports']}")
                print(f"   ⚡ Status: {container['status']}")
                print()
    except:
        pass
    
    print("\n🎯 Quick Access Commands:")
    print("-" * 30)
    print("# Start dynamic proxy service")
    print("python butler_cli.py services start dynamic-proxy")
    print()
    print("# Check system status")
    print("python butler_cli.py status")
    print()
    print("# Update proxy configurations")
    print("python butler_cli.py proxy-update")
    print()
    print("# View all services")
    print("python butler_cli.py services list")
    
    print("\n💡 Pro Tips:")
    print("-" * 30)
    print("• Applications Dashboard auto-refreshes every 30 seconds")
    print("• Click the 🚀 floating button for quick access to apps")
    print("• Use the CLI for advanced management and troubleshooting")
    print("• The system is self-healing and monitors itself continuously")

if __name__ == "__main__":
    main()
