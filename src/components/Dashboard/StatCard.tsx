import React from 'react';

interface StatCardProps {
  icon: string;
  iconColor: 'blue' | 'yellow' | 'green' | 'red';
  value: string | number;
  label: string;
  trend: number;
  trendDirection: 'up' | 'down';
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  iconColor,
  value,
  label,
  trend,
  trendDirection,
}) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconColor}`}>
        <span className="material-icons">{icon}</span>
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        <div className={`stat-trend ${trendDirection}`}>
          <span className="material-icons">
            {trendDirection === 'up' ? 'arrow_upward' : 'arrow_downward'}
          </span>
          <span>{Math.abs(trend)}%</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;

