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

document.addEventListener('DOMContentLoaded', function() {
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
                localStorage.setItem('token', data.access_token); // Ensure compatibility
                localStorage.setItem('username', data.username);

                // Immediately update navbar and authed links if functions exist
                if (typeof updateNavbarUser === 'function') updateNavbarUser();
                if (typeof updateAuthedLinks === 'function') updateAuthedLinks();

                showToast('Login successful! Redirecting...', 'success');
                
                // Redirect to dashboard page
                setTimeout(() => {
                    window.location.href = '/dashboard';
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

    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const currentPath = window.location.pathname;
    const isAuthPage = ['/login', '/register', '/auth'].includes(currentPath);
    if (token && isAuthPage) {
        // User is already logged in, redirect to dashboard
        window.location.href = '/dashboard';
    }
}); 