// Auth Functions
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        showLogin();
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            // Try refreshing token
            const refreshed = await refreshToken();
            if (refreshed) return await checkAuth();
            throw new Error('Session expired');
        }

        const data = await response.json();
        const user = data.data.user || data.data;
        localStorage.setItem('user_data', JSON.stringify(user));
        updateUIForUser(user);
        return true;
    } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        showLogin();
        return false;
    }
}

async function handleLogin(event) {
    event.preventDefault();
    const btn = document.getElementById('login-btn');
    const originalText = btn.innerHTML;

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';

        const identifier = document.getElementById('login-identifier').value;
        const password = document.getElementById('login-password').value;

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: identifier, password })
        });

        const result = await response.json();

        if (!response.ok) throw new Error(result.error || result.message || 'Login failed');

        localStorage.setItem('token', result.data.token);
        localStorage.setItem('refresh_token', result.data.refreshToken);
        localStorage.setItem('user_data', JSON.stringify(result.data.user));
        showToast('Welcome back, ' + result.data.user.fullName, 'success');
        document.getElementById('auth-modal').classList.remove('active');
        updateUIForUser(result.data.user);
        init();

    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function handleRegister(event) {
    event.preventDefault();

    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-confirm-password').value;

    if (password !== confirmPassword) {
        showToast('Passwords do not match!', 'error');
        return;
    }

    const btn = document.getElementById('register-btn');
    const originalText = btn.innerHTML;

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

        const role = document.getElementById('reg-role').value;
        const payload = {
            fullName: document.getElementById('reg-fullname').value,
            email: document.getElementById('reg-email').value,
            username: document.getElementById('reg-username').value,
            phone: document.getElementById('reg-phone').value,
            role: role,
            password: password
        };

        if (role === 'officer') {
            payload.officerBadgeId = document.getElementById('reg-badge').value;
            payload.department = document.getElementById('reg-department').value;
        }

        console.log('Registration payload:', payload);

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        console.log('Registration response status:', response.status);
        const data = await response.json();
        console.log('Registration response data:', data);

        if (data.success) {
            showToast('Registration successful! Please login.', 'success');
            switchAuthTab('login');
            document.getElementById('register-form').reset();
            const strengthBar = document.getElementById('password-strength-bar');
            if (strengthBar) strengthBar.style.width = '0%';
            const strengthText = document.getElementById('password-strength-text');
            if (strengthText) strengthText.textContent = '';
        } else {
            const errorMsg = data.error || data.message || 'Registration failed';
            console.error('Registration failed:', errorMsg, data.errors);
            showToast(errorMsg, 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showToast('Registration error: ' + error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

function toggleLoginMethod(e) {
    if (e) e.preventDefault();
    const passGroup = document.getElementById('login-password-group');
    const otpGroup = document.getElementById('login-otp-group');
    if (!passGroup || !otpGroup) return;

    const isOTP = passGroup.style.display !== 'none';
    passGroup.style.display = isOTP ? 'none' : 'block';
    otpGroup.style.display = isOTP ? 'block' : 'none';

    const loginLink = e.target;
    if (loginLink) loginLink.innerText = isOTP ? 'Login via Password?' : 'Login via OTP?';
}

async function handleSocialLogin(provider) {
    if (provider === 'Google') {
        // Redirect to Google OAuth endpoint on backend
        // Initiating via same domain (proxied) to match Authorised JavaScript origins
        showToast('Linking Digital Identify Hub...', 'info');
        window.location.href = '/api/auth/google';
    } else if (provider === 'Facebook') {
        showToast('Facebook login coming soon!', 'info');
    } else {
        showToast(`${provider} login is not available`, 'warning');
    }
}

// Handle OAuth callback (check URL params on page load)
function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const oauth = urlParams.get('oauth');
    const token = urlParams.get('token');
    const refreshToken = urlParams.get('refreshToken');
    
    if (oauth === 'success' && token) {
        // Store tokens
        localStorage.setItem('token', token);
        localStorage.setItem('refresh_token', refreshToken);
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Show success and reload to get user data
        showToast('Successfully logged in with Google!', 'success');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } else if (urlParams.get('error')) {
        showToast('OAuth login failed. Please try again.', 'error');
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Call on page load
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', handleOAuthCallback);
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
    location.reload();
}

async function refreshToken() {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return false;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refresh })
        });

        const result = await response.json();
        if (result.success) {
            localStorage.setItem('token', result.data.token);
            localStorage.setItem('refresh_token', result.data.refreshToken);
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
}

async function requestOTP(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/request-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function verifyOTP(email, otp) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
        });
        return await response.json();
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function handleRequestOTP() {
    const btn = document.querySelector('button[onclick="handleRequestOTP()"]');
    const originalText = btn.innerHTML;
    
    try {
        const identifier = document.getElementById('login-identifier').value;
        if (!identifier) {
            showToast('Please enter your email first', 'warning');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        const res = await requestOTP(identifier);
        
        if (res.success) {
            showToast('OTP sent to your email!', 'success');
            // Show OTP input field if not already visible
            document.getElementById('login-otp-group').style.display = 'block';
            document.getElementById('login-password-group').style.display = 'none';
        } else {
            showToast(res.error || res.message || 'Failed to send OTP', 'error');
        }
    } catch(err) {
        showToast('Error sending OTP', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function handleVerifyRegOTP() {
    const btn = document.querySelector('button[onclick="handleVerifyRegOTP()"]');
    const originalText = btn.innerHTML;

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

        const otp = document.getElementById('reg-otp').value;
        const email = document.getElementById('reg-email').value;

        if(!otp || !email) {
             showToast('Please generate OTP first', 'warning');
             return;
        }

        const res = await verifyOTP(email, otp);
        
        if (res.success) {
            showToast('Account verified successfully!', 'success');
            if(res.data && res.data.token) {
                 // Auto login
                 localStorage.setItem('token', res.data.token);
                 localStorage.setItem('refresh_token', res.data.refreshToken);
                 localStorage.setItem('user_data', JSON.stringify(res.data.user));
                 setTimeout(() => location.reload(), 1500);
            }
        } else {
            showToast(res.error || res.message || 'Invalid OTP', 'error');
        }
    } catch(err) {
        showToast('Verification failed', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
