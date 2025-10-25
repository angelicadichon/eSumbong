import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
// Assuming routes is also inside backend: ./routes/authRoutes.js
import authRouter from './routes/authRoutes.js'; 
import { initializeDatabase } from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database before starting the server
initializeDatabase().catch(err => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
});

// 1. Middleware
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

// 2. Serve static files (CSS, frontend JS, etc.)
// FIX: Go up one level (..) to find the 'public' folder
app.use(express.static(path.join(__dirname, '..', 'public'))); 

// 3. Mount the API router (No change needed if authRoutes is inside backend)
app.use('/api/auth', authRouter); 

// 4. Frontend Routes (Serving the View HTML files)

// Root route redirects to Register
app.get('/', (req, res) => {
    res.redirect('/register');
});

// Register Page Route
app.get('/register', (req, res) => {
    // FIX: Go up one level (..) to find the 'view' folder
    res.sendFile(path.join(__dirname, '..', 'view', 'register.html'));
});

// Login Page Route
app.get('/login', (req, res) => {
    // FIX: Go up one level (..) to find the 'view' folder
    res.sendFile(path.join(__dirname, '..', 'view', 'login.html'));
});

// Dashboard Page Route
app.get('/dashboard', (req, res) => {
    // FIX: Go up one level (..) to find the 'view' folder
    res.sendFile(path.join(__dirname, '..', 'view', 'dashboard.html'));
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});