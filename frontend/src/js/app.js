// Router for client-side navigation
class Router {
  constructor() {
    this.routes = {
      '/': 'dashboard',
      '/deploy': 'deploy',
      '/applications': 'applications',
      '/history': 'history',
      '/repositories': 'repositories',
      '/env-vars': 'env-vars',
      '/settings': 'settings'
    };
    this.currentPage = null;
    this.init();
  }

  init() {
    // Handle navigation clicks
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const href = item.getAttribute('href');
        this.navigate(href);
      });
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      this.loadPage(window.location.pathname);
    });

    // Initial page load
    this.loadPage(window.location.pathname);
  }

  navigate(path) {
    window.history.pushState({}, '', path);
    this.loadPage(path);
  }

  loadPage(path) {
    const pageId = this.routes[path] || 'dashboard';
    this.showPage(pageId);
    this.updateActiveNav(path);
    this.updatePageTitle(pageId);
    
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.style.display = 'none';
    });

    // Show target page
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
      targetPage.style.display = 'block';
  } else {
      // Fallback: show dashboard if page not found
      const dashboard = document.getElementById('page-dashboard');
      if (dashboard) dashboard.style.display = 'block';
    }

    this.currentPage = pageId;

    // Load page-specific data
    this.loadPageData(pageId);
  }

  updateActiveNav(path) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('href') === path) {
        item.classList.add('active');
      }
    });
  }

  updatePageTitle(pageId) {
    const titles = {
      dashboard: 'Dashboard',
      deploy: 'Deploy',
      applications: 'Applications',
      history: 'History',
      repositories: 'Repositories',
      'env-vars': 'Environmental Variables',
      settings: 'Settings'
    };
    document.getElementById('pageTitle').textContent = titles[pageId] || 'Dashboard';
  }

  loadPageData(pageId) {
    switch(pageId) {
      case 'dashboard':
        loadDashboard();
        break;
      case 'applications':
        loadApplications();
        break;
      case 'history':
        loadHistory();
        break;
      case 'repositories':
        loadRepositories();
        break;
      case 'env-vars':
        loadEnvVars();
        break;
      case 'settings':
        loadSettings();
        break;
    }
  }
}

// Initialize router
const router = new Router();
window.router = router; // Make router globally accessible

// Auth state
let authToken = localStorage.getItem('access_token') || localStorage.getItem('authToken');
let username = localStorage.getItem('username');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
  setupEventListeners();
  
  // Show dashboard by default
  const dashboardPage = document.getElementById('page-dashboard');
  if (dashboardPage && window.location.pathname === '/') {
    dashboardPage.style.display = 'block';
  }
});

function checkAuthStatus() {
  const userSection = document.getElementById('userSection');
  const authButtons = document.getElementById('authButtons');
  const logoutBtn = document.getElementById('logoutBtn');
  const newDeployBtn = document.getElementById('newDeployBtn');
  const userName = document.getElementById('userName');
  const userEmail = document.getElementById('userEmail');
  const userAvatar = document.getElementById('userAvatar');

    if (authToken && username) {
    // User is logged in
    userSection.style.display = 'flex';
    authButtons.style.display = 'none';
    logoutBtn.style.display = 'block';
    newDeployBtn.style.display = 'block';
    
    // Load user profile data to show display name
    loadUserProfile();
    
    // Load user data
    loadDashboard();
    } else {
    // User is not logged in
    userSection.style.display = 'none';
    authButtons.style.display = 'block';
    logoutBtn.style.display = 'none';
    newDeployBtn.style.display = 'none';
  }
}

function setupEventListeners() {
  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    authToken = null;
    username = null;
    checkAuthStatus();
    showToast('Logged out successfully', 'success');
    router.navigate('/');
  });

  // New Deploy button
  document.getElementById('newDeployBtn').addEventListener('click', () => {
    router.navigate('/deploy');
  });

  // Deploy form
  const deployForm = document.getElementById('deployForm');
  if (deployForm) {
    deployForm.addEventListener('submit', handleDeploy);
  }
  
  // Deploy type toggle
  const deployType = document.getElementById('deploy-type');
  if (deployType) {
    deployType.addEventListener('change', (e) => {
      const singleGroup = document.getElementById('single-repo-group');
      const splitGroup = document.getElementById('split-repo-group');
      const gitUrlInput = document.getElementById('git-url');
      
      if (e.target.value === 'split') {
        singleGroup.style.display = 'none';
        splitGroup.style.display = 'block';
        if (gitUrlInput) gitUrlInput.removeAttribute('required');
      } else {
        singleGroup.style.display = 'block';
        splitGroup.style.display = 'none';
        if (gitUrlInput) gitUrlInput.setAttribute('required', 'required');
      }
    });
  }

  // Refresh buttons
  document.getElementById('refreshAppsBtn')?.addEventListener('click', loadApplications);
  document.getElementById('clearHistoryBtn')?.addEventListener('click', clearHistory);
  document.getElementById('searchReposBtn')?.addEventListener('click', searchRepositories);
}

function getAuthHeaders() {
    const headers = {};
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// Dashboard functions
async function loadDashboard() {
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (!token) {
    // User not logged in, don't try to load data
    document.getElementById('totalDeployments').textContent = '0';
    document.getElementById('runningApps').textContent = '0';
    const recentActivity = document.getElementById('recentActivity');
    if (recentActivity) {
      recentActivity.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 1rem 0;">No recent activity</p>';
    }
    return;
  }

  try {
    const response = await fetch('/deployments', {
      headers: getAuthHeaders()
    });

    if (response.ok) {
      const deployments = await response.json();
      document.getElementById('totalDeployments').textContent = deployments.length;
      document.getElementById('runningApps').textContent = 
        deployments.filter(d => d.status === 'success').length;
      
      // Recent activity
      const recentActivity = document.getElementById('recentActivity');
      if (deployments.length > 0) {
        recentActivity.innerHTML = deployments.slice(0, 5).map(dep => `
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${dep.container_name}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(dep.created_at).toLocaleString()}
            </div>
          </div>
        `).join('');
  } else {
        recentActivity.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 1rem 0;">No recent activity</p>';
      }
    }
  } catch (error) {
    console.error('Error loading dashboard:', error);
  }
}

// Deploy functions
async function handleDeploy(e) {
  e.preventDefault();
  
  if (!authToken) {
    showToast('Please login to deploy applications', 'error');
    window.location.href = '/login';
    return;
  }

  const form = e.target;
  const deployType = document.getElementById('deploy-type')?.value || 'single';
  const gitUrl = document.getElementById('git-url')?.value.trim();
  const frontendUrl = document.getElementById('frontend-url')?.value.trim();
  const backendUrl = document.getElementById('backend-url')?.value.trim();
  const deployStatus = document.getElementById('deploy-status');
  const deploySuccess = document.getElementById('deploy-success');

  // Reset UI
  deploySuccess.style.display = 'none';
  deployStatus.textContent = '';

  // Validate URLs based on deployment type
  if (deployType === 'split') {
    if (!frontendUrl || !frontendUrl.startsWith('http') || !backendUrl || !backendUrl.startsWith('http')) {
      deployStatus.textContent = 'Please enter valid Frontend and Backend repository URLs';
    deployStatus.style.color = 'var(--error)';
    return;
    }
  } else {
    if (!gitUrl || !gitUrl.startsWith('http')) {
      deployStatus.textContent = 'Please enter a valid Git repository URL';
      deployStatus.style.color = 'var(--error)';
      return;
    }
  }

  deployStatus.textContent = '🚀 Deploying...';
  deployStatus.style.color = 'var(--primary)';

  try {
    const formData = new FormData();
    if (deployType === 'split') {
      formData.append('deploy_type', 'split');
      formData.append('frontend_url', frontendUrl);
      formData.append('backend_url', backendUrl);
    } else {
      formData.append('deploy_type', 'single');
      formData.append('git_url', gitUrl);
    }
    
    const response = await fetch('/deploy', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      deployStatus.textContent = '✅ Deployment successful!';
      deployStatus.style.color = 'var(--success)';
      
      if (result.deployed_url) {
        deploySuccess.style.display = 'block';
        document.getElementById('openAppBtn').href = result.deployed_url;
        document.getElementById('openAppBtn').textContent = `Open ${result.deployed_url}`;
      }
      
      // Clear form
      form.reset();
      
      // Refresh dashboard
      setTimeout(() => {
        loadDashboard();
        router.navigate('/applications');
      }, 2000);
      } else {
      deployStatus.textContent = `❌ Error: ${result.detail || 'Deployment failed'}`;
      deployStatus.style.color = 'var(--error)';
    }
  } catch (error) {
    deployStatus.textContent = '❌ Network error. Please try again.';
    deployStatus.style.color = 'var(--error)';
  }
}

// Applications functions
async function loadApplications() {
  if (!authToken) {
    document.getElementById('applicationsGrid').innerHTML = `
      <div class="empty-state">
        <p>Please login to view your applications</p>
        <a href="/login" class="btn-primary">Login</a>
      </div>
    `;
    return;
  }

  try {
    const response = await fetch('/deployments', {
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
    const deployments = await response.json();
      const grid = document.getElementById('applicationsGrid');

    if (deployments.length === 0) {
        grid.innerHTML = `
          <div class="empty-state">
            <p>No applications deployed yet</p>
            <a href="/deploy" class="btn-primary">Deploy Your First App</a>
          </div>
        `;
      } else {
        grid.innerHTML = deployments.map(dep => `
          <div class="application-card" onclick="window.open('${dep.deployed_url || '#'}', '_blank')">
            <h3>${dep.container_name}</h3>
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">
              ${dep.git_url}
            </p>
            <div style="margin-top: 1rem;">
              <span class="status-badge ${dep.status}">
                ${dep.status === 'success' ? '✅' : dep.status === 'failed' ? '❌' : '🔄'} 
                ${dep.status}
              </span>
            </div>
            ${dep.deployed_url ? `
              <div style="margin-top: 1rem;">
                <a href="${dep.deployed_url}" target="_blank" class="btn-primary" style="width: 100%;">
                  Open Application
                </a>
              </div>
            ` : ''}
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Error loading applications:', error);
  }
}

// History functions
async function loadHistory() {
  if (!authToken) {
    document.getElementById('historyTableBody').innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">Please login to view deployment history</td>
      </tr>
    `;
      return;
    }
    
  try {
    const response = await fetch('/deployments', {
      headers: getAuthHeaders()
    });

    if (response.ok) {
    const deployments = await response.json();
      const tbody = document.getElementById('historyTableBody');

    if (deployments.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="empty-state">No deployment history</td>
          </tr>
        `;
      } else {
        tbody.innerHTML = deployments.map(dep => `
          <tr>
            <td><strong>${dep.container_name}</strong></td>
            <td>
              <span class="status-badge ${dep.status}">
                ${dep.status === 'success' ? '✅' : dep.status === 'failed' ? '❌' : '🔄'} 
                ${dep.status}
              </span>
            </td>
            <td>
              ${dep.deployed_url ? 
                `<a href="${dep.deployed_url}" target="_blank">${dep.deployed_url}</a>` : 
                'N/A'
              }
            </td>
            <td>${new Date(dep.created_at).toLocaleString()}</td>
            <td>
              ${dep.status === 'success' ? 
                `<button class="btn-secondary" onclick="destroyDeployment('${dep.container_name}')">Destroy</button>` : 
                '-'
              }
            </td>
          </tr>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Error loading history:', error);
  }
}

async function clearHistory() {
  if (!confirm('Are you sure you want to clear all deployment history?')) {
    return;
  }
  
  try {
    const response = await fetch('/deployments/clear', {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      showToast('History cleared successfully', 'success');
      loadHistory();
    }
  } catch (error) {
    showToast('Error clearing history', 'error');
  }
}

async function destroyDeployment(containerName) {
  if (!confirm(`Are you sure you want to destroy "${containerName}"?`)) {
    return;
  }
  
  try {
    const response = await fetch(`/deployments/${containerName}`, { 
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (response.ok) {
      showToast('Deployment destroyed successfully', 'success');
      loadHistory();
      loadApplications();
    } else {
      showToast('Error destroying deployment', 'error');
    }
  } catch (error) {
    showToast('Network error', 'error');
  }
}

// Repositories functions
async function searchRepositories() {
  const username = document.getElementById('usernameSearch').value.trim();
  
  if (!username) {
        showToast('Please enter a GitHub username', 'error');
            return;
        }
        
  const grid = document.getElementById('repositoriesGrid');
  grid.innerHTML = '<div class="empty-state"><p>Loading repositories...</p></div>';
    
    try {
        const response = await fetch(`/api/repositories/${username}`);
        const data = await response.json();
        
        if (response.ok && data.repositories) {
      if (data.repositories.length === 0) {
        grid.innerHTML = '<div class="empty-state"><p>No repositories found</p></div>';
        } else {
        grid.innerHTML = data.repositories.map(repo => `
          <div class="repository-card" onclick="selectRepository('${repo.clone_url}')">
            <h3>${repo.name}</h3>
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">
              ${repo.description || 'No description'}
            </p>
            <div style="margin-top: 1rem;">
              <span style="font-size: 0.875rem; color: var(--text-secondary);">
                ${repo.language || 'Unknown'} • ${repo.stargazers_count || 0} stars
                </span>
            </div>
        </div>
    `).join('');
      }
    } else {
      grid.innerHTML = `<div class="empty-state"><p>${data.detail || 'Error loading repositories'}</p></div>`;
        }
    } catch (error) {
    grid.innerHTML = '<div class="empty-state"><p>Error loading repositories</p></div>';
  }
}

function selectRepository(repoUrl) {
  document.getElementById('git-url').value = repoUrl;
  router.navigate('/deploy');
  showToast('Repository selected', 'success');
}

function loadRepositories() {
  // Just show empty state for now
  document.getElementById('repositoriesGrid').innerHTML = `
    <div class="empty-state">
      <p>Search for a GitHub username to see their repositories</p>
            </div>
        `;
    }

// Toast notification
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  
    setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// Environment Variables Management
let envVars = {};
let envVarsList = [];

async function loadEnvVars() {
  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (!token) {
      // Not logged in, show empty state
      const container = document.getElementById('envVarsList');
      if (container) {
        container.innerHTML = `
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `;
      }
      setupEnvVarsListeners();
      return;
    }
    
    const response = await fetch('/api/env-vars', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      envVars = data.variables || {};
      envVarsList = data.vars_list || [];
      renderEnvVars();
    } else if (response.status === 401) {
      // Not authenticated
      localStorage.removeItem('access_token');
      localStorage.removeItem('authToken');
      checkAuthStatus();
      const container = document.getElementById('envVarsList');
      if (container) {
        container.innerHTML = `
          <div class="empty-state">
            <p>Please log in to manage environment variables</p>
            <a href="/login" class="btn-primary">Login</a>
          </div>
        `;
      }
        } else {
      console.error('Failed to load environment variables');
        }
    } catch (error) {
    console.error('Error loading environment variables:', error);
  }
  
  // Setup event listeners for env vars page
  setupEnvVarsListeners();
}

function setupEnvVarsListeners() {
  const importBtn = document.getElementById('importEnvBtn');
  const addBtn = document.getElementById('addEnvVarBtn');
  const importCard = document.getElementById('importEnvCard');
  const cancelImportBtn = document.getElementById('cancelImportBtn');
  const importForm = document.getElementById('importEnvForm');
  
  if (importBtn) {
    importBtn.onclick = () => {
      importCard.style.display = importCard.style.display === 'none' ? 'block' : 'none';
    };
  }
  
  if (cancelImportBtn) {
    cancelImportBtn.onclick = () => {
      importCard.style.display = 'none';
      document.getElementById('envFileInput').value = '';
    };
  }
  
  if (addBtn) {
    addBtn.onclick = () => {
      addEnvVarRow();
    };
  }
  
  if (importForm) {
    importForm.onsubmit = async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById('envFileInput');
      const file = fileInput.files[0];
      if (file) {
        await importEnvFile(file);
      }
    };
  }
}

async function importEnvFile(file) {
  try {
    const text = await file.text();
    const lines = text.split('\n');
    const imported = {};
    
    lines.forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        if (key.trim()) {
          imported[key.trim()] = value;
        }
      }
    });
    
    // Merge with existing
    envVars = { ...envVars, ...imported };
    await saveEnvVars();
    document.getElementById('importEnvCard').style.display = 'none';
    document.getElementById('envFileInput').value = '';
    showToast('Environment variables imported successfully!', 'success');
    } catch (error) {
    console.error('Error importing .env file:', error);
    showToast('Failed to import .env file', 'error');
  }
}

function renderEnvVars() {
  const container = document.getElementById('envVarsList');
  if (!container) return;
  
  if (envVarsList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>No environment variables configured</p>
        <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.5rem;">
          Click "Add Variable" to create one, or import from a .env file
        </p>
            </div>
        `;
        return;
    }
    
  // GitHub Secrets-style table
  container.innerHTML = `
    <table class="env-vars-table">
      <thead>
        <tr>
          <th class="name-col">Name</th>
          <th class="updated-col">Last updated</th>
          <th class="actions-col"></th>
        </tr>
      </thead>
      <tbody>
        ${envVarsList.map((item, index) => {
          const lastUpdated = item.updated_at 
            ? formatRelativeTime(new Date(item.updated_at))
            : 'never';
          return `
            <tr>
              <td class="name-col">
                <span class="lock-icon">🔒</span>
                <span class="var-name">${escapeHtml(item.key)}</span>
              </td>
              <td class="updated-col">
                <span class="updated-time">${lastUpdated}</span>
              </td>
              <td class="actions-col">
                <button class="icon-btn edit-btn" onclick="editEnvVarModal('${escapeHtml(item.key)}')" title="Edit">
                  ✏️
                </button>
                <button class="icon-btn delete-btn" onclick="deleteEnvVar('${escapeHtml(item.key)}')" title="Delete">
                  🗑️
                </button>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

function addEnvVarRow() {
  showEnvVarModal();
}

function showEnvVarModal(key = null, value = '') {
  const modal = document.getElementById('envVarModal');
  const modalKey = document.getElementById('modalVarKey');
  const modalValue = document.getElementById('modalVarValue');
  const modalTitle = document.getElementById('modalTitle');
  
  if (key) {
    modalTitle.textContent = 'Update environment variable';
    modalKey.value = key;
    modalKey.readOnly = true;
    modalValue.value = value;
  } else {
    modalTitle.textContent = 'Add environment variable';
    modalKey.value = '';
    modalKey.readOnly = false;
    modalValue.value = '';
  }
  
  modal.style.display = 'flex';
}

function closeEnvVarModal() {
  const modal = document.getElementById('envVarModal');
  modal.style.display = 'none';
}

async function saveEnvVarFromModal() {
  const modalKey = document.getElementById('modalVarKey');
  const modalValue = document.getElementById('modalVarValue');
  
  const key = modalKey.value.trim();
  const value = modalValue.value.trim();
  
  if (!key) {
    showToast('Variable name is required', 'error');
    return;
  }
  
  envVars[key] = value;
  await saveEnvVars();
  closeEnvVarModal();
}

function editEnvVarModal(key) {
  const currentValue = envVars[key] || '';
  showEnvVarModal(key, currentValue);
}

async function editEnvVar(key) {
  editEnvVarModal(key);
}

async function deleteEnvVar(key) {
  if (confirm(`Are you sure you want to delete ${key}?`)) {
    delete envVars[key];
    await saveEnvVars();
    showToast('Environment variable deleted', 'success');
  }
}

function toggleEnvVarVisibility(index) {
  const rows = document.querySelectorAll('.env-var-row');
  const row = rows[index];
  if (!row) return;
  
  const input = row.querySelector('.env-var-value input');
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

async function saveEnvVars() {
  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    const response = await fetch('/api/env-vars', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ variables: envVars })
    });
    
    if (response.ok) {
      // Reload to get updated timestamps
      await loadEnvVars();
      showToast('Environment variables saved successfully', 'success');
    } else {
      console.error('Failed to save environment variables');
      showToast('Failed to save environment variables', 'error');
    }
  } catch (error) {
    console.error('Error saving environment variables:', error);
    showToast('Error saving environment variables', 'error');
  }
}

function toggleModalValueVisibility() {
  const input = document.getElementById('modalVarValue');
  const btn = document.querySelector('#envVarModal button[onclick*="toggleModalValueVisibility"]');
  if (input && btn) {
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '🙈 Hide';
  } else {
      input.type = 'password';
      btn.textContent = '👁️ Show';
    }
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load user profile for sidebar display
async function loadUserProfile() {
  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (!token) return;
    
    const response = await fetch('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const userName = document.getElementById('userName');
      const userEmail = document.getElementById('userEmail');
      const userAvatar = document.getElementById('userAvatar');
      
      // Show display name if available, otherwise username
      if (userName) {
        userName.textContent = data.display_name || data.username || 'User';
      }
      if (userEmail) {
        userEmail.textContent = data.email || 'Logged in';
      }
      if (userAvatar) {
        if (data.avatar_url) {
          userAvatar.style.backgroundImage = `url(${data.avatar_url})`;
          userAvatar.style.backgroundSize = 'cover';
          userAvatar.style.backgroundPosition = 'center';
          userAvatar.textContent = '';
  } else {
          userAvatar.style.backgroundImage = '';
          userAvatar.textContent = (data.display_name || data.username || 'U').charAt(0).toUpperCase();
        }
      }
    } else if (response.status === 401) {
      // Token expired or invalid, clear auth
      localStorage.removeItem('access_token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('username');
      checkAuthStatus();
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
}

// Settings/Profile Management
async function loadSettings() {
  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    const response = await fetch('/api/user/profile', {
            headers: {
        'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
      const data = await response.json();
      // Populate form fields
      document.getElementById('username').value = data.username || '';
      document.getElementById('email').value = data.email || '';
      document.getElementById('displayName').value = data.display_name || '';
      
      // Load avatar
      if (data.avatar_url) {
        document.getElementById('avatarPreview').src = data.avatar_url;
        document.getElementById('avatarPreview').style.display = 'block';
        document.getElementById('avatarPlaceholder').style.display = 'none';
        document.getElementById('removeAvatarBtn').style.display = 'block';
      }
        }
    } catch (error) {
    console.error('Error loading profile:', error);
  }
  
  setupSettingsListeners();
}

function setupSettingsListeners() {
  const profileForm = document.getElementById('profileForm');
  const avatarFile = document.getElementById('avatarFile');
  const removeAvatarBtn = document.getElementById('removeAvatarBtn');
  
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileUpdate);
  }
  
  if (avatarFile) {
    avatarFile.addEventListener('change', handleAvatarPreview);
  }
  
  if (removeAvatarBtn) {
    removeAvatarBtn.addEventListener('click', handleRemoveAvatar);
  }
}

function handleAvatarPreview(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      document.getElementById('avatarPreview').src = event.target.result;
      document.getElementById('avatarPreview').style.display = 'block';
      document.getElementById('avatarPlaceholder').style.display = 'none';
      document.getElementById('removeAvatarBtn').style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
}

function handleRemoveAvatar() {
  document.getElementById('avatarPreview').src = '';
  document.getElementById('avatarPreview').style.display = 'none';
  document.getElementById('avatarPlaceholder').style.display = 'block';
  document.getElementById('removeAvatarBtn').style.display = 'none';
  document.getElementById('avatarFile').value = '';
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  
  const messageDiv = document.getElementById('profileMessage');
  messageDiv.style.display = 'none';
  
  const formData = new FormData();
  formData.append('email', document.getElementById('email').value);
  formData.append('display_name', document.getElementById('displayName').value);
  
  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  
  if (newPassword || currentPassword) {
    if (newPassword !== confirmPassword) {
      messageDiv.textContent = 'New passwords do not match';
      messageDiv.className = 'profile-message error';
      messageDiv.style.display = 'block';
      return;
    }
    if (newPassword.length < 6) {
      messageDiv.textContent = 'New password must be at least 6 characters';
      messageDiv.className = 'profile-message error';
      messageDiv.style.display = 'block';
      return;
    }
    formData.append('current_password', currentPassword);
    formData.append('new_password', newPassword);
  }
  
  const avatarFile = document.getElementById('avatarFile').files[0];
  if (avatarFile) {
    formData.append('avatar', avatarFile);
  }
  
  // Handle avatar removal
  if (document.getElementById('avatarPreview').style.display === 'none') {
    formData.append('remove_avatar', 'true');
  }
  
  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      messageDiv.textContent = 'Profile updated successfully!';
      messageDiv.className = 'profile-message success';
      messageDiv.style.display = 'block';
      
      // Update localStorage if username changed
      if (data.username) {
        localStorage.setItem('username', data.username);
      }
      
      // Clear password fields
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';
      
      // Reload user profile in sidebar
      await loadUserProfile();
      
      showToast('Profile updated successfully!', 'success');
    } else {
      const errorText = data.detail || data.message || 'Failed to update profile';
      messageDiv.textContent = errorText;
      messageDiv.className = 'profile-message error';
      messageDiv.style.display = 'block';
      console.error('Profile update failed:', data);
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    try {
      const errorData = await response.json();
      messageDiv.textContent = errorData.detail || 'Network error. Please try again.';
    } catch {
      messageDiv.textContent = 'Network error. Please try again.';
    }
    messageDiv.className = 'profile-message error';
    messageDiv.style.display = 'block';
  }
}

// Make functions globally available
window.destroyDeployment = destroyDeployment;
window.selectRepository = selectRepository;
window.editEnvVar = editEnvVar;
window.deleteEnvVar = deleteEnvVar;
window.toggleEnvVarVisibility = toggleEnvVarVisibility;
window.saveEnvVarFromModal = saveEnvVarFromModal;
window.closeEnvVarModal = closeEnvVarModal;
window.toggleModalValueVisibility = toggleModalValueVisibility;
window.editEnvVarModal = editEnvVarModal;
window.showEnvVarModal = showEnvVarModal;
