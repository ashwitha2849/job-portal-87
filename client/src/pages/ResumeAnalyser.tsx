import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResumeAnalyser } from '../hooks/useResumeAnalyser';
import ScoreGauge from '../components/ResumeAnalyser/ScoreGauge';
import SuggestionCard from '../components/ResumeAnalyser/SuggestionCard';
import JobMatchCard from '../components/ResumeAnalyser/JobMatchCard';
import AnalysisHistory from '../components/ResumeAnalyser/AnalysisHistory';
import type { AnalysisHistoryItem } from '../types/resumeAnalyser';
import './ResumeAnalyser.css';

const ANGULAR_APP_URL = import.meta.env.VITE_ANGULAR_URL || '/angular-resume-upload/index.html';

const AnalysisSteps = ['Extracting Text', 'LLM Analysis', 'Generating Embeddings', 'Matching Jobs', 'Saving Results'];

const ResumeAnalyser: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [searchInput, setSearchInput] = useState('');

  const {
    activeTab, uploadState, uploadProgress, analysis,
    history, semanticResults, error, isDragging, isMockMode,
    setActiveTab, setIsDragging,
    handleFileUpload, loadHistory, performSemanticSearch,
    saveNote, deleteAnalysis, resetUpload
  } = useResumeAnalyser();

  // Animate through steps while analysing
  React.useEffect(() => {
    if (uploadState === 'analysing') {
      setCurrentStep(0);
      const intervals: ReturnType<typeof setInterval>[] = [];
      AnalysisSteps.forEach((_, i) => {
        const t = setTimeout(() => setCurrentStep(i), i * 1400);
        intervals.push(t as unknown as ReturnType<typeof setInterval>);
      });
      return () => intervals.forEach(t => clearInterval(t));
    }
  }, [uploadState]);

  // Angular iframe message handler
  React.useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'RESUME_FILE_SELECTED' && event.data.file) {
        handleFileUpload(event.data.file);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [handleFileUpload]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, [setIsDragging]);

  const onDragLeave = useCallback(() => setIsDragging(false), [setIsDragging]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload, setIsDragging]);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleViewHistoryResult = (item: AnalysisHistoryItem) => {
    // Reconstruct analysis from history item
    setActiveTab('results');
  };

  const tabs = [
    { id: 'upload', label: '📤 Upload', icon: '📤' },
    { id: 'results', label: '📊 Results', icon: '📊', disabled: !analysis },
    { id: 'history', label: '📋 History', icon: '📋' },
    { id: 'search', label: '🔍 Semantic Search', icon: '🔍' }
  ] as const;

  return (
    <div className="analyser-page">
      {/* Animated background */}
      <div className="analyser-bg">
        <div className="analyser-bg__orb analyser-bg__orb--1" />
        <div className="analyser-bg__orb analyser-bg__orb--2" />
        <div className="analyser-bg__orb analyser-bg__orb--3" />
      </div>

      <div className="analyser-container">
        {/* Header */}
        <header className="analyser-header">
          <div className="analyser-header__badge">
            <span className="analyser-header__badge-dot" />
            AI-Powered • RAG • Semantic Search • GraphQL
          </div>
          <h1 className="analyser-header__title">
            <span className="analyser-header__title-gradient">AI Resume</span> Analyser
          </h1>
          <p className="analyser-header__subtitle">
            Upload your resume and get instant ATS scores, skill gap analysis,
            improvement suggestions, and semantically matched jobs — powered by Gemini LLM.
          </p>

          {isMockMode && (
            <div className="analyser-mock-banner">
              ⚠️ Running in <strong>Mock Mode</strong> — Add <code>GEMINI_API_KEY</code> to server/.env for real AI analysis
            </div>
          )}
        </header>

        {/* Tab navigation */}
        <nav className="analyser-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`analyser-tabs__btn ${activeTab === tab.id ? 'analyser-tabs__btn--active' : ''} ${tab.disabled ? 'analyser-tabs__btn--disabled' : ''}`}
              onClick={() => !tab.disabled && setActiveTab(tab.id as typeof activeTab)}
              disabled={tab.disabled}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* ── UPLOAD TAB ─────────────────────────────────── */}
        {activeTab === 'upload' && (
          <div className="analyser-upload">
            {/* Angular Micro-App Iframe */}
            <div className="analyser-angular-frame">
              <div className="analyser-angular-frame__header">
                <span className="analyser-angular-badge">⬡ Angular 17</span>
                <span className="analyser-angular-label">Drag & Drop Upload Component</span>
              </div>
              <iframe
                src={ANGULAR_APP_URL}
                className="analyser-angular-frame__iframe"
                title="Angular Resume Upload"
                onError={() => {}} // Silently fail if Angular app not built yet
              />
            </div>

            {/* React fallback upload zone */}
            <div className="analyser-upload__divider">
              <span>— or use the React uploader below —</span>
            </div>

            <div
              className={`analyser-drop-zone ${isDragging ? 'analyser-drop-zone--dragging' : ''} ${uploadState === 'uploading' || uploadState === 'analysing' ? 'analyser-drop-zone--busy' : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => uploadState === 'idle' && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                onChange={onFileChange}
                style={{ display: 'none' }}
              />

              {(uploadState === 'idle' || uploadState === 'error') && (
                <div className="analyser-drop-zone__idle">
                  <div className="analyser-drop-zone__icon">
                    {isDragging ? '⬇️' : '📄'}
                  </div>
                  <h3>{isDragging ? 'Drop to analyse!' : 'Drop your resume here'}</h3>
                  <p>Supports PDF, DOCX, DOC, TXT • Max 5MB</p>
                  <button className="analyser-drop-zone__btn">
                    Browse Files
                  </button>
                  {error && (
                    <div className="analyser-error">
                      <span>❌ {error}</span>
                      <button onClick={resetUpload} className="analyser-error__retry">Retry</button>
                    </div>
                  )}
                </div>
              )}

              {(uploadState === 'uploading' || uploadState === 'analysing') && (
                <div className="analyser-drop-zone__progress">
                  <div className="analyser-progress-ring">
                    <svg viewBox="0 0 100 100" className="analyser-progress-ring__svg">
                      <circle cx="50" cy="50" r="40" className="analyser-progress-ring__bg" />
                      <circle
                        cx="50" cy="50" r="40"
                        className="analyser-progress-ring__fill"
                        strokeDasharray="251"
                        strokeDashoffset={251 - (uploadProgress / 100) * 251}
                      />
                    </svg>
                    <span className="analyser-progress-ring__pct">{uploadProgress}%</span>
                  </div>

                  <h3>
                    {uploadState === 'uploading' ? 'Uploading resume...' : '🤖 AI Analysing...'}
                  </h3>

                  <div className="analyser-steps">
                    {AnalysisSteps.map((step, i) => (
                      <div
                        key={step}
                        className={`analyser-step ${i < currentStep ? 'analyser-step--done' : ''} ${i === currentStep ? 'analyser-step--active' : ''}`}
                      >
                        <span className="analyser-step__dot">
                          {i < currentStep ? '✅' : i === currentStep ? '⚡' : '○'}
                        </span>
                        <span className="analyser-step__label">{step}</span>
                      </div>
                    ))}
                  </div>

                  <p className="analyser-drop-zone__ai-note">
                    🧠 Using Gemini LLM + RAG embeddings
                  </p>
                </div>
              )}
            </div>

            {/* Tech stack pills */}
            <div className="analyser-tech-stack">
              {['Gemini LLM', 'RAG Embeddings', 'Cosine Similarity', 'GraphQL', 'REST API', 'MongoDB', 'React + TypeScript', 'Angular 17'].map(tech => (
                <span key={tech} className="analyser-tech-pill">{tech}</span>
              ))}
            </div>
          </div>
        )}

        {/* ── RESULTS TAB ─────────────────────────────────── */}
        {activeTab === 'results' && analysis && (
          <div className="analyser-results">
            {/* Scores */}
            <section className="analyser-scores">
              <h2 className="analyser-section-title">📊 Resume Scores</h2>
              <div className="analyser-gauges">
                <ScoreGauge score={analysis.scores.ats} label="ATS Score" color="" delay={0} />
                <ScoreGauge score={analysis.scores.skills} label="Skills" color="" delay={150} />
                <ScoreGauge score={analysis.scores.format} label="Format" color="" delay={300} />
                <ScoreGauge score={analysis.scores.overall} label="Overall" color="#6366f1" delay={450} size={140} />
              </div>
            </section>

            {/* Raw Analysis */}
            {analysis.rawAnalysis && (
              <section className="analyser-raw">
                <h2 className="analyser-section-title">🤖 AI Analysis</h2>
                <div className="analyser-raw__content">
                  <pre className="analyser-raw__text">{analysis.rawAnalysis}</pre>
                </div>
              </section>
            )}

            {/* Suggestions */}
            {analysis.suggestions && analysis.suggestions.length > 0 && (
              <section className="analyser-suggestions">
                <h2 className="analyser-section-title">
                  💡 Improvement Suggestions
                  <span className="analyser-count-badge">{analysis.suggestions.length}</span>
                </h2>
                <div className="analyser-suggestions__grid">
                  {analysis.suggestions.map((s, i) => (
                    <SuggestionCard key={i} suggestion={s} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Matched Jobs */}
            {analysis.matchedJobs && analysis.matchedJobs.length > 0 && (
              <section className="analyser-matches">
                <h2 className="analyser-section-title">
                  🎯 Semantically Matched Jobs
                  <span className="analyser-rag-badge">RAG</span>
                </h2>
                <div className="analyser-matches__list">
                  {analysis.matchedJobs.map((job, i) => (
                    <JobMatchCard
                      key={job.jobId || i}
                      match={job}
                      index={i}
                      onApply={(id) => navigate(`/apply-job/${id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            <div className="analyser-results__actions">
              <button className="analyser-btn analyser-btn--primary" onClick={resetUpload}>
                📤 Analyse Another Resume
              </button>
              <button
                className="analyser-btn analyser-btn--secondary"
                onClick={() => { setActiveTab('search'); }}
              >
                🔍 Semantic Job Search
              </button>
            </div>
          </div>
        )}

        {activeTab === 'results' && !analysis && (
          <div className="analyser-empty">
            <div className="analyser-empty__icon">📊</div>
            <h3>No analysis yet</h3>
            <p>Upload a resume first to see your results</p>
            <button className="analyser-btn analyser-btn--primary" onClick={() => setActiveTab('upload')}>
              Go to Upload
            </button>
          </div>
        )}

        {/* ── HISTORY TAB ─────────────────────────────────── */}
        {activeTab === 'history' && (
          <div className="analyser-history-tab">
            <AnalysisHistory
              history={history}
              onLoad={loadHistory}
              onDelete={deleteAnalysis}
              onSaveNote={saveNote}
              onViewResult={handleViewHistoryResult}
            />
          </div>
        )}

        {/* ── SEMANTIC SEARCH TAB ─────────────────────────── */}
        {activeTab === 'search' && (
          <div className="analyser-search-tab">
            <div className="analyser-search-header">
              <h2 className="analyser-section-title">🔍 Semantic Job Search</h2>
              <p className="analyser-search-desc">
                Describe your skills or paste text from your resume to find semantically similar jobs using AI vector embeddings.
                <span className="analyser-graphql-badge"> via GraphQL</span>
              </p>
            </div>

            <div className="analyser-search-box">
              <textarea
                className="analyser-search-textarea"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="E.g.: React developer with 3 years experience in TypeScript, Node.js, REST APIs, and PostgreSQL..."
                rows={4}
              />
              <button
                className="analyser-btn analyser-btn--primary analyser-search-btn"
                onClick={() => performSemanticSearch(searchInput)}
                disabled={!searchInput.trim()}
              >
                🚀 Search with AI
              </button>
            </div>

            {analysis?.resumeSnippet && (
              <button
                className="analyser-btn analyser-btn--ghost"
                onClick={() => {
                  setSearchInput(analysis.resumeSnippet || '');
                  performSemanticSearch(analysis.resumeSnippet);
                }}
              >
                🔄 Use my resume text
              </button>
            )}

            {semanticResults.length > 0 && (
              <div className="analyser-search-results">
                <h3 className="analyser-section-title">
                  Results
                  <span className="analyser-count-badge">{semanticResults.length}</span>
                </h3>
                <div className="analyser-matches__list">
                  {semanticResults.map((job, i) => (
                    <JobMatchCard
                      key={job.jobId || i}
                      match={job}
                      index={i}
                      onApply={(id) => navigate(`/apply-job/${id}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {semanticResults.length === 0 && (
              <div className="analyser-search-empty">
                <div className="analyser-search-empty__icon">🔭</div>
                <p>Enter skills or resume text above, then click "Search with AI"</p>
                <p className="analyser-search-empty__note">
                  Uses Gemini text-embedding-004 + cosine similarity for RAG-powered semantic matching
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeAnalyser;
