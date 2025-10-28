const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

// Handle login form submission
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  // Basic validation
  if (!username || !password) {
    message.style.color = "red";
    message.textContent = "⚠️ Please fill in both fields.";
    return;
  }

  message.style.color = "#555";
  message.textContent = "⏳ Validating...";

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    // Handle non-JSON or server errors gracefully
    if (!res.ok) {
      message.style.color = "red";
      message.textContent = "⚠️ Server error. Please try again.";
      return;
    }

    const data = await res.json();

    if (data.success) {
      message.style.color = "green";
      message.textContent = "✅ Login successful! Redirecting...";

      setTimeout(() => {
        if (data.role === "admin") {
          window.location.href = "admin-dashboard.html";
        } else {
          window.location.href = "user-dashboard.html";
        }
      }, 1200);
    } else {
      message.style.color = "red";
      message.textContent = data.message || "❌ Invalid username or password.";
    }
  } catch (error) {
    message.style.color = "red";
    message.textContent = "⚠️ Connection error. Please check your network.";
    console.error("Login error:", error);
  }
});

// Password visibility toggle
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    togglePassword.setAttribute("data-lucide", isHidden ? "eye-off" : "eye");
    lucide.createIcons(); // refresh icon
  });
}
