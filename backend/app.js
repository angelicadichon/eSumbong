// app.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import userRoutes from "./routes/authRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);

// Serve frontend
app.use(express.static(path.join(__dirname, "frontend")));
app.get("/*", (req, res) =>
  res.sendFile(path.join(__dirname, "frontend", "index.html"))
);

// Start server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
