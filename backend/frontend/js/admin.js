let complaintsData = [];
let selectedComplaintId = null;

// Search function
function handleSearch(query) {
  const q = query.trim().toLowerCase();
  const filtered = complaintsData.filter(c =>
    c.description?.toLowerCase().includes(q) ||
    c.category?.toLowerCase().includes(q) ||
    c.location?.toLowerCase().includes(q) ||
    c.name?.toLowerCase().includes(q)
  );
  renderComplaintCards(filtered);
}

// Filter function
function handleStatusFilter(status) {
  const filtered = status ? complaintsData.filter(c => c.status === status) : complaintsData;
  renderComplaintCards(filtered);
}

// Combined search and filter function
function applySearchAndFilter(searchQuery, statusFilter) {
  let filtered = [...complaintsData];
  
  // Apply status filter 
  if (statusFilter) {
    filtered = filtered.filter(c => c.status === statusFilter);
  }
  
  // Apply search filter
  if (searchQuery) {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(c =>
      c.description?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q)
    );
  }
  
  renderComplaintCards(filtered);
}

function setupSearchAndFilterListeners() {
  // Search functionality
  const searchInput = document.getElementById('tableSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchQuery = e.target.value;
      const statusFilter = document.getElementById('statusFilter').value;
      applySearchAndFilter(searchQuery, statusFilter);
    });
  }

  // Status filter functionality
  const statusFilter = document.getElementById('statusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      const statusFilterValue = e.target.value;
      const searchQuery = document.getElementById('tableSearch').value;
      applySearchAndFilter(searchQuery, statusFilterValue);
    });
  }
}

// Load complaints for admin display 
async function loadAdminDashboard() {
  try {
    const res = await fetch('/api/complaints');
    const result = await res.json();

    if (result.success) {
      complaintsData = result.complaints;
      renderComplaintCards(complaintsData);
      updateAdminAnalytics(complaintsData);
      setupSearchAndFilterListeners();
    } else {
      document.getElementById('complaintsContainer').innerHTML =
        `<p class="loading-text">Failed to load complaints.</p>`;
    }
  } catch (err) {
    console.error('Error loading complaints:', err);
  }
}
function filterComplaintCards(query) {
  const q = query.trim().toLowerCase();
  const cards = document.querySelectorAll('.complaint-card');
  
  cards.forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? '' : 'none';
  });
}


// Render complaint cards
function renderComplaintCards(complaints) {
  const container = document.getElementById('complaintsContainer');
  if (!container) return;

  if (complaints.length === 0) {
    container.innerHTML = `<p class="loading-text">No complaints found.</p>`;
    return;
  }

  // In your renderComplaintCards function, update the card HTML:
container.innerHTML = complaints.map(c => `
  <div class="complaint-card ${c.status}" onclick="openComplaintModal(${c.id})">
    <span class="status-badge ${c.status}">${c.status}</span>
    <h3>${c.category}</h3>
    <p><strong>Submitted By:</strong> ${c.name || 'N/A'}</p>
    <p><strong>Date:</strong> ${new Date(c.created_at).toLocaleDateString()}</p>
    <p><strong>Location:</strong> ${c.location || 'N/A'}</p>
    <p>${c.description?.slice(0, 60) || ''}...</p>
  </div>
`).join('');
}

// view modal with full complaint details
function openComplaintModal(id) {
  selectedComplaintId = id;
  const complaint = complaintsData.find(c => c.id === id);
  const modal = document.getElementById('complaintModal');
  const details = document.getElementById('modalDetails');

  if (!complaint) return;

  // Render file images if they exist
  const fileImage = complaint.file ? `
    <div class="image-section">
      <strong>Before Photo:</strong><br>
      <img src="${complaint.file}" alt="Before Photo" class="modal-image" />
    </div>
  ` : '<p><strong>Before Photo:</strong> No File</p>';

  const afterPhotoImage = complaint.after_photo ? `
    <div class="image-section">
      <strong>After Photo:</strong><br>
      <img src="${complaint.after_photo}" alt="After Photo" class="modal-image" />
    </div>
  ` : '<p><strong>After Photo:</strong> No File</p>';

  details.innerHTML = `
    <p><strong>Category:</strong> ${complaint.category}</p>
    <p><strong>Description:</strong> ${complaint.description}</p>
    <p><strong>Submitted By:</strong> ${complaint.name}</p>
    <p><strong>Contact:</strong> ${complaint.contact || 'N/A'}</p>
    <p><strong>Location:</strong> ${complaint.location}</p>
    <p><strong>Status:</strong> ${complaint.status}</p>
    <p><strong>Assigned Team:</strong> ${complaint.assigned_team || 'Unassigned'}</p>
    ${fileImage}
    ${afterPhotoImage}
    <p><strong>Team Notes:</strong> ${complaint.team_notes || 'N/A'}</p>
  `;

  // Update team select and assign button state
  const teamSelect = document.getElementById('teamSelect');
  const assignBtn = document.getElementById('assignBtn');
  
  if (teamSelect && assignBtn) {
    teamSelect.value = complaint.assigned_team || '';
    
    // Disable assign button if already assigned
    if (complaint.assigned_team) {
      assignBtn.disabled = true;
      assignBtn.textContent = 'Already Assigned';
      assignBtn.style.backgroundColor = '#6b7280';
      assignBtn.style.cursor = 'not-allowed';
    } else {
      assignBtn.disabled = false;
      assignBtn.textContent = 'Assign';
      assignBtn.style.backgroundColor = '';
      assignBtn.style.cursor = 'pointer';
    }
  }

  modal.classList.remove('hidden');
}

// admin Assign team 
async function assignTeam() {
  const team = document.getElementById('teamSelect').value;
  const assignBtn = document.getElementById('assignBtn');
  
  if (!team) return alert('Select a team first.');

  // Prevent double assignment
  if (assignBtn.disabled) {
    return alert('This complaint is already assigned to a team.');
  }

  try {
    const res = await fetch(`/api/complaints/${selectedComplaintId}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        assigned_team: team,
        status: 'in-progress' // Auto-update status when assigned
      })
    });
    const data = await res.json();
    if (data.success) {
      alert('Team assigned successfully!');
      
      // Update local data
      const complaintIndex = complaintsData.findIndex(c => c.id === selectedComplaintId);
      if (complaintIndex !== -1) {
        complaintsData[complaintIndex].assigned_team = team;
        complaintsData[complaintIndex].status = 'in-progress';
      }
      
      closeModal();
      renderComplaintCards(complaintsData);
      updateAdminAnalytics(complaintsData);
    }
  } catch (err) {
    alert('Failed to assign: ' + err.message);
  }
}

// Mark complaint as resolved
async function markResolved() {
  try {
    const res = await fetch(`/api/complaints/${selectedComplaintId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'resolved' })
    });
    const data = await res.json();
    if (data.success) {
      alert('Complaint marked as resolved!');
      
      // Update local data
      const complaintIndex = complaintsData.findIndex(c => c.id === selectedComplaintId);
      if (complaintIndex !== -1) {
        complaintsData[complaintIndex].status = 'resolved';
      }
      
      closeModal();
      renderComplaintCards(complaintsData);
      updateAdminAnalytics(complaintsData);
    }
  } catch (err) {
    alert('Error updating status.');
  }
}

function closeModal() {
  document.getElementById('complaintModal').classList.add('hidden');
  
  // Reset assign button state when modal closes
  const assignBtn = document.getElementById('assignBtn');
  if (assignBtn) {
    assignBtn.disabled = false;
    assignBtn.textContent = 'Assign';
    assignBtn.style.backgroundColor = '';
    assignBtn.style.cursor = 'pointer';
  }
}

// Update analytics
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadAdminDashboard();

  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('assignBtn').addEventListener('click', assignTeam);
  document.getElementById('markResolvedBtn').addEventListener('click', markResolved);

  // Filters (keeping your original event listeners as backup)
  document.getElementById('statusFilter').addEventListener('change', (e) => {
    const filter = e.target.value;
    const filtered = filter ? complaintsData.filter(c => c.status === filter) : complaintsData;
    renderComplaintCards(filtered);
  });

  document.getElementById('tableSearch').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = complaintsData.filter(c =>
      c.description?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q)
    );
    renderComplaintCards(filtered);
  });
});