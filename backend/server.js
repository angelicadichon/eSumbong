import express from "express";
import cors from "cors";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { supabase } from "./supabase.js"; // Add this import

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

// === Predefined users (KEEP THIS for now) ===
const users = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "user", password: "user123", role: "user" },
];

// === Login Route (UPDATED) ===
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  
  // First check predefined users (for backward compatibility)
  const predefinedUser = users.find(
    (u) => u.username === username && u.password === password
  );

  if (predefinedUser) {
    res.json({ success: true, role: predefinedUser.role });
    return;
  }

  // If not in predefined users, check Supabase
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !data) {
      res.status(401).json({ success: false, message: "Invalid credentials" });
      return;
    }

    res.json({ success: true, role: data.role });
    
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

// === Complaint submission (UPDATED) ===
// === Complaint submission (UPDATED with better error handling) ===
app.post("/api/complaints", upload.single("file"), async (req, res) => {
  console.log("📨 Received complaint submission request");
  
  try {
      // Validate required fields
      const { name, contact, category, description, location } = req.body;
      
      if (!name || !contact || !category || !description || !location) {
          return res.status(400).json({ 
              success: false, 
              message: "All fields are required" 
          });
      }

      const complaint = {
          name: name,
          contact: contact,
          category: category,
          description: description,
          location: location,
          file: req.file ? req.file.filename : null,
          refNumber: "REF-" + Date.now(),
          created_at: new Date().toISOString(),
          status: 'pending' // Add default status
      };

      console.log("📝 Complaint data:", complaint);

      // Save to Supabase
      const { data, error } = await supabase
          .from('complaints')
          .insert([complaint])
          .select();

      if (error) {
          console.error("❌ Supabase error:", error);
          return res.status(500).json({ 
              success: false, 
              message: "Database error: " + error.message 
          });
      }

      console.log("✅ Complaint saved to Supabase:", data);

      res.json({
          success: true,
          message: "Complaint submitted successfully!",
          reference: complaint.refNumber,
      });

  } catch (error) {
      console.error("❌ Server error:", error);
      res.status(500).json({ 
          success: false, 
          message: "Server error: " + error.message 
      });
  }
});

// === New Route: Get Complaints (for admin dashboard) ===
app.get("/api/complaints", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, complaints: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// === Update Complaint Status (for admin) ===
app.put("/api/complaints/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('complaints')
      .update({ status: status })
      .eq('refNumber', id)
      .select();

    if (error) throw error;

    res.json({ success: true, message: "Status updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// === Catch-all route for SPA ===
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Start server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));