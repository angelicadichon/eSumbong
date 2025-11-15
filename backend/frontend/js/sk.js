// Initialize Supabase client
const supabaseUrl = 'https://iyyusjkkdpkklyhjuofn.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5eXVzamtrZHBra2x5aGp1b2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzgyOTgsImV4cCI6MjA3NzIxNDI5OH0.PcsYavAti6YpZN2yqpIrEC9N2-FBBqPcexazFpJxpnI'; 
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let selectedComplaintId = null;

document.addEventListener("DOMContentLoaded", () => {
  loadAssignedComplaints();

  // Modal event listeners
  document.getElementById("closeModal").addEventListener("click", closeUpdateModal);
  document.getElementById("closeModalBtn").addEventListener("click", closeUpdateModal);
  document.getElementById("updateForm").addEventListener("submit", handleUpdateSubmit);

  document.getElementById("closeViewModal").addEventListener("click", closeViewModal);
  document.getElementById("closeViewModalBtn").addEventListener("click", closeViewModal);

  // Close modals when clicking outside
  document.getElementById("updateModal").addEventListener("click", (e) => {
    if (e.target.id === "updateModal") closeUpdateModal();
  });

  document.getElementById("viewModal").addEventListener("click", (e) => {
    if (e.target.id === "viewModal") closeViewModal();
  });

  document.getElementById("tableSearch").addEventListener("input", e => filterCards(e.target.value));
});

async function loadAssignedComplaints() {
  try {
    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('assigned_team', 'sk')
      .order('created_at', { ascending: false });

    if (error) throw error;

    populateCards(complaints || []);
  } catch (err) {
    console.error("Error:", err);
    document.getElementById("complaintsGrid").innerHTML = `<div class="error-text">❌ ${err.message}</div>`;
  }
}

function populateCards(complaints) {
  const grid = document.getElementById("complaintsGrid");

  if (!complaints.length) {
    grid.innerHTML = `<div class="no-complaints">No assigned complaints</div>`;
    return;
  }

  grid.innerHTML = complaints.map(complaint => {
    const hasUpdate = complaint.team_notes || complaint.after_photo;
    const clickHandler = hasUpdate ? `viewComplaint(${complaint.id})` : `openUpdateModal(${complaint.id})`;
    const clickText = hasUpdate ? 'View Details' : 'Click to update';
    
    return `
    <div class="complaint-card ${hasUpdate ? 'completed' : ''}" onclick="${clickHandler}" data-complaint-id="${complaint.id}">
      <div class="card-header">
        <span class="status ${complaint.status}">${complaint.status}</span>
      </div>
      <div class="card-body">
        <h4 class="category">${complaint.category}</h4>
        <p class="description">${complaint.description}</p>
        <div class="location">
          <i data-lucide="map-pin"></i>
          <span>${complaint.location}</span>
        </div>
        ${complaint.file ? `
          <div class="file-preview-indicator">
            <i data-lucide="paperclip"></i>
            <span>Original file attached</span>
          </div>
        ` : ''}
        ${complaint.after_photo ? `
          <div class="after-photo-preview">
            <i data-lucide="camera"></i>
            <span>After photo uploaded</span>
          </div>
        ` : ''}
        ${complaint.team_notes ? `
          <div class="notes-preview">
            <i data-lucide="message-square"></i>
            <span>Team notes added</span>
          </div>
        ` : ''}
      </div>
      <div class="card-footer">
        <div class="click-hint">${clickText}</div>
      </div>
    </div>
    `;
  }).join("");

  lucide.createIcons();
}

function openUpdateModal(id) {
  selectedComplaintId = id;
  const modal = document.getElementById("updateModal");
  
  // Fetch fresh complaint data to get file details
  fetchComplaintDetails(id).then(complaint => {
    if (complaint) {
      document.getElementById("modalCategory").textContent = complaint.category;
      document.getElementById("modalDescription").textContent = complaint.description;
      document.getElementById("modalLocation").textContent = complaint.location;
      document.getElementById("modalStatus").textContent = complaint.status;
      
      // Display original file
      displayFile(complaint.file, 'modalOriginalFile');
      
      document.getElementById("updateForm").reset();
      modal.classList.add("active");
    }
  });
}

async function viewComplaint(id) {
  try {
    const complaint = await fetchComplaintDetails(id);
    if (!complaint) return;

    const modal = document.getElementById("viewModal");
    
    // Populate complaint details
    document.getElementById("viewCategory").textContent = complaint.category;
    document.getElementById("viewDescription").textContent = complaint.description;
    document.getElementById("viewLocation").textContent = complaint.location;
    document.getElementById("viewStatus").textContent = complaint.status;
    
    displayFile(complaint.file, 'viewOriginalFile');
    
    // Populate update details
    document.getElementById("viewTeamNotes").textContent = complaint.team_notes || 'No team notes provided';
    
    // Display after photo
    displayFile(complaint.after_photo, 'viewAfterPhoto', 'after');
    
    // Show update date
    const updatedDate = complaint.updated_at ? new Date(complaint.updated_at).toLocaleString() : 'Not updated';
    document.getElementById("viewUpdatedAt").textContent = updatedDate;
    
    modal.classList.add("active");
    lucide.createIcons();
  } catch (err) {
    console.error("Error viewing complaint:", err);
    alert("Failed to load complaint details");
  }
}

async function fetchComplaintDetails(id) {
  try {
    const { data: complaint, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return complaint;
  } catch (err) {
    console.error("Error fetching complaint details:", err);
    alert(" Failed to load complaint details");
    return null;
  }
}

function displayFile(fileUrl, containerId, type = 'original') {
  const container = document.getElementById(containerId);
  
  if (!fileUrl) {
    container.innerHTML = type === 'after' ? '<em>No after photo uploaded</em>' : '<em>No file attached</em>';
    return;
  }

  const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(fileUrl);
  const isPDF = /\.pdf$/i.test(fileUrl);
  
  if (isImage) {
    container.innerHTML = `
      <div class="file-display">
        <img src="${fileUrl}" alt="${type === 'after' ? 'After photo' : 'Complaint photo'}" class="file-image">
        <div class="file-actions">
          <a href="${fileUrl}" target="_blank" class="view-full-link">
            <i data-lucide="external-link"></i>
            View full ${type === 'after' ? 'after photo' : 'image'}
          </a>
        </div>
      </div>
    `;
  } else if (isPDF) {
    container.innerHTML = `
      <div class="file-display">
        <div class="pdf-preview">
          <i data-lucide="file-text"></i>
          <span>PDF Document</span>
        </div>
        <div class="file-actions">
          <a href="${fileUrl}" target="_blank" class="view-full-link">
            <i data-lucide="external-link"></i>
            View PDF
          </a>
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="file-display">
        <div class="file-preview">
          <i data-lucide="file"></i>
          <span>Download File</span>
        </div>
        <div class="file-actions">
          <a href="${fileUrl}" target="_blank" class="view-full-link">
            <i data-lucide="download"></i>
            Download File
          </a>
        </div>
      </div>
    `;
  }
  
  // Refresh icons 
  if (container.querySelector('[data-lucide]')) {
    lucide.createIcons();
  }
}

function closeUpdateModal() {
  const modal = document.getElementById("updateModal");
  modal.classList.remove("active");
  selectedComplaintId = null;
}

function closeViewModal() {
  const modal = document.getElementById("viewModal");
  modal.classList.remove("active");
}

async function handleUpdateSubmit(e) {
  e.preventDefault();
  
  if (!selectedComplaintId) {
    alert("No complaint selected!");
    return;
  }

  const teamNotes = document.getElementById("teamNotes").value.trim();
  const afterPhoto = document.getElementById("afterPhoto").files[0];

  if (!teamNotes) {
    alert("Please provide team notes!");
    return;
  }

  let afterPhotoUrl = null;

  try {
    if (afterPhoto) {
      const fileName = `complaint-${selectedComplaintId}-after-${Date.now()}-${afterPhoto.name}`;
      const { data, error } = await supabase.storage
        .from("complaint-files")
        .upload(fileName, afterPhoto, { cacheControl: "3600", upsert: false });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("complaint-files")
        .getPublicUrl(fileName);
      afterPhotoUrl = publicUrlData.publicUrl;
    }

    const { data, error } = await supabase
      .from('complaints')
      .update({
        team_notes: teamNotes,
        after_photo: afterPhotoUrl,
        status: 'resolved',
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedComplaintId);

    if (error) throw error;

    alert("Update saved successfully!");
    closeUpdateModal();
    loadAssignedComplaints();
  } catch (err) {
    console.error("Upload error:", err);
    alert("Error " + err.message);
  }
}

function filterCards(query) {
  const q = query.toLowerCase();
  document.querySelectorAll(".complaint-card").forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(q) ? "block" : "none";
  });
}

function redirectToProfile() {
  window.location.href = 'sk-profile.html';
}

// Function to get user initials from name
function getUserInitials(name) {
  if (!name) return 'U';
  return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
}

// Function to load user profile data for the header
async function loadUserProfile() {
  try {
      // Get username from localStorage (same as in profile page)
      const username = localStorage.getItem('username') || 
                      sessionStorage.getItem('username') || 
                      'admin';
      
      console.log('Loading profile for:', username);
      
      // Fetch user data from the same API endpoint used in profile page
      const response = await fetch(`/api/get-profile?username=${encodeURIComponent(username)}`);
      
      if (response.ok) {
          const userData = await response.json();
          console.log('User data loaded for header:', userData);
          
          if (userData.success) {
              updateProfileCircle(userData);
          } else {
              console.error('API returned error:', userData.message);
              setDefaultProfile();
          }
      } else {
          console.error('HTTP error loading profile:', response.status);
          setDefaultProfile();
      }
  } catch (error) {
      console.error('Error loading user profile for header:', error);
      setDefaultProfile();
  }
}

// Function to update the profile circle with user data
function updateProfileCircle(userData) {
  const profileCircle = document.getElementById('profileCircle');
  const profileInitials = document.getElementById('profileInitials');
  
  if (!profileCircle) return;
  
  // Get display name
  const displayName = userData.full_name || userData.username || 'User';
  
  // Check if user has an avatar
  if (userData.avatar_url) {
      console.log('User has avatar:', userData.avatar_url);
      
      // Create image element
      const profileImg = document.createElement('img');
      profileImg.src = userData.avatar_url;
      profileImg.alt = displayName;
      profileImg.onload = function() {
          console.log('Avatar image loaded successfully');
      };
      profileImg.onerror = function() {
          console.log('Avatar image failed to load, showing initials');
          // If image fails to load, show initials
          showInitialsFallback(displayName);
      };
      
      // Clear existing content and add image
      profileCircle.innerHTML = '';
      profileCircle.appendChild(profileImg);
      profileInitials.style.display = 'none';
      
  } else {
      console.log('No avatar URL, showing initials');
      // No avatar, show initials
      showInitialsFallback(displayName);
  }
}

// Function to show initials as fallback
function showInitialsFallback(displayName) {
  const profileCircle = document.getElementById('profileCircle');
  const profileInitials = document.getElementById('profileInitials');
  
  profileCircle.innerHTML = '';
  profileInitials.textContent = getUserInitials(displayName);
  profileInitials.style.display = 'flex';
  profileCircle.appendChild(profileInitials);
}

// Function to set default profile when data can't be loaded
function setDefaultProfile() {
  const username = localStorage.getItem('username') || 'User';
  showInitialsFallback(username);
}

// Load user profile when page loads
document.addEventListener('DOMContentLoaded', function() {
  loadUserProfile();
  
  // Also set up click event for profile circle
  const profileCircle = document.getElementById('profileCircle');
  if (profileCircle) {
      profileCircle.addEventListener('click', redirectToProfile);
  }
});

// Optional: Add function to refresh profile picture when returning to dashboard
window.addEventListener('focus', function() {
  // Refresh profile data when user returns to this tab
  loadUserProfile();
});

function logout() {
  localStorage.removeItem('auth_token');
  window.location.href = "index.html";
}