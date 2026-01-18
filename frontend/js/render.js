// Render Functions
function updateHomeStats() {
    const totalSlots = parkingZones.reduce((acc, zone) => acc + (zone.totalCapacity || 0), 0);
    const totalZones = parkingZones.length;
    updateStatTarget('home-stat-slots', totalSlots || 150);
    updateStatTarget('home-stat-zones', totalZones || 12);
}

function updateStatTarget(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.setAttribute('data-target', value);
        // Only trigger animation if on home view and it's visible
        if (document.getElementById('home').classList.contains('active')) {
            animateStats();
        }
    }
}

function updateDashboardStats() {
    document.getElementById('total-zones').textContent = parkingZones.length;
    const totalVehicles = parkingZones.reduce((acc, cur) => acc + (cur.currentOccupancy || 0), 0);
    document.getElementById('total-vehicles').textContent = totalVehicles;
}

function updateViolationCounts() {
    const pendingCount = (violations || []).filter(v => !v.resolved).length;
    document.getElementById('violation-count').textContent = pendingCount;
    document.getElementById('active-violations').textContent = pendingCount;
    document.getElementById('live-violation-count').textContent = pendingCount;
}

function renderZoneList() {
    const container = document.getElementById('zone-overview');
    if (!container) return;

    if (!parkingZones || parkingZones.length === 0) {
        container.innerHTML = '<div style=\"padding: 24px; text-align: center; color: #718096;\"><i class=\"fas fa-info-circle\"></i> No zones available.</div>';
        return;
    }

    container.innerHTML = parkingZones.map(zone => {
        const fillPercent = Math.min(100, (zone.currentOccupancy / zone.totalCapacity) * 100);
        const statusClass = fillPercent > 90 ? 'critical' : (fillPercent > 70 ? 'warning' : 'normal');

        return `
            <div class=\"zone-card ${statusClass}\">
                <div class=\"zone-card-header\">
                    <span class=\"zone-card-name\">${zone.name}</span>
                    <span class=\"zone-card-status ${statusClass}\">${statusClass.toUpperCase()}</span>
                </div>
                <div class=\"zone-card-capacity\">
                    <div class=\"zone-card-fill ${statusClass}\" style=\"width: ${fillPercent}%\"></div>
                </div>
                <div class=\"zone-card-stats\">
                    <span>${zone.currentOccupancy}/${zone.totalCapacity} Slots</span>
                    <span>${Math.round(fillPercent)}% Full</span>
                </div>
            </div>
        `;
    }).join('');
}

function renderViolationsList() {
    const container = document.getElementById('violations-list');
    if (!container) return;

    const activeViolations = (violations || []).filter(v => !v.resolved).slice(0, 5);
    if (activeViolations.length === 0) {
        container.innerHTML = '<div style=\"padding: 24px; text-align: center; color: #718096;\"><i class=\"fas fa-check-circle\"></i> No active violations.</div>';
        return;
    }

    container.innerHTML = activeViolations.map(v => {
        const zone = parkingZones.find(z => z.id === v.zoneId);
        const typeStr = v.severity === 'critical' ? 'OVER-CAPACITY' : 'LIMIT-WARNING';
        return `
            <div class=\"violation-item ${v.severity === 'critical' ? '' : 'warning'}\">
                <div style=\"display: flex; justify-content: space-between; align-items: flex-start;\">
                    <div>
                        <div class=\"activity-title\" style=\"color: #e53e3e;\">${typeStr}</div>
                        <div class=\"activity-details\">${zone ? zone.name : 'Unknown Zone'}</div>
                    </div>
                    <span class=\"badge ${v.severity === 'critical' ? 'danger' : 'warning'}\" style=\"font-size: 9px;\">${v.severity}</span>
                </div>
                <div class=\"activity-time\"><i class=\"fas fa-clock\"></i> ${new Date(v.timestamp).toLocaleTimeString()}</div>
            </div>
        `;
    }).join('');
}

function renderRecentActivities() {
    const container = document.getElementById('activity-list');
    if (!container) return;

    const vActivities = (violations || []).slice(0, 5).map(v => ({
        type: 'violation',
        title: `Violation: ${v.severity === 'critical' ? 'CAPACITY EXCEEDED' : 'LIMIT NEAR'}`,
        detail: `ID: #${v.id} at ${parkingZones.find(z => z.id === v.zoneId)?.name || 'Parking Zone'}`,
        time: v.timestamp,
        icon: 'exclamation-circle',
        color: '#f59e0b'
    }));

    const activities = [...vActivities].sort((a, b) => new Date(b.time) - new Date(a.time));

    if (activities.length === 0) {
        container.innerHTML = '<div style=\"padding: 24px; text-align: center; color: #718096;\">No recent activity.</div>';
        return;
    }

    container.innerHTML = activities.map(act => `
        <div class=\"activity-item\">
            <div class=\"activity-icon\" style=\"background: ${act.color}15; color: ${act.color};\">
                <i class=\"fas fa-${act.icon}\"></i>
            </div>
            <div class=\"activity-content\">
                <div class=\"activity-title\">${act.title}</div>
                <div class=\"activity-details\">${act.detail}</div>
                <div class=\"activity-time\"><i class=\"fas fa-clock\"></i> ${new Date(act.time).toLocaleTimeString()}</div>
            </div>
        </div>
    `).join('');
}

function updateInsights() {
    const container = document.getElementById('insights-container');
    if (!container) return;

    const criticalZones = parkingZones.filter(z => (z.currentOccupancy / z.totalCapacity) > 0.9);
    const pendingViolations = (violations || []).filter(v => !v.resolved);

    let insightsHtml = '';

    if (criticalZones.length > 0) {
        insightsHtml += `
            <div class=\"insight-item\" style=\"border-left: 4px solid #e53e3e;\">
                <i class=\"fas fa-exclamation-circle\" style=\"color: #e53e3e; font-size: 20px;\"></i>
                <div>
                    <strong style=\"display: block; font-size: 13px;\">Critical Occupancy</strong>
                    <span style=\"font-size: 11px; color: #718096;\">${criticalZones.length} zones are over 90% capacity.</span>
                </div>
            </div>
        `;
    }

    if (pendingViolations.length > 5) {
        insightsHtml += `
            <div class=\"insight-item\" style=\"border-left: 4px solid #f6ad55;\">
                <i class=\"fas fa-bolt\" style=\"color: #f6ad55; font-size: 20px;\"></i>
                <div>
                    <strong style=\"display: block; font-size: 13px;\">High Violation Rate</strong>
                    <span style=\"font-size: 11px; color: #718096;\">${pendingViolations.length} pending issues require attention.</span>
                </div>
            </div>
        `;
    }

    if (insightsHtml === '') {
        insightsHtml = '<div style=\"padding: 10px; color: #48bb78; font-size: 12px;\"><i class=\"fas fa-check-circle\"></i> System operations are optimal. No critical issues detected.</div>';
    }

    container.innerHTML = insightsHtml;
}

function renderZoneTable() {
    const tbody = document.getElementById('zones-table-body');
    if (!tbody) return;

    if (!parkingZones || parkingZones.length === 0) {
        tbody.innerHTML = '<tr><td colspan=\"7\" style=\"text-align: center; padding: 24px;\">No zones found.</td></tr>';
        return;
    }

    tbody.innerHTML = parkingZones.map(zone => {
        const occupancy = Math.round((zone.currentOccupancy / zone.totalCapacity) * 100) || 0;
        const statusBadge = zone.status === 'active' ? 'success' : 'warning';

        return `
            <tr>
                <td>${zone.name}</td>
                <td>${zone.contractorName || 'MCD'}</td>
                <td>${zone.currentOccupancy}/${zone.totalCapacity}</td>
                <td>${zone.contractorLimit}</td>
                <td>₹${zone.hourlyRate}</td>
                <td><span class=\"badge ${statusBadge}\">${zone.status}</span></td>
                <td>
                    <button class="action-btn view" onclick="openViewZoneModal('${zone.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${currentUser && currentUser.role === 'admin' ? `
                    <button class="action-btn" style="color: #e53e3e; background: #fff5f5;" onclick="openDeleteZoneModal('${zone.id}')" title="Delete Zone">
                        <i class="fas fa-trash"></i>
                    </button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function renderViolationsTable() {
    const tbody = document.getElementById('violations-table-body');
    if (!tbody) return;

    if (!violations || violations.length === 0) {
        tbody.innerHTML = '<tr><td colspan=\"8\" style=\"text-align: center; padding: 24px;\">No violations recorded.</td></tr>';
        return;
    }

    tbody.innerHTML = violations.map(v => {
        const zone = parkingZones.find(z => z.id === v.zoneId);
        const statusBadge = !v.resolved ? 'danger' : 'success';
        const severityBadge = v.severity === 'critical' ? 'danger' : 'warning';

        return `
            <tr>
                <td style="font-weight: 700;">#${v.id}</td>
                <td>${zone ? zone.name : 'Unknown'}</td>
                <td><span class="badge ${severityBadge}">${v.severity}</span></td>
                <td>${v.excessVehicles} Vehicles</td>
                <td><strong style=\"color: #e53e3e;\">₹${v.penaltyAmount}</strong></td>
                <td><span class=\"badge ${statusBadge}\">${!v.resolved ? 'PENDING' : 'RESOLVED'}</span></td>
                <td style=\"font-size: 12px; color: #64748b;\">${new Date(v.timestamp).toLocaleString()}</td>
                <td>
                    ${(currentUser && (currentUser.role === 'officer' || currentUser.role === 'admin')) ? `
                    <button class="action-btn resolve" onclick="openResolveModal('${v.id}')" title="Resolve Violation">
                        <i class="fas fa-gavel"></i> Take Action
                    </button>` : `<span style="font-size: 11px; color: #718096;"><i class="fas fa-lock"></i> Restricted</span>`}
                </td>
            </tr>
        `;
    }).join('');
}

async function openViewZoneModal(zoneId) {
    console.log('Opening View Zone Modal for ID:', zoneId);
    try {
        const modal = document.getElementById('view-zone-modal');
        if (!modal) return;

        // Show loading state
        document.getElementById('modal-zone-name').textContent = 'Loading...';
        document.getElementById('modal-slots-grid').innerHTML = '<div style="padding: 20px; text-align: center; width: 100%;"><i class="fas fa-spinner fa-spin"></i> Loading slots...</div>';
        modal.classList.add('active');

        // Fetch Zone Details
        const zoneData = await fetchAPI(`/zones/${zoneId}`);
        const zone = zoneData.data.zone || zoneData.data;

        // Populate Basic Info
        document.getElementById('modal-zone-name').textContent = zone.name || zone.zoneName;
        document.getElementById('modal-zone-address').textContent = zone.address;
        document.getElementById('modal-zone-contractor').textContent = zone.contractorName || 'MCD';
        document.getElementById('modal-zone-occupancy').textContent = `${zone.currentOccupancy || 0}/${zone.totalCapacity || 0}`;
        document.getElementById('modal-zone-rate').textContent = `₹${zone.hourlyRate || 0}`;
        document.getElementById('modal-zone-hours').textContent = zone.operatingHours || '24/7';

        // Fetch Slots
        const slotsData = await fetchAPI(`/zones/${zoneId}/slots`);
        console.log('[DEBUG] Slots data received:', slotsData);
        
        const slots = slotsData.data.slots || slotsData.data || [];
        renderSlotsGrid(slots);
    } catch (error) {
        showToast('Failed to load zone details', 'error');
        console.error('[ERROR] openViewZoneModal failed:', error);
    }
}

function renderSlotsGrid(slots) {
    const container = document.getElementById('modal-slots-grid');
    if (!container) return;

    if (slots.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; width: 100%;">No slot data available for this zone.</div>';
        return;
    }

    container.innerHTML = slots.map(slot => {
        const status = (slot.status || 'available').toLowerCase();
        const icon = status === 'available' ? 'check' : (status === 'occupied' ? 'car' : 'tools');
        const color = status === 'available' ? '#10b981' : (status === 'occupied' ? '#ef4444' : '#64748b');

        return `
            <div class="slot-mini-card" style="background: white; border-radius: 8px; padding: 10px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
                <div style="font-size: 10px; font-weight: 700; color: #64748b; margin-bottom: 5px;">#${slot.slotNumber}</div>
                <i class="fas fa-${icon}" style="color: ${color}; font-size: 14px;"></i>
                <div style="font-size: 8px; margin-top: 3px; color: ${color}; text-transform: uppercase; font-weight: 800;">${status}</div>
            </div>
        `;
    }).join('');
}

function openResolveModal(violationId) {
    const violation = violations.find(v => v.id == violationId);
    if (!violation) return;

    document.getElementById('resolve-violation-id').value = violationId;
    document.getElementById('resolve-code').textContent = `#${violationId}`;
    document.getElementById('resolve-modal').classList.add('active');
}

async function handleViolationResolve(event) {
    event.preventDefault();
    const id = document.getElementById('resolve-violation-id').value;
    const status = document.querySelector('input[name="res-status"]:checked').value;
    const notes = document.getElementById('resolve-notes').value;

    try {
        const btn = document.getElementById('resolve-submit-btn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Committing...';
        }

        const token = localStorage.getItem('token');
        const res = await fetchAPI(`/violations/${id}/resolve`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status, notes })
        });

        console.log('Resolution API Result:', res);

        if (res.success) {
            showToast(`Violation #${id} marked as ${status}`, 'success');
            closeResolveModal();
            if (typeof loadViolations === 'function') loadViolations();
            else fetchViolations();
        } else {
            console.error('Resolution Failed:', res.error || res.message);
            showToast(res.error || res.message || 'Failed to resolve', 'error');
        }
    } catch (error) {
        console.error('Resolution Error:', error);
        showToast('Failed to resolve violation: ' + error.message, 'error');
    } finally {
        const btn = document.getElementById('resolve-submit-btn');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-double"></i> Commit Resolution';
        }
    }
}

function selectResOption(el) {
    const radio = el.previousElementSibling;
    if (radio && radio.type === 'radio') {
        radio.checked = true;
    }
}

