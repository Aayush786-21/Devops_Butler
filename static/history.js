// History JavaScript
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
                loadDeploymentHistory();
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
    const historyContent = document.getElementById('historyContent');
    const username = document.getElementById('username');
    
    if (userSection && authButtons && username) {
        username.textContent = user.username || user.github_username || 'User';
        userSection.style.display = 'flex';
        authButtons.style.display = 'none';
    }
    
    if (authRequired && historyContent) {
        authRequired.style.display = 'none';
        historyContent.style.display = 'block';
    }
}

// Show unauthenticated user interface
function showUnauthenticatedUser() {
    // Redirect to login page if user is not authenticated
    window.location.href = '/login';
}

// Load deployment history
async function loadDeploymentHistory() {
    showLoadingState();
    
    try {
        const response = await fetch('/api/deployments/history');
        const data = await response.json();
        
        if (response.ok) {
            displayDeployments(data.deployments);
            updateStats(data.stats);
        } else {
            showErrorState('Failed to load deployment history');
        }
    } catch (error) {
        console.error('Error loading history:', error);
        showErrorState('Network error. Please try again.');
    }
}

// Display deployments
function displayDeployments(deployments) {
    const deploymentsGrid = document.getElementById('deploymentsGrid');
    const deploymentsList = document.getElementById('deploymentsList');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const emptyState = document.getElementById('emptyState');
    
    // Hide loading and error states
    if (loadingState) loadingState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
    
    if (!deployments || deployments.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    // Hide empty state
    if (emptyState) emptyState.style.display = 'none';
    
    // Clear existing content
    if (deploymentsGrid) deploymentsGrid.innerHTML = '';
    if (deploymentsList) deploymentsList.innerHTML = '';
    
    // Display deployments
    deployments.forEach(deployment => {
        const deploymentCard = createDeploymentCard(deployment);
        
        if (deploymentsGrid) {
            deploymentsGrid.appendChild(deploymentCard.cloneNode(true));
        }
        if (deploymentsList) {
            deploymentsList.appendChild(deploymentCard.cloneNode(true));
        }
    });
}

// Create deployment card
function createDeploymentCard(deployment) {
    const template = document.getElementById('deploymentTemplate');
    if (!template) return document.createElement('div');
    
    const card = template.content.cloneNode(true);
    
    // Fill in deployment data
    const deploymentName = card.querySelector('.deployment-name');
    const deploymentUrl = card.querySelector('.deployment-url');
    const statusBadge = card.querySelector('.status-badge');
    const deploymentDate = card.querySelector('.deployment-date');
    const deploymentTime = card.querySelector('.deployment-time');
    const deploymentBranch = card.querySelector('.deployment-branch');
    const viewDeploymentBtn = card.querySelector('.view-deployment-btn');
    const redeployBtn = card.querySelector('.redeploy-btn');
    const deleteDeploymentBtn = card.querySelector('.delete-deployment-btn');
    
    const repoName = extractRepoName(deployment.git_url);
    const statusClass = getStatusClass(deployment.status);
    const statusText = getStatusText(deployment.status);
    
    if (deploymentName) deploymentName.textContent = repoName;
    if (deploymentUrl) deploymentUrl.textContent = deployment.deployed_url || 'Not deployed';
    if (statusBadge) {
        statusBadge.textContent = statusText;
        statusBadge.className = `status-badge ${statusClass}`;
    }
    if (deploymentDate) deploymentDate.textContent = formatDate(deployment.created_at);
    if (deploymentTime) deploymentTime.textContent = formatTime(deployment.created_at);
    if (deploymentBranch) deploymentBranch.textContent = 'main'; // Default branch
    
    // Set up button actions
    if (viewDeploymentBtn && deployment.deployed_url) {
        viewDeploymentBtn.addEventListener('click', () => {
            window.open(deployment.deployed_url, '_blank');
        });
    }
    
    if (redeployBtn) {
        redeployBtn.addEventListener('click', () => {
            redeployApplication(deployment);
        });
    }
    
    if (deleteDeploymentBtn) {
        deleteDeploymentBtn.addEventListener('click', () => {
            deleteDeployment(deployment);
        });
    }
    
    return card;
}

// Update statistics
function updateStats(stats) {
    const totalDeployments = document.getElementById('totalDeployments');
    const successfulDeployments = document.getElementById('successfulDeployments');
    const failedDeployments = document.getElementById('failedDeployments');
    const avgDeploymentTime = document.getElementById('avgDeploymentTime');
    
    if (totalDeployments) totalDeployments.textContent = stats.total || 0;
    if (successfulDeployments) successfulDeployments.textContent = stats.successful || 0;
    if (failedDeployments) failedDeployments.textContent = stats.failed || 0;
    if (avgDeploymentTime) avgDeploymentTime.textContent = stats.avg_time || '0s';
}

// Show loading state
function showLoadingState() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const emptyState = document.getElementById('emptyState');
    const deploymentsGrid = document.getElementById('deploymentsGrid');
    const deploymentsList = document.getElementById('deploymentsList');
    
    if (loadingState) loadingState.style.display = 'block';
    if (errorState) errorState.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (deploymentsGrid) deploymentsGrid.innerHTML = '';
    if (deploymentsList) deploymentsList.innerHTML = '';
}

// Show error state
function showErrorState(message) {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    
    if (loadingState) loadingState.style.display = 'none';
    if (errorState) errorState.style.display = 'block';
    if (errorMessage) errorMessage.textContent = message;
}

// Set up event listeners
function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Filter functionality
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', handleFilterChange);
    }
    
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', handleFilterChange);
    }
    
    const searchFilter = document.getElementById('searchFilter');
    if (searchFilter) {
        searchFilter.addEventListener('input', handleSearchFilter);
    }
    
    // Action buttons
    const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
    if (refreshHistoryBtn) {
        refreshHistoryBtn.addEventListener('click', loadDeploymentHistory);
    }
    
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearAllHistory);
    }
    
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', loadDeploymentHistory);
    }
    
    // View options
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const deploymentsGrid = document.getElementById('deploymentsGrid');
    const deploymentsList = document.getElementById('deploymentsList');
    
    if (gridViewBtn) {
        gridViewBtn.addEventListener('click', () => {
            setViewMode('grid', gridViewBtn, listViewBtn, deploymentsGrid, deploymentsList);
        });
    }
    
    if (listViewBtn) {
        listViewBtn.addEventListener('click', () => {
            setViewMode('list', listViewBtn, gridViewBtn, deploymentsList, deploymentsGrid);
        });
    }
    
    // Modal functionality
    const confirmationModal = document.getElementById('confirmationModal');
    const closeModal = document.getElementById('closeModal');
    const cancelAction = document.getElementById('cancelAction');
    
    if (closeModal) {
        closeModal.addEventListener('click', closeConfirmationModal);
    }
    
    if (cancelAction) {
        cancelAction.addEventListener('click', closeConfirmationModal);
    }
    
    if (confirmationModal) {
        confirmationModal.addEventListener('click', (e) => {
            if (e.target === confirmationModal) {
                closeConfirmationModal();
            }
        });
    }
}

// Handle filter change
async function handleFilterChange() {
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    
    const status = statusFilter ? statusFilter.value : '';
    const dateRange = dateFilter ? dateFilter.value : '';
    
    await loadFilteredHistory(status, dateRange);
}

// Handle search filter
let searchTimeout;
function handleSearchFilter() {
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(async () => {
        const searchFilter = document.getElementById('searchFilter');
        const searchTerm = searchFilter ? searchFilter.value.trim() : '';
        
        await loadFilteredHistory('', '', searchTerm);
    }, 300);
}

// Load filtered history
async function loadFilteredHistory(status = '', dateRange = '', searchTerm = '') {
    showLoadingState();
    
    try {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        if (dateRange) params.append('date_range', dateRange);
        if (searchTerm) params.append('search', searchTerm);
        
        const response = await fetch(`/api/deployments/history?${params.toString()}`);
        const data = await response.json();
        
        if (response.ok) {
            displayDeployments(data.deployments);
            updateStats(data.stats);
        } else {
            showErrorState('Failed to load filtered history');
        }
    } catch (error) {
        console.error('Filter error:', error);
        showErrorState('Filter failed. Please try again.');
    }
}

// Set view mode
function setViewMode(mode, activeBtn, inactiveBtn, activeContainer, inactiveContainer) {
    if (activeBtn) activeBtn.classList.add('active');
    if (inactiveBtn) inactiveBtn.classList.remove('active');
    
    if (activeContainer) activeContainer.style.display = 'block';
    if (inactiveContainer) inactiveContainer.style.display = 'none';
}

// Redeploy application
function redeployApplication(deployment) {
    showConfirmationModal(
        'Redeploy Application',
        `Are you sure you want to redeploy "${extractRepoName(deployment.git_url)}"?`,
        () => {
            window.location.href = `/deploy?repo=${encodeURIComponent(deployment.git_url)}`;
        }
    );
}

// Delete deployment
function deleteDeployment(deployment) {
    showConfirmationModal(
        'Delete Deployment',
        `Are you sure you want to delete the deployment for "${extractRepoName(deployment.git_url)}"? This action cannot be undone.`,
        () => {
            performDeleteDeployment(deployment.id);
        }
    );
}

// Perform delete deployment
async function performDeleteDeployment(deploymentId) {
    try {
        const response = await fetch(`/api/deployments/${deploymentId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            closeConfirmationModal();
            loadDeploymentHistory(); // Refresh the list
        } else {
            alert('Failed to delete deployment');
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete deployment');
    }
}

// Clear all history
function clearAllHistory() {
    showConfirmationModal(
        'Clear All History',
        'Are you sure you want to clear all deployment history? This action cannot be undone.',
        async () => {
            try {
                const response = await fetch('/api/deployments/clear', {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    closeConfirmationModal();
                    loadDeploymentHistory(); // Refresh the list
                } else {
                    alert('Failed to clear history');
                }
            } catch (error) {
                console.error('Clear error:', error);
                alert('Failed to clear history');
            }
        }
    );
}

// Show confirmation modal
function showConfirmationModal(title, message, onConfirm) {
    const modal = document.getElementById('confirmationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const confirmAction = document.getElementById('confirmAction');
    
    if (modal && modalTitle && modalMessage && confirmAction) {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        
        // Remove existing event listeners
        const newConfirmAction = confirmAction.cloneNode(true);
        confirmAction.parentNode.replaceChild(newConfirmAction, confirmAction);
        
        // Add new event listener
        newConfirmAction.addEventListener('click', () => {
            onConfirm();
        });
        
        modal.style.display = 'flex';
    }
}

// Close confirmation modal
function closeConfirmationModal() {
    const modal = document.getElementById('confirmationModal');
    if (modal) {
        modal.style.display = 'none';
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