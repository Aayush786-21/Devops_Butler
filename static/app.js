// AOS Animation init
AOS.init({
  duration: 800,
  once: true,
});

// --- Smooth Scroll for Navbar Links ---
document.querySelectorAll('.nav-link, .nav-cta, .hero-buttons a').forEach(link => {
  link.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// --- Deploy Form Logic ---
const deployForm = document.querySelector('.deploy-form');
const gitUrlInput = document.getElementById('git-url');
const deployStatus = document.getElementById('deploy-status');
const statusLogs = document.getElementById('status-logs');
let socket = null;

function validateGitUrl(url) {
  // Accepts any https git repo (optionally supports SSH)
  const trimmed = url.trim();
  return /^https?:\/\/.+\/.+\/.+/.test(trimmed) || /^git@.+:.+\/.+\.git$/.test(trimmed);
}

deployForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  // Add .env files if selected
  const frontendEnv = document.getElementById('frontend-env').files[0];
  const backendEnv = document.getElementById('backend-env').files[0];
  if (frontendEnv) data.append('frontend_env', frontendEnv);
  if (backendEnv) data.append('backend_env', backendEnv);

  const gitUrl = gitUrlInput.value.trim();
  if (!validateGitUrl(gitUrl)) {
    gitUrlInput.classList.add('invalid');
    deployStatus.textContent = 'Please enter a valid Git repository URL.';
    deployStatus.style.color = 'var(--error)';
    return;
  }

  gitUrlInput.classList.remove('invalid');
  deployStatus.innerHTML = '🔵 STATUS: Initiating deployment... <span class="loader"></span>';
  deployStatus.style.color = 'var(--primary)';
  statusLogs.innerHTML = '';
  connectWebSocket();

  try {
    const response = await fetch('/deploy', {
      method: 'POST',
      body: data
    });
    const result = await response.json();
    if (response.ok) {
      deployStatus.textContent = `✅ ${result.message}`;
      deployStatus.style.color = 'var(--success)';
    } else {
      deployStatus.textContent = `🔴 ERROR: ${result.detail || 'Failed to start deployment.'}`;
      deployStatus.style.color = 'var(--error)';
    }
  } catch (error) {
    deployStatus.textContent = `🔴 NETWORK-ERROR: Could not reach the server.`;
    deployStatus.style.color = 'var(--error)';
  }
});

gitUrlInput.addEventListener('input', () => {
  gitUrlInput.classList.remove('invalid');
  deployStatus.textContent = '';
});

// --- WebSocket for Live Logs ---
function connectWebSocket() {
  if (socket) socket.close();
  const clientId = `web-client-${Date.now()}`;
  const wsUrl = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws/${clientId}`;
  socket = new WebSocket(wsUrl);
  socket.onopen = () => addLog('🔗 WebSocket Connection Established. Waiting for logs...');
  socket.onmessage = (event) => addLog(event.data);
  socket.onclose = () => addLog('🔌 WebSocket Connection Closed.');
  socket.onerror = (error) => addLog(`🔴 WEBSOCKET-ERROR: ${error}`);
}

function addLog(message) {
  if (!statusLogs) return;
  const now = new Date();
  const timestamp = now.toLocaleTimeString();
  const line = document.createElement('div');
  line.className = 'log-line fade-in';
  line.innerHTML = `<span class="log-timestamp">${timestamp}</span><span class="log-msg">${message}</span>`;
  statusLogs.appendChild(line);
  statusLogs.scrollTop = statusLogs.scrollHeight;
  setTimeout(() => line.classList.add('animate'), 10);
}

// --- Deployment History ---
const historyTableBody = document.querySelector('#history-table tbody');
async function fetchAndDisplayHistory() {
  if (!historyTableBody) return;
  try {
    const response = await fetch('/deployments');
    const deployments = await response.json();
    historyTableBody.innerHTML = '';
    if (deployments.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="5" style="text-align:center;color:var(--text-light);">No deployment history found.</td>`;
      historyTableBody.appendChild(row);
      return;
    }
    deployments.forEach(dep => {
      const row = document.createElement('tr');
      let statusClass = 'status-badge';
      let statusIcon = '⏳';
      if (dep.status === 'success') { statusClass += ' success'; statusIcon = '✅'; }
      else if (dep.status === 'failed') { statusClass += ' failed'; statusIcon = '❌'; }
      else if (dep.status === 'starting') { statusIcon = '🚀'; }

      const urlLink = dep.deployed_url
        ? `<a href="${dep.deployed_url}" target="_blank" title="Open deployment">${dep.deployed_url}</a>`
        : '<span style="color:var(--text-secondary);">N/A</span>';
      const formattedDate = dep.created_at ? new Date(dep.created_at).toLocaleString() : '-';
      
      // Create destroy button for running deployments
      const destroyButton = (dep.status === 'success' || dep.status === 'starting') 
        ? `<button class="btn btn-danger btn-sm" onclick="destroyDeployment('${dep.container_name}')" title="Destroy deployment">🗑️ Destroy</button>`
        : '<span style="color:var(--text-secondary);">-</span>';
      
      row.innerHTML = `
        <td><span style="font-family:var(--font-mono);font-size:1em;">${dep.container_name || '-'}</span></td>
        <td><span class="${statusClass}">${statusIcon} ${dep.status.charAt(0).toUpperCase() + dep.status.slice(1)}</span></td>
        <td>${urlLink}</td>
        <td>${formattedDate}</td>
        <td>${destroyButton}</td>
      `;
      historyTableBody.appendChild(row);
    });
  } catch (error) {
    const row = document.createElement('tr');
    row.innerHTML = `<td colspan="5" style="color:var(--error);text-align:center;">Could not fetch deployment history.</td>`;
    historyTableBody.appendChild(row);
    showToast('Could not fetch deployment history.', 'error');
  }
}
window.addEventListener('load', fetchAndDisplayHistory);

// --- Destroy Deployment Function ---
async function destroyDeployment(containerName) {
  if (!confirm(`Are you sure you want to destroy the deployment "${containerName}"? This will stop the container and remove all associated resources.`)) {
    return;
  }
  
  try {
    const response = await fetch(`/deployments/${containerName}`, { method: 'DELETE' });
    const result = await response.json();
    
    if (response.ok) {
      showToast(`✅ ${result.message}`, 'success');
      addUILog(`🗑️ Destroyed deployment: ${containerName}`);
      // Refresh the history table to show updated status
      fetchAndDisplayHistory();
    } else {
      showToast(`🔴 ERROR: ${result.detail}`, 'error');
      addUILog(`🔴 Failed to destroy deployment: ${result.detail}`);
    }
  } catch (error) {
    showToast(`🔴 NETWORK-ERROR: Could not destroy deployment.`, 'error');
    addUILog(`🔴 Network error while destroying deployment: ${error}`);
  }
}

// --- Helper: Toast Notification ---
function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.style.background = type === 'success'
    ? 'linear-gradient(90deg, #23244a 80%, #f59e0b 100%)'
    : (type === 'error'
      ? 'linear-gradient(90deg, #23244a 80%, #ff3c6a 100%)'
      : 'rgba(30,32,40,0.95)');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3200);
}

// --- Logs Panel (UI Logs) ---
const logsDiv = document.getElementById('logs');
function addUILog(message, type = 'info') {
  if (!logsDiv) return;
  const now = new Date();
  const timestamp = now.toLocaleTimeString();
  const line = document.createElement('div');
  line.className = 'log-line';
  line.innerHTML = `<span class="log-timestamp">${timestamp}</span><span class="log-msg">${message}</span>`;
  logsDiv.appendChild(line);
  logsDiv.scrollTop = logsDiv.scrollHeight;
}
function clearLogs() {
  if (logsDiv) logsDiv.innerHTML = '';
}

// --- Floating Action Button ---
const fab = document.getElementById('fabDeploy');
if (fab) {
  fab.addEventListener('click', () => {
    gitUrlInput.focus();
    showToast('Paste your Git URL and hit Deploy!', 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// --- CLEAR HISTORY BUTTON LOGIC ---
const clearBtn = document.getElementById('clearBtn');
async function handleClearHistory() {
  if (!confirm("Are you sure you want to delete ALL deployment history? This cannot be undone.")) {
    return;
  }
  try {
    const response = await fetch('/deployments/clear', { method: 'DELETE' });
    const result = await response.json();
    if (response.ok) {
      addUILog(`✅ ${result.message}`);
      fetchAndDisplayHistory();
    } else {
      addUILog(`🔴 ERROR: ${result.detail}`);
    }
  } catch (error) {
    addUILog(`🔴 NETWORK-ERROR: Could not clear history. ${error}`);
  }
}
if (clearBtn) {
  clearBtn.addEventListener('click', handleClearHistory);
}
