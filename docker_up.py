import os
import subprocess
import json
import asyncio
from container_inspector import inspect_container
from docker_helpers import get_host_port

async def docker_up(repo_url: str):
    repo_dir = "./temp_repo"
    print(f"running the docker compose from {repo_dir}")

    try:
        up_command = [
            "docker",
            "compose",
            "up",
            "--build",
            "-d"
            ]
        print("Building and starting services via docker-compose...")
        await asyncio.to_thread(subprocess.run, up_command, cwd=repo_dir, check=True, capture_output=True, text=True)
        print("Docker compose up completed successfully.")

        print("Discovering running container names...")
        ps_command_json = ["docker", "compose", "ps", "--format", "json"]
        ps_result = await asyncio.to_thread(subprocess.run,
            ps_command_json,
            cwd=repo_dir,
            check=True,
            text=True,
            capture_output=True
        )
        output_lines = ps_result.stdout.strip().split('\n')
        containers_info = [json.loads(line) for line in output_lines if line.strip()]
        container_names = [info["Name"] for info in containers_info]
        print(f"✅ Discovered containers: {container_names}")

        # Inspect each container and get its port
        service_ports = {}
        for name in container_names:
            details = await inspect_container(name)
            if details:
                host_port = get_host_port(details)
                if host_port:
                    service_ports[name] = host_port
        print(f"✅ Discovered service ports: {service_ports}")
        return service_ports

    except subprocess.CalledProcessError as failed:
        print(f"A docker-compose command failed: {failed}")
        print(f"Error output: {failed.stderr}")
        return {}