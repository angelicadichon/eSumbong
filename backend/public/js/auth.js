// ===== CONFIGURATION (Use the base path) =====
const backendURL = ""; // Empty string for same-origin requests

// ===== REGISTER HANDLER =====
const registerForm = document.getElementById('registerForm');
const registerMessage = document.getElementById('registerMessage');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        registerMessage.textContent = '';
        registerMessage.classList.remove('success', 'error');

        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;

        if (!name || !email || !password) {
            registerMessage.textContent = 'Please fill out all fields.';
            registerMessage.classList.add('error');
            return;
        }

        try {
            const response = await fetch(`${backendURL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                registerMessage.textContent = data.message || 'Registration successful!';
                registerMessage.classList.add('success');
                // Redirect to login page after successful registration
                setTimeout(() => { window.location.href = '/login'; }, 1500);
            } else {
                registerMessage.textContent = data.message || 'Registration failed.';
                registerMessage.classList.add('error');
            }

        } catch (error) {
            console.error('Registration error:', error);
            registerMessage.textContent = 'A network error occurred. Please try again later.';
            registerMessage.classList.add('error');
        }
    });
}

// ===== LOGIN HANDLER =====
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        loginMessage.textContent = '';
        loginMessage.classList.remove('success', 'error');

        // Note: The input IDs are now 'loginEmail' and 'loginPassword'
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        try {
            // Correct API route: /api/auth/login
            const response = await fetch(`${backendURL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                loginMessage.textContent = data.message || "Login successful!";
                loginMessage.classList.add('success');

                // Store the JWT token for authenticated requests
                if (data.token) {
                    localStorage.setItem("authToken", data.token);
                }

                // Redirect to the dashboard ROUTE, which is handled by server.js
                setTimeout(() => (window.location.href = "/dashboard"), 1000); 
            } else {
                loginMessage.textContent = data.message || "Login failed.";
                loginMessage.classList.add('error');
            }
        } catch (err) {
            console.error("Login error:", err);
            loginMessage.textContent = "A network error occurred. Please try again.";
            loginMessage.classList.add('error');
        }
    });
}

// ===== DASHBOARD/AUTH CHECK (Simple Example) =====
// Runs on dashboard.html load
const userNameDisplay = document.getElementById('userNameDisplay');
const logoutButton = document.getElementById('logoutButton');

if (userNameDisplay) {
    // Basic check to ensure the user has a token
    const token = localStorage.getItem("authToken");

    if (!token) {
        // If no token, redirect to login
        alert("You must be logged in to view the dashboard.");
        window.location.href = '/login';
        return;
    }
    
    // Attempt to fetch user data using the token
    fetch(`${backendURL}/api/auth/user`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(res => res.json())
    .then(data => {
        if (data.name) {
            userNameDisplay.textContent = data.name; // Display the user's name
        } else {
            // Token was invalid/expired but present; log out user
            localStorage.removeItem("authToken");
            alert(data.message || "Session expired. Please log in again.");
            window.location.href = '/login';
        }
    })
    .catch(err => {
        console.error("User fetch error:", err);
        userNameDisplay.textContent = "Error fetching user data";
        // Optionally redirect on network error
    });
}

if (logoutButton) {
    logoutButton.addEventListener('click', () => {
        localStorage.removeItem("authToken");
        alert("You have been logged out.");
        window.location.href = '/login';
    });
}