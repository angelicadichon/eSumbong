// API configuration
const API_BASE_URL = 'http://localhost:5200/api';

// State management
let residents = [];
let filteredResidents = [];
let currentSearchTerm = '';
let currentStatusFilter = 'all';
let currentSortBy = 'name';

// DOM Elements
let residentsTableBody, loadingState, emptyState;
let searchInput, statusFilter, sortBy;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeDOMElements();
    loadResidents();
    setupEventListeners();
});

// Initialize DOM element references
function initializeDOMElements() {
    residentsTableBody = document.getElementById('residentsTableBody');
    loadingState = document.getElementById('loadingState');
    emptyState = document.getElementById('emptyState');
    searchInput = document.getElementById('searchInput');
    
    createFilterElements();
}

// Create filter elements dynamically
function createFilterElements() {
    const tableContainer = document.querySelector('.table-container');
    if (!tableContainer) return;

    const filtersSection = document.createElement('div');
    filtersSection.className = 'filters-section';
    filtersSection.innerHTML = `
        <div class="filter-group">
            <label for="statusFilter">Status:</label>
            <select id="statusFilter">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
            </select>
        </div>
        <div class="filter-group">
            <label for="sortBy">Sort By:</label>
            <select id="sortBy">
                <option value="name">Name</option>
                <option value="recent">Most Recent</option>
                <option value="reports">Most Reports</option>
            </select>
        </div>
    `;

    const table = tableContainer.querySelector('table');
    tableContainer.insertBefore(filtersSection, table);

    statusFilter = document.getElementById('statusFilter');
    sortBy = document.getElementById('sortBy');
}

// Set up event listeners
function setupEventListeners() {
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', handleFilterChange);
    }
    
    if (sortBy) {
        sortBy.addEventListener('change', handleSortChange);
    }

    setupModalListeners();
}

// Setup modal event listeners
function setupModalListeners() {
    const modal = document.getElementById('residentModal');
    const closeModal = document.getElementById('closeModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const editResidentBtn = document.getElementById('editResidentBtn');

    if (closeModal) closeModal.addEventListener('click', () => closeResidentModal());
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => closeResidentModal());
    if (editResidentBtn) editResidentBtn.addEventListener('click', handleEditResident);

    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) closeResidentModal();
        });
    }
}

// Load residents from API
async function loadResidents() {
    try {
        showLoadingState();
        
        const response = await fetch(`${API_BASE_URL}/residents`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
            residents = data.residents || [];
            applyFiltersAndSort();
            renderResidents();
        } else {
            throw new Error(data.message || 'Failed to load residents');
        }
    } catch (error) {
        console.error('Error loading residents:', error);
        showErrorState('Failed to load residents. Please try again later.');
    }
}

// Apply filters and sorting
function applyFiltersAndSort() {
    filteredResidents = [...residents];

    // Apply status filter
    if (currentStatusFilter !== 'all') {
        filteredResidents = filteredResidents.filter(resident => 
            resident.status === currentStatusFilter
        );
    }

    // Apply search filter
    if (currentSearchTerm) {
        const searchTerm = currentSearchTerm.toLowerCase();
        filteredResidents = filteredResidents.filter(resident => 
            (resident.full_name || '').toLowerCase().includes(searchTerm) ||
            (resident.email || '').toLowerCase().includes(searchTerm) ||
            (resident.phone || '').toLowerCase().includes(searchTerm) ||
            (resident.address || '').toLowerCase().includes(searchTerm) ||
            (resident.username || '').toLowerCase().includes(searchTerm)
        );
    }

    // Apply sorting
    sortResidents();
}

// Sort residents
function sortResidents() {
    switch(currentSortBy) {
        case 'name':
            filteredResidents.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
            break;
        case 'recent':
            filteredResidents.sort((a, b) => new Date(b.last_active || b.updated_at) - new Date(a.last_active || a.updated_at));
            break;
        case 'reports':
            filteredResidents.sort((a, b) => (b.reports_count || 0) - (a.reports_count || 0));
            break;
    }
}

// Render residents to table
function renderResidents() {
    if (!residentsTableBody) return;

    hideLoadingState();

    if (filteredResidents.length === 0) {
        showEmptyState();
        return;
    }

    hideEmptyState();

    residentsTableBody.innerHTML = filteredResidents.map(resident => `
        <tr>
            <td>
                <div class="resident-info">
                    <img src="${resident.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(resident.full_name || 'Resident')}&background=3498db&color=fff`}" 
                         alt="${resident.full_name}" class="resident-avatar">
                    <div>
                        <div class="resident-name">${resident.full_name || 'N/A'}</div>
                        <div class="resident-username">@${resident.username || 'N/A'}</div>
                    </div>
                </div>
            </td>
            <td>
                <div class="contact-info">
                    <div class="contact-email">${resident.email || 'No email'}</div>
                    <div class="contact-phone">${resident.phone || 'No phone'}</div>
                </div>
            </td>
            <td class="address-cell">${resident.address || 'No address'}</td>
            <td>
                <span class="status-badge status-${resident.status || 'active'}">
                    ${(resident.status || 'active').charAt(0).toUpperCase() + (resident.status || 'active').slice(1)}
                </span>
            </td>
            <td class="last-active">${formatDate(resident.last_active || resident.updated_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon view-btn" onclick="viewResident(${resident.id})" title="View Details">
                        <i data-lucide="eye"></i>
                    </button>
                    <button class="btn-icon delete-btn" onclick="deleteResident(${resident.id}, '${resident.full_name}')" title="Delete Resident">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Refresh Lucide icons
    if (window.lucide) lucide.createIcons();
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
        }
    } catch (error) {
        return 'N/A';
    }
}

// Delete resident function
async function deleteResident(id, residentName) {
    const confirmed = confirm(`Are you sure you want to delete resident "${residentName}"? This action cannot be undone and will remove the resident from the entire database.`);
    
    if (!confirmed) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/residents/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();
        
        if (data.success) {
            showNotification('Resident deleted successfully', 'success');
            // Reload residents to reflect the deletion
            loadResidents();
        } else {
            throw new Error(data.message || 'Failed to delete resident');
        }
    } catch (error) {
        console.error('Error deleting resident:', error);
        showNotification('Error deleting resident', 'error');
    }
}

// Event handlers
function handleSearch(event) {
    currentSearchTerm = event.target.value;
    applyFiltersAndSort();
    renderResidents();
}

function handleFilterChange(event) {
    currentStatusFilter = event.target.value;
    applyFiltersAndSort();
    renderResidents();
}

function handleSortChange(event) {
    currentSortBy = event.target.value;
    applyFiltersAndSort();
    renderResidents();
}

// View resident details
async function viewResident(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/residents/${id}`);
        
        if (!response.ok) {
            throw new Error('Failed to fetch resident details');
        }
        
        const data = await response.json();
        
        if (data.success) {
            showResidentModal(data.resident);
        } else {
            throw new Error(data.message || 'Failed to load resident details');
        }
    } catch (error) {
        console.error('Error fetching resident details:', error);
        showNotification('Error loading resident details. Please try again.', 'error');
    }
}

// Show resident modal
function showResidentModal(resident) {
    const modal = document.getElementById('residentModal');
    if (!modal) return;

    // Populate modal with resident data
    document.getElementById('modalName').textContent = resident.full_name || 'N/A';
    document.getElementById('modalUsername').textContent = `@${resident.username || 'N/A'}`;
    document.getElementById('modalEmail').textContent = resident.email || 'No email';
    document.getElementById('modalPhone').textContent = resident.phone || 'No phone';
    document.getElementById('modalAddress').textContent = resident.address || 'No address';
    document.getElementById('modalJoined').textContent = formatDate(resident.created_at);
    document.getElementById('modalReports').textContent = `${resident.reports_count || 0} reports`;

    // Set avatar
    const avatar = document.getElementById('modalAvatar');
    if (avatar) {
        avatar.src = resident.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(resident.full_name || 'Resident')}&background=3498db&color=fff`;
        avatar.alt = resident.full_name || 'Resident';
    }

    // Populate recent reports
    const recentReports = document.getElementById('recentReports');
    if (recentReports) {
        if (resident.recent_complaints && resident.recent_complaints.length > 0) {
            recentReports.innerHTML = resident.recent_complaints.map(complaint => `
                <div class="report-item">
                    <div class="report-category">${complaint.category || 'General'}</div>
                    <div class="report-description">${complaint.description || 'No description'}</div>
                    <div class="report-meta">
                        <span class="report-status status-${complaint.status}">${complaint.status}</span>
                        <span class="report-date">${formatDate(complaint.created_at)}</span>
                    </div>
                </div>
            `).join('');
        } else {
            recentReports.innerHTML = '<p class="no-reports">No recent reports</p>';
        }
    }

    // Set edit button data
    const editBtn = document.getElementById('editResidentBtn');
    if (editBtn) {
        editBtn.setAttribute('data-resident-id', resident.id);
    }

    // Show modal
    modal.style.display = 'block';
    
    // Refresh Lucide icons
    if (window.lucide) {
        lucide.createIcons();
    }
}

// Close resident modal
function closeResidentModal() {
    const modal = document.getElementById('residentModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Handle edit resident
function handleEditResident() {
    const editBtn = document.getElementById('editResidentBtn');
    const residentId = editBtn?.getAttribute('data-resident-id');
    
    if (residentId) {
        editResident(residentId);
    }
}

// Edit resident (opens edit form)
function editResident(id) {
    const resident = residents.find(r => r.id == id);
    if (!resident) {
        showNotification('Resident not found', 'error');
        return;
    }

    // Close modal first
    closeResidentModal();

    // For now, just show a simple edit form
    const newName = prompt('Edit resident name:', resident.full_name);
    if (newName !== null && newName !== resident.full_name) {
        updateResident(id, { full_name: newName });
    }
}

// Update resident information
async function updateResident(id, updateData) {
    try {
        const response = await fetch(`${API_BASE_URL}/residents/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error('Failed to update resident');
        }

        const data = await response.json();
        
        if (data.success) {
            // Reload residents to reflect changes
            loadResidents();
            showNotification('Resident updated successfully', 'success');
        } else {
            throw new Error(data.message || 'Failed to update resident');
        }
    } catch (error) {
        console.error('Error updating resident:', error);
        showNotification('Error updating resident', 'error');
    }
}

// UI state management
function showLoadingState() {
    if (loadingState) loadingState.style.display = 'flex';
    if (emptyState) emptyState.classList.add('hidden');
    if (residentsTableBody) residentsTableBody.innerHTML = '';
}

function hideLoadingState() {
    if (loadingState) loadingState.style.display = 'none';
}

function showEmptyState() {
    if (emptyState) emptyState.classList.remove('hidden');
    if (residentsTableBody) residentsTableBody.innerHTML = '';
}

function hideEmptyState() {
    if (emptyState) emptyState.classList.add('hidden');
}

function showErrorState(message) {
    hideLoadingState();
    if (emptyState) {
        emptyState.innerHTML = `
            <i data-lucide="alert-triangle"></i>
            <h3>Error Loading Residents</h3>
            <p>${message}</p>
        `;
        emptyState.classList.remove('hidden');
        if (window.lucide) lucide.createIcons();
    }
}

// Notification function
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification hidden';
        document.body.appendChild(notification);
        
        // Add CSS for notifications
        const notificationCSS = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 6px;
                color: white;
                font-weight: 500;
                z-index: 1000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
            }
            .notification.success { background-color: #10b981; }
            .notification.error { background-color: #ef4444; }
            .notification.info { background-color: #3b82f6; }
            .notification.warning { background-color: #f59e0b; }
            .notification.hidden { 
                opacity: 0; 
                transform: translateY(-20px);
            }
        `;
        const style = document.createElement('style');
        style.textContent = notificationCSS;
        document.head.appendChild(style);
    }

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.remove('hidden');

    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Make functions global
window.viewResident = viewResident;
window.editResident = editResident;
window.deleteResident = deleteResident;
window.closeResidentModal = closeResidentModal;
window.handleEditResident = handleEditResident;