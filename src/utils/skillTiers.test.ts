import { tierForScore, tierFromLabel, tierLabel } from './skillTiers';

describe('tierForScore', () => {
  test.each([
    [0, 'developing'],
    [49, 'developing'],
    [50, 'intermediate'],
    [74, 'intermediate'],
    [75, 'advanced'],
    [89, 'advanced'],
    [90, 'expert'],
    [100, 'expert'],
  ])('%i%% -> %s', (score, expected) => {
    expect(tierForScore(score)).toBe(expected);
  });
});

describe('tierFromLabel', () => {
  test('recognizes each real tier label, case-insensitively', () => {
    expect(tierFromLabel('Expert')).toBe('expert');
    expect(tierFromLabel('ADVANCED')).toBe('advanced');
    expect(tierFromLabel('intermediate')).toBe('intermediate');
    expect(tierFromLabel('Developing')).toBe('developing');
  });

  test('falls back to "intermediate" for an unrecognized label', () => {
    expect(tierFromLabel('nonsense')).toBe('intermediate');
  });

  // NOTE: the recognized set here is {expert, advanced, intermediate,
  // developing} - it does NOT include "beginner", even though that's a
  // real badge_level value elsewhere in the app (e.g. Settings.tsx,
  // BadgesDashboard.tsx's tier naming). A "beginner" badge from the API
  // would silently render with "Intermediate" styling rather than its own
  // tier. Locking in current behavior; flagging as worth a team decision
  // (add a real "beginner" tier vs. confirm the API never actually sends
  // one), not fixing silently here.
  test('a "beginner" label falls back to intermediate rather than getting its own tier (known gap, not fixed)', () => {
    expect(tierFromLabel('beginner')).toBe('intermediate');
  });
});

describe('tierLabel', () => {
  test('has a display label for every tier', () => {
    expect(tierLabel.expert).toBe('Expert');
    expect(tierLabel.advanced).toBe('Advanced');
    expect(tierLabel.intermediate).toBe('Intermediate');
    expect(tierLabel.developing).toBe('Developing');
  });
});
