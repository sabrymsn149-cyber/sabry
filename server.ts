import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("reports.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teacher_name TEXT NOT NULL,
    department TEXT NOT NULL,
    details TEXT NOT NULL,
    governorate TEXT,
    educational_admin TEXT,
    school_id TEXT,
    school_name TEXT,
    principal_phone TEXT,
    visit_date TEXT,
    accomplishments TEXT,
    negatives TEXT,
    violations TEXT,
    file_url TEXT,
    image_url TEXT,
    location_lat REAL,
    location_lng REAL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Migration: Add new columns if they don't exist
const tableInfo = db.prepare("PRAGMA table_info(reports)").all() as any[];
const columns = tableInfo.map(c => c.name);
const newCols = ['governorate', 'educational_admin', 'school_id', 'school_name', 'principal_phone', 'visit_date', 'accomplishments', 'negatives', 'violations', 'file_url'];

newCols.forEach(col => {
  if (!columns.includes(col)) {
    db.exec(`ALTER TABLE reports ADD COLUMN ${col} TEXT`);
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const wss = new WebSocketServer({ server });

  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // API Routes
  app.get("/api/reports", (req, res) => {
    const reports = db.prepare("SELECT * FROM reports ORDER BY created_at DESC").all();
    res.json(reports);
  });

  app.post("/api/reports", (req, res) => {
    const { 
      teacher_name, department, details, governorate, educational_admin, 
      school_id, school_name, principal_phone, visit_date, 
      accomplishments, negatives, violations, file_url,
      image_url, location_lat, location_lng 
    } = req.body;
    
    if (!teacher_name || !department) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const info = db.prepare(`
      INSERT INTO reports (
        teacher_name, department, details, governorate, educational_admin, 
        school_id, school_name, principal_phone, visit_date, 
        accomplishments, negatives, violations, file_url,
        image_url, location_lat, location_lng
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      teacher_name, department, details || '', governorate, educational_admin, 
      school_id, school_name, principal_phone, visit_date, 
      accomplishments, negatives, violations, file_url,
      image_url, location_lat, location_lng
    );

    const newReport = {
      id: info.lastInsertRowid,
      teacher_name,
      department,
      details: details || '',
      governorate,
      educational_admin,
      school_id,
      school_name,
      principal_phone,
      visit_date,
      accomplishments,
      negatives,
      violations,
      file_url,
      image_url,
      location_lat,
      location_lng,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    broadcast({ type: "NEW_REPORT", report: newReport });
    res.status(201).json(newReport);
  });

  app.patch("/api/reports/:id", (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    db.prepare("UPDATE reports SET status = ? WHERE id = ?").run(status, id);
    broadcast({ type: "UPDATE_REPORT", id, status });
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }
}

startServer();
