import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import authRouter from './routes/authRoutes.js';
import { initializeDatabase } from './models/User.js';

const __filename = fileURLToPath(import.meta.url);
// Since app.js is in /backend, __dirname is the absolute path to /backend
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
// FIX: Look directly inside __dirname (/backend) for the 'public' folder
app.use(express.static(path.join(__dirname, 'public'))); 

// 3. Mount the API router
app.use('/api/auth', authRouter); 

// 4. Frontend Routes (Serving the View HTML files)

// Root route redirects to Register
app.get('/', (req, res) => {
    res.redirect('/register');
});

// Register Page Route
app.get('/register', (req, res) => {
    // FIX: Look directly inside __dirname (/backend) for the 'view' folder
    res.sendFile(path.join(__dirname, 'view', 'register.html'));
});

// Login Page Route
app.get('/login', (req, res) => {
    // FIX: Look directly inside __dirname
    res.sendFile(path.join(__dirname, 'view', 'login.html'));
});

// Dashboard Page Route
app.get('/dashboard', (req, res) => {
    // FIX: Look directly inside __dirname
    res.sendFile(path.join(__dirname, 'view', 'dashboard.html'));
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
