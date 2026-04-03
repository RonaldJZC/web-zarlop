// sgd/js/auth.js
// Scripts to protect internal pages

function checkAuth() {
    const token = localStorage.getItem('sgd_token');
    
    if (!token) {
        // No token, redirect to login
        window.location.href = 'login.html';
        return;
    }

    // Verify token validity with backend
    fetch('/api/sgd/verify', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            // Token invalid or expired
            localStorage.removeItem('sgd_token');
            localStorage.removeItem('sgd_user');
            window.location.href = 'login.html';
        } else {
            // Update UI with user info
            const userNameElements = document.querySelectorAll('.user-name');
            userNameElements.forEach(el => {
                el.textContent = data.user.username;
            });
        }
    })
    .catch(() => {
        // Network error, assume offline but keep token for now or redirect
        console.warn('Could not verify token with server.');
    });
}

function logout() {
    localStorage.removeItem('sgd_token');
    localStorage.removeItem('sgd_user');
    window.location.href = 'login.html';
}

// Run auth check on page load for protected pages
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    const logoutBtns = document.querySelectorAll('.btn-logout');
    logoutBtns.forEach(btn => {
        btn.addEventListener('click', logout);
    });
});
