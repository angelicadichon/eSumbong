import express from "express";
import cors from "cors";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;

// Directory setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
const frontendPath = path.join(__dirname, "frontend");
app.use(express.static(frontendPath));

// === Multer for file uploads ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// === Predefined users ===
const users = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "user", password: "user123", role: "user" },
];

// === Login Route ===
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    res.json({ success: true, role: user.role });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// === Complaint submission ===
app.post("/api/complaints", upload.single("file"), (req, res) => {
  const complaint = {
    name: req.body.name,
    contact: req.body.contact,
    category: req.body.category,
    description: req.body.description,
    location: req.body.location,
    file: req.file ? req.file.filename : null,
    refNumber: "REF-" + Date.now(),
  };

  console.log("Complaint received:", complaint);
  res.json({
    success: true,
    message: "Complaint submitted successfully!",
    reference: complaint.refNumber,
  });
});

// === Catch-all route for SPA ===
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});


// Start server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
