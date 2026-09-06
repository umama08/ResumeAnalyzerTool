require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const api = require("./routes/api");
const { readDb } = require("./db");

const app = express();
const PORT = Number(process.env.PORT || 5000);
const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin }));
app.use(express.json({ limit: "1mb" }));
app.use("/api", api);

app.get("/api/health", (_req, res) => {
  const db = readDb();
  res.json({ ok: true, jobs: db.jobs.length, candidates: db.candidates.length });
});

app.use((err, _req, res, _next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid request body." });
  }
  console.error(err);
  res.status(500).json({
    error: "Resume analysis failed. Please try again or upload another resume.",
  });
});

app.listen(PORT, () => {
  console.log(`Resume Analyzer API running on http://localhost:${PORT}`);
  console.log(`Uploads directory: ${path.join(__dirname, "uploads")}`);
});
