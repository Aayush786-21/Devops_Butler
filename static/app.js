// Authentication check and setup
let authToken = localStorage.getItem('authToken');
let username = localStorage.getItem('username');
let authProvider = localStorage.getItem('authProvider');

const token = localStorage.getItem('authToken');
const currentPath = window.location.pathname;
const isAuthPage = ['/login', '/register', '/auth'].includes(currentPath);
const protectedPages = ['/dashboard', '/deploy', '/history'];
if (token && isAuthPage) {
  window.location.href = '/dashboard';
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  clearDeploymentUrlButton(); // Ensure clean state on page load
  attachLogoutHandler();
});

function checkAuthStatus() {
    const userInfo = document.getElementById('userInfo');
    const loginLink = document.getElementById('loginLink');
    const usernameSpan = document.getElementById('username');
    
    if (authToken && username) {
        // User is logged in
        if (userInfo) userInfo.style.display = 'inline';
        if (loginLink) loginLink.style.display = 'none';
        if (usernameSpan) {
            const providerIcon = authProvider === 'github' ? '🐙' : '👤';
            usernameSpan.textContent = `${providerIcon} Welcome, ${username}!`;
        }
        // Load deployment history for authenticated user
        if (typeof fetchAndDisplayHistory === 'function') fetchAndDisplayHistory();
        // Load GitHub repositories if user is GitHub user
        if (authProvider === 'github' && typeof loadUserGitHubRepositories === 'function') {
            loadUserGitHubRepositories();
        }
    } else {
        // User is not logged in
        if (userInfo) userInfo.style.display = 'none';
        if (loginLink) loginLink.style.display = 'inline';
        // Only redirect to /login if on a protected page
        if (protectedPages.includes(currentPath)) {
            window.location.href = '/login';
        }
        // Do NOT redirect or block access on /, /login, /register, or /learn
    }
}

// Logout function
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('authProvider');
        authToken = null;
        username = null;
        authProvider = null;
        checkAuthStatus();
        if (typeof showToast === 'function') showToast('Logged out successfully', 'success');
        window.location.reload();
    });
}

function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) {
        return;
    }
    // Clear tokens only (do not clear deployment/history data)
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('authProvider');
    // Try to call backend logout
    fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      .finally(() => {
        window.location.href = '/login';
      });
}

function attachLogoutHandler() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = handleLogout;
    }
}

// Helper function to get authenticated headers
function getAuthHeaders() {
    const headers = {};
    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
}

// --- Smooth Scroll for Navbar Links ---
document.querySelectorAll('.nav-link, .nav-cta, .hero-buttons a').forEach(link => {
  link.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href && href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
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

if (deployForm) {
  deployForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Check authentication
    if (!authToken) {
      if (typeof showToast === 'function') showToast('Please login to deploy applications', 'error');
      window.location.href = '/login';
      return;
    }
    
    const form = e.target;
    const data = new FormData(form);
    // Add .env files if selected
    const frontendEnv = document.getElementById('frontend-env')?.files[0];
    const backendEnv = document.getElementById('backend-env')?.files[0];
    if (frontendEnv) data.append('frontend_env', frontendEnv);
    if (backendEnv) data.append('backend_env', backendEnv);

    const gitUrl = gitUrlInput ? gitUrlInput.value.trim() : '';
    if (!validateGitUrl(gitUrl)) {
      if (gitUrlInput) gitUrlInput.classList.add('invalid');
      if (deployStatus) {
        deployStatus.textContent = 'Please enter a valid Git repository URL.';
        deployStatus.style.color = 'var(--error)';
      }
      return;
    }

    if (gitUrlInput) gitUrlInput.classList.remove('invalid');
    if (deployStatus) {
      deployStatus.innerHTML = '🔵 STATUS: Initiating deployment... <span class="loader"></span>';
      deployStatus.style.color = 'var(--primary)';
    }
    if (statusLogs) statusLogs.innerHTML = '';
    
    // Clear any existing deployment URL button
    clearDeploymentUrlButton();
    
    connectWebSocket();

    try {
      const response = await fetch('/deploy', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: data
      });
      
      if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        if (typeof showToast === 'function') showToast('Session expired. Please login again.', 'error');
        window.location.href = '/login';
        return;
      }
      
      const result = await response.json();
      if (response.ok) {
        if (deployStatus) {
          deployStatus.textContent = `✅ ${result.message}`;
          deployStatus.style.color = 'var(--success)';
        }
      } else {
        if (deployStatus) {
          deployStatus.textContent = `🔴 ERROR: ${result.detail || 'Failed to start deployment.'}`;
          deployStatus.style.color = 'var(--error)';
        }
      }
    } catch (error) {
      if (deployStatus) {
        deployStatus.textContent = `🔴 NETWORK-ERROR: Could not reach the server.`;
        deployStatus.style.color = 'var(--error)';
      }
    }
  });
}

if (gitUrlInput) {
  gitUrlInput.addEventListener('input', () => {
    gitUrlInput.classList.remove('invalid');
    if (deployStatus) deployStatus.textContent = '';
  });
}

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

function clearDeploymentUrlButton() {
  const existingButton = document.getElementById('deployment-url-button');
  if (existingButton) {
    existingButton.remove();
  }
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
  
  // Check if this is a deployment success message
  if (message.includes('🚀 SUCCESS!') && message.includes('localhost')) {
    // Extract URL from the message (now without port numbers)
    const urlMatch = message.match(/https?:\/\/[^\s]+\.localhost(?::\d+)?/);
    if (urlMatch) {
      const deployedUrl = urlMatch[0];
      showDeploymentUrlButton(deployedUrl);
    }
  }
  
  // Check if this is a deployment failure message
  if (message.includes('🔴 STATUS: Pipeline failed.') || message.includes('FATAL:')) {
    clearDeploymentUrlButton();
  }
}

function showDeploymentUrlButton(url) {
  // Remove any existing deployment URL button
  const existingButton = document.getElementById('deployment-url-button');
  if (existingButton) {
    existingButton.remove();
  }
  
  // Create the deployment URL button
  const buttonContainer = document.createElement('div');
  buttonContainer.id = 'deployment-url-button';
  buttonContainer.className = 'deployment-url-container fade-in';
  buttonContainer.style.cssText = `
    margin-top: 1rem;
    padding: 1rem;
    background: linear-gradient(135deg, var(--success), #28a745);
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
    border: 2px solid #28a745;
  `;
  
  buttonContainer.innerHTML = `
    <div style="margin-bottom: 0.5rem;">
      <span style="font-size: 1.2em; color: white;">🎉 Deployment Successful!</span>
    </div>
    <div style="margin-bottom: 1rem;">
      <span style="color: rgba(255,255,255,0.9); font-size: 0.9em;">Your application is now live at:</span>
    </div>
    <a href="${url}" target="_blank" class="btn btn-primary" style="
      background: white;
      color: var(--success);
      border: none;
      padding: 0.75rem 1.5rem;
      font-size: 1.1em;
      font-weight: 600;
      text-decoration: none;
      border-radius: 8px;
      display: inline-block;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    " onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
      🌐 Open Application
    </a>
    <div style="margin-top: 0.5rem;">
      <span style="color: rgba(255,255,255,0.8); font-size: 0.8em; font-family: monospace;">${url}</span>
    </div>
  `;
  
  // Insert the button after the status logs
  if (statusLogs && statusLogs.parentNode) {
    statusLogs.parentNode.insertBefore(buttonContainer, statusLogs.nextSibling);
  }
  
  // Animate the button
  setTimeout(() => buttonContainer.classList.add('animate'), 10);
  
  // Show a toast notification
  if (typeof showToast === 'function') showToast('🎉 Deployment completed successfully!', 'success');
}

// --- Deployment History ---
async function fetchAndDisplayHistory() {
  const historyTableBody = document.querySelector('#history-table tbody');
  if (!historyTableBody || !authToken) return;
  try {
    const response = await fetch('/deployments', {
      headers: getAuthHeaders()
    });
    
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      if (typeof showToast === 'function') showToast('Session expired. Please login again.', 'error');
      window.location.href = '/login';
      return;
    }
    
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
    if (typeof showToast === 'function') showToast('Could not fetch deployment history.', 'error');
  }
}

// --- Destroy Deployment Function ---
async function destroyDeployment(containerName) {
  if (!authToken) {
    if (typeof showToast === 'function') showToast('Please login to manage deployments', 'error');
    window.location.href = '/login';
    return;
  }
  
  if (!confirm(`Are you sure you want to destroy the deployment "${containerName}"? This will stop the container and remove all associated resources.`)) {
    return;
  }
  
  try {
    const response = await fetch(`/deployments/${containerName}`, { 
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      if (typeof showToast === 'function') showToast('Session expired. Please login again.', 'error');
      window.location.href = '/login';
      return;
    }
    
    const result = await response.json();
    
    if (response.ok) {
      if (typeof showToast === 'function') showToast(`✅ ${result.message}`, 'success');
      addUILog(`🗑️ Destroyed deployment: ${containerName}`);
      // Refresh the history table to show updated status
      fetchAndDisplayHistory();
    } else {
      if (typeof showToast === 'function') showToast(`🔴 ERROR: ${result.detail}`, 'error');
      addUILog(`🔴 Failed to destroy deployment: ${result.detail}`);
    }
  } catch (error) {
    if (typeof showToast === 'function') showToast(`🔴 NETWORK-ERROR: Could not destroy deployment.`, 'error');
    addUILog(`🔴 Network error while destroying deployment: ${error}`);
  }
}

// --- GitHub Repositories ---
let selectedRepo = null;

async function loadUserGitHubRepositories() {
    const reposList = document.getElementById('repositories-list');
    const reposLoading = document.getElementById('repos-loading');
    const reposError = document.getElementById('repos-error');
    const refreshBtn = document.getElementById('refreshReposBtn');
    
    // Show refresh button for authenticated users
    if (refreshBtn) refreshBtn.style.display = 'inline-block';
    
    // Show loading
    if (reposLoading) reposLoading.style.display = 'block';
    if (reposError) reposError.style.display = 'none';
    if (reposList) reposList.innerHTML = '';
    hideWelcomeMessage();
    
    try {
        const response = await fetch('/api/user/repositories', {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            localStorage.removeItem('username');
            if (typeof showToast === 'function') showToast('Session expired. Please login again.', 'error');
            window.location.href = '/login';
            return;
        }
        
        const data = await response.json();
        
        if (response.ok && data.repositories) {
            displayRepositories(data.repositories, `Your repositories (${data.username})`);
        } else {
            throw new Error(data.detail || 'Failed to load repositories');
        }
    } catch (error) {
        console.error('Failed to load repositories:', error);
        if (reposError) reposError.textContent = 'Failed to load repositories. Please try again.';
        if (reposError) reposError.style.display = 'block';
    } finally {
        if (reposLoading) reposLoading.style.display = 'none';
    }
}

async function searchPublicRepositories(username) {
    const reposList = document.getElementById('repositories-list');
    const reposLoading = document.getElementById('repos-loading');
    const reposError = document.getElementById('repos-error');
    const refreshBtn = document.getElementById('refreshReposBtn');
    
    if (!username.trim()) {
        if (typeof showToast === 'function') showToast('Please enter a GitHub username', 'error');
        return;
    }
    
    // Hide refresh button for public searches
    if (refreshBtn) refreshBtn.style.display = 'none';
    
    // Show loading
    if (reposLoading) reposLoading.style.display = 'block';
    if (reposError) reposError.style.display = 'none';
    if (reposList) reposList.innerHTML = '';
    hideWelcomeMessage();
    
    try {
        const response = await fetch(`/api/repositories/${username.trim()}`);
        const data = await response.json();
        
        if (response.ok && data.repositories) {
            displayRepositories(data.repositories, `${username}'s repositories`);
        } else {
            throw new Error(data.detail || 'Failed to load repositories');
        }
    } catch (error) {
        console.error('Failed to load repositories:', error);
        if (reposError) reposError.textContent = 'Failed to load repositories. Please check the username and try again.';
        if (reposError) reposError.style.display = 'block';
    } finally {
        if (reposLoading) reposLoading.style.display = 'none';
    }
}

function hideWelcomeMessage() {
    const welcomeMsg = document.getElementById('repos-welcome');
    if (welcomeMsg) welcomeMsg.style.display = 'none';
}

function showWelcomeMessage() {
    const welcomeMsg = document.getElementById('repos-welcome');
    const reposList = document.getElementById('repositories-list');
    if (welcomeMsg) {
        welcomeMsg.style.display = 'block';
        reposList.innerHTML = '';
    }
}

function displayRepositories(repositories, title = 'Repositories') {
    const reposList = document.getElementById('repositories-list');
    if (!reposList) return;
    
    if (repositories.length === 0) {
        reposList.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 2rem;">
                <p>No repositories found. Try a different username or check if the user has public repositories.</p>
            </div>
        `;
        return;
    }
    
    reposList.innerHTML = repositories.map(repo => `
        <div class="repo-card" data-repo-url="${repo.clone_url}" data-repo-name="${repo.full_name}">
            <div class="repo-header">
                <div>
                    <div class="repo-name">${repo.name}</div>
                    <div class="repo-full-name">${repo.full_name}</div>
                </div>
                <span class="repo-visibility ${repo.private ? 'private' : 'public'}">
                    ${repo.private ? '🔒 Private' : '🌐 Public'}
                </span>
            </div>
            <div class="repo-description">
                ${repo.description || 'No description available'}
            </div>
            <div class="repo-meta">
                <span class="repo-language">${repo.language || 'Unknown'}</span>
                <span class="repo-updated">Updated ${formatDate(repo.updated_at)}</span>
            </div>
        </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.repo-card').forEach(card => {
        card.addEventListener('click', () => selectRepository(card));
    });
}

function selectRepository(card) {
    // Remove previous selection
    document.querySelectorAll('.repo-card').forEach(c => c.classList.remove('selected'));
    
    // Select current card
    card.classList.add('selected');
    
    // Get repository URL and fill the deploy form
    const repoUrl = card.dataset.repoUrl;
    const repoName = card.dataset.repoName;
    
    if (gitUrlInput) {
      gitUrlInput.value = repoUrl;
    }
    selectedRepo = repoUrl;
    
    // Scroll to deploy section
    const deploySection = document.getElementById('deploy');
    if (deploySection) deploySection.scrollIntoView({ behavior: 'smooth' });
    
    if (typeof showToast === 'function') showToast(`Selected repository: ${repoName}`, 'success');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'today';
    if (diffDays === 2) return 'yesterday';
    if (diffDays < 7) return `${diffDays - 1} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

// Search repositories button
const searchReposBtn = document.getElementById('searchReposBtn');
if (searchReposBtn) {
  searchReposBtn.addEventListener('click', () => {
    const username = document.getElementById('usernameSearch')?.value;
    searchPublicRepositories(username);
  });
}

// Enter key in search input
const usernameSearch = document.getElementById('usernameSearch');
if (usernameSearch) {
  usernameSearch.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const username = e.target.value;
      searchPublicRepositories(username);
    }
  });
}

// Refresh repositories button (for GitHub users)
const refreshReposBtn = document.getElementById('refreshReposBtn');
if (refreshReposBtn) {
  refreshReposBtn.addEventListener('click', () => {
    if (authProvider === 'github') {
      loadUserGitHubRepositories();
      if (typeof showToast === 'function') showToast('Refreshing your repositories...', 'info');
    }
  });
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
    if (gitUrlInput) gitUrlInput.focus();
    if (typeof showToast === 'function') showToast('Paste your Git URL and hit Deploy!', 'info');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// --- CLEAR HISTORY BUTTON LOGIC ---
const clearBtn = document.getElementById('clearBtn');
async function handleClearHistory() {
  if (!authToken) {
    if (typeof showToast === 'function') showToast('Please login to clear history', 'error');
    window.location.href = '/login';
    return;
  }
  if (!confirm("Are you sure you want to delete ALL deployment history? This cannot be undone.")) {
    return;
  }
  try {
    const response = await fetch('/deployments/clear', { method: 'DELETE', headers: getAuthHeaders() });
    
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      if (typeof showToast === 'function') showToast('Session expired. Please login again.', 'error');
      window.location.href = '/login';
      return;
    }
    
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
// End of app.js