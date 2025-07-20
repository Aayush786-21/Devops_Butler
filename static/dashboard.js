// Dashboard JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication status
    checkAuthStatus();
    
    // Load dashboard data
    loadDashboardData();
    
    // Set up event listeners
    setupEventListeners();
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
    const username = document.getElementById('username');
    
    if (userSection && authButtons && username) {
        username.textContent = user.username || user.github_username || 'User';
        userSection.style.display = 'flex';
        authButtons.style.display = 'none';
    }
}

// Show unauthenticated user interface
function showUnauthenticatedUser() {
    // Redirect to login page if user is not authenticated
    window.location.href = '/login';
}

// Load dashboard data
async function loadDashboardData() {
    await Promise.all([
        loadStats(),
        loadRecentDeployments()
    ]);
}

// Load dashboard statistics
async function loadStats() {
    try {
        const response = await fetch('/api/dashboard/stats');
        const stats = await response.json();
        
        updateStatsDisplay(stats);
    } catch (error) {
        console.error('Error loading stats:', error);
        // Show default stats
        updateStatsDisplay({
            total_deployments: 0,
            successful_deployments: 0,
            active_users: 0,
            uptime: '99.9%'
        });
    }
}

// Update stats display
function updateStatsDisplay(stats) {
    const totalDeployments = document.getElementById('totalDeployments');
    const successfulDeployments = document.getElementById('successfulDeployments');
    const activeUsers = document.getElementById('activeUsers');
    const uptime = document.getElementById('uptime');
    
    if (totalDeployments) totalDeployments.textContent = stats.total_deployments || 0;
    if (successfulDeployments) successfulDeployments.textContent = stats.successful_deployments || 0;
    if (activeUsers) activeUsers.textContent = stats.active_users || 0;
    if (uptime) uptime.textContent = stats.uptime || '99.9%';
}

// Load recent deployments
async function loadRecentDeployments() {
    try {
        const response = await fetch('/api/deployments/recent');
        const deployments = await response.json();
        
        displayRecentDeployments(deployments);
    } catch (error) {
        console.error('Error loading recent deployments:', error);
        showEmptyDeployments();
    }
}

// Display recent deployments
function displayRecentDeployments(deployments) {
    const deploymentsGrid = document.getElementById('recentDeployments');
    const emptyDeployments = document.getElementById('emptyDeployments');
    
    if (!deploymentsGrid) return;
    
    if (!deployments || deployments.length === 0) {
        showEmptyDeployments();
        return;
    }
    
    // Hide empty state
    if (emptyDeployments) {
        emptyDeployments.style.display = 'none';
    }
    
    // Clear existing content
    deploymentsGrid.innerHTML = '';
    
    // Display deployments (limit to 6 for dashboard)
    const recentDeployments = deployments.slice(0, 6);
    
    recentDeployments.forEach(deployment => {
        const deploymentCard = createDeploymentCard(deployment);
        deploymentsGrid.appendChild(deploymentCard);
    });
}

// Create deployment card
function createDeploymentCard(deployment) {
    const card = document.createElement('div');
    card.className = 'deployment-card';
    
    const repoName = extractRepoName(deployment.git_url);
    const statusClass = getStatusClass(deployment.status);
    const statusText = getStatusText(deployment.status);
    
    card.innerHTML = `
        <div class="deployment-header">
            <div class="deployment-info">
                <h3 class="deployment-name">${repoName}</h3>
                ${deployment.deployed_url ? `<p class="deployment-url">${deployment.deployed_url}</p>` : ''}
            </div>
            <div class="deployment-status">
                <span class="status-badge ${statusClass}">${statusText}</span>
            </div>
        </div>
        <div class="deployment-details">
            <div class="detail-item">
                <i class="fas fa-calendar"></i>
                <span class="deployment-date">${formatDate(deployment.created_at)}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-clock"></i>
                <span class="deployment-time">${formatTime(deployment.created_at)}</span>
            </div>
        </div>
        <div class="deployment-actions">
            ${deployment.deployed_url ? `
                <a href="${deployment.deployed_url}" target="_blank" class="btn btn-outline btn-small">
                    <i class="fas fa-external-link-alt"></i>
                    View
                </a>
            ` : ''}
            <a href="/history" class="btn btn-primary btn-small">
                <i class="fas fa-history"></i>
                Details
            </a>
        </div>
    `;
    
    return card;
}

// Show empty deployments state
function showEmptyDeployments() {
    const deploymentsGrid = document.getElementById('recentDeployments');
    const emptyDeployments = document.getElementById('emptyDeployments');
    
    if (deploymentsGrid) {
        deploymentsGrid.innerHTML = '';
    }
    
    if (emptyDeployments) {
        emptyDeployments.style.display = 'block';
    }
}

// Extract repository name from Git URL
function extractRepoName(gitUrl) {
    if (!gitUrl) return 'Unknown Repository';
    
    try {
        const url = new URL(gitUrl);
        const pathParts = url.pathname.split('/');
        const repoName = pathParts[pathParts.length - 1];
        return repoName.replace('.git', '') || 'Unknown Repository';
    } catch (error) {
        return 'Unknown Repository';
    }
}

// Get status class for styling
function getStatusClass(status) {
    switch (status) {
        case 'success':
            return 'status-healthy';
        case 'failed':
            return 'status-error';
        case 'starting':
        case 'running':
            return 'status-warning';
        default:
            return 'status-warning';
    }
}

// Get status text
function getStatusText(status) {
    switch (status) {
        case 'success':
            return 'Success';
        case 'failed':
            return 'Failed';
        case 'starting':
            return 'Starting';
        case 'running':
            return 'Running';
        default:
            return 'Unknown';
    }
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    } catch (error) {
        return 'Unknown';
    }
}

// Format time
function formatTime(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
        return 'Unknown';
    }
}

// Set up event listeners
function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
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
            // Redirect to home page
            window.location.href = '/';
        } else {
            console.error('Logout failed');
        }
    } catch (error) {
        console.error('Error during logout:', error);
    }
}

// Refresh dashboard data
function refreshDashboard() {
    loadDashboardData();
}

// Auto-refresh every 30 seconds
setInterval(refreshDashboard, 30000); 