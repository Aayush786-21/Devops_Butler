import asyncio
import subprocess

# The function now accepts the project_id (or container_name)
async def docker_build(container_name: str):
    image_name = f"local-registry/{container_name}:latest"
    print(f"building the image: {image_name} inside ./temp_repo")

    try:
        build_command = ["docker", "build", "-t", image_name, "."]
        await asyncio.to_thread(
            subprocess.run,
            build_command,
            cwd="./temp_repo",
            check=True,
            capture_output=True,
            text=True
        )
        print("Docker build completed successfully!")

        # --- ROBUST VERIFICATION LOGIC ---
        print("\nVerifying image creation with a precise filter...")
        verification_command = [
            "docker", "images",
            "--filter", f"reference={image_name}",
            "--format", "{{.ID}}"
        ]
        verification_result = await asyncio.to_thread(
            subprocess.run,
            verification_command,
            text=True,
            capture_output=True,
            check=True
        )
        image_id = verification_result.stdout.strip()
        if image_id:
            print(f"\n✅ Successfully verified image '{image_name}' exists with ID: {image_id}")
            return image_name
        else:
            print(f"\n❌ Verification failed. No image found for reference '{image_name}'.")
            return None
        # ---------------------------------

    except Exception as e:
        print(f" An unexpected error occurred in docker_build: {e}")
        return None