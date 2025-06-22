import os
import subprocess

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
        return True

    except subprocess.CalledProcessError as failed:
        print(f"docker compose up failed: {failed}")
        print(f"error output: {failed.stderr}")
        return False
    
    finally:
        os.chdir(original_dir)