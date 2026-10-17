import React from 'react';
import type { Suggestion } from '../../types/resumeAnalyser';

interface SuggestionCardProps {
  suggestion: Suggestion;
  index: number;
}

const priorityConfig = {
  high: {
    label: 'HIGH',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    glow: 'rgba(239,68,68,0.3)',
    icon: '🔴'
  },
  medium: {
    label: 'MEDIUM',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    glow: 'rgba(245,158,11,0.3)',
    icon: '🟡'
  },
  low: {
    label: 'LOW',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    glow: 'rgba(16,185,129,0.3)',
    icon: '🟢'
  }
};

const categoryIcons: Record<string, string> = {
  'ATS Optimization': '🎯',
  'Keywords': '🔑',
  'Skills Section': '⚡',
  'Format': '📐',
  'Summary': '✍️',
  'Action Verbs': '💪',
  'Education': '🎓',
  'Experience': '💼',
  'Projects': '🚀',
  'Quantifiable Results': '📊',
  'Contact Information': '📞',
  'Length': '📏',
};

const SuggestionCard: React.FC<SuggestionCardProps> = ({ suggestion, index }) => {
  const priority = suggestion.priority as keyof typeof priorityConfig;
  const config = priorityConfig[priority] || priorityConfig.medium;
  const icon = categoryIcons[suggestion.category] || '💡';

  return (
    <div
      className="suggestion-card"
      style={{
        animationDelay: `${index * 80}ms`,
        '--glow': config.glow
      } as React.CSSProperties}
    >
      <div className="suggestion-card__header">
        <span className="suggestion-card__category-icon">{icon}</span>
        <span className="suggestion-card__category">{suggestion.category}</span>
        <span
          className="suggestion-card__priority"
          style={{ background: config.gradient }}
        >
          {config.icon} {config.label}
        </span>
      </div>
      <p className="suggestion-card__tip">{suggestion.tip}</p>
    </div>
  );
};

export default SuggestionCard;
