// App Initialization & Main Logic
async function init() {
    // Handle Login Trigger from other pages
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('trigger') === 'login') {
        setTimeout(() => {
            showLogin(); 
            showToast('Please login to access your profile', 'info');
        }, 500);
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Check auth
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user_data');
    
    if (!token) {
        // Show login by default or allow home view
    } else {
        if (userData) {
            currentUser = JSON.parse(userData);
            updateUIForUser(currentUser);
        } else {
            await checkAuth();
        }
    }

    // Start Clock
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);

    // Start Home Features
    typeWriter();
    animateStats();
    setTimeout(initHomeMap, 1000); // Home map
    setTimeout(initMap, 500);     // Dashboard map (ensure container exists)

    await Promise.all([
        loadParkingZones(),
        loadViolations()
    ]);

    // Initial weather
    fetchWeather();
    
    // Restore Last View
    const lastView = localStorage.getItem('lastView');
    if (lastView && lastView !== 'home') {
        switchView(lastView);
    }
    
    // Start Polling
    startRealTimePolling();
}

async function loadSharedComponents() {
    try {
        const response = await fetch(`auth-chatbot-components.html?v=${new Date().getTime()}`);
        const html = await response.text();
        document.getElementById('auth-chatbot-container').innerHTML = html;
        console.log('Shared components loaded');
        
        // CRITICAL: Attach event listeners after dynamic content is loaded
        // This fixes the issue where inline onsubmit handlers don't work with dynamically loaded HTML
        attachFormEventListeners();
    } catch (error) {
        console.error('Failed to load shared components:', error);
    }
}

// Attach event listeners to dynamically loaded forms
function attachFormEventListeners() {
    console.log('Attaching event listeners to forms...');
    
    // Registration form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
        console.log('✓ Registration form listener attached');
    } else {
        console.warn('⚠ Registration form not found');
    }
    
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('✓ Login form listener attached');
    } else {
        console.warn('⚠ Login form not found');
    }
}

function startRealTimePolling() {
    // Refresh violations every 10 seconds
    setInterval(loadViolations, 10000);
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadSharedComponents();
    init();
});
