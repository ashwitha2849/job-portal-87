import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import type {
  ResumeAnalysis,
  AnalysisHistoryItem,
  JobMatch,
  UploadState,
  AnalysisTab
} from '../types/resumeAnalyser';
import {
  GET_MY_ANALYSES,
  SEMANTIC_JOB_SEARCH,
  SAVE_ANALYSIS_NOTE,
  DELETE_ANALYSIS,
  gqlRequest
} from '../graphql/queries';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface UseResumeAnalyserReturn {
  // State
  activeTab: AnalysisTab;
  uploadState: UploadState;
  uploadProgress: number;
  analysis: ResumeAnalysis | null;
  history: AnalysisHistoryItem[];
  semanticResults: JobMatch[];
  searchQuery: string;
  error: string | null;
  isDragging: boolean;
  isMockMode: boolean;
  // Actions
  setActiveTab: (tab: AnalysisTab) => void;
  setSearchQuery: (q: string) => void;
  setIsDragging: (d: boolean) => void;
  handleFileUpload: (file: File) => Promise<void>;
  loadHistory: () => Promise<void>;
  performSemanticSearch: (text?: string) => Promise<void>;
  saveNote: (analysisId: string, note: string) => Promise<void>;
  deleteAnalysis: (analysisId: string) => Promise<void>;
  resetUpload: () => void;
}

export const useResumeAnalyser = (): UseResumeAnalyserReturn => {
  const { getToken } = useAuth();

  // UI state
  const [activeTab, setActiveTab] = useState<AnalysisTab>('upload');
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);
  const [semanticResults, setSemanticResults] = useState<JobMatch[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMockMode, setIsMockMode] = useState(false);

  // Prevent double-upload
  const uploadingRef = useRef(false);

  // ── Upload & Analyse ─────────────────────────────────────────
  const handleFileUpload = useCallback(async (file: File) => {
    if (uploadingRef.current) return;
    uploadingRef.current = true;

    setError(null);
    setUploadState('uploading');
    setUploadProgress(0);

    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('resume', file);

      setUploadState('analysing');

      // Simulate progress while waiting for AI
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 8, 90));
      }, 400);

      const response = await axios.post(
        `${BACKEND_URL}/api/resume-analyser/analyse`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.data.success) {
        setAnalysis(response.data);
        setIsMockMode(response.data.isMock || false);
        setUploadState('done');
        setActiveTab('results');
      } else {
        throw new Error(response.data.message || 'Analysis failed');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setError(msg);
      setUploadState('error');
    } finally {
      uploadingRef.current = false;
    }
  }, [getToken]);

  // ── Load History via GraphQL ─────────────────────────────────
  const loadHistory = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await gqlRequest<{ myAnalyses: AnalysisHistoryItem[] }>(
        GET_MY_ANALYSES,
        undefined,
        token || undefined
      );
      setHistory(data.myAnalyses || []);
    } catch (err: unknown) {
      console.error('Failed to load history:', err);
      setHistory([]);
    }
  }, [getToken]);

  // ── Semantic Search via GraphQL ──────────────────────────────
  const performSemanticSearch = useCallback(async (text?: string) => {
    const queryText = text || searchQuery || analysis?.resumeSnippet || '';
    if (!queryText.trim()) return;

    try {
      const token = await getToken();
      const data = await gqlRequest<{ semanticJobSearch: JobMatch[] }>(
        SEMANTIC_JOB_SEARCH,
        { resumeText: queryText },
        token || undefined
      );
      setSemanticResults(data.semanticJobSearch || []);
    } catch (err: unknown) {
      console.error('Semantic search error:', err);
      // Fallback to REST API
      try {
        const token = await getToken();
        const response = await axios.get(`${BACKEND_URL}/api/resume-analyser/semantic-search`, {
          params: { query: queryText },
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setSemanticResults(response.data.results || []);
        }
      } catch (restErr) {
        console.error('REST semantic search also failed:', restErr);
      }
    }
  }, [getToken, searchQuery, analysis]);

  // ── Save Note via GraphQL ────────────────────────────────────
  const saveNote = useCallback(async (analysisId: string, note: string) => {
    try {
      const token = await getToken();
      await gqlRequest(SAVE_ANALYSIS_NOTE, { analysisId, note }, token || undefined);
      // Refresh history
      await loadHistory();
    } catch (err) {
      console.error('Failed to save note:', err);
    }
  }, [getToken, loadHistory]);

  // ── Delete Analysis via GraphQL ──────────────────────────────
  const deleteAnalysis = useCallback(async (analysisId: string) => {
    try {
      const token = await getToken();
      await gqlRequest(DELETE_ANALYSIS, { analysisId }, token || undefined);
      setHistory(prev => prev.filter((h: AnalysisHistoryItem) => h._id !== analysisId));
    } catch (err) {
      console.error('Failed to delete analysis:', err);
    }
  }, [getToken]);

  // ── Reset ────────────────────────────────────────────────────
  const resetUpload = useCallback(() => {
    setUploadState('idle');
    setUploadProgress(0);
    setAnalysis(null);
    setError(null);
    setActiveTab('upload');
  }, []);

  return {
    activeTab, uploadState, uploadProgress, analysis,
    history, semanticResults, searchQuery, error,
    isDragging, isMockMode,
    setActiveTab, setSearchQuery, setIsDragging,
    handleFileUpload, loadHistory, performSemanticSearch,
    saveNote, deleteAnalysis, resetUpload
  };
};
