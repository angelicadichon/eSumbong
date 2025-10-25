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
    const message = document.getElementById("registerMessage");

    try {
      const response = await fetch(`${backendURL}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        message.textContent = "✅ " + data.message;
        message.style.color = "green";
        // Redirect to login route (root) after success
        setTimeout(() => (window.location.href = "/"), 1500);
      } else {
        message.textContent = "❌ " + (data.error || data.message || "Registration failed");
        message.style.color = "red";
      }
    } catch (err) {
      message.textContent = "❌ Network error. Please try again.";
      message.style.color = "red";
      console.error("Register error:", err);
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
    const message = document.getElementById("loginMessage");

    try {
      const response = await fetch(`${backendURL}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        message.textContent = "✅ " + data.message;
        message.style.color = "green";

        // Store user info if needed
        localStorage.setItem("username", username);

        // Redirect to the dashboard route (handled by app.get('/dashboard'))
        setTimeout(() => (window.location.href = "/dashboard"), 1000);
      } else {
        message.textContent = "❌ " + (data.error || data.message || "Login failed");
        message.style.color = "red";
      }
    } catch (err) {
      message.textContent = "❌ Network error. Please try again.";
      message.style.color = "red";
      console.error("Login error:", err);
    }
  });
}