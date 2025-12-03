lucide.createIcons();

const API_BASE = "http://localhost:5200";

// Supabase Client (for realtime)
const realtime = supabase.createClient(
  "https://iyyusjkkdpkklyhjuofn.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5eXVzamtrZHBra2x5aGp1b2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzgyOTgsImV4cCI6MjA3NzIxNDI5OH0.PcsYavAti6YpZN2yqpIrEC9N2-FBBqPcexazFpJxpnI"
);

// USER
let username = localStorage.getItem("username");
if (!username) window.location.href = "index.html";

// PAGINATION VARIABLES
const ITEMS_PER_PAGE = 4;
let pendingCurrentPage = 1;
let resolvedCurrentPage = 1;
let pendingNotifications = [];
let resolvedNotifications = [];

// INIT
document.addEventListener("DOMContentLoaded", () => {
  loadNotifications();
  setupRealtime();
  setupPaginationListeners();
  setupDeleteAllButton();
});

// Bell click → Mark read
document.getElementById("notifLink").addEventListener("click", async (e) => {
  if (!window.location.pathname.includes("notifications.html")) {
    e.preventDefault();
    await markAsRead();
    document.getElementById("notifBadge").style.display = "none";
    window.location.href = "notifications.html";
  }
});

/* --------------------------------------------------------
   LOAD NOTIFICATIONS
--------------------------------------------------------- */
async function loadNotifications() {
  const res = await fetch(`/api/notifications?username=${username}`);
  const data = await res.json();

  const active = data.notifications.filter(n => n.status !== "deleted");

  // Separate notifications into pending and resolved
  separateNotifications(active);
  
  // Render both lists with pagination
  renderPendingListWithPagination();
  renderResolvedListWithPagination();
  
  // Update pagination controls
  updatePaginationControls();
  
  updateBadge(data.notifications);
}

// SEPARATE NOTIFICATIONS INTO PENDING AND RESOLVED
function separateNotifications(notifs) {
  pendingNotifications = [];
  resolvedNotifications = [];
  
  if (!notifs.length) return;
  
  // Sort newest first
  notifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  notifs.forEach(n => {
    const msg = n.message.toLowerCase();

    // Fixed logic for resolved notifications - now includes more keywords
    if (
      msg.includes("resolved") ||
      msg.includes("has been resolved") ||
      msg.includes("completed") ||
      msg.includes("fixed") ||
      msg.includes("done") ||
      msg.includes("finished") ||
      msg.includes("maintenance on") ||
      msg.includes("resolved on") ||
      msg.includes("issue resolved")
    ) {
      resolvedNotifications.push(n);
    } else {
      // Everything else goes to pending
      pendingNotifications.push(n);
    }
  });
}

// RENDER PENDING LIST WITH PAGINATION
function renderPendingListWithPagination() {
  const reviewedList = document.getElementById("reviewedList");
  reviewedList.innerHTML = "";

  if (!pendingNotifications.length) {
    reviewedList.innerHTML = `<li class="notif-item visible">No pending notifications yet.</li>`;
    return;
  }

  // Calculate pagination - 6 items per page
  const startIndex = (pendingCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageItems = pendingNotifications.slice(startIndex, endIndex);

  pageItems.forEach((n, i) => {
    const li = document.createElement("li");
    li.className = `notif-item ${n.status === "unread" ? "unread" : ""}`;

    li.innerHTML = `
      <div class="notif-text">• ${escapeHtml(n.message)}</div>
      <div class="notif-right">
        <span class="notif-date">${n.created_at.split("T")[0]}</span>
        <button class="notif-delete" data-id="${n.id}">Delete</button>
      </div>
    `;

    // Add delete confirmation
    li.querySelector(".notif-delete").addEventListener("click", (e) => {
      e.stopPropagation();
      showDeleteConfirmation(n.id);
    });

    reviewedList.appendChild(li);
    setTimeout(() => li.classList.add("visible"), 40 * i);
  });
}

// RENDER RESOLVED LIST WITH PAGINATION
function renderResolvedListWithPagination() {
  const resolvedList = document.getElementById("resolvedList");
  resolvedList.innerHTML = "";

  if (!resolvedNotifications.length) {
    resolvedList.innerHTML = `<li class="notif-item visible">No resolved notifications yet.</li>`;
    return;
  }

  // Calculate pagination - 6 items per page
  const startIndex = (resolvedCurrentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageItems = resolvedNotifications.slice(startIndex, endIndex);

  pageItems.forEach((n, i) => {
    const li = document.createElement("li");
    li.className = `notif-item ${n.status === "unread" ? "unread" : ""}`;

    li.innerHTML = `
      <div class="notif-text">• ${escapeHtml(n.message)}</div>
      <div class="notif-right">
        <span class="notif-date">${n.created_at.split("T")[0]}</span>
        <button class="notif-delete" data-id="${n.id}">Delete</button>
      </div>
    `;

    // Add delete confirmation
    li.querySelector(".notif-delete").addEventListener("click", (e) => {
      e.stopPropagation();
      showDeleteConfirmation(n.id);
    });

    resolvedList.appendChild(li);
    setTimeout(() => li.classList.add("visible"), 40 * i);
  });
}

// SETUP PAGINATION EVENT LISTENERS
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

// UPDATE PAGINATION CONTROLS
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

// DELETE NOTIFICATION WITH CONFIRMATION
async function deleteNotification(id) {
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
    
    // Re-render
    renderPendingListWithPagination();
    renderResolvedListWithPagination();
    updatePaginationControls();
  }
}

// SHOW DELETE CONFIRMATION
function showDeleteConfirmation(id) {
  const confirmed = confirm("Are you sure you want to delete this notification?");
  if (confirmed) {
    deleteNotification(id);
  }
}

// SETUP DELETE ALL BUTTON
function setupDeleteAllButton() {
  const deleteAllBtn = document.getElementById('deleteAllBtn');
  if (deleteAllBtn) {
    deleteAllBtn.addEventListener('click', () => {
      showDeleteAllConfirmation();
    });
  }
}

// DELETE ALL NOTIFICATIONS WITH CONFIRMATION
async function deleteAllNotifications() {
  // Delete all pending notifications
  const deletePromises = pendingNotifications.map(n => 
    fetch("/api/notifications/delete", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: n.id, username })
    })
  );

  // Also delete resolved notifications
  resolvedNotifications.forEach(n => {
    deletePromises.push(
      fetch("/api/notifications/delete", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id, username })
      })
    );
  });

  await Promise.all(deletePromises);
  
  // Clear local arrays
  pendingNotifications = [];
  resolvedNotifications = [];
  
  // Reset pagination
  pendingCurrentPage = 1;
  resolvedCurrentPage = 1;
  
  // Re-render
  renderPendingListWithPagination();
  renderResolvedListWithPagination();
  updatePaginationControls();
}

// SHOW DELETE ALL CONFIRMATION
function showDeleteAllConfirmation() {
  const totalCount = pendingNotifications.length + resolvedNotifications.length;
  if (totalCount === 0) {
    alert("There are no notifications to delete.");
    return;
  }

  const confirmed = confirm(`Are you sure you want to delete all ${totalCount} notifications? This action cannot be undone.`);
  if (confirmed) {
    deleteAllNotifications();
  }
}

function updateBadge(all) {
  const unread = all.filter(n => n.status === "unread").length;
  const badge = document.getElementById("notifBadge");

  if (unread > 0) {
    badge.textContent = unread;
    badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }
}

async function markAsRead() {
  await fetch("/api/notifications/mark-read", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
}

function setupRealtime() {
  realtime
    .channel("notif-channel")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `username=eq.${username}`,
      },
      (payload) => {
        showPopup(payload.new.message);
        
        // Add new notification to appropriate list
        const msg = payload.new.message.toLowerCase();
        if (
          msg.includes("resolved") ||
          msg.includes("has been resolved") ||
          msg.includes("completed") ||
          msg.includes("fixed") ||
          msg.includes("done") ||
          msg.includes("finished") ||
          msg.includes("maintenance on") ||
          msg.includes("resolved on") ||
          msg.includes("issue resolved")
        ) {
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
        updateBadge([...pendingNotifications, ...resolvedNotifications]);
      }
    )
    .subscribe();
}

/* --------------------------------------------------------
   POPUP TOAST
--------------------------------------------------------- */
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

/* --------------------------------------------------------
   CLEAN HTML
--------------------------------------------------------- */
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