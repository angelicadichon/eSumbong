async function loadComplaints() {
    const res = await fetch("/api/complaints");
    const data = await res.json();
  
    const tbody = document.querySelector("#complaintsTable tbody");
    tbody.innerHTML = "";
  
    data.forEach((c) => {
      const row = `
        <tr>
          <td>${c.trackingNumber}</td>
          <td>${c.name}</td>
          <td>${c.category}</td>
          <td>${c.description}</td>
          <td>${c.status}</td>
          <td>${new Date(c.date).toLocaleString()}</td>
        </tr>`;
      tbody.innerHTML += row;
    });
  }
  
  function logout() {
    window.location.href = "index.html";
  }
  
  loadComplaints();
  