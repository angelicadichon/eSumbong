// ===== CONFIGURATION =====
const backendURL = ""; // Leave empty if frontend & backend are served together (Render)
// Otherwise, set e.g. "https://esumbong.onrender.com"

// ===== REGISTER HANDLER =====
// Get the form and message elements from the HTML
const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');

// Event listener for form submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent the default form submission

    // Clear previous messages
    registerMessage.textContent = '';
    registerMessage.classList.remove('success', 'error');

    // Get input values (Note: your HTML has 'username', but your backend API uses 'name' and 'email'.
    // I'm using the 'username' from your HTML for the 'name' field in the API request, and will
    // assume the user is also expected to enter an 'email' for the registration to work with your API)
    const usernameInput = document.getElementById('regUsername');
    const passwordInput = document.getElementById('regPassword');
    
    // *** IMPORTANT: Your backend API requires 'name', 'email', and 'password'.
    // Your HTML only provides 'username' and 'password'.
    // To make this work, I'll assume 'username' is the 'name' for the API, 
    // AND that we need to add an 'email' input to the HTML or use a dummy email for testing. 
    // I'll add a temporary placeholder for email here. You should update your HTML.
    
    const name = usernameInput.value.trim();
    const password = passwordInput.value;
    
    // --- TEMPORARY WORKAROUND ---
    // Since your HTML lacks an 'email' input, I'll construct an email from the username 
    // for this example. YOU MUST ADD AN EMAIL FIELD TO YOUR HTML for production use.
    const email = `${name.toLowerCase().replace(/\s/g, '')}@esumbong.com`; 
    // --- END WORKAROUND ---

    if (!name || !password) {
        registerMessage.textContent = 'Please fill out all fields.';
        registerMessage.classList.add('error');
        return;
    }

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // The body must match the structure expected by your backend 'register' function: { name, email, password }
            body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
            // Success response (HTTP 200)
            registerMessage.textContent = data.message || 'Registration successful!';
            registerMessage.classList.add('success');
            // Optionally redirect user after a short delay:
            // setTimeout(() => { window.location.href = '/login'; }, 2000);
            
            // Clear the form fields on successful registration
            usernameInput.value = '';
            passwordInput.value = '';
            
        } else {
            // Error response (HTTP 400 or other error status)
            registerMessage.textContent = data.message || 'Registration failed. Please try again.';
            registerMessage.classList.add('error');
        }

    } catch (error) {
        // Network or other unexpected error
        console.error('Registration error:', error);
        registerMessage.textContent = 'A network error occurred. Please try again later.';
        registerMessage.classList.add('error');
    }
});

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