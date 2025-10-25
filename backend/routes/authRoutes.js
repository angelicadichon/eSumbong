import express from 'express';
import path from 'path'; // Needed for serving static files
import { fileURLToPath } from 'url';
import authRouter from './routes/authroute.js'; // Adjust the path as necessary

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // To parse JSON bodies (for API requests)
app.use(express.urlencoded({ extended: true })); // To parse form data (if needed)

app.use(express.static(path.join(__dirname, 'public'))); 

app.use('/api/auth', authRouter); 

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'view', 'login.html'));
});

app.get('/dashboard', (req, res) => {
    
    res.sendFile(path.join(__dirname, 'view', 'dashboard.html'));
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});