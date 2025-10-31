import express from "express";
import cors from "cors";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { supabase } from "./supabase.js";
import dotenv from "dotenv";
dotenv.config();

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
const storage = multer.memoryStorage();

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
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
  { username: "admin", password: "xamarinadmin123", role: "admin" },
  { username: "user", password: "xamarinuser123", role: "user" },
  { username: "response", password: "xamarinresponse123", role: "response" },
  { username: "sk", password: "xamarinsk123", role: "sk" },
  { username: "maintenance", password: "xamarinmaintenance123", role: "maintenance" },
];


// === Login Route ===
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  
  const predefinedUser = users.find(
    (u) => u.username === username && u.password === password
  );

  if (predefinedUser) {
    res.json({ success: true, role: predefinedUser.role });
    return;
  }

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

// === Complaint submission (NO refNumber) ===
// === Complaint submission (FIXED file upload) ===
app.post("/api/complaints", upload.single("file"), async (req, res) => {
  console.log("Received complaint submission request");
  
  try {
    const { name, contact, category, description, location } = req.body;
    
    if (!name || !contact || !category || !description || !location) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    let fileUrl = null;

    if (req.file) {
      console.log("Processing file upload:", req.file.originalname);
      console.log("File details:", {
        size: req.file.size,
        mimetype: req.file.mimetype,
        bufferLength: req.file.buffer?.length
      });
      
      const fileName = `complaint-${Date.now()}-${req.file.originalname}`;
      
      try {
        console.log("Uploading file to Supabase Storage...");
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('complaint-files')
          .upload(fileName, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false
          });

        if (uploadError) {
          console.error("Supabase storage upload failed:", uploadError);
          console.error("Error details:", {
            message: uploadError.message,
            name: uploadError.name,
            stack: uploadError.stack
          });
        } else {
          console.log("File uploaded successfully:", uploadData);
          
          // Get public URL - FIXED: Make sure we await this
          const { data: urlData, error: urlError } = supabase.storage
            .from('complaint-files')
            .getPublicUrl(fileName);
          
          if (urlError) {
            console.error("Failed to get public URL:", urlError);
          } else {
            fileUrl = urlData.publicUrl;
            console.log("File URL obtained:", fileUrl);
          }
        }
      } catch (uploadError) {
        console.error("File upload process crashed:", uploadError);
      }
    } else {
      console.log("No file attached to complaint");
    }

    const complaint = {
      name: name,
      contact: contact,
      category: category,
      description: description,
      location: location,
      file: fileUrl,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    console.log("Saving complaint to database...");
    console.log("File URL to be saved:", fileUrl);

    const { data, error } = await supabase
      .from('complaints')
      .insert([complaint])
      .select();

    if (error) {
      console.error("Database insert error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Database error: " + error.message 
      });
    }

    console.log("Complaint saved successfully with ID:", data[0]?.id);
    console.log("File field in database:", data[0]?.file);

    res.json({
      success: true,
      message: "Complaint submitted successfully!",
      reference: data[0]?.id,
      hasFile: !!fileUrl
    });

  } catch (error) {
    console.error("Server error:", error);
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

// === Update Complaint Status (using ID) ===
app.put("/api/complaints/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from('complaints')
      .update({ status: status })
      .eq('id', id) 
      .select();

    if (error) throw error;

    res.json({ success: true, message: "Status updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// === Assign Complaint to a Team ===
app.put("/api/complaints/:id/assign", async (req, res) => {
  const { id } = req.params;
  const { assigned_team } = req.body;

  try {
    const { data, error } = await supabase
      .from("complaints")
      .update({ 
        assigned_team: assigned_team,
        status: 'in-progress' 
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json({ success: true, message: "Complaint assigned to team successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// === Maintenance Team Update (upload after-photo + notes) ===
app.put("/api/complaints/:id/team-update", upload.single("after_photo"), async (req, res) => {
  const { id } = req.params;
  const { team_notes } = req.body;
  let afterPhotoUrl = null;

  try {
    if (req.file) {
      const fileName = `after-${Date.now()}-${req.file.originalname}`;
      const { error: uploadError } = await supabase.storage
        .from("complaint-files")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("complaint-files")
        .getPublicUrl(fileName);

      afterPhotoUrl = urlData.publicUrl;
    }

    const updateFields = {
      team_notes,
      ...(afterPhotoUrl && { after_photo: afterPhotoUrl }),
    };

    const { error } = await supabase
      .from("complaints")
      .update(updateFields)
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true, message: "Team update saved successfully" });
  } catch (error) {
    console.error("Team update error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// === Test File Upload ===
app.post("/api/test-upload", upload.single("file"), async (req, res) => {
  console.log("Testing file upload...");
  
  try {
    if (!req.file) {
      return res.json({ success: false, message: "No file provided" });
    }

    console.log("File received:", {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      bufferLength: req.file.buffer?.length
    });

    const fileName = `test-${Date.now()}-${req.file.originalname}`;
    
    console.log("Uploading to Supabase Storage...");
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('complaint-files')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype
      });

    if (uploadError) {
      console.error("Upload failed:", uploadError);
      return res.json({ 
        success: false, 
        message: "Upload failed: " + uploadError.message,
        errorDetails: uploadError
      });
    }

    console.log("Upload successful:", uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('complaint-files')
      .getPublicUrl(fileName);

    console.log("Public URL:", urlData.publicUrl);

    res.json({
      success: true,
      message: "File upload test successful!",
      fileName: fileName,
      publicUrl: urlData.publicUrl
    });

  } catch (error) {
    console.error("Test failed:", error);
    res.json({ 
      success: false, 
      message: "Test failed: " + error.message 
    });
  }
});

// === Debug: Check server status ===
app.get("/api/debug", async (req, res) => {
  try {
    // Test database connection
    const { data: dbData, error: dbError } = await supabase
      .from('complaints')
      .select('count')
      .limit(1);

    // Test storage connection
    const { data: storageData, error: storageError } = await supabase.storage
      .from('complaint-files')
      .list('', { limit: 1 });

    res.json({
      success: true,
      database: dbError ? `${dbError.message}` : 'Connected',
      storage: storageError ? `${storageError.message}` : 'Connected',
      env: {
        supabaseUrl: process.env.SUPABASE_URL ? ' Set' : 'Missing',
        supabaseKey: process.env.SUPABASE_ANON_KEY ? ' Set' : ' Missing'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Debug failed: " + error.message
    });
  }
});

// === Assign Complaint to a Team (Admin → SK or Maintenance) ===
app.put("/api/complaints/:id/assign", async (req, res) => {
  const { id } = req.params;
  const { assigned_team, assigned_by } = req.body;

  try {
    // Validate input
    if (!assigned_team) {
      return res.status(400).json({ success: false, message: "Assigned team is required" });
    }

    // Update complaint in Supabase
    const { data, error } = await supabase
      .from("complaints")
      .update({
        assigned_team,
        status: "in-progress",
        assigned_by: assigned_by || "admin",
        assigned_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: `Complaint successfully assigned to ${assigned_team}`,
      complaint: data[0],
    });
  } catch (error) {
    console.error("Assignment error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get complaints assigned to a maintenance team
app.get("/api/maintenance/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("assigned_team", username);

    if (error) throw error;

    res.json({ success: true, complaints: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch assigned complaints" });
  }
});

// Get complaints assigned to a sk team
app.get("/api/response/:username", async (req, res) => {
  const { username } = req.params;
  try {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("assigned_team", username);

    if (error) throw error;

    res.json({ success: true, complaints: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch complaints" });
  }
});

// === Get complaints assigned to SK team ===
app.get("/api/sk/:username", async (req, res) => {
  const { username } = req.params;

  try {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("assigned_team", username)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ success: true, complaints: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch SK complaints" });
  }
});

// Update complaint status (In Progress / Resolved)
app.put("/api/complaints/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const { error } = await supabase
      .from("complaints")
      .update({ status })
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true, message: "Status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
});

app.put("/api/complaints/:id/team-update", async (req, res) => {
  const { id } = req.params;
  const { team_notes, after_photo } = req.body;

  try {
    await db.run(
      "UPDATE complaints SET team_notes = ?, after_photo = ?, status = ? WHERE id = ?",
      [team_notes, after_photo, "resolved", id]
    );

    res.json({ success: true, message: "Complaint updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Database error" });
  }
});

// === Catch-all route for SPA ===
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));