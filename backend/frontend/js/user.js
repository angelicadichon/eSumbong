// Dashboard functionality
let allComplaints = [];

// Load dashboard data
async function loadDashboardData() {
    try {
        const response = await fetch('/api/complaints');
        const result = await response.json();
        
        if (result.success) {
            allComplaints = result.complaints;
            updateAnalytics(allComplaints);
            populateComplaintsTable(allComplaints);
        } else {
            showError('Failed to load complaints');
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

// Update analytics cards
function updateAnalytics(complaints) {
    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'pending').length;
    const inProgress = complaints.filter(c => c.status === 'in-progress').length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;

    document.getElementById('totalReports').textContent = total;
    document.getElementById('pendingReports').textContent = pending;
    document.getElementById('progressReports').textContent = inProgress;
    document.getElementById('resolvedReports').textContent = resolved;
}

// Populate complaints table
function populateComplaintsTable(complaints) {
    const tbody = document.getElementById('complaintsBody');
    
    if (complaints.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading-text">No complaints found</td></tr>';
        return;
    }

    tbody.innerHTML = complaints.map(complaint => `
        <tr>
            <td><strong>${complaint.refNumber}</strong></td>
            <td>${formatDate(complaint.created_at)}</td>
            <td>${complaint.category || 'N/A'}</td>
            <td>${complaint.description || 'No description'}</td>
            <td><span class="status ${complaint.status || 'pending'}">${getStatusText(complaint.status)}</span></td>
            <td>${complaint.location || 'N/A'}</td>
        </tr>
    `).join('');
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
function showError(message) {
    const tbody = document.getElementById('complaintsBody');
    tbody.innerHTML = `<tr><td colspan="6" style="color: red; text-align: center;">${message}</td></tr>`;
}

// Shared JS for user pages: active nav highlighting, search filter, logout
document.addEventListener('DOMContentLoaded', function() {
    // Highlight the active nav item based on current file
    try {
        const links = document.querySelectorAll('.sidebar nav ul li');
        const path = (location.pathname.split('/').pop() || 'user-dashboard.html').toLowerCase();
        links.forEach(li => {
            const linkFile = li.getAttribute('data-link');
            if (linkFile && linkFile.toLowerCase() === path) {
                li.classList.add('active');
            } else {
                li.classList.remove('active');
            }
        });
    } catch (e) {}

    // Table search on dashboard
    const tableSearch = document.getElementById('tableSearch');
    if (tableSearch) {
        tableSearch.addEventListener('input', function(e) {
            filterTable(e.target.value);
        });
    }

    // Global search (optional)
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

    // Feedback star interactions
    document.querySelectorAll('.star-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const val = Number(this.dataset.value || 0);
            document.querySelectorAll('.star-btn').forEach(s => s.textContent = '☆');
            for (let i = 0; i < val; i++) {
                document.querySelectorAll('.star-btn')[i].textContent = '★';
            }
            document.getElementById('fbResponse')?.classList.remove('success');
            document.getElementById('fbResponse')?.textContent = '';
            (document.getElementById('feedbackText') || {}).dataset.rating = val;
        });
    });
});

// Helper: filter rows in complaints table
function filterTable(query) {
    const q = query.trim().toLowerCase();
    const tbody = document.getElementById('complaintsBody');
    if (!tbody) return;
    
    Array.from(tbody.rows).forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(q) ? '' : 'none';
    });
}

// Logout redirect
function logout() {
    // Clear session data here if needed
    window.location.href = 'index.html';
}

// Feedback submit
function submitFeedback() {
    const rating = (document.getElementById('feedbackText') || {}).dataset.rating || '0';
    const comment = document.getElementById('feedbackText')?.value || '';
    const resp = document.getElementById('fbResponse');
    resp.textContent = `Thanks! You rated ${rating} star(s).`;
    resp.classList.add('success');
}