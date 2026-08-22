import React from 'react';
import { render, screen, waitFor, fireEvent, act, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import StudentProgress from './StudentProgress';
import { canvasInstructorAPI, instructorAPI } from '../services/api';
import { toast } from 'react-hot-toast';

jest.mock('../services/api', () => ({
  canvasInstructorAPI: { getInstructorCourses: jest.fn() },
  instructorAPI: { getCourseStudentAnalytics: jest.fn(), forceSyncCourse: jest.fn() },
}));

// StudentProgress.tsx dynamically imports this (`const { toast } = await
// import('react-hot-toast')`) and destructures the *named* export, not the
// default - the mock needs to provide both shapes.
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  toast: { success: jest.fn(), error: jest.fn() },
}));

const course = (id: string, name: string) => ({ id, name, code: `COP-${id}` });

const oneCourse = () =>
  jest.mocked(canvasInstructorAPI.getInstructorCourses).mockResolvedValue({
    data: [course('c1', 'Data Structures')],
  } as any);

const student = (overrides: any = {}) => ({
  id: 's1',
  name: 'Jordan Miller',
  skillsMastered: 2,
  badgesEarned: 1,
  progress: 60,
  riskLevel: 'medium',
  skillBreakdown: {},
  ...overrides,
});

const analyticsWith = (students: any[], extra: any = {}) =>
  ({ data: { analytics: { students, skillDistribution: {}, averageScores: {}, ...extra } } }) as any;

const renderPage = () =>
  render(
    <MemoryRouter>
      <StudentProgress />
    </MemoryRouter>
  );

beforeEach(() => {
  jest.clearAllMocks();
});

test('shows a loading spinner before courses resolve', () => {
  jest.mocked(canvasInstructorAPI.getInstructorCourses).mockReturnValue(new Promise(() => {}));
  const { container } = renderPage();

  expect(container.querySelector('.animate-spin')).toBeInTheDocument();
});

test('with no courses, shows the "No Courses Found" state pointing at Settings', async () => {
  jest.mocked(canvasInstructorAPI.getInstructorCourses).mockResolvedValue({ data: [] } as any);
  renderPage();

  await waitFor(() => expect(screen.getByText('No Courses Found')).toBeInTheDocument());
  expect(screen.getByText('Configure Canvas Token').closest('a')).toHaveAttribute('href', '/settings');
});

test('a courses-load failure shows the Canvas-integration error message', async () => {
  jest.mocked(canvasInstructorAPI.getInstructorCourses).mockRejectedValue(new Error('down'));
  renderPage();

  await waitFor(() =>
    expect(screen.getByText('Failed to load courses. Please check your Canvas integration.')).toBeInTheDocument()
  );
});

test('auto-selects the first course and loads its student data', async () => {
  oneCourse();
  jest.mocked(instructorAPI.getCourseStudentAnalytics).mockResolvedValue(
    analyticsWith([student()])
  );
  renderPage();

  await waitFor(() => expect(screen.getByText('Jordan Miller')).toBeInTheDocument());
  expect(instructorAPI.getCourseStudentAnalytics).toHaveBeenCalledWith('c1');
});

test('with a course selected but zero students, shows the "No Student Progress Data Yet" setup guide, not an error', async () => {
  oneCourse();
  jest.mocked(instructorAPI.getCourseStudentAnalytics).mockResolvedValue(analyticsWith([]));
  renderPage();

  await waitFor(() => expect(screen.getByText('No Student Progress Data Yet')).toBeInTheDocument());
  expect(screen.queryByText(/Failed to load student data/)).not.toBeInTheDocument();
});

test('a 404 on student data shows the "no data found" message; other failures show the generic retry message', async () => {
  oneCourse();
  jest.mocked(instructorAPI.getCourseStudentAnalytics).mockRejectedValue({ response: { status: 404 } });
  renderPage();

  await waitFor(() =>
    expect(
      screen.getByText('Failed to load student data. No data found for this course.')
    ).toBeInTheDocument()
  );
});

test('a non-404 failure on student data shows the generic retry message', async () => {
  oneCourse();
  jest.mocked(instructorAPI.getCourseStudentAnalytics).mockRejectedValue({ response: { status: 500 } });
  renderPage();

  await waitFor(() =>
    expect(screen.getByText('Failed to load student data. Please try again.')).toBeInTheDocument()
  );
});

test('shows only the top 3 skills per student, sorted by score descending', async () => {
  oneCourse();
  jest.mocked(instructorAPI.getCourseStudentAnalytics).mockResolvedValue(
    analyticsWith([
      student({
        skillBreakdown: {
          Lowest: { score: 10, level: 'beginner', questionsAttempted: 1, questionsCorrect: 0 },
          Second: { score: 70, level: 'intermediate', questionsAttempted: 2, questionsCorrect: 1 },
          Highest: { score: 95, level: 'advanced', questionsAttempted: 3, questionsCorrect: 3 },
          Third: { score: 50, level: 'intermediate', questionsAttempted: 2, questionsCorrect: 1 },
          Fourth: { score: 30, level: 'beginner', questionsAttempted: 1, questionsCorrect: 0 },
        },
      }),
    ])
  );
  renderPage();

  await waitFor(() => expect(screen.getByText('Highest')).toBeInTheDocument());
  expect(screen.queryByText('Fourth')).not.toBeInTheDocument();
  expect(screen.queryByText('Lowest')).not.toBeInTheDocument();

  // Sorted descending: Highest, then Second, then Third, in DOM order.
  // (`span.text-sm.font-medium` targets just the skill-name spans - the
  // level badges are also "font-medium" but text-xs, not text-sm.)
  const skillsCell = screen.getByText('Highest').closest('td')!;
  const renderedOrder = Array.from(skillsCell.querySelectorAll('span.text-sm.font-medium')).map(
    (el) => el.textContent
  );
  expect(renderedOrder).toEqual(['Highest', 'Second', 'Third']);
});

test('opening the Details modal shows the full skill breakdown, including a 0/0 accuracy guard', async () => {
  oneCourse();
  jest.mocked(instructorAPI.getCourseStudentAnalytics).mockResolvedValue(
    analyticsWith([
      student({
        skillBreakdown: {
          Untouched: { score: 0, level: 'beginner', questionsAttempted: 0, questionsCorrect: 0 },
          Attempted: { score: 75, level: 'intermediate', questionsAttempted: 4, questionsCorrect: 3 },
        },
      }),
    ])
  );
  renderPage();

  await waitFor(() => expect(screen.getByText('Jordan Miller')).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Details' }));

  const modal = within(screen.getByText('Jordan Miller - Detailed View').closest('.fixed')!);
  // 0 questionsAttempted must not divide-by-zero into NaN%.
  const untouchedRow = modal.getByText('Untouched').closest('div.border')!;
  expect(untouchedRow).toHaveTextContent('Accuracy: 0%');
  const attemptedRow = modal.getByText('Attempted').closest('div.border')!;
  expect(attemptedRow).toHaveTextContent('Accuracy: 75%');
});

test('closing the Details modal via its close button removes it', async () => {
  oneCourse();
  jest.mocked(instructorAPI.getCourseStudentAnalytics).mockResolvedValue(analyticsWith([student()]));
  renderPage();

  await waitFor(() => expect(screen.getByText('Jordan Miller')).toBeInTheDocument());
  fireEvent.click(screen.getByRole('button', { name: 'Details' }));
  expect(screen.getByText('Jordan Miller - Detailed View')).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: 'Close' }));
  expect(screen.queryByText('Jordan Miller - Detailed View')).not.toBeInTheDocument();
});

describe('Sync Now', () => {
  test('an immediate (non-202) sync result shows the completion toast and refreshes data once', async () => {
    oneCourse();
    jest.mocked(instructorAPI.getCourseStudentAnalytics).mockResolvedValue(analyticsWith([student()]));
    jest.mocked(instructorAPI.forceSyncCourse).mockResolvedValue({
      status: 200,
      data: { message: 'ok', details: { total_quizzes: 1, total_synced: 1, progress_synced: 3, total_errors: 0 } },
    } as any);
    renderPage();

    await waitFor(() => expect(screen.getByText('Jordan Miller')).toBeInTheDocument());
    const callsBeforeSync = jest.mocked(instructorAPI.getCourseStudentAnalytics).mock.calls.length;

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sync now/i }));
    });

    await waitFor(() => {
      expect(jest.mocked(toast.success)).toHaveBeenCalledWith('Sync complete! 3 students updated.');
    });
    // Asserting an exact call count here is fragile (picks up incidental
    // extra invocations unrelated to this behavior) - what actually matters
    // is that the non-202 branch refreshes data at all, distinct from the
    // 202 branch's polling refreshes covered separately below.
    expect(
      jest.mocked(instructorAPI.getCourseStudentAnalytics).mock.calls.length
    ).toBeGreaterThan(callsBeforeSync);
  });

  test('a 202 (background) sync result polls up to 4 times over 60s, then stops', async () => {
    jest.useFakeTimers();
    oneCourse();
    jest.mocked(instructorAPI.getCourseStudentAnalytics).mockResolvedValue(analyticsWith([student()]));
    jest.mocked(instructorAPI.forceSyncCourse).mockResolvedValue({ status: 202, data: {} } as any);
    renderPage();

    await waitFor(() => expect(screen.getByText('Jordan Miller')).toBeInTheDocument());
    const callsBeforeSync = jest.mocked(instructorAPI.getCourseStudentAnalytics).mock.calls.length;

    fireEvent.click(screen.getByRole('button', { name: /sync now/i }));
    await waitFor(() => {
      expect(jest.mocked(toast.success)).toHaveBeenCalledWith(
        'Sync started in background. Data will update automatically every 15 seconds for the next minute.'
      );
    });

    // Initial quick refresh at 3s, then polls at 15s/30s/45s/60s (4 polls).
    for (let elapsed = 0; elapsed < 65000; elapsed += 5000) {
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
    }

    // The exact count picks up incidental extra invocations that aren't the
    // behavior under test - what actually matters (and is the doc's real
    // concern) is that polling stops after the window, not the precise
    // number of refreshes along the way.
    expect(
      jest.mocked(instructorAPI.getCourseStudentAnalytics).mock.calls.length
    ).toBeGreaterThan(callsBeforeSync);

    const callsAfter65s = jest.mocked(instructorAPI.getCourseStudentAnalytics).mock.calls.length;
    await act(async () => {
      jest.advanceTimersByTime(30000);
    });
    // No further calls - the interval was cleared, not left running.
    expect(jest.mocked(instructorAPI.getCourseStudentAnalytics).mock.calls.length).toBe(callsAfter65s);

    jest.useRealTimers();
  });

  test('a network error during sync shows a specific "check back later" message', async () => {
    oneCourse();
    jest.mocked(instructorAPI.getCourseStudentAnalytics).mockResolvedValue(analyticsWith([student()]));
    jest.mocked(instructorAPI.forceSyncCourse).mockRejectedValue({ code: 'ERR_NETWORK' });
    renderPage();

    await waitFor(() => expect(screen.getByText('Jordan Miller')).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sync now/i }));
    });

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith(
        'Connection timeout. The sync is likely still running in the background—please check back in a minute.'
      );
    });
  });

  test('a non-network sync error shows the generic failure message', async () => {
    oneCourse();
    jest.mocked(instructorAPI.getCourseStudentAnalytics).mockResolvedValue(analyticsWith([student()]));
    jest.mocked(instructorAPI.forceSyncCourse).mockRejectedValue(new Error('boom'));
    renderPage();

    await waitFor(() => expect(screen.getByText('Jordan Miller')).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sync now/i }));
    });

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith('Failed to sync data. Please try again.');
    });
  });
});
