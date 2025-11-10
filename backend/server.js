import express from "express";
import cors from "cors";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { supabase } from "./supabase.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5200;
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

// Directory setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
const frontendPath = path.join(__dirname, "frontend");
app.use(express.static(frontendPath));

// Memory Storage for uploading of pictures/files
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024,
    fields: 10,
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) cb(null, true);
    else cb(new Error("Only images, PDF and Word documents are allowed"));
  },
});

// Predefined users 
const users = [
  { username: "admin", password: "xamarinadmin123", role: "admin" },
  { username: "resident1", password: "xamarinuser123", role: "resident" },
  { username: "resident2", password: "xamarinuser2123", role: "resident" },
  { username: "response", password: "xamarinresponse123", role: "response" },
  { username: "sk", password: "xamarinsk123", role: "sk" },
  { username: "maintenance", password: "xamarinmaintenance123", role: "maintenance" },
];

// routing login
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  const predefinedUser = users.find(
    (u) => u.username === username && u.password === password
  );

  if (predefinedUser) {
    res.json({
      success: true,
      role: predefinedUser.role,
      username: predefinedUser.username,
    });
    return;
  }

  // Checking existing Supabase users
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error || !data) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.json({
      success: true,
      role: data.role,
      username: data.username,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// handling complaints submission from the resident report form to the database
app.post("/api/complaints", upload.single("file"), async (req, res) => {
  console.log("Received complaint submission");

  try {
    // getting all the data inputted in the fields from resident report form
    const { name, contact, category, description, location, username } = req.body;

    console.log("Extracted form data:", {
      name, contact, category, description, location, username
    });

    // Validating required fields
    if (!name || !contact || !category || !description || !location || !username) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required.",
        received: {
          name: !!name,
          contact: !!contact,
          category: !!category,
          description: !!description,
          location: !!location,
          username: !!username
        }
      });
    }

    let fileUrl = null;

    // Upload file to Supabase storage bucket (complaint-files) that stores files and photos uploaded
    if (req.file) {
      console.log("Processing file upload:", req.file.originalname);
      const fileName = `complaint-${Date.now()}-${req.file.originalname}`;
      const { error: uploadError } = await supabase.storage
        .from("complaint-files")
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

      if (uploadError) {
        console.error("File upload error:", uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("complaint-files")
        .getPublicUrl(fileName);
      fileUrl = urlData.publicUrl;
      console.log("File uploaded successfully:", fileUrl);
    }

    // saving complaint data for the supabase database
    const complaintData = {
      name: name,
      contact: contact,
      category: category,
      description: description,
      location: location,
      file: fileUrl,
      status: "pending",
      username: username, 
      created_at: new Date().toISOString(),
    };

    console.log("Complaint data to save:", complaintData);

    // Insert into the database 
    const { data, error } = await supabase
      .from("complaints")
      .insert([
        {
          name: complaintData.name,
          contact: complaintData.contact,
          category: complaintData.category,
          description: complaintData.description,
          location: complaintData.location,
          file: complaintData.file,
          status: complaintData.status,
          username: complaintData.username, 
          created_at: complaintData.created_at
        }
      ])
      .select();

    if (error) {
      console.error("Database insert error:", error);
      console.error("Error details:", error.details, error.hint, error.message);
      throw error;
    }

    console.log("Complaint submitted successfully!");
    console.log("Inserted complaint:", data);

    res.json({ 
      success: true, 
      message: "Complaint submitted successfully!",
      complaint: data[0]
    });

  } catch (error) {
    console.error("Complaint Error:", error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: error.details || 'No additional details'
    });
  }
});

// get the complaints when the user login ensuring the user logged in can only access his own records
app.get("/api/complaints", async (req, res) => {
  try {
    const { username, role } = req.query; 
    
    let query = supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    if (role === 'resident' && username) {
      query = query.eq('username', username);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json({ success: true, complaints: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// updating status changes of the report 
app.put("/api/complaints/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { error } = await supabase.from("complaints").update({ status }).eq("id", id);

    if (error) throw error;
    res.json({ success: true, message: "Status updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// this part handles where the admin assign a report to its designated team
app.put("/api/complaints/:id/assign", async (req, res) => {
  const { id } = req.params;
  const { assigned_team } = req.body;

  try {
    const { error } = await supabase
      .from("complaints")
      .update({
        assigned_team,
        status: "in-progress",
      })
      .eq("id", id);

    if (error) throw error;
    res.json({ success: true, message: "Complaint assigned successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// this handles the sumbission of the team update to the reports assigned to them where they submit
// their teams response including photo and notes
app.put("/api/complaints/:id/team-update", upload.single("after_photo"), async (req, res) => {
  const { id } = req.params;
  const { team_notes } = req.body;
  let afterPhotoUrl = null;

  try {
    if (req.file) {
      const fileName = `after-${Date.now()}-${req.file.originalname}`;
      const { error: uploadError } = await supabase.storage
        .from("complaint-files")
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
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

    const { error } = await supabase.from("complaints").update(updateFields).eq("id", id);
    if (error) throw error;

    res.json({ success: true, message: "Team update saved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// this handles the part where the team can access the assigned reports to them by the admin 
app.get("/api/team/:teamname", async (req, res) => {
  const { teamname } = req.params;
  try {
    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("assigned_team", teamname);

    if (error) throw error;
    res.json({ success: true, complaints: data });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch complaints" });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`✅ Server running at http://${HOST}:${PORT}`);
});