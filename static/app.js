// Authentication check and setup
let authToken = localStorage.getItem('access_token') || localStorage.getItem('authToken');
let username = localStorage.getItem('username');
let authProvider = localStorage.getItem('authProvider');

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    enforceDeployBarrier();
    enforceHistoryBarrier();
});
// Hide deploy form and show login barrier if not authenticated
function enforceDeployBarrier() {
  const deployForm = document.querySelector('.deploy-form');
  const deployLoginBarrier = document.getElementById('deploy-login-barrier');
  if (!authToken) {
    if (deployForm) deployForm.style.display = 'none';
    if (deployLoginBarrier) deployLoginBarrier.style.display = 'block';
  } else {
    if (deployForm) deployForm.style.display = '';
    if (deployLoginBarrier) deployLoginBarrier.style.display = 'none';
  }
}

// Hide history table and show login barrier if not authenticated
function enforceHistoryBarrier() {
  const historyTable = document.getElementById('history-table');
  const clearBtn = document.getElementById('clearBtn');
  const historyLoginBarrier = document.getElementById('history-login-barrier');
  if (!authToken) {
    if (historyTable) historyTable.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
    if (historyLoginBarrier) historyLoginBarrier.style.display = 'block';
  } else {
    if (historyTable) historyTable.style.display = '';
    if (clearBtn) clearBtn.style.display = '';
    if (historyLoginBarrier) historyLoginBarrier.style.display = 'none';
  }
}

function checkAuthStatus() {
    const userInfo = document.getElementById('userInfo');
    const loginLink = document.getElementById('loginLink');
    const usernameSpan = document.getElementById('username');
    if (authToken && username) {
        userInfo.style.display = 'inline';
        loginLink.style.display = 'none';
        const providerIcon = authProvider === 'github' ? '🐙' : '👤';
        usernameSpan.textContent = `${providerIcon} Welcome, ${username}!`;
        fetchAndDisplayHistory();
        if (authProvider === 'github') {
            loadUserGitHubRepositories();
        }
    } else {
        userInfo.style.display = 'none';
        loginLink.style.display = 'inline';
        // Show login barrier overlays
        enforceDeployBarrier();
        enforceHistoryBarrier();
        const currentPath = window.location.pathname;
        if (currentPath === '/' && !authToken) {
            showToast('Please login to access DevOps Butler features', 'info');
        }
    }
}

// Logout function
document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('authProvider');
    authToken = null;
    username = null;
    authProvider = null;
    checkAuthStatus();
    showToast('Logged out successfully', 'success');
    window.location.reload();
});

// Helper function to get authenticated headers
function getAuthHeaders() {
    const headers = {};
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

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
const deploySuccess = document.getElementById('deploy-success');
const openAppBtn = document.getElementById('openAppBtn');
const statusLogs = document.getElementById('status-logs');
let socket = null;

function showConfetti() {
  // Use canvas-confetti if available
  if (window.confetti) {
    window.confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
  } else {
    // fallback: add a class for CSS confetti if you have it
    const confettiDiv = document.getElementById('confetti-container');
    if (confettiDiv) {
      confettiDiv.classList.add('confetti-active');
      setTimeout(() => confettiDiv.classList.remove('confetti-active'), 3000);
    }
  }
}

function showDeploySuccess(url) {
  console.log('[DEBUG] showDeploySuccess called with url:', url);
  if (deploySuccess) {
    deploySuccess.style.display = 'block';
    if (openAppBtn) {
      openAppBtn.onclick = () => window.open(url, '_blank');
      console.log('[DEBUG] openAppBtn found and onclick set');
    } else {
      console.warn('[DEBUG] openAppBtn not found');
    }
    showConfetti();
  } else {
    console.warn('[DEBUG] deploySuccess not found');
  }
}


function hideDeploySuccess() {
  if (deploySuccess) deploySuccess.style.display = 'none';
  if (openAppBtn) openAppBtn.onclick = null;
}

function validateGitUrl(url) {
  // Accepts any https git repo (optionally supports SSH)
  const trimmed = url.trim();
  return /^https?:\/\/.+\/.+\/.+/.test(trimmed) || /^git@.+:.+\/.+\.git$/.test(trimmed);
}

deployForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideDeploySuccess();
  // Check authentication
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (!token) {
    showToast('Please login to deploy applications', 'error');
    window.location.href = '/login?redirect=/#deploy';
    return;
  }
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
      headers: getAuthHeaders(),
      body: data
    });
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      showToast('Session expired. Please login again.', 'error');
      window.location.href = '/login';
      return;
    }
    const result = await response.json();
    console.log('[DEBUG] /deploy response:', result);
    if (response.ok) {
      deployStatus.textContent = `✅ ${result.message}`;
      deployStatus.style.color = 'var(--success)';
      if (result.deployed_url) {
        showDeploySuccess(result.deployed_url);
      } else {
        console.warn('[DEBUG] No deployed_url in result');
      }
      // Show Dockerfile button if available
      if (result.dockerfile_path) {
        showGeneratedDockerfile(result.dockerfile_path);
      } else {
        console.warn('[DEBUG] No Dockerfile path in result');
      }
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
  hideDeploySuccess();
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
  if (!historyTableBody || !authToken) return;
  try {
    const response = await fetch('/deployments', {
      headers: getAuthHeaders()
    });
    
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      showToast('Session expired. Please login again.', 'error');
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
    showToast('Could not fetch deployment history.', 'error');
  }
}

// --- Destroy Deployment Function ---
async function destroyDeployment(containerName) {
  if (!authToken) {
    showToast('Please login to manage deployments', 'error');
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
      showToast('Session expired. Please login again.', 'error');
      window.location.href = '/login';
      return;
    }
    
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

// --- GitHub Repositories ---
let selectedRepo = null;

async function loadUserGitHubRepositories() {
    const reposList = document.getElementById('repositories-list');
    const reposLoading = document.getElementById('repos-loading');
    const reposError = document.getElementById('repos-error');
    const refreshBtn = document.getElementById('refreshReposBtn');
    
    if (!authToken) return;
    
    // Show refresh button for GitHub users
    if (refreshBtn) refreshBtn.style.display = 'inline';
    
    // Show loading
    reposLoading.style.display = 'block';
    reposError.style.display = 'none';
    reposList.innerHTML = '';
    hideWelcomeMessage();
    
    try {
        const response = await fetch('/api/user/repositories', {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            localStorage.removeItem('username');
            localStorage.removeItem('authProvider');
            showToast('Session expired. Please login again.', 'error');
            window.location.href = '/login';
            return;
        }
        
        const data = await response.json();
        
        if (response.ok && data.repositories) {
            displayRepositories(data.repositories, 'Your repositories');
        } else {
            throw new Error(data.detail || 'Failed to load repositories');
        }
    } catch (error) {
        console.error('Failed to load repositories:', error);
        reposError.textContent = 'Failed to load repositories. Please try again.';
        reposError.style.display = 'block';
    } finally {
        reposLoading.style.display = 'none';
    }
}

async function searchPublicRepositories(username) {
    const reposList = document.getElementById('repositories-list');
    const reposLoading = document.getElementById('repos-loading');
    const reposError = document.getElementById('repos-error');
    const refreshBtn = document.getElementById('refreshReposBtn');
    
    if (!username.trim()) {
        showToast('Please enter a GitHub username', 'error');
        return;
    }
    
    // Convert username to lowercase for consistency
    username = username.trim().toLowerCase();
    
    // Hide refresh button for public searches
    if (refreshBtn) refreshBtn.style.display = 'none';
    
    // Show loading
    reposLoading.style.display = 'block';
    reposError.style.display = 'none';
    reposList.innerHTML = '';
    hideWelcomeMessage();
    
    try {
        const response = await fetch(`/api/repositories/${username}`);
        const data = await response.json();
        
        if (response.ok && data.repositories) {
            displayRepositories(data.repositories, `${data.username}'s repositories`);
        } else {
            throw new Error(data.detail || 'Failed to load repositories');
        }
    } catch (error) {
        console.error('Failed to load repositories:', error);
        let errorMessage = 'Failed to load repositories.';
        
        if (error.message.includes('not found')) {
            errorMessage = `GitHub user '${username}' not found. Please check the username and try again.`;
        } else if (error.message.includes('rate limit')) {
            errorMessage = 'GitHub API rate limit exceeded. Please try again later.';
        } else if (error.message.includes('network') || error.message.includes('timeout')) {
            errorMessage = 'Network error. Please check your connection and try again.';
        }
        
        reposError.textContent = errorMessage;
        reposError.style.display = 'block';
        
        // Show helpful suggestion for demo
        if (username !== 'demo_user' && !error.message.includes('rate limit')) {
            setTimeout(() => {
                showToast('💡 Try searching for "facebook", "vercel", or "demo_user" to see sample repositories', 'info');
            }, 2000);
        }
    } finally {
        reposLoading.style.display = 'none';
    }
}

async function loadDemoRepositories() {
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
            <div class="repo-actions">
                <button class="btn btn-primary btn-sm" onclick="viewRepositoryTree('${repo.owner.login}', '${repo.name}')">
                    📁 Browse Files
                </button>
                <button class="btn btn-secondary btn-sm" onclick="selectRepository(this.closest('.repo-card'))">
                    🚀 Deploy
                </button>
            </div>
        </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.repo-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (!e.target.classList.contains('btn')) {
                selectRepository(card);
            }
        });
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
    
    document.getElementById('git-url').value = repoUrl;
    selectedRepo = repoUrl;
    
    // Scroll to deploy section
    document.getElementById('deploy').scrollIntoView({ behavior: 'smooth' });
    
    showToast(`Selected repository: ${repoName}`, 'success');
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

// Repository Tree Navigation
function viewRepositoryTree(owner, repo) {
    // Navigate to repository tree view (no authentication required for public repos)
    window.location.href = `/repository-tree?owner=${owner}&repo=${repo}`;
}

// Search repositories button
document.getElementById('searchReposBtn')?.addEventListener('click', () => {
    const username = document.getElementById('usernameSearch').value;
    searchPublicRepositories(username);
});

// Enter key in search input
document.getElementById('usernameSearch')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const username = e.target.value;
        searchPublicRepositories(username);
    }
});


// Refresh repositories button (for GitHub users)
document.getElementById('refreshReposBtn')?.addEventListener('click', () => {
    if (authProvider === 'github') {
        loadUserGitHubRepositories();
        showToast('Refreshing your repositories...', 'info');
    }
});

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
  if (!authToken) {
    showToast('Please login to clear history', 'error');
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
      showToast('Session expired. Please login again.', 'error');
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

// --- Generated Dockerfile Logic ---
function showGeneratedDockerfile(dockerfilePath) {
  const dockerfileButton = document.getElementById('dockerfileBtn');
  if (dockerfileButton) {
    dockerfileButton.style.display = 'block';
    dockerfileButton.onclick = () => window.open(dockerfilePath, '_blank');
    console.log('[DEBUG] Dockerfile button set to open:', dockerfilePath);
  } else {
    console.warn('[DEBUG] Dockerfile button not found');
  }
}

// --- Applications Dashboard Logic ---
document.addEventListener('DOMContentLoaded', function() {
    // Initialize applications dashboard
    initializeApplicationsDashboard();
});

function initializeApplicationsDashboard() {
    const refreshBtn = document.getElementById('refreshApplicationsBtn');
    const deployNewBtn = document.getElementById('deployNewBtn');
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadApplications);
    }
    
    if (deployNewBtn) {
        deployNewBtn.addEventListener('click', () => {
            // Scroll to deploy section
            document.getElementById('deploy').scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // Load applications on page load
    loadApplications();
    
    // Auto-refresh every 30 seconds
    setInterval(loadApplications, 30000);
}

async function loadApplications() {
    const container = document.getElementById('applications-content');
    if (!container) return;
    
    // Show loading state
    container.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Loading applications...</p>
        </div>
    `;
    
    try {
        const response = await fetch('/deployments', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const deployments = await response.json();
            renderApplications(deployments);
        } else if (response.status === 401) {
            // Not authenticated, show login message
            container.innerHTML = `
                <div class="deploy-new-area">
                    <div class="deploy-new-title">Please log in to view your applications</div>
                    <div class="deploy-new-description">You need to be logged in to see your deployed applications.</div>
                    <div class="deploy-new-description"><a href="/login" class="browse-link">Login here</a> to get started.</div>
                </div>
            `;
        } else {
            throw new Error('Failed to load applications');
        }
    } catch (error) {
        console.error('Error loading applications:', error);
        container.innerHTML = `
            <div class="deploy-new-area">
                <div class="deploy-new-title">Error loading applications</div>
                <div class="deploy-new-description">There was an error loading your applications. Please try refreshing the page.</div>
            </div>
        `;
    }
}

function renderApplications(deployments) {
    const container = document.getElementById('applications-content');
    if (!container) return;
    
    if (!deployments || deployments.length === 0) {
        container.innerHTML = `
            <div class="deploy-new-area">
                <div class="deploy-new-title">No projects deployed yet</div>
                <div class="deploy-new-description">You haven't deployed any applications yet. Use the deploy form above to deploy your first application and see it appear here.</div>
            </div>
        `;
        return;
    }
    
    const projectsGrid = document.createElement('div');
    projectsGrid.className = 'projects-grid';
    
    deployments.forEach(deployment => {
        const projectCard = createProjectCard(deployment);
        projectsGrid.appendChild(projectCard);
    });
    
    container.innerHTML = '';
    container.appendChild(projectsGrid);
}

function createProjectCard(deployment) {
    const card = document.createElement('div');
    card.className = 'project-card';
    
    // Check for various success statuses
    const isRunning = deployment.status === 'deployed' || deployment.status === 'success';
    const statusClass = isRunning ? 'status-running' : 'status-stopped';
    const statusText = isRunning ? 'Running' : 'Stopped';
    const statusIcon = getStatusIcon(deployment.status);
    
    // Generate project thumbnail based on project type
    const thumbnailIcon = getProjectThumbnail(deployment.git_url);
    
    // Extract project name from git URL
    const projectName = getProjectName(deployment.git_url);
    
    const cardContent = `
        <div class="project-thumbnail">
            ${thumbnailIcon}
        </div>
        <div class="project-info">
            <div class="project-name">${projectName}</div>
            <div class="project-description">Manual deploys</div>
            <div class="project-meta">Owned by ${username || 'User'}'s team</div>
            <div class="project-meta">Published on ${formatDate(deployment.created_at)}</div>
        </div>
        <div class="project-actions">
            <span class="project-status ${statusClass}">${statusText}</span>
            <button class="project-menu" onclick="showProjectMenu('${deployment.container_name}')">⋮</button>
        </div>
    `;
    
    card.innerHTML = cardContent;
    
    // Add click handler to open the project
    card.addEventListener('click', (e) => {
        if (!e.target.closest('.project-menu')) {
            if (isRunning && deployment.deployed_url) {
                window.open(deployment.deployed_url, '_blank');
            } else {
                showProjectDetails(deployment);
            }
        }
    });
    
    return card;
}

function getProjectThumbnail(gitUrl) {
    // Determine project type based on git URL or other indicators
    if (gitUrl.includes('react') || gitUrl.includes('nextjs')) {
        return '⚛️';
    } else if (gitUrl.includes('vue')) {
        return '💚';
    } else if (gitUrl.includes('angular')) {
        return '🅰️';
    } else if (gitUrl.includes('django') || gitUrl.includes('flask')) {
        return '🐍';
    } else if (gitUrl.includes('node') || gitUrl.includes('express')) {
        return '🟢';
    } else {
        return '📄';
    }
}

function getProjectName(gitUrl) {
    try {
        const url = new URL(gitUrl);
        const pathParts = url.pathname.split('/');
        const repoName = pathParts[pathParts.length - 1].replace('.git', '');
        return repoName || 'Unknown Project';
    } catch {
        return 'Unknown Project';
    }
}

function getStatusIcon(status) {
    const iconMap = {
        'success': '✅',
        'deployed': '✅',
        'building': '🔄',
        'failed': '❌',
        'stopped': '⏹️'
    };
    return iconMap[status] || '❓';
}

function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return 'Unknown date';
    }
}

function showProjectMenu(containerName) {
    // Create a simple context menu
    const menu = document.createElement('div');
    menu.style.cssText = `
        position: fixed;
        background: var(--card-bg);
        backdrop-filter: var(--glass-blur);
        border: 1px solid var(--border-color);
        border-radius: 6px;
        box-shadow: var(--shadow-lg);
        padding: 8px 0;
        z-index: 1000;
        min-width: 150px;
    `;
    
    const menuItems = [
        { text: 'View Site', action: () => console.log('View site:', containerName) },
        { text: 'View Logs', action: () => console.log('View logs:', containerName) },
        { text: 'Redeploy', action: () => console.log('Redeploy:', containerName) },
        { text: 'Destroy', action: () => console.log('Destroy:', containerName) }
    ];
    
    menuItems.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.style.cssText = `
            padding: 8px 16px;
            color: var(--text);
            cursor: pointer;
            font-size: 0.9rem;
            transition: background-color 0.2s;
        `;
        menuItem.textContent = item.text;
        menuItem.addEventListener('mouseenter', () => {
            menuItem.style.backgroundColor = 'var(--bg-secondary)';
        });
        menuItem.addEventListener('mouseleave', () => {
            menuItem.style.backgroundColor = 'transparent';
        });
        menuItem.addEventListener('click', () => {
            item.action();
            document.body.removeChild(menu);
        });
        menu.appendChild(menuItem);
    });
    
    // Position menu near cursor
    menu.style.left = '50%';
    menu.style.top = '50%';
    menu.style.transform = 'translate(-50%, -50%)';
    
    document.body.appendChild(menu);
    
    // Remove menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', () => {
            if (document.body.contains(menu)) {
                document.body.removeChild(menu);
            }
        }, { once: true });
    }, 100);
}

function showProjectDetails(deployment) {
    // Simple project details modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: var(--card-bg);
        backdrop-filter: var(--glass-blur);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        color: var(--text);
    `;
    
    modalContent.innerHTML = `
        <h3 style="margin-bottom: 1rem;">Project Details</h3>
        <p><strong>Name:</strong> ${getProjectName(deployment.git_url)}</p>
        <p><strong>Status:</strong> ${deployment.status}</p>
        <p><strong>Repository:</strong> ${deployment.git_url}</p>
        <p><strong>Container:</strong> ${deployment.container_name}</p>
        <p><strong>Created:</strong> ${formatDate(deployment.created_at)}</p>
        ${deployment.deployed_url ? `<p><strong>URL:</strong> <a href="${deployment.deployed_url}" target="_blank" style="color: var(--accent);">${deployment.deployed_url}</a></p>` : ''}
        <button onclick="this.closest('.modal').remove()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--primary); color: white; border: none; border-radius: 6px; cursor: pointer;">Close</button>
    `;
    
    modal.className = 'modal';
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}
