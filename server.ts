import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("meetings.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    description TEXT
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/meetings", (req, res) => {
    try {
      const meetings = db.prepare("SELECT * FROM meetings ORDER BY date ASC, time ASC").all();
      res.json(meetings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  app.post("/api/meetings", (req, res) => {
    const { title, date, time, description } = req.body;
    if (!title || !date || !time) {
      return res.status(400).json({ error: "Title, date, and time are required" });
    }
    try {
      const info = db.prepare("INSERT INTO meetings (title, date, time, description) VALUES (?, ?, ?, ?)")
        .run(title, date, time, description);
      res.status(201).json({ id: info.lastInsertRowid, title, date, time, description });
    } catch (error) {
      res.status(500).json({ error: "Failed to create meeting" });
    }
  });

  app.put("/api/meetings/:id", (req, res) => {
    const { id } = req.params;
    const { title, date, time, description } = req.body;
    try {
      const result = db.prepare("UPDATE meetings SET title = ?, date = ?, time = ?, description = ? WHERE id = ?")
        .run(title, date, time, description, id);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.json({ id, title, date, time, description });
    } catch (error) {
      res.status(500).json({ error: "Failed to update meeting" });
    }
  });

  app.delete("/api/meetings/:id", (req, res) => {
    const { id } = req.params;
    try {
      const result = db.prepare("DELETE FROM meetings WHERE id = ?").run(id);
      if (result.changes === 0) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete meeting" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
