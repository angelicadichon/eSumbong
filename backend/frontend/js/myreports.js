let allComplaints = [];

// filter user dashboard information during login
async function loadDashboardData() {
    try {
        const username = localStorage.getItem('username');
        const role = localStorage.getItem('role');
        
        if (!username) {
            window.location.href = 'index.html';
            return;
        }

        console.log("Loading dashboard for:", { username, role });

        const response = await fetch(`/api/complaints?username=${encodeURIComponent(username)}&role=${encodeURIComponent(role)}`);        const result = await response.json();
        
        if (result.success) {
            allComplaints = result.complaints;
            console.log("All complaints fetched:", allComplaints);
            
            // Filter complaints by username to display only those complaint the logged in user submitted
            if (role === 'resident') {
                allComplaints = allComplaints.filter(complaint => {
                    console.log("Comparing:", complaint.username, "with:", username);
                    return complaint.username === username;
                });
                console.log("Filtered complaints for resident:", allComplaints);
            }
            
            updateAnalytics(allComplaints);
            populateComplaintCards(allComplaints);
            setupModal();
        } else {
            showError('Failed to load complaints');
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

// get analytics information
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

// Populate complaint cards
function populateComplaintCards(complaints) {
    const container = document.getElementById('complaintsContainer');

    if (complaints.length === 0) {
        container.innerHTML = '<p class="loading-text">No complaints found</p>';
        return;
    }

    container.innerHTML = complaints.map(complaint => `
    <div class="complaint-card ${complaint.status || 'pending'}" data-id="${complaint.id}">
        <div class="card-category">${complaint.category || 'General'}</div>
        <div class="card-description">${complaint.description || 'No description'}</div>
        <div class="card-footer">
            <span class="status ${complaint.status || 'pending'}">${getStatusText(complaint.status)}</span>
            <span class="card-date">${formatDate(complaint.created_at)}</span>
        </div>
        <div class="card-actions">
            <button class="view-btn" onclick="openComplaintModal('${complaint.id}')">View Details</button>
        </div>
    </div>
    `).join('');
}

// Open complaint modal
function openComplaintModal(complaintId) {
    const complaint = allComplaints.find(c => c.id == complaintId);
    if (!complaint) return;
    
    const modal = document.getElementById('complaintModal');
    const modalCategory = document.getElementById('modalCategory');
    const modalStatus = document.getElementById('modalStatus');
    const modalDate = document.getElementById('modalDate');
    const modalLocation = document.getElementById('modalLocation');
    const modalDescription = document.getElementById('modalDescription');
    const modalAttachment = document.getElementById('modalAttachment');
    const modalAfterPhoto = document.getElementById('modalAfterPhoto');
    const modalTeamNotes = document.getElementById('modalTeamNotes');
    const resolvedSection = document.getElementById('resolvedSection');
    const beforePhotoSection = document.getElementById('beforePhotoSection');
    
    // Populate modal with complaint data
    modalCategory.textContent = complaint.category || 'General Complaint';
    modalStatus.textContent = getStatusText(complaint.status);
    modalStatus.className = `status ${complaint.status || 'pending'}`;
    modalDate.textContent = formatDate(complaint.created_at);
    modalLocation.textContent = complaint.location || 'Not specified';
    modalDescription.textContent = complaint.description || 'No description provided';
    
    // Handle attachment
    if (complaint.file) {
        modalAttachment.src = complaint.file;
        modalAttachment.style.display = 'block';
        beforePhotoSection.style.display = 'block';
    } else {
        modalAttachment.style.display = 'none';
        beforePhotoSection.style.display = 'none';
    }
    
    // Handle resolved complaints
    if (complaint.status === 'resolved') {
        resolvedSection.style.display = 'block';
        modalAfterPhoto.src = complaint.after_photo || '';
        modalTeamNotes.textContent = complaint.team_notes || 'No notes provided';
    } else {
        resolvedSection.style.display = 'none';
    }
    
    modal.style.display = 'block';
}

// Setup modal functionality
function setupModal() {
    const modal = document.getElementById('complaintModal');
    const closeBtn = document.querySelector('.close');
    
    if (!closeBtn) return;
    
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            modal.style.display = 'none';
        }
    });
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getStatusText(status) {
    const statusMap = {
        'pending': 'Pending',
        'in-progress': 'In Progress',
        'resolved': 'Resolved'
    };
    return statusMap[status] || 'Pending';
}

function showError(message) {
    const container = document.getElementById('complaintsContainer');
    container.innerHTML = `<p style="color: red; text-align: center;">${message}</p>`;
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
});

// Logout function
function logout() {
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    window.location.href = 'index.html';
}