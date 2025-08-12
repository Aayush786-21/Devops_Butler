#!/usr/bin/env python3
"""
Image Manager for DevOps Butler

This utility provides commands for managing Docker images created by the DevOps Butler.
It includes functionality to:
- List all images created by DevOps Butler
- Clean up old images
- Force rebuild images
- View image statistics
"""

import asyncio
import subprocess
import argparse
import json
from datetime import datetime
from typing import List, Dict, Any
from docker_build import cleanup_old_images, check_existing_image, get_image_metadata


async def list_butler_images() -> List[Dict[str, Any]]:
    """List all images created by DevOps Butler."""
    try:
        list_command = [
            "docker", "images",
            "--filter", "reference=local-registry/*",
            "--format", "{{.ID}}\t{{.Repository}}:{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}",
            "--sort=created"
        ]
        
        result = await asyncio.to_thread(
            subprocess.run,
            list_command,
            capture_output=True,
            text=True
        )
        
        images = []
        if result.returncode == 0 and result.stdout.strip():
            lines = result.stdout.strip().split('\n')
            for line in lines:
                if line.strip():
                    parts = line.split('\t')
                    if len(parts) >= 4:
                        image_id, image_ref, created_time, size = parts
                        repo_tag = image_ref.split('/')[-1]  # Remove local-registry/ prefix
                        repo, tag = repo_tag.split(':', 1) if ':' in repo_tag else (repo_tag, 'latest')
                        
                        images.append({
                            'id': image_id[:12],
                            'repository': repo,
                            'tag': tag,
                            'full_name': image_ref,
                            'created': created_time,
                            'size': size
                        })
        
        return images
        
    except Exception as e:
        print(f"❌ Error listing images: {e}")
        return []


async def get_image_stats() -> Dict[str, Any]:
    """Get statistics about Butler images."""
    images = await list_butler_images()
    
    stats = {
        'total_images': len(images),
        'repositories': set(),
        'total_size_mb': 0,
        'oldest_image': None,
        'newest_image': None,
        'size_by_repo': {}
    }
    
    for image in images:
        repo = image['repository']
        stats['repositories'].add(repo)
        
        # Try to parse size
        size_str = image['size']
        try:
            if 'MB' in size_str:
                size_mb = float(size_str.replace('MB', '').strip())
            elif 'GB' in size_str:
                size_gb = float(size_str.replace('GB', '').strip())
                size_mb = size_gb * 1024
            elif 'kB' in size_str:
                size_kb = float(size_str.replace('kB', '').strip())
                size_mb = size_kb / 1024
            else:
                size_mb = 0
                
            stats['total_size_mb'] += size_mb
            
            if repo not in stats['size_by_repo']:
                stats['size_by_repo'][repo] = 0
            stats['size_by_repo'][repo] += size_mb
            
        except (ValueError, AttributeError):
            pass
        
        # Track oldest/newest
        if not stats['oldest_image'] or image['created'] < stats['oldest_image']['created']:
            stats['oldest_image'] = image
        if not stats['newest_image'] or image['created'] > stats['newest_image']['created']:
            stats['newest_image'] = image
    
    stats['repositories'] = list(stats['repositories'])
    
    return stats


async def force_rebuild_image(repo_name: str) -> bool:
    """Force rebuild an image for a repository by removing existing images."""
    try:
        print(f"🔨 Force rebuilding images for repository: {repo_name}")
        
        # Remove all images for this repository
        list_command = [
            "docker", "images",
            "--filter", f"reference=local-registry/{repo_name}",
            "--format", "{{.Repository}}:{{.Tag}}",
            "--quiet"
        ]
        
        result = await asyncio.to_thread(
            subprocess.run,
            list_command,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0 and result.stdout.strip():
            image_refs = result.stdout.strip().split('\n')
            
            for image_ref in image_refs:
                if image_ref.strip():
                    print(f"🗑️ Removing image: {image_ref}")
                    remove_command = ["docker", "rmi", "-f", image_ref.strip()]
                    await asyncio.to_thread(
                        subprocess.run,
                        remove_command,
                        capture_output=True
                    )
            
            print(f"✅ All images for {repo_name} have been removed")
            print(f"💡 Next deployment will rebuild from scratch")
            return True
        else:
            print(f"📦 No images found for repository: {repo_name}")
            return False
            
    except Exception as e:
        print(f"❌ Error during force rebuild: {e}")
        return False


async def cleanup_all_repos(keep_count: int = 3):
    """Clean up old images for all repositories."""
    try:
        images = await list_butler_images()
        repositories = list(set(img['repository'] for img in images))
        
        print(f"🧹 Cleaning up images for {len(repositories)} repositories...")
        print(f"📋 Keeping {keep_count} most recent images per repository")
        
        for repo in repositories:
            print(f"\n🔍 Processing repository: {repo}")
            await cleanup_old_images(repo, keep_count=keep_count)
        
        print(f"\n✅ Cleanup completed for all repositories")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")


async def show_image_details(image_ref: str):
    """Show detailed information about a specific image."""
    try:
        metadata = await get_image_metadata(image_ref)
        
        if metadata:
            print(f"\n📋 Image Details: {image_ref}")
            print(f"   ID: {metadata.get('id', 'unknown')}")
            print(f"   Created: {metadata.get('created', 'unknown')[:19]}")
            print(f"   Size: {metadata.get('size', 0) / (1024 * 1024):.1f}MB")
            print(f"   Architecture: {metadata.get('architecture', 'unknown')}")
            print(f"   OS: {metadata.get('os', 'unknown')}")
            
            # Show layers information
            inspect_command = ["docker", "image", "history", image_ref, "--no-trunc"]
            result = await asyncio.to_thread(
                subprocess.run,
                inspect_command,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                print(f"\n📦 Build History:")
                print(result.stdout)
        else:
            print(f"❌ Could not get metadata for image: {image_ref}")
            
    except Exception as e:
        print(f"❌ Error getting image details: {e}")


async def main():
    parser = argparse.ArgumentParser(
        description="DevOps Butler Image Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python image_manager.py list                    # List all Butler images
  python image_manager.py stats                   # Show image statistics  
  python image_manager.py cleanup --keep 2        # Clean up old images, keep 2 per repo
  python image_manager.py force-rebuild myapp     # Force rebuild images for 'myapp'
  python image_manager.py details myapp:latest    # Show details for specific image
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # List command
    list_parser = subparsers.add_parser('list', help='List all Butler images')
    list_parser.add_argument('--json', action='store_true', help='Output as JSON')
    
    # Stats command
    stats_parser = subparsers.add_parser('stats', help='Show image statistics')
    stats_parser.add_argument('--json', action='store_true', help='Output as JSON')
    
    # Cleanup command
    cleanup_parser = subparsers.add_parser('cleanup', help='Clean up old images')
    cleanup_parser.add_argument('--keep', type=int, default=3, help='Number of images to keep per repository (default: 3)')
    cleanup_parser.add_argument('--repo', help='Clean up specific repository only')
    
    # Force rebuild command
    rebuild_parser = subparsers.add_parser('force-rebuild', help='Force rebuild images for a repository')
    rebuild_parser.add_argument('repo', help='Repository name to force rebuild')
    
    # Details command
    details_parser = subparsers.add_parser('details', help='Show detailed information about an image')
    details_parser.add_argument('image', help='Image reference (e.g., myapp:latest or local-registry/myapp:hash)')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    try:
        if args.command == 'list':
            images = await list_butler_images()
            
            if args.json:
                print(json.dumps(images, indent=2))
            else:
                if not images:
                    print("📦 No Butler images found")
                else:
                    print(f"📋 Found {len(images)} Butler images:")
                    print()
                    print(f"{'REPOSITORY':<20} {'TAG':<15} {'IMAGE ID':<12} {'CREATED':<20} {'SIZE':<10}")
                    print("-" * 85)
                    
                    for img in images:
                        print(f"{img['repository']:<20} {img['tag']:<15} {img['id']:<12} {img['created'][:19]:<20} {img['size']:<10}")
        
        elif args.command == 'stats':
            stats = await get_image_stats()
            
            if args.json:
                # Convert set to list for JSON serialization
                stats_copy = stats.copy()
                if 'repositories' in stats_copy and isinstance(stats_copy['repositories'], set):
                    stats_copy['repositories'] = list(stats_copy['repositories'])
                print(json.dumps(stats_copy, indent=2, default=str))
            else:
                print(f"📊 Butler Images Statistics:")
                print(f"   Total Images: {stats['total_images']}")
                print(f"   Repositories: {len(stats['repositories'])}")
                print(f"   Total Size: {stats['total_size_mb']:.1f} MB ({stats['total_size_mb']/1024:.2f} GB)")
                
                if stats['newest_image']:
                    print(f"   Newest Image: {stats['newest_image']['repository']}:{stats['newest_image']['tag']} ({stats['newest_image']['created'][:19]})")
                
                if stats['oldest_image']:
                    print(f"   Oldest Image: {stats['oldest_image']['repository']}:{stats['oldest_image']['tag']} ({stats['oldest_image']['created'][:19]})")
                
                if stats['size_by_repo']:
                    print(f"\n   Size by Repository:")
                    for repo, size_mb in sorted(stats['size_by_repo'].items(), key=lambda x: x[1], reverse=True):
                        print(f"     {repo}: {size_mb:.1f} MB")
        
        elif args.command == 'cleanup':
            if args.repo:
                print(f"🧹 Cleaning up images for repository: {args.repo}")
                await cleanup_old_images(args.repo, keep_count=args.keep)
            else:
                await cleanup_all_repos(keep_count=args.keep)
        
        elif args.command == 'force-rebuild':
            await force_rebuild_image(args.repo)
        
        elif args.command == 'details':
            image_ref = args.image
            if not image_ref.startswith('local-registry/'):
                image_ref = f"local-registry/{image_ref}"
            await show_image_details(image_ref)
        
    except KeyboardInterrupt:
        print("\n⚠️ Operation cancelled by user")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
