import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';
import { authAPI, canvasInstructorAPI, instructorAPI, canvasAPI, progressAPI, badgeAPI } from './services/api';

// Mock the API service
jest.mock('./services/api', () => ({
  authAPI: {
    me: jest.fn().mockRejectedValue(new Error('Not authenticated')),
    login: jest.fn(),
    signup: jest.fn(),
    validateCanvasToken: jest.fn(),
  },
  canvasInstructorAPI: {
    getInstructorCourses: jest.fn().mockResolvedValue({ data: [] }),
  },
  instructorAPI: {
    getInstructorDashboard: jest.fn().mockResolvedValue({
      data: { totalCourses: 0, totalStudents: 0, averageProgress: 0, recentActivity: [] },
    }),
  },
  canvasAPI: {
    getCourses: jest.fn().mockResolvedValue({ data: [] }),
  },
  progressAPI: {
    getSkillProgress: jest.fn().mockResolvedValue({ data: { skill_progress: {} } }),
  },
  badgeAPI: {
    getStudentEarnedBadges: jest.fn().mockResolvedValue({ data: { badges: [] } }),
  },
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
  Toaster: () => <div data-testid="toaster" />,
}));

const asInstructor = () => ({
  id: 'instructor-1',
  name: 'Taylor Rivera',
  email: 'taylor@example.com',
  role: 'instructor',
});

const asStudent = () => ({
  id: 'student-1',
  name: 'Jamie Lee',
  email: 'jamie@example.com',
  role: 'student',
  canvas_student_id: 'student-1',
});

// Simulates a returning, already-authenticated user: a token is present, and
// the /me check the app makes on load resolves to that user.
const loginAs = (user: object) => {
  localStorage.setItem('token', 'fake-token');
  jest.mocked(authAPI.me).mockResolvedValueOnce({ data: { user } } as any);
};

const visit = (path: string) => {
  window.history.pushState({}, '', path);
};

// react-scripts' Jest config runs with `resetMocks: true`, which wipes every
// mock's implementation (not just its call history) before each test - so
// every mock used here needs its resolved value re-armed per test, not just
// once at jest.mock() factory time.
beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, '', '/');

  jest.mocked(authAPI.me).mockRejectedValue(new Error('Not authenticated'));
  jest.mocked(canvasInstructorAPI.getInstructorCourses).mockResolvedValue({ data: [] } as any);
  jest.mocked(instructorAPI.getInstructorDashboard).mockResolvedValue({
    data: { totalCourses: 0, totalStudents: 0, averageProgress: 0, recentActivity: [] },
  } as any);
  jest.mocked(canvasAPI.getCourses).mockResolvedValue({ data: [] } as any);
  jest.mocked(progressAPI.getSkillProgress).mockResolvedValue({ data: { skill_progress: {} } } as any);
  jest.mocked(badgeAPI.getStudentEarnedBadges).mockResolvedValue({ data: { badges: [] } } as any);
});

describe('App Component', () => {
  test('renders without crashing, with the toaster mounted', () => {
    render(<App />);
    expect(screen.getByTestId('toaster')).toBeInTheDocument();
  });

  test('shows the login page and its content when not authenticated', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/AchieveUp Portal/i)).toBeInTheDocument();
    });

    // Login form
    expect(screen.getByText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();

    // Feature list
    expect(screen.getByText(/AI-powered skill suggestions for your courses/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero-shot classification for quiz questions/i)).toBeInTheDocument();
    expect(screen.getByText(/Track course progress and skill mastery/i)).toBeInTheDocument();
    expect(screen.getByText(/Comprehensive analytics and insights/i)).toBeInTheDocument();
  });

  test('includes a working signup link', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("Don't have an account?")).toBeInTheDocument();
    });

    const signupLink = screen.getByText('Create account');
    expect(signupLink.closest('a')).toHaveAttribute('href', '/signup');
  });
});

// App.tsx's role-based route tree (RoleHome + RequireRole) is the actual
// access-control logic guarding every page - these tests exercise it through
// the real router rather than just re-checking rendered login-page text.
describe('Role-based routing', () => {
  test('sends an unauthenticated visit to "/" to the login page', async () => {
    visit('/');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/AchieveUp Portal/i)).toBeInTheDocument();
    });
    expect(window.location.pathname).toBe('/login');
  });

  test('sends an authenticated instructor from "/" to the instructor dashboard', async () => {
    loginAs(asInstructor());
    visit('/');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Transform your assessments/i)).toBeInTheDocument();
    });
    expect(window.location.pathname).toBe('/instructor-dashboard');
  });

  test('sends an authenticated student from "/" to the student dashboard', async () => {
    loginAs(asStudent());
    visit('/');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Here's an overview of your learning progress/i)).toBeInTheDocument();
    });
    expect(window.location.pathname).toBe('/student-dashboard');
  });

  test('redirects a student away from an instructor-only route to their own dashboard', async () => {
    loginAs(asStudent());
    visit('/instructor-dashboard');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Here's an overview of your learning progress/i)).toBeInTheDocument();
    });
    expect(window.location.pathname).toBe('/student-dashboard');
  });

  test('redirects an instructor away from the student-only dashboard to their own dashboard', async () => {
    loginAs(asInstructor());
    visit('/student-dashboard');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Transform your assessments/i)).toBeInTheDocument();
    });
    expect(window.location.pathname).toBe('/instructor-dashboard');
  });
});
