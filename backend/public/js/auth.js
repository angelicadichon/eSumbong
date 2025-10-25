// ===== CONFIGURATION =====
const backendURL = ""; // Leave empty if frontend & backend are served together (Render)
                        // Otherwise, set e.g. "https://esumbong.onrender.com"

// ===== REGISTER HANDLER =====
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("regUsername").value.trim();
    const password = document.getElementById("regPassword").value.trim();

    const response = await fetch(`${backendURL}/api/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    const message = document.getElementById("registerMessage");

    if (response.ok) {
      message.textContent = "✅ " + data.message;
      message.style.color = "green";
      setTimeout(() => (window.location.href = "login.html"), 1500);
    } else {
      message.textContent = "❌ " + data.error;
      message.style.color = "red";
    }
  });
}

// ===== LOGIN HANDLER =====
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    const response = await fetch(`${backendURL}/api/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    const message = document.getElementById("loginMessage");

    if (response.ok) {
      message.textContent = "✅ " + data.message;
      message.style.color = "green";

      // You can store user info in localStorage if needed later
      localStorage.setItem("username", username);

      // Redirect to dashboard
      setTimeout(() => (window.location.href = "dashboard.html"), 1000);
    } else {
      message.textContent = "❌ " + data.error;
      message.style.color = "red";
    }
  });
}
