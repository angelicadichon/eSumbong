import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
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
app.use(express.static(path.join(__dirname, 'public'))); 

// 3. Mount the API router
// All authentication API calls go to /api/auth/...
app.use('/api/auth', authRouter); 

// 4. Frontend Routes (Serving the View HTML files)

// Root route redirects to Register
app.get('/', (req, res) => {
    res.redirect('/register');
});

// Register Page Route (Handles the frontend path)
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'register.html'));
});

// Login Page Route (Handles the '/login' link in register.html)
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'login.html'));
});

// Dashboard Page Route (Successful login redirect target)
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'dashboard.html'));
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});