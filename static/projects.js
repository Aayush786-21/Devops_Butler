// Projects JavaScript
document.addEventListener('DOMContentLoaded', function() {
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
                loadUserRepositories();
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
    const projectsContent = document.getElementById('projectsContent');
    const username = document.getElementById('username');
    
    if (userSection && authButtons && username) {
        username.textContent = user.username || user.github_username || 'User';
        userSection.style.display = 'flex';
        authButtons.style.display = 'none';
    }
    
    if (authRequired && projectsContent) {
        authRequired.style.display = 'none';
        projectsContent.style.display = 'block';
    }
}

// Show unauthenticated user interface
function showUnauthenticatedUser() {
    // Redirect to login page if user is not authenticated
    window.location.href = '/login';
}

// Load user repositories
async function loadUserRepositories() {
    showLoadingState();
    try {
        const response = await fetch('/api/user/repositories', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        });
        if (response.status === 401) {
            showErrorState('You are not authenticated. Please log in again.');
            return;
        }
        const data = await response.json();
        if (response.ok && data.repositories) {
            displayRepositories(data.repositories);
        } else if (data.detail && data.detail.includes('GitHub')) {
            showErrorState('You are not connected with GitHub. Please log in with GitHub to see your repositories.');
        } else {
            showErrorState('Failed to load repositories. Please try again.');
        }
    } catch (error) {
        console.error('Error loading repositories:', error);
        showErrorState('Network error or not connected to GitHub. Please check your connection or log in with GitHub.');
    }
}

// Display repositories
function displayRepositories(repositories) {
    const repositoriesGrid = document.getElementById('repositoriesGrid');
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const emptyState = document.getElementById('emptyState');
    
    // Hide loading and error states
    if (loadingState) loadingState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';
    
    if (!repositoriesGrid) return;
    
    // Clear existing content
    repositoriesGrid.innerHTML = '';
    
    if (!repositories || repositories.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    // Hide empty state
    if (emptyState) emptyState.style.display = 'none';
    
    // Display repositories
    repositories.forEach(repo => {
        const repoCard = createRepositoryCard(repo);
        repositoriesGrid.appendChild(repoCard);
    });
}

// Create repository card
function createRepositoryCard(repo) {
    const template = document.getElementById('repoTemplate');
    if (!template) return document.createElement('div');
    
    const card = template.content.cloneNode(true);
    
    // Fill in repository data
    const repoName = card.querySelector('.repo-name');
    const repoDescription = card.querySelector('.repo-description');
    const repoLanguage = card.querySelector('.repo-language');
    const starsCount = card.querySelector('.stars-count');
    const repoUpdated = card.querySelector('.repo-updated');
    const repoVisibility = card.querySelector('.repo-visibility');
    const viewRepoBtn = card.querySelector('.view-repo-btn');
    const deployRepoBtn = card.querySelector('.deploy-repo-btn');
    
    if (repoName) repoName.textContent = repo.name;
    if (repoDescription) repoDescription.textContent = repo.description || 'No description';
    if (repoLanguage) repoLanguage.textContent = repo.language || 'Unknown';
    if (starsCount) starsCount.textContent = repo.stargazers_count || 0;
    if (repoUpdated) repoUpdated.textContent = formatDate(repo.updated_at);
    if (repoVisibility) {
        repoVisibility.textContent = repo.private ? 'Private' : 'Public';
        repoVisibility.className = `repo-visibility ${repo.private ? 'private' : 'public'}`;
    }
    
    // Set up button actions
    if (viewRepoBtn) {
        viewRepoBtn.addEventListener('click', () => {
            window.open(repo.html_url, '_blank');
        });
    }
    
    if (deployRepoBtn) {
        deployRepoBtn.addEventListener('click', () => {
            deployRepository(repo.html_url);
        });
    }
    
    return card;
}

// Deploy repository
function deployRepository(repoUrl) {
    // Redirect to deploy page with repository URL
    window.location.href = `/deploy?repo=${encodeURIComponent(repoUrl)}`;
}

// Show loading state
function showLoadingState() {
    const loadingState = document.getElementById('loadingState');
    const errorState = document.getElementById('errorState');
    const emptyState = document.getElementById('emptyState');
    const repositoriesGrid = document.getElementById('repositoriesGrid');
    
    if (loadingState) loadingState.style.display = 'block';
    if (errorState) errorState.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (repositoriesGrid) repositoriesGrid.innerHTML = '';
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
    
    // Search functionality
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }
    
    const repoSearch = document.getElementById('repoSearch');
    if (repoSearch) {
        repoSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // Filter functionality
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
        sortBy.addEventListener('change', handleFilterChange);
    }
    
    const languageFilter = document.getElementById('languageFilter');
    if (languageFilter) {
        languageFilter.addEventListener('change', handleFilterChange);
    }
    
    // Refresh button
    const refreshReposBtn = document.getElementById('refreshReposBtn');
    if (refreshReposBtn) {
        refreshReposBtn.addEventListener('click', loadUserRepositories);
    }
    
    // Retry button
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', loadUserRepositories);
    }
    
    // Quick deploy functionality
    const quickDeployBtn = document.getElementById('quickDeployBtn');
    if (quickDeployBtn) {
        quickDeployBtn.addEventListener('click', handleQuickDeploy);
    }
    
    const quickDeployUrl = document.getElementById('quickDeployUrl');
    if (quickDeployUrl) {
        quickDeployUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleQuickDeploy();
            }
        });
    }
}

// Handle search
async function handleSearch() {
    const searchInput = document.getElementById('repoSearch');
    const searchTerm = searchInput.value.trim();
    
    if (!searchTerm) {
        loadUserRepositories();
        return;
    }
    
    showLoadingState();
    
    try {
        const response = await fetch(`/api/repositories/${encodeURIComponent(searchTerm)}`);
        const repositories = await response.json();
        
        if (response.ok && Array.isArray(repositories)) {
            displayRepositories(repositories);
        } else {
            showErrorState('No public repositories found or failed to load.');
        }
    } catch (error) {
        console.error('Search error:', error);
        showErrorState('Search failed. Please try again.');
    }
}

// Handle filter change
async function handleFilterChange() {
    const sortBy = document.getElementById('sortBy');
    const languageFilter = document.getElementById('languageFilter');
    
    const sort = sortBy ? sortBy.value : '';
    const language = languageFilter ? languageFilter.value : '';
    
    showLoadingState();
    
    try {
        const params = new URLSearchParams();
        if (sort) params.append('sort', sort);
        if (language) params.append('language', language);
        
        const response = await fetch(`/api/repositories/user?${params.toString()}`);
        const repositories = await response.json();
        
        if (response.ok) {
            displayRepositories(repositories);
        } else {
            showErrorState('Failed to filter repositories');
        }
    } catch (error) {
        console.error('Filter error:', error);
        showErrorState('Filter failed. Please try again.');
    }
}

// Handle quick deploy
function handleQuickDeploy() {
    const quickDeployUrl = document.getElementById('quickDeployUrl');
    const url = quickDeployUrl.value.trim();
    
    if (!url) {
        alert('Please enter a repository URL');
        return;
    }
    
    // Validate URL
    if (!isValidGitUrl(url)) {
        alert('Please enter a valid GitHub repository URL');
        return;
    }
    
    // Redirect to deploy page
    window.location.href = `/deploy?repo=${encodeURIComponent(url)}`;
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

// Format date
function formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return 'Updated today';
        } else if (diffDays < 7) {
            return `Updated ${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `Updated ${weeks} week${weeks > 1 ? 's' : ''} ago`;
        } else {
            return date.toLocaleDateString();
        }
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