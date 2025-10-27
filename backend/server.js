import express from "express";
import cors from "cors";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;

// Fix __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Connect to SQLite
const dbPromise = open({
  filename: path.join(__dirname, "eSumbong.db"),
  driver: sqlite3.Database,
});

// --- API Routes ---

// Register Route
// Login Route
app.post("/login", async (req, res) => {
  const db = await dbPromise;
  const { username, password } = req.body;

  try {
    const user = await db.get(
      "SELECT * FROM users WHERE username = ? AND password = ?",
      [username, password]
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // If admin, redirect to admin dashboard
    if (user.role === "admin") {
      return res.json({
        message: "Admin login successful!",
        redirect: "/admin.html",
      });
    }

    // Otherwise, redirect to user dashboard
    return res.json({
      message: "Login successful!",
      redirect: "/dashboard.html",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

// --- Start Server ---
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
