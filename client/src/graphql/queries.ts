// GraphQL queries and mutations for the AI Resume Analyser

export const GET_MY_ANALYSES = `
  query GetMyAnalyses {
    myAnalyses {
      id
      atsScore
      skillsScore
      formatScore
      overallScore
      suggestions {
        category
        tip
        priority
      }
      matchedJobs {
        jobId
        title
        company
        location
        similarity
      }
      resumeSnippet
      note
      analysedAt
    }
  }
`;

export const GET_LATEST_ANALYSIS = `
  query GetLatestAnalysis {
    latestAnalysis {
      id
      atsScore
      skillsScore
      formatScore
      overallScore
      suggestions {
        category
        tip
        priority
      }
      matchedJobs {
        jobId
        title
        company
        location
        similarity
      }
      resumeSnippet
      note
      analysedAt
    }
  }
`;

export const SEMANTIC_JOB_SEARCH = `
  query SemanticJobSearch($resumeText: String!) {
    semanticJobSearch(resumeText: $resumeText) {
      jobId
      title
      company
      location
      similarity
    }
  }
`;

export const SAVE_ANALYSIS_NOTE = `
  mutation SaveAnalysisNote($analysisId: ID!, $note: String!) {
    saveAnalysisNote(analysisId: $analysisId, note: $note) {
      id
      note
    }
  }
`;

export const DELETE_ANALYSIS = `
  mutation DeleteAnalysis($analysisId: ID!) {
    deleteAnalysis(analysisId: $analysisId)
  }
`;

// Helper: execute a GraphQL request
export const gqlRequest = async <T>(
  query: string,
  variables?: Record<string, unknown>,
  token?: string
): Promise<T> => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
  const response = await fetch(`${backendUrl}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ query, variables })
  });

  const json = await response.json();

  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message);
  }

  return json.data as T;
};
