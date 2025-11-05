// Authentication JavaScript
let isLoginForm = true;

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Form toggle
    const toggleLink = document.getElementById('toggleLink');
    if (toggleLink) {
        toggleLink.addEventListener('click', (e) => {
            e.preventDefault();
            toggleForm();
        });
    }
    
    // Setup form event listeners
    setupFormListeners();
    
    // Setup password toggle functionality
    setupPasswordToggles();
    
    // Check if user is already logged in
    checkAuthStatus();
});

function toggleForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const toggleText = document.getElementById('toggleText');
    const toggleLink = document.getElementById('toggleLink');
    
    if (isLoginForm) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        toggleText.textContent = 'Already have an account? ';
        toggleLink.textContent = 'Sign in';
        isLoginForm = false;
    } else {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        toggleText.textContent = "Don't have an account? ";
        toggleLink.textContent = 'Sign up';
        isLoginForm = true;
    }
    
    clearErrors();
}

function clearErrors() {
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('registerError').style.display = 'none';
    document.getElementById('registerSuccess').style.display = 'none';
}

function showToast(message, type = 'info') {
    // Simple console log for now, or create toast element if needed
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Try to find toast element, if it exists
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `toast toast-${type}`;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
}

function setLoading(buttonId, textId, isLoading, loadingText = 'Loading...', originalText = '') {
    const button = document.getElementById(buttonId);
    const text = document.getElementById(textId);
    
    if (isLoading) {
        button.disabled = true;
        text.textContent = loadingText;
    } else {
        button.disabled = false;
        text.textContent = originalText;
    }
}

function setupFormListeners() {
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername')?.value;
            const password = document.getElementById('loginPassword')?.value;
            const errorDiv = document.getElementById('loginError');
            
            if (!username || !password) {
                if (errorDiv) {
                    errorDiv.textContent = 'Please enter both username and password.';
                    errorDiv.style.display = 'block';
                }
                return;
            }
            
            // Clear previous errors
            if (errorDiv) errorDiv.style.display = 'none';
            
            // Set loading state
            setLoading('loginBtn', 'loginBtnText', true, 'Signing In...', 'Sign In');
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });
                
                // Get response text first to handle non-JSON responses
                const responseText = await response.text();
                let data;
                
                try {
                    // Try to parse as JSON
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    // If response is not JSON, it might be an HTML error page
                    console.error('Failed to parse response as JSON:', responseText.substring(0, 100));
                    if (errorDiv) {
                        errorDiv.textContent = 'Server error. Please try again or check if the server is running.';
                        errorDiv.style.display = 'block';
                    }
                    return;
                }
                
                if (response.ok) {
                    // Store the token with consistent naming
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('authToken', data.access_token); // Keep both for compatibility
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('authProvider', 'local');
                    
                    showToast('Login successful! Redirecting...', 'success');
                    
                    // Check if there's a redirect URL in the query params
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirectTo = urlParams.get('redirect') || '/';
                    
                    // Redirect to the intended page
                    setTimeout(() => {
                        window.location.href = redirectTo;
                    }, 1000);
                } else {
                    if (errorDiv) {
                        errorDiv.textContent = data.detail || 'Login failed. Please try again.';
                        errorDiv.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('Login error:', error);
                if (errorDiv) {
                    errorDiv.textContent = 'Network error. Please try again.';
                    errorDiv.style.display = 'block';
                }
            } finally {
                setLoading('loginBtn', 'loginBtnText', false, 'Signing In...', 'Sign In');
            }
        });
    }
    
    // Register form submission
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('registerUsername').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = document.getElementById('registerConfirmPassword').value;
            const errorDiv = document.getElementById('registerError');
            const successDiv = document.getElementById('registerSuccess');
            
            // Clear previous messages
            if (errorDiv) errorDiv.style.display = 'none';
            if (successDiv) successDiv.style.display = 'none';
            
            // Validate passwords match
            if (password !== confirmPassword) {
                if (errorDiv) {
                    errorDiv.textContent = 'Passwords do not match.';
                    errorDiv.style.display = 'block';
                }
                return;
            }
            
            // Validate password length
            if (password.length < 6) {
                if (errorDiv) {
                    errorDiv.textContent = 'Password must be at least 6 characters long.';
                    errorDiv.style.display = 'block';
                }
                return;
            }
            
            // Set loading state
            setLoading('registerBtn', 'registerBtnText', true, 'Creating Account...', 'Create Account');
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password }),
                });
                
                // Get response text first to handle non-JSON responses
                const responseText = await response.text();
                let data;
                
                try {
                    // Try to parse as JSON
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    // If response is not JSON, it might be an HTML error page
                    console.error('Failed to parse response as JSON:', responseText.substring(0, 100));
                    if (errorDiv) {
                        errorDiv.textContent = 'Server error. Please try again or check if the server is running.';
                        errorDiv.style.display = 'block';
                    }
                    return;
                }
                
                if (response.ok) {
                    if (successDiv) {
                        successDiv.textContent = 'Account created successfully! You can now sign in.';
                        successDiv.style.display = 'block';
                    }
                    
                    // Clear form
                    registerForm.reset();
                    
                    // Auto-switch to login form after 2 seconds
                    setTimeout(() => {
                        toggleForm();
                    }, 2000);
                } else {
                    if (errorDiv) {
                        errorDiv.textContent = data.detail || 'Registration failed. Please try again.';
                        errorDiv.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error('Registration error:', error);
                if (errorDiv) {
                    errorDiv.textContent = 'Network error. Please try again.';
                    errorDiv.style.display = 'block';
                }
            } finally {
                setLoading('registerBtn', 'registerBtnText', false, 'Creating Account...', 'Create Account');
            }
        });
    }
    
    // GitHub OAuth login (if button exists)
    const githubLoginBtn = document.getElementById('githubLoginBtn');
    if (githubLoginBtn) {
        githubLoginBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/auth/github');
                const data = await response.json();
                
                if (response.ok && data.auth_url) {
                    // Redirect to GitHub OAuth
                    window.location.href = data.auth_url;
                } else {
                    showToast('GitHub OAuth is not configured. Please contact administrator.', 'error');
                }
            } catch (error) {
                console.error('GitHub OAuth error:', error);
                showToast('Failed to initiate GitHub login', 'error');
            }
        });
    }
}

function setupPasswordToggles() {
    // Setup password toggle for login form
    const loginPasswordToggle = document.getElementById('loginPasswordToggle');
    const loginPasswordInput = document.getElementById('loginPassword');
    
    if (loginPasswordToggle && loginPasswordInput) {
        loginPasswordToggle.addEventListener('click', () => {
            togglePasswordVisibility(loginPasswordInput, loginPasswordToggle);
        });
    }
    
    // Setup password toggle for register password
    const registerPasswordToggle = document.getElementById('registerPasswordToggle');
    const registerPasswordInput = document.getElementById('registerPassword');
    
    if (registerPasswordToggle && registerPasswordInput) {
        registerPasswordToggle.addEventListener('click', () => {
            togglePasswordVisibility(registerPasswordInput, registerPasswordToggle);
        });
    }
    
    // Setup password toggle for confirm password
    const registerConfirmPasswordToggle = document.getElementById('registerConfirmPasswordToggle');
    const registerConfirmPasswordInput = document.getElementById('registerConfirmPassword');
    
    if (registerConfirmPasswordToggle && registerConfirmPasswordInput) {
        registerConfirmPasswordToggle.addEventListener('click', () => {
            togglePasswordVisibility(registerConfirmPasswordInput, registerConfirmPasswordToggle);
        });
    }
}

function togglePasswordVisibility(input, toggleButton) {
    if (input.type === 'password') {
        input.type = 'text';
        toggleButton.textContent = '🙈';
        toggleButton.title = 'Hide password';
    } else {
        input.type = 'password';
        toggleButton.textContent = '👁️';
        toggleButton.title = 'Show password';
    }
}

// Handle GitHub OAuth callback
function handleGitHubCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        // Exchange code for token
        fetch(`/api/auth/github/callback?code=${code}`)
            .then(response => response.json())
            .then(data => {
                if (data.access_token) {
                    // Store the token with consistent naming
                    localStorage.setItem('access_token', data.access_token);
                    localStorage.setItem('authToken', data.access_token); // Keep both for compatibility
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('authProvider', data.auth_provider);
                    
                    showToast('GitHub login successful! Redirecting...', 'success');
                    
                    // Check if there's a redirect URL in the query params
                    const urlParams = new URLSearchParams(window.location.search);
                    const redirectTo = urlParams.get('redirect') || '/';
                    
                    // Redirect to the intended page
                    setTimeout(() => {
                        window.location.href = redirectTo;
                    }, 1000);
                } else {
                    showToast('GitHub authentication failed', 'error');
                }
            })
            .catch(error => {
                console.error('GitHub callback error:', error);
                showToast('GitHub authentication failed', 'error');
            });
    }
}

function checkAuthStatus() {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    if (token) {
        // User is already logged in, redirect to intended page or main page
        const urlParams = new URLSearchParams(window.location.search);
        const redirectTo = urlParams.get('redirect') || '/';
        window.location.href = redirectTo;
    } else {
        // Check for GitHub OAuth callback
        handleGitHubCallback();
    }
}
