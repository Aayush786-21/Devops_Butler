// Deploy JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('authToken');
    const currentPath = window.location.pathname;
    const isAuthPage = ['/login', '/register', '/auth'].includes(currentPath);
    if (token && isAuthPage) {
      window.location.href = '/dashboard';
    }
    // Check authentication status
    checkAuthStatus();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize WebSocket for real-time logs
    initializeWebSocket();
});

// Check if user is authenticated
async function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const currentPath = window.location.pathname;
    const isAuthPage = ['/login', '/register', '/auth'].includes(currentPath);

    try {
        const response = await fetch('/api/auth/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();

        if (data.authenticated) {
            if (isAuthPage) {
                window.location.href = '/dashboard';
            } else {
                showAuthenticatedUser(data.user);
                // Do NOT call loadUserRepositories() here
            }
        } else {
            if (!isAuthPage) {
                window.location.href = '/login';
            }
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        if (!isAuthPage) {
            window.location.href = '/login';
        }
    }
}

// Show authenticated user interface
function showAuthenticatedUser(user) {
    const userSection = document.getElementById('userSection');
    const authButtons = document.getElementById('authButtons');
    const authRequired = document.getElementById('authRequired');
    const deployForm = document.getElementById('deployForm');
    const username = document.getElementById('username');
    
    if (userSection && authButtons && username) {
        username.textContent = user.username || user.github_username || 'User';
        userSection.style.display = 'flex';
        authButtons.style.display = 'none';
    }
    
    if (authRequired && deployForm) {
        authRequired.style.display = 'none';
        deployForm.style.display = 'block';
    }
}

// Show unauthenticated user interface
function showUnauthenticatedUser() {
    // Redirect to login page if user is not authenticated
    window.location.href = '/login';
}

// Load user repositories
async function loadUserRepositories() {
    try {
        const response = await fetch('/api/repositories/user');
        const repositories = await response.json();
        
        displayRepositories(repositories);
    } catch (error) {
        console.error('Error loading repositories:', error);
        showRepositoriesError('Failed to load repositories');
    }
}

// Display repositories
function displayRepositories(repositories) {
    const reposList = document.getElementById('reposList');
    
    if (!reposList) return;
    
    reposList.innerHTML = '';
    
    if (!repositories || repositories.length === 0) {
        reposList.innerHTML = '<p class="no-repos">No repositories found. Make sure your repositories are public.</p>';
        return;
    }
    
    repositories.forEach(repo => {
        const repoItem = createRepositoryItem(repo);
        reposList.appendChild(repoItem);
    });
}

// Create repository item
function createRepositoryItem(repo) {
    const item = document.createElement('div');
    item.className = 'repo-item';
    
    item.innerHTML = `
        <div class="repo-item-content">
            <div class="repo-item-info">
                <h4>${repo.name}</h4>
                <p>${repo.description || 'No description'}</p>
                <div class="repo-item-meta">
                    <span class="repo-language">${repo.language || 'Unknown'}</span>
                    <span class="repo-visibility">${repo.private ? 'Private' : 'Public'}</span>
                </div>
            </div>
            <button class="btn btn-primary btn-small select-repo-btn" data-repo-url="${repo.html_url}">
                Select
            </button>
        </div>
    `;
    
    // Add click event
    const selectBtn = item.querySelector('.select-repo-btn');
    selectBtn.addEventListener('click', () => {
        selectRepository(repo.html_url);
    });
    
    return item;
}

// Select repository
function selectRepository(repoUrl) {
    const gitUrlInput = document.getElementById('gitUrl');
    const manualRepoUrl = document.getElementById('manualRepoUrl');
    
    if (gitUrlInput) {
        gitUrlInput.value = repoUrl;
    }
    
    if (manualRepoUrl) {
        manualRepoUrl.value = repoUrl;
    }
    
    // Update status
    updateDeployStatus('Repository selected. Ready to deploy.', 'info');
}

// Show repositories error
function showRepositoriesError(message) {
    const reposList = document.getElementById('reposList');
    
    if (reposList) {
        reposList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
            </div>
        `;
    }
}

// Set up event listeners
function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Deploy form
    const deployForm = document.getElementById('deployFormElement');
    if (deployForm) {
        deployForm.addEventListener('submit', handleDeploy);
    }
    
    // Repository search
    const searchBtn = document.getElementById('searchReposBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleRepoSearch);
    }
    
    // Manual repo URL input
    const manualRepoUrl = document.getElementById('manualRepoUrl');
    if (manualRepoUrl) {
        manualRepoUrl.addEventListener('input', handleManualRepoInput);
    }
    
    // Clear logs button
    const clearLogsBtn = document.getElementById('clearLogsBtn');
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', clearLogs);
    }
}

// Update handleRepoSearch to use the githubUsername input for public repo search
async function handleRepoSearch() {
    const usernameInput = document.getElementById('githubUsername');
    const repoList = document.getElementById('repoList');
    repoList.innerHTML = '';
    const username = usernameInput.value.trim();
    if (!username) {
        showRepositoriesError('Please enter a GitHub username.');
        return;
    }
    try {
        const response = await fetch(`/api/repositories/${encodeURIComponent(username)}`);
        const data = await response.json();
        if (response.ok && data.repositories && Array.isArray(data.repositories)) {
            if (data.repositories.length === 0) {
                showRepositoriesError('No public repositories found for this user.');
            } else {
                data.repositories.forEach(repo => {
                    const repoItem = document.createElement('div');
                    repoItem.className = 'repo-item';
                    repoItem.innerHTML = `
                        <div class="repo-item-content">
                            <div class="repo-item-info">
                                <h4>${repo.name}</h4>
                                <p>${repo.description || 'No description'}</p>
                                <div class="repo-item-meta">
                                    <span class="repo-language">${repo.language || 'Unknown'}</span>
                                    <span class="repo-visibility">${repo.private ? 'Private' : 'Public'}</span>
                                </div>
                            </div>
                            <button class="btn btn-primary btn-small select-repo-btn" data-repo-url="${repo.html_url}">
                                Select
                            </button>
                        </div>
                    `;
                    repoItem.querySelector('.select-repo-btn').addEventListener('click', () => {
                        selectRepository(repo.html_url);
                    });
                    repoList.appendChild(repoItem);
                });
            }
        } else {
            showRepositoriesError('No public repositories found or failed to load.');
        }
    } catch (error) {
        console.error('Error searching repositories:', error);
        showRepositoriesError('Failed to search repositories');
    }
}

// Handle manual repository input
function handleManualRepoInput() {
    const manualRepoUrl = document.getElementById('manualRepoUrl');
    const gitUrlInput = document.getElementById('gitUrl');
    
    if (gitUrlInput && manualRepoUrl.value) {
        gitUrlInput.value = manualRepoUrl.value;
    }
}

// Handle deployment
async function handleDeploy(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const gitUrl = formData.get('git_url');
    
    if (!gitUrl) {
        updateDeployStatus('Please enter a repository URL', 'error');
        return;
    }
    
    // Validate Git URL
    if (!isValidGitUrl(gitUrl)) {
        updateDeployStatus('Please enter a valid GitHub repository URL', 'error');
        return;
    }
    
    // Start deployment
    startDeployment(formData);
}

// Validate Git URL
function isValidGitUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname === 'github.com' && urlObj.pathname.split('/').length >= 3;
    } catch (error) {
        return false;
    }
}

// Start deployment
async function startDeployment(formData) {
    try {
        // Update status
        updateDeployStatus('Starting deployment...', 'info');
        showLogsContainer();
        clearLogs();
        
        // Send deployment request
        const response = await fetch('/deploy', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            updateDeployStatus('Deployment started successfully!', 'success');
            // WebSocket will handle real-time logs
        } else {
            updateDeployStatus(result.error || 'Deployment failed', 'error');
        }
    } catch (error) {
        console.error('Deployment error:', error);
        updateDeployStatus('Deployment failed. Please try again.', 'error');
    }
}

// Update deployment status
function updateDeployStatus(message, type = 'info') {
    const statusContainer = document.getElementById('deployStatus');
    
    if (!statusContainer) return;
    
    const icon = getStatusIcon(type);
    const statusClass = getStatusClass(type);
    
    statusContainer.innerHTML = `
        <div class="status-message ${statusClass}">
            ${icon}
            ${message}
        </div>
    `;
}

// Get status icon
function getStatusIcon(type) {
    switch (type) {
        case 'success':
            return '<i class="fas fa-check-circle"></i>';
        case 'error':
            return '<i class="fas fa-times-circle"></i>';
        case 'warning':
            return '<i class="fas fa-exclamation-triangle"></i>';
        default:
            return '<i class="fas fa-info-circle"></i>';
    }
}

// Get status class
function getStatusClass(type) {
    switch (type) {
        case 'success':
            return 'status-success';
        case 'error':
            return 'status-error';
        case 'warning':
            return 'status-warning';
        default:
            return 'status-info';
    }
}

// Show logs container
function showLogsContainer() {
    const logsContainer = document.getElementById('deploymentLogs');
    if (logsContainer) {
        logsContainer.style.display = 'block';
    }
}

// Clear logs
function clearLogs() {
    const logsContent = document.getElementById('logsContent');
    if (logsContent) {
        logsContent.innerHTML = '';
    }
}

// Initialize WebSocket for real-time logs
function initializeWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/web-client-${Date.now()}`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = function() {
        console.log('WebSocket connected');
    };
    
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
    };
    
    ws.onclose = function() {
        console.log('WebSocket disconnected');
    };
    
    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
    };
}

// Handle WebSocket messages
function handleWebSocketMessage(data) {
    if (data.type === 'log') {
        addLog(data.message, data.level);
    } else if (data.type === 'deployment_success') {
        handleDeploymentSuccess(data);
    } else if (data.type === 'deployment_error') {
        handleDeploymentError(data);
    }
}

// Add log entry
function addLog(message, level = 'info') {
    const logsContent = document.getElementById('logsContent');
    
    if (!logsContent) return;
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${level}`;
    logEntry.textContent = message;
    
    logsContent.appendChild(logEntry);
    logsContent.scrollTop = logsContent.scrollHeight;
    
    // Check for deployment success message
    if (message.includes('✅ Successfully deployed') || message.includes('deployment completed')) {
        extractAndShowDeploymentUrl(message);
    }
}

// Handle deployment success
function handleDeploymentSuccess(data) {
    updateDeployStatus('Deployment completed successfully!', 'success');
    
    if (data.deployed_url) {
        showDeploymentUrlButton(data.deployed_url);
    }
}

// Handle deployment error
function handleDeploymentError(data) {
    updateDeployStatus('Deployment failed', 'error');
    addLog(data.error || 'Deployment failed', 'error');
}

// Extract and show deployment URL
function extractAndShowDeploymentUrl(message) {
    const urlMatch = message.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
        const deployedUrl = urlMatch[0];
        showDeploymentUrlButton(deployedUrl);
    }
}

// Show deployment URL button
function showDeploymentUrlButton(url) {
    const urlButtonContainer = document.getElementById('deploymentUrlButton');
    
    if (!urlButtonContainer) return;
    
    urlButtonContainer.innerHTML = `
        <a href="${url}" target="_blank" class="deployment-url-btn">
            <i class="fas fa-external-link-alt"></i>
            View Deployed Application
        </a>
    `;
    
    urlButtonContainer.style.display = 'block';
    
    // Add animation
    setTimeout(() => {
        urlButtonContainer.style.opacity = '1';
        urlButtonContainer.style.transform = 'translateY(0)';
    }, 100);
}

// Handle logout
async function handleLogout() {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            window.location.href = '/';
        } else {
            console.error('Logout failed');
        }
    } catch (error) {
        console.error('Error during logout:', error);
    }
} 

// --- GitHub Repositories ---
let selectedRepo = null;

async function searchPublicRepositories(username) {
    const reposList = document.getElementById('repositories-list');
    const reposLoading = document.getElementById('repos-loading');
    const reposError = document.getElementById('repos-error');
    const refreshBtn = document.getElementById('refreshReposBtn');
    if (!username.trim()) {
        showToast('Please enter a GitHub username', 'error');
        return;
    }
    if (refreshBtn) refreshBtn.style.display = 'none';
    reposLoading.style.display = 'block';
    reposError.style.display = 'none';
    reposList.innerHTML = '';
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
        reposError.textContent = 'Failed to load repositories. Please check the username and try again.';
        reposError.style.display = 'block';
    } finally {
        reposLoading.style.display = 'none';
    }
}

async function loadDemoRepositories() {
    const reposList = document.getElementById('repositories-list');
    const reposLoading = document.getElementById('repos-loading');
    const reposError = document.getElementById('repos-error');
    const refreshBtn = document.getElementById('refreshReposBtn');
    if (refreshBtn) refreshBtn.style.display = 'none';
    reposLoading.style.display = 'block';
    reposError.style.display = 'none';
    reposList.innerHTML = '';
    hideWelcomeMessage();
    try {
        const response = await fetch('/api/repositories/demo_user');
        const data = await response.json();
        if (response.ok && data.repositories) {
            displayRepositories(data.repositories, 'Popular repositories you can deploy');
        } else {
            throw new Error(data.detail || 'Failed to load demo repositories');
        }
    } catch (error) {
        reposError.textContent = 'Failed to load demo repositories. Please try again.';
        reposError.style.display = 'block';
    } finally {
        reposLoading.style.display = 'none';
    }
}

function hideWelcomeMessage() {
    const welcomeMsg = document.getElementById('repos-welcome');
    if (welcomeMsg) welcomeMsg.style.display = 'none';
}

function displayRepositories(repositories, title = 'Repositories') {
    const reposList = document.getElementById('repositories-list');
    if (!reposList) return;
    if (repositories.length === 0) {
        reposList.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 2rem;"><p>No repositories found. Try a different username or check if the user has public repositories.</p></div>`;
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
    document.querySelectorAll('.repo-card').forEach(card => {
        card.addEventListener('click', () => selectRepository(card));
    });
}

function selectRepository(card) {
    document.querySelectorAll('.repo-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    const repoUrl = card.dataset.repoUrl;
    const repoName = card.dataset.repoName;
    document.getElementById('git-url').value = repoUrl;
    selectedRepo = repoUrl;
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

document.getElementById('searchReposBtn')?.addEventListener('click', () => {
    const username = document.getElementById('usernameSearch').value;
    searchPublicRepositories(username);
});
document.getElementById('usernameSearch')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const username = e.target.value;
        searchPublicRepositories(username);
    }
});
document.getElementById('showDemoReposBtn')?.addEventListener('click', () => {
    loadDemoRepositories();
    showToast('Loading demo repositories...', 'info');
}); 