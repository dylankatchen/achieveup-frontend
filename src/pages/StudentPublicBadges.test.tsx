import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import StudentPublicBadges from './StudentPublicBadges';
import { badgeAPI } from '../services/api';

jest.mock('../services/api', () => ({
  badgeAPI: {
    getPublicStudentBadges: jest.fn(),
  },
}));

const badge = {
  badge_id: 'b1',
  badge_name: 'HTML Fundamentals',
  skill_name: 'HTML',
  badge_level: 'advanced',
  progress_percentage: 87.5,
  earned_at: '2026-03-14T00:00:00Z',
  course_id: 'c1',
  course_name: 'Web Dev',
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/badges/:studentId" element={<StudentPublicBadges />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  jest.clearAllMocks();
  Object.assign(navigator, {
    clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
  });
});

test('shows a loading spinner before the API resolves', () => {
  jest.mocked(badgeAPI.getPublicStudentBadges).mockReturnValue(new Promise(() => {}));
  const { container } = renderAt('/badges/s1');

  expect(container.querySelector('.animate-spin')).toBeInTheDocument();
});

test('renders badges once loaded, with proficiency and earned-date formatting', async () => {
  jest.mocked(badgeAPI.getPublicStudentBadges).mockResolvedValue({
    data: { student_id: 's1', total_badges: 1, badges: [badge] },
  } as any);

  renderAt('/badges/s1');

  // Badge name renders twice per card (banner + detail body) - by design.
  await waitFor(() => expect(screen.getAllByText('HTML Fundamentals')).toHaveLength(2));
  expect(screen.getByText('87.50%')).toBeInTheDocument();
  // Computed the same way the component does, rather than hardcoded, so
  // this doesn't depend on the test runner's local timezone.
  const expectedDate = new Date(badge.earned_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  expect(screen.getByText(expectedDate)).toBeInTheDocument();
});

test('a valid response with zero badges shows "No Badges Yet", not the error state', async () => {
  jest.mocked(badgeAPI.getPublicStudentBadges).mockResolvedValue({
    data: { student_id: 's1', total_badges: 0, badges: [] },
  } as any);

  renderAt('/badges/s1');

  await waitFor(() => expect(screen.getByText('No Badges Yet')).toBeInTheDocument());
  expect(screen.queryByText('Error Loading Badges')).not.toBeInTheDocument();
});

test('a failed request shows the distinct error state with a way back to login', async () => {
  jest.mocked(badgeAPI.getPublicStudentBadges).mockRejectedValue({
    response: { data: { message: 'Student not found' } },
  });

  renderAt('/badges/s1');

  await waitFor(() => expect(screen.getByText('Error Loading Badges')).toBeInTheDocument());
  expect(screen.getByText('Student not found')).toBeInTheDocument();
  expect(screen.getByText('Return to Login').closest('a')).toHaveAttribute('href', '/login');
  expect(screen.queryByText('No Badges Yet')).not.toBeInTheDocument();
});

test('?name= in the URL takes precedence over the API response student_name and is never overwritten', async () => {
  jest.mocked(badgeAPI.getPublicStudentBadges).mockResolvedValue({
    data: { student_id: 's1', student_name: 'API Name', total_badges: 0, badges: [] },
  } as any);

  renderAt('/badges/s1?name=Query%20Name');

  await waitFor(() => expect(screen.getByText("Query Name's Achievements")).toBeInTheDocument());
  expect(screen.queryByText("API Name's Achievements")).not.toBeInTheDocument();
});

test('with no ?name= in the URL, falls back to the API response student_name', async () => {
  jest.mocked(badgeAPI.getPublicStudentBadges).mockResolvedValue({
    data: { student_id: 's1', student_name: 'API Name', total_badges: 0, badges: [] },
  } as any);

  renderAt('/badges/s1');

  await waitFor(() => expect(screen.getByText("API Name's Achievements")).toBeInTheDocument());
});

test('with neither a query name nor an API name, shows the generic heading', async () => {
  jest.mocked(badgeAPI.getPublicStudentBadges).mockResolvedValue({
    data: { student_id: 's1', total_badges: 0, badges: [] },
  } as any);

  renderAt('/badges/s1');

  await waitFor(() => expect(screen.getByText('Student Achievements')).toBeInTheDocument());
});

test('Share Profile copies the current URL and shows a temporary confirmation', async () => {
  jest.useFakeTimers();
  jest.mocked(badgeAPI.getPublicStudentBadges).mockResolvedValue({
    data: { student_id: 's1', total_badges: 0, badges: [] },
  } as any);

  renderAt('/badges/s1');
  await waitFor(() => expect(screen.getByText('Share Profile')).toBeInTheDocument());

  await act(async () => {
    fireEvent.click(screen.getByText('Share Profile'));
  });

  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(window.location.href);
  expect(screen.getByText('Copied to Clipboard!')).toBeInTheDocument();

  act(() => {
    jest.advanceTimersByTime(2000);
  });
  expect(screen.getByText('Share Profile')).toBeInTheDocument();

  jest.useRealTimers();
});
