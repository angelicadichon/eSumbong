document.addEventListener("DOMContentLoaded", () => {
    const reportsList = document.getElementById("reportsList");
    const sectionTitle = document.getElementById("sectionTitle");
    const tabButtons = document.querySelectorAll(".tab-btn");
  
    // Example dummy data (replace later with DB fetch)
    const reports = [
      { id: 1, category: "Sanitation", reporter: "Juan Dela Cruz", status: "pending", description: "Overflowing garbage near the plaza." },
      { id: 2, category: "Infrastructure", reporter: "Maria Santos", status: "in-progress", description: "Broken street light near Barangay Hall." },
      { id: 3, category: "Safety", reporter: "Jose Lopez", status: "resolved", description: "Speeding vehicles near the school zone." }
    ];
  
    function renderReports(status) {
      sectionTitle.textContent =
        status === "pending" ? "🕓 Pending Reports" :
        status === "in-progress" ? "⚙️ In Progress Reports" :
        "✅ Resolved Reports";
  
      const filtered = reports.filter(r => r.status === status);
      reportsList.innerHTML = filtered.map(r => `
        <div class="report-card">
          <h3>${r.category}</h3>
          <p><strong>Reporter:</strong> ${r.reporter}</p>
          <p>${r.description}</p>
          <div class="report-actions">
            ${r.status !== "in-progress" ? `<button class="in-progress">Mark In Progress</button>` : ""}
            ${r.status !== "resolved" ? `<button class="resolved">Mark Resolved</button>` : ""}
            <button class="message">Send Message</button>
          </div>
        </div>
      `).join("");
    }
  
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderReports(btn.dataset.status);
      });
    });
  
    // Default view
    renderReports("pending");
  
    // Logout
    document.getElementById("logoutButton").addEventListener("click", () => {
      window.location.href = "login.html";
    });
  });
  