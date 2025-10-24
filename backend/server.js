// backend/server.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { openDb } from "./database.js"; // or your database logic

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve frontend (static files)
app.use(express.static(path.join(__dirname, "../frontend")));

// Example endpoints
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const db = await openDb();
  await db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password]);
  res.json({ message: "User registered successfully!" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const db = await openDb();
  const user = await db.get("SELECT * FROM users WHERE username=? AND password=?", [username, password]);
  
  if (user) {
    res.json({ message: "Login successful!" });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// Redirect to frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server running on port ${PORT}`);
});
