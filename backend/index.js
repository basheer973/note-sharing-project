import express from "express";
import multer from "multer";
import cors from "cors";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";
import fs from "fs";

// Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Setup file storage with Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Setup database connection
let db;
const initDB = async () => {
  db = await open({
    filename: "notes.db",
    driver: sqlite3.Database
  });
};
initDB();

// ========== API Routes ==========

// Upload a file
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const { semester, subject, unit, uploaded_by } = req.body;
    const file = req.file;

    const file_url = `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;

    await db.run(
      "INSERT INTO notes (semester, subject, unit, filename, file_url, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)",
      [semester, subject, unit, file.originalname, file_url, uploaded_by]
    );

    res.json({ message: "File uploaded successfully!", file_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Get files by semester/subject/unit
app.get("/api/notes", async (req, res) => {
  try {
    const { semester, subject, unit } = req.query;
    const rows = await db.all(
      "SELECT * FROM notes WHERE semester = ? AND subject = ? AND unit = ? ORDER BY created_at DESC",
      [semester, subject, unit]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch notes" });
  }
});

// Delete a file
app.delete("/api/notes/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const note = await db.get("SELECT * FROM notes WHERE id = ?", [id]);

    if (!note) return res.status(404).json({ error: "File not found" });

    // Delete file from uploads folder
    const filePath = path.join("uploads", path.basename(note.file_url));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await db.run("DELETE FROM notes WHERE id = ?", [id]);

    res.json({ message: "File deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

// Root route
app.get("/", (req, res) => {
  res.send("✅ Notes Sharing Backend is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
