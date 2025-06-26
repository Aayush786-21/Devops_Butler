import asyncio
import json

async def inspect_container(container_name: str):
    try:
        proc = await asyncio.create_subprocess_exec(
            "docker", "inspect", container_name,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await proc.communicate()
        if proc.returncode != 0:
            print(f"Failed to inspect container: {stderr.decode()}")
            return None
        inspect_data = json.loads(stdout.decode())
        return inspect_data[0]
    except Exception as e:
        print(f"Failed to inspect container: {e}")
        return None 