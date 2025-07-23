import asyncio
from typing import Optional

async def ensure_network_exists(network_name: str):
    # Check if the network exists
    proc = await asyncio.create_subprocess_exec(
        "docker", "network", "ls", "--filter", f"name={network_name}", "--format", "{{.Name}}",
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    stdout, _ = await proc.communicate()
    networks = stdout.decode().splitlines()
    if network_name not in networks:
        print(f"Network '{network_name}' not found. Creating it...")
        create_proc = await asyncio.create_subprocess_exec(
            "docker", "network", "create", network_name,
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        await create_proc.communicate()
        if create_proc.returncode == 0:
            print(f"✅ Created Docker network: {network_name}")
        else:
            print(f"❌ Failed to create Docker network: {network_name}")
    else:
        print(f"Docker network '{network_name}' already exists.")

async def run_container(
    image_name: str,
    container_name: str,
    host_port: Optional[int] = None,
    internal_port: Optional[int] = None
):
    print(f"Attempting to run container: {container_name}")

    # Ensure the Docker network exists
    await ensure_network_exists("devops-butler-net")

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
        ]
        if host_port and internal_port:
            command += ["-p", f"{host_port}:{internal_port}"]
        command.append(image_name)
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

