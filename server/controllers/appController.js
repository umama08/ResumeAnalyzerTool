const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const { readDb, withDb } = require("../db");
const { parseSkillList } = require("../services/skillNormalizer");
const { extractResumeText } = require("../services/extractor");
const { analyzeResume } = require("../services/analyzer");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE_MB || 5) * 1024 * 1024;
const STATUSES = ["Review", "Shortlisted", "Rejected"];

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomUUID()}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (![".pdf", ".docx"].includes(ext)) {
    const err = new Error("Unsupported file type. Please upload PDF or DOCX.");
    err.code = "UNSUPPORTED_TYPE";
    return cb(err);
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

function uploadMiddleware(req, res, next) {
  const handler = upload.array("resumes", 25);
  handler(req, res, (err) => {
    if (!err) return next();
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: `File is too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 5}MB.`,
      });
    }
    if (err.code === "UNSUPPORTED_TYPE" || err.message?.includes("Unsupported")) {
      return res.status(400).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message || "Upload failed." });
  });
}

function publicJob(job, candidates = []) {
  const related = candidates.filter((c) => c.jobId === job.id);
  const scores = related.map((c) => c.matchScore).filter((s) => typeof s === "number");
  return {
    ...job,
    candidateCount: related.length,
    shortlistedCount: related.filter((c) => c.status === "Shortlisted").length,
    averageMatch: scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null,
  };
}

function listJobs(_req, res) {
  const { jobs, candidates } = readDb();
  const sorted = [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(sorted.map((job) => publicJob(job, candidates)));
}

function getJob(req, res) {
  const { jobs, candidates } = readDb();
  const job = jobs.find((item) => item.id === req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found." });
  res.json(publicJob(job, candidates));
}

function createJob(req, res) {
  const { title, description, requiredSkills, location, experience, employmentType } = req.body || {};
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: "Please enter a job title." });
  }
  if (!description || !String(description).trim()) {
    return res.status(400).json({ error: "Please enter a job description." });
  }
  const skills = parseSkillList(requiredSkills);
  if (!skills.length) {
    return res.status(400).json({ error: "Please add at least one required skill." });
  }

  const job = {
    id: crypto.randomUUID(),
    title: String(title).trim(),
    description: String(description).trim(),
    requiredSkills: skills,
    location: location ? String(location).trim() : "",
    experience: experience ? String(experience).trim() : "",
    employmentType: employmentType ? String(employmentType).trim() : "",
    createdAt: new Date().toISOString(),
  };

  withDb((db) => db.jobs.push(job));
  res.status(201).json(publicJob(job, []));
}

function deleteJob(req, res) {
  const { jobs } = readDb();
  const job = jobs.find((item) => item.id === req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found." });

  withDb((db) => {
    const related = db.candidates.filter((c) => c.jobId === req.params.id);
    related.forEach((candidate) => {
      if (candidate.storedFilename) {
        const filePath = path.join(UPLOAD_DIR, candidate.storedFilename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    });
    db.jobs = db.jobs.filter((item) => item.id !== req.params.id);
    db.candidates = db.candidates.filter((c) => c.jobId !== req.params.id);
  });

  res.json({ ok: true });
}

async function uploadResumes(req, res) {
  const jobId = req.body.jobId;
  if (!jobId) {
    return res.status(400).json({ error: "Please select a job before uploading resumes." });
  }

  const dbState = readDb();
  const job = dbState.jobs.find((item) => item.id === jobId);
  if (!job) return res.status(404).json({ error: "Job not found." });

  const files = req.files || [];
  if (!files.length) {
    return res.status(400).json({ error: "Please upload at least one PDF or DOCX resume." });
  }

  const created = [];
  const errors = [];

  for (const file of files) {
    try {
      const extractedText = await extractResumeText(file.path, file.originalname);
      if (!extractedText || extractedText.length < 20) {
        fs.unlinkSync(file.path);
        errors.push({
          filename: file.originalname,
          error: "Unable to extract readable text from this resume.",
        });
        continue;
      }

      const candidate = withDb((db) => {
        const duplicate = db.candidates.find(
          (c) => c.jobId === jobId && c.resumeFilename.toLowerCase() === file.originalname.toLowerCase()
        );

        const record = {
          id: duplicate?.id || crypto.randomUUID(),
          jobId,
          name: null,
          email: null,
          experience: null,
          projects: [],
          resumeFilename: file.originalname,
          storedFilename: path.basename(file.path),
          extractedText,
          matchScore: null,
          matchScoreExact: null,
          matchedSkills: [],
          missingSkills: [],
          status: duplicate?.status || "Review",
          analyzed: false,
          createdAt: duplicate?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          duplicateReplaced: Boolean(duplicate),
        };

        if (duplicate && duplicate.storedFilename) {
          const oldPath = path.join(UPLOAD_DIR, duplicate.storedFilename);
          if (fs.existsSync(oldPath) && duplicate.storedFilename !== record.storedFilename) {
            fs.unlinkSync(oldPath);
          }
          Object.assign(duplicate, record);
          return duplicate;
        }

        db.candidates.push(record);
        return record;
      });

      created.push(sanitizeCandidate(candidate));
    } catch (err) {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      errors.push({
        filename: file.originalname,
        error: err.message || "Unable to read this resume. Please upload a text-based PDF or DOCX file.",
      });
    }
  }

  res.status(created.length ? 201 : 400).json({
    uploaded: created,
    errors,
    message: created.length
      ? `${created.length} resume${created.length === 1 ? "" : "s"} uploaded.`
      : "Resume analysis failed. Please try again or upload another resume.",
  });
}

function analyzeResumes(req, res) {
  try {
    const jobId = req.body?.jobId;
    if (!jobId) return res.status(400).json({ error: "Please select a job to analyze." });

    const { jobs, candidates } = readDb();
    const job = jobs.find((item) => item.id === jobId);
    if (!job) return res.status(404).json({ error: "Job not found." });
    if (!job.requiredSkills?.length) {
      return res.status(400).json({ error: "Please add at least one required skill." });
    }

    const related = candidates.filter((c) => c.jobId === jobId);
    if (!related.length) {
      return res.status(400).json({ error: "Upload at least one resume before analyzing." });
    }

    const analyzed = withDb((db) => {
      return db.candidates
        .filter((c) => c.jobId === jobId)
        .map((candidate) => {
          const result = analyzeResume({
            requiredSkills: job.requiredSkills,
            extractedText: candidate.extractedText,
            filename: candidate.resumeFilename,
          });
          Object.assign(candidate, {
            name: result.name,
            email: result.email,
            experience: result.experience,
            projects: result.projects,
            matchScore: result.matchScore,
            matchScoreExact: result.matchScoreExact,
            matchedSkills: result.matchedSkills,
            missingSkills: result.missingSkills,
            analyzed: true,
            updatedAt: new Date().toISOString(),
          });
          return sanitizeCandidate(candidate);
        });
    });

    analyzed.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    res.json({ candidates: analyzed });
  } catch (err) {
    console.error("Error analyzing resumes:", err);
    res.status(500).json({ error: err.message || "Failed to analyze resumes." });
  }
}

function getCandidates(req, res) {
  const { jobId, filter } = req.query;
  const { jobs, candidates } = readDb();
  let list = [...candidates];
  if (jobId) list = list.filter((c) => c.jobId === jobId);

  if (filter === "80") list = list.filter((c) => (c.matchScore || 0) >= 80);
  if (filter === "60") list = list.filter((c) => (c.matchScore || 0) >= 60);
  if (filter === "shortlisted") list = list.filter((c) => c.status === "Shortlisted");

  list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  res.json(
    list.map((candidate, index) => ({
      ...sanitizeCandidate(candidate),
      rank: index + 1,
      jobTitle: jobs.find((j) => j.id === candidate.jobId)?.title || "",
    }))
  );
}

function getCandidate(req, res) {
  const { jobs, candidates } = readDb();
  const candidate = candidates.find((c) => c.id === req.params.id);
  if (!candidate) return res.status(404).json({ error: "Candidate not found." });
  const job = jobs.find((j) => j.id === candidate.jobId);
  const ranked = candidates
    .filter((c) => c.jobId === candidate.jobId)
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  const rank = ranked.findIndex((c) => c.id === candidate.id) + 1;
  res.json({
    ...sanitizeCandidate(candidate, true),
    rank,
    job: job ? publicJob(job, candidates) : null,
  });
}

function updateStatus(req, res) {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) {
    return res.status(400).json({ error: "Status must be Review, Shortlisted, or Rejected." });
  }
  const updated = withDb((db) => {
    const candidate = db.candidates.find((c) => c.id === req.params.id);
    if (!candidate) return null;
    candidate.status = status;
    candidate.updatedAt = new Date().toISOString();
    return sanitizeCandidate(candidate);
  });
  if (!updated) return res.status(404).json({ error: "Candidate not found." });
  res.json(updated);
}

function csvEscape(value) {
  const str = value == null ? "" : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function exportCandidates(req, res) {
  const { jobId, ids, status } = req.query;
  const { jobs, candidates } = readDb();
  let list = [...candidates];
  if (jobId) list = list.filter((c) => c.jobId === jobId);
  if (status) list = list.filter((c) => c.status === status);
  if (ids) {
    const selected = String(ids).split(",").map((id) => id.trim()).filter(Boolean);
    list = list.filter((c) => selected.includes(c.id));
  }

  if (!list.length) {
    return res.status(400).json({ error: "No candidates selected for export." });
  }

  list.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  const header = ["Candidate Name", "Email", "Match Score", "Matched Skills", "Missing Skills", "Status", "Job Title"];
  const rows = list.map((c) => [
    c.name || "Unknown candidate",
    c.email || "Not found",
    typeof c.matchScore === "number" ? `${c.matchScore}%` : "",
    (c.matchedSkills || []).join("; "),
    (c.missingSkills || []).join("; "),
    c.status,
    jobs.find((j) => j.id === c.jobId)?.title || "",
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="shortlist.csv"');
  res.send(csv);
}

function getStats(_req, res) {
  const { jobs, candidates } = readDb();
  const scores = candidates.map((c) => c.matchScore).filter((s) => typeof s === "number");
  const recent = [...candidates]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 6)
    .map((c) => ({
      ...sanitizeCandidate(c),
      jobTitle: jobs.find((j) => j.id === c.jobId)?.title || "",
    }));

  res.json({
    totalJobs: jobs.length,
    totalCandidates: candidates.length,
    averageMatch: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
    shortlisted: candidates.filter((c) => c.status === "Shortlisted").length,
    recent,
  });
}

function sanitizeCandidate(candidate, includeText = false) {
  const { extractedText, storedFilename, ...rest } = candidate;
  return {
    ...rest,
    email: rest.email || null,
    extractedText: includeText ? extractedText : undefined,
  };
}

module.exports = {
  uploadMiddleware,
  listJobs,
  getJob,
  createJob,
  deleteJob,
  uploadResumes,
  analyzeResumes,
  getCandidates,
  getCandidate,
  updateStatus,
  exportCandidates,
  getStats,
};
