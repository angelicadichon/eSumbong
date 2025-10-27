import express from "express";
import cors from "cors";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPromise = open({
  filename: path.join(__dirname, "eSumbong.db"),
  driver: sqlite3.Database,
});

// Initialize the database with a user table (if not exists)
(async () => {
  const db = await dbPromise;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);

  // Predefined admin account
  const adminUsername = "admin";
  const adminPassword = "admin123";
  const hashed = await bcrypt.hash(adminPassword, 10);

  const existingAdmin = await db.get(
    "SELECT * FROM users WHERE username = ?",
    [adminUsername]
  );

  if (!existingAdmin) {
    await db.run(
      "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [adminUsername, hashed, "admin"]
    );
    console.log("✅ Admin account created:", adminUsername);
  } else {
    console.log("ℹ️ Admin account already exists.");
  }
})();

// API routes (register, login)
app.post("/api/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const db = await dbPromise;

    const existingUser = await db.get("SELECT * FROM users WHERE username = ?", [username]);
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [
      username,
      hashed,
      role || "user",
    ]);

    res.json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Error registering user:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = await dbPromise;

    const user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    res.json({ message: "Login successful", role: user.role });
  } catch (err) {
    console.error("Error logging in:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Serve frontend files
const frontendPath = path.join(__dirname, "frontend");
app.use(express.static(frontendPath));

app.get("/*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
