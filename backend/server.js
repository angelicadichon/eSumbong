import express from "express";
import cors from "cors";
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { fileURLToPath } from "url";

const app = express();
const port = process.env.PORT || 5000;

// Fix __dirname for ES modules
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

// Routes
app.post("/register", async (req, res) => {
  const db = await dbPromise;
  const { username, password } = req.body;

  try {
    await db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [username, password]
    );
    res.json({ message: "Registration successful!" });
  } catch (err) {
    res.status(400).json({ error: "Username already exists!" });
  }
});

app.post("/login", async (req, res) => {
  const db = await dbPromise;
  const { username, password } = req.body;

  const user = await db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password]
  );

  if (user) res.json({ message: "Login successful!" });
  else res.status(401).json({ error: "Invalid username or password" });
});

// 🧠 Serve frontend (important)
app.use(express.static(path.join(__dirname, "../frontend")));

// For any route not handled by the API, return index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// Start server
app.listen(port, () => console.log(`✅ Server running on port ${port}`));
