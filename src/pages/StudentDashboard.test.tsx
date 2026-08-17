import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import StudentDashboard from './StudentDashboard';

const mockAuthContext = {
  user: {
    id: 'student-1',
    name: 'Jordan Miller',
    email: 'jordan@example.com',
    role: 'student' as const,
    canvas_student_id: 'student-1',
  },
};

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

jest.mock('react-hot-toast', () => ({
  toast: { error: jest.fn(), success: jest.fn() },
}));

const mockGetCourses = jest.fn();
const mockGetSkillProgress = jest.fn();
const mockGetStudentEarnedBadges = jest.fn();

jest.mock('../services/api', () => ({
  canvasAPI: { getCourses: () => mockGetCourses() },
  progressAPI: { getSkillProgress: (...args: unknown[]) => mockGetSkillProgress(...args) },
  badgeAPI: { getStudentEarnedBadges: (...args: unknown[]) => mockGetStudentEarnedBadges(...args) },
}));

describe('StudentDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockGetCourses.mockResolvedValue({
      data: [{ id: 'course-1', name: 'Data Structures', code: 'COP3530', term: 1 }],
    });
    mockGetSkillProgress.mockResolvedValue({
      data: {
        student_id: 'student-1',
        course_id: 'course-1',
        skill_progress: {
          'Big-O Analysis': { score: 92, level: 'advanced', total_questions: 25, correct_answers: 23 },
        },
        last_updated: '2026-08-01T00:00:00Z',
      },
    });
    mockGetStudentEarnedBadges.mockResolvedValue({
      data: {
        student_id: 'student-1',
        total_badges: 1,
        badges: [
          {
            badge_id: 'badge-1',
            badge_name: 'Recursion Badge',
            skill_name: 'Recursion',
            badge_level: 'expert',
            progress_percentage: 92,
            earned_at: '2026-07-28T00:00:00Z',
            course_id: 'course-1',
            course_name: 'Data Structures',
          },
        ],
      },
    });
  });

  test('greets the student and renders computed stats after loading', async () => {
    render(<StudentDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Jordan/)).toBeInTheDocument();
    });

    expect(mockGetSkillProgress).toHaveBeenCalledWith('student-1', 'course-1');
    expect(mockGetStudentEarnedBadges).toHaveBeenCalledWith('student-1');

    // With only one attempted skill at 92%, the same number legitimately
    // appears three times: the mastery ring, its Top Skills row, and its
    // course's average in Course Overview.
    expect(screen.getAllByText('92%')).toHaveLength(3);
    // Top Skills list shows the skill name from progress data.
    expect(screen.getByText('Big-O Analysis')).toBeInTheDocument();
    // Recent Badges shows the earned badge's skill name.
    expect(screen.getByText('Recursion')).toBeInTheDocument();
    // Course Overview shows the course.
    expect(screen.getByText('Data Structures')).toBeInTheDocument();
  });

  test('shows an empty-state message when no skills have been attempted', async () => {
    mockGetSkillProgress.mockResolvedValue({
      data: {
        student_id: 'student-1',
        course_id: 'course-1',
        skill_progress: {},
        last_updated: '2026-08-01T00:00:00Z',
      },
    });
    mockGetStudentEarnedBadges.mockResolvedValue({
      data: { student_id: 'student-1', total_badges: 0, badges: [] },
    });

    render(<StudentDashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/your top skills will show up here/i)
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/no badges earned yet/i)).toBeInTheDocument();
  });
});
