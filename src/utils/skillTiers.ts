export type SkillTier = 'expert' | 'advanced' | 'intermediate' | 'developing';

// Thresholds match the badge tiers documented in BadgesDashboard.tsx
// (Beginner 25%, Intermediate 50%, Advanced 75%, Expert 90%). "Developing"
// covers everything below Intermediate — not yet a mastered skill.
export const tierForScore = (score: number): SkillTier => {
  if (score >= 90) return 'expert';
  if (score >= 75) return 'advanced';
  if (score >= 50) return 'intermediate';
  return 'developing';
};

// badge_level comes back from the API as a loose string, not the narrower
// Badge['level'] union, so normalize it defensively before using it as a key.
export const tierFromLabel = (level: string): SkillTier => {
  const normalized = level.toLowerCase();
  if (
    normalized === 'expert' ||
    normalized === 'advanced' ||
    normalized === 'intermediate' ||
    normalized === 'developing'
  ) {
    return normalized;
  }
  return 'intermediate';
};

export const tierLabel: Record<SkillTier, string> = {
  expert: 'Expert',
  advanced: 'Advanced',
  intermediate: 'Intermediate',
  developing: 'Developing',
};

export const tierTextClass: Record<SkillTier, string> = {
  expert: 'text-purple-600',
  advanced: 'text-blue-600',
  intermediate: 'text-green-600',
  developing: 'text-red-600',
};

export const tierBarClass: Record<SkillTier, string> = {
  expert: 'bg-purple-600',
  advanced: 'bg-blue-600',
  intermediate: 'bg-green-600',
  developing: 'bg-red-600',
};

export const tierBgClass: Record<SkillTier, string> = {
  expert: 'bg-purple-50',
  advanced: 'bg-blue-50',
  intermediate: 'bg-green-50',
  developing: 'bg-red-50',
};

export const tierGradientClass: Record<SkillTier, string> = {
  expert: 'bg-gradient-to-br from-purple-600 to-purple-700',
  advanced: 'bg-gradient-to-br from-blue-600 to-blue-700',
  intermediate: 'bg-gradient-to-br from-green-600 to-green-700',
  developing: 'bg-gradient-to-br from-red-600 to-red-700',
};
