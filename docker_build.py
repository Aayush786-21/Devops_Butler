import asyncio
import os

async def docker_build(repo_url: str, container_name: str):
    repo_dir = "./temp_repo"
    image_name = f"local-registry/{container_name}:latest"

    print(f"running the dockerfile that we found inside {repo_dir}")

    original_dir = os.getcwd()
    os.chdir(repo_dir)

    try:
        command = [
            "docker",
            "build",
            "-t",
            image_name,
            "."
        ]

        print(f"building the image inside {repo_dir}")
        proc = await asyncio.create_subprocess_exec(*command, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        stdout, stderr = await proc.communicate()
        if proc.returncode != 0:
            print(f" Docker build failed: {stderr.decode()}")
            return None
        print("Docker build completed successfully!")
        print(f"Build output: {stdout.decode()}")

        # Check if image was created
        async def get_docker_images():
            proc = await asyncio.create_subprocess_exec(
                "docker", "images",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            out, _ = await proc.communicate()
            return out.decode().strip().split('\n')

        print("\nListing all Docker images:")
        images = await get_docker_images()
        for image in images:
            print(f"  {image}")

        # Check specifically for our image
        if any(image_name in image for image in images):
            print(f"\n Successfully found '{image_name}' in the list!")
            return image_name
        else:
            print(f"\n '{image_name}' not found in the list!")
            return None

    except Exception as e:
        print(f" Unexpected error: {e}")
        return None
    finally:
        os.chdir(original_dir)