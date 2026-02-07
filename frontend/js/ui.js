// UI & Animations

// Mobile Menu Toggle
function toggleMobileMenu() {
    const navTabs = document.querySelector('.nav-tabs');
    const menuIcon = document.querySelector('.mobile-menu-toggle i');
    if (navTabs) {
        navTabs.classList.toggle('open');
        if (menuIcon) {
            menuIcon.className = navTabs.classList.contains('open') ? 'fas fa-times' : 'fas fa-bars';
        }
    }
}

// Close mobile menu when a nav item is clicked
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const navTabs = document.querySelector('.nav-tabs');
            const menuIcon = document.querySelector('.mobile-menu-toggle i');
            if (navTabs && window.innerWidth <= 768) {
                navTabs.classList.remove('open');
                if (menuIcon) menuIcon.className = 'fas fa-bars';
            }
        });
    });
});

function typeWriter() {
    const text = "Delhi NCT";
    const container = document.getElementById('typewriter-text');
    if (!container) return;

    let i = 0;
    container.innerHTML = '';
    function type() {
        if (i < text.length) {
            container.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, 150);
        } else {
            // Optional: loop or keep it
        }
    }
    type();
}

function animateStats() {
    const stats = document.querySelectorAll('.home-stat-number');
    stats.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target'));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const update = () => {
            current += step;
            if (current < target) {
                stat.innerHTML = Math.round(current).toLocaleString();
                if (stat.id === 'home-stat-uptime') stat.innerHTML += '%';
                requestAnimationFrame(update);
            } else {
                stat.innerHTML = target.toLocaleString();
                if (stat.id === 'home-stat-uptime') stat.innerHTML += '%';
            }
        };
        update();
    });
}

async function fetchWeather() {
    try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=28.6139&longitude=77.2090&current_weather=true');
        const data = await res.json();
        if (data.current_weather) {
            const w = data.current_weather;
            document.getElementById('temperature').textContent = `${w.temperature}°C`;
            document.getElementById('wind-speed').textContent = `${w.windspeed} km/h`;
            document.getElementById('weather-desc').textContent = 'Delhi Clear Sky';
        }
    } catch (e) {
        console.error('Weather fail');
    }
}

function updateCurrentTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const container = document.getElementById('current-time');
    if (container) container.textContent = `${dateStr} | ${timeStr}`;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'exclamation-circle' : 'info-circle');
    toast.innerHTML = `<i class=\"fas fa-${icon}\"></i> <span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function switchView(viewName) {
    // Save current view for refresh persistence
    localStorage.setItem('lastView', viewName);

    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    document.querySelector(`.nav-tab[onclick*="${viewName}"]`)?.classList.add('active');

    document.querySelectorAll('.view-section').forEach(view => view.classList.remove('active'));
    const activeView = document.getElementById(viewName);
    if (activeView) activeView.classList.add('active');

    if (viewName === 'dashboard') {
        if (map) {
            setTimeout(() => {
                map.invalidateSize();
                updateZoneMarkers(); // Ensure markers show up
            }, 200);
        }
        loadParkingZones();
        loadViolations();
    }

    if (viewName === 'violations' || viewName === 'zones') refreshAllData();
}

function refreshAllData() {
    loadParkingZones();
    loadViolations();
    showToast('Refreshing live data...', 'success');
}

function showLogin() {
    document.getElementById('auth-modal').classList.add('active');
}

function switchAuthTab(tab) {
    document.querySelectorAll('.auth-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));

    const activeBtn = document.querySelector(`.auth-tab-btn[onclick*=\"${tab}\"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const activeForm = document.getElementById(`${tab}-form`);
    if (activeForm) activeForm.classList.add('active');
}

function handleRoleChange() {
    const role = document.getElementById('reg-role').value;
    const officerFields = document.getElementById('officer-fields');
    if (officerFields) {
        if (role === 'officer') {
            officerFields.classList.add('show');
            document.getElementById('reg-badge').required = true;
            document.getElementById('reg-department').required = true;
        } else {
            officerFields.classList.remove('show');
            document.getElementById('reg-badge').required = false;
            document.getElementById('reg-department').required = false;
        }
    }
}

function checkPasswordStrength() {
    const pwd = document.getElementById('reg-password').value;
    const bar = document.getElementById('password-strength-bar');
    const text = document.getElementById('password-strength-text');
    if (!bar || !text) return;

    if (pwd.length === 0) {
        bar.style.width = '0%';
        text.textContent = '';
        return;
    }

    let score = 0;
    if (pwd.length > 6) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) {
        bar.className = 'password-strength-bar weak';
        text.textContent = 'Weak';
        bar.style.width = '33%';
    } else if (score <= 3) {
        bar.className = 'password-strength-bar medium';
        text.textContent = 'Medium';
        bar.style.width = '66%';
    } else {
        bar.className = 'password-strength-bar strong';
        text.textContent = 'Strong';
        bar.style.width = '100%';
    }
}

function updateUIForUser(user) {
    if (!user) return;
    
    // Update Nav Displays
    const nameDisplay = document.getElementById('user-name-display');
    const fullNameDisplay = document.getElementById('user-fullname-display');
    const roleDisplay = document.getElementById('user-role-display');
    
    if (nameDisplay) nameDisplay.textContent = user.username || 'User';
    if (fullNameDisplay) fullNameDisplay.textContent = user.fullName || 'MCD User';
    if (roleDisplay) roleDisplay.textContent = user.role ? user.role.toUpperCase() : 'VIEWER';
    
    // Personalized Home Banner
    const welcomeBanner = document.getElementById('user-welcome-banner');
    const welcomeName = document.getElementById('welcome-name');
    if (welcomeBanner && welcomeName) {
        welcomeBanner.style.display = 'block';
        welcomeName.textContent = user.fullName.split(' ')[0];
        fetchUserStats();
    }

    // Toggle role-specific views
    if (user.role === 'officer' || user.role === 'admin') {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'flex'; // Use flex for buttons usually
            if (el.tagName === 'BUTTON') el.style.display = 'inline-flex';
        });
    } else {
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
    }
    
    // Show zone actions to contractors too
    if (user.role === 'contractor') {
        const zoneActions = document.getElementById('admin-zone-actions');
        if (zoneActions) zoneActions.style.display = 'block';
    }

    // Role-specific Menu Items
    const userMenu = document.querySelector('.user-menu');
    if (userMenu && user.role === 'contractor') {
        // Check if links already exist
        if (!userMenu.querySelector('a[href="contractor-zones.html"]')) {
            // My Zones Link
            const zonesLink = document.createElement('a');
            zonesLink.href = 'contractor-zones.html';
            zonesLink.className = 'user-menu-item';
            zonesLink.innerHTML = '<i class="fas fa-map-marked-alt"></i> My Zones';
            zonesLink.style.background = '#eef2ff';
            zonesLink.style.color = '#4f46e5';
            
            // Add New Zone Link
            const addLink = document.createElement('a');
            addLink.href = 'contractor-zones.html#add'; // Hash to trigger modal
            addLink.className = 'user-menu-item';
            addLink.innerHTML = '<i class="fas fa-plus-circle"></i> Add New Zone';
            addLink.style.background = '#f0fdf4';
            addLink.style.color = '#16a34a';
            addLink.style.marginTop = '5px';

            const profileLink = userMenu.querySelector('a[href="profile-driver.html"]');
            if (profileLink) {
                profileLink.insertAdjacentElement('afterend', zonesLink);
                zonesLink.insertAdjacentElement('afterend', addLink);
            } else {
                const hr = userMenu.querySelector('hr');
                if (hr) {
                    hr.insertAdjacentElement('afterend', zonesLink);
                    zonesLink.insertAdjacentElement('afterend', addLink);
                }
            }
        }
    }
}

async function fetchUserStats() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        // Fetch Vehicles Count
        const resVeh = await fetch(`${API_BASE_URL}/vehicles/my`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataVeh = await resVeh.json();
        const countEl = document.getElementById('user-vehicle-count');
        if (countEl && dataVeh.success) {
            countEl.textContent = dataVeh.data.vehicles.length;
        }

        // Fetch Wallet Balance
        const resWallet = await fetch(`${API_BASE_URL}/wallet/balance`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const dataWallet = await resWallet.json();
        const balanceEl = document.getElementById('home-wallet-balance');
        if (balanceEl && dataWallet.success) {
            balanceEl.textContent = `₹${parseFloat(dataWallet.data.balance).toFixed(2)}`;
        }

    } catch (e) {
        console.error('Failed to fetch user stats');
    }
}

// Global App State UI Init
document.addEventListener('DOMContentLoaded', () => {
    const userJson = localStorage.getItem('user_data');
    if (userJson) {
        try {
            const user = JSON.parse(userJson);
            updateUIForUser(user);
        } catch (e) {
            console.error('Failed to parse user data');
        }
    }
});

function markAllRead() {
    document.querySelectorAll('.notification-item.unread').forEach(item => {
        item.classList.remove('unread');
    });
    const countEl = document.getElementById('notif-count');
    if (countEl) countEl.style.display = 'none';
    showToast('All notifications marked as read', 'success');
}

function closeViewZoneModal() {
    document.getElementById('view-zone-modal').classList.remove('active');
}

function closeResolveModal() {
    const modal = document.getElementById('resolve-modal');
    if (modal) modal.classList.remove('active');
}

function openZoneModal() {
    const modal = document.getElementById('zone-modal');
    if (!modal) return;
    
    modal.classList.add('active');
    
    // Pre-fill contractor info if applicable
    if (currentUser && currentUser.role === 'contractor') {
        const contractorField = document.getElementById('zone-contractor');
        if (contractorField) {
            contractorField.value = currentUser.fullName || currentUser.username;
            contractorField.readOnly = true; // Prevent contractor from changing their own name for their zones
        }
        
        const emailField = document.getElementById('zone-contractor-email');
        if (emailField && currentUser.email) {
            emailField.value = currentUser.email;
        }
    }
}

function closeZoneModal() {
    const modal = document.getElementById('zone-modal');
    if (modal) {
        modal.classList.remove('active');
        document.getElementById('zone-form')?.reset();
    }
}
