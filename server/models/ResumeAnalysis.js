import mongoose from "mongoose";

const suggestionSchema = new mongoose.Schema({
  category: { type: String },
  tip: { type: String },
  priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' }
});

const jobMatchSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.Mixed },
  title: { type: String },
  company: { type: String },
  location: { type: String },
  similarity: { type: Number }
});

const resumeAnalysisSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  resumeText: { type: String },
  resumeSnippet: { type: String }, // first 300 chars for display
  resumeEmbedding: { type: [Number], select: false }, // stored but not returned by default
  scores: {
    ats: { type: Number, default: 0 },
    skills: { type: Number, default: 0 },
    format: { type: Number, default: 0 },
    overall: { type: Number, default: 0 }
  },
  suggestions: [suggestionSchema],
  matchedJobs: [jobMatchSchema],
  rawAnalysis: { type: String },
  note: { type: String, default: '' },
  analysedAt: { type: Date, default: Date.now }
});

const ResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
export default ResumeAnalysis;
