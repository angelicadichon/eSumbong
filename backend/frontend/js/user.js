const form = document.getElementById("complaintForm");
const responseMsg = document.getElementById("response");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const res = await fetch("/api/submit-complaint", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (data.success) {
    responseMsg.style.color = "green";
    responseMsg.textContent = `✅ ${data.message} Tracking #: ${data.trackingNumber}`;
    form.reset();
  } else {
    responseMsg.style.color = "red";
    responseMsg.textContent = "❌ Failed to submit complaint.";
  }
});

function logout() {
  window.location.href = "index.html";
}
