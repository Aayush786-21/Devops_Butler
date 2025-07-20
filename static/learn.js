// Learn More JavaScript
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
    
    // Initialize smooth scrolling
    initializeSmoothScrolling();
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
    const userSection = document.getElementById('userSection');
    const authButtons = document.getElementById('authButtons');
    
    if (userSection && authButtons) {
        userSection.style.display = 'none';
        authButtons.style.display = 'flex';
    }
}

// Set up event listeners
function setupEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Table of contents links
    const tocLinks = document.querySelectorAll('.toc a');
    tocLinks.forEach(link => {
        link.addEventListener('click', handleTocClick);
    });
    
    // CTA buttons
    const ctaButtons = document.querySelectorAll('.cta-section .btn');
    ctaButtons.forEach(button => {
        button.addEventListener('click', handleCtaClick);
    });
    
    // Get Started buttons
    const getStartedButtons = document.querySelectorAll('.btn-primary[href="/login"]');
    getStartedButtons.forEach(button => {
        button.addEventListener('click', handleGetStartedClick);
    });
}

// Handle table of contents click
function handleTocClick(event) {
    event.preventDefault();
    
    const href = this.getAttribute('href');
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
        smoothScrollTo(targetElement);
        updateActiveTocLink(this);
    }
}

// Handle CTA button click
function handleCtaClick(event) {
    // Check if user is authenticated
    const userSection = document.getElementById('userSection');
    if (!userSection || userSection.style.display === 'none') {
        // User is not authenticated, redirect to login
        event.preventDefault();
        window.location.href = '/login';
    }
    // If authenticated, let the link work normally
}

// Handle Get Started button click
function handleGetStartedClick(event) {
    // Always redirect to login for Get Started buttons
    event.preventDefault();
    window.location.href = '/login';
}

// Initialize smooth scrolling
function initializeSmoothScrolling() {
    // Add smooth scrolling behavior to all internal links
    const internalLinks = document.querySelectorAll('a[href^="#"]');
    internalLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                smoothScrollTo(targetElement);
            }
        });
    });
    
    // Update active TOC link on scroll
    window.addEventListener('scroll', updateActiveTocLinkOnScroll);
}

// Smooth scroll to element
function smoothScrollTo(element) {
    const offset = 100; // Account for fixed header
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

// Update active TOC link
function updateActiveTocLink(activeLink) {
    // Remove active class from all TOC links
    const tocLinks = document.querySelectorAll('.toc a');
    tocLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to clicked link
    activeLink.classList.add('active');
}

// Update active TOC link on scroll
function updateActiveTocLinkOnScroll() {
    const sections = document.querySelectorAll('.learn-section');
    const tocLinks = document.querySelectorAll('.toc a');
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        const sectionHeight = section.clientHeight;
        
        if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });
    
    tocLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
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

// Add intersection observer for animations
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .step, .app-card, .faq-item');
    animateElements.forEach(el => {
        observer.observe(el);
    });
}

// Initialize animations when page loads
window.addEventListener('load', initializeAnimations); 