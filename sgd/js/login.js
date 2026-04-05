// Check if already logged in
if (localStorage.getItem('sgd_token')) {
    window.location.href = 'dashboard.html';
}

const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        const btn = document.getElementById('loginBtn');
        const errorMsg = document.getElementById('errorMsg');
        
        btn.disabled = true;
        btn.textContent = 'Verificando...';
        errorMsg.style.display = 'none';
        
        try {
            const response = await fetch('/api/sgd/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username: user, password: pass })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                // Save token and redirect
                localStorage.setItem('sgd_token', data.token);
                localStorage.setItem('sgd_user', JSON.stringify(data.user));
                window.location.href = 'dashboard.html';
            } else {
                errorMsg.textContent = data.error || 'Error de autenticación';
                errorMsg.style.display = 'block';
            }
        } catch (error) {
            errorMsg.textContent = 'Error de conexión. Asegúrate que el servidor esté activo.';
            errorMsg.style.display = 'block';
            console.error("Login fetch error:", error);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Ingresar al Sistema';
        }
    });
}
