// server.js
import express from "express";
import cors from "cors";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const REQUIRED_ENV = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`ERROR: Missing required environment variable: ${key}`);
    process.exit(1); 
  }
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const app = express();
const PORT = process.env.PORT || 5200;
const HOST = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const frontendPath = path.join(__dirname, "frontend");
app.use(express.static(frontendPath));

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

const users = [
  { username: "admin", password: "xamarinadmin123", role: "admin" },
  { username: "resident1", password: "xamarinuser123", role: "resident" },
  { username: "resident2", password: "xamarinuser2123", role: "resident" },
  { username: "response", password: "xamarinresponse123", role: "response" },
  { username: "sk", password: "xamarinsk123", role: "sk" },
  { username: "maintenance", password: "xamarinmaintenance123", role: "maintenance" },
];

// --- AUTH (login) ---
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
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// --- SUBMIT COMPLAINT ---
app.post("/api/complaints", upload.single("file"), async (req, res) => {
  console.log("Received complaint submission");

  try {
    const { name, contact, category, description, location, username } = req.body;

    console.log("Extracted form data:", { name, contact, category, description, location, username });

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

    // Upload file to Supabase storage if provided
    if (req.file) {
      console.log("Processing file upload:", req.file.originalname);
      const fileName = `complaint-${Date.now()}-${req.file.originalname}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("complaint-files")
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

      if (uploadError) {
        console.error("File upload error:", uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabaseAdmin.storage
        .from("complaint-files")
        .getPublicUrl(fileName);
      fileUrl = urlData.publicUrl;
      console.log("File uploaded successfully:", fileUrl);
    }

    const complaintData = {
      name,
      contact,
      category,
      description,
      location,
      file: fileUrl,
      status: "pending",
      username,
      created_at: new Date().toISOString(),
    };

    console.log("Complaint data to save:", complaintData);

    // Insert complaint record
    const { data, error } = await supabaseAdmin
      .from("complaints")
      .insert([complaintData])
      .select();

    if (error) {
      console.error("Database insert error:", error);
      throw error;
    }

    const inserted = data && data[0] ? data[0] : null;
    console.log("Complaint submitted successfully!", inserted);

    // --- NOTIFICATION: Notify admin of new complaint ---
    try {
      const timestamp = new Date().toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true
      });

      await supabaseAdmin
        .from("notifications")
        .insert([
          {
            username: "admin",
            message: `You have a new complaint from "${name}" about "${category}" at "${location}" — received on ${timestamp}`,
            status: "unread",
            created_at: new Date().toISOString()
          }
        ]);

      console.log("Admin notified of new complaint.");
    } catch (notifyErr) {
      console.error("Failed to insert admin notification:", notifyErr);
    }

    res.json({
      success: true,
      message: "Complaint submitted successfully!",
      complaint: inserted
    });

  } catch (error) {
    console.error("Complaint Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
      details: error.details || null
    });
  }
});

// --- LIST COMPLAINTS ---
app.get("/api/complaints", async (req, res) => {
  try {
    const { username, role } = req.query;

    let query = supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    // Residents see ONLY their submitted reports
    if (role === "resident" && username) {
      query = query.eq("username", username);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json({ success: true, complaints: data });
  } catch (error) {
    console.error("Fetch complaints error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- ASSIGN TEAM (admin action) ---
app.put("/api/complaints/:id/assign", async (req, res) => {
  const { id } = req.params;
  const { assigned_team } = req.body;

  try {
    // 1. Update complaint assignment + keep status = pending
    const { data: updatedComplaint, error } = await supabaseAdmin
      .from("complaints")
      .update({
        assigned_team,
        status: "pending",
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    const complaint = updatedComplaint[0];

    // 2. Prepare timestamp
    const timestamp = new Date().toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true
    });

    // 3. NOTIFICATION: Notify TEAM
    await supabaseAdmin
      .from("notifications")
      .insert([{
        username: assigned_team,
        message: `You have a new task assigned: "${complaint.category}" — assigned on ${timestamp}`,
        status: "unread",
        created_at: new Date().toISOString()
      }]);

    // 4. NOTIFICATION: Notify RESIDENT
    await supabaseAdmin
      .from("notifications")
      .insert([{
        username: complaint.username,
        message: `Your complaint about "${complaint.category}" has been assigned to the ${assigned_team} team and is now under review (PENDING).`,
        status: "unread",
        created_at: new Date().toISOString()
      }]);

    // 5. NOTIFICATION: Notify ADMIN
    await supabaseAdmin
      .from("notifications")
      .insert([{
        username: "admin",
        message: `Complaint "${complaint.category}" was assigned to ${assigned_team} on ${timestamp}.`,
        status: "unread",
        created_at: new Date().toISOString()
      }]);

    console.log("Team assigned and notifications sent (resident + team + admin)");

    res.json({ success: true, message: "Team assigned successfully" });

  } catch (error) {
    console.error("Assign error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- RESOLVE COMPLAINT (Maintenance Action) ---
app.put("/api/complaints/:id/resolve", async (req, res) => {
  const { id } = req.params;
  const { team_notes } = req.body;

  try {
    // 1. Update complaint status to resolved
    const { data: updatedComplaint, error } = await supabaseAdmin
      .from("complaints")
      .update({
        status: "resolved",
        team_notes,
        resolved_at: new Date().toISOString()
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    const complaint = updatedComplaint[0];

    // 2. Prepare timestamp
    const timestamp = new Date().toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true
    });

    // 3. NOTIFICATION: Notify ADMIN
    await supabaseAdmin
      .from("notifications")
      .insert([{
        username: "admin",
        message: `Complaint "${complaint.category}" has been RESOLVED by maintenance on ${timestamp}.`,
        status: "unread",
        created_at: new Date().toISOString()
      }]);

    // 4. NOTIFICATION: Notify RESIDENT
    await supabaseAdmin
      .from("notifications")
      .insert([{
        username: complaint.username,
        message: `Your complaint about "${complaint.category}" was RESOLVED on ${timestamp}.`,
        status: "unread",
        created_at: new Date().toISOString()
      }]);

    res.json({ success: true, message: "Complaint resolved successfully" });

  } catch (error) {
    console.error("Resolve error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- NOTIFICATION ENDPOINTS ---

// --- FETCH NOTIFICATIONS ---
app.get("/api/notifications", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.json({ success: true, notifications: [] });
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("username", username)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fetch notifications error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }

  res.json({ success: true, notifications: data });
});

// --- MARK ALL NOTIFICATIONS AS READ ---
app.put("/api/notifications/mark-read", async (req, res) => {
  const { username } = req.body;

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ status: "read" })
    .eq("username", username)
    .eq("status", "unread");

  if (error) {
    console.error("Mark read error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }

  res.json({ success: true, message: "Notifications marked as read" });
});

// --- SOFT DELETE NOTIFICATION ---
app.put("/api/notifications/delete", async (req, res) => {
  const { id, username } = req.body;

  if (!id || !username) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  const { error } = await supabaseAdmin
    .from("notifications")
    .update({ status: "deleted" })
    .eq("id", id)
    .eq("username", username);

  if (error) {
    return res.status(500).json({ success: false, message: error.message });
  }

  res.json({ success: true, message: "Notification deleted" });
});

// --- GET PROFILE ---
app.get("/api/get-profile", async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required"
      });
    }

    console.log("Fetching profile for username:", username);

    const predefinedUser = users.find(u => u.username === username);
    if (!predefinedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    const { data: dbUser, error } = await supabase
      .from("users")
      .select("full_name, phone, email, address, avatar_url, updated_at")
      .eq("username", username)
      .single();

    if (dbUser && !error) {
      return res.json({
        success: true,
        username: predefinedUser.username,
        full_name: dbUser.full_name || predefinedUser.full_name || "",
        phone: dbUser.phone || predefinedUser.phone || "",
        email: dbUser.email || predefinedUser.email || "",
        address: dbUser.address || predefinedUser.address || "",
        avatar_url: dbUser.avatar_url || predefinedUser.avatar_url || null,
        role: predefinedUser.role,
        updated_at: dbUser.updated_at
      });
    }

    res.json({
      success: true,
      username: predefinedUser.username,
      full_name: predefinedUser.full_name || "",
      phone: predefinedUser.phone || "",
      email: predefinedUser.email || "",
      address: predefinedUser.address || "",
      avatar_url: predefinedUser.avatar_url || null,
      role: predefinedUser.role,
      updated_at: null
    });

  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});

// --- UPDATE PROFILE ---
app.post("/api/update-profile", upload.single("avatar"), async (req, res) => {
  try {
    const { username, full_name, phone, email, address, currentPassword, newPassword } = req.body;
    const avatarFile = req.file;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required"
      });
    }

    console.log("Updating profile for username:", username);

    const predefinedUser = users.find(u => u.username === username);
    if (!predefinedUser) {
      return res.status(404).json({
        success: false,
        message: "User not authorized"
      });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to set new password"
        });
      }

      if (currentPassword !== predefinedUser.password) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect"
        });
      }

      console.log("Password verification successful for user:", username);
    }

    let avatar_url = null;

    if (avatarFile) {
      try {
        const fileExt = avatarFile.originalname.split('.').pop();
        const fileName = `${username}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabaseAdmin.storage
          .from("avatars")
          .upload(fileName, avatarFile.buffer, {
            contentType: avatarFile.mimetype,
            upsert: true
          });

        if (uploadError) {
          console.error("Avatar upload error:", uploadError);
        } else {
          const { data: urlData } = supabaseAdmin.storage
            .from("avatars")
            .getPublicUrl(fileName);
          avatar_url = urlData.publicUrl;
          console.log("Avatar uploaded successfully:", avatar_url);
        }
      } catch (uploadError) {
        console.error("Avatar upload failed:", uploadError);
      }
    }

    const updateData = {
      username,
      full_name: full_name || "",
      phone: phone || "",
      email: email || "",
      address: address || "",
      avatar_url: avatar_url,
      role: predefinedUser.role,
      password: predefinedUser.password,
      updated_at: new Date().toISOString()
    };

    const { data: upData, error: dbError } = await supabaseAdmin
      .from("users")
      .upsert(updateData, { onConflict: 'username' })
      .select();

    if (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({
        success: false,
        message: "Database error: " + dbError.message
      });
    }

    const responseData = {
      success: true,
      message: "Profile updated successfully",
      data: {
        username,
        full_name: updateData.full_name,
        phone: updateData.phone,
        email: updateData.email,
        address: updateData.address,
        avatar_url: updateData.avatar_url
      }
    };

    res.json(responseData);

  } catch (error) {
    console.error("Update failed:", error);
    res.status(500).json({
      success: false,
      message: "Update failed: " + (error.message || "Internal server error")
    });
  }
});

// --- SOFT DELETE COMPLAINT ---
app.put("/api/complaints/soft-delete", async (req, res) => {
  const { id, username } = req.body;

  try {
    const { error } = await supabaseAdmin
      .from("complaints")
      .update({ status: "deleted" })
      .eq("id", id);

    if (error) throw error;

    res.json({ success: true, message: "Soft deleted successfully" });

  } catch (err) {
    console.error("Soft delete error:", err);
    res.json({ success: false, message: err.message });
  }
});

// --- TEAM UPDATE WITH AFTER PHOTO ---
app.put('/api/complaints/:id/team-update', upload.single('after_photo'), async (req, res) => {
  try {
    const id = req.params.id;
    const { team_notes } = req.body;

    if (!team_notes) {
      return res.status(400).json({ success: false, message: "Team notes required" });
    }

    let afterPhotoUrl = null;

    if (req.file) {
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `complaints/after_${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('complaints')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from('complaints')
        .getPublicUrl(fileName);

      afterPhotoUrl = publicUrl.publicUrl;
    }

    const { data, error } = await supabase
      .from('complaints')
      .update({
        team_notes,
        after_photo: afterPhotoUrl,
        status: 'RESOLVED',
        updated_at: new Date()
      })
      .eq('id', id);

    if (error) throw error;

    return res.json({ success: true, message: "Response Team update saved" });

  } catch (err) {
    console.error("Update error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// --- RESIDENT MANAGEMENT ---
app.get("/api/residents", async (req, res) => {
  try {
    const { data: residents, error: residentsError } = await supabase
      .from("users")
      .select("id, username, full_name, phone, email, address, avatar_url, created_at, updated_at")
      .eq("role", "resident")
      .order("full_name", { ascending: true });

    if (residentsError) throw residentsError;

    const { data: allComplaints, error: complaintsError } = await supabase
      .from("complaints")
      .select("username, created_at")
      .order("created_at", { ascending: false });

    if (complaintsError) {
      console.error("Error fetching complaints:", complaintsError);
    }

    const complaintCounts = {};
    const lastComplaintDates = {};
    
    if (allComplaints && allComplaints.length > 0) {
      allComplaints.forEach(complaint => {
        const username = complaint.username;
        
        if (!username) return; 
        
        if (!complaintCounts[username]) {
          complaintCounts[username] = 0;
        }
        complaintCounts[username]++;
        
        if (!lastComplaintDates[username] || new Date(complaint.created_at) > new Date(lastComplaintDates[username])) {
          lastComplaintDates[username] = complaint.created_at;
        }
      });
    }

    const residentsWithReports = residents.map(resident => {
      const username = resident.username;
      const reportsCount = complaintCounts[username] || 0;
      
      let lastActive = resident.updated_at;
      if (lastComplaintDates[username]) {
        lastActive = lastComplaintDates[username];
      }

      const status = reportsCount > 0 ? 'active' : 'inactive';

      return { 
        ...resident, 
        reports_count: reportsCount, 
        last_active: lastActive,
        status: status
      };
    });

    res.json({ 
      success: true, 
      residents: residentsWithReports,
      total: residentsWithReports.length
    });
  } catch (error) {
    console.error("Error fetching residents:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch residents" 
    });
  }
});

// Get resident by username
app.get("/api/residents/username/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const { data: resident, error: residentError } = await supabase
      .from("users")
      .select("id, username, full_name, phone, email, address, avatar_url, created_at, updated_at")
      .eq("username", username)
      .eq("role", "resident")
      .single();

    if (residentError) throw residentError;
    if (!resident) {
      return res.status(404).json({ 
        success: false, 
        message: "Resident not found" 
      });
    }

    const { data: complaints, error: complaintsError } = await supabase
      .from("complaints")
      .select("id, category, description, status, created_at")
      .eq("username", username)
      .order("created_at", { ascending: false })
      .limit(5);

    if (complaintsError) {
      console.error("Error fetching complaints:", complaintsError);
    }

    const { count: reportsCount, error: countError } = await supabase
      .from("complaints")
      .select('*', { count: 'exact', head: true })
      .eq("username", username);

    if (countError) {
      console.error("Error counting complaints:", countError);
    }

    const residentWithDetails = {
      ...resident,
      reports_count: reportsCount || 0,
      recent_complaints: complaints || []
    };

    res.json({ 
      success: true, 
      resident: residentWithDetails
    });
  } catch (error) {
    console.error("Error fetching resident by username:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch resident details" 
    });
  }
});

// Delete resident by username
app.delete("/api/residents/username/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const { error } = await supabaseAdmin
      .from("users")
      .delete()
      .eq("username", username)
      .eq("role", "resident");

    if (error) throw error;

    res.json({ 
      success: true, 
      message: "Resident deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting resident by username:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to delete resident" 
    });
  }
});

// Update resident by username
app.put("/api/residents/username/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const updateData = req.body;

    const { id, created_at, role, ...safeUpdateData } = updateData;

    const { data: resident, error } = await supabaseAdmin
      .from("users")
      .update({
        ...safeUpdateData,
        updated_at: new Date().toISOString()
      })
      .eq("username", username)
      .eq("role", "resident")
      .select()
      .single();

    if (error) throw error;

    if (!resident) {
      return res.status(404).json({ 
        success: false, 
        message: "Resident not found" 
      });
    }

    res.json({ 
      success: true, 
      message: "Resident updated successfully",
      resident: resident
    });
  } catch (error) {
    console.error("Error updating resident by username:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update resident" 
    });
  }
});

app.put('/api/complaints/:id/feedback', async (req, res) => {
  try {
      const { id } = req.params;
      const { rating, feedback_message, feedback_submitted_at } = req.body;
      
      const { data, error } = await supabase
          .from('complaints')
          .update({
              rating: rating,
              feedback_message: feedback_message,
              feedback_submitted_at: feedback_submitted_at
          })
          .eq('id', id);
          
      if (error) throw error;
      
      res.json({ success: true, message: 'Feedback submitted successfully' });
  } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(500).json({ success: false, message: error.message });
  }
});
app.use((req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`✅ Server running at http://${HOST}:${PORT}`);
});