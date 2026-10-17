import express from "express";
import {
  analyseResume,
  getAnalysisHistory,
  semanticJobSearch,
  generateJobEmbeddings,
  resumeUpload
} from "../controllers/resumeAnalyserController.js";

const router = express.Router();

// Middleware to require authenticated job seeker (Clerk)
const requireUserAuth = (req, res, next) => {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({ success: false, message: "Unauthorized. Please login." });
  }
  next();
};

// ─────────────────────────────────────────────────────────────
// RESTful API Routes for AI Resume Analyser
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/resume-analyser/analyse
 * Upload and analyse a resume file (PDF, DOCX, TXT)
 * Request: multipart/form-data with field "resume"
 * Returns: scores, suggestions, matched jobs
 */
router.post(
  "/analyse",
  requireUserAuth,
  resumeUpload.single("resume"),
  analyseResume
);

/**
 * GET /api/resume-analyser/history
 * Get all past resume analyses for the authenticated user
 * Returns: array of analysis summaries
 */
router.get("/history", requireUserAuth, getAnalysisHistory);

/**
 * GET /api/resume-analyser/semantic-search?query=<text>
 * Perform RAG-based semantic search for jobs matching a text query
 * Returns: array of job matches with similarity scores
 */
router.get("/semantic-search", requireUserAuth, semanticJobSearch);

/**
 * POST /api/resume-analyser/generate-embeddings
 * Admin endpoint to pre-generate embeddings for all jobs (RAG setup)
 * Requires x-admin-key header or adminKey query param
 */
router.post("/generate-embeddings", generateJobEmbeddings);

export default router;
