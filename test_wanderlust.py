#!/usr/bin/env python3

import asyncio
import sys
import os
from docker_up import docker_up
from deployment_validator import validate_and_prepare_deployment

async def deploy_wanderlust():
    """
    Deploy the wanderlust-analysis project using the enhanced DevOps Butler.
    """
    repo_path = "/Users/aayush/Documents/wanderlust-analysis"
    
    print("🚀 Enhanced DevOps Butler - Wanderlust Deployment")
    print("=" * 60)
    print(f"📁 Target Repository: {repo_path}")
    print(f"📂 Project: {os.path.basename(repo_path)}")
    
    if not os.path.exists(repo_path):
        print(f"❌ Repository not found: {repo_path}")
        return False
    
    try:
        print("\n🔍 STEP 1: Pre-deployment validation and preparation")
        print("-" * 50)
        
        # Run validation first
        is_valid, issues, warnings = await validate_and_prepare_deployment(repo_path)
        
        print(f"\n📊 Validation Summary:")
        print(f"  ✅ Valid: {is_valid}")
        print(f"  ❌ Issues: {len(issues)}")
        print(f"  ⚠️  Warnings: {len(warnings)}")
        
        if issues:
            print(f"\n❌ Critical Issues Found:")
            for i, issue in enumerate(issues, 1):
                print(f"  {i}. {issue}")
        
        if warnings:
            print(f"\n⚠️  Warnings (will proceed):")
            for i, warning in enumerate(warnings, 1):
                print(f"  {i}. {warning}")
        
        if not is_valid:
            print(f"\n❌ Deployment blocked due to critical issues.")
            print(f"🔧 Please fix the issues above and try again.")
            return False
        
        print(f"\n✅ Pre-deployment validation passed!")
        
        # Proceed with deployment
        print(f"\n🚀 STEP 2: Enhanced Docker deployment with robust database handling")
        print("-" * 70)
        
        service_ports = await docker_up(repo_path)
        
        if service_ports:
            print(f"\n🎉 Deployment completed successfully!")
            print(f"📋 Active Services:")
            
            # Display services with their access information
            for service, ports in service_ports.items():
                host_port = ports.get('host_port')
                internal_port = ports.get('internal_port')
                
                print(f"  🔗 {service}:")
                print(f"    - Internal Port: {internal_port}")
                if host_port:
                    print(f"    - Host Port: {host_port}")
                    print(f"    - Access URL: http://localhost:{host_port}")
                else:
                    print(f"    - No external access (internal service)")
            
            print(f"\n🌍 Quick Access Links:")
            for service, ports in service_ports.items():
                host_port = ports.get('host_port')
                if host_port:
                    service_type = "frontend" if "frontend" in service.lower() else \
                                 "backend" if "backend" in service.lower() else \
                                 "database" if any(db in service.lower() for db in ['mongo', 'mysql', 'postgres']) else \
                                 "service"
                    print(f"  🔗 {service_type.title()}: http://localhost:{host_port}")
                    
                    # Show nginx proxy URL for frontend services
                    if service_type == "frontend":
                        print(f"  🌍 {service_type.title()} (via Nginx): http://{service}.localhost:8888")
            
            # Show next steps
            print(f"\n📋 Next Steps:")
            print(f"  1. 🌐 Open the URLs above in your browser")
            print(f"  2. 📊 Monitor container health: docker ps")
            print(f"  3. 📋 View logs: docker logs <container_name>")
            print(f"  4. 🔄 Stop services: docker compose down")
            
            return True
        else:
            print(f"\n❌ Deployment failed!")
            print(f"🔧 Check the logs above for detailed error information.")
            print(f"💡 The enhanced butler attempted automatic recovery but was unsuccessful.")
            return False
            
    except Exception as e:
        print(f"\n❌ Unexpected error during deployment: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    finally:
        print(f"\n{'='*60}")

async def show_deployment_status(repo_path: str):
    """Show current deployment status."""
    print(f"\n📊 Current Deployment Status")
    print("-" * 40)
    
    try:
        # Check if containers are running
        import subprocess
        result = await asyncio.to_thread(subprocess.run,
            ["docker", "compose", "ps"],
            cwd=repo_path,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0 and result.stdout.strip():
            print("📋 Active Containers:")
            print(result.stdout)
        else:
            print("ℹ️  No active containers found")
            
    except Exception as e:
        print(f"❌ Error checking status: {e}")

if __name__ == "__main__":
    print("🤖 Enhanced DevOps Butler - Wanderlust Deployment Test")
    
    if len(sys.argv) > 1 and sys.argv[1].lower() == "status":
        asyncio.run(show_deployment_status("/Users/aayush/Documents/wanderlust-analysis"))
    else:
        try:
            success = asyncio.run(deploy_wanderlust())
            
            if success:
                print(f"\n🎉 Deployment completed successfully!")
                print(f"💡 Run 'python test_wanderlust.py status' to check deployment status")
            else:
                print(f"\n❌ Deployment failed!")
                print(f"🔧 Check the error messages above for troubleshooting")
                
        except KeyboardInterrupt:
            print(f"\n⏹️  Deployment interrupted by user")
        except Exception as e:
            print(f"\n❌ Critical error: {e}")
            import traceback
            traceback.print_exc()
