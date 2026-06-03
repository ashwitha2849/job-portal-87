import express from "express";
import { aiGenerateSummary, aiEnhanceBulletPoint, aiGenerateFullResume } from "../controllers/aiController.js";
const router = express.Router();
// Middleware to protect routes using Clerk's auth details
const requireUserAuth = (req, res, next) => {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({ success: false, message: "Unauthorized. Please login as a job seeker." });
  }
  next();
};
// Route to generate resume summary
router.post("/summary", requireUserAuth, aiGenerateSummary);
// Route to enhance bullet points
router.post("/enhance", requireUserAuth, aiEnhanceBulletPoint);
// Route to generate a complete resume draft based on prompt
router.post("/full-draft", requireUserAuth, aiGenerateFullResume);
export default router;
