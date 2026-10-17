import React from 'react';
import type { JobMatch } from '../../types/resumeAnalyser';

interface JobMatchCardProps {
  match: JobMatch;
  index: number;
  onApply?: (jobId: string) => void;
}

const JobMatchCard: React.FC<JobMatchCardProps> = ({ match, index, onApply }) => {
  const similarityPct = match.similarityPercent ?? Math.round((match.similarity || 0) * 100);

  const getMatchColor = (pct: number) => {
    if (pct >= 80) return { color: '#10b981', label: 'Excellent Match', bg: 'rgba(16,185,129,0.15)' };
    if (pct >= 60) return { color: '#f59e0b', label: 'Good Match', bg: 'rgba(245,158,11,0.15)' };
    if (pct >= 40) return { color: '#6366f1', label: 'Fair Match', bg: 'rgba(99,102,241,0.15)' };
    return { color: '#94a3b8', label: 'Partial Match', bg: 'rgba(148,163,184,0.15)' };
  };

  const matchInfo = getMatchColor(similarityPct);

  return (
    <div
      className="job-match-card"
      style={{
        animationDelay: `${index * 100}ms`,
        borderLeft: `3px solid ${matchInfo.color}`
      }}
    >
      <div className="job-match-card__header">
        <div className="job-match-card__info">
          <h4 className="job-match-card__title">{match.title}</h4>
          <div className="job-match-card__meta">
            <span className="job-match-card__company">🏢 {match.company}</span>
            {match.location && (
              <span className="job-match-card__location">📍 {match.location}</span>
            )}
          </div>
        </div>
        <div className="job-match-card__score-wrap" style={{ background: matchInfo.bg }}>
          <span className="job-match-card__pct" style={{ color: matchInfo.color }}>
            {similarityPct}%
          </span>
          <span className="job-match-card__match-label" style={{ color: matchInfo.color }}>
            {matchInfo.label}
          </span>
        </div>
      </div>

      {/* Similarity bar */}
      <div className="job-match-card__bar-wrap">
        <div className="job-match-card__bar-bg">
          <div
            className="job-match-card__bar-fill"
            style={{
              width: `${similarityPct}%`,
              background: `linear-gradient(90deg, ${matchInfo.color}80, ${matchInfo.color})`,
              transition: `width 1s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 100 + 300}ms`,
              boxShadow: `0 0 8px ${matchInfo.color}60`
            }}
          />
        </div>
      </div>

      {onApply && match.jobId && (
        <button
          className="job-match-card__apply-btn"
          onClick={() => onApply(match.jobId)}
          style={{ borderColor: matchInfo.color, color: matchInfo.color }}
        >
          View Job →
        </button>
      )}
    </div>
  );
};

export default JobMatchCard;
