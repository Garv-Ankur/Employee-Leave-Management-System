document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const sunIcon = document.getElementById('sun-icon');
    const moonIcon = document.getElementById('moon-icon');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    
    const setTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-bs-theme', 'dark');
            sunIcon.classList.add('d-none');
            moonIcon.classList.remove('d-none');
        } else {
            document.documentElement.removeAttribute('data-bs-theme');
            sunIcon.classList.remove('d-none');
            moonIcon.classList.add('d-none');
        }
        localStorage.setItem('theme', theme);
    };

    
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') || (prefersDarkScheme.matches ? 'dark' : 'light');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });

    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme(prefersDarkScheme.matches ? 'dark' : 'light');
    }
});