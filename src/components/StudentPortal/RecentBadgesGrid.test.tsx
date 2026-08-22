import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import RecentBadgesGrid from './RecentBadgesGrid';

const badge = (overrides: Partial<React.ComponentProps<typeof RecentBadgesGrid>['badges'][number]> = {}) => ({
  id: 'b1',
  skillName: 'Recursion',
  courseName: 'Data Structures',
  level: 'expert',
  earnedAt: '2026-03-14T00:00:00Z',
  ...overrides,
});

describe('RecentBadgesGrid', () => {
  test('shows an empty-state message when there are no badges', () => {
    render(<RecentBadgesGrid badges={[]} />);
    expect(screen.getByText(/no badges earned yet/i)).toBeInTheDocument();
  });

  test('renders a badge with its skill, course, formatted date, and tier label', () => {
    render(<RecentBadgesGrid badges={[badge()]} />);

    expect(screen.getByText('Recursion')).toBeInTheDocument();
    const expectedDate = new Date('2026-03-14T00:00:00Z').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    expect(screen.getByText(`Data Structures · ${expectedDate}`)).toBeInTheDocument();
    expect(screen.getByText('Expert')).toBeInTheDocument();
  });

  test('a malformed earnedAt date does not crash - falls back to the raw string', () => {
    render(<RecentBadgesGrid badges={[badge({ earnedAt: 'not-a-real-date' })]} />);
    expect(screen.getByText('Data Structures · not-a-real-date')).toBeInTheDocument();
  });

  // "Recent" implies chronological order, but the component (and its caller
  // in StudentDashboard.tsx, which does badges.slice(0, 5) with no sort)
  // renders badges in whatever order the API returned them, not sorted by
  // earnedAt. Locking in current behavior; flagging as a real gap for the
  // team rather than silently adding a sort here.
  test('renders badges in the order given, not sorted by earned date (known gap, not fixed)', () => {
    render(
      <RecentBadgesGrid
        badges={[
          badge({ id: 'b1', skillName: 'Earned Later', earnedAt: '2026-06-01T00:00:00Z' }),
          badge({ id: 'b2', skillName: 'Earned Earlier', earnedAt: '2026-01-01T00:00:00Z' }),
        ]}
      />
    );

    const names = screen.getAllByText(/Earned (Later|Earlier)/).map((el) => el.textContent);
    expect(names).toEqual(['Earned Later', 'Earned Earlier']);
  });

  test('an unrecognized badge level falls back to the intermediate tier styling', () => {
    render(<RecentBadgesGrid badges={[badge({ level: 'nonsense-level' })]} />);
    expect(screen.getByText('Intermediate')).toBeInTheDocument();
  });
});
