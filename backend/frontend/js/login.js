const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (data.success) {
    message.style.color = "green";
    message.textContent = "Login successful! Redirecting...";

    setTimeout(() => {
      if (data.role === "admin") window.location.href = "admin-dashboard.html";
      else window.location.href = "user-dashboard.html";
    }, 1000);
  } else {
    message.style.color = "red";
    message.textContent = data.message;
  }
});
