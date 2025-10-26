// Repository Tree View JavaScript
let currentRepo = null;
let currentPath = '';
let authToken = localStorage.getItem('authToken');

// Initialize repository tree view
document.addEventListener('DOMContentLoaded', function() {
    // No longer require authentication for public repositories
    
    // Get repository info from URL or session
    const urlParams = new URLSearchParams(window.location.search);
    const repo = urlParams.get('repo');
    const owner = urlParams.get('owner');
    
    if (repo && owner) {
        loadRepositoryTree(owner, repo);
    } else {
        showToast('No repository specified', 'error');
        setTimeout(() => {
            window.location.href = '/';
        }, 2000);
    }
});

// Load repository tree structure
async function loadRepositoryTree(owner, repo, path = '') {
    currentRepo = { owner, repo };
    currentPath = path;
    
    showLoading();
    
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add authorization if available
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(`/api/repository/${owner}/${repo}/contents${path ? `/${path}` : ''}`, {
            headers: headers
        });
        
        if (response.status === 401) {
            handleAuthError();
            return;
        }
        
        const data = await response.json();
        
        if (response.ok) {
            hideLoading();
            renderTree(data.contents || data);
            updateBreadcrumb();
        } else {
            showToast(data.detail || 'Failed to load repository contents', 'error');
        }
    } catch (error) {
        console.error('Error loading repository tree:', error);
        showToast('Failed to load repository contents', 'error');
    }
}

// Render tree structure
function renderTree(items) {
    const container = document.getElementById('tree-container');
    container.innerHTML = '';
    
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📁</div>
                <p>This directory is empty</p>
            </div>
        `;
        return;
    }
    
    // Sort items: folders first, then files
    const sortedItems = items.sort((a, b) => {
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
    });
    
    sortedItems.forEach(item => {
        const treeItem = createTreeItem(item);
        container.appendChild(treeItem);
    });
}

// Create tree item element
function createTreeItem(item) {
    const div = document.createElement('div');
    div.className = 'tree-item';
    div.dataset.path = item.path;
    div.dataset.type = item.type;
    
    const icon = item.type === 'dir' ? '📁' : getFileIcon(item.name);
    const name = item.name;
    
    div.innerHTML = `
        <span class="tree-item-icon">${icon}</span>
        <span class="tree-item-name">${name}</span>
    `;
    
    div.addEventListener('click', () => handleTreeItemClick(item));
    
    return div;
}

// Handle tree item click
function handleTreeItemClick(item) {
    if (item.type === 'dir') {
        // Navigate into directory
        loadRepositoryTree(currentRepo.owner, currentRepo.repo, item.path);
    } else {
        // Load file content
        loadFileContent(item);
    }
}

// Load file content
async function loadFileContent(file) {
    const container = document.getElementById('file-container');
    const loading = document.getElementById('file-loading');
    
    loading.style.display = 'block';
    
    try {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        // Add authorization if available
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(`/api/repository/${currentRepo.owner}/${currentRepo.repo}/contents/${file.path}`, {
            headers: headers
        });
        
        if (response.status === 401) {
            handleAuthError();
            return;
        }
        
        const data = await response.json();
        
        if (response.ok) {
            loading.style.display = 'none';
            
            if (data.type === 'file') {
                // Handle file content
                const content = atob(data.content);
                const extension = file.name.split('.').pop().toLowerCase();
                
                container.innerHTML = `
                    <div class="file-header">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${formatFileSize(data.size)}</div>
                    </div>
                    <pre><code class="language-${extension}">${escapeHtml(content)}</code></pre>
                `;
                
                // Highlight code if Prism.js is available
                if (window.Prism) {
                    Prism.highlightAll();
                }
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">⚠️</div>
                        <p>Unable to display this file type</p>
                    </div>
                `;
            }
        } else {
            showToast(data.detail || 'Failed to load file content', 'error');
        }
    } catch (error) {
        console.error('Error loading file content:', error);
        showToast('Failed to load file content', 'error');
    }
}

// Get file icon based on extension
function getFileIcon(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'js': '📄',
        'jsx': '📄',
        'ts': '📄',
        'tsx': '📄',
        'py': '🐍',
        'java': '☕',
        'cpp': '⚙️',
        'c': '⚙️',
        'html': '🌐',
        'css': '🎨',
        'scss': '🎨',
        'sass': '🎨',
        'json': '📋',
        'xml': '📋',
        'yml': '📋',
        'yaml': '📋',
        'md': '📝',
        'txt': '📝',
        'sql': '🗄️',
        'sh': '🐚',
        'bat': '🪟',
        'dockerfile': '🐳',
        'gitignore': '🚫'
    };
    
    return iconMap[extension] || '📄';
}

// Update breadcrumb navigation
function updateBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumb');
    const currentRepoSpan = document.getElementById('current-repo');
    
    if (currentPath) {
        const pathParts = currentPath.split('/');
        let breadcrumbHTML = `
            <span class="breadcrumb-item" onclick="navigateToRoot()">${currentRepo.repo}</span>
        `;
        
        let currentPathBuild = '';
        pathParts.forEach((part, index) => {
            if (part) {
                currentPathBuild += (index > 0 ? '/' : '') + part;
                breadcrumbHTML += `
                    <span class="breadcrumb-separator">/</span>
                    <span class="breadcrumb-item" onclick="navigateToPath('${currentPathBuild}')">${part}</span>
                `;
            }
        });
        
        breadcrumb.innerHTML = breadcrumbHTML;
    } else {
        breadcrumb.innerHTML = `
            <span class="breadcrumb-item" onclick="navigateToRoot()">Repositories</span>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-item">${currentRepo.repo}</span>
        `;
    }
}

// Navigation functions
function navigateToRoot() {
    loadRepositoryTree(currentRepo.owner, currentRepo.repo);
}

function navigateToPath(path) {
    loadRepositoryTree(currentRepo.owner, currentRepo.repo, path);
}

function goBackToRepos() {
    window.location.href = '/';
}

// Utility functions
function showLoading() {
    document.getElementById('tree-loading').style.display = 'flex';
    document.getElementById('tree-container').style.display = 'none';
}

function hideLoading() {
    document.getElementById('tree-loading').style.display = 'none';
    document.getElementById('tree-container').style.display = 'block';
}

function handleAuthError() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    showToast('Session expired. Please login again.', 'error');
    setTimeout(() => {
        window.location.href = '/login';
    }, 2000);
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        z-index: 1000;
        background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#22c55e' : '#3b82f6'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Add click handlers for repository navigation
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', goBackToRepos);
    }
});
