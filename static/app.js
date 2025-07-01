// --- Helper: Toast Notification ---
function showToast(msg, type='info') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.background = type === 'success'
      ? 'linear-gradient(90deg, #23244a 80%, #f59e0b 100%)'
      : (type === 'error'
        ? 'linear-gradient(90deg, #23244a 80%, #ff3c6a 100%)'
        : 'rgba(30,32,40,0.95)');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
  }
  // --- Logs Section ---
  const logsDiv = document.getElementById('logs');
  function addLog(message, type='info') {
    const now = new Date();
    const timestamp = now.toLocaleTimeString();
    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = `<span class="log-timestamp">${timestamp}</span><span class="log-msg">${message}</span>`;
    logsDiv.appendChild(line);
    logsDiv.scrollTop = logsDiv.scrollHeight;
  }
  function clearLogs() { logsDiv.innerHTML = ''; }
  // --- Deploy Form ---
  const deployForm = document.getElementById('deployForm');
  const gitUrlInput = document.getElementById('gitUrl');
  const deployBtn = document.getElementById('deployBtn');
  let socket = null;
  deployForm.addEventListener('submit', handleDeploy);
  function validateGitUrl(url) {
    // Simple validation for GitHub/GitLab/Bitbucket URLs
    return /^https?:\/\/(github|gitlab|bitbucket)\.com\/.+\/.+\.git$/.test(url.trim());
  }
  async function handleDeploy(e) {
    e.preventDefault();
    const gitUrl = gitUrlInput.value.trim();
    if (!validateGitUrl(gitUrl)) {
      gitUrlInput.classList.add('invalid');
      showToast('Please enter a valid Git repository URL.', 'error');
      return;
    }
    gitUrlInput.classList.remove('invalid');
    clearLogs();
    addLog('🔵 STATUS: Initiating deployment...');
    showToast('Deployment started!', 'success');
    connectWebSocket();
    try {
      const response = await fetch('/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ git_url: gitUrl })
      });
      const result = await response.json();
      if (response.ok) {
        addLog(`✅ DEPLOY-REQUEST-ACCEPTED: ${result.message}`);
        showToast('Deployment request accepted!', 'success');
      } else {
        addLog(`🔴 ERROR: ${result.detail || 'Failed to start deployment.'}`);
        showToast('Failed to start deployment.', 'error');
      }
    } catch (error) {
      addLog(`🔴 NETWORK-ERROR: Could not reach the server. ${error}`);
      showToast('Network error.', 'error');
    }
  }
  gitUrlInput.addEventListener('input', () => {
    gitUrlInput.classList.remove('invalid');
  });
  // --- WebSocket for Live Logs ---
  function connectWebSocket() {
    if (socket) socket.close();
    const clientId = `web-client-${Date.now()}`;
    const wsUrl = `ws://${window.location.host}/ws/${clientId}`;
    socket = new WebSocket(wsUrl);
    socket.onopen = () => addLog('🔗 WebSocket Connection Established. Waiting for logs...');
    socket.onmessage = (event) => {
      // Simulate typing animation for logs
      typeLog(event.data);
    };
    socket.onclose = () => addLog('🔌 WebSocket Connection Closed.');
    socket.onerror = (error) => addLog(`🔴 WEBSOCKET-ERROR: ${error}`);
  }
  function typeLog(text) {
    // Simulate typing effect for logs
    let i = 0;
    function type() {
      if (i < text.length) {
        addLog(text.slice(0, i+1));
        i++;
        setTimeout(type, 8);
      } else {
        addLog(text);
      }
    }
    type();
  }
  // --- Deployment History ---
  const refreshBtn = document.getElementById('refreshBtn');
  const historyTableBody = document.querySelector('#historyTable tbody');
  async function fetchAndDisplayHistory() {
    addLog('🔄 Fetching deployment history...');
    try {
      const response = await fetch('/deployments');
      const deployments = await response.json();
      historyTableBody.innerHTML = '';
      if (deployments.length === 0) {
        addLog('No deployment history found.');
        return;
      }
      deployments.forEach(dep => {
        const row = document.createElement('tr');
        const formattedDate = new Date(dep.created_at).toLocaleString();
        let statusClass = 'status-badge';
        let statusIcon = '⏳';
        if (dep.status === 'success') { statusClass += ' success'; statusIcon = '✅'; }
        else if (dep.status === 'failed') { statusClass += ' failed'; statusIcon = '❌'; }
        else if (dep.status === 'starting') { statusIcon = '🚀'; }
        const urlLink = dep.deployed_url
          ? `<a href="${dep.deployed_url}" target="_blank" title="Open deployment">${dep.deployed_url}</a>`
          : '<span style="color:var(--text-secondary);">N/A</span>';
        row.innerHTML = `
          <td>${dep.id}</td>
          <td><span style="font-family:var(--font-mono);font-size:1em;">${dep.container_name}</span></td>
          <td><span class="${statusClass}">${statusIcon} ${dep.status.charAt(0).toUpperCase() + dep.status.slice(1)}</span></td>
          <td>${urlLink}</td>
          <td>${formattedDate}</td>
        `;
        historyTableBody.appendChild(row);
      });
      addLog('✅ History updated.');
    } catch (error) {
      addLog(`🔴 ERROR: Could not fetch history. ${error}`);
      showToast('Could not fetch deployment history.', 'error');
    }
  }
  refreshBtn.addEventListener('click', fetchAndDisplayHistory);
  window.addEventListener('load', fetchAndDisplayHistory);
  // --- Floating Action Button ---
  const fab = document.getElementById('fabDeploy');
  fab.addEventListener('click', () => {
    gitUrlInput.focus();
    showToast('Paste your Git URL and hit Deploy!', 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  // --- CLEAR HISTORY BUTTON LOGIC ---
  const clearBtn = document.getElementById('clearBtn');
  async function handleClearHistory() {
    if (!confirm("Are you sure you want to delete ALL deployment history? This cannot be undone.")) {
        return;
    }
    try {
        const response = await fetch('/deployments/clear', {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if(response.ok) {
            addLog(`✅ ${result.message}`);
            // After clearing, automatically refresh the (now empty) table
            fetchAndDisplayHistory();
        } else {
            addLog(`🔴 ERROR: ${result.detail}`);
        }
    } catch (error) {
        addLog(`🔴 NETWORK-ERROR: Could not clear history. ${error}`);
    }
  }
  if (clearBtn) {
    clearBtn.addEventListener('click', handleClearHistory);
  }
  // --- END CLEAR HISTORY BUTTON LOGIC ---
  