#!/usr/bin/env python3
"""
DevOps Butler CLI - Simplified version that works without complex dependencies
Command line interface for managing deployments
"""

import asyncio
import argparse
import sys
import subprocess
import json
import os
import socket
from typing import Dict, List, Optional, Any


async def list_deployments():
    """List all running deployments"""
    print("🔍 Active Deployments:")
    print("-" * 50)
    
    try:
        # Get all running containers
        result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "ps", "--format", "{{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"],
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"❌ Error running docker ps: {result.stderr}")
            return
        
        if not result.stdout.strip():
            print("No running containers found.")
            return
        
        lines = result.stdout.strip().split('\n')
        deployments_found = False
        
        for line in lines:
            parts = line.split('\t')
            if len(parts) >= 4:
                container_id = parts[0][:12]
                name = parts[1]
                status = parts[2]
                ports = parts[3]
                
                # Skip system containers
                if any(system_name in name.lower() for system_name in ['nginx', 'proxy', 'db', 'postgres', 'mysql']):
                    continue
                
                deployments_found = True
                status_emoji = "🟢" if "Up" in status else "🔴"
                
                # Parse port mapping
                port_mapping = "No ports exposed"
                if "->" in ports:
                    port_mapping = ports
                
                print(f"{status_emoji} {name} (ID: {container_id})")
                print(f"   Status: {status}")
                print(f"   Ports: {port_mapping}")
                print()
        
        if not deployments_found:
            print("No application deployments found (excluding system containers).")
                
    except Exception as e:
        print(f"❌ Error listing deployments: {e}")


async def health_check(container_name=None):
    """Perform health check on deployments"""
    if container_name:
        print(f"🏥 Health check for: {container_name}")
        print("-" * 50)
        
        # Check if container is running
        status_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "inspect", "--format", "{{.State.Status}}", container_name],
            capture_output=True,
            text=True
        )
        
        container_running = status_result.returncode == 0 and "running" in status_result.stdout.strip()
        print(f"Container Running: {'✅' if container_running else '❌'}")
        
        if container_running:
            # Get port information
            ports_result = await asyncio.to_thread(
                subprocess.run,
                ["docker", "port", container_name],
                capture_output=True,
                text=True
            )
            
            if ports_result.returncode == 0 and ports_result.stdout.strip():
                print(f"Port mappings: {ports_result.stdout.strip()}")
                print("\n✅ Container appears healthy!")
            else:
                print("No port mappings found")
                print("\n🔧 Recommendations:")
                print("  - Check container logs for port information")
                print("  - Verify the application is starting correctly")
        else:
            print("\n🔧 Recommendations:")
            print(f"  - Container {container_name} is not running")
            print(f"  - Check container logs: docker logs {container_name}")
            print(f"  - Try restarting: docker start {container_name}")
    else:
        # Perform health check on all deployments
        print("🏥 Health check for all deployments")
        print("-" * 50)
        
        result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "ps", "--format", "{{.Names}}"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0 and result.stdout.strip():
            container_names = result.stdout.strip().split('\n')
            
            for container_name in container_names:
                # Skip system containers
                if any(system_name in container_name.lower() for system_name in ['nginx', 'proxy', 'db', 'postgres', 'mysql']):
                    continue
                
                print(f"\n🔍 Checking {container_name}...")
                await health_check(container_name)
        else:
            print("No running containers found.")


async def heal_deployment(container_name):
    """Attempt to auto-heal a deployment"""
    print(f"🔧 Auto-healing: {container_name}")
    print("-" * 50)
    
    try:
        # Check if container exists
        check_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "inspect", container_name],
            capture_output=True,
            text=True
        )
        
        if check_result.returncode != 0:
            print(f"❌ Container {container_name} not found")
            return False
        
        # Check if container is running
        status_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "inspect", "--format", "{{.State.Status}}", container_name],
            capture_output=True,
            text=True
        )
        
        if status_result.returncode == 0:
            status = status_result.stdout.strip()
            
            if status != "running":
                print(f"🔄 Container is {status}, attempting to restart...")
                
                # Try to restart the container
                restart_result = await asyncio.to_thread(
                    subprocess.run,
                    ["docker", "restart", container_name],
                    capture_output=True,
                    text=True
                )
                
                if restart_result.returncode == 0:
                    print(f"✅ Successfully restarted {container_name}")
                    
                    # Wait a moment for the container to start
                    await asyncio.sleep(3)
                    
                    # Check if it's now running
                    final_check = await asyncio.to_thread(
                        subprocess.run,
                        ["docker", "inspect", "--format", "{{.State.Status}}", container_name],
                        capture_output=True,
                        text=True
                    )
                    
                    if final_check.returncode == 0 and "running" in final_check.stdout:
                        print("\n🎉 Auto-healing completed successfully!")
                        return True
                    else:
                        print(f"⚠️ Container restarted but may not be fully healthy")
                        return False
                else:
                    print(f"❌ Failed to restart container: {restart_result.stderr}")
                    return False
            else:
                print("🔍 Container is already running and appears healthy!")
                return True
        
        return False
        
    except Exception as e:
        print(f"❌ Error during auto-healing: {e}")
        return False


async def cleanup_system():
    """Clean up Docker system and remove unused containers/images"""
    print("🧹 Cleaning up DevOps Butler...")
    print("-" * 50)
    
    try:
        # Clean up stopped containers
        print("🗑️ Removing stopped containers...")
        cleanup_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "container", "prune", "-f"],
            capture_output=True,
            text=True
        )
        
        if cleanup_result.returncode == 0:
            print(f"✅ Container cleanup: {cleanup_result.stdout.strip()}")
        
        # Clean up unused images
        print("🖼️ Removing unused images...")
        image_cleanup_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "image", "prune", "-f"],
            capture_output=True,
            text=True
        )
        
        if image_cleanup_result.returncode == 0:
            print(f"✅ Image cleanup: {image_cleanup_result.stdout.strip()}")
        
        # Clean up unused networks
        print("🌐 Removing unused networks...")
        network_cleanup_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "network", "prune", "-f"],
            capture_output=True,
            text=True
        )
        
        if network_cleanup_result.returncode == 0:
            print(f"✅ Network cleanup: {network_cleanup_result.stdout.strip()}")
        
        print("\n✅ Cleanup completed!")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")


async def system_status():
    """Show comprehensive system status"""
    print("📊 DevOps Butler System Status")
    print("-" * 50)
    
    try:
        # Check Docker daemon status
        docker_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "version", "--format", "json"],
            capture_output=True,
            text=True
        )
        
        docker_healthy = docker_result.returncode == 0
        docker_emoji = "✅" if docker_healthy else "❌"
        print(f"Docker Daemon: {docker_emoji} {'Healthy' if docker_healthy else 'Unhealthy'}")
        
        # Get running containers count
        containers_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "ps", "-q"],
            capture_output=True,
            text=True
        )
        
        if containers_result.returncode == 0:
            container_count = len([line for line in containers_result.stdout.strip().split('\n') if line.strip()])
            print(f"Running Containers: 📊 {container_count}")
        
        # Get images count
        images_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "images", "-q"],
            capture_output=True,
            text=True
        )
        
        if images_result.returncode == 0:
            image_count = len([line for line in images_result.stdout.strip().split('\n') if line.strip()])
            print(f"Docker Images: 🖼️ {image_count}")
        
        if docker_healthy:
            print("\n🎉 All systems operating normally!")
        else:
            print("\n🚨 Docker daemon issues detected")
            print("🔧 Recommendations:")
            print("  - Check if Docker Desktop is running")
            print("  - Try restarting Docker service")
            
    except Exception as e:
        print(f"❌ Error getting system status: {e}")


async def show_logs(container_name=None, lines=50):
    """Show container logs"""
    if not container_name:
        # Show logs for all running containers
        result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "ps", "--format", "{{.Names}}"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0 and result.stdout.strip():
            container_names = result.stdout.strip().split('\n')
            print("📄 Available containers:")
            for name in container_names:
                print(f"  - {name}")
            print("\nUsage: butler_cli.py logs <container_name>")
        else:
            print("No running containers found.")
        return
    
    print(f"📄 Logs for {container_name} (last {lines} lines):")
    print("-" * 50)
    
    try:
        logs_result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "logs", "--tail", str(lines), container_name],
            capture_output=True,
            text=True
        )
        
        if logs_result.returncode == 0:
            if logs_result.stdout.strip():
                print(logs_result.stdout)
            if logs_result.stderr.strip():
                print("\n--- STDERR ---")
                print(logs_result.stderr)
        else:
            print(f"❌ Error getting logs: {logs_result.stderr}")
            
    except Exception as e:
        print(f"❌ Error getting logs: {e}")


def print_banner():
    """Print the DevOps Butler banner"""
    banner = """
    ╔══════════════════════════════════════════════════════════════════╗
    ║                        🤖 DevOps Butler CLI                      ║
    ║                     Your Deployment Assistant                    ║
    ╚══════════════════════════════════════════════════════════════════╝
    """
    print(banner)


async def main():
    parser = argparse.ArgumentParser(
        description="DevOps Butler CLI - Manage your deployments like a pro!",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s list                          # List all deployments
  %(prog)s health                        # Check health of all deployments
  %(prog)s health weather-app-340332b2   # Check specific deployment
  %(prog)s heal weather-app-340332b2     # Auto-heal specific deployment
  %(prog)s cleanup                       # Clean up Docker system
  %(prog)s status                        # Show system status
  %(prog)s logs container-name           # Show container logs
        """
    )
    
    parser.add_argument(
        'command',
        choices=['list', 'health', 'heal', 'cleanup', 'status', 'logs'],
        help='Command to execute'
    )
    
    parser.add_argument(
        'target',
        nargs='?',
        help='Target container name (for health, heal, and logs commands)'
    )
    
    parser.add_argument(
        '--quiet', '-q',
        action='store_true',
        help='Suppress banner and verbose output'
    )
    
    parser.add_argument(
        '--lines',
        type=int,
        default=50,
        help='Number of log lines to show (default: 50)'
    )
    
    args = parser.parse_args()
    
    if not args.quiet:
        print_banner()
    
    try:
        if args.command == 'list':
            await list_deployments()
            
        elif args.command == 'health':
            await health_check(args.target)
            
        elif args.command == 'heal':
            if not args.target:
                print("❌ Error: Container name required for heal command")
                print("Usage: butler_cli.py heal <container_name>")
                sys.exit(1)
            await heal_deployment(args.target)
            
        elif args.command == 'cleanup':
            await cleanup_system()
            
        elif args.command == 'status':
            await system_status()
            
        elif args.command == 'logs':
            await show_logs(args.target, args.lines)
            
    except KeyboardInterrupt:
        print("\n⏹️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        if not args.quiet:
            print("\nFull error details:")
            traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
