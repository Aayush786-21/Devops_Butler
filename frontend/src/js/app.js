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
      case 'dashboard':
        loadVMStatus();
        break;
      case 'projects':
        loadProjects();
        loadVMStatus(); // Also show VM status on projects page
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
        This will stop the process and remove the project.
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
  // Clear sidebar search field to prevent username from appearing
  const sidebarSearch = document.getElementById('sidebarSearch');
  if (sidebarSearch) {
    sidebarSearch.value = '';
    sidebarSearch.setAttribute('autocomplete', 'off');
  }
  
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
        
        // Ensure sidebar search is still empty (in case browser autofilled it)
        const sidebarSearchAfter = document.getElementById('sidebarSearch');
        if (sidebarSearchAfter && sidebarSearchAfter.value === username) {
          sidebarSearchAfter.value = '';
        }
        
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
  
  // Setup framework preset handler
  setupFrameworkPresetHandler();
  
  // Deploy type toggle
  const deployType = document.getElementById('deploy-type');
  if (deployType) {
    deployType.addEventListener('change', (e) => {
      const singleGroup = document.getElementById('single-repo-group');
      const gitUrlSection = document.getElementById('git-url-section');
      const splitLayout = document.getElementById('split-deploy-layout');
      const gitUrlInput = document.getElementById('git-url');
      
      if (e.target.value === 'split') {
        if (singleGroup) singleGroup.style.display = 'none';
        if (gitUrlSection) gitUrlSection.style.display = 'none';
        if (splitLayout) splitLayout.style.display = 'block';
        if (gitUrlInput) gitUrlInput.removeAttribute('required');
      } else {
        if (singleGroup) singleGroup.style.display = 'block';
        if (gitUrlSection) gitUrlSection.style.display = 'block';
        if (splitLayout) splitLayout.style.display = 'none';
        if (gitUrlInput) gitUrlInput.setAttribute('required', 'required');
      }
    });
  }

  // Buttons
  document.getElementById('clearHistoryBtn')?.addEventListener('click', clearHistory);
  document.getElementById('searchReposBtn')?.addEventListener('click', searchRepositories);
  
  // Spotlight search
  setupSpotlightSearch();

  // Domain warning modal
  setupDomainWarningModal();
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

function setupDomainWarningModal() {
  const modal = document.getElementById('domainWarningModal');
  if (!modal || modal.dataset.bound === 'true') {
    return;
  }

  modal.dataset.bound = 'true';

  const cancelBtn = document.getElementById('domainModalCancelBtn');
  const openConfigBtn = document.getElementById('domainModalOpenConfigBtn');

  const closeModal = () => {
    modal.style.display = 'none';
  };

  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }

  if (openConfigBtn) {
    openConfigBtn.addEventListener('click', () => {
      closeModal();
      showProjectContent('domain-config');
      showProjectDomainConfig();
    });
  }

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
}

function showDomainWarningModal() {
  const modal = document.getElementById('domainWarningModal');
  if (modal) {
    modal.style.display = 'flex';
  }
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

// VM Status Management
let vmStatusPollInterval = null;

async function loadVMStatus() {
  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (!token) {
    // Hide VM status card if not logged in
    const vmStatusCard = document.getElementById('vmStatusCard');
    if (vmStatusCard) vmStatusCard.style.display = 'none';
    return;
  }
  
  try {
    const response = await fetch('/api/vm-status', {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      // If unauthorized, hide the card
      if (response.status === 401) {
        const vmStatusCard = document.getElementById('vmStatusCard');
        if (vmStatusCard) vmStatusCard.style.display = 'none';
        return;
      }
      throw new Error('Failed to fetch VM status');
    }
    
    const data = await response.json();
    updateVMStatusUI(data.vm_status, data.message);
    
    // If VM is creating, poll every 5 seconds
    if (data.vm_status === 'creating') {
      if (!vmStatusPollInterval) {
        vmStatusPollInterval = setInterval(() => {
          loadVMStatus();
        }, 5000); // Poll every 5 seconds
      }
    } else {
      // Stop polling if VM is ready or failed
      if (vmStatusPollInterval) {
        clearInterval(vmStatusPollInterval);
        vmStatusPollInterval = null;
      }
    }
  } catch (error) {
    console.error('Error loading VM status:', error);
    // Don't show error, just hide the card
    const vmStatusCard = document.getElementById('vmStatusCard');
    if (vmStatusCard) vmStatusCard.style.display = 'none';
  }
}

function updateVMStatusUI(status, message) {
  // Update dashboard VM status card
  updateVMStatusCard('vmStatusCard', 'vmStatusBadge', 'vmStatusDot', 'vmStatusText', 
                     'vmStatusMessage', 'vmStatusDetails', 'dashboardActions', status, message);
  
  // Update projects page VM status card
  updateVMStatusCard('vmStatusCardProjects', 'vmStatusBadgeProjects', 'vmStatusDotProjects', 
                     'vmStatusTextProjects', 'vmStatusMessageProjects', 'vmStatusDetailsProjects', 
                     null, status, message);
}

function updateVMStatusCard(cardId, badgeId, dotId, textId, messageId, detailsId, actionsId, status, message) {
  const vmStatusCard = document.getElementById(cardId);
  const statusBadge = document.getElementById(badgeId);
  const statusDot = document.getElementById(dotId);
  const statusText = document.getElementById(textId);
  const vmStatusMessage = document.getElementById(messageId);
  const vmStatusDetails = document.getElementById(detailsId);
  const dashboardActions = actionsId ? document.getElementById(actionsId) : null;
  
  if (!vmStatusCard) return;
  
  // Show the card
  vmStatusCard.style.display = 'block';
  
  // Update message
  if (vmStatusMessage) {
    vmStatusMessage.textContent = message;
  }
  
  // Update status badge and details based on status
  if (status === 'creating') {
    // Set creating status
    if (statusBadge) {
      statusBadge.className = 'status-badge creating';
    }
    if (statusDot) {
      statusDot.className = 'status-dot creating';
    }
    if (statusText) {
      statusText.textContent = 'Creating';
    }
    // Show details with estimated time
    if (vmStatusDetails) {
      vmStatusDetails.style.display = 'block';
      vmStatusDetails.textContent = 'Estimated time remaining: 2-5 minutes';
    }
    // Hide actions while creating
    if (dashboardActions) {
      dashboardActions.style.display = 'none';
    }
  } else if (status === 'ready') {
    // Set ready status (VM is ready and running)
    if (statusBadge) {
      statusBadge.className = 'status-badge running';
    }
    if (statusDot) {
      statusDot.className = 'status-dot running';
    }
    if (statusText) {
      statusText.textContent = 'Running';
    }
    // Hide details
    if (vmStatusDetails) {
      vmStatusDetails.style.display = 'none';
    }
    // Show actions
    if (dashboardActions) {
      dashboardActions.style.display = 'grid';
    }
  } else if (status === 'failed') {
    // Set failed status
    if (statusBadge) {
      statusBadge.className = 'status-badge failed';
    }
    if (statusDot) {
      statusDot.className = 'status-dot failed';
    }
    if (statusText) {
      statusText.textContent = 'Failed';
    }
    // Show error details
    if (vmStatusDetails) {
      vmStatusDetails.style.display = 'block';
      vmStatusDetails.textContent = 'Please check that OrbStack is installed and running, then try again.';
    }
    // Show actions but with warning
    if (dashboardActions) {
      dashboardActions.style.display = 'grid';
    }
  } else {
    // Unknown status - default to creating
    if (statusBadge) {
      statusBadge.className = 'status-badge creating';
    }
    if (statusDot) {
      statusDot.className = 'status-dot creating';
    }
    if (statusText) {
      statusText.textContent = 'Checking';
    }
    if (vmStatusDetails) {
      vmStatusDetails.style.display = 'none';
    }
    if (dashboardActions) {
      dashboardActions.style.display = 'none';
    }
  }
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
        
        const hasActiveDomain = deployment.custom_domain && deployment.domain_status && deployment.domain_status.toLowerCase() === 'active';
        const preferredUrl = hasActiveDomain
          ? `https://${deployment.custom_domain}`
          : (deployment.deployed_url || deployment.app_url || null);

        return {
          id: deployment.id,
          name: projectName,
          status: normalizedStatus,
          url: preferredUrl,
          createdAt: deployment.created_at,
          updatedAt: deployment.updated_at,
          repository: repoUrl,
          repository_url: repoUrl,  // Add this for deploy page compatibility
          git_url: gitUrl,  // Always use the git_url from backend
          project_type: projectType,  // Explicit project type: 'split' or 'single'
          isSplit,
          frontend_url: frontendUrl,
          backend_url: backendUrl,
          // Process-based metrics (no Docker)
          processPid: deployment.process_pid || null,
          port: deployment.port || null,
          startCommand: deployment.start_command || null,
          buildCommand: deployment.build_command || null,
          isRunning: deployment.is_running || false,
          custom_domain: deployment.custom_domain || null,
          domain_status: deployment.domain_status || null,
          last_domain_sync: deployment.last_domain_sync || null
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
                   ${project.port ? `
                   <div class="metric">
                     <span class="metric-label">Port</span>
                     <span class="metric-value">${project.port}</span>
                   </div>
                   ` : ''}
                   ${project.processPid ? `
                   <div class="metric">
                     <span class="metric-label">PID</span>
                     <span class="metric-value">${project.processPid}</span>
                   </div>
                   ` : ''}
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
    
    const normalizedUrl = normalizeProjectUrl(project.url);

    if (!normalizedUrl) {
      showToast('Project URL not available. Make sure the project is deployed.', 'error');
      return;
    }
    
    // Open the project URL in a new tab
    window.open(normalizedUrl, '_blank');
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
      // Show Vercel-style deploy page and populate fields dynamically
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
        
        // Update page title
        const pageTitle = document.getElementById('deploy-page-title');
        const cardTitle = document.getElementById('deploy-card-title');
        const description = document.getElementById('deploy-description');
        
        if (currentProject) {
          if (pageTitle) pageTitle.textContent = currentProject.name || 'Project';
          if (cardTitle) cardTitle.textContent = currentProject.name || 'Project';
          if (description) description.textContent = 'Update deployment settings and redeploy your project.';
          
          // Show import info if we have a git URL
          const importInfo = document.getElementById('import-info');
          const importRepoName = document.getElementById('import-repo-name');
          const gitUrl = currentProject.git_url || currentProject.repository_url || '';
          
          // Always populate the Git URL input field, even if hidden, for form submission
          const gitUrlInput = document.getElementById('git-url');
          if (gitUrlInput && gitUrl) {
            gitUrlInput.value = gitUrl;
            console.log('Populated Git URL input in showProjectContent:', gitUrl);
            // Remove required attribute since it's hidden for existing projects
            gitUrlInput.removeAttribute('required');
          }
          
          if (gitUrl && importInfo && importRepoName) {
            // Parse GitHub URL to extract repo name
            try {
              const urlMatch = gitUrl.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git|[/]|$)/);
              if (urlMatch) {
                const repoOwner = urlMatch[1];
                const repoName = urlMatch[2];
                importRepoName.textContent = `${repoOwner}/${repoName}`;
                importInfo.style.display = 'flex';
                
                // Show branch badge (default to main)
                const branchBadge = document.getElementById('branch-badge');
                const branchName = document.getElementById('branch-name');
                if (branchBadge && branchName) {
                  branchBadge.style.display = 'flex';
                  branchName.textContent = 'main'; // Default branch
                }
              }
            } catch (e) {
              console.warn('Failed to parse GitHub URL:', e);
            }
          } else if (importInfo) {
            importInfo.style.display = 'none';
          }
          
          // Log currentProject data for debugging
          console.log('showProjectContent - currentProject:', {
            id: currentProject.id,
            name: currentProject.name,
            git_url: currentProject.git_url,
            repository_url: currentProject.repository_url,
            gitUrl: gitUrl
          });
          
          // Check for monorepo structure
          checkMonorepoStructure(currentProject.id, gitUrl);
        } else {
          if (pageTitle) pageTitle.textContent = 'New Project';
          if (cardTitle) cardTitle.textContent = 'New Project';
          if (description) description.textContent = 'Choose where you want to create the project and give it a name.';
          
          // Hide import info for new projects
          const importInfo = document.getElementById('import-info');
          if (importInfo) importInfo.style.display = 'none';
        }
        
        // Hide components section on deploy page
        const componentsSection = document.getElementById('project-components-section');
        if (componentsSection) {
          componentsSection.style.display = 'none';
        }
        
        const deployTypeSelect = document.getElementById('deploy-type');
        const deployTypeGroup = document.getElementById('deploy-type-group');
        const singleGroup = document.getElementById('single-repo-group');
        const gitUrlSection = document.getElementById('git-url-section');
        const splitLayout = document.getElementById('split-deploy-layout');
        const gitUrlInput = document.getElementById('git-url');
        const projectNameInput = document.getElementById('project-name');
        const frameworkPreset = document.getElementById('framework-preset');
        const rootDirectory = document.getElementById('root-directory');
        const installCommand = document.getElementById('install-command');
        const buildCommand = document.getElementById('build-command');
        const startCommand = document.getElementById('start-command');
        const portInput = document.getElementById('port');
        const feInput = document.getElementById('frontend-url');
        const beInput = document.getElementById('backend-url');
        const submitBtn = document.getElementById('deploy-submit-default');
        const editRootDirBtn = document.getElementById('edit-root-directory-btn');

        // Setup root directory edit button
        if (editRootDirBtn && rootDirectory) {
          editRootDirBtn.onclick = () => {
            rootDirectory.removeAttribute('readonly');
            rootDirectory.focus();
            rootDirectory.select();
          };
        }

        // Determine project type
        let projectType = currentProject?.project_type;
        const gitUrl = currentProject?.git_url || currentProject?.repository_url || '';
        const hasSplitFormat = gitUrl.startsWith('split::');
        
        if (!projectType) {
          if (currentProject?.isSplit || hasSplitFormat) {
            projectType = 'split';
          } else {
            projectType = 'single';
          }
        }
        
        if (hasSplitFormat && projectType !== 'split') {
          projectType = 'split';
        } else if (!hasSplitFormat && projectType === 'split' && gitUrl) {
          projectType = 'single';
        }
        
        if (currentProject) {
          // Hide deployment type selector for existing projects
          if (deployTypeGroup) deployTypeGroup.style.display = 'none';
          
          // Populate project name
          if (projectNameInput) {
            projectNameInput.value = currentProject.name || currentProject.app_name || '';
          }
          
          // Populate framework preset (auto-detect from build command or project type)
          if (frameworkPreset) {
            // Try to detect framework from build command or project structure
            const buildCmd = currentProject.buildCommand || currentProject.build_command || '';
            const startCmd = currentProject.startCommand || currentProject.start_command || '';
            
            if (buildCmd.includes('next build') || startCmd.includes('next start')) {
              frameworkPreset.value = 'nextjs';
            } else if (buildCmd.includes('react-scripts') || startCmd.includes('react-scripts')) {
              frameworkPreset.value = 'react';
            } else if (startCmd.includes('vue') || buildCmd.includes('vue')) {
              frameworkPreset.value = 'vue';
            } else if (startCmd.includes('flask') || buildCmd.includes('flask')) {
              frameworkPreset.value = 'flask';
            } else if (startCmd.includes('django') || buildCmd.includes('django')) {
              frameworkPreset.value = 'django';
            } else if (startCmd.includes('python') || buildCmd.includes('python')) {
              frameworkPreset.value = 'python';
            } else if (startCmd.includes('node') || buildCmd.includes('npm')) {
              frameworkPreset.value = 'nodejs';
            } else {
              frameworkPreset.value = 'auto';
            }
          }
          
          // Populate root directory (default to ./)
          if (rootDirectory) {
            rootDirectory.value = './'; // Default, could be stored in project later
          }
          
          // Populate build/start commands and port
          if (buildCommand) {
            buildCommand.value = currentProject.buildCommand || currentProject.build_command || '';
          }
          if (startCommand) {
            startCommand.value = currentProject.startCommand || currentProject.start_command || '';
          }
          if (portInput) {
            portInput.value = currentProject.port || '';
          }
          
          // Auto-detect install command based on framework
          if (installCommand && !installCommand.value) {
            const framework = frameworkPreset?.value || 'auto';
            if (['nextjs', 'react', 'vue', 'nodejs'].includes(framework)) {
              installCommand.placeholder = 'npm install';
            } else if (['python', 'flask', 'django'].includes(framework)) {
              installCommand.placeholder = 'pip install -r requirements.txt';
            }
          }
          
          if (projectType === 'split') {
            // Split repo: show split layout
            if (singleGroup) singleGroup.style.display = 'none';
            if (splitLayout) splitLayout.style.display = 'block';
            if (feInput) feInput.value = currentProject.frontend_url || '';
            if (beInput) beInput.value = currentProject.backend_url || '';
            if (gitUrlInput) gitUrlInput.removeAttribute('required');
            if (submitBtn) submitBtn.style.display = 'none';
            
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
            const buildCmd = document.getElementById('build-command')?.value.trim() || null;
            const startCmd = document.getElementById('start-command')?.value.trim() || null;
            const portNum = document.getElementById('port')?.value.trim() || null;
            const result = await deploySingle(url, 'frontend', dialog, true, buildCmd, startCmd, portNum);
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
            const buildCmd = document.getElementById('build-command')?.value.trim() || null;
            const startCmd = document.getElementById('start-command')?.value.trim() || null;
            const portNum = document.getElementById('port')?.value.trim() || null;
            const result = await deploySingle(url, 'backend', dialog, true, buildCmd, startCmd, portNum);
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
                // Add optional build/start commands and port
                const buildCmd = document.getElementById('build-command')?.value.trim();
                const startCmd = document.getElementById('start-command')?.value.trim();
                const portNum = document.getElementById('port')?.value.trim();
                if (buildCmd) {
                  formData.append('build_command', buildCmd);
                }
                if (startCmd) {
                  formData.append('start_command', startCmd);
                }
                if (portNum) {
                  formData.append('port', portNum);
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
            // Single repo: show single input with deploy button
            if (singleGroup) singleGroup.style.display = 'block';
            if (gitUrlSection) gitUrlSection.style.display = 'none'; // Hide git URL input for existing projects
            if (splitLayout) splitLayout.style.display = 'none';
            // Always populate Git URL in the hidden input for form submission
            if (gitUrlInput && currentProject) {
              const projectGitUrl = currentProject.git_url || currentProject.repository_url || '';
              if (projectGitUrl) {
                gitUrlInput.value = projectGitUrl;
                // Remove required attribute since it's hidden for existing projects
                gitUrlInput.removeAttribute('required');
              }
            }
            if (submitBtn) { 
              submitBtn.textContent = 'Deploy'; 
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
            <div class="config-label">Port:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigPort">${currentProject?.port || 'Not set'}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Process PID:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigPid">${currentProject?.processPid || 'Not running'}</span>
            </div>
          </div>
          <div class="config-row">
            <div class="config-label">Start Command:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigStartCommand">${currentProject?.startCommand || 'Not set'}</span>
            </div>
          </div>
          ${currentProject?.buildCommand ? `
          <div class="config-row">
            <div class="config-label">Build Command:</div>
            <div class="config-value-container">
              <span class="config-value-text" id="projectConfigBuildCommand">${currentProject.buildCommand}</span>
            </div>
          </div>
          ` : ''}
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
                      ${frontend.port ? `
                      <div class="metric">
                        <span class="metric-label">Port</span>
                        <span class="metric-value">${frontend.port}</span>
                      </div>
                      ` : ''}
                      ${frontend.process_pid ? `
                      <div class="metric">
                        <span class="metric-label">PID</span>
                        <span class="metric-value">${frontend.process_pid}</span>
                      </div>
                      ` : ''}
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
                      ${backend.port ? `
                      <div class="metric">
                        <span class="metric-label">Port</span>
                        <span class="metric-value">${backend.port}</span>
                      </div>
                      ` : ''}
                      ${backend.process_pid ? `
                      <div class="metric">
                        <span class="metric-label">PID</span>
                        <span class="metric-value">${backend.process_pid}</span>
                      </div>
                      ` : ''}
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
                ${frontend.port ? `
                <div class="metric">
                  <span class="metric-label">Port</span>
                  <span class="metric-value">${frontend.port}</span>
                </div>
                ` : ''}
                ${frontend.process_pid ? `
                <div class="metric">
                  <span class="metric-label">PID</span>
                  <span class="metric-value">${frontend.process_pid}</span>
                </div>
                ` : ''}
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
                ${backend.port ? `
                <div class="metric">
                  <span class="metric-label">Port</span>
                  <span class="metric-value">${backend.port}</span>
                </div>
                ` : ''}
                ${backend.process_pid ? `
                <div class="metric">
                  <span class="metric-label">PID</span>
                  <span class="metric-value">${backend.process_pid}</span>
                </div>
                ` : ''}
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

function normalizeProjectUrl(url) {
  if (!url || url === '#') {
    return null;
  }
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

function openSite(url) {
  const normalized = normalizeProjectUrl(url);
  if (normalized) {
    window.open(normalized, '_blank');
  } else {
    showToast('Site URL is unavailable', 'error');
  }
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

// Deploy page helper functions
function toggleDeploySection(sectionId) {
  const content = document.getElementById('content' + sectionId.charAt(0).toUpperCase() + sectionId.slice(1));
  const icon = document.getElementById('icon' + sectionId.charAt(0).toUpperCase() + sectionId.slice(1));
  
  if (content && icon) {
    content.classList.toggle('active');
    icon.classList.toggle('active');
  }
}

function navigateToEnvVars() {
  if (currentProject && currentProject.id) {
    // Navigate to environment variables page for this project
    if (typeof router !== 'undefined' && router && router.navigate) {
      router.navigate('/env-vars');
    } else if (window.router && window.router.navigate) {
      window.router.navigate('/env-vars');
    } else {
      // Fallback: navigate using window location
      window.location.hash = '#/env-vars';
    }
  } else {
    showToast('Please create a project first before adding environment variables', 'info');
  }
}

// Framework preset change handler
function setupFrameworkPresetHandler() {
  const frameworkPreset = document.getElementById('framework-preset');
  const installCommand = document.getElementById('install-command');
  const buildCommand = document.getElementById('build-command');
  const startCommand = document.getElementById('start-command');
  
  if (frameworkPreset) {
    frameworkPreset.addEventListener('change', function(e) {
      const framework = e.target.value;
      
      // Auto-fill install command placeholder based on framework
      if (installCommand) {
        if (['nextjs', 'react', 'vue', 'nuxt', 'gatsby', 'angular', 'svelte', 'vite', 'nodejs'].includes(framework)) {
          installCommand.placeholder = 'npm install, yarn install, or pnpm install';
        } else if (['python', 'flask', 'django'].includes(framework)) {
          installCommand.placeholder = 'pip install -r requirements.txt';
        } else {
          installCommand.placeholder = 'npm install, yarn install, pnpm install, or pip install -r requirements.txt';
        }
      }
      
      // Auto-fill build command placeholder
      if (buildCommand) {
        const buildDefaults = {
          'nextjs': 'next build',
          'react': 'npm run build',
          'vue': 'npm run build',
          'nuxt': 'nuxt build',
          'gatsby': 'gatsby build',
          'angular': 'ng build',
          'svelte': 'npm run build',
          'vite': 'vite build',
          'nodejs': 'npm run build',
          'python': '',
          'flask': '',
          'django': 'python manage.py collectstatic --noinput',
          'static': ''
        };
        if (buildDefaults[framework]) {
          buildCommand.placeholder = buildDefaults[framework] || 'Leave empty for auto-detect';
        }
      }
      
      // Auto-fill start command placeholder
      if (startCommand) {
        const startDefaults = {
          'nextjs': 'npm run start',
          'react': 'npm start',
          'vue': 'npm run serve',
          'nuxt': 'nuxt start',
          'gatsby': 'gatsby serve',
          'angular': 'ng serve',
          'svelte': 'npm run dev',
          'vite': 'vite preview',
          'nodejs': 'node server.js',
          'python': 'python app.py',
          'flask': 'flask run',
          'django': 'python manage.py runserver',
          'static': 'python -m http.server'
        };
        if (startDefaults[framework]) {
          startCommand.placeholder = startDefaults[framework] || 'Leave empty for auto-detect';
        }
      }
    });
  }
}

// Make functions available globally for onclick handlers
window.toggleDeploySection = toggleDeploySection;
window.navigateToEnvVars = navigateToEnvVars;

function updateProjectConfigValues() {
  if (!currentProject) return;
  
  // Update all configuration values
  const nameEl = document.getElementById('projectConfigName');
  const ownerEl = document.getElementById('projectConfigOwner');
  const idEl = document.getElementById('projectConfigId');
  const createdEl = document.getElementById('projectConfigCreated');
  const updatedEl = document.getElementById('projectConfigUpdated');
  // Process-based configuration values (no Docker)
  const portEl = document.getElementById('projectConfigPort');
  const pidEl = document.getElementById('projectConfigPid');
  const startCmdEl = document.getElementById('projectConfigStartCommand');
  const buildCmdEl = document.getElementById('projectConfigBuildCommand');
  
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
  if (portEl) portEl.textContent = currentProject?.port || 'Not set';
  if (pidEl) pidEl.textContent = currentProject?.processPid || 'Not running';
  if (startCmdEl) startCmdEl.textContent = currentProject?.startCommand || 'Not set';
  if (buildCmdEl) buildCmdEl.textContent = currentProject?.buildCommand || 'Not set';
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
            <p>Configure a custom domain for this project. You can use multiple labels in the prefix (e.g., "portfolio.app" or "my.project"). The platform domain is fixed.</p>
            <div class="form-group">
              <label for="customDomain">Custom Domain</label>
              <div class="domain-input-wrapper">
                <input type="text" id="domainPrefix" class="domain-prefix-input" placeholder="project-slug or my.project" />
                <span class="domain-separator">.</span>
                <span class="domain-platform" id="platformDomain">aayush786.xyz</span>
              </div>
              <p class="domain-hint" id="domainSuggestion"></p>
            </div>
            <div class="domain-actions">
              <button class="btn-primary" id="saveDomainBtn">Save Domain</button>
            </div>
            <div class="domain-status" id="domainStatus"></div>
          </div>
        </div>
      </div>
    `;
    document.getElementById('pageContent').appendChild(domainPage);
  }
  
  domainPage.style.display = 'block';

  setupDomainConfigListeners();
  loadProjectDomainSettings();
}

function setupDomainConfigListeners() {
  const saveBtn = document.getElementById('saveDomainBtn');

  if (saveBtn && !saveBtn.dataset.bound) {
    saveBtn.dataset.bound = 'true';
    saveBtn.addEventListener('click', saveProjectDomain);
  }
}

function renderDomainStatus(statusEl, data) {
  if (!statusEl) return;

  if (!data || !data.custom_domain) {
    statusEl.innerHTML = '<span class="status-muted">No custom domain configured yet.</span>';
    return;
  }

  const status = (data.domain_status || 'unknown').toLowerCase();
  const lastSync = data.last_domain_sync ? formatDateTime(data.last_domain_sync) : 'Never';
  let statusLabel = 'Unknown';
  let statusClass = 'status-info';
  let statusNote = '';

  if (status === 'active') {
    statusLabel = 'Active';
    statusClass = 'status-success';
  } else if (status === 'error') {
    statusLabel = 'Error';
    statusClass = 'status-error';
    statusNote = 'Resolve the issue and save the domain again.';
  } else if (status === 'pending') {
    statusLabel = 'Pending';
    statusClass = 'status-warning';
    statusNote = 'Domain will be activated automatically after the next successful deployment.';
  }

  statusEl.innerHTML = `
    <div class="domain-status-line ${statusClass}">
      <div class="domain-status-domain">
        <strong>${escapeHtml(data.custom_domain)}</strong>
      </div>
      <div class="domain-status-meta">
        <span>${statusLabel}</span>
        <span>Last sync: ${escapeHtml(lastSync)}</span>
      </div>
      ${statusNote ? `<p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(statusNote)}</p>` : ''}
    </div>
  `;
}

async function loadProjectDomainSettings() {
  const suggestionEl = document.getElementById('domainSuggestion');
  const statusEl = document.getElementById('domainStatus');
  const domainPrefixInput = document.getElementById('domainPrefix');
  const platformDomainEl = document.getElementById('platformDomain');

  if (!currentProject || !currentProject.id) {
    if (statusEl) {
      statusEl.innerHTML = '<span class="status-muted">Select a project to configure its domain.</span>';
    }
    return;
  }

  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (!token) {
    if (statusEl) {
      statusEl.innerHTML = '<span class="status-error">Please login to manage domains.</span>';
    }
    return;
  }

  if (suggestionEl) {
    suggestionEl.textContent = 'Loading domain details...';
  }

  try {
    const response = await fetch(`/projects/${currentProject.id}/domain`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to load domain info (${response.status})`);
    }

    const data = await response.json();
    const platformDomain = data.butler_domain || 'aayush786.xyz';

    // Display the platform domain as fixed text
    if (platformDomainEl) {
      platformDomainEl.textContent = platformDomain;
    }

    // Extract the prefix from the custom domain or suggested domain
    let domainPrefix = '';
    const fullDomain = data.custom_domain || data.suggested_domain || '';
    if (fullDomain) {
      // Remove the platform domain suffix to get just the prefix
      if (fullDomain.endsWith(platformDomain)) {
        domainPrefix = fullDomain.slice(0, -(platformDomain.length + 1)); // +1 for the dot
      } else {
        // Fallback: try to extract prefix from full domain
        const parts = fullDomain.split('.');
        if (parts.length > 0) {
          domainPrefix = parts[0];
        }
      }
    }

    if (domainPrefixInput) {
      domainPrefixInput.value = domainPrefix;
      // Extract suggested prefix
      const suggestedPrefix = data.suggested_domain && data.suggested_domain.endsWith(platformDomain)
        ? data.suggested_domain.slice(0, -(platformDomain.length + 1))
        : '';
      domainPrefixInput.placeholder = suggestedPrefix || 'project-slug or my.project';
    }

    if (suggestionEl) {
      const suggestedPrefix = data.suggested_domain && data.suggested_domain.endsWith(platformDomain)
        ? data.suggested_domain.slice(0, -(platformDomain.length + 1))
        : '';
      suggestionEl.textContent = suggestedPrefix
        ? `Suggested: ${suggestedPrefix} (you can use multiple labels like "my.project" or "portfolio.app"). Leave blank to remove. Domains become active after a successful deploy.`
        : `Enter a subdomain prefix (can be multiple labels like "my.project" or "portfolio"). The platform domain ${platformDomain} is fixed and cannot be changed.`;
    }

    renderDomainStatus(statusEl, data);

    if (currentProject) {
      currentProject.custom_domain = data.custom_domain;
      currentProject.domain_status = data.domain_status;
    }
  } catch (error) {
    console.error('Failed to load project domain info:', error);
    if (statusEl) {
      statusEl.innerHTML = '<span class="status-error">Could not load domain configuration.</span>';
    }
  }
}

async function saveProjectDomain() {
  if (!currentProject || !currentProject.id) {
    showToast('Select a project first', 'error');
    return;
  }

  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (!token) {
    showToast('Please login to manage domains', 'error');
    return;
  }

  const domainPrefixInput = document.getElementById('domainPrefix');
  const platformDomainEl = document.getElementById('platformDomain');
  let domainPrefix = domainPrefixInput ? domainPrefixInput.value.trim() : '';
  const platformDomain = platformDomainEl ? platformDomainEl.textContent.trim() : '';

  // Construct the full domain from prefix + platform domain
  let enteredDomain = '';
  if (domainPrefix) {
    // Validate prefix (allow multiple labels separated by dots)
    // Remove leading/trailing dots
    domainPrefix = domainPrefix.trim().replace(/^\.+|\.+$/g, '');
    
    if (!domainPrefix) {
      showToast('Please enter a subdomain prefix.', 'error');
      return;
    }
    
    // Validate format: letters, numbers, hyphens, and dots allowed
    if (!/^[a-z0-9.-]+$/i.test(domainPrefix)) {
      showToast('Subdomain prefix can only contain letters, numbers, hyphens, and dots.', 'error');
      return;
    }
    
    // Check for consecutive dots
    if (domainPrefix.includes('..')) {
      showToast('Subdomain prefix cannot contain consecutive dots.', 'error');
      return;
    }
    
    // Check for dots at start or end
    if (domainPrefix.startsWith('.') || domainPrefix.endsWith('.')) {
      showToast('Subdomain prefix cannot start or end with a dot.', 'error');
      return;
    }
    
    enteredDomain = `${domainPrefix}.${platformDomain}`;
  }

  if (!enteredDomain) {
    if (!currentProject.custom_domain) {
      showToast('Enter a subdomain prefix to save, or leave blank to remove the domain.', 'info');
      return;
    }

    const confirmed = confirm('Remove the custom domain and revert to the default internal URL?');
    if (!confirmed) {
      return;
    }

    await clearProjectDomain();
    await loadProjectDomainSettings();
    return;
  }

  const payload = {
    custom_domain: enteredDomain,
    auto_generate: false
  };

  try {
    const response = await fetch(`/projects/${currentProject.id}/domain`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.detail || 'Failed to save domain';
      const statusCode = response.status;
      
      // Handle 409 Conflict (domain already taken)
      if (statusCode === 409) {
        showToast(message, 'error');
        // Show error in domain status area
        const statusEl = document.getElementById('domainStatus');
        if (statusEl) {
          statusEl.innerHTML = `<span class="status-error">${escapeHtml(message)}</span>`;
        }
      } else {
        throw new Error(message);
      }
      return;
    }

    const data = await response.json();
    showToast(`Domain saved: ${data.custom_domain}`, 'success');

    await loadProjectDomainSettings();
  } catch (error) {
    console.error('Failed to save domain:', error);
    showToast(error.message || 'Failed to save domain', 'error');
    // Show error in domain status area
    const statusEl = document.getElementById('domainStatus');
    if (statusEl && error.message) {
      statusEl.innerHTML = `<span class="status-error">${escapeHtml(error.message)}</span>`;
    }
  }
}

async function clearProjectDomain() {
  if (!currentProject || !currentProject.id) {
    showToast('Select a project first', 'error');
    return;
  }

  const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
  if (!token) {
    showToast('Please login to manage domains', 'error');
    return;
  }

  try {
    const response = await fetch(`/projects/${currentProject.id}/domain`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData.detail || 'Failed to reset domain';
      throw new Error(message);
    }

    showToast('Domain removed. Project will use its internal URL.', 'success');
    if (currentProject) {
      currentProject.custom_domain = null;
      currentProject.domain_status = null;
    }
    await loadProjectDomainSettings();
  } catch (error) {
    console.error('Failed to clear domain:', error);
    showToast(error.message || 'Failed to clear domain', 'error');
  }
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

// Monorepo detection and folder selection
async function checkMonorepoStructure(projectId, gitUrl) {
  const monorepoSection = document.getElementById('monorepo-section');
  const frontendFolderSelect = document.getElementById('frontend-folder');
  const backendFolderSelect = document.getElementById('backend-folder');
  
  if (!monorepoSection || !frontendFolderSelect || !backendFolderSelect) {
    return;
  }
  
  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (!token) return;
    
    const url = projectId 
      ? `/api/detect-monorepo?project_id=${projectId}`
      : `/api/detect-monorepo?git_url=${encodeURIComponent(gitUrl)}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.is_monorepo) {
        // Show monorepo section
        monorepoSection.style.display = 'block';
        
        // Populate frontend folder select
        if (data.frontend_folder) {
          frontendFolderSelect.innerHTML = `<option value="">None (skip frontend)</option>`;
          const frontendOption = document.createElement('option');
          frontendOption.value = data.frontend_folder;
          frontendOption.textContent = data.frontend_folder;
          frontendOption.selected = true;
          frontendFolderSelect.appendChild(frontendOption);
        } else {
          frontendFolderSelect.innerHTML = `<option value="">None (skip frontend)</option>`;
        }
        
        // Populate backend folder select
        if (data.backend_folder) {
          backendFolderSelect.innerHTML = `<option value="">None (skip backend)</option>`;
          const backendOption = document.createElement('option');
          backendOption.value = data.backend_folder;
          backendOption.textContent = data.backend_folder;
          backendOption.selected = true;
          backendFolderSelect.appendChild(backendOption);
        } else {
          backendFolderSelect.innerHTML = `<option value="">None (skip backend)</option>`;
        }
      } else {
        // Hide monorepo section
        monorepoSection.style.display = 'none';
      }
    }
  } catch (error) {
    console.error('Error detecting monorepo structure:', error);
    monorepoSection.style.display = 'none';
  }
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
  const deployStatus = document.getElementById('deploy-status');
  const deploySuccess = document.getElementById('deploy-success');

  // Reset UI
  deploySuccess.style.display = 'none';
  deployStatus.textContent = '';

  // Get Git URL - prioritize currentProject for existing projects
  let gitUrl = '';
  if (currentProject && currentProject.id) {
    // Existing project: use stored Git URL from project
    gitUrl = currentProject.git_url || currentProject.repository_url || '';
    console.log('Deploying existing project:', {
      projectId: currentProject.id,
      projectName: currentProject.name,
      gitUrl: gitUrl,
      hasGitUrl: !!gitUrl
    });
    
    // Ensure hidden input has the value for form submission
    const gitUrlInput = document.getElementById('git-url');
    if (gitUrlInput && gitUrl) {
      gitUrlInput.value = gitUrl;
      console.log('Populated hidden Git URL input with:', gitUrl);
    }
    
    // If still no Git URL, try to get from input field (fallback)
    if (!gitUrl) {
      if (gitUrlInput) {
        gitUrl = gitUrlInput.value.trim();
        console.log('Got Git URL from input field (fallback):', gitUrl);
      }
    }
  } else {
    // New project: get from input field
    const gitUrlInput = document.getElementById('git-url');
    gitUrl = gitUrlInput ? gitUrlInput.value.trim() : '';
    console.log('Deploying new project, Git URL from input:', gitUrl);
  }

  const frontendUrl = document.getElementById('frontend-url')?.value.trim();
  const backendUrl = document.getElementById('backend-url')?.value.trim();

  // Don't block deployment if no domain is configured - just inform user
  const customDomain = currentProject?.custom_domain;
  const domainStatus = currentProject?.domain_status ? currentProject.domain_status.toLowerCase() : null;

  if (!customDomain) {
    // Show info message but don't block deployment
    console.log('No custom domain configured - deployment will use internal URL');
  } else if (customDomain && domainStatus !== 'active') {
    showToast('Domain saved. It will activate after this deployment.', 'info');
  }

  // Validate URLs based on deployment type
  if (deployType === 'split') {
    if (!frontendUrl || !frontendUrl.startsWith('http') || !backendUrl || !backendUrl.startsWith('http')) {
      deployStatus.textContent = 'Please enter valid Frontend and Backend repository URLs';
      deployStatus.style.color = 'var(--error)';
      return;
    }
  } else {
    // For single deployment, we must have a Git URL
    if (!gitUrl || !gitUrl.startsWith('http')) {
      deployStatus.textContent = `Please enter a valid Git repository URL. Current project: ${currentProject?.name || 'unknown'}, Git URL: ${gitUrl || 'missing'}`;
      deployStatus.style.color = 'var(--error)';
      console.error('Git URL validation failed:', {
        currentProject: currentProject,
        gitUrl: gitUrl,
        gitUrlInput: document.getElementById('git-url')?.value
      });
      return;
    }
  }
  
  console.log('Git URL validation passed:', gitUrl);

  deployStatus.textContent = '🚀 Starting deployment...';
  deployStatus.style.color = 'var(--primary)';

  // Show deployment logs page and connect to WebSocket
  showDeploymentLogsPage();
  connectDeploymentLogsWebSocket();

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
    
    // Add project name if provided
    const projectName = document.getElementById('project-name')?.value.trim();
    if (projectName) {
      formData.append('project_name', projectName);
    }
    
    // Add root directory if provided (defaults to ./)
    const rootDirectory = document.getElementById('root-directory')?.value.trim() || './';
    if (rootDirectory) {
      formData.append('root_directory', rootDirectory);
    }
    
    // Add framework preset
    const frameworkPreset = document.getElementById('framework-preset')?.value;
    if (frameworkPreset && frameworkPreset !== 'auto') {
      formData.append('framework_preset', frameworkPreset);
    }
    
    // Add install command if provided
    const installCommand = document.getElementById('install-command')?.value.trim();
    if (installCommand) {
      formData.append('install_command', installCommand);
    }
    
    // Add optional build/start commands and port
    const buildCommand = document.getElementById('build-command')?.value.trim();
    const startCommand = document.getElementById('start-command')?.value.trim();
    const port = document.getElementById('port')?.value.trim();
    if (buildCommand) {
      formData.append('build_command', buildCommand);
    }
    if (startCommand) {
      formData.append('start_command', startCommand);
    }
    if (port) {
      formData.append('port', port);
    }
    
    // Add monorepo information if detected
    const monorepoSection = document.getElementById('monorepo-section');
    const frontendFolder = document.getElementById('frontend-folder')?.value.trim();
    const backendFolder = document.getElementById('backend-folder')?.value.trim();
    if (monorepoSection && monorepoSection.style.display !== 'none' && (frontendFolder || backendFolder)) {
      formData.append('is_monorepo', 'true');
      if (frontendFolder) {
        formData.append('frontend_folder', frontendFolder);
      }
      if (backendFolder) {
        formData.append('backend_folder', backendFolder);
      }
    }
    
    const response = await fetch('/deploy', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      // Wait a moment for final logs, then show success page
      setTimeout(() => {
        showDeploymentSuccessPage(result);
      }, 2000);
      } else {
      // Handle errors - show in logs page
      if (response.status === 423) {
        const errorMsg = result.detail || 'Your virtual machine is being created. Please wait a few moments and try again.';
        appendDeploymentLog(`⏳ ${errorMsg}`, 'warning');
        updateDeploymentStatus('warning', 'VM Creating...');
        showToast(errorMsg, 'warning');
      } else {
        const errorMsg = result.detail || 'Deployment failed';
        appendDeploymentLog(`❌ Error: ${errorMsg}`, 'error');
        updateDeploymentStatus('error', 'Deployment Failed');
        showToast(errorMsg, 'error');
      }
    }
  } catch (error) {
    const errorMsg = 'Network error. Please try again.';
    appendDeploymentLog(`❌ ${errorMsg}`, 'error');
    updateDeploymentStatus('error', 'Network Error');
    showToast(errorMsg, 'error');
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
    // Add optional build/start commands and port
    if (buildCommand) {
      formData.append('build_command', buildCommand);
    }
    if (startCommand) {
      formData.append('start_command', startCommand);
    }
    if (port) {
      formData.append('port', port);
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
      // Handle VM creation status (423)
      if (response.status === 423) {
        showToast(data.detail || 'Your virtual machine is being created. Please wait a few moments and try again.', 'warning');
      } else {
        showToast(data.detail || 'Failed to import multi-repository', 'error');
      }
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
      // Handle VM creation status (423)
      if (response.status === 423) {
        showToast(data.detail || 'Your virtual machine is being created. Please wait a few moments and try again.', 'warning');
      } else {
        showToast(data.detail || 'Failed to import repository', 'error');
      }
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
      
      // Ensure sidebar search field is not populated with username (clear if it was autofilled)
      const sidebarSearch = document.getElementById('sidebarSearch');
      if (sidebarSearch) {
        // Clear if it contains username or display name
        const searchValue = sidebarSearch.value.trim();
        if (searchValue === (data.username || '') || searchValue === (data.display_name || '')) {
          sidebarSearch.value = '';
        }
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
  
  // Delete Account button
  const deleteAccountBtn = document.getElementById('deleteAccountBtn');
  if (deleteAccountBtn) {
    deleteAccountBtn.addEventListener('click', async () => {
      await handleDeleteAccount();
    });
  }
}

async function handleDeleteAccount() {
  // Show confirmation dialog
  const confirmed = await showDeleteAccountConfirmation();
  if (!confirmed) {
    return;
  }
  
  try {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (!token) {
      showToast('You must be logged in to delete your account', 'error');
      return;
    }
    
    // Disable button during deletion
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
      deleteAccountBtn.disabled = true;
      deleteAccountBtn.textContent = 'Deleting Account...';
    }
    
    const response = await fetch('/api/user/account', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      showToast('Account deleted successfully', 'success');
      
      // Clear all local storage
      localStorage.clear();
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } else {
      showToast(data.detail || data.message || 'Failed to delete account', 'error');
      
      // Re-enable button on error
      if (deleteAccountBtn) {
        deleteAccountBtn.disabled = false;
        deleteAccountBtn.textContent = 'Delete Account';
      }
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    showToast('Network error. Please try again.', 'error');
    
    // Re-enable button on error
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
      deleteAccountBtn.disabled = false;
      deleteAccountBtn.textContent = 'Delete Account';
    }
  }
}

function showDeleteAccountConfirmation() {
  return new Promise((resolve) => {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;
    
    // Create modal content
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 2rem;
      max-width: 480px;
      width: 90%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;
    
    modal.innerHTML = `
      <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem; color: var(--text-primary);">
        Delete Account
      </h2>
      <p style="font-size: 0.9375rem; color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6;">
        Are you sure you want to delete your account? This action cannot be undone.
      </p>
      <div style="background: var(--color-error-bg); border: 1px solid var(--color-error); border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem;">
        <p style="font-size: 0.875rem; color: var(--color-error); margin: 0; line-height: 1.6;">
          <strong>Warning:</strong> This will permanently delete:
        </p>
        <ul style="font-size: 0.875rem; color: var(--color-error); margin: 0.5rem 0 0 1.5rem; padding: 0;">
          <li>All your projects and deployments</li>
          <li>All environment variables</li>
          <li>Your virtual machine</li>
          <li>All account data</li>
        </ul>
      </div>
      <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
        <button id="cancelDeleteBtn" class="btn-secondary" style="cursor: pointer;">
          Cancel
        </button>
        <button id="confirmDeleteBtn" class="btn-danger" style="cursor: pointer;">
          Delete Account
        </button>
      </div>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    
    // Handle cancel
    const cancelBtn = modal.querySelector('#cancelDeleteBtn');
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(false);
    });
    
    // Handle confirm
    const confirmBtn = modal.querySelector('#confirmDeleteBtn');
    confirmBtn.addEventListener('click', () => {
      document.body.removeChild(overlay);
      resolve(true);
    });
    
    // Close on overlay click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        document.body.removeChild(overlay);
        resolve(false);
      }
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        document.body.removeChild(overlay);
        document.removeEventListener('keydown', handleEscape);
        resolve(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
  });
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
  if (deploymentLogsWebSocket) {
    deploymentLogsWebSocket.close();
  }
});

// Deployment Logs WebSocket
let deploymentLogsWebSocket = null;
let deploymentLogsPaused = false;
let deploymentLogsBuffer = [];

function showDeploymentLogsPage() {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.style.display = 'none';
  });
  
  // Show deployment logs page
  const logsPage = document.getElementById('page-deployment-logs');
  if (logsPage) {
    logsPage.style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Deployment Logs';
    
    // Clear previous logs
    const logsContent = document.getElementById('deploymentLogsContent');
    if (logsContent) {
      logsContent.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 2rem;">Connecting to deployment stream... Logs will appear here.</p>';
    }
    
    // Update status badge
    const statusBadge = document.getElementById('deployment-status-badge');
    const statusText = document.getElementById('deployment-status-text');
    if (statusBadge) {
      statusBadge.className = 'status-badge status-info';
    }
    if (statusText) {
      statusText.textContent = 'Deploying...';
    }
  }
}

function connectDeploymentLogsWebSocket() {
  // Close existing connection if any
  if (deploymentLogsWebSocket) {
    deploymentLogsWebSocket.close();
  }
  
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const clientId = `deploy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const wsUrl = `${wsProtocol}//${window.location.host}/ws/${clientId}`;
  
  deploymentLogsWebSocket = new WebSocket(wsUrl);
  
  deploymentLogsWebSocket.onopen = () => {
    console.log('Deployment logs WebSocket connected');
    appendDeploymentLog('Connected to deployment stream', 'success');
  };
  
  deploymentLogsWebSocket.onmessage = (event) => {
    try {
      // Try to parse as JSON first
      const data = JSON.parse(event.data);
      if (data.message) {
        appendDeploymentLog(data.message, data.type || 'info');
        
        // Update status based on log messages
        if (data.message.includes('Deployment successful') || data.message.includes('🎉')) {
          updateDeploymentStatus('success', 'Deployment Successful');
        } else if (data.message.includes('failed') || data.message.includes('❌')) {
          updateDeploymentStatus('error', 'Deployment Failed');
        } else if (data.message.includes('Deploying') || data.message.includes('🚀')) {
          updateDeploymentStatus('info', 'Deploying...');
        }
      }
    } catch (e) {
      // If not JSON, treat as plain text
      appendDeploymentLog(event.data, 'info');
    }
  };
  
  deploymentLogsWebSocket.onerror = (error) => {
    console.error('Deployment logs WebSocket error:', error);
    appendDeploymentLog('WebSocket connection error', 'error');
  };
  
  deploymentLogsWebSocket.onclose = () => {
    console.log('Deployment logs WebSocket disconnected');
    appendDeploymentLog('Disconnected from deployment stream', 'warning');
  };
}

function appendDeploymentLog(message, type = 'info') {
  const logsContent = document.getElementById('deploymentLogsContent');
  if (!logsContent) return;
  
  // Remove "Connecting..." message if present
  if (logsContent.querySelector('p[style*="text-align: center"]')) {
    logsContent.innerHTML = '';
  }
  
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${type}`;
  logEntry.style.cssText = 'padding: 0.5rem; border-bottom: 1px solid var(--border-light); font-family: monospace; font-size: 0.875rem;';
  
  const timestamp = new Date().toLocaleTimeString();
  logEntry.innerHTML = `<span style="color: var(--text-secondary); margin-right: 0.5rem;">[${timestamp}]</span><span>${escapeHtml(message)}</span>`;
  
  logsContent.appendChild(logEntry);
  
  // Auto-scroll to bottom
  logsContent.scrollTop = logsContent.scrollHeight;
}

function updateDeploymentStatus(status, text) {
  const statusBadge = document.getElementById('deployment-status-badge');
  const statusText = document.getElementById('deployment-status-text');
  
  if (statusBadge) {
    statusBadge.className = `status-badge status-${status}`;
  }
  if (statusText) {
    statusText.textContent = text;
  }
}

function showDeploymentSuccessPage(result) {
  // Close deployment logs WebSocket
  if (deploymentLogsWebSocket) {
    deploymentLogsWebSocket.close();
    deploymentLogsWebSocket = null;
  }
  
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.style.display = 'none';
  });
  
  // Show success page
  const successPage = document.getElementById('page-deployment-success');
  if (successPage) {
    successPage.style.display = 'block';
    document.getElementById('pageTitle').textContent = 'Deployment Successful';
    
    // Update deployment info
    const projectName = currentProject?.name || result.project_name || 'Untitled Project';
    const deployedUrl = result.deployed_url || '';
    
    document.getElementById('success-project-name').textContent = projectName;
    document.getElementById('success-deployed-url').textContent = deployedUrl || 'Not available';
    document.getElementById('success-status').textContent = 'Running';
    
    // Set website preview iframe
    if (deployedUrl) {
      const preview = document.getElementById('website-preview');
      if (preview) {
        preview.src = deployedUrl;
      }
      
      // Set open site button
      const openBtn = document.getElementById('open-deployed-site-btn');
      if (openBtn) {
        openBtn.onclick = () => {
          window.open(deployedUrl, '_blank');
        };
      }
    } else {
      // Hide preview if no URL
      const previewContainer = document.getElementById('website-preview-container');
      if (previewContainer) {
        previewContainer.style.display = 'none';
      }
    }
    
    // Set view projects button
    const viewProjectsBtn = document.getElementById('view-projects-btn');
    if (viewProjectsBtn) {
      viewProjectsBtn.onclick = () => {
        router.navigate('/applications');
        loadProjects();
      };
    }
  }
  
  // Setup deployment logs buttons
  const clearBtn = document.getElementById('clearDeploymentLogsBtn');
  const toggleBtn = document.getElementById('toggleDeploymentLogsBtn');
  
  if (clearBtn) {
    clearBtn.onclick = () => {
      const logsContent = document.getElementById('deploymentLogsContent');
      if (logsContent) {
        logsContent.innerHTML = '';
      }
    };
  }
  
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      deploymentLogsPaused = !deploymentLogsPaused;
      toggleBtn.textContent = deploymentLogsPaused ? 'Resume' : 'Pause';
      if (!deploymentLogsPaused && deploymentLogsBuffer.length > 0) {
        deploymentLogsBuffer.forEach(log => appendDeploymentLog(log.message, log.type));
        deploymentLogsBuffer = [];
      }
    };
  }
}

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

