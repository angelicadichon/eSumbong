import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, "frontend");

app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

const users = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "user", password: "user123", role: "user" },
];

let complaints = [];

// 🟢 LOGIN
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username && u.password === password);
  if (user) {
    res.json({ success: true, role: user.role });
  } else {
    res.json({ success: false, message: "Invalid credentials." });
  }
});

// 🟢 COMPLAINT SUBMISSION
app.post("/api/submit-complaint", upload.single("attachment"), (req, res) => {
  const { name, contact, category, description, location } = req.body;

  const complaint = {
    id: Date.now(),
    trackingNumber: "ES-" + Math.floor(100000 + Math.random() * 900000),
    name: name || "Anonymous",
    contact,
    category,
    description,
    location,
    attachment: req.file ? `/uploads/${req.file.filename}` : null,
    status: "Pending",
    date: new Date().toISOString(),
  };

  complaints.push(complaint);

  res.json({
    success: true,
    message: "Complaint submitted successfully!",
    trackingNumber: complaint.trackingNumber,
  });
});

// 🟢 ADMIN: FETCH COMPLAINTS
app.get("/api/complaints", (req, res) => {
  res.json(complaints);
});

// 🟢 FALLBACK TO FRONTEND
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
