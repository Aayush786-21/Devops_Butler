import os
import subprocess
import json

def docker_up(repo_url: str):
    repo_dir = "./temp_repo"
    print(f"running the docker compose from {repo_dir}")

    original_dir = os.getcwd()
    os.chdir(repo_dir)

    try:
        command = [
            "docker",
            "compose",
            "up",
            "--build",
            "-d"
        ]

        print(f"building your web application")
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print("Docker compose up completed successfully")
        print(f"build output: {result.stdout}")

        # Get container names
        ps_command = ["docker", "compose", "ps", "--format", "json"]
        ps_result = subprocess.run(ps_command, check=True, capture_output=True, text=True)
        containers_info = json.loads(ps_result.stdout)
        container_names = [info["Name"] for info in containers_info]
        return container_names

    except subprocess.CalledProcessError as failed:
        print(f"docker compose up failed: {failed}")
        print(f"error output: {failed.stderr}")
        return []
    finally:
        os.chdir(original_dir)