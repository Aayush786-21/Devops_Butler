// Router for client-side navigation
class Router {
  constructor() {
    this.routes = {
      '/': 'projects',
      '/deploy': 'deploy',
      '/history': 'history',
      '/repositories': 'repositories',
      '/domain': 'domain',
      '/env-vars': 'env-vars',
      '/settings': 'settings',
      '/logs': 'logs'
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
    
    // Clear current project when navigating to deploy via router (from main menu, not project sidebar)
    // Project sidebar uses showProjectContent('deploy') directly, not router.navigate()
    if (pageId === 'deploy') {
      currentProject = null;
      // Hide project sidebar if visible
      const projectSidebar = document.getElementById('projectSidebar');
      if (projectSidebar) {
        projectSidebar.style.display = 'none';
      }
      // Show main sidebar
      const mainSidebar = document.getElementById('sidebar');
      if (mainSidebar) {
        mainSidebar.style.display = 'block';
      }
    }
    
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
      
      // Clear any previous error/success messages on deploy page
      if (pageId === 'deploy') {
        const deployStatus = document.getElementById('deploy-status');
        const deploySuccess = document.getElementById('deploy-success');
        if (deployStatus) {
          deployStatus.textContent = '';
          deployStatus.style.color = '';
        }
        if (deploySuccess) {
          deploySuccess.style.display = 'none';
        }
      }
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
      projects: 'Projects',
      deploy: 'Deploy',
      history: 'History',
      repositories: 'Repositories',
      domain: 'Domain',
      'env-vars': 'Environmental Variables',
      settings: 'Settings',
      logs: 'Logs'
    };
    document.getElementById('pageTitle').textContent = titles[pageId] || 'Dashboard';
  }

  loadPageData(pageId) {
    switch(pageId) {
      case 'projects':
        loadProjects();
        break;
      case 'history':
        loadHistory();
        break;
      case 'repositories':
        loadRepositories();
        break;
      case 'domain':
        loadDomainPage();
        break;
      case 'env-vars':
        loadEnvVars();
        break;
      case 'settings':
        loadSettings();
        break;
      case 'logs':
        loadLogs();
        break;
    }
  }
}

// Restore SPA router initialization
const router = new Router();
window.router = router;

async function deleteProject(projectId) {
  const token = await ensureValidToken();
  if (!token) {
    return;
  }
  
  const project = allProjects.find(p => p.id == projectId);
  const name = project ? project.name : 'this project';
  
  // Show custom confirmation dialog
  const confirmed = await showDeleteConfirmation(name);
  if (!confirmed) {
    return;
  }
  
  try {
    console.log('Deleting project with token:', token.substring(0, 20) + '...');
    const res = await fetch(`/projects/${projectId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log('Delete response status:', res.status);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error('Delete error response:', data);
      
      // Handle authentication errors
      if (res.status === 401) {
        showToast('Session expired. Please login again.', 'error');
        // Clear stored tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('authToken');
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      throw new Error(data.detail || 'Failed to delete project');
    }
    
    // Remove from local lists and re-render
    allProjects = allProjects.filter(p => p.id != projectId);
    filteredProjects = filteredProjects.filter(p => p.id != projectId);
    renderProjects(filteredProjects);
    showToast('Project deleted', 'success');
  } catch (e) {
    console.error('Delete project error:', e);
    showToast(`Delete failed: ${e.message}`, 'error');
  }
}

function showDeleteConfirmation(projectName) {
  return new Promise((resolve) => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    // Create modal content
    const modal = document.createElement('div');
    modal.className = 'delete-confirmation-modal';
    
    modal.innerHTML = `
      <h3>Delete Project</h3>
      <p>
        Are you sure you want to delete <strong>${escapeHtml(projectName)}</strong>?<br>
        This will stop and remove its container and image.
      </p>
      <div class="delete-confirmation-actions">
        <button class="cancel-btn">Cancel</button>
        <button class="delete-btn">Delete</button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Event handlers
    const cancelBtn = modal.querySelector('.cancel-btn');
    const deleteBtn = modal.querySelector('.delete-btn');
    
    const cleanup = () => {
      document.body.removeChild(overlay);
    };
    
    cancelBtn.onclick = () => {
      cleanup();
      resolve(false);
    };
    
    deleteBtn.onclick = () => {
      cleanup();
      resolve(true);
    };
    
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(false);
      }
    };
    
    // Focus delete button for keyboard navigation
    deleteBtn.focus();
  });
}

// Token management
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    return exp < now + (5 * 60 * 1000); // Expire 5 minutes before actual expiry
  } catch (e) {
    return true; // If we can't parse, consider it expired
  }
}

async function ensureValidToken() {
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (!token || isTokenExpired(token)) {
    showToast('Session expired. Please login again.', 'error');
    localStorage.removeItem('access_token');
    localStorage.removeItem('authToken');
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
    return null;
  }
  return token;
}

// Auth state
let authToken = localStorage.getItem('access_token') || localStorage.getItem('authToken');
let username = localStorage.getItem('username');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  // Check auth first - will redirect if not logged in
  checkAuthStatus();
  
  // Only setup these if we're logged in and not on login page
  const isLoginPage = window.location.pathname === '/login' || window.location.pathname.includes('login.html');
  if (!isLoginPage) {
    // Wait a bit for checkAuthStatus to potentially redirect
    setTimeout(() => {
      if (authToken && username) {
        setupEventListeners();
        setupCommandPalette();
        
        // Show projects page by default
        const projectsPage = document.getElementById('page-projects');
        if (projectsPage && window.location.pathname === '/') {
          projectsPage.style.display = 'block';
        }
      }
    }, 100);
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

  // Check if we're on the login page - don't redirect if we are
  const isLoginPage = window.location.pathname === '/login' || window.location.pathname.includes('login.html');
  
    if (authToken && username) {
    // User is logged in
    userSection.style.display = 'flex';
    authButtons.style.display = 'none';
    logoutBtn.style.display = 'block';
    newDeployBtn.style.display = 'block';
    
    // Load user profile data to show display name
    loadUserProfile();
    
    // Load user data
    loadProjects();
    
    // If on login page and logged in, redirect to home
    if (isLoginPage) {
      window.location.href = '/';
        }
    } else {
    // User is not logged in
    userSection.style.display = 'none';
    authButtons.style.display = 'block';
    logoutBtn.style.display = 'none';
    newDeployBtn.style.display = 'none';
    
    // Redirect to login page if not already there
    if (!isLoginPage) {
      window.location.href = '/login';
    }
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

  // Projects search
  const projectsSearch = document.getElementById('projectsSearch');
  if (projectsSearch) {
    projectsSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      filteredProjects = allProjects.filter(project => 
        project.name.toLowerCase().includes(query) ||
        (project.repository && project.repository.toLowerCase().includes(query))
      );
      renderProjects(filteredProjects);
    });
  }
  
  // Add project button
  const addProjectBtn = document.getElementById('addProjectBtn');
  if (addProjectBtn) {
    addProjectBtn.addEventListener('click', () => {
      if (window.router) window.router.navigate('/deploy');
    });
  }
  
  // Browse upload link
  const browseUploadLink = document.getElementById('browseUploadLink');
  if (browseUploadLink) {
    browseUploadLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.router) window.router.navigate('/deploy');
    });
  }

  // New Deploy button
  document.getElementById('newDeployBtn').addEventListener('click', () => {
    // Clear current project to show new deploy form
    currentProject = null;
    
    // Hide project sidebar if visible
    const projectSidebar = document.getElementById('projectSidebar');
    if (projectSidebar) {
      projectSidebar.style.display = 'none';
    }
    
    // Show main sidebar
    const mainSidebar = document.getElementById('sidebar');
    if (mainSidebar) {
      mainSidebar.style.display = 'block';
    }
    
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

  // Buttons
  document.getElementById('clearHistoryBtn')?.addEventListener('click', clearHistory);
  document.getElementById('searchReposBtn')?.addEventListener('click', searchRepositories);
  
  // Spotlight search
  setupSpotlightSearch();
}

// Spotlight Search Functionality
function setupSpotlightSearch() {
  const searchInput = document.querySelector('.search-input');
  const spotlightModal = document.getElementById('spotlightModal');
  const spotlightSearch = document.getElementById('spotlightSearch');
  const spotlightResults = document.getElementById('spotlightResults');
  
  if (!searchInput || !spotlightModal || !spotlightSearch || !spotlightResults) return;
  
  // Open spotlight when clicking search input
  searchInput.addEventListener('click', openSpotlight);
  
  // Close spotlight when clicking overlay
  spotlightModal.addEventListener('click', (e) => {
    if (e.target === spotlightModal) {
      closeSpotlight();
    }
  });
  
  // Handle search input
  spotlightSearch.addEventListener('input', handleSpotlightSearch);
  
  // Handle suggestion clicks
  spotlightResults.addEventListener('click', handleSuggestionClick);
  
  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && spotlightModal.style.display !== 'none') {
      closeSpotlight();
    }
  });
}

function openSpotlight() {
  const spotlightModal = document.getElementById('spotlightModal');
  const spotlightSearch = document.getElementById('spotlightSearch');
  
  spotlightModal.style.display = 'flex';
  setTimeout(() => {
    spotlightSearch.focus();
  }, 100);
}

function closeSpotlight() {
  const spotlightModal = document.getElementById('spotlightModal');
  const spotlightSearch = document.getElementById('spotlightSearch');
  const spotlightResults = document.getElementById('spotlightResults');
  
  spotlightModal.style.display = 'none';
  spotlightSearch.value = '';
  
  // Reset to empty state
  spotlightResults.innerHTML = `
    <div class="spotlight-empty">
      <div class="empty-icon">🔍</div>
      <p>Start typing to search...</p>
      <div class="search-suggestions">
        <div class="suggestion-category">
          <h4>Quick Actions</h4>
          <div class="suggestion-item" data-action="new-deploy">
            <span class="suggestion-icon">🚀</span>
            <span class="suggestion-text">New Deploy</span>
          </div>
          <div class="suggestion-item" data-action="repositories">
            <span class="suggestion-icon">📁</span>
            <span class="suggestion-text">Repositories</span>
          </div>
          <div class="suggestion-item" data-action="history">
            <span class="suggestion-icon">📜</span>
            <span class="suggestion-text">History</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function handleSpotlightSearch(e) {
  const query = e.target.value.toLowerCase().trim();
  const spotlightResults = document.getElementById('spotlightResults');
  
  if (!query) {
    // Show empty state with suggestions
    spotlightResults.innerHTML = `
      <div class="spotlight-empty">
        <div class="empty-icon">🔍</div>
        <p>Start typing to search...</p>
        <div class="search-suggestions">
          <div class="suggestion-category">
            <h4>Quick Actions</h4>
            <div class="suggestion-item" data-action="new-deploy">
              <span class="suggestion-icon">🚀</span>
              <span class="suggestion-text">New Deploy</span>
            </div>
            <div class="suggestion-item" data-action="repositories">
              <span class="suggestion-icon">📁</span>
              <span class="suggestion-text">Repositories</span>
            </div>
            <div class="suggestion-item" data-action="history">
              <span class="suggestion-icon">📜</span>
              <span class="suggestion-text">History</span>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }
  
  // Search through projects and other content
  const results = searchContent(query);
  displaySearchResults(results);
}

function searchContent(query) {
  const results = {
    projects: [],
    actions: [],
    navigation: []
  };
  
  // Search projects
  if (allProjects && allProjects.length > 0) {
    results.projects = allProjects.filter(project => 
      project.name.toLowerCase().includes(query) ||
      (project.repository && project.repository.toLowerCase().includes(query))
    );
  }
  
  // Search actions
  const actions = [
    { name: 'New Deploy', action: 'new-deploy', icon: '🚀' },
    { name: 'Repositories', action: 'repositories', icon: '📁' },
    { name: 'History', action: 'history', icon: '📜' },
    { name: 'Settings', action: 'settings', icon: '⚙️' },
    { name: 'Domain', action: 'domain', icon: '🌐' }
  ];
  
  results.actions = actions.filter(action => 
    action.name.toLowerCase().includes(query)
  );
  
  // Search navigation items
  const navItems = [
    { name: 'Projects', action: 'projects', icon: '📊' },
    { name: 'Repositories', action: 'repositories', icon: '📁' },
    { name: 'History', action: 'history', icon: '📜' },
    { name: 'Domain', action: 'domain', icon: '🌐' },
    { name: 'Settings', action: 'settings', icon: '⚙️' }
  ];
  
  results.navigation = navItems.filter(item => 
    item.name.toLowerCase().includes(query)
  );
  
  return results;
}

function displaySearchResults(results) {
  const spotlightResults = document.getElementById('spotlightResults');
  let html = '<div class="search-results">';
  
  // Projects
  if (results.projects.length > 0) {
    html += '<div class="search-category">';
    html += '<div class="search-category-title">Projects</div>';
    results.projects.forEach(project => {
      const statusIcon = project.status === 'running' ? '🚀' : '📦';
      const statusBadge = project.status === 'running' ? 'RUNNING' : 
                         project.status === 'failed' ? 'FAILED' : 'IMPORTED';
      html += `
        <div class="search-result-item" data-type="project" data-id="${project.id}">
          <span class="search-result-icon">${statusIcon}</span>
          <div class="search-result-content">
            <div class="search-result-title">${escapeHtml(project.name)}</div>
            <div class="search-result-subtitle">${project.repository || 'No repository'}</div>
          </div>
          <span class="search-result-badge">${statusBadge}</span>
        </div>
      `;
    });
    html += '</div>';
  }
  
  // Actions
  if (results.actions.length > 0) {
    html += '<div class="search-category">';
    html += '<div class="search-category-title">Actions</div>';
    results.actions.forEach(action => {
      html += `
        <div class="search-result-item" data-type="action" data-action="${action.action}">
          <span class="search-result-icon">${action.icon}</span>
          <div class="search-result-content">
            <div class="search-result-title">${action.name}</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }
  
  // Navigation
  if (results.navigation.length > 0) {
    html += '<div class="search-category">';
    html += '<div class="search-category-title">Navigation</div>';
    results.navigation.forEach(item => {
      html += `
        <div class="search-result-item" data-type="navigation" data-action="${item.action}">
          <span class="search-result-icon">${item.icon}</span>
          <div class="search-result-content">
            <div class="search-result-title">${item.name}</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }
  
  // No results
  if (results.projects.length === 0 && results.actions.length === 0 && results.navigation.length === 0) {
    html = `
      <div class="no-results">
        <div class="no-results-icon">🔍</div>
        <p>No results found for "${escapeHtml(document.getElementById('spotlightSearch').value)}"</p>
      </div>
    `;
  }
  
  html += '</div>';
  spotlightResults.innerHTML = html;
}

function handleSuggestionClick(e) {
  const item = e.target.closest('.suggestion-item, .search-result-item');
  if (!item) return;
  
  const action = item.dataset.action;
  const type = item.dataset.type;
  const id = item.dataset.id;
  
  closeSpotlight();
  
  if (type === 'project' && id) {
    // Open specific project
    selectProject(parseInt(id));
  } else if (action) {
    // Handle actions
    switch (action) {
      case 'new-deploy':
        if (window.router) window.router.navigate('/deploy');
        break;
      case 'repositories':
        if (window.router) window.router.navigate('/repositories');
        break;
      case 'history':
        if (window.router) window.router.navigate('/history');
        break;
      case 'domain':
        if (window.router) window.router.navigate('/domain');
        break;
      case 'settings':
        if (window.router) window.router.navigate('/settings');
        break;
      case 'projects':
        if (window.router) window.router.navigate('/projects');
        break;
    }
  }
}

// Load Domain main page (external links only)
function loadDomainPage() {
  const page = document.getElementById('page-domain');
  if (!page) return;
  // Nothing dynamic for now; placeholder kept for future enhancements
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
// Projects Page Functions
let allProjects = [];
let filteredProjects = [];

async function loadProjects() {
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (!token) {
    renderProjects([]);
    return;
  }
  
  // Show loading skeleton
  showLoadingState();
  
  try {
    const response = await fetch('/deployments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const deployments = await response.json();
      // Convert deployments to projects format
      allProjects = deployments.map(deployment => {
        // Always use git_url from backend - it's the source of truth
        const gitUrl = deployment.git_url || '';
        const repoUrl = gitUrl; // Use git_url as repository_url
        const derivedName = gitUrl ? String(gitUrl).split('/').pop()?.replace(/\.git$/,'') : null;
        const projectName = deployment.app_name || derivedName || deployment.container_name || 'Untitled Project';
        
        // Map backend status to UI status: running | imported | failed
        const rawStatus = (deployment.status || '').toLowerCase();
        let normalizedStatus;
        if (rawStatus === 'running') {
          normalizedStatus = 'running';
        } else if (rawStatus === 'failed' || rawStatus === 'error') {
          normalizedStatus = 'failed';
        } else {
          // Treat any non-running successful/unknown as imported
          normalizedStatus = 'imported';
        }

        // Detect split imports and extract component URLs
        // ALWAYS check git_url first - it's the source of truth
        let isSplit = false;
        let projectType = 'single'; // Default to single
        let frontendUrl = null;
        let backendUrl = null;
        const gitUrlStr = String(deployment.git_url || '');
        
        // A project is split if:
        // 1. git_url starts with 'split::' (MOST RELIABLE - always works before and after deployment)
        // 2. Status is 'imported_split' (before deployment)
        // 3. parent_project_id is null and component_type is null (it's a parent project with split format)
        const hasSplitFormat = gitUrlStr.startsWith('split::');
        const isParentProject = !deployment.parent_project_id && !deployment.component_type;
        
        // Prioritize git_url format check - it's the most reliable
        if (hasSplitFormat) {
          isSplit = true;
          projectType = 'split';
          try {
            // Expected format: split::{frontend}|{backend}
            const parts = gitUrlStr.replace('split::','').split('|');
            if (parts.length === 2) {
              frontendUrl = parts[0];
              backendUrl = parts[1];
            }
          } catch (_) {
            // Best-effort only; keep nulls if parsing fails
          }
        } else if (rawStatus === 'imported_split') {
          // Fallback: check status (only applies before deployment)
          isSplit = true;
          projectType = 'split';
        } else if (isParentProject && gitUrlStr.includes('|')) {
          // Additional fallback: parent project with pipe separator in git_url
          isSplit = true;
          projectType = 'split';
          try {
            const parts = gitUrlStr.split('|');
            if (parts.length === 2) {
              frontendUrl = parts[0];
              backendUrl = parts[1];
            }
          } catch (_) {
            // Best-effort only
          }
        }
        
        return {
        id: deployment.id,
          name: projectName,
          status: normalizedStatus,
        url: deployment.deployed_url || deployment.app_url,
        createdAt: deployment.created_at,
        updatedAt: deployment.updated_at,
          repository: repoUrl,
          repository_url: repoUrl,  // Add this for deploy page compatibility
          git_url: gitUrl,  // Always use the git_url from backend
          project_type: projectType,  // Explicit project type: 'split' or 'single'
          isSplit,
          frontend_url: frontendUrl,
          backend_url: backendUrl,
          // Real container metrics from docker ps
          containerUptime: deployment.container_uptime || 'Unknown',
          containerPorts: deployment.container_ports || 'No ports',
          containerImage: deployment.container_image || 'Unknown',
          containerStatus: deployment.container_status || 'Unknown',
          isRunning: deployment.is_running || false
        };
      });
      filteredProjects = [...allProjects];
      renderProjects(filteredProjects);
  } else {
      renderProjects([]);
    }
  } catch (error) {
    console.error('Error loading projects:', error);
    renderProjects([]);
  }
}

function renderProjects(projects) {
  const projectsGrid = document.getElementById('projectsGrid');
  if (!projectsGrid) return;
  
  if (projects.length === 0) {
    projectsGrid.innerHTML = `
      <div class="empty-state">
        <p>No projects found</p>
        <button class="btn-primary" onclick="if(window.router){window.router.navigate('/deploy');}else{window.location.href='/deploy';}">Create First Project</button>
      </div>
    `;
    return;
  }
  
  projectsGrid.innerHTML = projects.map(project => {
    const statusClass = project.status === 'running' ? 'status-success' : 
                       project.status === 'failed' ? 'status-error' : 'status-info';
    const statusText = project.status === 'running' ? 'Running' :
                      project.status === 'failed' ? 'Failed' : 'Imported';
    const icon = project.status === 'running' ? '🚀' : '📦';
    const timeAgo = project.updatedAt ? getRelativeTime(project.updatedAt) : 'Recently';
    
    return `
      <div class="project-card" data-project-id="${project.id}" onclick="selectProject(${project.id})">
        <div class="project-header">
          <div class="project-icon">${icon}</div>
          <div class="project-status ${statusClass}">${statusText}</div>
          </div>
        
        <div class="project-info">
          <h3 class="project-name">${escapeHtml(project.name)}</h3>
          <div class="project-meta">
            <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12,6 12,12 16,14"></polyline>
            </svg>
            <span>Updated ${timeAgo}</span>
        </div>
          
                 ${project.status === 'running' ? `
                 <div class="project-metrics">
                   <div class="metric">
                     <span class="metric-label">Uptime</span>
                     <span class="metric-value">${project.containerUptime}</span>
            </div>
            </div>
            ` : ''}
            </div>
        
        <div class="project-footer">
          ${project.status === 'running' && project.url ? `
          <button class="btn-dark btn-block btn-open-site" onclick="event.stopPropagation(); openProjectSite(${project.id})">Open Site</button>
          ` : ''}
          <button class="btn-icon btn-danger btn-delete" title="Delete project" onclick="event.stopPropagation(); deleteProject(${project.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
              <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"></path>
            </svg>
            </button>
          </div>
        </div>
      `;
  }).join('');
}

// Enhanced project actions
async function openProjectSite(projectId) {
  try {
    // Find the project in allProjects
    const project = allProjects.find(p => p.id === projectId);
    
    if (!project) {
      showToast('Project not found', 'error');
        return;
      }
    
    if (!project.url || project.url === '#') {
      showToast('Project URL not available. Make sure the project is deployed.', 'error');
      return;
    }
    
    // Open the project URL in a new tab
    window.open(project.url, '_blank');
    showToast(`Opening ${project.name}...`, 'info');
    
  } catch (error) {
    console.error('Error opening project site:', error);
    showToast('Failed to open project site: ' + error.message, 'error');
  }
}

function showProjectLogsModal(logData) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal-content logs-modal">
      <div class="modal-header">
        <h3>Project Logs: ${escapeHtml(logData.container_name)}</h3>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
      </div>
      <div class="modal-body">
        <div class="log-status">
          <span class="status-badge status-${logData.is_running ? 'success' : 'warning'}">
            ${logData.is_running ? 'RUNNING' : 'STOPPED'}
          </span>
        </div>
        <div class="logs-container">
          <pre class="logs-content">${escapeHtml(logData.logs)}</pre>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
        <button class="btn-primary" onclick="viewProjectLogs(${logData.project_id}); this.closest('.modal-overlay').remove();">Refresh</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

async function restartProject(projectId) {
  const project = allProjects.find(p => p.id == projectId);
  if (!project) return;
  
  if (!confirm(`Are you sure you want to restart "${project.name}"?`)) {
    return;
  }
  
  try {
    showToast('Restarting project...', 'info');
    
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    const response = await fetch(`/projects/${projectId}/restart`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      showToast('Project restarted successfully!', 'success');
      loadProjects(); // Refresh the projects list
    } else {
      const data = await response.json();
      showToast(data.detail || 'Failed to restart project', 'error');
    }
  } catch (error) {
    console.error('Error restarting project:', error);
    showToast('Failed to restart project: ' + error.message, 'error');
  }
}

// Loading skeleton functionality
function showLoadingState() {
  const projectsGrid = document.getElementById('projectsGrid');
  if (!projectsGrid) return;
  
  projectsGrid.innerHTML = `
    <div class="loading-skeleton">
      ${Array(3).fill(`
        <div class="skeleton-card">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line short"></div>
        </div>
      `).join('')}
    </div>
  `;
}

// Project-specific sidebar functionality
let currentProject = null;

function selectProject(projectId) {
  // Reload projects to ensure we have latest data, especially project_type
  loadProjects().then(() => {
    const project = allProjects.find(p => p.id == projectId);
    if (!project) {
      // If still not found, try finding in filteredProjects
      const filtered = filteredProjects.find(p => p.id == projectId);
      if (filtered) {
        currentProject = filtered;
        showProjectSidebar(filtered);
      }
      return;
    }
    
    currentProject = project;
    showProjectSidebar(project);
  });
  
  // Update configuration page if it's currently visible
  const configPage = document.getElementById('page-project-config');
  if (configPage && configPage.style.display !== 'none') {
    updateProjectConfigValues();
  }
}

function showProjectSidebar(project) {
  // Hide main sidebar
  const mainSidebar = document.getElementById('sidebar');
  if (mainSidebar) {
    mainSidebar.style.display = 'none';
  }
  
  // Create or show project-specific sidebar
  let projectSidebar = document.getElementById('projectSidebar');
  if (!projectSidebar) {
    projectSidebar = createProjectSidebar();
    document.body.appendChild(projectSidebar);
  }
  
  // Update project info in sidebar
  const projectName = projectSidebar.querySelector('#projectSidebarName');
  if (projectName) {
    projectName.textContent = project.name;
  }
  
  const projectId = projectSidebar.querySelector('#projectSidebarId');
  if (projectId) {
    projectId.textContent = project.id;
  }
  
  // Show Status navigation item only for split repos
  const statusNavItem = projectSidebar.querySelector('a[data-project-page="status"]');
  if (statusNavItem) {
    if (project.project_type === 'split') {
      statusNavItem.style.display = 'flex';
    } else {
      statusNavItem.style.display = 'none';
    }
  }
  
  projectSidebar.style.display = 'block';
  
  // Update page title
  document.getElementById('pageTitle').textContent = project.name;
  
  // Load user profile into project sidebar
  loadUserProfileIntoProjectSidebar();
  
  // Show project-specific content
  showProjectContent('deploy');
}

function createProjectSidebar() {
  const sidebar = document.createElement('aside');
  sidebar.id = 'projectSidebar';
  sidebar.className = 'sidebar project-sidebar';
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="logo">
        <img src="/icons/devops.png" alt="DevOps Butler" class="logo-icon" style="width: 32px; height: 32px; border-radius: 6px;" />
        <span class="logo-text">DevOps Butler</span>
      </div>
      <button class="btn-back" onclick="hideProjectSidebar()">← Back to Projects</button>
    </div>
    
    <div class="project-info">
      <h3 id="projectSidebarName">Project Name</h3>
      <p class="project-id">ID: <span id="projectSidebarId">-</span></p>
    </div>
    
    <nav class="sidebar-nav">
      <a href="#" class="nav-item project-nav-item" data-project-page="deploy">
        <span class="nav-icon">🚀</span>
        <span class="nav-label">Deploy</span>
      </a>
      <a href="#" class="nav-item project-nav-item" data-project-page="status" style="display: none;">
        <span class="nav-icon">⚡️</span>
        <span class="nav-label">Status</span>
      </a>
      <a href="#" class="nav-item project-nav-item" data-project-page="configuration">
        <span class="nav-icon">⚙️</span>
        <span class="nav-label">Configuration</span>
      </a>
      <a href="#" class="nav-item project-nav-item" data-project-page="domain-config">
        <span class="nav-icon">🌐</span>
        <span class="nav-label">Domain Configuration</span>
      </a>
      <a href="#" class="nav-item project-nav-item" data-project-page="env-vars">
        <span class="nav-icon">🔐</span>
        <span class="nav-label">Environment Variables</span>
      </a>
    </nav>
    
    <div class="sidebar-footer">
      <div class="user-section">
        <div class="user-avatar" id="projectSidebarUserAvatar">G</div>
        <div class="user-info">
          <div class="user-name" id="projectSidebarUserName">Guest</div>
          <div class="user-email" id="projectSidebarUserEmail">Not logged in</div>
        </div>
      </div>
    </div>
  `;
  
  // Add click handlers for project navigation
  sidebar.querySelectorAll('.project-nav-item').forEach(item => {
    item.addEventListener('click', async (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-project-page');
      
      // Reload projects to ensure we have latest data (especially after deployments)
      await loadProjects();
      
      // Update currentProject with fresh data
      if (currentProject) {
        const freshProject = allProjects.find(p => p.id === currentProject.id);
        if (freshProject) {
          currentProject = freshProject;
        }
      }
      
      showProjectContent(page);
      
      // Update active nav
      sidebar.querySelectorAll('.project-nav-item').forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
    });
  });
  
  return sidebar;
}

function hideProjectSidebar() {
  const projectSidebar = document.getElementById('projectSidebar');
  if (projectSidebar) {
    projectSidebar.style.display = 'none';
  }
  
  const mainSidebar = document.getElementById('sidebar');
  if (mainSidebar) {
    mainSidebar.style.display = 'block';
  }
  
  currentProject = null;
  document.getElementById('pageTitle').textContent = 'Projects';
  
  // Hide ALL pages first to ensure clean state
  document.querySelectorAll('.page').forEach(p => {
    p.style.display = 'none';
  });
  
  // Show only the projects page
  const projectsPage = document.getElementById('page-projects');
  if (projectsPage) {
    projectsPage.style.display = 'block';
  }
  
  // Reload projects to ensure fresh data
  loadProjects();
}

function showProjectContent(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => {
    p.style.display = 'none';
  });
  
  // Show project-specific content based on page
  switch(page) {
    case 'deploy':
      // Show original deploy page and pre-fill GitHub URL
      const deployPage = document.getElementById('page-deploy');
      if (deployPage) {
        deployPage.style.display = 'block';
        
        // Clear any previous error/success messages
        const deployStatus = document.getElementById('deploy-status');
        const deploySuccess = document.getElementById('deploy-success');
        if (deployStatus) {
          deployStatus.textContent = '';
          deployStatus.style.color = '';
        }
        if (deploySuccess) {
          deploySuccess.style.display = 'none';
        }
        
        // Hide "Deploy New Application" card if viewing an existing project
        const deployNewAppCard = deployPage.querySelector('.card h2')?.closest('.card');
        
        if (currentProject) {
          // Show deploy form card when viewing existing project (for redeploying)
          if (deployNewAppCard) {
            deployNewAppCard.style.display = 'block';
          }
          
          // Load and display project components if split repo and both deployed
          const componentsSection = document.getElementById('project-components-section');
          const projectType = currentProject?.project_type || 
                            (currentProject?.isSplit ? 'split' : 'single');
          
          // Hide components section on deploy page (components now on Status page)
          if (componentsSection) {
            componentsSection.style.display = 'none';
          }
        } else {
          // Show deploy form when no project is selected (from + New Deploy button)
          if (deployNewAppCard) {
            deployNewAppCard.style.display = 'block';
          }
          
          // Hide any components section that might be visible
          const componentsSection = document.getElementById('project-components-section');
          if (componentsSection) {
            componentsSection.style.display = 'none';
          }
        }
        
        const deployTypeSelect = document.getElementById('deploy-type');
        const deployTypeGroup = document.getElementById('deploy-type-group');
        const singleGroup = document.getElementById('single-repo-group');
        const splitGroup = document.getElementById('split-repo-group');
        const splitLayout = document.getElementById('split-deploy-layout');
        const gitUrlInput = document.getElementById('git-url');
        const feInput = document.getElementById('frontend-url');
        const beInput = document.getElementById('backend-url');
        const submitBtn = document.getElementById('deploy-submit-default');

        // Clean any previous dynamic buttons
        deployPage.querySelectorAll('.dynamic-split-btn').forEach(b => b.remove());

        // Determine project type to show correct deploy layout
        // Use explicit project_type field if available, otherwise fallback to detection
        let projectType = currentProject?.project_type;
        
        // Always double-check git_url format as final source of truth
        const gitUrl = currentProject?.git_url || currentProject?.repository_url || '';
        const hasSplitFormat = gitUrl.startsWith('split::');
        
        if (!projectType) {
          // Fallback detection: check isSplit flag or git_url format
          if (currentProject?.isSplit || hasSplitFormat) {
            projectType = 'split';
          } else {
            projectType = 'single';
          }
        }
        
        // Override if git_url format contradicts project_type (git_url is always correct)
        if (hasSplitFormat && projectType !== 'split') {
          console.warn('Project type mismatch detected. git_url indicates split but project_type is', projectType);
          projectType = 'split';
        } else if (!hasSplitFormat && projectType === 'split' && gitUrl) {
          console.warn('Project type mismatch detected. git_url indicates single but project_type is split');
          projectType = 'single';
        }
        
        if (currentProject) {
          // Always hide dropdown when viewing an existing project (no type selection needed)
          if (deployTypeGroup) deployTypeGroup.style.display = 'none';
          
          if (projectType === 'split') {
            // Split repo: show split layout with frontend/backend inputs and Deploy All button
            if (singleGroup) singleGroup.style.display = 'none';
            if (splitGroup) splitGroup.style.display = 'none';
            if (splitLayout) splitLayout.style.display = 'block';
            if (feInput) feInput.value = currentProject.frontend_url || '';
            if (beInput) beInput.value = currentProject.backend_url || '';
            if (gitUrlInput) gitUrlInput.removeAttribute('required');
            if (submitBtn) submitBtn.style.display = 'none'; // Hide default submit, use Deploy All button
            
            // Wire up the structured layout buttons
            const deployFrontendBtn = document.getElementById('deploy-frontend-btn');
            const deployBackendBtn = document.getElementById('deploy-backend-btn');
            const deployBothBtn = document.getElementById('deploy-both-btn');
            
            if (deployFrontendBtn) deployFrontendBtn.onclick = async () => {
            const url = feInput?.value?.trim();
            if (!url || !url.startsWith('http')) return showToast('Enter a valid frontend URL', 'error');
            const dialog = showDeploymentProgressDialog(false);
            document.getElementById('step-frontend').style.display = 'flex';
            dialog.updateFrontendStatus('deploying', 'Deploying your frontend now...');
            const result = await deploySingle(url, 'frontend', dialog, true);
            // Show URL and close button after success
            if (result && result.success && result.deployed_url) {
              dialog.showUrls(result.deployed_url, null);
              document.getElementById('close-deployment-dialog').onclick = () => {
                dialog.close();
                loadAndDisplayProjectComponents();
                loadDashboard();
              };
            } else if (result && !result.success) {
              setTimeout(() => dialog.close(), 3000);
            }
          };
          if (deployBackendBtn) deployBackendBtn.onclick = async () => {
            const url = beInput?.value?.trim();
            if (!url || !url.startsWith('http')) return showToast('Enter a valid backend URL', 'error');
            const dialog = showDeploymentProgressDialog(false);
            document.getElementById('step-backend').style.display = 'flex';
            dialog.updateBackendStatus('deploying', 'Deploying your backend now...');
            const result = await deploySingle(url, 'backend', dialog, true);
            // Show URL and close button after success
            if (result && result.success && result.deployed_url) {
              dialog.showUrls(null, result.deployed_url);
              document.getElementById('close-deployment-dialog').onclick = () => {
                dialog.close();
                loadAndDisplayProjectComponents();
                loadDashboard();
              };
            } else if (result && !result.success) {
              setTimeout(() => dialog.close(), 3000);
            }
          };
          if (deployBothBtn) deployBothBtn.onclick = async () => {
            const frontendUrl = feInput?.value?.trim();
            const backendUrl = beInput?.value?.trim();
            if (!frontendUrl || !frontendUrl.startsWith('http') || !backendUrl || !backendUrl.startsWith('http')) {
              showToast('Please enter valid Frontend and Backend repository URLs', 'error');
              return;
            }
            
            // First check if project already has env vars saved
            let hasExistingEnvVars = false;
            let detectedEnvVars = {};
            
            if (currentProject && currentProject.id) {
              try {
                const existingResponse = await fetch(`/api/env-vars?project_id=${currentProject.id}`, {
                  headers: getAuthHeaders()
                });
                
                if (existingResponse.ok) {
                  const existingData = await existingResponse.json();
                  const existingVars = existingData.variables || {};
                  hasExistingEnvVars = Object.keys(existingVars).length > 0;
                  console.log('Existing env vars check:', { hasExistingEnvVars, count: Object.keys(existingVars).length });
                }
              } catch (error) {
                console.warn('Failed to check existing env vars:', error);
              }
            }
            
            // If env vars already exist, proceed directly to deployment
            if (hasExistingEnvVars) {
              await proceedWithDeployment();
              return;
            }
            
            // No existing env vars - detect from code and show suggestions
            try {
              const detectionResponse = await fetch(`/api/env-vars/detect?frontend_url=${encodeURIComponent(frontendUrl)}&backend_url=${encodeURIComponent(backendUrl)}`, {
                headers: getAuthHeaders()
              });
              
              if (detectionResponse.ok) {
                const detectionResult = await detectionResponse.json();
                detectedEnvVars = detectionResult.suggestions || {};
                
                console.log('Env var detection result:', { count: Object.keys(detectedEnvVars).length, vars: detectedEnvVars });
              } else {
                console.warn('Env var detection API returned:', detectionResponse.status);
              }
            } catch (error) {
              console.warn('Env var detection failed:', error);
            }
            
            // No existing env vars - show dialog with detected vars (if any)
            // Show env vars detection dialog (even if empty - user can still add manually or skip)
            showEnvVarsDetectionDialog(
              detectedEnvVars,
              // onImport - import all suggested env vars
              async () => {
                if (Object.keys(detectedEnvVars).length === 0) {
                  // No vars to import - navigate to manual add
                  if (currentProject && currentProject.id) {
                    router.navigate('/env-vars');
                  } else {
                    showToast('No env vars detected. Add them manually after deployment', 'info');
                    await proceedWithDeployment();
                  }
                  return;
                }
                
                showToast('Importing environment variables...', 'info');
                
                // Only import if we have a current project
                if (currentProject && currentProject.id) {
                  // Create env vars object from detected vars (with empty values for now)
                  const importedVars = {};
                  Object.keys(detectedEnvVars).forEach(key => {
                    importedVars[key] = ''; // Empty values, user will fill them
                  });
                  
                  // Merge with existing env vars (should be empty, but check anyway)
                  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
                  const existingResponse = await fetch(`/api/env-vars?project_id=${currentProject.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  
                  if (existingResponse.ok) {
                    const existingData = await existingResponse.json();
                    const existingVars = existingData.variables || {};
                    // Merge: imported vars take precedence
                    const mergedVars = { ...existingVars, ...importedVars };
                    
                    // Save merged vars
                    const saveResponse = await fetch('/api/env-vars', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        variables: mergedVars,
                        project_id: currentProject.id
                      })
                    });
                    
                    if (saveResponse.ok) {
                      showToast('Environment variables imported successfully!', 'success');
                      // Small delay before proceeding to show success message
                      setTimeout(() => proceedWithDeployment(), 500);
                    } else {
                      showToast('Failed to import environment variables', 'error');
                      await proceedWithDeployment();
                    }
                  } else {
                    showToast('Failed to load existing environment variables', 'error');
                    await proceedWithDeployment();
                  }
                } else {
                  // No current project - just proceed with deployment
                  showToast('Save detected env vars after deployment', 'info');
                  await proceedWithDeployment();
                }
              },
              // onAddManual - navigate to env vars page
              () => {
                if (currentProject && currentProject.id) {
                  router.navigate('/env-vars');
                } else {
                  showToast('Please add environment variables after deployment', 'info');
                }
              },
              // onSkip - proceed without env vars
              async () => {
                await proceedWithDeployment();
              }
            );
            
            async function proceedWithDeployment() {
              // Show progress dialog with both steps
              const dialog = showDeploymentProgressDialog(true);
              document.getElementById('step-backend').style.display = 'flex';
              document.getElementById('step-frontend').style.display = 'flex';
              
              // Update backend status first
              dialog.updateBackendStatus('deploying', 'Deploying your backend now...');
              
              // Use proper split deployment endpoint for correct parent/child linking
              try {
                const formData = new FormData();
                formData.append('deploy_type', 'split');
                formData.append('frontend_url', frontendUrl);
                formData.append('backend_url', backendUrl);
                // Include project_id if available (for imported split projects)
                if (currentProject && currentProject.id) {
                  formData.append('project_id', String(currentProject.id));
                }
                
                const response = await fetch('/deploy', {
                  method: 'POST',
                  headers: getAuthHeaders(),
                  body: formData
                });
                
                const result = await response.json();
                
                if (response.ok && result.deployed_url) {
                  // Parse the split response to show URLs for both frontend and backend
                  // Note: The backend returns frontend_url as primary, we need to extract both
                  dialog.updateBackendStatus('success', 'Backend deployed! ✅');
                  dialog.updateFrontendStatus('success', 'Frontend deployed! ✅');
                  
                  // For split deployment, we only get one URL back but both are deployed
                  // The backend returns frontend URL as primary
                  dialog.showUrls(result.deployed_url, null); // Only frontend URL for now
                  
                  document.getElementById('close-deployment-dialog').onclick = () => {
                    dialog.close();
                    loadProjects();
                    loadAndDisplayProjectComponents();
                    loadDashboard();
                  };
                  
                  showToast('Split deployment successful!', 'success');
                } else {
                  dialog.updateBackendStatus('failed', result.detail || 'Deployment failed');
                  dialog.updateFrontendStatus('failed', 'Could not deploy');
                  showToast(result.detail || 'Deployment failed', 'error');
                  setTimeout(() => dialog.close(), 3000);
                }
              } catch (error) {
                dialog.updateBackendStatus('failed', 'Network error');
                dialog.updateFrontendStatus('failed', 'Network error');
                showToast('Network error during deployment', 'error');
                setTimeout(() => dialog.close(), 3000);
              }
            }
          };
          if (submitBtn) submitBtn.style.display = 'none';
          } else if (projectType === 'single') {
            // Single repo: show single input with deploy button (no dropdown)
            if (singleGroup) singleGroup.style.display = 'block';
            if (splitGroup) splitGroup.style.display = 'none';
            if (splitLayout) splitLayout.style.display = 'none';
            if (gitUrlInput && currentProject && currentProject.repository_url) {
              gitUrlInput.value = currentProject.repository_url;
            }
            if (submitBtn) { 
              submitBtn.textContent = '🚀 Deploy'; 
              submitBtn.style.display = ''; 
            }
          }
        } else {
          // New deploy (no project selected): show dropdown and allow type selection
          if (deployTypeGroup) deployTypeGroup.style.display = '';
          if (splitGroup) splitGroup.style.display = 'none';
          if (splitLayout) splitLayout.style.display = 'none';
          if (singleGroup) singleGroup.style.display = 'block';
          if (gitUrlInput) gitUrlInput.value = '';
          if (submitBtn) { 
            submitBtn.textContent = '🚀 Deploy'; 
            submitBtn.style.display = ''; 
          }
        }
      }
      document.getElementById('pageTitle').textContent = 'Deploy';
      break;
    case 'status':
      showProjectStatus();
      break;
    case 'configuration':
      showProjectConfiguration();
      break;
    case 'domain-config':
      showProjectDomainConfig();
      break;
    case 'env-vars':
      const envVarsPage = document.getElementById('page-env-vars');
      if (envVarsPage) {
        envVarsPage.style.display = 'block';
        loadEnvVars();
      }
      break;
  }
}



async function loadProjectLogs(projectId) {
  const logsContainer = document.getElementById('projectLogsContainer');
  if (!logsContainer) return;
  
  try {
    logsContainer.innerHTML = '<div class="logs-loading">Loading logs...</div>';
    
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    const response = await fetch(`/projects/${projectId}/logs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      displayProjectLogs(data);
  } else {
      logsContainer.innerHTML = `<div class="logs-error">Error: ${data.detail || 'Failed to load logs'}</div>`;
    }
  } catch (error) {
    console.error('Error loading project logs:', error);
    logsContainer.innerHTML = `<div class="logs-error">Error: ${error.message}</div>`;
  }
}

function displayProjectLogs(logData) {
  const logsContainer = document.getElementById('projectLogsContainer');
  if (!logsContainer) return;
  
  const logsHtml = `
    <div class="logs-status">
      <span class="status-badge status-${logData.is_running ? 'running' : 'stopped'}">
        ${logData.is_running ? 'RUNNING' : 'STOPPED'}
              </span>
      <span class="logs-timestamp">Last updated: ${new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kathmandu' })}</span>
    </div>
    <div class="logs-content">
      <pre>${escapeHtml(logData.logs)}</pre>
    </div>
  `;
  
  logsContainer.innerHTML = logsHtml;
}

function refreshProjectLogs() {
  if (currentProject) {
    loadProjectLogs(currentProject.id);
  }
}

async function showProjectLogs() {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  
  // Find or create logs page
  let logsPage = document.getElementById('page-project-logs');
  if (!logsPage) {
    logsPage = document.createElement('div');
    logsPage.id = 'page-project-logs';
    logsPage.className = 'page';
    document.getElementById('pageContent').appendChild(logsPage);
  }
  
  // Clear previous content
  logsPage.innerHTML = '';
  
  // Show loading state
  logsPage.innerHTML = `
    <div class="card">
      <div class="page-header">
        <h2>Container Logs</h2>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn-secondary" id="clearProjectLogsBtn">Clear</button>
          <button class="btn-secondary" id="toggleProjectLogsBtn">Pause</button>
        </div>
      </div>
      <div class="logs-container">
        <div id="projectLogsContent" class="logs-content">
          <p style="text-align: center; color: var(--text-secondary); padding: 2rem;">
            Connecting to logs stream...
          </p>
        </div>
      </div>
    </div>
  `;
  
  logsPage.style.display = 'block';
  
  // Start WebSocket connection for container logs
  if (currentProject && currentProject.id) {
    connectProjectLogsWebSocket(currentProject.id);
  }
}

async function showProjectConfiguration() {
  // Create project configuration page if it doesn't exist
  let configPage = document.getElementById('page-project-config');
  if (!configPage) {
    configPage = document.createElement('div');
    configPage.id = 'page-project-config';
    configPage.className = 'page';
    configPage.innerHTML = `
      <div class="card">
        <h2>Project information</h2>
        <hr class="config-divider">
        <div class="config-info-grid">
          <div class="config-row">
            <div class="config-label">Project name:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigName">${currentProject?.name || 'Unknown'}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Owner:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigOwner">${currentProject?.owner || 'Unknown'}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Project ID:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigId">${currentProject?.id || '-'}</span>
              <button class="copy-btn" onclick="copyToClipboard('${currentProject?.id || ''}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
            <div class="config-subtext">Also known as Site ID</div>
          </div>
          <div class="config-row">
            <div class="config-label">Imported:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigCreated">${currentProject?.createdAt ? formatDateTime(currentProject.createdAt) : 'Unknown'}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Last update:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigUpdated">${currentProject?.updatedAt ? getRelativeTime(new Date(currentProject.updatedAt)) : 'Unknown'}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Container Ports:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigPorts">${currentProject?.containerPorts ? formatPorts(currentProject.containerPorts) : 'No ports'}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Docker Image:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigImage">${currentProject?.containerImage || 'Unknown'}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Container Status:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigStatus">${currentProject?.containerStatus || 'Unknown'}</span>
            </div>
          </div>
        </div>
        <div class="config-actions">
          <button class="btn-secondary" id="changeProjectNameBtn">Change project name</button>
        </div>
      </div>
    `;
    document.getElementById('pageContent').appendChild(configPage);
  }
  
  // Configuration page should NOT show components section
  // Components section is ONLY shown on deploy page
  // Hide components section if it exists
  const componentsSection = document.getElementById('project-components-section');
  if (componentsSection) {
    componentsSection.style.display = 'none';
  }
  
  // Update the configuration values with current project data
  updateProjectConfigValues();
  
  // Setup change project name button
  const changeNameBtn = document.getElementById('changeProjectNameBtn');
  if (changeNameBtn) {
    changeNameBtn.onclick = () => openProjectNameModal();
  }
  
  configPage.style.display = 'block';
}

async function showProjectStatus() {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
  
  // Find or create status page
  let statusPage = document.getElementById('page-status');
  if (!statusPage) {
    statusPage = document.createElement('div');
    statusPage.id = 'page-status';
    statusPage.className = 'page';
    document.getElementById('pageContent').appendChild(statusPage);
  }
  
  // Clear previous content
  statusPage.innerHTML = '';
  
  // Load and display project components on status page
  if (currentProject && currentProject.id) {
    try {
      const response = await fetch(`/projects/${currentProject.id}/components`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        const components = data.components || [];
        
        // Group components by type
        const frontend = components.find(c => c.component_type === 'frontend');
        const backend = components.find(c => c.component_type === 'backend');
        
        const frontendStatus = frontend ? (frontend.status === 'running' ? 'RUNNING' : frontend.status.toUpperCase()) : 'NOT DEPLOYED';
        const backendStatus = backend ? (backend.status === 'running' ? 'RUNNING' : backend.status.toUpperCase()) : 'NOT DEPLOYED';
        const frontendStatusClass = frontend?.status === 'running' ? 'status-success' : frontend?.status === 'failed' ? 'status-error' : 'status-info';
        const backendStatusClass = backend?.status === 'running' ? 'status-success' : backend?.status === 'failed' ? 'status-error' : 'status-info';
        
        statusPage.innerHTML = `
          <div class="card">
            <h2 style="margin-bottom: 1.5rem;">Project Components</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
              <!-- Frontend Card -->
              <div class="project-card" style="margin: 0;">
                <div class="project-header">
                  <div class="project-icon">🌐</div>
                  <div class="project-status ${frontendStatusClass}">${frontendStatus}</div>
                </div>
                <div class="project-info">
                  <h3 class="project-name">Frontend</h3>
                  <div class="project-meta">
                    ${frontend ? `
                      <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12,6 12,12 16,14"></polyline>
                      </svg>
                      <span>Updated ${frontend.updated_at ? getRelativeTime(new Date(frontend.updated_at)) : 'Recently'}</span>
                    ` : '<span>Not deployed yet</span>'}
                  </div>
                  ${frontend && frontend.status === 'running' ? `
                    <div class="project-metrics">
                      <div class="metric">
                        <span class="metric-label">Uptime</span>
                        <span class="metric-value">${frontend.container_uptime || 'Unknown'}</span>
                      </div>
                    </div>
                  ` : ''}
                </div>
                ${frontend && frontend.deployed_url ? `
                  <div class="project-footer">
                    <button class="btn-dark btn-block btn-open-site" onclick="openSite('${frontend.deployed_url}')">Open Frontend</button>
                  </div>
                ` : ''}
              </div>
              
              <!-- Backend Card -->
              <div class="project-card" style="margin: 0;">
                <div class="project-header">
                  <div class="project-icon">💻</div>
                  <div class="project-status ${backendStatusClass}">${backendStatus}</div>
                </div>
                <div class="project-info">
                  <h3 class="project-name">Backend</h3>
                  <div class="project-meta">
                    ${backend ? `
                      <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12,6 12,12 16,14"></polyline>
                      </svg>
                      <span>Updated ${backend.updated_at ? getRelativeTime(new Date(backend.updated_at)) : 'Recently'}</span>
                    ` : '<span>Not deployed yet</span>'}
                  </div>
                  ${backend && backend.status === 'running' ? `
                    <div class="project-metrics">
                      <div class="metric">
                        <span class="metric-label">Uptime</span>
                        <span class="metric-value">${backend.container_uptime || 'Unknown'}</span>
                      </div>
                    </div>
                  ` : ''}
                </div>
                ${backend && backend.deployed_url ? `
                  <div class="project-footer">
                    <button class="btn-dark btn-block btn-open-site" onclick="openSite('${backend.deployed_url}')">Open Backend</button>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading project components:', error);
      statusPage.innerHTML = `
        <div class="card">
          <p>Unable to load project components. Please try again later.</p>
        </div>
      `;
    }
  }
  
  statusPage.style.display = 'block';
  document.getElementById('pageTitle').textContent = 'Status';
}

async function loadAndDisplayProjectComponents() {
  if (!currentProject || !currentProject.id) return;
  
  try {
    const response = await fetch(`/projects/${currentProject.id}/components`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      // Project might not have components yet, that's okay
      return;
    }
    
    const data = await response.json();
    const components = data.components || [];
    
    // Group components by type
    const frontend = components.find(c => c.component_type === 'frontend');
    const backend = components.find(c => c.component_type === 'backend');
    
    // Only show components if BOTH frontend AND backend have been deployed (not just imported)
    const frontendDeployed = frontend && frontend.status && frontend.status !== 'imported' && frontend.status !== 'imported_split';
    const backendDeployed = backend && backend.status && backend.status !== 'imported' && backend.status !== 'imported_split';
    const bothDeployed = frontendDeployed && backendDeployed;
    
    // Find or create components section on deploy page ONLY
    // Always place components on deploy page, not config page
    let componentsSection = document.getElementById('project-components-section');
    const deployPage = document.getElementById('page-deploy');
    
    // Remove components section from config page if it exists there (should never happen, but cleanup just in case)
    const configPage = document.getElementById('page-project-config');
    const oldConfigSection = configPage?.querySelector('#project-components-section');
    if (oldConfigSection) {
      oldConfigSection.remove();
    }
    
    // Only show components section if deploy page is visible (not config page)
    // This ensures components are always shown on deploy page, never config page
    if (bothDeployed && deployPage && deployPage.style.display !== 'none') {
      // Create components section if it doesn't exist
      if (!componentsSection) {
        componentsSection = document.createElement('div');
        componentsSection.id = 'project-components-section';
        componentsSection.className = 'card project-components-card';
        
        // Insert before the "Deploy New Application" card
        const firstCard = deployPage.querySelector('.card');
        if (firstCard) {
          deployPage.insertBefore(componentsSection, firstCard);
        } else {
          deployPage.appendChild(componentsSection);
        }
      }
      
      componentsSection.style.display = 'block';
      
      const frontendStatus = frontend ? (frontend.status === 'running' ? 'RUNNING' : frontend.status.toUpperCase()) : 'NOT DEPLOYED';
      const backendStatus = backend ? (backend.status === 'running' ? 'RUNNING' : backend.status.toUpperCase()) : 'NOT DEPLOYED';
      const frontendStatusClass = frontend?.status === 'running' ? 'status-success' : frontend?.status === 'failed' ? 'status-error' : 'status-info';
      const backendStatusClass = backend?.status === 'running' ? 'status-success' : backend?.status === 'failed' ? 'status-error' : 'status-info';
    
    componentsSection.innerHTML = `
      <h2 style="margin-bottom: 1.5rem;">Project Components</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
        <!-- Frontend Card -->
        <div class="project-card" style="margin: 0;">
          <div class="project-header">
            <div class="project-icon">🌐</div>
            <div class="project-status ${frontendStatusClass}">${frontendStatus}</div>
          </div>
          <div class="project-info">
            <h3 class="project-name">Frontend</h3>
            <div class="project-meta">
              ${frontend ? `
                <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span>Updated ${frontend.updated_at ? getRelativeTime(new Date(frontend.updated_at)) : 'Recently'}</span>
              ` : '<span>Not deployed yet</span>'}
            </div>
            ${frontend && frontend.status === 'running' ? `
              <div class="project-metrics">
                <div class="metric">
                  <span class="metric-label">Uptime</span>
                  <span class="metric-value">${frontend.container_uptime || 'Unknown'}</span>
                </div>
              </div>
            ` : ''}
          </div>
          ${frontend && frontend.deployed_url ? `
            <div class="project-footer">
              <button class="btn-dark btn-block btn-open-site" onclick="openSite('${frontend.deployed_url}')">Open Frontend</button>
            </div>
          ` : ''}
        </div>
        
        <!-- Backend Card -->
        <div class="project-card" style="margin: 0;">
          <div class="project-header">
            <div class="project-icon">💻</div>
            <div class="project-status ${backendStatusClass}">${backendStatus}</div>
          </div>
          <div class="project-info">
            <h3 class="project-name">Backend</h3>
            <div class="project-meta">
              ${backend ? `
                <svg class="icon-clock" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12,6 12,12 16,14"></polyline>
                </svg>
                <span>Updated ${backend.updated_at ? getRelativeTime(new Date(backend.updated_at)) : 'Recently'}</span>
              ` : '<span>Not deployed yet</span>'}
            </div>
            ${backend && backend.status === 'running' ? `
              <div class="project-metrics">
                <div class="metric">
                  <span class="metric-label">Uptime</span>
                  <span class="metric-value">${backend.container_uptime || 'Unknown'}</span>
                </div>
              </div>
            ` : ''}
          </div>
          ${backend && backend.deployed_url ? `
            <div class="project-footer">
              <button class="btn-dark btn-block btn-open-site" onclick="openSite('${backend.deployed_url}')">Open Backend</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
      
      // Animate the deploy card sliding down
      requestAnimationFrame(() => {
        componentsSection.classList.add('components-visible');
        const deployAppCard = deployPage.querySelector('.card:not(#project-components-section)');
        if (deployAppCard) {
          deployAppCard.classList.add('deploy-card-slide-down');
        }
      });
    } else {
      // Hide components section if not both deployed
      if (componentsSection) {
        componentsSection.style.display = 'none';
        componentsSection.classList.remove('components-visible');
        const deployAppCard = deployPage?.querySelector('.card:not(#project-components-section)');
        if (deployAppCard) {
          deployAppCard.classList.remove('deploy-card-slide-down');
        }
      }
    }
  } catch (error) {
    console.error('Error loading project components:', error);
  }
}

function openSite(url) {
  if (url) window.open(url, '_blank');
}

// Environment Variables Detection Dialog
function showEnvVarsDetectionDialog(suggestions, onImport, onAddManual, onSkip) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'envVarsDetectionOverlay';
  
  const modal = document.createElement('div');
  modal.className = 'modal-content enhanced';
  modal.style.maxWidth = '600px';
  
  const hasSuggestions = Object.keys(suggestions).length > 0;
  
  const envVarsList = hasSuggestions 
    ? Object.entries(suggestions).map(([key, info]) => `
      <div class="env-var-suggestion" style="padding: 0.75rem; margin-bottom: 0.5rem; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="font-weight: 600; color: #111827; margin-bottom: 0.25rem;">${key}</div>
        <div style="font-size: 0.875rem; color: #6b7280;">
          Detected from: ${info.detected_from} (${info.source})
          ${info.component ? ` | Component: ${info.component}` : ''}
        </div>
      </div>
    `).join('')
    : `
      <div style="padding: 2rem; text-align: center; color: #6b7280;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
        <p style="font-size: 1rem; margin-bottom: 0.5rem;">No environment variables detected in your code.</p>
        <p style="font-size: 0.875rem;">You can add them manually or proceed without them.</p>
      </div>
    `;
  
  modal.innerHTML = `
    <div style="padding: 1.5rem; border-bottom: 1px solid #e5e7eb;">
      <h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem;">🔍 Environment Variables</h2>
      <p style="color: #6b7280; font-size: 0.875rem;">
        ${hasSuggestions 
          ? `We found ${Object.keys(suggestions).length} environment variables in your code. Choose how to proceed:`
          : `No environment variables were detected. You can add them manually or proceed without them.`}
      </p>
    </div>
    <div style="padding: 1.5rem; max-height: 400px; overflow-y: auto;">
      ${envVarsList}
    </div>
    <div style="padding: 1.5rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.75rem; justify-content: flex-end;">
      <button class="btn-secondary skip-env-btn" style="padding: 0.75rem 1.5rem;">No, Skip</button>
      <button class="btn-secondary add-manual-env-btn" style="padding: 0.75rem 1.5rem;">Add Manually</button>
      ${hasSuggestions ? '<button class="btn-primary import-env-btn" style="padding: 0.75rem 1.5rem;">✅ Import All</button>' : ''}
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Add event listeners
  document.querySelector('.skip-env-btn').onclick = () => {
    overlay.remove();
    if (onSkip) onSkip();
  };
  
  document.querySelector('.add-manual-env-btn').onclick = () => {
    overlay.remove();
    if (onAddManual) onAddManual();
  };
  
  const importBtn = document.querySelector('.import-env-btn');
  if (importBtn) {
    importBtn.onclick = async () => {
      overlay.remove();
      if (onImport) await onImport();
    };
  }
  
  return overlay;
}

// Deployment Progress Dialog
function showDeploymentProgressDialog(showBothSteps = true) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay deployment-progress-overlay';
  overlay.id = 'deploymentProgressOverlay';
  
  const modal = document.createElement('div');
  modal.className = 'deployment-progress-modal';
  
  modal.innerHTML = `
    <div class="deployment-progress-header">
      <h3>🚀 Deployment in Progress</h3>
    </div>
    <div class="deployment-progress-body">
      <div class="progress-steps">
        <div class="progress-step" id="step-backend" ${showBothSteps ? '' : 'style="display: none;"'}>
          <div class="step-icon">⏳</div>
          <div class="step-content">
            <div class="step-title">Backend</div>
            <div class="step-message" id="backend-message">Waiting...</div>
          </div>
          <div class="step-status" id="backend-status"></div>
        </div>
        <div class="progress-step" id="step-frontend" ${showBothSteps ? '' : 'style="display: none;"'}>
          <div class="step-icon">⏳</div>
          <div class="step-content">
            <div class="step-title">Frontend</div>
            <div class="step-message" id="frontend-message">Waiting...</div>
          </div>
          <div class="step-status" id="frontend-status"></div>
        </div>
      </div>
      <div class="deployment-urls" id="deployment-urls" style="display: none;">
        <div class="url-item">
          <span class="url-label">Visit your site:</span>
          <a href="#" id="frontend-url-link" target="_blank" class="url-link"></a>
        </div>
        <div class="url-item">
          <span class="url-label">Check your backend:</span>
          <a href="#" id="backend-url-link" target="_blank" class="url-link"></a>
        </div>
      </div>
    </div>
    <div class="deployment-progress-footer">
      <button class="btn-primary" id="close-deployment-dialog" style="display: none;">Done</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  return {
    overlay,
    updateBackendStatus: (status, message) => {
      const step = document.getElementById('step-backend');
      const icon = step.querySelector('.step-icon');
      const statusEl = document.getElementById('backend-status');
      const messageEl = document.getElementById('backend-message');
      
      messageEl.textContent = message;
      if (status === 'deploying') {
        icon.textContent = '⏳';
        statusEl.textContent = '';
        step.classList.remove('completed', 'failed');
        step.classList.add('active');
      } else if (status === 'success') {
        icon.textContent = '✅';
        statusEl.textContent = '✓';
        step.classList.remove('active', 'failed');
        step.classList.add('completed');
      } else if (status === 'failed') {
        icon.textContent = '❌';
        statusEl.textContent = '✗';
        step.classList.remove('active', 'completed');
        step.classList.add('failed');
      }
    },
    updateFrontendStatus: (status, message) => {
      const step = document.getElementById('step-frontend');
      const icon = step.querySelector('.step-icon');
      const statusEl = document.getElementById('frontend-status');
      const messageEl = document.getElementById('frontend-message');
      
      messageEl.textContent = message;
      if (status === 'deploying') {
        icon.textContent = '⏳';
        statusEl.textContent = '';
        step.classList.remove('completed', 'failed');
        step.classList.add('active');
      } else if (status === 'success') {
        icon.textContent = '✅';
        statusEl.textContent = '✓';
        step.classList.remove('active', 'failed');
        step.classList.add('completed');
      } else if (status === 'failed') {
        icon.textContent = '❌';
        statusEl.textContent = '✗';
        step.classList.remove('active', 'completed');
        step.classList.add('failed');
      }
    },
    showUrls: (frontendUrl, backendUrl) => {
      const urlsDiv = document.getElementById('deployment-urls');
      const frontendLink = document.getElementById('frontend-url-link');
      const backendLink = document.getElementById('backend-url-link');
      const closeBtn = document.getElementById('close-deployment-dialog');
      
      if (frontendUrl) {
        frontendLink.href = frontendUrl;
        frontendLink.textContent = frontendUrl;
        frontendLink.closest('.url-item').style.display = 'flex';
      } else {
        frontendLink.closest('.url-item').style.display = 'none';
      }
      
      if (backendUrl) {
        backendLink.href = backendUrl;
        backendLink.textContent = backendUrl;
        backendLink.closest('.url-item').style.display = 'flex';
      } else {
        backendLink.closest('.url-item').style.display = 'none';
      }
      
      urlsDiv.style.display = 'block';
      closeBtn.style.display = 'block';
    },
    close: () => {
      const overlay = document.getElementById('deploymentProgressOverlay');
      if (overlay) {
        document.body.removeChild(overlay);
      }
    }
  };
}

function openProjectNameModal() {
  if (!currentProject) {
    showToast('No project selected', 'error');
    return;
  }
  
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'modal-content enhanced';
  
  modal.innerHTML = `
    <div class="project-name-modal-header">
      <h2 class="project-name-modal-title">Change Project Name</h2>
      <p class="project-name-modal-subtitle">
        Update the name for <strong>${escapeHtml(currentProject.name)}</strong>
      </p>
    </div>
    
    <div class="project-name-modal-form-group">
      <label class="project-name-modal-label">Project Name</label>
      <input 
        type="text" 
        id="newProjectNameInput"
        class="project-name-modal-input"
        value="${escapeHtml(currentProject.name)}"
        placeholder="Enter new project name"
      />
    </div>
    
    <div class="project-name-modal-actions">
      <button class="cancel-name-btn">Cancel</button>
      <button class="save-name-btn">Save Changes</button>
    </div>
  `;
  
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Focus input
  const nameInput = document.getElementById('newProjectNameInput');
  if (nameInput) {
    nameInput.focus();
    nameInput.select();
  }
  
  // Event handlers
  const cancelBtn = modal.querySelector('.cancel-name-btn');
  const saveBtn = modal.querySelector('.save-name-btn');
  
  const cleanup = () => {
    document.body.removeChild(overlay);
  };
  
  cancelBtn.onclick = () => {
    cleanup();
  };
  
  saveBtn.onclick = async () => {
    const newName = nameInput.value.trim();
    if (!newName) {
      showToast('Project name cannot be empty', 'error');
      return;
    }
    
    if (newName === currentProject.name) {
      cleanup();
      return;
    }
  
  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
      const response = await fetch(`/projects/${currentProject.id}/name`, {
        method: 'PUT',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`
        },
        body: new URLSearchParams({
          'app_name': newName
        })
    });
      
      const data = await response.json();
    
    if (response.ok) {
        showToast('Project name updated successfully!', 'success');
        currentProject.name = newName;
        cleanup();
        
        // Update the project in allProjects
        const projectIndex = allProjects.findIndex(p => p.id === currentProject.id);
        if (projectIndex >= 0) {
          allProjects[projectIndex].name = newName;
        }
        
        // Refresh UI
        updateProjectConfigValues();
        renderProjects(filteredProjects);
        
        // Update sidebar project name if visible
        const sidebarName = document.getElementById('projectSidebarName');
        if (sidebarName) {
          sidebarName.textContent = newName;
        }
        
        document.getElementById('pageTitle').textContent = newName;
      } else {
        showToast(data.detail || 'Failed to update project name', 'error');
    }
  } catch (error) {
      console.error('Error updating project name:', error);
      showToast('Failed to update project name: ' + error.message, 'error');
    }
  };
  
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      cleanup();
    }
  };
  
  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      cleanup();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
}

function updateProjectConfigValues() {
  if (!currentProject) return;
  
  // Update all configuration values
  const nameEl = document.getElementById('projectConfigName');
  const ownerEl = document.getElementById('projectConfigOwner');
  const idEl = document.getElementById('projectConfigId');
  const createdEl = document.getElementById('projectConfigCreated');
  const updatedEl = document.getElementById('projectConfigUpdated');
  const portsEl = document.getElementById('projectConfigPorts');
  const imageEl = document.getElementById('projectConfigImage');
  const statusEl = document.getElementById('projectConfigStatus');
  
  if (nameEl) nameEl.textContent = currentProject.name || 'Unknown';
  if (ownerEl) {
    // Get user info from localStorage or fetch it
    const username = localStorage.getItem('username');
    const displayName = localStorage.getItem('displayName');
    ownerEl.textContent = displayName || username || 'Unknown User';
  }
  if (idEl) idEl.textContent = currentProject.id || '-';
  if (createdEl) createdEl.textContent = currentProject.createdAt ? formatDateTime(currentProject.createdAt) : 'Unknown';
  if (updatedEl) updatedEl.textContent = currentProject.updatedAt ? getRelativeTime(new Date(currentProject.updatedAt)) : 'Unknown';
  if (portsEl) portsEl.textContent = currentProject.containerPorts ? formatPorts(currentProject.containerPorts) : 'No ports';
  if (imageEl) imageEl.textContent = currentProject.containerImage || 'Unknown';
  if (statusEl) statusEl.textContent = currentProject.containerStatus || 'Unknown';
}

// Copy to clipboard functionality
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    // Show a brief success message
    const copyBtn = event.target.closest('.copy-btn');
    const originalContent = copyBtn.innerHTML;
    copyBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20,6 9,17 4,12"></polyline></svg>';
    setTimeout(() => {
      copyBtn.innerHTML = originalContent;
    }, 1000);
  }).catch(err => {
    console.error('Failed to copy: ', err);
  });
}

function showProjectDomainConfig() {
  // Create project domain configuration page if it doesn't exist
  let domainPage = document.getElementById('page-project-domain');
  if (!domainPage) {
    domainPage = document.createElement('div');
    domainPage.id = 'page-project-domain';
    domainPage.className = 'page';
    domainPage.innerHTML = `
      <div class="card">
        <h2>Domain Configuration</h2>
        <div class="domain-config">
          <div class="config-option">
            <h3>🌐 Use Custom Domain</h3>
            <p>Configure a custom domain for this project</p>
            <div class="form-group">
              <label for="customDomain">Custom Domain</label>
              <input type="text" id="customDomain" placeholder="example.com" />
          </div>
            <button class="btn-primary">Save Domain</button>
            </div>
          <div class="config-option">
            <h3>🏠 Use Localhost</h3>
            <p>Deploy to localhost with dynamic port</p>
            <button class="btn-secondary">Use Localhost</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('pageContent').appendChild(domainPage);
  }
  
  domainPage.style.display = 'block';
}

function openProject(projectId) {
  // This is called when clicking the "Open" button
  selectProject(projectId);
}

// Load user profile into project sidebar
async function loadUserProfileIntoProjectSidebar() {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (!token) {
    console.log('No auth token found');
    return;
  }

  try {
    const response = await fetch('/api/user/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      // Update project sidebar user info
      const projectSidebar = document.getElementById('projectSidebar');
      if (projectSidebar) {
        const userName = projectSidebar.querySelector('#projectSidebarUserName');
        const userEmail = projectSidebar.querySelector('#projectSidebarUserEmail');
        const userAvatar = projectSidebar.querySelector('#projectSidebarUserAvatar');
        
        if (userName) {
          userName.textContent = data.display_name || data.username || 'User';
        }
        
        if (userEmail) {
          userEmail.textContent = data.email || 'No email';
        }
        
        if (userAvatar) {
          if (data.avatar_url) {
            // Test if the avatar URL is valid before setting it
            const img = new Image();
            img.onload = () => {
              userAvatar.style.backgroundImage = `url(${data.avatar_url})`;
              userAvatar.style.backgroundSize = 'cover';
              userAvatar.style.backgroundPosition = 'center';
              userAvatar.textContent = '';
            };
            img.onerror = () => {
              // Avatar failed to load, fall back to initials
              userAvatar.style.backgroundImage = '';
              userAvatar.textContent = (data.display_name || data.username || 'U').charAt(0).toUpperCase();
            };
            img.src = data.avatar_url;
  } else {
            userAvatar.style.backgroundImage = '';
            userAvatar.textContent = (data.display_name || data.username || 'U').charAt(0).toUpperCase();
          }
        }
      }
  } else {
      console.error('Failed to load user profile:', response.status);
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
}

function getRelativeTime(timestamp) {
  if (!timestamp) return 'Recently';
  
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  // For older dates, show formatted date
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });
}

function formatDateTime(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kathmandu'
  });
}

function formatPorts(portsString) {
  if (!portsString || portsString === 'No ports') return 'No ports';
  
  // Parse Docker port format: "0.0.0.0:8080->8080/tcp" or "0.0.0.0:8080->8080/tcp, [::]:8080->8080/tcp"
  // Extract host:container port mappings
  const portMappings = new Set();
  
  // Match pattern like "8080->8080" or extract host port before the arrow
  const parts = portsString.split(',');
  
  parts.forEach(part => {
    // Extract port mapping using regex
    // Match patterns like: "0.0.0.0:8080->8080/tcp" or just "8080->8080"
    const match = part.match(/(\d+)->(\d+)/);
    if (match) {
      const hostPort = match[1];
      const containerPort = match[2];
      portMappings.add(`${hostPort}:${containerPort}`);
    }
  });
  
  if (portMappings.size === 0) return portsString; // Return original if can't parse
  
  // Return formatted ports, sorted and joined
  return Array.from(portMappings).sort().join(', ');
}

// Legacy loadDashboard for compatibility
async function loadDashboard() {
  await loadProjects();

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
        recentActivity.innerHTML = deployments.slice(0, 5).map(dep => {
          const projectName = dep.app_name || dep.container_name || 'Untitled Project';
          return `
          <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500; color: var(--text-primary); margin-bottom: 0.25rem;">${escapeHtml(projectName)}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${new Date(dep.created_at).toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' })}
            </div>
          </div>
        `;
        }).join('');
  } else {
        recentActivity.innerHTML = '<p class="recent-activity-empty">No recent activity</p>';
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
    // If deploying from a selected project, include its id to update in-place
    if (typeof currentProject === 'object' && currentProject && currentProject.id) {
      formData.append('project_id', String(currentProject.id));
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
      
      // For split repos, refresh components and stay on deploy page
      if (currentProject && currentProject.isSplit) {
        setTimeout(() => {
          loadAndDisplayProjectComponents();
          loadDashboard();
        }, 1500);
      } else {
        setTimeout(() => {
          loadDashboard();
          router.navigate('/applications');
        }, 2000);
      }
      } else {
      deployStatus.textContent = `❌ Error: ${result.detail || 'Deployment failed'}`;
      deployStatus.style.color = 'var(--error)';
    }
  } catch (error) {
    deployStatus.textContent = '❌ Network error. Please try again.';
    deployStatus.style.color = 'var(--error)';
  }
}

// Helper to deploy a single repository (used by split projects' individual buttons)
async function deploySingle(repoUrl, componentType = null, progressDialog = null, returnResult = false) {
  const deployStatus = document.getElementById('deploy-status');
  const deploySuccess = document.getElementById('deploy-success');
  if (!authToken) {
    showToast('Please login to deploy applications', 'error');
    window.location.href = '/login';
    if (returnResult) return { success: false, error: 'Not authenticated' };
    return;
  }
  
  // Only update status elements if not using progress dialog
  if (!progressDialog) {
    if (deploySuccess) deploySuccess.style.display = 'none';
    if (deployStatus) {
      deployStatus.textContent = '';
      deployStatus.style.color = 'var(--primary)';
    }
  }
  
  try {
    const formData = new FormData();
    formData.append('deploy_type', 'single');
    formData.append('git_url', repoUrl);
    if (typeof currentProject === 'object' && currentProject && currentProject.id) {
      formData.append('project_id', String(currentProject.id));
    }
    // If deploying a component of a split repo, include the component_type
    if (componentType && typeof currentProject === 'object' && currentProject && currentProject.project_type === 'split') {
      formData.append('component_type', componentType);
    }
    
    const response = await fetch('/deploy', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Update progress dialog if provided
      if (progressDialog) {
        const status = 'success';
        const message = componentType === 'backend' 
          ? 'Backend complete! ✅' 
          : 'Frontend complete! ✅';
        
        if (componentType === 'backend') {
          progressDialog.updateBackendStatus(status, message);
        } else if (componentType === 'frontend') {
          progressDialog.updateFrontendStatus(status, message);
        }
      } else {
        // Update status elements if no dialog
        if (deployStatus) {
          deployStatus.textContent = '✅ Deployment successful!';
          deployStatus.style.color = 'var(--success)';
        }
        if (result.deployed_url && deploySuccess) {
          deploySuccess.style.display = 'block';
          const openBtn = document.getElementById('openAppBtn');
          if (openBtn) {
            openBtn.href = result.deployed_url;
            openBtn.textContent = `Open ${result.deployed_url}`;
          }
        }
      }
      
      // If returning result for sequential deployment
      if (returnResult) {
        return { success: true, deployed_url: result.deployed_url };
      }
      
      // For split repos, refresh components and stay on deploy page
      if (currentProject && currentProject.isSplit) {
        setTimeout(() => {
          loadAndDisplayProjectComponents();
          loadDashboard();
        }, 1500);
      } else {
        setTimeout(() => {
          loadDashboard();
          router.navigate('/applications');
        }, 2000);
      }
      
      return { success: true, deployed_url: result.deployed_url };
    } else {
      const errorMsg = result.detail || 'Deployment failed';
      
      if (progressDialog) {
        const status = 'failed';
        const message = `Error: ${errorMsg}`;
        if (componentType === 'backend') {
          progressDialog.updateBackendStatus(status, message);
        } else if (componentType === 'frontend') {
          progressDialog.updateFrontendStatus(status, message);
        }
      } else {
        if (deployStatus) {
          deployStatus.textContent = `❌ Error: ${errorMsg}`;
          deployStatus.style.color = 'var(--error)';
        }
      }
      
      if (returnResult) {
        return { success: false, error: errorMsg };
      }
    }
  } catch (error) {
    const errorMsg = 'Network error. Please try again.';
    
    if (progressDialog) {
      const status = 'failed';
      const message = errorMsg;
      if (componentType === 'backend') {
        progressDialog.updateBackendStatus(status, message);
      } else if (componentType === 'frontend') {
        progressDialog.updateFrontendStatus(status, message);
      }
    } else {
      if (deployStatus) {
        deployStatus.textContent = `❌ ${errorMsg}`;
        deployStatus.style.color = 'var(--error)';
      }
    }
    
    if (returnResult) {
      return { success: false, error: errorMsg };
    }
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
        grid.innerHTML = deployments.map(dep => {
          const projectName = dep.app_name || dep.container_name || 'Untitled Project';
          return `
          <div class="application-card" onclick="window.open('${dep.deployed_url || '#'}', '_blank')">
            <h3>${escapeHtml(projectName)}</h3>
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
        `;
        }).join('');
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
        <td colspan="4" class="empty-state">Please login to view deployment history</td>
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
            <td colspan="4" class="empty-state">No deployment history</td>
          </tr>
        `;
      } else {
        tbody.innerHTML = deployments.map(dep => {
          // Use app_name (project name) if available, otherwise fall back to container_name
          const projectName = dep.app_name || dep.container_name || 'Untitled Project';
          return `
          <tr>
            <td><strong>${escapeHtml(projectName)}</strong></td>
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
            <td>${new Date(dep.created_at).toLocaleString('en-US', { timeZone: 'Asia/Kathmandu' })}</td>
          </tr>
        `;
        }).join('');
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
// Track selected repositories for split import
let selectedRepositories = [];
let lastRepoUsername = '';

async function searchRepositories() {
  const username = document.getElementById('usernameSearch').value.trim();
  
  if (!username) {
        showToast('Please enter a GitHub username', 'error');
        return;
    }
    
  // Reset selection only when searching a different username
  if (username !== lastRepoUsername) {
    selectedRepositories = [];
    lastRepoUsername = username;
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
        grid.innerHTML = data.repositories.map(repo => {
          const isSelected = selectedRepositories.some(r => r.url === repo.clone_url);
          return `
          <div class="repository-card ${isSelected ? 'selected' : ''}" data-repo-url="${repo.clone_url}" onclick="toggleRepositorySelection('${repo.clone_url}', '${repo.name}')">
            <h3>${repo.name}</h3>
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">
              ${repo.description || 'No description'}
            </p>
            <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.875rem; color: var(--text-secondary);">
                ${repo.language || 'Unknown'} • ${repo.stargazers_count || 0} stars
              </span>
              <button class="btn-primary btn-small" onclick="event.stopPropagation(); importRepository('${repo.clone_url}', '${repo.name}')">
                📥 Import
              </button>
            </div>
        </div>
        `;
        }).join('');
        
        // Update visuals after initial render
        updateRepositorySelectionVisuals();
      }
    } else {
      grid.innerHTML = `<div class="empty-state"><p>${data.detail || 'Error loading repositories'}</p></div>`;
        }
    } catch (error) {
    grid.innerHTML = '<div class="empty-state"><p>Error loading repositories</p></div>';
  }
}

function toggleRepositorySelection(url, name) {
  const existing = selectedRepositories.findIndex(r => r.url === url);
  
  if (existing >= 0) {
    // Deselect
    selectedRepositories.splice(existing, 1);
    updateRepositorySelectionVisuals();
  } else {
    // Select (max 2 for split repo)
    if (selectedRepositories.length >= 2) {
      showToast('You can only select up to 2 repositories for a split repository', 'error');
      return;
    }
    selectedRepositories.push({ url, name });
    
    // Show dialog when 2nd repo is selected
    if (selectedRepositories.length === 2) {
      showSplitImportDialog();
    }
    
    // Update visual state without full re-render
    updateRepositorySelectionVisuals();
  }
}

function showSplitImportDialog() {
  const [frontend, backend] = selectedRepositories;
  
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'splitImportModal';
  // Create modal content
  const modal = document.createElement('div');
  modal.className = 'modal-content enhanced';
  
  modal.innerHTML = `
    <div class="split-import-modal-center">
      <div class="split-import-icon-wrapper">
        📦
      </div>
      <h2 class="split-import-modal-title">Import as Multi-Repository?</h2>
      <p class="split-import-modal-text">
        This will create a multi-repository project with frontend and backend components.
      </p>
    </div>
    
    <div class="split-import-repo-info">
      <div class="split-import-repo-item">
        <div class="split-import-repo-label">Frontend</div>
        <div class="split-import-repo-name">${escapeHtml(frontend.name)}</div>
        <div class="split-import-repo-url">${escapeHtml(frontend.url)}</div>
      </div>
      
      <div class="split-import-divider"></div>
      
      <div class="split-import-repo-item">
        <div class="split-import-repo-label">Backend</div>
        <div class="split-import-repo-name">${escapeHtml(backend.name)}</div>
        <div class="split-import-repo-url">${escapeHtml(backend.url)}</div>
      </div>
    </div>
    
    <div class="split-import-actions">
      <button class="cancel-btn">Cancel</button>
      <button class="confirm-btn">Import Multi-Repository</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  // Event handlers
  const cancelBtn = modal.querySelector('.cancel-btn');
  const confirmBtn = modal.querySelector('.confirm-btn');
  
  const cleanup = () => {
    document.body.removeChild(overlay);
  };
  
  cancelBtn.onclick = () => {
    cleanup();
  };
  
  confirmBtn.onclick = () => {
    cleanup();
    const [frontend, backend] = selectedRepositories;
    importSplitRepositories(frontend.url, backend.url, `${frontend.name}-${backend.name}`);
  };
  
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      cleanup();
    }
  };
  
  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      cleanup();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);
  
  // Focus confirm button for keyboard navigation
  confirmBtn.focus();
}

function updateRepositorySelectionVisuals() {
  const grid = document.getElementById('repositoriesGrid');
  if (!grid) return;
  
  // Update all cards
  const cards = grid.querySelectorAll('.repository-card');
  cards.forEach(card => {
    const repoUrl = card.getAttribute('data-repo-url');
    const isSelected = selectedRepositories.some(r => r.url === repoUrl);
    
    if (isSelected) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

function confirmSplitImport() {
  if (selectedRepositories.length !== 2) {
    showToast('Please select exactly 2 repositories', 'error');
    return;
  }
  
  const [frontend, backend] = selectedRepositories;
  
  // Show confirmation dialog
  const confirmed = confirm(
    `Import as Multi-Repository?\n\n` +
    `Frontend: ${frontend.name}\n` +
    `Backend: ${backend.name}\n\n` +
    `Click OK to import these repositories as a multi-repository project.`
  );
  
  if (confirmed) {
    importSplitRepositories(frontend.url, backend.url, `${frontend.name}-${backend.name}`);
  }
}

async function importSplitRepositories(frontendUrl, backendUrl, projectName) {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (!token) {
    showToast('Please login first', 'error');
      return;
    }
    
  try {
    showToast('Importing multi-repositories...', 'info');
    
    const response = await fetch('/api/import-split', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`
      },
      body: new URLSearchParams({
        'frontend_url': frontendUrl,
        'backend_url': backendUrl,
        'app_name': projectName
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showToast('Multi-repository imported successfully! Navigate to Projects to see it.', 'success');
      selectedRepositories = []; // Clear selection
      
      // Reload projects if on projects page
      const projectsPage = document.getElementById('page-projects');
      if (projectsPage && projectsPage.style.display !== 'none') {
        loadProjects();
      }
      
      // Refresh repository grid
      const username = document.getElementById('usernameSearch').value.trim();
      if (username) {
        searchRepositories();
      }
    } else {
      showToast(data.detail || 'Failed to import multi-repository', 'error');
    }
  } catch (error) {
    console.error('Error importing multi-repositories:', error);
    showToast('Failed to import multi-repository: ' + error.message, 'error');
  }
}

function selectRepository(repoUrl) {
  document.getElementById('git-url').value = repoUrl;
  router.navigate('/deploy');
  showToast('Repository selected', 'success');
}

// Import repository as a project
async function importRepository(repoUrl, repoName) {
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (!token) {
    showToast('Please login first', 'error');
    return;
  }
  
  try {
    showToast('Importing repository...', 'info');
    
    // Import repository without deploying
    const response = await fetch('/api/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${token}`
      },
      body: new URLSearchParams({
        'git_url': repoUrl,
        'app_name': repoName || repoUrl.split('/').pop() || 'Untitled Project'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showToast('Repository imported successfully! Navigate to Projects to see it.', 'success');
      
      // Reload projects if on projects page
      const projectsPage = document.getElementById('page-projects');
      if (projectsPage && projectsPage.style.display !== 'none') {
        loadProjects();
      }
    } else {
      showToast(data.detail || 'Failed to import repository', 'error');
    }
  } catch (error) {
    console.error('Error importing repository:', error);
    showToast('Failed to import repository: ' + error.message, 'error');
  }
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
    
    // Require current project (no switching allowed)
    if (!currentProject || !currentProject.id) {
      const container = document.getElementById('envVarsList');
      if (container) {
        container.innerHTML = `
          <div class="empty-state">
            <p>Please select a project from the Projects page to manage environment variables</p>
          </div>
        `;
      }
      setupEnvVarsListeners();
      return;
    }
    
    const response = await fetch(`/api/env-vars?project_id=${currentProject.id}`, {
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
  const dropZone = document.getElementById('envDropZone');
  const fileInput = document.getElementById('envFileInput');
  const browseLink = document.getElementById('envDropZoneBrowse');
  const fileNameLabel = document.getElementById('envDropZoneFileName');
  
  if (importBtn) {
    importBtn.onclick = () => {
      importCard.style.display = importCard.style.display === 'none' ? 'block' : 'none';
    };
  }
  
  if (cancelImportBtn) {
    cancelImportBtn.onclick = () => {
      importCard.style.display = 'none';
      if (fileInput) {
        fileInput.value = '';
      }
      if (fileNameLabel) {
        fileNameLabel.textContent = '';
        fileNameLabel.style.display = 'none';
      }
    };
  }
  
  if (addBtn) {
    addBtn.onclick = () => {
      addEnvVarRow();
    };
  }
  
  if (fileInput) {
    fileInput.onchange = (event) => {
      const file = event.target.files?.[0];
      if (fileNameLabel) {
        if (file) {
          fileNameLabel.textContent = file.name;
          fileNameLabel.style.display = 'block';
        } else {
          fileNameLabel.textContent = '';
          fileNameLabel.style.display = 'none';
        }
      }
    };
  }

  if (dropZone && fileInput && !dropZone.dataset.bound) {
    dropZone.dataset.bound = 'true';

    const preventDefaults = (event) => {
      event.preventDefault();
      event.stopPropagation();
    };

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (event) => {
        preventDefaults(event);
        dropZone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'dragend'].forEach(eventName => {
      dropZone.addEventListener(eventName, (event) => {
        preventDefaults(event);
        dropZone.classList.remove('is-dragover');
      });
    });

    dropZone.addEventListener('dragover', (event) => {
      preventDefaults(event);
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
      dropZone.classList.add('is-dragover');
    });

    dropZone.addEventListener('drop', async (event) => {
      preventDefaults(event);
      dropZone.classList.remove('is-dragover');
      const files = event.dataTransfer?.files;
      if (!files || !files.length) {
        return;
      }

      const [file] = files;
      if (fileNameLabel) {
        fileNameLabel.textContent = file.name;
        fileNameLabel.style.display = 'block';
      }

       // Mirror the dropped file into the hidden input so manual import flow stays in sync
      if (fileInput) {
        try {
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;
        } catch (error) {
          console.warn('Unable to sync dropped file with input element:', error);
        }
      }

      try {
        await importEnvFile(file);
      } catch (error) {
        console.error('Error importing dropped .env file:', error);
      }
    });

    dropZone.addEventListener('click', () => {
      fileInput.click();
    });

    if (browseLink) {
      browseLink.addEventListener('click', (event) => {
        event.preventDefault();
        fileInput.click();
      });
    }
  }

  if (importForm) {
    importForm.onsubmit = async (e) => {
      e.preventDefault();
      const file = fileInput?.files?.[0];
      if (file) {
        await importEnvFile(file);
      }
    };
  }
}

async function importEnvFile(file) {
  try {
    if (!file) {
      showToast('No file detected for import', 'error');
      return;
    }

    showToast(`Importing ${file.name || '.env'}...`, 'info');

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
    const fileNameLabel = document.getElementById('envDropZoneFileName');
    if (fileNameLabel) {
      fileNameLabel.textContent = '';
      fileNameLabel.style.display = 'none';
    }
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
          ? new Date(item.updated_at).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
              timeZone: 'Asia/Kathmandu'
            })
          : 'Never updated';
          const projectBadge = item.project_id 
            ? `<span style="font-size: 0.75rem; background: var(--primary); color: white; padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Project</span>`
            : `<span style="font-size: 0.75rem; background: var(--bg-tertiary); color: var(--text-secondary); padding: 0.125rem 0.5rem; border-radius: 4px; margin-left: 0.5rem;">Global</span>`;
          return `
            <tr>
              <td class="name-col">
                <span class="lock-icon">🔒</span>
                <span class="var-name">${escapeHtml(item.key)}</span>
                ${projectBadge}
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
    
    // Require current project
    if (!currentProject || !currentProject.id) {
      showToast('No project selected', 'error');
      return;
    }
    
    const response = await fetch('/api/env-vars', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        variables: envVars,
        project_id: currentProject.id
      })
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
      
      // Store user info in localStorage for use in other parts of the app
      localStorage.setItem('displayName', data.display_name || '');
      localStorage.setItem('userEmail', data.email || '');
      
      // Show display name if available, otherwise username
      if (userName) {
        userName.textContent = data.display_name || data.username || 'User';
      }
      
      // Update team name and project owner information
      updateTeamAndOwnerInfo(data.display_name || data.username || 'User');
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
      const usernameInput = document.getElementById('username');
      const emailInput = document.getElementById('email');
      const displayNameInput = document.getElementById('displayName');
      
      if (usernameInput) usernameInput.value = data.username || '';
      if (emailInput) emailInput.value = data.email || '';
      if (displayNameInput) displayNameInput.value = data.display_name || '';
      
      // Load avatar
      const avatarPreview = document.getElementById('avatarPreview');
      const avatarInitial = document.getElementById('avatarInitial');
      const removeAvatarBtn = document.getElementById('removeAvatarBtn');
      
      if (data.avatar_url && avatarPreview) {
        avatarPreview.src = data.avatar_url;
        avatarPreview.style.display = 'block';
        if (avatarInitial) avatarInitial.style.display = 'none';
        if (removeAvatarBtn) removeAvatarBtn.style.display = 'block';
      } else if (avatarInitial) {
        // Show initial based on display name or username
        const initial = (data.display_name && data.display_name.charAt(0).toUpperCase()) || 
                       (data.username && data.username.charAt(0).toUpperCase()) || 'S';
        avatarInitial.textContent = initial;
        avatarInitial.style.display = 'block';
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
  
  // Password modal handlers
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const closePasswordModal = document.getElementById('closePasswordModal');
  const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
  const updatePasswordBtn = document.getElementById('updatePasswordBtn');
  const passwordModal = document.getElementById('passwordModal');
  const modalNewPassword = document.getElementById('modalNewPassword');
  const strengthFill = document.getElementById('strengthFill');
  
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', () => {
      if (passwordModal) {
        passwordModal.style.display = 'flex';
      }
    });
  }
  
  if (closePasswordModal) {
    closePasswordModal.addEventListener('click', () => {
      if (passwordModal) {
        passwordModal.style.display = 'none';
      }
    });
  }
  
  if (cancelPasswordBtn) {
    cancelPasswordBtn.addEventListener('click', () => {
      if (passwordModal) {
        passwordModal.style.display = 'none';
      }
    });
  }
  
  // Close modal when clicking outside
  if (passwordModal) {
    passwordModal.addEventListener('click', (e) => {
      if (e.target === passwordModal) {
        passwordModal.style.display = 'none';
      }
    });
  }
  
  // Password strength indicator
  if (modalNewPassword) {
    modalNewPassword.addEventListener('input', (e) => {
      const password = e.target.value;
      let strength = 0;
      
      if (password.length >= 8) strength += 25;
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
      if (/\d/.test(password)) strength += 25;
      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 25;
      
      if (strengthFill) {
        strengthFill.style.width = `${strength}%`;
        if (strength < 50) {
          strengthFill.style.background = '#ef4444';
        } else if (strength < 75) {
          strengthFill.style.background = '#f59e0b';
        } else {
          strengthFill.style.background = '#10b981';
        }
      }
    });
  }
  
  // Update password handler
  if (updatePasswordBtn) {
    updatePasswordBtn.addEventListener('click', handlePasswordUpdate);
  }
  
  // Cancel profile changes
  const cancelProfileBtn = document.getElementById('cancelProfileBtn');
  if (cancelProfileBtn) {
    cancelProfileBtn.addEventListener('click', async () => {
      await loadSettings(); // Reload original values
    });
  }
}

async function handlePasswordUpdate() {
  const modalCurrentPassword = document.getElementById('modalCurrentPassword');
  const modalNewPassword = document.getElementById('modalNewPassword');
  const modalConfirmPassword = document.getElementById('modalConfirmPassword');
  const passwordModal = document.getElementById('passwordModal');
  
  if (!modalCurrentPassword || !modalNewPassword || !modalConfirmPassword) {
    return;
  }
  
  const currentPassword = modalCurrentPassword.value;
  const newPassword = modalNewPassword.value;
  const confirmPassword = modalConfirmPassword.value;
  
  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast('Please fill in all password fields', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showToast('New passwords do not match', 'error');
    return;
  }
  
  if (newPassword.length < 8) {
    showToast('Password must be at least 8 characters', 'error');
    return;
  }
  
  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    const formData = new FormData();
    formData.append('current_password', currentPassword);
    formData.append('new_password', newPassword);
    
    const response = await fetch('/api/user/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showToast('Password updated successfully!', 'success');
      if (passwordModal) {
        passwordModal.style.display = 'none';
      }
      modalCurrentPassword.value = '';
      modalNewPassword.value = '';
      modalConfirmPassword.value = '';
      const strengthFill = document.getElementById('strengthFill');
      if (strengthFill) {
        strengthFill.style.width = '0%';
      }
    } else {
      showToast(data.detail || data.message || 'Failed to update password', 'error');
    }
  } catch (error) {
    console.error('Error updating password:', error);
    showToast('Network error. Please try again.', 'error');
  }
}

function handleAvatarPreview(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const avatarPreview = document.getElementById('avatarPreview');
      const avatarInitial = document.getElementById('avatarInitial');
      if (avatarPreview) {
        avatarPreview.src = event.target.result;
        avatarPreview.style.display = 'block';
      }
      if (avatarInitial) {
        avatarInitial.style.display = 'none';
      }
      const removeAvatarBtn = document.getElementById('removeAvatarBtn');
      if (removeAvatarBtn) {
        removeAvatarBtn.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);
  }
}

function handleRemoveAvatar() {
  const avatarPreview = document.getElementById('avatarPreview');
  const avatarInitial = document.getElementById('avatarInitial');
  if (avatarPreview) {
    avatarPreview.src = '';
    avatarPreview.style.display = 'none';
  }
  if (avatarInitial) {
    avatarInitial.style.display = 'block';
  }
  const removeAvatarBtn = document.getElementById('removeAvatarBtn');
  if (removeAvatarBtn) {
    removeAvatarBtn.style.display = 'none';
  }
  const avatarFile = document.getElementById('avatarFile');
  if (avatarFile) {
    avatarFile.value = '';
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  
  const messageDiv = document.getElementById('profileMessage');
  if (messageDiv) {
    messageDiv.style.display = 'none';
  }
  
  const formData = new FormData();
  const emailInput = document.getElementById('email');
  const displayNameInput = document.getElementById('displayName');
  
  if (emailInput) formData.append('email', emailInput.value);
  if (displayNameInput) formData.append('display_name', displayNameInput.value);
  
  const avatarFile = document.getElementById('avatarFile');
  if (avatarFile && avatarFile.files[0]) {
    formData.append('avatar', avatarFile.files[0]);
  }
  
  // Handle avatar removal
  const avatarPreview = document.getElementById('avatarPreview');
  if (avatarPreview && avatarPreview.style.display === 'none') {
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
      if (messageDiv) {
        messageDiv.textContent = 'Profile updated successfully!';
        messageDiv.className = 'profile-message success';
        messageDiv.style.display = 'block';
      }
      
      // Update localStorage if username changed
      if (data.username) {
        localStorage.setItem('username', data.username);
      }
      
      // Reload user profile in sidebar
      await loadUserProfile();
      
      showToast('Profile updated successfully!', 'success');
    } else {
      const errorText = data.detail || data.message || 'Failed to update profile';
      if (messageDiv) {
        messageDiv.textContent = errorText;
        messageDiv.className = 'profile-message error';
        messageDiv.style.display = 'block';
      }
      showToast(errorText, 'error');
      console.error('Profile update failed:', data);
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    if (messageDiv) {
      messageDiv.textContent = 'Network error. Please try again.';
      messageDiv.className = 'profile-message error';
      messageDiv.style.display = 'block';
    }
    showToast('Network error. Please try again.', 'error');
  }
}

// Make functions globally available
window.destroyDeployment = destroyDeployment;
window.selectRepository = selectRepository;
window.importRepository = importRepository;
window.editEnvVar = editEnvVar;
window.deleteEnvVar = deleteEnvVar;
window.toggleEnvVarVisibility = toggleEnvVarVisibility;
window.saveEnvVarFromModal = saveEnvVarFromModal;
window.closeEnvVarModal = closeEnvVarModal;
window.toggleModalValueVisibility = toggleModalValueVisibility;
window.editEnvVarModal = editEnvVarModal;
window.showEnvVarModal = showEnvVarModal;

// Project-specific functions
window.selectProject = selectProject;
window.showProjectSidebar = showProjectSidebar;
window.hideProjectSidebar = hideProjectSidebar;
window.openProject = openProject;
window.loadUserProfileIntoProjectSidebar = loadUserProfileIntoProjectSidebar;
window.openProjectSite = openProjectSite;
window.deleteProject = deleteProject;
window.toggleRepositorySelection = toggleRepositorySelection;
window.confirmSplitImport = confirmSplitImport;
window.openProjectNameModal = openProjectNameModal;
window.openSite = openSite;

function updateTeamAndOwnerInfo(userName) {
  // Update team name in sidebar
  const teamNameEl = document.getElementById('teamName');
  if (teamNameEl) {
    teamNameEl.textContent = `${userName}'s team`;
  }
  
  // Update all project owner references
  const projectOwners = document.querySelectorAll('.project-owner');
  projectOwners.forEach(owner => {
    owner.textContent = `${userName}'s team`;
  });
}

// Logs Page with WebSocket
let logsWebSocket = null;
let logsPaused = false;
let logsBuffer = [];

function parseLogPayload(rawMessage) {
  if (rawMessage == null) {
    return null;
  }

  if (typeof rawMessage !== 'string') {
    return rawMessage;
  }

  const trimmed = rawMessage.trim();
  if (!trimmed) {
    return null;
  }

  const firstBraceIndex = trimmed.indexOf('{');
  if (firstBraceIndex === -1) {
    return { message: trimmed };
  }

  const candidate = trimmed.slice(firstBraceIndex);

  try {
    return JSON.parse(candidate);
  } catch (_) {
    return { message: trimmed };
  }
}

function loadLogs() {
  const logsContent = document.getElementById('logsContent');
  if (!logsContent) return;
  
  // Initialize logs display
  logsContent.innerHTML = '<p class="logs-connecting">Connecting to WebSocket...</p>';
  
  // Connect to WebSocket
  connectLogsWebSocket();
  
  // Setup button handlers
  setupLogsButtons();
}

function connectLogsWebSocket() {
  // Close existing connection if any
  if (logsWebSocket) {
    logsWebSocket.close();
  }
  
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws/logs`;
  
  logsWebSocket = new WebSocket(wsUrl);
  
  logsWebSocket.onopen = () => {
    console.log('Logs WebSocket connected');
    appendLog('Connected to logs stream', 'success');
    
    // Send any buffered logs
    if (logsBuffer.length > 0) {
      logsBuffer.forEach(log => appendLog(log.message, log.type));
      logsBuffer = [];
    }
  };
  
  logsWebSocket.onmessage = (event) => {
    const data = parseLogPayload(event.data);
    if (!data || !data.message) {
      return;
    }

    if (logsPaused) {
      // Buffer logs when paused
      logsBuffer.push({ message: data.message, type: data.type || 'info' });
    } else {
      appendLog(data.message, data.type || 'info');
    }
  };
  
  logsWebSocket.onerror = (error) => {
    console.error('Logs WebSocket error:', error);
    appendLog('WebSocket connection error', 'error');
  };
  
  logsWebSocket.onclose = () => {
    console.log('Logs WebSocket disconnected');
    appendLog('Disconnected from logs stream', 'warning');
    
    // Try to reconnect after 3 seconds
    setTimeout(() => {
      if (document.getElementById('page-logs')?.style.display !== 'none') {
        connectLogsWebSocket();
      }
    }, 3000);
  };
}

function appendLog(message, type = 'info') {
  const logsContent = document.getElementById('logsContent');
  if (!logsContent) return;
  
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kathmandu',
    timeStyle: 'medium',
    dateStyle: 'short'
  });
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${type}`;
  
  logEntry.innerHTML = `
    <span class="log-timestamp">[${timestamp}]</span>
    <span class="log-message">${escapeHtml(message)}</span>
  `;
  
  logsContent.appendChild(logEntry);
  
  // Auto-scroll to bottom
  logsContent.scrollTop = logsContent.scrollHeight;
  
  // Limit log entries to prevent memory issues
  const maxLogs = 1000;
  const logs = logsContent.querySelectorAll('.log-entry');
  if (logs.length > maxLogs) {
    logs[0].remove();
  }
}

function setupLogsButtons() {
  const clearLogsBtn = document.getElementById('clearLogsBtn');
  const toggleLogsBtn = document.getElementById('toggleLogsBtn');
  
  if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', () => {
      const logsContent = document.getElementById('logsContent');
      if (logsContent) {
        logsContent.innerHTML = '';
        logsBuffer = [];
        appendLog('Logs cleared', 'info');
      }
    });
  }
  
  if (toggleLogsBtn) {
    toggleLogsBtn.addEventListener('click', () => {
      logsPaused = !logsPaused;
      toggleLogsBtn.textContent = logsPaused ? 'Resume' : 'Pause';
      
      if (!logsPaused && logsBuffer.length > 0) {
        logsBuffer.forEach(log => appendLog(log.message, log.type));
        logsBuffer = [];
      }
      
      appendLog(logsPaused ? 'Logs paused' : 'Logs resumed', 'info');
    });
  }
}

// Project-specific logs WebSocket
let projectLogsWebSocket = null;
let projectLogsPaused = false;
let projectLogsBuffer = [];

function connectProjectLogsWebSocket(projectId) {
  // Close existing connection if any
  if (projectLogsWebSocket) {
    projectLogsWebSocket.close();
  }
  
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws/project/${projectId}/logs`;
  
  projectLogsWebSocket = new WebSocket(wsUrl);
  
  projectLogsWebSocket.onopen = () => {
    console.log(`Project logs WebSocket connected for project ${projectId}`);
    appendProjectLog('Connected to container logs stream', 'success');
    
    // Send any buffered logs
    if (projectLogsBuffer.length > 0) {
      projectLogsBuffer.forEach(log => appendProjectLog(log.message, log.type));
      projectLogsBuffer = [];
    }
    
    // Setup button handlers
    setupProjectLogsButtons();
  };
  
  projectLogsWebSocket.onmessage = (event) => {
    const data = parseLogPayload(event.data);
    if (!data || !data.message) {
      return;
    }

    if (projectLogsPaused) {
      // Buffer logs when paused
      projectLogsBuffer.push({ message: data.message, type: data.type || 'info' });
    } else {
      appendProjectLog(data.message, data.type || 'info');
    }
  };
  
  projectLogsWebSocket.onerror = (error) => {
    console.error('Project logs WebSocket error:', error);
    appendProjectLog('WebSocket connection error', 'error');
  };
  
  projectLogsWebSocket.onclose = () => {
    console.log('Project logs WebSocket disconnected');
    appendProjectLog('Disconnected from logs stream', 'warning');
    
    // Try to reconnect after 3 seconds
    setTimeout(() => {
      const logsPage = document.getElementById('page-project-logs');
      if (logsPage && logsPage.style.display !== 'none' && currentProject) {
        connectProjectLogsWebSocket(currentProject.id);
      }
    }, 3000);
  };
}

function appendProjectLog(message, type = 'info') {
  const logsContent = document.getElementById('projectLogsContent');
  if (!logsContent) return;
  
  const timestamp = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Kathmandu',
    timeStyle: 'medium',
    dateStyle: 'short'
  });
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry ${type}`;
  
  logEntry.innerHTML = `
    <span class="log-timestamp">[${timestamp}]</span>
    <span class="log-message">${escapeHtml(message)}</span>
  `;
  
  logsContent.appendChild(logEntry);
  
  // Auto-scroll to bottom
  logsContent.scrollTop = logsContent.scrollHeight;
  
  // Limit log entries to prevent memory issues
  const maxLogs = 1000;
  const logs = logsContent.querySelectorAll('.log-entry');
  if (logs.length > maxLogs) {
    logs[0].remove();
  }
}

function setupProjectLogsButtons() {
  const clearLogsBtn = document.getElementById('clearProjectLogsBtn');
  const toggleLogsBtn = document.getElementById('toggleProjectLogsBtn');
  
  if (clearLogsBtn) {
    // Remove existing listeners
    clearLogsBtn.replaceWith(clearLogsBtn.cloneNode(true));
    const newClearBtn = document.getElementById('clearProjectLogsBtn');
    newClearBtn.addEventListener('click', () => {
      const logsContent = document.getElementById('projectLogsContent');
      if (logsContent) {
        logsContent.innerHTML = '';
        projectLogsBuffer = [];
        appendProjectLog('Logs cleared', 'info');
      }
    });
  }
  
  if (toggleLogsBtn) {
    // Remove existing listeners
    toggleLogsBtn.replaceWith(toggleLogsBtn.cloneNode(true));
    const newToggleBtn = document.getElementById('toggleProjectLogsBtn');
    newToggleBtn.addEventListener('click', () => {
      projectLogsPaused = !projectLogsPaused;
      newToggleBtn.textContent = projectLogsPaused ? 'Resume' : 'Pause';
      
      if (!projectLogsPaused && projectLogsBuffer.length > 0) {
        projectLogsBuffer.forEach(log => appendProjectLog(log.message, log.type));
        projectLogsBuffer = [];
      }
      
      appendProjectLog(projectLogsPaused ? 'Logs paused' : 'Logs resumed', 'info');
    });
  }
}

// Cleanup WebSocket when navigating away
window.addEventListener('beforeunload', () => {
  if (logsWebSocket) {
    logsWebSocket.close();
  }
  if (projectLogsWebSocket) {
    projectLogsWebSocket.close();
  }
});

// Command Palette (Netlify-style)
function setupCommandPalette() {
  const sidebarSearch = document.getElementById('sidebarSearch');
  const commandPalette = document.getElementById('commandPalette');
  const commandSearchInput = document.getElementById('commandSearchInput');
  const commandItems = document.querySelectorAll('.command-item');
  let selectedIndex = -1;
  
  // Open command palette
  function openCommandPalette() {
    if (commandPalette) {
      commandPalette.style.display = 'flex';
      if (commandSearchInput) {
        commandSearchInput.focus();
        commandSearchInput.value = '';
      }
      selectedIndex = -1;
      updateSelection();
    }
  }
  
  // Close command palette
  function closeCommandPalette() {
    if (commandPalette) {
      commandPalette.style.display = 'none';
      selectedIndex = -1;
    }
  }
  
  // Update selection highlight
  function updateSelection() {
    const visibleItems = Array.from(commandItems).filter(item => item.style.display !== 'none');
    commandItems.forEach((item, index) => {
      const visibleIndex = visibleItems.indexOf(item);
      if (visibleIndex === selectedIndex) {
        item.classList.add('selected');
        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        item.classList.remove('selected');
      }
    });
  }
  
  // Handle command actions
  function executeCommand(action) {
    closeCommandPalette();
    
    switch(action) {
      case 'deploy':
      case 'nav-deploy':
        if (window.router) window.router.navigate('/deploy');
        break;
      case 'add-env-var':
        if (window.showEnvVarModal) window.showEnvVarModal();
        break;
      case 'search-repos':
      case 'nav-repositories':
        if (window.router) window.router.navigate('/repositories');
        break;
      case 'nav-projects':
        if (window.router) window.router.navigate('/');
        break;
      case 'nav-applications':
        if (window.router) window.router.navigate('/applications');
        break;
      case 'nav-history':
        if (window.router) window.router.navigate('/history');
        break;
      case 'nav-env-vars':
        if (window.router) window.router.navigate('/env-vars');
        break;
      case 'nav-settings':
        if (window.router) window.router.navigate('/settings');
        break;
    }
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Cmd+K or Ctrl+K to open
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (commandPalette && commandPalette.style.display === 'none') {
        openCommandPalette();
      } else {
        closeCommandPalette();
      }
    }
    
    // Escape to close
    if (e.key === 'Escape' && commandPalette && commandPalette.style.display !== 'none') {
      closeCommandPalette();
    }
    
    // Arrow keys to navigate
    if (commandPalette && commandPalette.style.display !== 'none') {
      const visibleItems = Array.from(commandItems).filter(item => item.style.display !== 'none');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, visibleItems.length - 1);
        updateSelection();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        updateSelection();
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        const visibleItems = Array.from(commandItems).filter(item => item.style.display !== 'none');
        const action = visibleItems[selectedIndex]?.getAttribute('data-action');
        if (action) executeCommand(action);
      }
    }
  });
  
  // Click sidebar search to open
  if (sidebarSearch) {
    sidebarSearch.addEventListener('click', openCommandPalette);
  }
  
  // Click outside to close
  if (commandPalette) {
    commandPalette.addEventListener('click', (e) => {
      if (e.target === commandPalette) {
        closeCommandPalette();
      }
    });
  }
  
  // Click command items
  commandItems.forEach(item => {
    item.addEventListener('click', () => {
      const action = item.getAttribute('data-action');
      if (action) executeCommand(action);
    });
  });
  
  // Search filtering
  if (commandSearchInput) {
    commandSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      commandItems.forEach(item => {
        const text = item.querySelector('.command-text').textContent.toLowerCase();
          if (text.includes(query)) {
            item.style.display = 'flex';
          } else {
            item.style.display = 'none';
        }
      });
      selectedIndex = -1;
      updateSelection();
    });
  }
}
