document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("reportModal");
    const newReportBtn = document.getElementById("newReportBtn");
    const closeModal = document.getElementById("closeModal");
  
    newReportBtn.addEventListener("click", () => modal.classList.remove("hidden"));
    closeModal.addEventListener("click", () => modal.classList.add("hidden"));
  
    // Example of dynamic data later
    const residentName = localStorage.getItem("username") || "Resident";
    document.getElementById("residentName").textContent = residentName;
  
    // Simulate complaints (will later fetch from backend)
    const complaintsList = document.getElementById("complaintsList");
    complaintsList.innerHTML = `
      <tr>
        <td>001</td>
        <td>2025-10-24</td>
        <td>Garbage Collection</td>
        <td><span style="color:orange;">Pending</span></td>
        <td>Officer Dela Cruz</td>
      </tr>
      <tr>
        <td>002</td>
        <td>2025-10-23</td>
        <td>Streetlight Repair</td>
        <td><span style="color:green;">Resolved</span></td>
        <td>Officer Santos</td>
      </tr>
    `;
  });
  