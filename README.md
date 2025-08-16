# 🤵‍♂️ DevOps Butler

A sophisticated, automated deployment assistant that transforms Git repositories into containerized applications with zero configuration. DevOps Butler streamlines the deployment process using Docker containerization and real-time monitoring.

## 🎯 Overview

DevOps Butler is a Python-based platform that automates the deployment pipeline:

- Clones Git repositories
- Analyzes project structure
- Builds and manages Docker containers
- Handles container networking and port mapping
- Provides real-time deployment logs via WebSocket
- Manages full container lifecycle

![DevOps Butler](icons/devops.png)

## 🌟 Key Features

### 1. **Smart Repository Analysis**

- Automatic detection of project type
- Support for multiple frameworks
- Support for existing Dockerfiles
- Docker Compose compatibility

### 2. **Docker Management**

- Docker container lifecycle handling
- Automatic port discovery and mapping
- Container health monitoring
- Network isolation
- Support for environment variables

### 3. **Deployment Features**

- One-click deployments
- WebSocket-based live logs
- Deployment status tracking
- Container health checks
- Resource usage monitoring

### 4. **Developer Experience**

- Modern web interface
- Real-time deployment logs
- Deployment history tracking
- Container management UI
- Built-in error handling



## ✨ Core Features

- **🚀 One-Click Deployments:** Start an entire deployment with a single click from the beautiful web interface or a `POST` request
- **🧠 Intelligent Analysis:** Automatically detects project structure and chooses the optimal deployment strategy
- **📊 Deployment History:** Track all deployments with status and timestamps in a persistent database
- **🗑️ Lifecycle Management:** Complete destroy functionality to clean up deployments and prevent resource conflicts
- **🔍 Enhanced Error Handling:** Detailed error messages and validation for better debugging
- **🌐 Beautiful Web UI:** Modern, responsive interface with real-time deployment status and logs
*   **📡 Real-time Logging:** Uses WebSockets to stream live, color-coded logs directly to you as the pipeline runs.
*   **🎯 Port Management:** Automatically manages container ports and provides easy access to deployed applications.
*   **⚡ Idempotent Deployments:** Automatically cleans up previous deployments before creating new ones.

## 🛠️ Tech Stack

- **Backend Framework:** [FastAPI](https://fastapi.tiangolo.com/)
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Real-time Communication:** WebSockets
- **Database:** SQLite with SQLModel ORM
- **Orchestration Engine:** Python (`subprocess`, `asyncio`)
- **Containerization:** Docker & Docker Compose
- **Primary Dependencies:** `uvicorn`, `pydantic`, `sqlmodel`

## ⚙️ How It Works

The DevOps Butler operates as an event-driven system with a clear, modular architecture.

### **Deployment Pipeline:**

1. **🎯 URL Validation:** Validates the Git URL and repository accessibility
2. **🧹 Cleanup:** Removes any existing deployments of the same repository
3. **📋 Database Record:** Creates a deployment record with "starting" status
4. **📥 Repository Clone:** Clones the Git repository into a temporary directory
5. **🔍 Analysis:** Detects project type and Docker configuration 
    - Checks for docker-compose.yml and Dockerfile
    - Analyzes complexity (dependencies, multiple services)
    - Chooses optimal deployment strategy
6.  **🏗️ Build & Deploy:**
6. **🏗️ Build & Deploy:** Builds Docker image and starts container
7. **🔧 Port Discovery:** Maps container ports to host
8. **✅ Success:** Updates database with deployment status


### **Lifecycle Management:**

- **🔄 Idempotent Deployments:** Same repository can be deployed multiple times safely
- **🗑️ Destroy Functionality:** Complete cleanup of containers and database records
- **🧹 Container Cleanup:** Prevents resource conflicts from stale containers

## 🚀 Getting Started

### Prerequisites

You must have the following tools installed on your macOS machine:

1.  **Homebrew:** The missing package manager for macOS.
2.  **Python 3.11+**
3.  **Docker Desktop:** Make sure the Docker engine is running.

### Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/aayush786-21/DevOps-Butler.git
    cd DevOps-Butler
    ```

2.  **Create a Python Virtual Environment**
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install Dependencies**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Set Up Docker Network**
    ```bash
    # Create the custom network for container communication
    docker network create devops-butler-net
    ```

### Usage

#### **Web Interface (Recommended)**

1.  **Start the DevOps Butler Server**
    ```bash
    # Make sure your venv is active
    python orchestrator.py
    ```

2.  **Open the Web Interface**
    Navigate to `http://localhost:8000` in your browser

3.  **Deploy Your First App**
    - Paste a Git repository URL
    - Click the "🚀 Deploy" button
    - Watch real-time logs and deployment progress
    - Access your app at the provided URL

#### **API Usage**

1.  **Start the Server**
    ```bash
    uvicorn orchestrator:app --reload
    ```

2.  **Deploy an Application**
    ```bash
    curl -X POST "http://127.0.0.1:8000/deploy" \
    -H "Content-Type: application/json" \
    -d '{"git_url": "https://github.com/some-user/some-repo.git"}'
    ```

3.  **View Deployment History**
    ```bash
    curl -X GET "http://127.0.0.1:8000/deployments"
    ```

4.  **Destroy a Deployment**
    ```bash
    curl -X DELETE "http://127.0.0.1:8000/deployments/container-name"
    ```



## 🎯 Supported Repository Types

### **Dockerfile Projects**
- Single container applications
- Multi-stage builds
- Custom base images
- Port exposure via `EXPOSE` directive

### **Docker Compose Projects**
- Simple single-service setups
- Automatic service discovery
- Port mapping detection
- **Note:** Complex multi-service setups with dependencies are handled via Dockerfile approach

### **No Dockerfile Projects**
- 🚧 AI-generated Dockerfiles (planned - not yet implemented)
- 🚧 Automatic dependency detection (planned)
- 🚧 Smart port inference (planned)
- 🚧 Language-specific optimizations (planned)

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Web interface |
| `GET` | `/applications` | Applications dashboard page |
| `POST` | `/deploy` | Deploy a Git repository |
| `GET` | `/deployments` | List all deployments |
| `GET` | `/api/applications` | Get running applications/containers |
| `DELETE` | `/deployments/{container_name}` | Destroy a deployment |
| `DELETE` | `/deployments/clear` | Clear all deployment history |
| `GET` | `/health` | System health check |
| `POST` | `/api/auth/login` | User authentication |
| `POST` | `/api/auth/register` | User registration |
| `GET` | `/ws/{client_id}` | WebSocket for real-time logs |

## 🛡️ Error Handling & Validation

- **URL Validation:** Rejects invalid URLs (Docker Hub, container registries)
- **Build Error Reporting:** Detailed Docker build error messages
- **Network Validation:** Ensures containers are accessible and ports are properly mapped
- **Graceful Failures:** Proper cleanup on deployment failures
- **Resource Management:** Automatic cleanup of stale containers and resources

## 🔮 Future Roadmap

*   [x] **Build a Proper Frontend:** ✅ Beautiful web interface with real-time updates
*   [x] **Persistence:** ✅ SQLite database with deployment history
*   [x] **Cleanup Logic:** ✅ Complete destroy functionality
*   [x] **Enhanced Log Streaming:** ✅ Real-time WebSocket logs
*   [ ] **Multi-Environment Support:** Support for staging, production environments
*   [ ] **Health Checks:** Automatic health monitoring of deployed applications
*   [ ] **Resource Monitoring:** CPU, memory, and disk usage tracking
*   [ ] **Custom Domains:** Support for custom domain names
*   [ ] **SSL/TLS Support:** Automatic HTTPS certificate generation
*   [ ] **PaaS Transformation:** Cloud deployment with AWS/GCP/Azure

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- Docker for containerization technology
- The open-source community for inspiration and tools

