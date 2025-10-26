// Repository Tree Integration Script
// This script adds repository tree browsing functionality to the existing app

// Add repository tree navigation function
function viewRepositoryTree(owner, repo) {
    if (!authToken) {
        showToast('Please login to browse repository files', 'error');
        return;
    }
    
    // Navigate to repository tree view
    window.location.href = `/repository-tree.html?owner=${owner}&repo=${repo}`;
}

// Update repository card display to include browse button
function updateRepositoryCards() {
    const reposList = document.getElementById('repositories-list');
    if (!reposList) return;
    
    // Add CSS for repository actions
    const style = document.createElement('style');
    style.textContent = `
        .repo-actions {
            margin-top: 1rem;
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        
        .repo-actions .btn {
            padding: 0.4rem 0.8rem;
            font-size: 0.8rem;
            flex: 1;
            min-width: 100px;
        }
    `;
    document.head.appendChild(style);
}

// Enhanced repository display with tree browsing
function displayRepositoriesWithTree(repositories, title = 'Repositories') {
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

// Override the existing displayRepositories function
if (typeof displayRepositories !== 'undefined') {
    window.displayRepositories = displayRepositoriesWithTree;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    updateRepositoryCards();
});
