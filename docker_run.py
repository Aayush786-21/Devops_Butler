import subprocess

def run_container(image_name: str, container_name: str):
    print(f"Attempting to run container: {container_name}")

    subprocess.run(["docker", "stop", container_name], capture_output=True)
    subprocess.run(["docker", "rm", container_name], capture_output=True)

    try:
        command = [
            "docker",
            "run",
            "-d",
            "-P",
            "--name", container_name,
            image_name
        ]
        subprocess.run(command, check=True)
        print(f"Successfully started the container {container_name} from the image {image_name}")
        return True

    except subprocess.CalledProcessError as failed:
        print(f"Error starting container {container_name} from the image {image_name} because of {failed}")
        return False

