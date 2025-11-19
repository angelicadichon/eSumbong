lucide.createIcons();

// ADMIN USERNAME FIXED
const username = "admin";

// Supabase realtime client
const realtime = supabase.createClient(
    "https://iyyusjkkdpkklyhjuofn.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml5eXVzamtrZHBra2x5aGp1b2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MzgyOTgsImV4cCI6MjA3NzIxNDI5OH0.PcsYavAti6YpZN2yqpIrEC9N2-FBBqPcexazFpJxpnI"
);

// INIT
document.addEventListener("DOMContentLoaded", () => {
  loadAdminNotifications();
  setupAdminRealtime();
});

// LOAD NOTIFICATIONS
async function loadAdminNotifications() {
  const res = await fetch(`/api/notifications?username=${username}`);
  const data = await res.json();

  const active = data.notifications.filter(n => n.status !== "deleted");
  renderAdminList(active);
}

// RENDER LIST
function renderAdminList(notifs) {
  const pendingList = document.getElementById("pendingList");
  const resolvedList = document.getElementById("resolvedList");

  pendingList.innerHTML = "";
  resolvedList.innerHTML = "";

  if (!notifs.length) {
    pendingList.innerHTML = `<li class="notif-item">No notifications yet.</li>`;
    resolvedList.innerHTML = `<li class="notif-item">No notifications yet.</li>`;
    return;
  }

  // Sort newest first
  notifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  notifs.forEach(n => {
    const li = document.createElement("li");
    li.className = `notif-item ${n.status === "unread" ? "unread" : ""}`;

    li.innerHTML = `
      <div class="notif-text">• ${escapeHtml(n.message)}</div>
      <div class="notif-right">
        <span class="notif-date">${n.created_at.split("T")[0]}</span>
        <button class="notif-delete" onclick="deleteAdminNotif(${n.id})">Delete</button>
      </div>
    `;

    const msg = n.message.toLowerCase();

    if (
  msg.includes("resolved") ||
  msg.includes("has been resolved") ||
  msg.includes("maintenance on") ||
  msg.includes("resolved on")
) {
  resolvedList.appendChild(li);
  return;
}


    // PENDING / ASSIGNED / NEW
    else if (
      msg.includes("pending") ||
      msg.includes("review") ||
      msg.includes("assigned") ||
      msg.includes("new complaint")
    ) {
      pendingList.appendChild(li);
    }

    // DEFAULT → pending
    else {
      pendingList.appendChild(li);
    }
  });
}

// DELETE NOTIFICATION
async function deleteAdminNotif(id) {
  const res = await fetch("/api/notifications/delete", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, username })
  });

  const data = await res.json();
  if (data.success) loadAdminNotifications();
}

// REALTIME LISTENER
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
        loadAdminNotifications();
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

function logout() {
    window.location.href = 'index.html';
}
