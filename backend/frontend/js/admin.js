// --- Admin Dashboard (Card Version) ---

let complaintsData = [];
let selectedComplaintId = null;

// Load complaints and render as cards
async function loadAdminDashboard() {
  try {
    const res = await fetch('/api/complaints');
    const result = await res.json();

    if (result.success) {
      complaintsData = result.complaints;
      renderComplaintCards(complaintsData);
      updateAdminAnalytics(complaintsData);
    } else {
      document.getElementById('complaintsContainer').innerHTML =
        `<p class="loading-text">Failed to load complaints.</p>`;
    }
  } catch (err) {
    console.error('Error loading complaints:', err);
  }
}

// Render complaint cards
function renderComplaintCards(complaints) {
  const container = document.getElementById('complaintsContainer');
  if (!container) return;

  if (complaints.length === 0) {
    container.innerHTML = `<p class="loading-text">No complaints found.</p>`;
    return;
  }

  container.innerHTML = complaints.map(c => `
    <div class="complaint-card" onclick="openComplaintModal(${c.id})">
      <span class="status-badge ${c.status}">${c.status}</span>
      <h3>${c.category}</h3>
      <p><strong>Ref #:</strong> ${c.id}</p>
      <p><strong>Submitted By:</strong> ${c.name || 'N/A'}</p>
      <p><strong>Date:</strong> ${new Date(c.created_at).toLocaleDateString()}</p>
      <p><strong>Location:</strong> ${c.location || 'N/A'}</p>
      <p>${c.description?.slice(0, 60) || ''}...</p>
    </div>
  `).join('');
}

// Open modal with full complaint details
function openComplaintModal(id) {
  selectedComplaintId = id;
  const complaint = complaintsData.find(c => c.id === id);
  const modal = document.getElementById('complaintModal');
  const details = document.getElementById('modalDetails');

  if (!complaint) return;

  details.innerHTML = `
    <p><strong>Reference #:</strong> ${complaint.id}</p>
    <p><strong>Category:</strong> ${complaint.category}</p>
    <p><strong>Description:</strong> ${complaint.description}</p>
    <p><strong>Submitted By:</strong> ${complaint.name}</p>
    <p><strong>Contact:</strong> ${complaint.contact || 'N/A'}</p>
    <p><strong>Location:</strong> ${complaint.location}</p>
    <p><strong>Status:</strong> ${complaint.status}</p>
    <p><strong>Assigned Team:</strong> ${complaint.assigned_team || 'Unassigned'}</p>
  `;

  modal.classList.remove('hidden');
}

// Assign team
async function assignTeam() {
  const team = document.getElementById('teamSelect').value;
  if (!team) return alert('Select a team first.');

  try {
    const res = await fetch(`/api/complaints/${selectedComplaintId}/assign`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_team: team })
    });
    const data = await res.json();
    if (data.success) {
      alert('Team assigned successfully!');
      closeModal();
      loadAdminDashboard();
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
      closeModal();
      loadAdminDashboard();
    }
  } catch (err) {
    alert('Error updating status.');
  }
}

function closeModal() {
  document.getElementById('complaintModal').classList.add('hidden');
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

  // Filters
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
