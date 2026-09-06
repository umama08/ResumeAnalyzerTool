const express = require("express");
const {
  listJobs,
  getJob,
  createJob,
  deleteJob,
  uploadMiddleware,
  uploadResumes,
  analyzeResumes,
  getCandidates,
  getCandidate,
  updateStatus,
  exportCandidates,
  getStats,
} = require("../controllers/appController");

const router = express.Router();

router.get("/stats", getStats);

router.post("/jobs", createJob);
router.get("/jobs", listJobs);
router.get("/jobs/:id", getJob);
router.delete("/jobs/:id", deleteJob);

router.post("/resumes/upload", uploadMiddleware, uploadResumes);
router.post("/resumes/analyze", analyzeResumes);

router.get("/candidates/export", exportCandidates);
router.get("/candidates", getCandidates);
router.get("/candidates/:id", getCandidate);
router.patch("/candidates/:id/status", updateStatus);

module.exports = router;
