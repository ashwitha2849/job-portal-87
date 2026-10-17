// GraphQL Type Definitions for AI Resume Analyser
export const typeDefs = `#graphql

  type ResumeScore {
    ats: Int
    skills: Int
    format: Int
    overall: Int
  }

  type Suggestion {
    category: String
    tip: String
    priority: String
  }

  type JobMatch {
    jobId: ID
    title: String
    company: String
    location: String
    similarity: Float
  }

  type ResumeAnalysis {
    id: ID
    userId: String
    atsScore: Int
    skillsScore: Int
    formatScore: Int
    overallScore: Int
    suggestions: [Suggestion]
    matchedJobs: [JobMatch]
    resumeSnippet: String
    note: String
    analysedAt: String
  }

  type Query {
    # Get all resume analyses for the authenticated user
    myAnalyses: [ResumeAnalysis]
    # Get the most recent analysis for the authenticated user
    latestAnalysis: ResumeAnalysis
    # Perform semantic job search by resume text
    semanticJobSearch(resumeText: String!): [JobMatch]
    # Get a single analysis by ID
    analysisById(id: ID!): ResumeAnalysis
  }

  type Mutation {
    # Save or update a personal note on an analysis
    saveAnalysisNote(analysisId: ID!, note: String!): ResumeAnalysis
    # Delete an analysis record
    deleteAnalysis(analysisId: ID!): Boolean
  }
`;
