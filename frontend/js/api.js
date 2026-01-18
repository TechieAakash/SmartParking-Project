// API Functions
async function fetchAPI(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
}

async function loadParkingZones() {
    try {
        const data = await fetchAPI('/zones');
        parkingZones = data.data || data;
        originalZones = [...parkingZones];

        updateDashboardStats();
        updateHomeStats(); // Update home page counters

        // Safe checks for functions before calling
        if (typeof renderZoneList === 'function') renderZoneList();
        if (typeof updateZoneMarkers === 'function') updateZoneMarkers();
        if (typeof renderZoneTable === 'function') renderZoneTable();
    } catch (error) {
        console.error('Error loading zones:', error);
    }
}

async function loadViolations() {
    try {
        const data = await fetchAPI('/violations');
        violations = data.data || data;

        if (typeof updateViolationCounts === 'function') updateViolationCounts();
        if (typeof renderViolationsList === 'function') renderViolationsList();
        if (typeof renderViolationsTable === 'function') renderViolationsTable();
        if (typeof renderRecentActivities === 'function') renderRecentActivities();

        loadViolationStats();
        updateInsights();
    } catch (error) {
        console.error('Error loading violations:', error);
    }
}

async function loadViolationStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/violations/stats/summary`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const result = await response.json();
        if (result.success) {
            const s = result.data.summary;
            document.getElementById('stats-pending').textContent = s.pendingViolations || 0;
            document.getElementById('stats-critical').textContent = s.criticalViolations || 0;
            document.getElementById('stats-resolved').textContent = s.resolvedViolations || 0;
            document.getElementById('stats-revenue').textContent = `₹${parseFloat(s.totalCollected || 0).toLocaleString()}`;
        }
    } catch (e) {
        console.error('Stats load fail', e);
    }
}

async function handleZoneCreate(event) {
    event.preventDefault();
    const btn = document.getElementById('zone-submit-btn');
    const originalText = btn.innerHTML;

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Zone...';

        const payload = {
            name: document.getElementById('zone-name').value,
            address: document.getElementById('zone-address').value,
            latitude: 28.6139, // Default: Delhi Center
            longitude: 77.2090, // Default: Delhi Center
            totalCapacity: parseInt(document.getElementById('zone-capacity').value),
            contractorLimit: parseInt(document.getElementById('zone-limit').value),
            contractorName: document.getElementById('zone-contractor').value,
            contractorContact: document.getElementById('zone-contractor-contact').value,
            contractorEmail: document.getElementById('zone-contractor-email').value,
            operatingHours: document.getElementById('zone-hours').value,
            hourlyRate: parseFloat(document.getElementById('zone-rate').value),
            penaltyPerVehicle: parseFloat(document.getElementById('zone-penalty').value),
            status: 'active'
        };

        const response = await fetch(`${API_BASE_URL}/zones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            showToast('Zone created successfully!', 'success');
            closeZoneModal();
            document.getElementById('zone-form').reset();
            loadParkingZones();
        } else {
            throw new Error(result.error || 'Failed to create zone');
        }
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

async function exportViolationsData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Please login to export data');

        showToast('Preparing MCD violation export...', 'info');
        const response = await fetch(`${API_BASE_URL}/violations/export`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            throw new Error('Unauthorized. Only Admins/Officers can export data.');
        }

        if (!response.ok) throw new Error('Export server error');

        const blob = await response.blob();
        if (blob.size === 0) throw new Error('No data available to export');

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `mcd_violations_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        
        // Trigger download
        a.click();

        // Cleanup with slight delay to ensure download starts
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 500);

        showToast('Export successful! Check your downloads.', 'success');
    } catch (error) {
        showToast(error.message, 'error');
        console.error('Export Error:', error);
    }
}


// Enforcement logic is handled in js/render.js

// Booking & Wallet API Functions
async function checkZoneAvailability(zoneId, startTime, endTime) {
    try {
        const query = `?zoneId=${zoneId}&startTime=${startTime}&endTime=${endTime}`;
        return await fetchAPI(`/bookings/availability${query}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
    } catch (error) {
        console.error('Availability check failed', error);
        return { success: false, availableSlots: 0 };
    }
}

async function createNewBooking(payload) {
    return await fetchAPI('/bookings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
    });
}

async function fetchMyBookings() {
    return await fetchAPI('/bookings/my', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
}

async function fetchWalletBalance() {
    try {
        const data = await fetchAPI('/wallet/balance', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        return data.data; // { balance, currency }
    } catch (error) {
        console.error('Wallet fetch failed', error);
        return { balance: 0, currency: 'INR' };
    }
}

async function topUpWallet(amount) {
    return await fetchAPI('/wallet/topup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ amount })
    });
}

async function purchaseSubscription(payload) {
    return await fetchAPI('/bookings/subscription', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(payload)
    });
}
