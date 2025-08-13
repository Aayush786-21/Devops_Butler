#!/usr/bin/env python3
"""
DevOps Butler CLI - Command line interface for managing deployments
"""

import asyncio
import argparse
import sys
import subprocess
import json
from health_monitor import monitor_all_deployments, check_deployment_health, auto_heal_deployment
from app_pipeline import cleanup_orphaned_configs
from nginx_manager import reload_nginx


async def list_deployments():
    """List all running deployments"""
    print("🔍 Active Deployments:")
    print("-" * 50)
    
    try:
        # Get all containers in the devops-butler-net network
        result = await asyncio.to_thread(
            subprocess.run,
            ["docker", "network", "inspect", "devops-butler-net", "--format", "{{json .}}"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            network_data = json.loads(result.stdout)
            containers = network_data.get("Containers", {})
            
            app_containers = [
                name for name in containers.keys() 
                if containers[name]["Name"] != "butler-nginx-proxy"
            ]
            
            if not app_containers:
                print("No active deployments found.")
                return
            
            for container_id in app_containers:
                container_info = containers[container_id]
                name = container_info["Name"]
                ip = container_info["IPv4Address"].split("/")[0]
                
                # Get container status
                status_result = await asyncio.to_thread(
                    subprocess.run,
                    ["docker", "inspect", "--format", "{{.State.Status}}", name],
                    capture_output=True,
                    text=True
                )
                
                status = status_result.stdout.strip() if status_result.returncode == 0 else "unknown"
                status_emoji = "🟢" if status == "running" else "🔴"
                
                # Check if nginx config exists
                config_exists = "✅" if f"/opt/homebrew/etc/nginx/servers/{name}.conf" else "❌"
                
                print(f"{status_emoji} {name}")
                print(f"   IP: {ip}")
                print(f"   Status: {status}")
                print(f"   Nginx: {config_exists}")
                print(f"   URL: http://{name}.localhost:8888")
                print()
                
    except Exception as e:
        print(f"❌ Error listing deployments: {e}")


async def health_check(container_name=None):
    """Perform health check on deployments"""
    if container_name:
        print(f"🏥 Health check for: {container_name}")
        print("-" * 50)
        
        health_report = await check_deployment_health(container_name)
        
        # Print status
        print(f"Container Running: {'✅' if health_report['container_running'] else '❌'}")
        print(f"Port Accessible: {'✅' if health_report['port_accessible'] else '❌'}")
        print(f"Nginx Config Exists: {'✅' if health_report['nginx_config_exists'] else '❌'}")
        print(f"Nginx Config Correct: {'✅' if health_report['nginx_config_correct'] else '❌'}")
        
        if health_report['detected_port']:
            print(f"Detected Port: {health_report['detected_port']}")
        if health_report['configured_port']:
            print(f"Configured Port: {health_report['configured_port']}")
        
        if health_report['recommendations']:
            print("\n🔧 Recommendations:")
            for rec in health_report['recommendations']:
                print(f"  - {rec}")
        else:
            print("\n✅ No issues found!")
            
    else:
        await monitor_all_deployments()


async def heal_deployment(container_name):
    """Attempt to auto-heal a deployment"""
    print(f"🔧 Auto-healing: {container_name}")
    print("-" * 50)
    
    success = await auto_heal_deployment(container_name)
    
    if success:
        print("\n🎉 Auto-healing completed successfully!")
    else:
        print("\n⚠️ Auto-healing had limited success. Manual intervention may be required.")


async def cleanup_system():
    """Clean up orphaned configs and reload nginx"""
    print("🧹 Cleaning up DevOps Butler...")
    print("-" * 50)
    
    await cleanup_orphaned_configs()
    await reload_nginx()
    
    print("✅ Cleanup completed!")


async def fix_502_errors():
    """Specifically designed to fix 502 Bad Gateway errors"""
    print("🔧 Fixing 502 Bad Gateway errors...")
    print("-" * 50)
    
    # First, clean up orphaned configs
    await cleanup_orphaned_configs()
    
    # Then run health monitoring to fix port issues
    await monitor_all_deployments()
    
    print("\n✅ 502 error fixing completed!")
    print("💡 If issues persist, containers may need to be redeployed with proper network settings.")


async def start_monitoring():
    """Start continuous system monitoring"""
    print("🔍 Starting DevOps Butler monitoring system...")
    print("Press Ctrl+C to stop monitoring")
    print("-" * 50)
    
    try:
        from error_recovery import start_error_recovery_system
        await start_error_recovery_system()
    except Exception as e:
        print(f"❌ Error starting monitoring: {e}")


async def system_status():
    """Show comprehensive system status"""
    print("📊 DevOps Butler System Status")
    print("-" * 50)
    
    try:
        from error_recovery import get_system_health
        
        # Use asyncio.to_thread to run the sync function
        health = await asyncio.to_thread(get_system_health)
        
        # Overall status
        status_emoji = {
            "healthy": "✅",
            "degraded": "⚠️",
            "critical": "❌",
            "unknown": "❓"
        }.get(health["overall_status"], "❓")
        
        print(f"Overall Status: {status_emoji} {health['overall_status'].upper()}")
        print(f"Last Updated: {health['timestamp']}")
        print()
        
        # Component status
        print("Component Health:")
        for component, status in health["components"].items():
            comp_emoji = "✅" if status == "healthy" else "❌"
            print(f"  {comp_emoji} {component.capitalize()}: {status}")
        
        # Issues
        if health["issues"]:
            print("\n🚨 Issues Found:")
            for issue in health["issues"]:
                print(f"  - {issue}")
        
        # Recommendations
        if health["recommendations"]:
            print("\n💡 Recommendations:")
            for rec in health["recommendations"]:
                print(f"  - {rec}")
        
        if not health["issues"] and not health["recommendations"]:
            print("\n🎉 All systems operating normally!")
            
    except Exception as e:
        print(f"❌ Error getting system status: {e}")


async def show_errors(hours=24):
    """Show error summary for the last N hours"""
    print(f"📈 Error Summary (Last {hours} hours)")
    print("-" * 50)
    
    try:
        from error_recovery import get_error_summary
        
        # Use asyncio.to_thread to run the sync function
        summary = await asyncio.to_thread(get_error_summary, hours)
        
        print(f"Total Errors: {summary['total_errors']}")
        print(f"Recovery Rate: {summary['recovery_rate']:.1f}%")
        print()
        
        # Errors by severity
        if summary['by_severity']:
            print("By Severity:")
            severity_emojis = {
                "low": "📘",
                "medium": "📙", 
                "high": "📕",
                "critical": "🚨"
            }
            for severity, count in summary['by_severity'].items():
                if count > 0:
                    emoji = severity_emojis.get(severity, "📋")
                    print(f"  {emoji} {severity.capitalize()}: {count}")
        
        # Errors by component
        if summary['by_component']:
            print("\nBy Component:")
            for component, count in summary['by_component'].items():
                print(f"  🔧 {component}: {count}")
        
        # Errors by type
        if summary['by_type']:
            print("\nBy Type:")
            for error_type, count in summary['by_type'].items():
                print(f"  ⚠️ {error_type}: {count}")
        
        if summary['total_errors'] == 0:
            print("🎉 No errors in the specified time period!")
            
    except Exception as e:
        print(f"❌ Error getting error summary: {e}")


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
    # Handle services command specially since it has variable arguments
    if len(sys.argv) > 1 and sys.argv[1] == 'services':
        print_banner()
        print("📋 Managing services...")
        import os
        service_args = sys.argv[2:] if len(sys.argv) > 2 else []
        subprocess.run([sys.executable, "service_manager.py"] + service_args, cwd=os.path.dirname(__file__))
        return
        
    parser = argparse.ArgumentParser(
        description="DevOps Butler CLI - Manage your deployments like a pro!",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s list                          # List all deployments
  %(prog)s health                        # Check health of all deployments
  %(prog)s health weather-app-340332b2   # Check specific deployment
  %(prog)s heal weather-app-340332b2     # Auto-heal specific deployment
  %(prog)s fix-502                       # Fix 502 Bad Gateway errors
  %(prog)s cleanup                       # Clean up orphaned configs
  %(prog)s services start dynamic-proxy  # Start a service
        """
    )
    
    parser.add_argument(
        'command',
        choices=['list', 'health', 'heal', 'cleanup', 'fix-502', 'monitor', 'status', 'errors', 'proxy-update', 'proxy-monitor', 'services'],
        help='Command to execute'
    )
    
    parser.add_argument(
        'target',
        nargs='?',
        help='Target container name (for health and heal commands)'
    )
    
    parser.add_argument(
        '--quiet', '-q',
        action='store_true',
        help='Suppress banner and verbose output'
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
            
        elif args.command == 'fix-502':
            await fix_502_errors()
            
        elif args.command == 'monitor':
            await start_monitoring()
            
        elif args.command == 'status':
            await system_status()
            
        elif args.command == 'errors':
            await show_errors()
            
        elif args.command == 'proxy-update':
            print("🔄 Updating proxy configurations...")
            from dynamic_proxy_manager import DynamicProxyManager
            manager = DynamicProxyManager()
            await manager.update_proxy_configuration()
            
        elif args.command == 'proxy-monitor':
            print("👀 Starting proxy monitoring...")
            from dynamic_proxy_manager import DynamicProxyManager
            manager = DynamicProxyManager()
            await manager.monitor_and_update()
            
        elif args.command == 'services':
            print("📋 Managing services...")
            import os
            # Call service manager with remaining arguments
            # Find the index of 'services' command
            services_index = sys.argv.index('services') if 'services' in sys.argv else -1
            if services_index >= 0 and services_index + 1 < len(sys.argv):
                service_args = sys.argv[services_index + 1:]
            else:
                service_args = []
            subprocess.run([sys.executable, "service_manager.py"] + service_args, cwd=os.path.dirname(__file__))
            
    except KeyboardInterrupt:
        print("\n⏹️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
