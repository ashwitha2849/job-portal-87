// TypeScript type definitions for the AI Resume Analyser feature

export interface ResumeScores {
  ats: number;
  skills: number;
  format: number;
  overall: number;
}

export interface Suggestion {
  category: string;
  tip: string;
  priority: 'high' | 'medium' | 'low';
}

export interface JobMatch {
  jobId: string;
  title: string;
  company: string;
  location: string;
  salary?: number;
  category?: string;
  similarity: number;
  similarityPercent?: number;
}

export interface ResumeAnalysis {
  analysisId?: string;
  id?: string;
  scores: ResumeScores;
  suggestions: Suggestion[];
  matchedJobs: JobMatch[];
  rawAnalysis?: string;
  resumeSnippet?: string;
  note?: string;
  analysedAt?: string;
  isMock?: boolean;
}

export interface AnalysisHistoryItem {
  _id: string;
  scores: ResumeScores;
  suggestions: Suggestion[];
  matchedJobs: JobMatch[];
  resumeSnippet: string;
  note?: string;
  analysedAt: string;
}

export type AnalysisTab = 'upload' | 'results' | 'history' | 'search';

export type UploadState = 'idle' | 'uploading' | 'analysing' | 'done' | 'error';

export type PriorityColor = {
  high: string;
  medium: string;
  low: string;
};

// GraphQL response types
export interface GraphQLAnalysis {
  id: string;
  userId: string;
  atsScore: number;
  skillsScore: number;
  formatScore: number;
  overallScore: number;
  suggestions: Suggestion[];
  matchedJobs: JobMatch[];
  resumeSnippet: string;
  note: string;
  analysedAt: string;
}

export interface MyAnalysesQuery {
  myAnalyses: GraphQLAnalysis[];
}

export interface LatestAnalysisQuery {
  latestAnalysis: GraphQLAnalysis | null;
}

export interface SemanticSearchQuery {
  semanticJobSearch: JobMatch[];
}
