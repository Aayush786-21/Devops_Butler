import asyncio
import subprocess
import hashlib
import os
import json
from typing import Optional, Dict, Any


async def calculate_dockerfile_hash(repo_dir: str) -> str:
    """
    Calculate a hash based on Dockerfile content and relevant build context.
    This helps determine if we need to rebuild or can reuse an existing image.
    """
    dockerfile_path = os.path.join(repo_dir, 'Dockerfile')
    if not os.path.exists(dockerfile_path):
        return "no-dockerfile"
    
    hash_components = []
    
    # Include Dockerfile content
    with open(dockerfile_path, 'r', encoding='utf-8') as f:
        dockerfile_content = f.read()
        hash_components.append(dockerfile_content)
    
    # Include package.json if exists (for Node.js projects)
    package_json_path = os.path.join(repo_dir, 'package.json')
    if os.path.exists(package_json_path):
        with open(package_json_path, 'r', encoding='utf-8') as f:
            hash_components.append(f.read())
    
    # Include requirements.txt if exists (for Python projects)
    requirements_path = os.path.join(repo_dir, 'requirements.txt')
    if os.path.exists(requirements_path):
        with open(requirements_path, 'r', encoding='utf-8') as f:
            hash_components.append(f.read())
    
    # Include pom.xml if exists (for Java projects)
    pom_path = os.path.join(repo_dir, 'pom.xml')
    if os.path.exists(pom_path):
        with open(pom_path, 'r', encoding='utf-8') as f:
            hash_components.append(f.read())
    
    # Include Cargo.toml if exists (for Rust projects)
    cargo_path = os.path.join(repo_dir, 'Cargo.toml')
    if os.path.exists(cargo_path):
        with open(cargo_path, 'r', encoding='utf-8') as f:
            hash_components.append(f.read())
    
    # Include go.mod if exists (for Go projects)
    go_mod_path = os.path.join(repo_dir, 'go.mod')
    if os.path.exists(go_mod_path):
        with open(go_mod_path, 'r', encoding='utf-8') as f:
            hash_components.append(f.read())
    
    # Include composer.json if exists (for PHP projects)
    composer_path = os.path.join(repo_dir, 'composer.json')
    if os.path.exists(composer_path):
        with open(composer_path, 'r', encoding='utf-8') as f:
            hash_components.append(f.read())
    
    # Combine all components and generate hash
    combined_content = '\n'.join(hash_components)
    content_hash = hashlib.sha256(combined_content.encode('utf-8')).hexdigest()[:12]
    
    return content_hash


async def check_existing_image(repo_name: str, content_hash: str) -> Optional[str]:
    """
    Check if an image with the same content hash already exists.
    Returns the image name if found, None otherwise.
    
    FIXED: Only look for images with exact content hash match, not :latest
    This prevents wrong image reuse when different repos have different content.
    """
    try:
        # CRITICAL FIX: Only check for exact content hash match
        # Do NOT check :latest as it can be from different repository content
        image_pattern = f"local-registry/{repo_name}:{content_hash}"
        
        check_command = [
            "docker", "images",
            "--filter", f"reference={image_pattern}",
            "--format", "{{.ID}}\t{{.Repository}}:{{.Tag}}\t{{.CreatedAt}}"
        ]
        
        result = await asyncio.to_thread(
            subprocess.run,
            check_command,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0 and result.stdout.strip():
            lines = result.stdout.strip().split('\n')
            for line in lines:
                if line.strip():
                    parts = line.split('\t')
                    if len(parts) >= 2:
                        image_id, image_ref = parts[0], parts[1]
                        created_time = parts[2] if len(parts) > 2 else "unknown"
                        print(f"🔍 Found existing image with exact hash match: {image_ref} (ID: {image_id[:12]}, Created: {created_time})")
                        return image_ref
        
        print(f"🔍 No existing image found for {repo_name} with hash {content_hash}")
        return None
        
    except Exception as e:
        print(f"⚠️ Error checking for existing images: {e}")
        return None


async def get_image_metadata(image_name: str) -> Dict[str, Any]:
    """
    Get metadata about an existing image to help with reuse decisions.
    """
    try:
        inspect_command = ["docker", "image", "inspect", image_name]
        result = await asyncio.to_thread(
            subprocess.run,
            inspect_command,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            import json
            metadata = json.loads(result.stdout)
            if metadata and len(metadata) > 0:
                image_info = metadata[0]
                return {
                    'id': image_info.get('Id', '')[:12],
                    'created': image_info.get('Created', ''),
                    'size': image_info.get('Size', 0),
                    'architecture': image_info.get('Architecture', ''),
                    'os': image_info.get('Os', '')
                }
        
        return {}
        
    except Exception as e:
        print(f"⚠️ Error getting image metadata: {e}")
        return {}


async def tag_image_with_hash(existing_image: str, repo_name: str, content_hash: str) -> bool:
    """
    Tag an existing image with the content hash for future reference.
    """
    try:
        new_tag = f"local-registry/{repo_name}:{content_hash}"
        if existing_image == new_tag:
            return True
            
        tag_command = ["docker", "tag", existing_image, new_tag]
        result = await asyncio.to_thread(
            subprocess.run,
            tag_command,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print(f"✅ Tagged existing image with content hash: {new_tag}")
            return True
        else:
            print(f"⚠️ Failed to tag image: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"⚠️ Error tagging image: {e}")
        return False


# Enhanced docker_build function with image reuse logic
async def docker_build(container_name: str, repo_dir: str, force_rebuild: bool = False) -> Optional[str]:
    """
    Enhanced docker build with intelligent image reuse.
    
    Args:
        container_name: The container name (used for image naming)
        repo_dir: The repository directory containing Dockerfile
        force_rebuild: If True, force rebuild even if image exists
    
    Returns:
        The image name if successful, None if failed
    """
    # Extract repo name from container name for consistent naming
    repo_name = container_name.split('-')[0] if '-' in container_name else container_name
    
    # Calculate content hash for intelligent caching
    print("🔍 Calculating build context hash...")
    content_hash = await calculate_dockerfile_hash(repo_dir)
    
    # Create image names
    image_name_with_hash = f"local-registry/{repo_name}:{content_hash}"
    image_name_latest = f"local-registry/{repo_name}:latest"
    
    print(f"📦 Target image: {image_name_with_hash}")
    
    # Check for existing images unless force rebuild is requested
    if not force_rebuild:
        print("🔍 Checking for existing images...")
        existing_image = await check_existing_image(repo_name, content_hash)
        
        if existing_image:
            # Get metadata about the existing image
            metadata = await get_image_metadata(existing_image)
            if metadata:
                size_mb = metadata.get('size', 0) / (1024 * 1024)
                print(f"📊 Image info: ID={metadata.get('id')}, Size={size_mb:.1f}MB, Created={metadata.get('created', 'unknown')[:19]}")
            
            # Ensure the image is tagged with both hash and latest
            await tag_image_with_hash(existing_image, repo_name, content_hash)
            
            # Also tag as latest
            if existing_image != image_name_latest:
                tag_command = ["docker", "tag", existing_image, image_name_latest]
                await asyncio.to_thread(subprocess.run, tag_command, capture_output=True)
            
            print(f"♻️ Reusing existing image: {existing_image}")
            print("⚡ Build skipped - using cached image!")
            return existing_image
        else:
            print("🔨 No suitable existing image found, building new image...")
    else:
        print("🔨 Force rebuild requested, building new image...")
    
    # Build the new image
    print(f"🔧 Building image: {image_name_with_hash}")
    
    try:
        build_command = ["docker", "build", "-t", image_name_with_hash, "-t", image_name_latest, "."]
        
        # Show build progress
        print("⚙️ Running docker build...")
        result = await asyncio.to_thread(
            subprocess.run,
            build_command,
            cwd=repo_dir,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            print(f"❌ Docker build failed with exit code {result.returncode}")
            print(f"Error output: {result.stderr}")
            if result.stdout:
                print(f"Build output: {result.stdout[-1000:]}")  # Show last 1000 chars of output
            return None
            
        print("✅ Docker build completed successfully!")

        # Verify the image was created
        print("🔍 Verifying image creation...")
        verification_command = [
            "docker", "images",
            "--filter", f"reference={image_name_with_hash}",
            "--format", "{{.ID}}\t{{.Size}}\t{{.CreatedAt}}"
        ]
        
        verification_result = await asyncio.to_thread(
            subprocess.run,
            verification_command,
            text=True,
            capture_output=True
        )
        
        if verification_result.returncode == 0 and verification_result.stdout.strip():
            image_info = verification_result.stdout.strip().split('\t')
            image_id = image_info[0] if len(image_info) > 0 else "unknown"
            image_size = image_info[1] if len(image_info) > 1 else "unknown"
            created_time = image_info[2] if len(image_info) > 2 else "unknown"
            
            print(f"✅ Image built successfully!")
            print(f"📊 Image ID: {image_id[:12]}, Size: {image_size}, Created: {created_time[:19]}")
            
            # Store build metadata for future reference
            build_info = {
                'content_hash': content_hash,
                'image_id': image_id,
                'build_time': created_time,
                'repo_dir': os.path.basename(repo_dir)
            }
            
            print(f"💾 Build metadata: {json.dumps(build_info, indent=2)}")
            return image_name_with_hash
        else:
            print(f"❌ Image verification failed. No image found for reference '{image_name_with_hash}'.")
            return None

    except Exception as e:
        print(f"❌ Unexpected error during docker build: {e}")
        import traceback
        traceback.print_exc()
        return None


async def cleanup_old_images(repo_name: str, keep_count: int = 3) -> None:
    """
    Clean up old images for a repository, keeping only the most recent ones.
    
    Args:
        repo_name: The repository name
        keep_count: Number of images to keep (default: 3)
    """
    try:
        print(f"🧹 Cleaning up old images for {repo_name}...")
        
        # Get all images for this repo
        list_command = [
            "docker", "images",
            "--filter", f"reference=local-registry/{repo_name}",
            "--format", "{{.ID}}\t{{.Repository}}:{{.Tag}}\t{{.CreatedAt}}"
        ]
        
        result = await asyncio.to_thread(
            subprocess.run,
            list_command,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0 and result.stdout.strip():
            lines = result.stdout.strip().split('\n')
            
            # Skip the most recent images
            if len(lines) > keep_count:
                old_images = lines[:-keep_count]  # All but the last keep_count images
                
                for line in old_images:
                    parts = line.split('\t')
                    if len(parts) >= 2:
                        image_id, image_ref = parts[0], parts[1]
                        # Don't remove :latest tag
                        if not image_ref.endswith(':latest'):
                            print(f"🗑️ Removing old image: {image_ref} ({image_id[:12]})")
                            
                            try:
                                remove_command = ["docker", "rmi", image_ref]
                                remove_result = await asyncio.to_thread(
                                    subprocess.run,
                                    remove_command,
                                    capture_output=True,
                                    text=True
                                )
                                
                                if remove_result.returncode != 0:
                                    print(f"⚠️ Warning: Failed to remove {image_ref}: {remove_result.stderr}")
                                    
                            except Exception as remove_error:
                                print(f"⚠️ Warning: Exception while removing {image_ref}: {remove_error}")
                
                print(f"✅ Cleanup completed, kept {min(len(lines), keep_count)} most recent images")
            else:
                print(f"📦 Only {len(lines)} images found, no cleanup needed")
        elif result.returncode != 0:
            print(f"⚠️ Warning: Failed to list images for {repo_name}: {result.stderr}")
        else:
            print(f"ℹ️ No previous images found for {repo_name} (this is normal for first deployments)")
        
    except subprocess.SubprocessError as e:
        print(f"⚠️ Subprocess error during image cleanup: {e}")
    except Exception as e:
        print(f"⚠️ Unexpected error during image cleanup: {e}")
