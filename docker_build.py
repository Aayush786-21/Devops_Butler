import subprocess
import os


def docker_build(repo_url: str):
    repo_dir = "./temp_repo"
    print(f"running the dockerfile that we found inside {repo_dir}")

    original_dir = os.getcwd()
    os.chdir(repo_dir)

    try:
        command = [
            "docker",
            "build",
            "-t",
            "my_new_docker_image",
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
        if any("my_new_docker_image" in image for image in images):
            print("\n✅ Successfully found 'my_new_docker_image' in the list!")
            return True
        else:
            print("\n❌ 'my_new_docker_image' not found in the list!")
            return False

    except subprocess.CalledProcessError as e:
        print(f"❌ Docker build failed: {e}")
        print(f"Error output: {e.stderr}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False
    finally:
        os.chdir(original_dir)

        