import React from 'react';

interface ScoreGaugeProps {
  score: number;
  label: string;
  color: string;
  size?: number;
  delay?: number;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({
  score,
  label,
  color,
  size = 120,
  delay = 0
}) => {
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (s: number) => {
    if (s >= 80) return '#10b981'; // green
    if (s >= 60) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const scoreColor = color || getScoreColor(score);

  return (
    <div
      className="score-gauge"
      style={{ '--delay': `${delay}ms` } as React.CSSProperties}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="score-gauge__svg"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="8"
        />
        {/* Score arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={scoreColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: `stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`,
            filter: `drop-shadow(0 0 8px ${scoreColor}80)`
          }}
        />
        {/* Score text */}
        <text
          x={size / 2}
          y={size / 2 - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={size * 0.22}
          fontWeight="700"
          fontFamily="Inter, sans-serif"
        >
          {score}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 16}
          textAnchor="middle"
          fill="rgba(255,255,255,0.5)"
          fontSize={size * 0.1}
          fontFamily="Inter, sans-serif"
        >
          /100
        </text>
      </svg>
      <p className="score-gauge__label">{label}</p>
    </div>
  );
};

export default ScoreGauge;
