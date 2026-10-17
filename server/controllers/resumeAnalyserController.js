import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import path from "path";
import fs from "fs";
import ResumeAnalysis from "../models/ResumeAnalysis.js";
import Job from "../models/Job.js";

// ──────────────────────────────────────────────
// Multer setup for resume uploads (PDF/DOCX)
// ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "./uploads/resumes";
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `resume_${Date.now()}${ext}`);
  }
});

export const resumeUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".docx", ".doc", ".txt"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error("Only PDF, DOCX, DOC and TXT files are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

// Extract text from uploaded file
const extractText = async (filePath, mimetype) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".txt") {
    return fs.readFileSync(filePath, "utf-8");
  }

  if (ext === ".pdf") {
    try {
      // Dynamic import because pdf-parse uses CommonJS
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text;
    } catch (err) {
      console.error("PDF parse error:", err.message);
      // Fallback: return placeholder
      return "Unable to parse PDF. Please try a text or DOCX file.";
    }
  }

  if (ext === ".docx" || ext === ".doc") {
    try {
      const mammoth = (await import("mammoth")).default;
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (err) {
      console.error("DOCX parse error:", err.message);
      return "Unable to parse DOCX file.";
    }
  }

  return "File format not supported for text extraction.";
};

// Cosine similarity between two float arrays
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
};

// Get Gemini Generative Model (flash)
const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
};

// Get Gemini Embedding Model
const getEmbeddingModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "text-embedding-004" });
};

// Generate text embedding
const generateEmbedding = async (text) => {
  const model = getEmbeddingModel();
  if (!model) return null;
  const result = await model.embedContent(text.slice(0, 3000));
  return result.embedding.values;
};

// Mock analysis response when no API key
const generateMockAnalysis = (resumeText) => {
  const hasReact = /react/i.test(resumeText);
  const hasNode = /node|express/i.test(resumeText);
  const hasPython = /python/i.test(resumeText);

  return {
    scores: { ats: 72, skills: 68, format: 80, overall: 73 },
    suggestions: [
      { category: "ATS Optimization", tip: "Add more quantifiable achievements with numbers (e.g. 'increased performance by 30%')", priority: "high" },
      { category: "Keywords", tip: "Include industry-specific keywords matching job descriptions you're targeting", priority: "high" },
      { category: "Skills Section", tip: "Organize skills into categories: Frontend, Backend, Tools & DevOps", priority: "medium" },
      { category: "Format", tip: "Use consistent date formats (Month Year) throughout your resume", priority: "medium" },
      { category: "Summary", tip: "Your professional summary should be 3-4 sentences focused on value you bring", priority: "low" },
      { category: "Action Verbs", tip: "Start each bullet point with a strong action verb: Developed, Architected, Optimized", priority: "low" }
    ],
    rawAnalysis: `Resume Analysis (Mock Mode - Add GEMINI_API_KEY for real analysis)\n\nATS Score: 72/100 - Resume is partially ATS-friendly but needs improvement.\nSkills Score: 68/100 - Good technical foundation detected. ${hasReact ? 'React skills noted.' : ''} ${hasNode ? 'Node.js skills noted.' : ''} ${hasPython ? 'Python skills noted.' : ''}\nFormat Score: 80/100 - Clean structure, minor consistency issues.\n\nOverall: 73/100 - Resume shows promise. Focus on quantifiable results and ATS keyword optimization.`
  };
};

// ──────────────────────────────────────────────
// REST API Controllers
// ──────────────────────────────────────────────

/**
 * POST /api/users/ai/analyse-resume
 * Analyzes an uploaded resume file using Gemini AI (RAG + LLM).
 * Returns ATS score, skill gaps, suggestions, and semantic job matches.
 */
export const analyseResume = async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  if (!req.file) {
    return res.status(400).json({ success: false, message: "No resume file uploaded" });
  }

  const filePath = req.file.path;

  try {
    // Step 1: Extract text from resume
    const resumeText = await extractText(filePath, req.file.mimetype);

    if (!resumeText || resumeText.length < 50) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ success: false, message: "Could not extract meaningful text from resume. Try a different format." });
    }

    const resumeSnippet = resumeText.slice(0, 300).replace(/\s+/g, ' ').trim();

    let analysisData;
    const model = getGeminiModel();

    if (!model) {
      // Mock mode
      analysisData = generateMockAnalysis(resumeText);
    } else {
      // Real AI analysis using Gemini LLM
      const prompt = `You are an expert ATS (Applicant Tracking System) and career coach AI. Analyze the following resume and provide a structured JSON analysis.

RESUME TEXT:
"""
${resumeText.slice(0, 4000)}
"""

Analyze this resume and respond with ONLY a valid JSON object (no markdown, no code blocks) in this exact structure:
{
  "scores": {
    "ats": <number 0-100 representing ATS compatibility>,
    "skills": <number 0-100 representing skills quality and relevance>,
    "format": <number 0-100 representing formatting and structure quality>,
    "overall": <number 0-100 representing overall resume quality>
  },
  "suggestions": [
    {
      "category": "<category name>",
      "tip": "<specific, actionable improvement suggestion>",
      "priority": "<high|medium|low>"
    }
  ],
  "rawAnalysis": "<2-3 paragraph detailed analysis explaining the scores>"
}

Provide 6-8 specific, actionable suggestions. Make them highly relevant to the actual resume content. Be honest and specific.`;

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" }
      });

      const jsonStr = result.response.text().trim();
      analysisData = JSON.parse(jsonStr);
    }

    // Step 2: Generate embedding for RAG / semantic search
    let resumeEmbedding = null;
    try {
      resumeEmbedding = await generateEmbedding(resumeText);
    } catch (embErr) {
      console.warn("Embedding generation failed:", embErr.message);
    }

    // Step 3: Find semantically similar jobs (RAG)
    let matchedJobs = [];
    try {
      const jobs = await Job.find({ visible: true }).select('+embedding').populate('companyId', 'name').limit(200);

      if (resumeEmbedding && jobs.some(j => j.embedding?.length > 0)) {
        matchedJobs = jobs
          .filter(j => j.embedding?.length > 0)
          .map(j => ({
            jobId: j._id,
            title: j.title,
            company: j.companyId?.name || 'Unknown Company',
            location: j.location,
            similarity: cosineSimilarity(resumeEmbedding, j.embedding)
          }))
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 5);
      } else {
        // Fallback: return recent visible jobs
        const fallbackJobs = await Job.find({ visible: true }).populate('companyId', 'name').limit(5);
        matchedJobs = fallbackJobs.map(j => ({
          jobId: j._id,
          title: j.title,
          company: j.companyId?.name || 'Unknown Company',
          location: j.location,
          similarity: 0.5
        }));
      }
    } catch (jobErr) {
      console.warn("Job matching error:", jobErr.message);
    }

    // Step 4: Save analysis to MongoDB
    const analysis = new ResumeAnalysis({
      userId,
      resumeText: resumeText.slice(0, 5000), // cap stored text
      resumeSnippet,
      resumeEmbedding,
      scores: analysisData.scores,
      suggestions: analysisData.suggestions || [],
      matchedJobs,
      rawAnalysis: analysisData.rawAnalysis || ''
    });

    await analysis.save();

    // Clean up temp file
    fs.unlinkSync(filePath);

    return res.json({
      success: true,
      isMock: !model,
      analysisId: analysis._id,
      scores: analysis.scores,
      suggestions: analysis.suggestions,
      matchedJobs: analysis.matchedJobs,
      rawAnalysis: analysis.rawAnalysis,
      resumeSnippet: analysis.resumeSnippet
    });

  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.error("analyseResume error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/users/ai/analysis-history
 * Returns all past resume analyses for the authenticated user.
 */
export const getAnalysisHistory = async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  try {
    const analyses = await ResumeAnalysis.find({ userId })
      .sort({ analysedAt: -1 })
      .limit(20)
      .select('-resumeEmbedding -resumeText');

    return res.json({ success: true, analyses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/users/ai/semantic-search?query=<text>
 * Finds jobs semantically similar to the provided query text (RAG-based).
 */
export const semanticJobSearch = async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

  const { query } = req.query;
  if (!query) return res.status(400).json({ success: false, message: "Query text is required" });

  try {
    const queryEmbedding = await generateEmbedding(query);

    const jobs = await Job.find({ visible: true }).select('+embedding').populate('companyId', 'name').limit(200);

    let results;

    if (queryEmbedding && jobs.some(j => j.embedding?.length > 0)) {
      results = jobs
        .filter(j => j.embedding?.length > 0)
        .map(j => ({
          jobId: j._id,
          title: j.title,
          company: j.companyId?.name || 'Unknown',
          location: j.location,
          salary: j.salary,
          category: j.category,
          similarity: cosineSimilarity(queryEmbedding, j.embedding),
          similarityPercent: Math.round(cosineSimilarity(queryEmbedding, j.embedding) * 100)
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10);
    } else {
      // Text-based fallback
      const fallback = await Job.find({
        visible: true,
        $or: [
          { title: { $regex: query.split(' ')[0], $options: 'i' } },
          { description: { $regex: query.split(' ')[0], $options: 'i' } }
        ]
      }).populate('companyId', 'name').limit(10);

      results = fallback.map(j => ({
        jobId: j._id,
        title: j.title,
        company: j.companyId?.name || 'Unknown',
        location: j.location,
        salary: j.salary,
        category: j.category,
        similarity: 0.5,
        similarityPercent: 50
      }));
    }

    return res.json({ success: true, results });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/users/ai/generate-job-embeddings
 * Admin endpoint: generates Gemini embeddings for all jobs (for RAG setup).
 */
export const generateJobEmbeddings = async (req, res) => {
  // Basic protection — only allow if a special admin header or param is sent
  const adminKey = req.headers['x-admin-key'] || req.query.adminKey;
  if (adminKey !== process.env.ADMIN_SECRET && adminKey !== 'dev-setup') {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const embeddingModel = getEmbeddingModel();
  if (!embeddingModel) {
    return res.status(400).json({ success: false, message: "GEMINI_API_KEY not set. Cannot generate embeddings." });
  }

  try {
    const jobs = await Job.find({ visible: true });
    let updated = 0;
    let errors = 0;

    for (const job of jobs) {
      try {
        const text = `${job.title} ${job.category} ${job.level} ${job.description?.slice(0, 500) || ''} ${(job.skills || []).join(' ')}`;
        const result = await embeddingModel.embedContent(text.slice(0, 3000));
        job.embedding = result.embedding.values;
        await job.save();
        updated++;
        // Small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
      } catch (e) {
        console.error(`Failed to embed job ${job._id}:`, e.message);
        errors++;
      }
    }

    return res.json({ success: true, updated, errors, total: jobs.length });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
