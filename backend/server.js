import express from "express";
import cors from "cors";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { supabase } from "./supabase.js";

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

// === Multer with Memory Storage ===
const storage = multer.memoryStorage(); // Store files in memory instead of disk

const upload = multer({ 
  storage: storage, // Use memory storage
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file types
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDF and Word documents are allowed'));
    }
  }
});

// === Predefined users ===
const users = [
  { username: "admin", password: "admin123", role: "admin" },
  { username: "user", password: "user123", role: "user" },
];

// === Login Route ===
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

// === Complaint submission with Supabase Storage (UPDATED) ===
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

        let fileUrl = null;

        // If file is uploaded, store it in Supabase Storage
        if (req.file) {
            console.log("📁 Processing file upload:", req.file.originalname);
            
            const fileName = `complaint-${Date.now()}-${req.file.originalname}`;
            
            // Upload to Supabase Storage directly from memory
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('complaint-files')
                .upload(fileName, req.file.buffer, {
                    contentType: req.file.mimetype,
                    upsert: false
                });

            if (uploadError) {
                console.error("❌ Supabase storage error:", uploadError);
                // Continue without file if upload fails
                console.log("⚠️ File upload failed, continuing without file");
            } else {
                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('complaint-files')
                    .getPublicUrl(fileName);
                
                fileUrl = publicUrl;
                console.log("✅ File uploaded to Supabase:", publicUrl);
            }
        } else {
            console.log("📝 No file attached to complaint");
        }

        const complaint = {
            name: name,
            contact: contact,
            category: category,
            description: description,
            location: location,
            file: fileUrl, // Store the Supabase URL
            refNumber: "REF-" + Date.now(),
            created_at: new Date().toISOString(),
            status: 'pending'
        };

        console.log("📝 Saving complaint to database");

        // Save to Supabase Database
        const { data, error } = await supabase
            .from('complaints')
            .insert([complaint])
            .select();

        if (error) {
            console.error("❌ Supabase database error:", error);
            return res.status(500).json({ 
                success: false, 
                message: "Database error: " + error.message 
            });
        }

        console.log("✅ Complaint saved successfully with ID:", data[0]?.id);

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

// === Get Complaints ===
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

// === Update Complaint Status ===
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

// === Test Supabase Storage ===
app.get("/api/test-storage", async (req, res) => {
  try {
    // Test if storage bucket exists and is accessible
    const { data, error } = await supabase.storage
      .from('complaint-files')
      .list('', { limit: 1 });

    if (error) {
      console.error("❌ Storage test failed:", error);
      return res.json({ 
        success: false, 
        message: "Storage test failed: " + error.message 
      });
    }

    res.json({ 
      success: true, 
      message: "Storage bucket is accessible" 
    });
  } catch (error) {
    res.json({ 
      success: false, 
      message: "Storage test error: " + error.message 
    });
  }
});

// === Catch-all route for SPA ===
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Start server
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));