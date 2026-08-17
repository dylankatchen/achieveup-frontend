import React from 'react';
import { Award } from 'lucide-react';
import { tierFromLabel, tierLabel, tierGradientClass, tierTextClass } from '../../utils/skillTiers';

export interface RecentBadgeSummary {
  id: string;
  skillName: string;
  courseName: string;
  level: string;
  earnedAt: string;
}

interface RecentBadgesGridProps {
  badges: RecentBadgeSummary[];
}

const formatEarnedDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const RecentBadgesGrid: React.FC<RecentBadgesGridProps> = ({ badges }) => {
  if (badges.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-gray-500">
        No badges earned yet — badges appear automatically as you master skills.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {badges.map((badge) => {
        const tier = tierFromLabel(badge.level);
        return (
          <div key={badge.id} className="flex items-center gap-3.5">
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-white ${tierGradientClass[tier]}`}
            >
              <Award className="h-[18px] w-[18px]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-gray-900">{badge.skillName}</div>
              <div className="truncate text-xs text-gray-400">
                {badge.courseName} · {formatEarnedDate(badge.earnedAt)}
              </div>
            </div>
            <div className={`flex-shrink-0 text-xs font-medium ${tierTextClass[tier]}`}>
              {tierLabel[tier]}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecentBadgesGrid;
