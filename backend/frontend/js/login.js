const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

// Handle login form submission
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  // Basic validation
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

    // Handle non-JSON or server errors gracefully
    if (!res.ok) {
      showMessage("Server error. Please try again.", "error");
      return;
    }

    const data = await res.json();

    if (data.success) {
      showMessage("Login successful! Redirecting...", "success");

      setTimeout(() => {
        if (data.role === "admin") {
          window.location.href = "admin-dashboard.html";
        } else if (data.role === "maintenance") {
          window.location.href = "maintenance-dashboard.html";
        } else if (data.role === "sk") {
          window.location.href = "sk-dashboard.html";
        } else if (data.role === "response") {
          window.location.href = "response-dashboard.html";
        } else {
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

// Function to show messages with proper styling
function showMessage(text, type = 'info') {
  message.textContent = text;
  message.className = ''; // Clear previous classes
  message.classList.add(type);
  
  
  const iconName = {
    'success': 'check-circle',
    'error': 'alert-circle', 
    'info': 'info',
    'warning': 'alert-triangle'
  }[type] || 'info';
  
  // Update icon if using the with-icon version
  if (message.classList.contains('with-icon')) {
    const iconEl = message.querySelector('.message-icon');
    const contentEl = message.querySelector('.message-content');
    if (iconEl && contentEl) {
      iconEl.setAttribute('data-lucide', iconName);
      contentEl.textContent = text;
      lucide.createIcons();
    }
  }
  
}