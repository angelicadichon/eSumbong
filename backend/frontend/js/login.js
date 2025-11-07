const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

// login form submission
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!username || !password) {
    showMessage("Please fill in both fields.", "error");
    return;
  }

  showMessage("Validating credentials...", "info");

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      showMessage("Server error. Please try again.", "error");
      return;
    }

    const data = await res.json();

    if (data.success) {
      showMessage("Login successful! Redirecting...", "success");

      // ✅ Store username and role for later use
      localStorage.setItem("username", username);
      localStorage.setItem("role", data.role);

      console.log("Stored username:", username);

      setTimeout(() => {
        switch (data.role) {
          case "admin":
            window.location.href = "admin-dashboard.html";
            break;
          case "maintenance":
            window.location.href = "maintenance-dashboard.html";
            break;
          case "sk":
            window.location.href = "sk-dashboard.html";
            break;
          case "response":
            window.location.href = "response-dashboard.html";
            break;
          default:
            window.location.href = "user-dashboard.html";
        }
      }, 1200);
    } else {
      showMessage(data.message || "Invalid username or password.", "error");
    }
  } catch (error) {
    showMessage("Connection error. Please check your network.", "error");
    console.error("Login error:", error);
  }
});

// Password visibility toggle
lucide.createIcons();

const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", () => {
    const isHidden = passwordInput.type === "password";
    passwordInput.type = isHidden ? "text" : "password";
    togglePassword.setAttribute("data-lucide", isHidden ? "eye" : "eye-off");
    lucide.createIcons();
  });
}

function showMessage(text, type = "info") {
  message.textContent = text;
  message.className = "";
  message.classList.add(type);

  const iconName = {
    success: "check-circle",
    error: "alert-circle",
    info: "info",
    warning: "alert-triangle",
  }[type] || "info";

  if (message.classList.contains("with-icon")) {
    const iconEl = message.querySelector(".message-icon");
    const contentEl = message.querySelector(".message-content");
    if (iconEl && contentEl) {
      iconEl.setAttribute("data-lucide", iconName);
      contentEl.textContent = text;
      lucide.createIcons();
    }
  }
}
