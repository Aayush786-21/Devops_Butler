// Get references to our HTML elements
const gitUrlInput = document.getElementById('gitUrl');
const deployBtn = document.getElementById('deployBtn');
const logsDiv = document.getElementById('logs');

let socket; // This will hold our WebSocket connection

// --- Function to add a log message to the screen ---
function addLog(message) {
    logsDiv.innerHTML += message + '\n';
    // Auto-scroll to the bottom
    logsDiv.scrollTop = logsDiv.scrollHeight;
}

// --- Function to handle the Deploy button click ---
async function handleDeploy() {
    const gitUrl = gitUrlInput.value;
    if (!gitUrl) {
        alert('Please enter a Git repository URL.');
        return;
    }

    logsDiv.innerHTML = ''; // Clear previous logs
    addLog('🔵 STATUS: Initiating deployment...');

    // Step 1: Connect to the WebSocket for logging
    connectWebSocket();

    // Step 2: Send the POST request to the /deploy endpoint
    try {
        const response = await fetch('/deploy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ git_url: gitUrl })
        });

        const result = await response.json();
        
        if (response.ok) {
            addLog(`✅ DEPLOY-REQUEST-ACCEPTED: ${result.message}`);
        } else {
            addLog(`🔴 ERROR: ${result.detail || 'Failed to start deployment.'}`);
        }

    } catch (error) {
        addLog(`🔴 NETWORK-ERROR: Could not reach the server. ${error}`);
    }
}

// --- Function to establish the WebSocket connection ---
function connectWebSocket() {
    // Close any existing connection
    if (socket) {
        socket.close();
    }

    // Create a unique ID for this session
    const clientId = `web-client-${Date.now()}`;
    const wsUrl = `ws://127.0.0.1:8000/ws/${clientId}`;
    
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
        addLog('🔗 WebSocket Connection Established. Waiting for logs...');
    };

    socket.onmessage = (event) => {
        // This is where we receive messages from the server
        addLog(event.data);
    };

    socket.onclose = () => {
        addLog('🔌 WebSocket Connection Closed.');
    };

    socket.onerror = (error) => {
        addLog(`🔴 WEBSOCKET-ERROR: ${error}`);
    };
}

deployBtn.addEventListener('click', handleDeploy);

// --- Deployment History Section ---
const refreshBtn = document.getElementById('refreshBtn');
const historyTableBody = document.querySelector('#historyTable tbody');

async function fetchAndDisplayHistory() {
    addLog('🔄 Fetching deployment history...');
    try {
        const response = await fetch('/deployments');
        const deployments = await response.json();

        // Clear the existing table body
        historyTableBody.innerHTML = '';

        if (deployments.length === 0) {
            addLog('No deployment history found.');
            return;
        }

        // Loop through each deployment and create a table row
        deployments.forEach(dep => {
            const row = document.createElement('tr');
            
            const formattedDate = new Date(dep.created_at).toLocaleString();
            const urlLink = dep.deployed_url ? `<a href="${dep.deployed_url}" target="_blank">${dep.deployed_url}</a>` : 'N/A';

            row.innerHTML = `
                <td>${dep.id}</td>
                <td>${dep.container_name}</td>
                <td>${dep.status}</td>
                <td>${urlLink}</td>
                <td>${formattedDate}</td>
            `;
            historyTableBody.appendChild(row);
        });
        addLog('✅ History updated.');

    } catch (error) {
        addLog(`🔴 ERROR: Could not fetch history. ${error}`);
    }
}

refreshBtn.addEventListener('click', fetchAndDisplayHistory);
window.addEventListener('load', fetchAndDisplayHistory); 