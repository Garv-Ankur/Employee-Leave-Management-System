document.addEventListener('DOMContentLoaded', () => {
    const welcomeMessage = document.getElementById('welcome-message');
    
    
    const employeeName = sessionStorage.getItem('loggedInEmployeeName');
    const userRole = sessionStorage.getItem('userRole');

    // greetings
    if (employeeName) {
        welcomeMessage.textContent = `Welcome, ${employeeName}!`;
    } else if (userRole === 'hr') {
        welcomeMessage.textContent = `Welcome, Administrator!`;
    }

    // Wait for 2 seconds, then redirect to the correct dashboard
    setTimeout(() => {
        if (userRole === 'employee') {
            window.location.href = '/employee-dashboard.html';
        } else if (userRole === 'hr') {
            window.location.href = '/hr-dashboard.html';
        } else {
            
            window.location.href = '/';
        }
    }, 2000); // time 
});