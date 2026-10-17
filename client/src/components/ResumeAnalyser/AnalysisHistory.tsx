import React, { useEffect, useState } from 'react';
import type { AnalysisHistoryItem } from '../../types/resumeAnalyser';

interface AnalysisHistoryProps {
  history: AnalysisHistoryItem[];
  onLoad: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSaveNote: (id: string, note: string) => Promise<void>;
  onViewResult: (item: AnalysisHistoryItem) => void;
}

const AnalysisHistory: React.FC<AnalysisHistoryProps> = ({
  history,
  onLoad,
  onDelete,
  onSaveNote,
  onViewResult
}) => {
  const [loading, setLoading] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      await onLoad();
      setLoading(false);
    };
    fetchHistory();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <div className="history-loading">
        <div className="history-loading__spinner" />
        <p>Loading your analysis history via GraphQL...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="history-empty">
        <div className="history-empty__icon">📋</div>
        <h3>No analysis history yet</h3>
        <p>Upload your first resume to see your analysis history here</p>
      </div>
    );
  }

  return (
    <div className="history-list">
      <div className="history-list__header">
        <h3>Analysis History</h3>
        <span className="history-list__badge">{history.length} analyses</span>
        <span className="history-list__graphql-tag">via GraphQL</span>
      </div>

      {history.map((item, idx) => (
        <div
          key={item._id}
          className="history-item"
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <div className="history-item__header">
            <div className="history-item__scores">
              {[
                { label: 'ATS', score: (item.scores as any)?.ats || 0 },
                { label: 'Skills', score: (item.scores as any)?.skills || 0 },
                { label: 'Format', score: (item.scores as any)?.format || 0 },
              ].map(({ label, score }) => (
                <div key={label} className="history-item__score-pill" style={{ borderColor: getScoreColor(score) }}>
                  <span className="history-item__score-label">{label}</span>
                  <span className="history-item__score-value" style={{ color: getScoreColor(score) }}>
                    {score}
                  </span>
                </div>
              ))}
              <div
                className="history-item__overall"
                style={{ background: `${getScoreColor((item.scores as any)?.overall || 0)}20`, color: getScoreColor((item.scores as any)?.overall || 0) }}
              >
                Overall: {(item.scores as any)?.overall || 0}%
              </div>
            </div>
            <div className="history-item__actions">
              <button
                className="history-item__view-btn"
                onClick={() => onViewResult(item)}
                title="View full analysis"
              >
                👁 View
              </button>
              <button
                className="history-item__delete-btn"
                onClick={() => onDelete(item._id)}
                title="Delete analysis"
              >
                🗑
              </button>
            </div>
          </div>

          {item.resumeSnippet && (
            <p className="history-item__snippet">{item.resumeSnippet.slice(0, 120)}...</p>
          )}

          <div className="history-item__footer">
            <span className="history-item__date">🕐 {formatDate(item.analysedAt)}</span>
            {editingNote === item._id ? (
              <div className="history-item__note-edit">
                <input
                  type="text"
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  placeholder="Add a note..."
                  className="history-item__note-input"
                  autoFocus
                />
                <button
                  onClick={async () => {
                    await onSaveNote(item._id, noteText);
                    setEditingNote(null);
                  }}
                  className="history-item__note-save"
                >
                  Save
                </button>
                <button onClick={() => setEditingNote(null)} className="history-item__note-cancel">
                  ✕
                </button>
              </div>
            ) : (
              <button
                className="history-item__add-note"
                onClick={() => {
                  setEditingNote(item._id);
                  setNoteText(item.note || '');
                }}
              >
                {item.note ? `📝 ${item.note.slice(0, 30)}...` : '+ Add Note'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AnalysisHistory;
