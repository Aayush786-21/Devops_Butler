// Authentication JavaScript
let isLoginForm = true;

function toggleForm() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (isLoginForm) {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        isLoginForm = false;
    } else {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        isLoginForm = true;
    }
    
    // Clear any error messages
    clearErrors();
}

function clearErrors() {
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('registerError').style.display = 'none';
    document.getElementById('registerSuccess').style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
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

// Login form submission
document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    // Clear previous errors
    errorDiv.style.display = 'none';
    
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
        
        const data = await response.json();
        
        if (response.ok) {
            // Store the token
            localStorage.setItem('authToken', data.access_token);
            localStorage.setItem('username', data.username);
            
            showToast('Login successful! Redirecting...', 'success');
            
            // Redirect to main page
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } else {
            errorDiv.textContent = data.detail || 'Login failed. Please try again.';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    } finally {
        setLoading('loginBtn', 'loginBtnText', false, 'Signing In...', 'Sign In');
    }
});

// Register form submission
document.getElementById('registerFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const errorDiv = document.getElementById('registerError');
    const successDiv = document.getElementById('registerSuccess');
    
    // Clear previous messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    // Validate passwords match
    if (password !== confirmPassword) {
        errorDiv.textContent = 'Passwords do not match.';
        errorDiv.style.display = 'block';
        return;
    }
    
    // Validate password length
    if (password.length < 6) {
        errorDiv.textContent = 'Password must be at least 6 characters long.';
        errorDiv.style.display = 'block';
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
        
        const data = await response.json();
        
        if (response.ok) {
            successDiv.textContent = 'Account created successfully! You can now sign in.';
            successDiv.style.display = 'block';
            
            // Clear form
            document.getElementById('registerFormElement').reset();
            
            // Auto-switch to login form after 2 seconds
            setTimeout(() => {
                toggleForm();
            }, 2000);
        } else {
            errorDiv.textContent = data.detail || 'Registration failed. Please try again.';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Registration error:', error);
        errorDiv.textContent = 'Network error. Please try again.';
        errorDiv.style.display = 'block';
    } finally {
        setLoading('registerBtn', 'registerBtnText', false, 'Creating Account...', 'Create Account');
    }
});

// GitHub OAuth login
document.getElementById('githubLoginBtn').addEventListener('click', async () => {
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
                    // Store the token
                    localStorage.setItem('authToken', data.access_token);
                    localStorage.setItem('username', data.username);
                    localStorage.setItem('authProvider', data.auth_provider);
                    
                    showToast('GitHub login successful! Redirecting...', 'success');
                    
                    // Redirect to main page
                    setTimeout(() => {
                        window.location.href = '/';
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

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    if (token) {
        // User is already logged in, redirect to main page
        window.location.href = '/';
    } else {
        // Check for GitHub OAuth callback
        handleGitHubCallback();
    }
}); 