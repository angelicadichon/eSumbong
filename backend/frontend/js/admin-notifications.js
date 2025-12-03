lucide.createIcons();

// ADMIN USERNAME FIXED
const username = "admin";

// Supabase realtime client
const realtime = supabase.createClient(
    "https://iyyusjkkdpkklyhjuofn.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5eXVzamtrZHBra2x5aGp1b2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzgyOTgsImV4cCI6MjA3NzIxNDI5OH0.PcsYavAti6YpZN2yqpIrEC9N2-FBBqPcexazFpJxpnI"
);

// PAGINATION VARIABLES - ADDED
const ITEMS_PER_PAGE = 6;
let pendingCurrentPage = 1;
let resolvedCurrentPage = 1;
let pendingNotifications = [];
let resolvedNotifications = [];

// INIT
document.addEventListener("DOMContentLoaded", () => {
  loadAdminNotifications();
  setupAdminRealtime();
  // ADD PAGINATION EVENT LISTENERS
  setupPaginationListeners();
});

// LOAD NOTIFICATIONS
async function loadAdminNotifications() {
  const res = await fetch(`/api/notifications?username=${username}`);
  const data = await res.json();

  const active = data.notifications.filter(n => n.status !== "deleted");
  
  // SEPARATE NOTIFICATIONS INTO PENDING AND RESOLVED - ADDED
  separateNotifications(active);
  
  // RENDER LISTS WITH PAGINATION - UPDATED
  renderPendingListWithPagination();
  renderResolvedListWithPagination();
  
  // UPDATE PAGINATION CONTROLS - ADDED
  updatePaginationControls();
}

// SEPARATE NOTIFICATIONS FUNCTION - ADDED
function separateNotifications(notifs) {
  pendingNotifications = [];
  resolvedNotifications = [];
  
  if (!notifs.length) return;
  
  // Sort newest first
  notifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  notifs.forEach(n => {
    const msg = n.message.toLowerCase();

    if (
      msg.includes("resolved") ||
      msg.includes("has been resolved") ||
      msg.includes("maintenance on") ||
      msg.includes("resolved on")
    ) {
      resolvedNotifications.push(n);
    } else {
      // PENDING / ASSIGNED / NEW or DEFAULT → pending
      pendingNotifications.push(n);
    }
  });
}

// RENDER PENDING LIST WITH PAGINATION - ADDED
function renderPendingListWithPagination() {
  const pendingList = document.getElementById("pendingList");
  pendingList.innerHTML = "";

  if (!pendingNotifications.length) {
    pendingList.innerHTML = `<li class="notif-item">No notifications yet.</li>`;
    return;
  }

  // Calculate pagination - 6 items per page
  const startIndex = (pendingCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageItems = pendingNotifications.slice(startIndex, endIndex);

  pageItems.forEach(n => {
    const li = document.createElement("li");
    li.className = `notif-item ${n.status === "unread" ? "unread" : ""}`;

    li.innerHTML = `
      <div class="notif-text">• ${escapeHtml(n.message)}</div>
      <div class="notif-right">
        <span class="notif-date">${n.created_at.split("T")[0]}</span>
        <button class="notif-delete" onclick="deleteAdminNotif(${n.id})">Delete</button>
      </div>
    `;

    pendingList.appendChild(li);
  });
}

// RENDER RESOLVED LIST WITH PAGINATION - ADDED
function renderResolvedListWithPagination() {
  const resolvedList = document.getElementById("resolvedList");
  resolvedList.innerHTML = "";

  if (!resolvedNotifications.length) {
    resolvedList.innerHTML = `<li class="notif-item">No notifications yet.</li>`;
    return;
  }

  // Calculate pagination - 6 items per page
  const startIndex = (resolvedCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageItems = resolvedNotifications.slice(startIndex, endIndex);

  pageItems.forEach(n => {
    const li = document.createElement("li");
    li.className = `notif-item ${n.status === "unread" ? "unread" : ""}`;

    li.innerHTML = `
      <div class="notif-text">• ${escapeHtml(n.message)}</div>
      <div class="notif-right">
        <span class="notif-date">${n.created_at.split("T")[0]}</span>
        <button class="notif-delete" onclick="deleteAdminNotif(${n.id})">Delete</button>
      </div>
    `;

    resolvedList.appendChild(li);
  });
}

// SETUP PAGINATION EVENT LISTENERS - ADDED
function setupPaginationListeners() {
  // Pending pagination
  const pendingPrevBtn = document.getElementById('pendingPrevBtn');
  const pendingNextBtn = document.getElementById('pendingNextBtn');
  const resolvedPrevBtn = document.getElementById('resolvedPrevBtn');
  const resolvedNextBtn = document.getElementById('resolvedNextBtn');

  if (pendingPrevBtn) {
    pendingPrevBtn.addEventListener('click', () => {
      if (pendingCurrentPage > 1) {
        pendingCurrentPage--;
        renderPendingListWithPagination();
        updatePaginationControls();
      }
    });
  }

  if (pendingNextBtn) {
    pendingNextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(pendingNotifications.length / ITEMS_PER_PAGE);
      if (pendingCurrentPage < totalPages) {
        pendingCurrentPage++;
        renderPendingListWithPagination();
        updatePaginationControls();
      }
    });
  }

  // Resolved pagination
  if (resolvedPrevBtn) {
    resolvedPrevBtn.addEventListener('click', () => {
      if (resolvedCurrentPage > 1) {
        resolvedCurrentPage--;
        renderResolvedListWithPagination();
        updatePaginationControls();
      }
    });
  }

  if (resolvedNextBtn) {
    resolvedNextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(resolvedNotifications.length / ITEMS_PER_PAGE);
      if (resolvedCurrentPage < totalPages) {
        resolvedCurrentPage++;
        renderResolvedListWithPagination();
        updatePaginationControls();
      }
    });
  }
}

// UPDATE PAGINATION CONTROLS - ADDED
function updatePaginationControls() {
  // Pending controls
  const pendingTotalPages = Math.ceil(pendingNotifications.length / ITEMS_PER_PAGE);
  const pendingPageInfo = document.getElementById('pendingPageInfo');
  const pendingPrevBtn = document.getElementById('pendingPrevBtn');
  const pendingNextBtn = document.getElementById('pendingNextBtn');
  const pendingPagination = document.getElementById('pendingPagination');

  if (pendingPageInfo) {
    pendingPageInfo.textContent = `Page ${pendingCurrentPage} of ${pendingTotalPages || 1}`;
  }
  
  if (pendingPrevBtn) {
    pendingPrevBtn.disabled = pendingCurrentPage === 1;
  }
  
  if (pendingNextBtn) {
    pendingNextBtn.disabled = pendingCurrentPage === pendingTotalPages || pendingTotalPages === 0;
  }
  
  if (pendingPagination) {
    pendingPagination.style.display = pendingTotalPages <= 1 ? 'none' : 'flex';
  }

  // Resolved controls
  const resolvedTotalPages = Math.ceil(resolvedNotifications.length / ITEMS_PER_PAGE);
  const resolvedPageInfo = document.getElementById('resolvedPageInfo');
  const resolvedPrevBtn = document.getElementById('resolvedPrevBtn');
  const resolvedNextBtn = document.getElementById('resolvedNextBtn');
  const resolvedPagination = document.getElementById('resolvedPagination');

  if (resolvedPageInfo) {
    resolvedPageInfo.textContent = `Page ${resolvedCurrentPage} of ${resolvedTotalPages || 1}`;
  }
  
  if (resolvedPrevBtn) {
    resolvedPrevBtn.disabled = resolvedCurrentPage === 1;
  }
  
  if (resolvedNextBtn) {
    resolvedNextBtn.disabled = resolvedCurrentPage === resolvedTotalPages || resolvedTotalPages === 0;
  }
  
  if (resolvedPagination) {
    resolvedPagination.style.display = resolvedTotalPages <= 1 ? 'none' : 'flex';
  }
}

// DELETE NOTIFICATION - UPDATED
async function deleteAdminNotif(id) {
  const res = await fetch("/api/notifications/delete", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, username })
  });

  const data = await res.json();
  if (data.success) {
    // Remove from local arrays
    pendingNotifications = pendingNotifications.filter(n => n.id !== id);
    resolvedNotifications = resolvedNotifications.filter(n => n.id !== id);
    
    // Adjust page numbers if needed
    const pendingTotalPages = Math.ceil(pendingNotifications.length / ITEMS_PER_PAGE);
    if (pendingCurrentPage > pendingTotalPages && pendingTotalPages > 0) {
      pendingCurrentPage = pendingTotalPages;
    }
    
    const resolvedTotalPages = Math.ceil(resolvedNotifications.length / ITEMS_PER_PAGE);
    if (resolvedCurrentPage > resolvedTotalPages && resolvedTotalPages > 0) {
      resolvedCurrentPage = resolvedTotalPages;
    }
    
    // Re-render lists with pagination
    renderPendingListWithPagination();
    renderResolvedListWithPagination();
    updatePaginationControls();
  }
}

// REALTIME LISTENER - UPDATED
function setupAdminRealtime() {
  realtime
    .channel("admin-notif-realtime")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: "username=eq.'admin'"
      },
      (payload) => {
        showAdminPopup(payload.new.message);
        
        // Add new notification to appropriate list
        const msg = payload.new.message.toLowerCase();
        if (msg.includes("resolved") || msg.includes("has been resolved") || 
            msg.includes("maintenance on") || msg.includes("resolved on")) {
          resolvedNotifications.unshift(payload.new);
          resolvedCurrentPage = 1; // Reset to first page to show newest
        } else {
          pendingNotifications.unshift(payload.new);
          pendingCurrentPage = 1; // Reset to first page to show newest
        }
        
        // Update lists with pagination
        renderPendingListWithPagination();
        renderResolvedListWithPagination();
        updatePaginationControls();
      }
    )
    .subscribe();
}

// POPUP
function showAdminPopup(message) {
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

// SANITIZE MESSAGE
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

// ORIGINAL RENDER FUNCTION (KEPT BUT NOT USED WITH PAGINATION)
function renderAdminList(notifs) {
  // This function is kept for compatibility but pagination uses new functions
  // You can remove this if not needed elsewhere
}

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