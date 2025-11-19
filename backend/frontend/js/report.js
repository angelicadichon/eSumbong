let complaintsData = [];
let selectedComplaintId = null;

let currentPage = 1;
const itemsPerPage = 9;

let filteredComplaintsData = [];

function handleSearch(query) {
  const q = query.trim().toLowerCase();
  filteredComplaintsData = complaintsData.filter(c =>
    c.description?.toLowerCase().includes(q) ||
    c.category?.toLowerCase().includes(q) ||
    c.location?.toLowerCase().includes(q) ||
    c.name?.toLowerCase().includes(q)
  );
  currentPage = 1;
  renderComplaintCards(filteredComplaintsData);
}

// Filter function
function handleStatusFilter(status) {
  filteredComplaintsData = status ? complaintsData.filter(c => c.status === status) : [...complaintsData];
  currentPage = 1;
  renderComplaintCards(filteredComplaintsData);
}

function applySearchAndFilter(searchQuery, statusFilter) {
  let filtered = [...complaintsData];
  
  // Apply status filter first
  if (statusFilter) {
    filtered = filtered.filter(c => c.status === statusFilter);
  }
  
  // Apply search filter
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    filtered = filtered.filter(c =>
      c.description?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q) ||
      c.name?.toLowerCase().includes(q)
    );
  }
  
  filteredComplaintsData = filtered;
  currentPage = 1;
  renderComplaintCards(filteredComplaintsData);
}

function setupSearchAndFilterListeners() {
  const searchInput = document.getElementById('tableSearch');
  const statusFilter = document.getElementById('statusFilter');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const searchQuery = e.target.value;
      const statusFilterValue = document.getElementById('statusFilter').value;
      applySearchAndFilter(searchQuery, statusFilterValue);
    });
  }

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
      filteredComplaintsData = [...complaintsData];
      renderComplaintCards(filteredComplaintsData);
      updateAdminAnalytics(complaintsData);
      setupSearchAndFilterListeners();
    } else {
      document.getElementById('complaintsContainer').innerHTML =
        `<p class="loading-text">Failed to load complaints.</p>`;
    }
  } catch (err) {
    console.error('Error loading complaints:', err);
    document.getElementById('complaintsContainer').innerHTML =
      `<p class="loading-text">Error loading complaints. Please try again.</p>`;
  }
}

// Get current page items
function getCurrentPageItems(complaints) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return complaints.slice(startIndex, endIndex);
}

// Render pagination controls
function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  if (totalPages <= 1) {
    return '';
  }
  
  let paginationHTML = `
    <div class="pagination">
      <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
              onclick="changePage(${currentPage - 1})" 
              ${currentPage === 1 ? 'disabled' : ''}>
        Previous
      </button>
  `;
  
  // Show page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      paginationHTML += `
        <button class="pagination-btn ${currentPage === i ? 'active' : ''}" 
                onclick="changePage(${i})">
          ${i}
        </button>
      `;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      paginationHTML += `<span class="pagination-ellipsis">...</span>`;
    }
  }
  
  paginationHTML += `
      <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
              onclick="changePage(${currentPage + 1})" 
              ${currentPage === totalPages ? 'disabled' : ''}>
        Next
      </button>
    </div>
  `;
  
  return paginationHTML;
}

// Change page function
function changePage(page) {
  const totalPages = Math.ceil(filteredComplaintsData.length / itemsPerPage);
  if (page < 1 || page > totalPages) return;
  
  currentPage = page;
  renderComplaintCards(filteredComplaintsData);
}

// Generate star rating display
function generateStarRating(rating) {
  if (!rating || rating === 0) return '';
  
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars += '★';
    } else {
      stars += '☆';
    }
  }
  return `<div class="star-rating">${stars} <span class="rating-text">${rating}/5</span></div>`;
}

// Render complaint cards with pagination
function renderComplaintCards(complaints) {
  const container = document.getElementById('complaintsContainer');
  if (!container) return;

  if (complaints.length === 0) {
    container.innerHTML = `<p class="loading-text">No complaints found.</p>`;
    return;
  }

  // Get current page items
  const currentPageItems = getCurrentPageItems(complaints);
  
  // Render complaint cards
  const complaintsHTML = currentPageItems.map(c => `
    <div class="complaint-card ${c.status}" onclick="openComplaintModal(${c.id})">
      <span class="status-badge ${c.status}">${c.status}</span>
      <h3>${c.category}</h3>
      <p><strong>Submitted By:</strong> ${c.name || 'N/A'}</p>
      <p><strong>Date:</strong> ${new Date(c.created_at).toLocaleDateString()}</p>
      <p><strong>Location:</strong> ${c.location || 'N/A'}</p>
      <p>${c.description?.slice(0, 60) || ''}...</p>
      ${c.rating ? generateStarRating(c.rating) : ''}
    </div>
  `).join('');

  // Render pagination
  const paginationHTML = renderPagination(complaints.length);
  
  // Combine complaints and pagination
  container.innerHTML = complaintsHTML + paginationHTML;
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

  // Generate star rating for modal
  const starRatingHTML = complaint.rating ? 
    `<p><strong>User Rating:</strong> ${generateStarRating(complaint.rating)}</p>` : 
    '<p><strong>User Rating:</strong> Not rated yet</p>';
    
  const feedbackMessage = complaint.feedback_message ? `
    <p><strong>User Feedback:</strong> ${complaint.feedback_message}</p>
  ` : '';

  details.innerHTML = `
    <p><strong>Category:</strong> ${complaint.category}</p>
    <p><strong>Description:</strong> ${complaint.description}</p>
    <p><strong>Submitted By:</strong> ${complaint.name}</p>
    <p><strong>Contact:</strong> ${complaint.contact || 'N/A'}</p>
    <p><strong>Location:</strong> ${complaint.location}</p>
    <p><strong>Status:</strong> ${complaint.status}</p>
    <p><strong>Assigned Team:</strong> ${complaint.assigned_team || 'Unassigned'}</p>
    ${starRatingHTML}
    ${feedbackMessage}
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
        status: 'in-progress'
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
      
      // Also update filtered data if it exists there
      const filteredIndex = filteredComplaintsData.findIndex(c => c.id === selectedComplaintId);
      if (filteredIndex !== -1) {
        filteredComplaintsData[filteredIndex].assigned_team = team;
        filteredComplaintsData[filteredIndex].status = 'in-progress';
      }
      
      closeModal();
      renderComplaintCards(filteredComplaintsData);
      updateAdminAnalytics(complaintsData);
    }
  } catch (err) {
    alert('Failed to assign: ' + err.message);
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

  // Make sure these elements exist in your HTML
  const totalEl = document.getElementById('totalReports');
  const pendingEl = document.getElementById('pendingReports');
  const progressEl = document.getElementById('progressReports');
  const resolvedEl = document.getElementById('resolvedReports');
  
  if (totalEl) totalEl.textContent = total;
  if (pendingEl) pendingEl.textContent = pending;
  if (progressEl) progressEl.textContent = inProgress;
  if (resolvedEl) resolvedEl.textContent = resolved;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadAdminDashboard();

  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('assignBtn').addEventListener('click', assignTeam);

  // Close modal when clicking outside
  const modal = document.getElementById('complaintModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });
  }
});