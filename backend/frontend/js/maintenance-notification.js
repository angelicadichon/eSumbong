lucide.createIcons();
const API_BASE = "http://localhost:5200";

const supabaseClient = supabase.createClient(
    "https://iyyusjkkdpkklyhjuofn.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5eXVzamtrZHBra2x5aGp1b2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzgyOTgsImV4cCI6MjA3NzIxNDI5OH0.PcsYavAti6YpZN2yqpIrEC9N2-FBBqPcexazFpJxpnI"
);

// PAGINATION VARIABLES - ADDED
const ITEMS_PER_PAGE = 6;
let currentPage = 1;
let allNotifications = [];
let totalPages = 1;

// INIT
document.addEventListener("DOMContentLoaded", () => {
    loadMaintenanceNotifications();
    setupRealtime();
    setupPaginationListeners(); // ADDED
});

async function loadMaintenanceNotifications(isRealtime = false) {
    const res = await fetch(`/api/notifications?username=maintenance`);
    const data = await res.json();

    const notifList = document.getElementById("notifList");
    notifList.innerHTML = "";

    allNotifications = data.notifications.filter(n => n.status !== "deleted");
    
    // Sort newest first
    allNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // Calculate total pages
    totalPages = Math.ceil(allNotifications.length / ITEMS_PER_PAGE);
    
    // Get current page items
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageNotifications = allNotifications.slice(startIndex, endIndex);

    if (pageNotifications.length === 0) {
        notifList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="bell-off" style="width: 48px; height: 48px; color: #9ca3af;"></i>
                <h3>No notifications yet</h3>
                <p>You'll see assigned tasks here when they become available.</p>
            </div>
        `;
        lucide.createIcons();
    } else {
        pageNotifications.forEach(n => renderCard(n, notifList, isRealtime));
        lucide.createIcons();
    }
    
    // Update pagination controls - ADDED
    updatePaginationControls();
}

function renderCard(n, container, isRealtime) {
    const div = document.createElement("div");
    div.className = "notif-card";
    if (isRealtime) div.classList.add("highlight");

    div.innerHTML = `
        <div class="notif-header">
            <i data-lucide="bell"></i>
            <span class="notif-category"><b>Notification</b></span>
        </div>

        <p class="notif-msg">${n.message}</p>

        <div class="notif-footer">
            <span>${new Date(n.created_at).toLocaleString()}</span>

            <button class="delete-btn" onclick="deleteNotif(${n.id})">
                 Delete
            </button>
        </div>
    `;

    container.appendChild(div);
}

async function deleteNotif(id) {
    const confirmed = confirm("Are you sure you want to delete this notification?");
    if (!confirmed) return;
    
    const username = localStorage.getItem("username");

    const res = await fetch("/api/notifications/delete", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, username })
    });

    const data = await res.json();
    console.log("Delete response:", data);

    if (data.success) {
        // Remove from local array
        allNotifications = allNotifications.filter(n => n.id !== id);
        
        // Adjust page if needed
        const newTotalPages = Math.ceil(allNotifications.length / ITEMS_PER_PAGE);
        if (currentPage > newTotalPages && newTotalPages > 0) {
            currentPage = newTotalPages;
        }
        
        loadMaintenanceNotifications();
    } else {
        alert("Delete failed: " + data.message);
    }
}

// SETUP PAGINATION EVENT LISTENERS - ADDED
function setupPaginationListeners() {
    const prevBtn = document.getElementById('paginationPrevBtn');
    const nextBtn = document.getElementById('paginationNextBtn');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                loadMaintenanceNotifications();
            }
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                loadMaintenanceNotifications();
            }
        });
    }
}

// UPDATE PAGINATION CONTROLS - ADDED
function updatePaginationControls() {
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('paginationPrevBtn');
    const nextBtn = document.getElementById('paginationNextBtn');
    const paginationContainer = document.getElementById('paginationContainer');
    
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    }
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    }
    
    // Hide pagination if only one page
    if (paginationContainer) {
        paginationContainer.style.display = totalPages <= 1 ? 'none' : 'flex';
    }
}

// DELETE ALL NOTIFICATIONS FUNCTION - ADDED
async function deleteAllNotifications() {
    if (allNotifications.length === 0) {
        alert("There are no notifications to delete.");
        return;
    }
    
    const confirmed = confirm(`Are you sure you want to delete all ${allNotifications.length} notifications? This action cannot be undone.`);
    if (!confirmed) return;
    
    const username = localStorage.getItem("username");
    
    // Delete all notifications
    const deletePromises = allNotifications.map(n => 
        fetch("/api/notifications/delete", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: n.id, username })
        })
    );
    
    await Promise.all(deletePromises);
    
    // Clear local array and reset pagination
    allNotifications = [];
    currentPage = 1;
    
    loadMaintenanceNotifications();
}

// SETUP DELETE ALL BUTTON - ADDED
function setupDeleteAllButton() {
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', deleteAllNotifications);
    }
}

// Call setupDeleteAllButton in DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
    loadMaintenanceNotifications();
    setupRealtime();
    setupPaginationListeners();
    setupDeleteAllButton(); // ADDED
});

function logout() {
    const confirmed = window.confirm("Are you sure you want to logout?");
    
    if (confirmed) {
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        
        window.location.href = 'index.html';
    }
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

function redirectToProfile() {
    window.location.href = "m-profile.html";
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

// Helper function to get user initials - ADDED
function getUserInitials(name) {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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

// REALTIME FUNCTION - UPDATED
function setupRealtime() {
    supabaseClient
        .channel("maintenance-notifications")
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "notifications",
                filter: "username=eq.maintenance"
            },
            (payload) => {
                // Show popup notification
                showPopup(payload.new.message);
                
                // Add to local array and reset to page 1
                allNotifications.unshift(payload.new);
                currentPage = 1; // Reset to first page to show newest
                
                loadMaintenanceNotifications(true);
            }
        )
        .subscribe();
}

// POPUP NOTIFICATION FUNCTION - ADDED
function showPopup(message) {
    const box = document.createElement("div");
    box.className = "live-popup";
    box.innerHTML = `<i data-lucide="bell"></i> ${escapeHtml(message)}`;
    document.body.appendChild(box);
    lucide.createIcons();

    setTimeout(() => box.classList.add("show"), 20);
    setTimeout(() => {
        box.classList.remove("show");
        setTimeout(() => box.remove(), 300);
    }, 3000);
}

// ESCAPE HTML FUNCTION - ADDED
function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
        }[c];
    });
}