import asyncio

async def run_container(image_name: str, container_name: str):
    print(f"Attempting to run container: {container_name}")

    await asyncio.create_subprocess_exec("docker", "stop", container_name, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    await asyncio.create_subprocess_exec("docker", "rm", container_name, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)

    try:
        command = [
            "docker",
            "run",
            "-d",
            "-P",
            "--name", container_name,
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

