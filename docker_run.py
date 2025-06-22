import subprocess

def run_container(image_name: str, project_id: str):
    print(f"Attempting to run container for project: {project_id}")

    subprocess.run(["docker", "stop", project_id], capture_output=True)
    subprocess.run(["docker", "rm", project_id], capture_output=True)

    try:
        command = [
            "docker",
            "run",
            "-d",
            "-P",
            "--name", project_id,
            image_name
        ]
        subprocess.run(command, check=True)
        print(f"Successfully started the container {project_id} from the image {image_name}")
        return True

    except subprocess.CalledProcessError as failed:
        print(f"Error starting container {project_id} from the image {image_name} because of {failed}")
        return False

