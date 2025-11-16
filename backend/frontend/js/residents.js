// residents.js - Handles resident management page

// Global variables
let allResidents = [];
let filteredResidents = [];
let currentPage = 1;
const residentsPerPage = 10;

// DOM Elements
const residentsTableBody = document.getElementById('residentsTableBody');
const loadingState = document.getElementById('loadingState');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const statusFilter = document.getElementById('statusFilter');
const sortBy = document.getElementById('sortBy');
const exportBtn = document.getElementById('exportBtn');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const pageNumbers = document.getElementById('pageNumbers');
const totalResidentsEl = document.getElementById('totalResidents');
const activeResidentsEl = document.getElementById('activeResidents');
const totalReportsEl = document.getElementById('totalReports');
const residentModal = document.getElementById('residentModal');
const modalTitle = document.getElementById('modalTitle');
const modalAvatar = document.getElementById('modalAvatar');
const modalName = document.getElementById('modalName');
const modalUsername = document.getElementById('modalUsername');
const modalEmail = document.getElementById('modalEmail');
const modalPhone = document.getElementById('modalPhone');
const modalAddress = document.getElementById('modalAddress');
const modalJoined = document.getElementById('modalJoined');
const modalReports = document.getElementById('modalReports');
const modalStatus = document.getElementById('modalStatus');
const recentReports = document.getElementById('recentReports');
const closeModal = document.getElementById('closeModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const notification = document.getElementById('notification');

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  fetchResidents();
  setupEventListeners();
});

// Fetch residents from API
async function fetchResidents() {
  showLoading();
  try {
    const response = await fetch('/api/residents');
    const data = await response.json();
    if (data.success) {
      allResidents = data.residents;
      updateSummaryCards();
      applyFiltersAndSearch();
    } else {
      showNotification('Failed to load residents', 'error');
    }
  } catch (error) {
    console.error('Error fetching residents:', error);
    showNotification('Error loading residents', 'error');
  } finally {
    hideLoading();
  }
}

// Update summary cards
function updateSummaryCards() {
  const total = allResidents.length;
  const active = allResidents.filter(r => r.status === 'active').length;
  const totalReports = allResidents.reduce((sum, r) => sum + (r.reportCount || 0), 0);

  totalResidentsEl.textContent = total;
  activeResidentsEl.textContent = active;
  totalReportsEl.textContent = totalReports;
}

// Apply search, filters, and sorting
function applyFiltersAndSearch() {
  const searchTerm = searchInput.value.toLowerCase();
  const status = statusFilter.value;
  const sort = sortBy.value;

  filteredResidents = allResidents.filter(resident => {
    const matchesSearch = resident.full_name.toLowerCase().includes(searchTerm) ||
                          resident.username.toLowerCase().includes(searchTerm);
    const matchesStatus = status === 'all' || resident.status === status;
    return matchesSearch && matchesStatus;
  });

  // Sort
  filteredResidents.sort((a, b) => {
    if (sort === 'name') return a.full_name.localeCompare(b.full_name);
    if (sort === 'recent') return new Date(b.lastActive) - new Date(a.lastActive);
    if (sort === 'reports') return b.reportCount - a.reportCount;
    return 0;
  });

  currentPage = 1;
  renderTable();
}

// Render table with pagination
function renderTable() {
  const start = (currentPage - 1) * residentsPerPage;
  const end = start + residentsPerPage;
  const pageResidents = filteredResidents.slice(start, end);

  residentsTableBody.innerHTML = '';

  if (pageResidents.length === 0) {
    showEmptyState();
    return;
  }

  hideEmptyState();
  pageResidents.forEach(resident => {
    const row = createResidentRow(resident);
    residentsTableBody.appendChild(row);
  });

  updatePagination();
}

// Create a table row for a resident
function createResidentRow(resident) {
  const row = document.createElement('tr');

  const avatarSrc = resident.avatar_url || 'images/default-avatar.png';
  const statusClass = resident.status === 'active' ? 'status-active' : 'status-inactive';
  const lastActive = resident.lastActive ? new Date(resident.lastActive).toLocaleDateString() : 'Never';

  row.innerHTML = `
    <td>
      <div class="resident-info">
        <img src="${avatarSrc}" alt="Avatar" class="resident-avatar">
        <div>
          <div class="resident-name">${resident.full_name || 'Unknown'}</div>
          <div class="resident-username">@${resident.username}</div>
        </div>
      </div>
    </td>
    <td>
      <div class="contact-info">
        <div>${resident.email || 'No email'}</div>
        <div>${resident.phone || 'No phone'}</div>
      </div>
    </td>
    <td>${resident.address || 'No address'}</td>
    <td><span class="status-badge ${statusClass}">${resident.status || 'inactive'}</span></td>
    <td>${resident.reportCount || 0}</td>
    <td>${lastActive}</td>
    <td>
      <button class="btn btn-sm btn-primary view-btn" data-id="${resident.id}">View</button>
      <button class="btn btn-sm btn-secondary edit-btn" data-id="${resident.id}">Edit</button>
    </td>
  `;

  // Add event listeners for buttons
  row.querySelector('.view-btn').addEventListener('click', () => openModal(resident.id));
  row.querySelector('.edit-btn').addEventListener('click', () => editResident(resident.id));

  return row;
}

// Pagination
function updatePagination() {
  const totalPages = Math.ceil(filteredResidents.length / residentsPerPage);
  pageNumbers.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
    btn.textContent = i;
    btn.addEventListener('click', () => {
      currentPage = i;
      renderTable();
    });
    pageNumbers.appendChild(btn);
  }

  prevPage.disabled = currentPage === 1;
  nextPage.disabled = currentPage === totalPages;
}

// Open resident details modal
async function openModal(residentId) {
  const resident = allResidents.find(r => r.id === residentId);
  if (!resident) return;

  // Populate modal
  modalTitle.textContent = 'Resident Details';
  modalAvatar.src = resident.avatar_url || 'images/default-avatar.png';
  modalName.textContent = resident.full_name || 'Unknown';
  modalUsername.textContent = `@${resident.username}`;
  modalEmail.textContent = resident.email || 'No email';
  modalPhone.textContent = resident.phone || 'No phone';
  modalAddress.textContent = resident.address || 'No address';
  modalJoined.textContent = resident.updated_at ? new Date(resident.updated_at).toLocaleDateString() : 'Unknown';
  modalReports.textContent = resident.reportCount || 0;
  modalStatus.textContent = resident.status || 'inactive';
  modalStatus.className = `status-badge ${resident.status === 'active' ? 'status-active' : 'status-inactive'}`;

  // Fetch and display recent reports
  await fetchRecentReports(resident.username);

  residentModal.classList.add('show');
}

// Fetch recent reports for modal
async function fetchRecentReports(username) {
  try {
    const response = await fetch(`/api/complaints?username=${username}&role=resident`);
    const data = await response.json();
    if (data.success) {
      const reports = data.complaints.slice(0, 5); // Show last 5
      recentReports.innerHTML = reports.length > 0 
        ? reports.map(r => `<div class="report-item">${r.category} - ${new Date(r.created_at).toLocaleDateString()}</div>`).join('')
        : '<p>No recent reports</p>';
    }
  } catch (error) {
    recentReports.innerHTML = '<p>Error loading reports</p>';
  }
}

// Edit resident (placeholder - implement as needed)
function editResident(residentId) {
  // Redirect or open edit form
  showNotification('Edit functionality not implemented yet', 'info');
}

// Setup event listeners
function setupEventListeners() {
  searchInput.addEventListener('input', applyFiltersAndSearch);
  statusFilter.addEventListener('change', applyFiltersAndSearch);
  sortBy.addEventListener('change', applyFiltersAndSearch);
  exportBtn.addEventListener('click', exportResidents);
  prevPage.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });
  nextPage.addEventListener('click', () => { if (currentPage < Math.ceil(filteredResidents.length / residentsPerPage)) { currentPage++; renderTable(); } });
  closeModal.addEventListener('click', () => residentModal.classList.remove('show'));
  closeModalBtn.addEventListener('click', () => residentModal.classList.remove('show'));
}

// Export residents to CSV
function exportResidents() {
  const csv = [
    ['Name', 'Username', 'Email', 'Phone', 'Address', 'Status', 'Reports', 'Last Active'],
    ...filteredResidents.map(r => [
      r.full_name, r.username, r.email, r.phone, r.address, r.status, r.reportCount, r.lastActive
    ])
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'residents.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// Utility functions
function showLoading() { loadingState.classList.remove('hidden'); }
function hideLoading() { loadingState.classList.add('hidden'); }
function showEmptyState() { emptyState.classList.remove('hidden'); }
function hideEmptyState() { emptyState.classList.add('hidden'); }
function showNotification(message, type) {
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.classList.remove('hidden');
  setTimeout(() => notification.classList.add('hidden'), 3000);
}