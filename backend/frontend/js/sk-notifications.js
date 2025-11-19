lucide.createIcons();
const API_BASE = "http://localhost:5200";

const supabaseClient = supabase.createClient(
    "https://iyyusjkkdpkklyhjuofn.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5eXVzamtrZHBra2x5aGp1b2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzgyOTgsImV4cCI6MjA3NzIxNDI5OH0.PcsYavAti6YpZN2yqpIrEC9N2-FBBqPcexazFpJxpnI"
);
document.addEventListener("DOMContentLoaded", () => {
    loadSKNotifications();
    setupRealtime();
});

async function loadSKNotifications(isRealtime = false) {
    const res = await fetch(`/api/notifications?username=sk`);
    const data = await res.json();

    const notifList = document.getElementById("notifList");
    notifList.innerHTML = "";

    const activeNotifs = data.notifications.filter(n => n.status !== "deleted");

    activeNotifs.forEach(n => renderCard(n, notifList, isRealtime));

    lucide.createIcons();
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
    const username = localStorage.getItem("username");

    const res = await fetch("/api/notifications/delete", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, username })
    });

    const data = await res.json();
    console.log("Delete response:", data);

    if (data.success) {
        loadSKNotifications();
    } else {
        alert("Delete failed: " + data.message);
    }
}


function logout() {
    window.location.href = "index.html";
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
    window.location.href = "sk-profile.html";
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

// Logout function
function logout() {
    window.location.href = 'index.html';
}