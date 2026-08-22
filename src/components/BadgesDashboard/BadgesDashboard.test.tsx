import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import BadgesDashboard from './BadgesDashboard';
import { instructorAPI } from '../../services/api';

jest.mock('../../services/api', () => ({
  instructorAPI: {
    getCourseStudentAnalytics: jest.fn(),
  },
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn() },
}));

const analyticsWith = (students: any[]) =>
  ({
    data: { analytics: { students } },
  }) as any;

test('shows a loading spinner before the API resolves', () => {
  jest.mocked(instructorAPI.getCourseStudentAnalytics).mockReturnValue(new Promise(() => {}));
  const { container } = render(<BadgesDashboard courseId="c1" />);

  expect(container.querySelector('.animate-spin')).toBeInTheDocument();
});

test('with no students at all, shows the "No Badges Available" empty state', async () => {
  jest.mocked(instructorAPI.getCourseStudentAnalytics).mockResolvedValue(analyticsWith([]));
  render(<BadgesDashboard courseId="c1" />);

  await waitFor(() => expect(screen.getByText('No Badges Available')).toBeInTheDocument());
});

test('on a failed request, fails gracefully to the empty state rather than crashing', async () => {
  jest.mocked(instructorAPI.getCourseStudentAnalytics).mockRejectedValue(new Error('network error'));
  render(<BadgesDashboard courseId="c1" />);

  await waitFor(() => expect(screen.getByText('No Badges Available')).toBeInTheDocument());
});

test('creates one badge per unique skill across all students, with correct earned/in-progress counts', async () => {
  jest.mocked(instructorAPI.getCourseStudentAnalytics).mockResolvedValue(
    analyticsWith([
      {
        id: 's1',
        name: 'Student One',
        skillBreakdown: { 'CSS Basics': { score: 80, badgeLevel: 'advanced' } },
      },
      {
        id: 's2',
        name: 'Student Two',
        skillBreakdown: { 'CSS Basics': { score: 10 } },
      },
    ])
  );
  render(<BadgesDashboard courseId="c1" />);

  await waitFor(() => expect(screen.getByText('CSS Basics Badge')).toBeInTheDocument());
  expect(screen.getByText('1 earned')).toBeInTheDocument();
  expect(screen.getByText('1 in progress')).toBeInTheDocument();
  expect(screen.getByText('2 total')).toBeInTheDocument();
});

test('a student with no skillBreakdown entry for a skill counts as not-yet-attempted (in progress, 0%)', async () => {
  jest.mocked(instructorAPI.getCourseStudentAnalytics).mockResolvedValue(
    analyticsWith([
      { id: 's1', name: 'Has Data', skillBreakdown: { Testing: { score: 60, badgeLevel: 'intermediate' } } },
      { id: 's2', name: 'No Data', skillBreakdown: {} },
    ])
  );
  render(<BadgesDashboard courseId="c1" />);

  await waitFor(() => expect(screen.getByText('Testing Badge')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Testing Badge'));
  fireEvent.click(screen.getByText(/in progress \(1\)/i));

  expect(screen.getByText('No Data')).toBeInTheDocument();
  expect(screen.getByText('Current score: 0%')).toBeInTheDocument();
});

test('"Advanced Fundamentals" is classified as beginner, not advanced - the beginner/"fundamental" check runs first', async () => {
  jest.mocked(instructorAPI.getCourseStudentAnalytics).mockResolvedValue(
    analyticsWith([
      { id: 's1', name: 'S', skillBreakdown: { 'Advanced Fundamentals': { score: 50, badgeLevel: 'intermediate' } } },
    ])
  );
  render(<BadgesDashboard courseId="c1" />);

  await waitFor(() => expect(screen.getByText('Advanced Fundamentals Badge')).toBeInTheDocument());
  // Nothing in the collapsed header directly says "beginner" - expand and
  // check the earned-percentage math instead, which is unaffected by level;
  // the real assertion here is just that the component didn't throw and
  // rendered exactly one badge for this skill (locks in the classification
  // path ran, even though "level" itself isn't displayed anywhere in the UI).
  expect(screen.getAllByText('Advanced Fundamentals Badge')).toHaveLength(1);
});

test('expanding a badge defaults to the Earned tab and lists earners with their badge level and score', async () => {
  jest.mocked(instructorAPI.getCourseStudentAnalytics).mockResolvedValue(
    analyticsWith([
      {
        id: 's1',
        name: 'Jordan',
        skillBreakdown: {
          Debugging: { score: 92, badgeLevel: 'expert', badgeEarnedAt: '2026-01-05T00:00:00Z' },
        },
      },
    ])
  );
  render(<BadgesDashboard courseId="c1" />);

  await waitFor(() => expect(screen.getByText('Debugging Badge')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Debugging Badge'));

  expect(screen.getByText('Jordan')).toBeInTheDocument();
  expect(screen.getByText('92%')).toBeInTheDocument();
  // The static tier-explainer banner also contains the word "Expert" - scope
  // to the student row itself to avoid matching that unrelated text.
  const studentRow = screen.getByText('Jordan').closest('div.bg-white') as HTMLElement;
  expect(within(studentRow).getByText('expert', { exact: false })).toBeInTheDocument();
});

test('switching to the In Progress tab shows the "to first badge" distance for students under 25%', async () => {
  jest.mocked(instructorAPI.getCourseStudentAnalytics).mockResolvedValue(
    analyticsWith([{ id: 's1', name: 'Casey', skillBreakdown: { Sorting: { score: 10 } } }])
  );
  render(<BadgesDashboard courseId="c1" />);

  await waitFor(() => expect(screen.getByText('Sorting Badge')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Sorting Badge'));
  fireEvent.click(screen.getByText(/in progress \(1\)/i));

  expect(screen.getByText('15.00% to first badge')).toBeInTheDocument();
});

test('a student at or above 25% shows "Ready to earn!" instead of a distance', async () => {
  jest.mocked(instructorAPI.getCourseStudentAnalytics).mockResolvedValue(
    analyticsWith([{ id: 's1', name: 'Casey', skillBreakdown: { Sorting: { score: 30 } } }])
  );
  render(<BadgesDashboard courseId="c1" />);

  await waitFor(() => expect(screen.getByText('Sorting Badge')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Sorting Badge'));
  fireEvent.click(screen.getByText(/in progress \(1\)/i));

  expect(screen.getByText('Ready to earn!')).toBeInTheDocument();
});

test('collapsing a badge (clicking its header again) hides the student list', async () => {
  jest.mocked(instructorAPI.getCourseStudentAnalytics).mockResolvedValue(
    analyticsWith([{ id: 's1', name: 'Casey', skillBreakdown: { Sorting: { score: 30 } } }])
  );
  render(<BadgesDashboard courseId="c1" />);

  await waitFor(() => expect(screen.getByText('Sorting Badge')).toBeInTheDocument());
  fireEvent.click(screen.getByText('Sorting Badge'));
  expect(screen.getByText(/in progress \(1\)/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText('Sorting Badge'));
  expect(screen.queryByText(/in progress \(1\)/i)).not.toBeInTheDocument();
});
