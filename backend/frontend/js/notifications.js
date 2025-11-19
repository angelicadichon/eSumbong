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

// INIT
document.addEventListener("DOMContentLoaded", () => {
  loadNotifications();
  setupRealtime();
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

  renderList(active);
  updateBadge(data.notifications);
}

function renderList(notifs) {
  const reviewedList = document.getElementById("reviewedList");
  const resolvedList = document.getElementById("resolvedList");

  reviewedList.innerHTML = "";
  resolvedList.innerHTML = "";

  if (!notifs.length) {
    reviewedList.innerHTML = `<li class="notif-item visible">No notifications yet.</li>`;
    resolvedList.innerHTML = `<li class="notif-item visible">No notifications yet.</li>`;
    return;
  }

  // newest first
  notifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  notifs.forEach((n, i) => {
    const li = document.createElement("li");
    li.className = `notif-item ${n.status === "unread" ? "unread" : ""}`;

    li.innerHTML = `
      <div class="notif-text">• ${escapeHtml(n.message)}</div>
      <div class="notif-right">
        <span class="notif-date">${n.created_at.split("T")[0]}</span>
        <button class="notif-delete" data-id="${n.id}">Delete</button>
      </div>
    `;

    li.querySelector(".notif-delete").addEventListener("click", () => {
      deleteNotification(n.id);
    });

    const msg = n.message.toLowerCase();

    // ---- FIXED LOGIC ----
    if (
      msg.includes("resolved") ||
      msg.includes("completed") ||
      msg.includes("fixed") ||
      msg.includes("done") ||
      msg.includes("finished")
    ) {
      resolvedList.appendChild(li);
    } else {
      reviewedList.appendChild(li);
    }

    setTimeout(() => li.classList.add("visible"), 40 * i);
  });
}



async function deleteNotification(id) {
  const res = await fetch("/api/notifications/delete", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, username })
  });

  const data = await res.json();
  if (data.success) loadNotifications();
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
        loadNotifications();
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