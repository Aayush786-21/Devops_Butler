// Deploy Page Logic

document.addEventListener('DOMContentLoaded', function() {
    const githubUsernameInput = document.getElementById('githubUsername');
    const repoTableContainer = document.getElementById('repoTableContainer');
    const repoTable = document.getElementById('repoTable');
    const repoUrlInput = document.getElementById('repoUrl');
    const deployForm = document.getElementById('deployForm');
    const logsBox = document.getElementById('logsBox');
    const frontendEnvInput = document.getElementById('frontendEnv');
    const backendEnvInput = document.getElementById('backendEnv');

    // --- Repo Search ---
    githubUsernameInput.addEventListener('input', async function() {
        const username = githubUsernameInput.value.trim();
        if (!username) {
            repoTableContainer.style.display = 'none';
            repoTable.querySelector('tbody').innerHTML = '';
            return;
        }
        // Fetch public repos
        try {
            const res = await fetch(`/api/repositories/${encodeURIComponent(username)}`);
            const data = await res.json();
            if (res.ok && data.repositories && Array.isArray(data.repositories)) {
                if (data.repositories.length === 0) {
                    repoTable.querySelector('tbody').innerHTML = '<tr><td colspan="2">No public repositories found.</td></tr>';
                    repoTableContainer.style.display = 'block';
                    return;
                }
                let rows = '';
                data.repositories.forEach(repo => {
                    rows += `<tr data-url="${repo.html_url}"><td>${repo.name}</td><td>${repo.description || ''}</td></tr>`;
                });
                repoTable.querySelector('tbody').innerHTML = rows;
                repoTableContainer.style.display = 'block';
                // Add click listeners
                repoTable.querySelectorAll('tr[data-url]').forEach(row => {
                    row.addEventListener('click', function() {
                        repoUrlInput.value = this.getAttribute('data-url') + '.git';
                    });
                });
            } else {
                repoTable.querySelector('tbody').innerHTML = '<tr><td colspan="2">Failed to load repositories.</td></tr>';
                repoTableContainer.style.display = 'block';
            }
        } catch (e) {
            repoTable.querySelector('tbody').innerHTML = '<tr><td colspan="2">Error fetching repositories.</td></tr>';
            repoTableContainer.style.display = 'block';
        }
    });

    // --- Deploy Form Submission ---
    deployForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        logsBox.style.display = 'block';
        logsBox.textContent = 'Starting deployment...\n';
        const formData = new FormData();
        formData.append('git_url', repoUrlInput.value);
        if (frontendEnvInput.files[0]) formData.append('frontend_env', frontendEnvInput.files[0]);
        if (backendEnvInput.files[0]) formData.append('backend_env', backendEnvInput.files[0]);
        try {
            // Start deployment and listen for logs
            const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${wsProtocol}//${window.location.host}/ws/web-client-${Date.now()}`;
            let ws;
            let wsConnected = false;
            try {
                ws = new WebSocket(wsUrl);
                ws.onopen = () => { wsConnected = true; };
                ws.onmessage = (event) => {
                    logsBox.textContent += event.data + '\n';
                    logsBox.scrollTop = logsBox.scrollHeight;
                };
                ws.onerror = () => { wsConnected = false; };
                ws.onclose = () => { wsConnected = false; };
            } catch (err) { wsConnected = false; }

            const res = await fetch('/deploy', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                logsBox.textContent += '\n✅ Deployment started!\n';
                if (Array.isArray(data) && data[1] && data[1][0]) {
                    logsBox.textContent += `\nApp URL: ${data[1][0]}\n`;
                }
            } else {
                logsBox.textContent += `\n❌ Deployment failed: ${data.detail || 'Unknown error'}\n`;
            }
        } catch (err) {
            logsBox.textContent += `\n❌ Error: ${err}\n`;
        }
    });
}); 