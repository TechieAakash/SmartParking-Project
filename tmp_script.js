
        // Mini Debug Console for Production Troubleshooting
        const debugLogs = [];
        const originalLog = console.log;
        const originalError = console.error;
        console.log = (...args) => { debugLogs.push(`[LOG] ${args.join(' ')}`); originalLog(...args); };
        console.error = (...args) => { debugLogs.push(`[ERR] ${args.join(' ')}`); originalError(...args); };

        function showDebugInfo() {
            const info = debugLogs.join('\n');
            const debugDisplay = document.getElementById('debug-display');
            if (debugDisplay) {
                debugDisplay.innerText = info.slice(-2000);
                debugDisplay.style.display = 'block';
            } else {
                alert("DEBUG LOGS:\n" + info.slice(-1000));
            }
        }

        // Expose functions globally IMMEDIATELY
        const exposeGlobals = () => {
            window.handleTopUp = typeof handleTopUp !== 'undefined' ? handleTopUp : null;
            window.closeWalletModal = typeof closeWalletModal !== 'undefined' ? closeWalletModal : null;
            window.openWalletModal = typeof openWalletModal !== 'undefined' ? openWalletModal : null;
            window.closeBookingModal = typeof closeBookingModal !== 'undefined' ? closeBookingModal : null;
            window.closeCancelConfirmModal = typeof closeCancelConfirmModal !== 'undefined' ? closeCancelConfirmModal : null;
            window.confirmCancellation = typeof confirmCancellation !== 'undefined' ? confirmCancellation : null;
            window.handleScanBooking = typeof handleScanBooking !== 'undefined' ? handleScanBooking : null;
            window.openVehicleModal = typeof openVehicleModal !== 'undefined' ? openVehicleModal : null;
            window.closeVehicleModal = typeof closeVehicleModal !== 'undefined' ? closeVehicleModal : null;
            window.deleteVehicle = typeof deleteVehicle !== 'undefined' ? deleteVehicle : null;
            window.openBookingModal = typeof openBookingModal !== 'undefined' ? openBookingModal : null;
            window.showDebugInfo = showDebugInfo;
        };

        // Load Shared Components (Chatbot)
        async function loadSharedComponents() {
            try {
                const response = await fetch('auth-chatbot-components.html?v=' + new Date().getTime());
                if (response.ok) {
                    const html = await response.text();
                    const container = document.getElementById('auth-chatbot-container');
                    if (container) {
                        container.innerHTML = html;
                        console.log('✅ Shared components loaded');
                    }
                }
            } catch (error) {
                console.error('❌ Failed to load shared components:', error);
            }
        }

        document.addEventListener('DOMContentLoaded', async () => {
            // 1. Initial exposure
            exposeGlobals();

            // 2. Load components in background
            loadSharedComponents();

            // 3. Start initialization
            const user = JSON.parse(localStorage.getItem('user_data') || '{}');
            if (!user.id) {
                window.location.href = 'index.html?trigger=login';
                return;
            }

            // Fill profile data from localStorage initially (for speed)
            if (user.fullName) document.getElementById('header-fullname').textContent = user.fullName;
            if (user.role) document.getElementById('header-role').textContent = user.role.toUpperCase();
            if (user.email) document.getElementById('header-email').textContent = user.email;
            if (user.fullName) document.getElementById('prof-fullname').value = user.fullName;
            if (user.email) document.getElementById('prof-email').value = user.email;
            if (user.phone) document.getElementById('prof-phone').value = user.phone;

            if (user.profilePhoto) {
                const photoUrl = user.profilePhoto.startsWith('http')
                    ? user.profilePhoto
                    : `${API_BASE_URL.replace('/api', '')}/${user.profilePhoto}`;
                document.getElementById('display-photo').src = photoUrl;
            }

            // Load fresh data from server
            try {
                await loadUserProfile();
                loadVehicles();
                loadWalletBalance();
                loadMyBookings();

                // Final re-exposure once all functions are hoisted/defined
                exposeGlobals();
            } catch (e) {
                console.error('Initialization error:', e);
            }
        });

        async function loadUserProfile() {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/auth/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                if (data.success) {
                    const user = data.data.user;
                    // Update DOM
                    document.getElementById('header-fullname').textContent = user.fullName || 'User';
                    document.getElementById('prof-fullname').value = user.fullName || '';
                    document.getElementById('prof-phone').value = user.phone || '';
                    document.getElementById('header-email').textContent = user.email;
                    document.getElementById('prof-email').value = user.email;

                    if (user.profilePhoto) {
                        const photoUrl = user.profilePhoto.startsWith('http')
                            ? user.profilePhoto
                            : `${API_BASE_URL.replace('/api', '')}/${user.profilePhoto}`;
                        document.getElementById('display-photo').src = photoUrl;
                    }

                    // Update LocalStorage
                    localStorage.setItem('user_data', JSON.stringify(user));
                }
            } catch (err) {
                console.error('Failed to load user profile:', err);
                // Don't block usage, just log
            }
        }

        async function loadMyBookings() {
            try {
                const token = localStorage.getItem('token');

                // Fetch Bookings and Subscriptions in parallel
                console.log('Fetching bookings and subscriptions...');
                const [resBookings, resSubs] = await Promise.all([
                    fetch(`${API_BASE_URL}/bookings/my`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${API_BASE_URL}/bookings/subscription/my`, { headers: { 'Authorization': `Bearer ${token}` } })
                ]);

                const dataBookings = await resBookings.json();
                const dataSubs = await resSubs.json();

                console.log('Bookings Data:', dataBookings);
                console.log('Subscriptions Data:', dataSubs);

                let items = [];

                if (dataBookings.success && Array.isArray(dataBookings.data.bookings)) {
                    // Filter out bookings that are actually invalid subscriptions (high price)
                    const validBookings = dataBookings.data.bookings.filter(b => parseFloat(b.totalPrice || 0) < 3000);
                    items = items.concat(validBookings.map(b => ({ ...b, type: 'hourly' })));
                }

                if (dataSubs.success && Array.isArray(dataSubs.data.subscriptions)) {
                    // Map and force types
                    const subs = dataSubs.data.subscriptions.map(s => ({
                        ...s,
                        type: 'subscription',
                        // Ensure essential fields exist for view
                        passType: s.passType || s.planType || 'monthly',
                        bookingStart: s.startDate, // Map for sorting/fallback
                        totalPrice: s.price // Map for fallback display
                    }));
                    items = items.concat(subs);
                }

                console.log('Merged Items:', items);

                // Sort by date (latest first)
                items.sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.bookingStart || a.startDate);
                    const dateB = new Date(b.createdAt || b.bookingStart || b.startDate);
                    return dateB - dateA;
                });

                const container = document.getElementById('my-bookings-list');

                if (items.length > 0) {
                    container.innerHTML = items.map(item => {
                        // Robust detection
                        const isSub = item.type === 'subscription' || item.passType !== undefined || item.qrCode !== undefined;
                        item.type = isSub ? 'subscription' : 'hourly'; // Ensure type is set for onclick

                        const title = isSub ? `${(item.passType || 'Monthly').toUpperCase()} PASS` : `Booking #${item.id}`;

                        let dateStr = 'Invalid Date';
                        if (isSub) {
                            if (item.endDate) dateStr = `Valid until ${new Date(item.endDate).toLocaleDateString()}`;
                            else dateStr = 'No Expiry';
                        } else {
                            if (item.bookingStart) dateStr = `${new Date(item.bookingStart).toLocaleDateString()} | ${new Date(item.bookingStart).toLocaleTimeString()}`;
                        }

                        const price = isSub ? item.price : item.totalPrice;
                        const iconColor = item.status === 'active' ? '#38a169' : '#718096';
                        const bgIcon = item.status === 'active' ? '#f0fff4' : '#edf2f7';

                        return `
                        <div class="vehicle-item" onclick="openBookingModal(${JSON.stringify(item).replace(/"/g, '&quot;')})" style="cursor: pointer;">
                            <div class="vehicle-icon" style="background: ${bgIcon}; color: ${iconColor};">
                                <i class="fas ${isSub ? 'fa-id-card' : 'fa-ticket-alt'}"></i>
                            </div>
                            <div class="vehicle-details">
                                <div class="vehicle-plate">${title}</div>
                                <div class="vehicle-model">${dateStr}</div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: 700; color: #2d3748;">₹${price || 0}</div>
                                <div style="font-size: 11px; color: ${iconColor}; text-transform: capitalize;">${item.status}</div>
                            </div>
                        </div>
                    `;
                    }).join('');
                } else {
                    container.innerHTML = '<p style="text-align:center; color:#718096; padding:20px;">No bookings found.</p>';
                }
            } catch (error) {
                console.error('Booking load error', error);
            }
        }

        let currentBooking = null;
        let timerInterval = null;

        // Helper function to check if booking is eligible for cancellation (within 5 days)
        function isEligibleForCancellation(booking) {
            if (!booking || booking.status.toLowerCase() !== 'active') {
                return false;
            }

            const isSub = booking.type === 'subscription' || booking.passType !== undefined;
            const startDate = isSub ? booking.startDate : booking.bookingStart || booking.createdAt;

            if (!startDate) return false;

            const bookingDate = new Date(startDate);
            const now = new Date();
            const diffTime = Math.abs(now - bookingDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return diffDays <= 5;
        }

        function openBookingModal(item) {
            console.log('Opening Modal for:', item);
            currentBooking = item;

            // Re-detect type to be safe
            const isSub = item.type === 'subscription' || item.passType !== undefined || item.qrCode !== undefined;
            if (isSub) currentBooking.type = 'subscription';

            document.getElementById('booking-modal').classList.add('active');

            // Populate Details
            const zoneName = item.zone ? item.zone.name : (isSub ? 'All Zones (Plan)' : `Booking #${item.id}`);
            document.getElementById('modal-zone-name').textContent = isSub ? 'Subscription Pass' : `Booking #${item.id}`;
            document.getElementById('modal-booking-code').textContent = isSub ? (item.qrCode || 'SUB') : (item.bookingCode || `#${item.id}`);

            const vehicleInfo = item.vehicle ? item.vehicle.licensePlate : (isSub ? 'Any Registered' : 'N/A');
            document.getElementById('modal-vehicle').textContent = vehicleInfo;

            const displayPrice = parseFloat(isSub ? item.price : item.totalPrice) || 0;
            document.getElementById('modal-price').textContent = `₹${displayPrice.toFixed(2)}`;
            document.getElementById('modal-status').textContent = item.status.toUpperCase();

            let timeLabel = 'N/A';
            if (isSub) {
                if (item.startDate && item.endDate) {
                    timeLabel = `${new Date(item.startDate).toLocaleDateString()} - ${new Date(item.endDate).toLocaleDateString()}`;
                }
            } else {
                if (item.bookingStart) {
                    timeLabel = new Date(item.bookingStart).toLocaleString();
                }
            }
            document.getElementById('modal-time-range').textContent = timeLabel;

            // QR Code
            const qrContainer = document.getElementById('booking-qr');
            qrContainer.innerHTML = '';

            // QR Content
            const qrData = {
                id: item.id,
                code: isSub ? item.qrCode : item.bookingCode,
                type: item.type || (isSub ? 'subscription' : 'hourly')
            };

            new QRCode(qrContainer, {
                text: JSON.stringify(qrData),
                width: 150,
                height: 150
            });

            // UI State & Buttons
            const scanBtn = document.getElementById('scan-btn');
            const timerBadge = document.getElementById('booking-timer-badge');

            const existingCancelBtn = document.getElementById('cancel-sub-btn');
            if (existingCancelBtn) existingCancelBtn.remove();

            // Status display update
            const statusEl = document.getElementById('modal-status');
            statusEl.textContent = item.status.toUpperCase();

            // Enhanced Cancellation Logic
            const refundRow = document.getElementById('modal-refund-row');
            if (item.status && item.status.toLowerCase() === 'cancelled') {
                refundRow.style.display = 'flex';
                const priceVal = parseFloat(isSub ? item.price : item.totalPrice) || 0;
                const refundVal = parseFloat(item.refundAmount || (priceVal / 6));
                document.getElementById('modal-refund-amount').textContent = `₹${refundVal.toFixed(2)}`;
                statusEl.className = 'status-cancelled';
            } else {
                refundRow.style.display = 'none';
                statusEl.className = '';
            }

            // HIDE Scan Button for Subscriptions (as per requirements)
            if (isSub) {
                scanBtn.style.display = 'none';
            } else {
                // Show scan button for hourly bookings based on status
                if (item.status === 'active' || item.status === 'cancelled') {
                    scanBtn.style.display = 'flex';
                } else {
                    scanBtn.style.display = 'none';
                }
            }

            // Handle Cancel Button visibility and state
            const cancelBtn = document.getElementById('cancel-btn');
            if (cancelBtn) {
                const status = (item.status || '').toString().trim().toLowerCase();

                if (status === 'active') {
                    cancelBtn.style.display = 'flex';
                    const isEligible = isEligibleForCancellation(item);

                    if (isEligible) {
                        cancelBtn.style.backgroundColor = '#dc2626';
                        cancelBtn.style.cursor = 'pointer';
                        cancelBtn.style.opacity = '1';
                        cancelBtn.disabled = false;
                        cancelBtn.innerHTML = '<i class="fas fa-ban"></i> Cancel Subscription';
                        cancelBtn.title = '';
                    } else {
                        cancelBtn.style.backgroundColor = '#9ca3af';
                        cancelBtn.style.cursor = 'not-allowed';
                        cancelBtn.style.opacity = '0.7';
                        cancelBtn.disabled = true;
                        cancelBtn.innerHTML = '<i class="fas fa-ban"></i> Cancellation Period Expired';
                        cancelBtn.title = 'Cancellation is only available within 5 days of booking';
                    }
                } else {
                    cancelBtn.style.display = 'none';
                }
            }

            if (!isSub) { // Hourly-specific UI
                if (item.status === 'active' && item.entryTime) {
                    scanBtn.style.display = 'none';
                    timerBadge.style.display = 'inline-block';
                    startTimer(item.entryTime);
                } else {
                    timerBadge.style.display = 'none';
                    if (timerInterval) clearInterval(timerInterval);
                }
            } else {
                timerBadge.style.display = 'none';
            }
        }

        function handleCancelClick() {
            if (currentBooking) {
                showCancelConfirmation(currentBooking);
            }
        }

        function showCancelConfirmation(item) {
            console.log('showCancelConfirmation called with:', item);
            currentBooking = item;
            const originalAmount = parseFloat(item.price || item.totalPrice || 0);
            const refundAmount = originalAmount / 6;

            document.getElementById('confirm-booking-id').textContent = item.id;
            document.getElementById('confirm-orig-amount').textContent = `₹${originalAmount.toFixed(2)}`;
            document.getElementById('confirm-refund-amount').textContent = `₹${refundAmount.toFixed(2)}`;

            const modal = document.getElementById('cancel-confirm-modal');
            console.log('Modal element:', modal);
            if (modal) {
                modal.classList.add('active');
                console.log('Modal should now be visible, classes:', modal.classList);
            } else {
                console.error('ERROR: cancel-confirm-modal element not found!');
            }
        }

        function closeCancelConfirmModal() {
            document.getElementById('cancel-confirm-modal').classList.remove('active');
        }

        async function confirmCancellation() {
            if (!currentBooking) return;

            const btn = document.getElementById('final-cancel-btn');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

            try {
                const token = localStorage.getItem('token');
                const isSub = currentBooking.type === 'subscription' || currentBooking.passType !== undefined;
                const endpoint = isSub
                    ? `${API_BASE_URL}/bookings/subscription/${currentBooking.id}/cancel`
                    : `${API_BASE_URL}/bookings/${currentBooking.id}/cancel`;

                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                if (data.success) {
                    showToast(`Successfully cancelled! Refunded ₹${data.data.refundAmount.toFixed(2)}`, 'success');

                    // Update current booking state
                    currentBooking.status = 'cancelled';
                    currentBooking.refundAmount = data.data.refundAmount;

                    closeCancelConfirmModal();

                    // Refresh current modal UI to show CANCELLED status and Refund Amount
                    openBookingModal(currentBooking);

                    // Refresh background data
                    loadMyBookings();
                    loadWalletBalance();
                } else {
                    showToast(data.message || 'Cancellation failed. Please try again.', 'error');
                    btn.disabled = false;
                    btn.innerHTML = 'Confirm Cancel';
                }
            } catch (error) {
                showToast('Connection error. Please check internet.', 'error');
                btn.disabled = false;
                btn.innerHTML = 'Confirm Cancel';
            }
        }

        function closeBookingModal() {
            document.getElementById('booking-modal').classList.remove('active');
            if (timerInterval) clearInterval(timerInterval);
        }

        async function handleScanBooking() {
            if (!currentBooking) return;
            const btn = document.getElementById('scan-btn');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning...';
            btn.disabled = true;

            const isSub = currentBooking.type === 'subscription';
            const endpoint = isSub
                ? `${API_BASE_URL}/bookings/subscription/${currentBooking.id}/scan`
                : `${API_BASE_URL}/bookings/${currentBooking.id}/scan`;

            try {
                const token = localStorage.getItem('token');
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                if (data.success) {
                    showToast('Scan Successful! Access Granted.', 'success');

                    if (isSub) {
                        // For subscription, maybe just show success animation?
                        // No logic to change status unless it expires.
                        btn.innerHTML = '<i class="fas fa-check"></i> Entry Recorded';
                        setTimeout(() => {
                            btn.disabled = false;
                            btn.innerHTML = '<i class="fas fa-qrcode"></i> Scan for Entry';
                        }, 2000);
                    } else {
                        // Hourly logic
                        currentBooking.entryTime = data.data.entryTime;
                        currentBooking.status = 'active';
                        btn.style.display = 'none';
                        document.getElementById('booking-timer-badge').style.display = 'inline-block';
                        document.getElementById('modal-status').textContent = 'ACTIVE (PARKED)';
                        startTimer(data.data.entryTime);
                        loadMyBookings();
                    }
                } else {
                    showToast(data.message || 'Scan failed', 'error');
                    btn.innerHTML = '<i class="fas fa-qrcode"></i> Retry Scan';
                    btn.disabled = false;
                }
            } catch (error) {
                showToast('Network error during scan', 'error');
                btn.innerHTML = '<i class="fas fa-qrcode"></i> Retry Scan';
                btn.disabled = false;
            }
        }

        function startTimer(startTimeStr) {
            if (timerInterval) clearInterval(timerInterval);

            const startTime = new Date(startTimeStr).getTime();
            const display = document.getElementById('timer-display');

            timerInterval = setInterval(() => {
                const now = new Date().getTime();
                const diff = now - startTime;

                const hours = Math.floor(diff / (1000 * 60 * 60));
                const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((diff % (1000 * 60)) / 1000);

                display.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            }, 1000);
        }

        async function loadWalletBalance() {
            try {
                const token = localStorage.getItem('token');
                // Fetch Balance
                const res = await fetch(`${API_BASE_URL}/wallet/balance`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    document.getElementById('wallet-balance').textContent = `₹ ${parseFloat(data.data.balance).toFixed(2)}`;
                } else {
                    document.getElementById('wallet-balance').textContent = '₹ 0.00';
                }

                // Fetch Transactions
                loadTransactions();

            } catch (error) {
                console.error('Wallet fetch error', error);
                document.getElementById('wallet-balance').textContent = '₹ 0.00';
            }
        }

        async function loadTransactions() {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/wallet/transactions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                const container = document.getElementById('transaction-history');
                if (data.success && data.data.transactions && data.data.transactions.length > 0) {
                    container.innerHTML = data.data.transactions.map(txn => {
                        const type = (txn.transactionType || '').toLowerCase();
                        const isCredit = type === 'credit' || type === 'refund';
                        const color = isCredit ? '#48bb78' : '#f56565';
                        const icon = isCredit ? 'fa-arrow-down' : 'fa-arrow-up';
                        const bg = isCredit ? '#f0fff4' : '#fff5f5';

                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #edf2f7;">
                                <div style="display: flex; align-items: center; gap: 15px;">
                                    <div style="width: 40px; height: 40px; background: ${bg}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                        <i class="fas ${icon}" style="color: ${color};"></i>
                                    </div>
                                    <div>
                                        <div style="font-weight: 600; color: #2d3748;">${txn.description || 'Wallet Transaction'}</div>
                                        <div style="font-size: 12px; color: #718096;">${new Date(txn.createdAt).toLocaleDateString()} at ${new Date(txn.createdAt).toLocaleTimeString()}</div>
                                    </div>
                                </div>
                                <div style="font-weight: 700; color: ${color};">
                                    ${isCredit ? '+' : '-'} ₹${parseFloat(txn.amount).toFixed(2)}
                                </div>
                            </div>
                        `;
                    }).join('');
                } else {
                    container.innerHTML = '<div style="text-align: center; color: #a0aec0; padding: 20px;">No recent transactions</div>';
                }
            } catch (e) {
                console.error('Txn fetch fail', e);
            }
        }

        function openWalletModal() {
            document.getElementById('wallet-modal').classList.add('active');
        }

        function closeWalletModal() {
            document.getElementById('wallet-modal').classList.remove('active');
        }

        async function handleTopUp(e) {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('topup-amount').value);
            if (!amount || amount <= 0) {
                showToast('Please enter a valid amount', 'error');
                return;
            }

            // Simulate Payment Gateway processing time
            const btn = e.target.querySelector('button');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            btn.disabled = true;

            setTimeout(async () => {
                try {
                    const token = localStorage.getItem('token');
                    console.log('Top-up request:', { amount, token: token ? 'present' : 'missing' });

                    const res = await fetch(`${API_BASE_URL}/wallet/topup`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ amount })
                    });

                    console.log('Top-up response status:', res.status);
                    const data = await res.json();
                    console.log('Top-up response data:', data);

                    if (data.success) {
                        showToast(`Successfully added ₹${amount} to wallet!`, 'success');
                        closeWalletModal();
                        loadWalletBalance(); // Refresh balance
                        document.getElementById('wallet-form').reset();
                    } else {
                        const errorMsg = data.error || data.message || 'Top-up failed';
                        console.error('Top-up failed:', errorMsg);
                        showToast(errorMsg, 'error');
                    }
                } catch (error) {
                    console.error('Top-up error:', error);
                    showToast(`Server error: ${error.message}`, 'error');
                } finally {
                    btn.innerHTML = originalText;
                    btn.disabled = false;
                }
            }, 1500); // 1.5s delay to simulate payment gateway
        }

        async function loadVehicles() {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/vehicles/my`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                const container = document.getElementById('vehicle-list-container');
                if (data.success && data.data.vehicles.length > 0) {
                    container.innerHTML = data.data.vehicles.map(v => `
                        <div class="vehicle-item">
                            <div class="vehicle-icon">
                                <i class="fas fa-${v.type === 'bike' ? 'motorcycle' : 'car'}"></i>
                            </div>
                            <div class="vehicle-details">
                                <div class="vehicle-plate">${v.licensePlate}</div>
                                <div class="vehicle-model">${v.model || 'Unknown Model'} | ${v.color || 'No Color'}</div>
                            </div>
                            <button class="btn btn-sm btn-outline" style="color:#e53e3e; border-color:#fc8181;" onclick="deleteVehicle(${v.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('');
                } else {
                    container.innerHTML = '<p style="text-align:center; color:#718096; padding:20px;">No vehicles registered yet.</p>';
                }
            } catch (error) {
                showToast('Failed to load vehicles', 'error');
            }
        }

        function openVehicleModal() {
            document.getElementById('vehicle-modal').classList.add('active');
        }

        function closeVehicleModal() {
            document.getElementById('vehicle-modal').classList.remove('active');
        }

        async function handleAddVehicle(e) {
            e.preventDefault();
            const payload = {
                licensePlate: document.getElementById('v-plate').value,
                type: document.getElementById('v-type').value,
                model: document.getElementById('v-model').value,
                color: document.getElementById('v-color').value
            };

            console.log('Vehicle registration payload:', payload);

            try {
                const token = localStorage.getItem('token');
                console.log('Token present:', token ? 'yes' : 'no');

                const res = await fetch(`${API_BASE_URL}/vehicles`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                console.log('Vehicle registration response status:', res.status);
                const data = await res.json();
                console.log('Vehicle registration response data:', data);

                if (data.success) {
                    showToast('Vehicle added successfully!', 'success');
                    closeVehicleModal();
                    loadVehicles();
                    document.getElementById('vehicle-form').reset();
                } else {
                    const errorMsg = data.error || data.message || 'Failed to add vehicle';
                    console.error('Vehicle registration failed:', errorMsg);
                    showToast(errorMsg, 'error');
                }
            } catch (error) {
                console.error('Vehicle registration error:', error);
                showToast(`Error adding vehicle: ${error.message}`, 'error');
            }
        }

        async function deleteVehicle(id) {
            if (!confirm('Are you sure you want to remove this vehicle?')) return;
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    showToast('Vehicle removed', 'success');
                    loadVehicles();
                }
            } catch (error) {
                showToast('Error deleting vehicle', 'error');
            }
        }

        document.getElementById('profile-form').onsubmit = async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('prof-fullname').value;
            const phone = document.getElementById('prof-phone').value;

            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/auth/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ fullName, phone })
                });
                const data = await res.json();
                if (data.success) {
                    showToast('Profile updated!', 'success');
                    localStorage.setItem('user_data', JSON.stringify(data.data.user));
                    setTimeout(() => location.reload(), 1000);
                }
            } catch (error) {
                showToast('Update failed', 'error');
            }
        };

        // Profile Photo Upload Handler
        const photoInput = document.getElementById('photo-upload');
        if (photoInput) {
            photoInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // Validate size (5MB)
                if (file.size > 5 * 1024 * 1024) {
                    showToast('File too large (Max 5MB)', 'error');
                    photoInput.value = '';
                    return;
                }

                const formData = new FormData();
                formData.append('profilePhoto', file);

                // Show uploading state
                const displayPhoto = document.getElementById('display-photo');
                displayPhoto.style.opacity = '0.5';

                try {
                    const token = localStorage.getItem('token');
                    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });

                    const data = await res.json();
                    if (data.success) {
                        showToast('Profile photo updated!', 'success');
                        const user = JSON.parse(localStorage.getItem('user_data'));
                        user.profilePhoto = data.data.user.profilePhoto;
                        localStorage.setItem('user_data', JSON.stringify(user));

                        const photoUrl = data.data.user.profilePhoto.startsWith('http')
                            ? data.data.user.profilePhoto
                            : `${API_BASE_URL.replace('/api', '')}/${data.data.user.profilePhoto}`;

                        displayPhoto.src = `${photoUrl}?t=${new Date().getTime()}`;
                    } else {
                        showToast(data.error || 'Upload failed', 'error');
                    }
                } catch (err) {
                    console.error(err);
                    showToast('Upload error', 'error');
                } finally {
                    displayPhoto.style.opacity = '1';
                    photoInput.value = '';
                }
            });
        }

        // Final Global Exposure
        exposeGlobals();
    