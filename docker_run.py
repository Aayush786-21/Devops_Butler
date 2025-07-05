import asyncio

async def run_container(image_name: str, container_name: str):
    print(f"Attempting to run container: {container_name}")

    # Stop old container if it exists - wait for completion
    print(f"Stopping old container if it exists: {container_name}")
    stop_proc = await asyncio.create_subprocess_exec("docker", "stop", container_name, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    await stop_proc.communicate()  # Wait for 'stop' to finish

    # Remove old container if it exists - wait for completion
    print(f"Removing old container if it exists: {container_name}")
    rm_proc = await asyncio.create_subprocess_exec("docker", "rm", container_name, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    await rm_proc.communicate()  # Wait for 'rm' to finish

    try:
        print(f"🔧 VERIFICATION: Running container with name='{container_name}'")
        command = [
            "docker",
            "run",
            "-d",
            "--name", container_name,
            "--network", "devops-butler-net",
            image_name
        ]
        proc = await asyncio.create_subprocess_exec(*command, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
        _, stderr = await proc.communicate()
        if proc.returncode == 0:
            print(f"Successfully started the container {container_name} from the image {image_name}")
            return True
        else:
            print(f"Error starting container {container_name} from the image {image_name} because of {stderr.decode()}")
            return False
    except Exception as failed:
        print(f"Error starting container {container_name} from the image {image_name} because of {failed}")
        return False

