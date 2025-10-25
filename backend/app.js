// app.js
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import userRoutes from "./routes/authRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());

app.use("/api/users", userRoutes);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "dashboard.html"));
});


app.use((req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});
app.get("*", (req, res) => {
  // If the request is for an API route, return 404 (or let API handler respond)
  if (req.path.startsWith("/api")) {
    return res.status(404).send("Not Found");
  }

  // If the path looks like a static file (has an extension), send 404 instead of index.html
  if (path.extname(req.path)) {
    return res.status(404).send("Not Found");
  }

  // Otherwise serve the main view (single-page routing / normal view)
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));