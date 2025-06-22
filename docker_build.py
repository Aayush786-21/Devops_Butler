import subprocess
import os


def docker_build(repo_url: str, project_id: str):
    repo_dir = "./temp_repo"
    image_name = f"local-registry/{project_id}:latest"

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
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print("Docker build completed successfully!")
        print(f"Build output: {result.stdout}")

        # Check if image was created
        def get_docker_images():
            result = subprocess.run(
                ["docker", "images"],
                text=True,
                capture_output=True
            )
            return result.stdout.strip().split('\n')

        print("\nListing all Docker images:")
        images = get_docker_images()
        for image in images:
            print(f"  {image}")

        # Check specifically for our image
        if any(image_name in image for image in images):
            print(f"\n Successfully found '{image_name}' in the list!")
            return image_name
        else:
            print(f"\n '{image_name}' not found in the list!")
            return None

    except subprocess.CalledProcessError as e:
        print(f" Docker build failed: {e}")
        print(f"Error output: {e.stderr}")
        return None
    except Exception as e:
        print(f" Unexpected error: {e}")
        return None
    finally:
        os.chdir(original_dir)

        