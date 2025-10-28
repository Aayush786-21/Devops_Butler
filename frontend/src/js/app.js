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

// Initialize router
const router = new Router();
window.router = router; // Make router globally accessible

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
        // Derive a friendly name from git_url/repository_url or fallback to container_name
        const repoUrl = deployment.repository_url || deployment.git_url;
        const derivedName = repoUrl ? String(repoUrl).split('/').pop()?.replace(/\.git$/,'') : null;
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
        
        return {
        id: deployment.id,
          name: projectName,
          status: normalizedStatus,
        url: deployment.deployed_url || deployment.app_url,
        createdAt: deployment.created_at,
        updatedAt: deployment.updated_at,
          repository: repoUrl,
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
        
        <div class="project-actions">
          <button class="btn-icon" title="View logs" onclick="event.stopPropagation(); viewProjectLogs(${project.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
            </button>
          ${project.status === 'running' ? `
          <button class="btn-icon" title="Restart" onclick="event.stopPropagation(); restartProject(${project.id})">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
            </svg>
            </button>
          ` : ''}
          </div>
        </div>
      `;
  }).join('');
}

// Enhanced project actions
async function viewProjectLogs(projectId) {
  try {
    showToast('Loading project logs...', 'info');
    
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    const response = await fetch(`/projects/${projectId}/logs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showProjectLogsModal(data);
    } else {
      showToast(data.detail || 'Failed to load project logs', 'error');
    }
  } catch (error) {
    console.error('Error loading project logs:', error);
    showToast('Failed to load project logs: ' + error.message, 'error');
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
  const project = allProjects.find(p => p.id == projectId);
  if (!project) return;
  
  currentProject = project;
  showProjectSidebar(project);
  
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
        <span class="logo-icon">DB</span>
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
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.getAttribute('data-project-page');
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
      // Show original deploy page
      const deployPage = document.getElementById('page-deploy');
      if (deployPage) {
        deployPage.style.display = 'block';
      }
      document.getElementById('pageTitle').textContent = 'Deploy';
      break;
    case 'configuration':
      showProjectConfiguration();
      break;
    case 'logs':
      const logsPage = document.getElementById('page-logs');
      if (logsPage) {
        logsPage.style.display = 'block';
        loadLogs();
      }
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
      <span class="logs-timestamp">Last updated: ${new Date().toLocaleTimeString()}</span>
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





function showProjectConfiguration() {
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
            <div class="config-label">Created:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigCreated">${currentProject?.createdAt ? getRelativeTime(new Date(currentProject.createdAt)) : 'Unknown'}</span>
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
              <span class="config-value-text" id="projectConfigPorts">${currentProject?.containerPorts || 'No ports'}</span>
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
  
  // Update the configuration values with current project data
  updateProjectConfigValues();
  
  configPage.style.display = 'block';
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
  if (ownerEl) ownerEl.textContent = 'Aayush786-21\'s team'; // Static for now
  if (idEl) idEl.textContent = currentProject.id || '-';
  if (createdEl) createdEl.textContent = currentProject.createdAt ? getRelativeTime(new Date(currentProject.createdAt)) : 'Unknown';
  if (updatedEl) updatedEl.textContent = currentProject.updatedAt ? getRelativeTime(new Date(currentProject.updatedAt)) : 'Unknown';
  if (portsEl) portsEl.textContent = currentProject.containerPorts || 'No ports';
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
          <div class="repository-card">
            <h3>${repo.name}</h3>
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">
              ${repo.description || 'No description'}
            </p>
            <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.875rem; color: var(--text-secondary);">
                ${repo.language || 'Unknown'} • ${repo.stargazers_count || 0} stars
              </span>
              <button class="btn-primary btn-small" onclick="importRepository('${repo.clone_url}', '${repo.name}')">
                📥 Import
              </button>
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

// Import repository as a project
async function importRepository(repoUrl, repoName) {
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (!token) {
    showToast('Please login first', 'error');
    return;
  }
  
  try {
    showToast('Importing repository...', 'info');
    
    // Create a deployment for this repository
    const response = await fetch('/deploy', {
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
let selectedProjectId = null;

async function loadProjectsForSelector() {
  const projectSelector = document.getElementById('projectSelector');
  if (!projectSelector) return;
  
  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    const response = await fetch('/deployments', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const deployments = await response.json();
      
      // Clear existing options except "All Projects"
      projectSelector.innerHTML = '<option value="">All Projects (Global)</option>';
      
      // Add project options
      deployments.forEach(deployment => {
        const option = document.createElement('option');
        option.value = deployment.id;
        option.textContent = deployment.app_name || deployment.repository_url?.split('/').pop() || `Project ${deployment.id}`;
        projectSelector.appendChild(option);
      });
        }
    } catch (error) {
    console.error('Error loading projects:', error);
  }
}

async function loadEnvVars() {
  // Load projects first to populate selector
  await loadProjectsForSelector();
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
    
    const url = selectedProjectId 
      ? `/api/env-vars?project_id=${selectedProjectId}`
      : '/api/env-vars';
    
    const response = await fetch(url, {
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
  const projectSelector = document.getElementById('projectSelector');
  
  // Project selector handler
  if (projectSelector) {
    projectSelector.addEventListener('change', async (e) => {
      selectedProjectId = e.target.value ? parseInt(e.target.value) : null;
      await loadEnvVars();
    });
  }
  
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
            ? getRelativeTime(new Date(item.updated_at))
            : 'never';
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
    const response = await fetch('/api/env-vars', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        variables: envVars,
        project_id: selectedProjectId  // Use selected project or null for global
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

// Logs Page with WebSocket
let logsWebSocket = null;
let logsPaused = false;
let logsBuffer = [];

function loadLogs() {
  const logsContent = document.getElementById('logsContent');
  if (!logsContent) return;
  
  // Initialize logs display
  logsContent.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Connecting to WebSocket...</p>';
  
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
    try {
      const data = JSON.parse(event.data);
      
      if (logsPaused) {
        // Buffer logs when paused
        logsBuffer.push({ message: data.message, type: data.type || 'info' });
            } else {
        appendLog(data.message, data.type || 'info');
      }
    } catch (error) {
      console.error('Error parsing log message:', error);
      appendLog(event.data, 'info');
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
  
  const timestamp = new Date().toLocaleTimeString();
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

// Cleanup WebSocket when navigating away
window.addEventListener('beforeunload', () => {
  if (logsWebSocket) {
    logsWebSocket.close();
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
