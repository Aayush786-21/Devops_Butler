# 🤵‍♂️ DevOps Butler

Your personal, local deployment assistant. DevOps Butler is a Python-based platform that runs on your local machine, designed to completely automate the process of deploying a project from a Git repository to a live, accessible URL.

Give the Butler a Git URL, and it will handle the rest—from cloning and analysis to building, running, and networking—all while providing real-time logs of its every move.

<!-- 
**TODO:** Create a short screen recording of the process (connect WebSocket, send API request, see logs, visit the final URL) and save it as `butler-demo.gif` in this directory. Then uncomment the line below.
-->
<!-- ![DevOps Butler in Action](butler-demo.gif) -->

## ✨ Core Features

*   **API-Driven:** Start an entire deployment with a single `POST` request.
*   **Intelligent Analysis:** Automatically detects whether a project uses `docker-compose.yml` or a single `Dockerfile` and chooses the correct deployment strategy.
*   **Real-time Logging:** Uses WebSockets to stream live, color-coded logs directly to you as the pipeline runs. You're never in the dark about what the Butler is doing.
*   **Automatic Reverse Proxy:** Integrates with Nginx to automatically configure a reverse proxy for each deployed application.
*   **"Pretty" Local URLs:** Makes your deployed applications accessible via clean, predictable URLs like `http://proj-a1b2c3d4.localhost:8888`.
*   **Conflict-Free Deployments:** Generates unique IDs for every project, allowing multiple applications to be built and run side-by-side without them overwriting each other.

## 🛠️ Tech Stack

*   **Backend Framework:** [FastAPI](https://fastapi.tiangolo.com/)
*   **Real-time Communication:** WebSockets
*   **Orchestration Engine:** Python (`subprocess`, `asyncio`)
*   **Containerization:** Docker & Docker Compose
*   **Reverse Proxy:** Nginx
*   **Primary Dependencies:** `uvicorn`, `pydantic`

## ⚙️ How It Works

The DevOps Butler operates as an event-driven system with a clear, modular architecture.

1.  **API Request:** A user sends a `POST` request to the `/deploy` endpoint with a Git repository URL.
2.  **Background Job:** The FastAPI server immediately accepts the request, creates a unique ID for the job, and starts the deployment pipeline as a non-blocking background task.
3.  **WebSocket Connection:** The user connects a WebSocket client to `/ws/{client-id}` to start receiving live logs.
4.  **Pipeline Execution:** The pipeline, running in the background, begins its work:
    a. **Log:** Broadcasts its initial status over the WebSocket.
    b. **Clone:** Clones the Git repository into a temporary local directory.
    c. **Analyze:** Checks for a `docker-compose.yml` file first. If not found, it looks for a `Dockerfile`.
    d. **Build & Run:** Executes the appropriate module (`docker_up.py` or `docker_build.py` + `docker_run.py`) to build the images and run the containers. All `subprocess` calls are run in separate threads to prevent blocking the server.
    e.
    **Inspect:** After the containers are running, it inspects them to discover which host ports they are mapped to.
    f. **Configure Network:** It calls the `nginx_manager.py` module to write a new `.conf` file to the Nginx servers directory.
    g. **Reload:** It reloads the Nginx service (using its pre-configured `sudo` permission) to apply the new routing rule.
5.  **Success:** The final, clean URL is broadcasted to the user via the WebSocket, and the pipeline concludes.

## 🚀 Getting Started

### Prerequisites

You must have the following tools installed on your macOS machine:

1.  **Homebrew:** The missing package manager for macOS.
2.  **Python 3.11+**
3.  **Docker Desktop:** Make sure the Docker engine is running.

### Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/DevOps-Butler.git
    cd DevOps-Butler
    ```

2.  **Create a Python Virtual Environment**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install Dependencies**
    **Important:** First, generate the `requirements.txt` file from your active environment.
    ```bash
    pip freeze > requirements.txt
    ```
    Then, install from the file (for future use).
    ```bash
    pip install -r requirements.txt
    ```

4.  **Install and Configure Nginx**
    ```bash
    # Install Nginx
    brew install nginx

    # Edit the main config file to change the port (e.g., to 8888)
    # and to include site-specific configs.
    sudo nano /opt/homebrew/etc/nginx/nginx.conf 
    # --> Change 'listen 8080' to 'listen 8888'
    # --> Add 'include servers/*;' at the end of the http block

    # Create the directory for our site configs
    sudo mkdir /opt/homebrew/etc/nginx/servers

    # Start the Nginx service
    brew services start nginx
    ```

5.  **Set Up Required Permissions**
    The Butler needs permission to write Nginx configs and reload the service.

    *   **Take Ownership of the `servers` directory:** (Replace `your_username` with your actual username)
        ```bash
        sudo chown your_username /opt/homebrew/etc/nginx/servers
        ```

    *   **Allow passwordless Nginx reloads:** Run `sudo visudo` and add the following line at the end of the file, replacing `your_username` and verifying the path to `brew`.
        ```
        your_username ALL=(ALL) NOPASSWD: /opt/homebrew/bin/brew services restart nginx
        ```

### Usage

1.  **Start the DevOps Butler Server**
    ```bash
    # Make sure your venv is active
    uvicorn orchestrator:app --reload
    ```

2.  **Connect a WebSocket Client**
    Open a WebSocket testing tool (like [PieSocket](https://www.piesocket.com/websocket-tester)) and connect to:
    `ws://127.0.0.1:8000/ws/my-test-session`

3.  **Send a Deployment Request**
    Use an API client like Bruno, Postman, or `curl` to send a `POST` request:
    ```bash
    curl -X POST "http://127.0.0.1:8000/deploy" \
    -H "Content-Type: application/json" \
    -d '{"git_url": "https://github.com/some-user/some-repo.git"}'
    ```

4.  **Watch the Magic**
    Switch to your WebSocket client and watch the logs stream in.

5.  **Access Your App**
    Once the pipeline succeeds, it will print the final URL. Open it in your browser!
    `http://proj-xxxxxxxx.localhost:8888`

## 🔮 Future Roadmap

*   [ ] **Build a Proper Frontend:** Create a simple HTML/CSS/JS single-page application to provide a user interface.
*   [ ] **Persistence:** Add a simple SQLite database to store deployment history and status.
*   [ ] **Cleanup Logic:** Add functionality to "destroy" a deployment, which would stop the container and remove the Nginx config.
*   [ ] **Enhanced Log Streaming:** Stream the raw `stdout` from `docker build` commands for more detailed logs.
*   [ ] **PaaS Transformation:** Architect the system to run on a cloud provider like AWS using services like Fargate, CodeBuild, and ECR.

