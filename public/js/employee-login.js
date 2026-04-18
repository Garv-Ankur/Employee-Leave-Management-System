document.addEventListener('DOMContentLoaded', () => {
    
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.add('fade-out');
    }

    const loginForm = document.getElementById('login-form');
    const messageDiv = document.getElementById('login-message');
    const loginButton = loginForm.querySelector('button[type="submit"]');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;

        const originalButtonText = loginButton.innerHTML;
        loginButton.disabled = true;
        loginButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...`;

        messageDiv.className = 'd-none mt-3 alert';
        messageDiv.textContent = '';

        try {
            const response = await fetch('/api/login/employee', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: form.username.value,
                    password: form.password.value,
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                
                sessionStorage.clear(); 

                
                sessionStorage.setItem('loggedInEmployeeName', result.fullName);
                sessionStorage.setItem('leaveBalance', result.leaveBalance);
                sessionStorage.setItem('userRole', 'employee');

                
                window.location.href = '/welcome.html';

            } else {
                throw new Error(result.message || 'An unknown error occurred.');
            }
        } catch (error) {
            console.error('Login failed:', error);
            messageDiv.textContent = error.message;
            messageDiv.className = 'alert alert-danger mt-3';
            loginButton.disabled = false;
            loginButton.innerHTML = originalButtonText;
        }
    });
});