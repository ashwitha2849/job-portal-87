import ResumeAnalysis from "../models/ResumeAnalysis.js";
import Job from "../models/Job.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper: cosine similarity between two vectors
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

// Helper: generate embedding
const generateEmbedding = async (text) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const result = await model.embedContent(text);
  return result.embedding.values;
};

// Helper: map DB doc to GraphQL type
const mapAnalysis = (doc) => {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    atsScore: doc.scores?.ats ?? 0,
    skillsScore: doc.scores?.skills ?? 0,
    formatScore: doc.scores?.format ?? 0,
    overallScore: doc.scores?.overall ?? 0,
    suggestions: doc.suggestions || [],
    matchedJobs: (doc.matchedJobs || []).map(j => ({
      jobId: j.jobId?.toString(),
      title: j.title,
      company: j.company,
      location: j.location,
      similarity: j.similarity
    })),
    resumeSnippet: doc.resumeSnippet || '',
    note: doc.note || '',
    analysedAt: doc.analysedAt?.toISOString() || new Date().toISOString()
  };
};

export const resolvers = {
  Query: {
    // Get all analyses for authenticated user
    myAnalyses: async (_, __, context) => {
      const userId = context.userId;
      if (!userId) throw new Error("Unauthorized");
      const docs = await ResumeAnalysis.find({ userId }).sort({ analysedAt: -1 }).limit(20);
      return docs.map(mapAnalysis);
    },

    // Get the most recent analysis
    latestAnalysis: async (_, __, context) => {
      const userId = context.userId;
      if (!userId) throw new Error("Unauthorized");
      const doc = await ResumeAnalysis.findOne({ userId }).sort({ analysedAt: -1 });
      return mapAnalysis(doc);
    },

    // Semantic job search by resume text (RAG)
    semanticJobSearch: async (_, { resumeText }, context) => {
      const userId = context.userId;
      if (!userId) throw new Error("Unauthorized");

      try {
        const queryEmbedding = await generateEmbedding(resumeText.slice(0, 2000));

        if (!queryEmbedding) {
          // Fallback: text search if no embedding API key
          const jobs = await Job.find({ visible: true }).limit(5).populate('companyId', 'name');
          return jobs.map(j => ({
            jobId: j._id.toString(),
            title: j.title,
            company: j.companyId?.name || 'Unknown',
            location: j.location,
            similarity: 0.5
          }));
        }

        // Fetch jobs with embeddings
        const jobs = await Job.find({ visible: true }).select('+embedding').populate('companyId', 'name').limit(200);

        // Compute similarities
        const scored = jobs
          .filter(j => j.embedding && j.embedding.length > 0)
          .map(j => ({
            jobId: j._id.toString(),
            title: j.title,
            company: j.companyId?.name || 'Unknown',
            location: j.location,
            similarity: cosineSimilarity(queryEmbedding, j.embedding)
          }))
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 5);

        // If no embeddings yet, fallback to all recent jobs
        if (scored.length === 0) {
          const fallbackJobs = await Job.find({ visible: true }).limit(5).populate('companyId', 'name');
          return fallbackJobs.map(j => ({
            jobId: j._id.toString(),
            title: j.title,
            company: j.companyId?.name || 'Unknown',
            location: j.location,
            similarity: 0.5
          }));
        }

        return scored;
      } catch (err) {
        console.error("GraphQL semanticJobSearch error:", err.message);
        throw new Error("Semantic search failed: " + err.message);
      }
    },

    // Get analysis by ID
    analysisById: async (_, { id }, context) => {
      const userId = context.userId;
      if (!userId) throw new Error("Unauthorized");
      const doc = await ResumeAnalysis.findOne({ _id: id, userId });
      return mapAnalysis(doc);
    }
  },

  Mutation: {
    // Save a note on an analysis
    saveAnalysisNote: async (_, { analysisId, note }, context) => {
      const userId = context.userId;
      if (!userId) throw new Error("Unauthorized");
      const doc = await ResumeAnalysis.findOneAndUpdate(
        { _id: analysisId, userId },
        { note },
        { new: true }
      );
      return mapAnalysis(doc);
    },

    // Delete an analysis
    deleteAnalysis: async (_, { analysisId }, context) => {
      const userId = context.userId;
      if (!userId) throw new Error("Unauthorized");
      await ResumeAnalysis.deleteOne({ _id: analysisId, userId });
      return true;
    }
  }
};
