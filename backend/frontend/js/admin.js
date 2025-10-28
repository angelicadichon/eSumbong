// Admin Dashboard functionality
let allComplaints = [];

// Load admin dashboard data
async function loadAdminDashboard() {
    try {
        const response = await fetch('/api/complaints');
        const result = await response.json();
        
        if (result.success) {
            allComplaints = result.complaints;
            updateAdminAnalytics(allComplaints);
            populateAdminComplaintsTable(allComplaints);
        } else {
            showAdminError('Failed to load complaints');
        }
    } catch (error) {
        console.error('Error loading admin dashboard data:', error);
        showAdminError('Failed to load dashboard data');
    }
}

// Update admin analytics cards
function updateAdminAnalytics(complaints) {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in-progress').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;

    document.getElementById('totalReports').textContent = total;
    document.getElementById('pendingReports').textContent = pending;
    document.getElementById('progressReports').textContent = inProgress;
    document.getElementById('resolvedReports').textContent = resolved;
}

// Populate admin complaints table
function populateAdminComplaintsTable(complaints) {
    const tbody = document.getElementById('complaintsBody');
    
    if (complaints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="loading-text">No complaints found in the system</td></tr>';
        return;
    }

    tbody.innerHTML = complaints.map(complaint => `
        <tr>
            <td><strong>${complaint.refNumber}</strong></td>
            <td>${formatDate(complaint.created_at)}</td>
            <td>${complaint.name || 'N/A'}</td>
            <td>${complaint.contact || 'N/A'}</td>
            <td>${complaint.category || 'N/A'}</td>
            <td class="description-cell">${complaint.description || 'No description'}</td>
            <td>${complaint.location || 'N/A'}</td>
            <td>
                <span class="status ${complaint.status || 'pending'}">
                    ${getStatusText(complaint.status)}
                </span>
            </td>
            <td>
                <select class="status-update" data-ref="${complaint.refNumber}" onchange="updateComplaintStatus('${complaint.refNumber}', this.value)">
                    <option value="pending" ${complaint.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="in-progress" ${complaint.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                    <option value="resolved" ${complaint.status === 'resolved' ? 'selected' : ''}>Resolved</option>
                </select>
            </td>
        </tr>
    `).join('');
}

// Update complaint status
async function updateComplaintStatus(refNumber, status) {
    try {
        const response = await fetch(`/api/complaints/${refNumber}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ status: status })
        });
        
        const result = await response.json();
        if (result.success) {
            showAdminSuccess('Status updated successfully');
            loadAdminDashboard(); // Refresh the data
        } else {
            showAdminError('Failed to update status');
        }
    } catch (error) {
        console.error('Error updating status:', error);
        showAdminError('Error updating status');
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Get status display text
function getStatusText(status) {
    const statusMap = {
        'pending': 'Pending',
        'in-progress': 'In Progress',
        'resolved': 'Resolved'
    };
    return statusMap[status] || 'Pending';
}

// Show error message
function showAdminError(message) {
    const tbody = document.getElementById('complaintsBody');
    tbody.innerHTML = `<tr><td colspan="9" style="color: red; text-align: center;">${message}</td></tr>`;
}

// Show success message
function showAdminSuccess(message) {
    // You can implement a toast notification here
    console.log('Success:', message);
}

// Shared JS for admin pages
document.addEventListener('DOMContentLoaded', function() {
    // Highlight the active nav item based on current file
    try {
        const links = document.querySelectorAll('.sidebar nav ul li');
        const path = (location.pathname.split('/').pop() || 'admin-dashboard.html').toLowerCase();
        links.forEach(li => {
            const linkFile = li.getAttribute('data-link');
            if (linkFile && linkFile.toLowerCase() === path) {
                li.classList.add('active');
            } else {
                li.classList.remove('active');
            }
        });
    } catch (e) {}

    // Table search
    const tableSearch = document.getElementById('tableSearch');
    if (tableSearch) {
        tableSearch.addEventListener('input', function(e) {
            filterAdminTable(e.target.value);
        });
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function(e) {
            filterAdminTableByStatus(e.target.value);
        });
    }

    // Global search
    const globalSearch = document.getElementById('searchInput');
    if (globalSearch) {
        globalSearch.addEventListener('input', function(e) {
            const t = document.getElementById('tableSearch');
            if (t) {
                t.value = e.target.value;
                t.dispatchEvent(new Event('input'));
            }
        });
    }
});

// Filter table by search text
function filterAdminTable(query) {
    const q = query.trim().toLowerCase();
    const tbody = document.getElementById('complaintsBody');
    if (!tbody) return;
    
    Array.from(tbody.rows).forEach(row => {
        if (row.cells.length < 2) return; // Skip loading/error rows
        
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
}

// Filter table by status
function filterAdminTableByStatus(status) {
    const tbody = document.getElementById('complaintsBody');
    if (!tbody) return;
    
    Array.from(tbody.rows).forEach(row => {
        if (row.cells.length < 8) return; // Skip loading/error rows
        
        const statusCell = row.cells[7]; // Status is in the 8th cell (0-indexed)
        const rowStatus = statusCell.querySelector('.status')?.className.includes(status);
        
        if (!status || rowStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Logout redirect
function logout() {
    // Clear session data here if needed
    window.location.href = 'index.html';
}