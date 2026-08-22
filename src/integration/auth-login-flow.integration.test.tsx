import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { authAPI, canvasInstructorAPI, instructorAPI, canvasAPI, progressAPI, badgeAPI } from '../services/api';
import toast from 'react-hot-toast';

// Unlike Login.test.tsx / Signup.test.tsx (which mock AuthContext away) or
// App.test.tsx's role-routing tests (which bypass the form via a pre-set
// token), these exercise the real AuthContext + real form submission end to
// end: type credentials, submit, and confirm the real login()/signup() call
// into the (mocked) API layer results in the right redirect.
jest.mock('../services/api', () => ({
  authAPI: {
    me: jest.fn(),
    login: jest.fn(),
    signup: jest.fn(),
  },
  canvasInstructorAPI: {
    getInstructorCourses: jest.fn(),
  },
  instructorAPI: {
    getInstructorDashboard: jest.fn(),
  },
  canvasAPI: {
    getCourses: jest.fn(),
  },
  progressAPI: {
    getSkillProgress: jest.fn(),
  },
  badgeAPI: {
    getStudentEarnedBadges: jest.fn(),
  },
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  toast: { success: jest.fn(), error: jest.fn() },
  Toaster: () => <div data-testid="toaster" />,
}));

const instructor = {
  id: 'instructor-1',
  name: 'Taylor Rivera',
  email: 'taylor@example.com',
  role: 'instructor',
};

const validToken = '7~' + 'a'.repeat(62);

beforeEach(() => {
  localStorage.clear();
  window.history.pushState({}, '', '/login');

  jest.mocked(authAPI.me).mockRejectedValue(new Error('Not authenticated'));
  jest.mocked(canvasInstructorAPI.getInstructorCourses).mockResolvedValue({ data: [] } as any);
  jest.mocked(instructorAPI.getInstructorDashboard).mockResolvedValue({
    data: { totalCourses: 0, totalStudents: 0, averageProgress: 0, recentActivity: [] },
  } as any);
  jest.mocked(canvasAPI.getCourses).mockResolvedValue({ data: [] } as any);
  jest.mocked(progressAPI.getSkillProgress).mockResolvedValue({ data: { skill_progress: {} } } as any);
  jest.mocked(badgeAPI.getStudentEarnedBadges).mockResolvedValue({ data: { badges: [] } } as any);
});

describe('auth login flow (real AuthContext, real form)', () => {
  test('submitting valid credentials logs in and lands on the dashboard', async () => {
    jest.mocked(authAPI.login).mockResolvedValue({ data: { token: 'fake-token', user: instructor } } as any);
    jest.mocked(authAPI.me).mockResolvedValue({ data: { user: instructor } } as any);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/AchieveUp Portal/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'taylor@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), {
      target: { value: 'correct-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Transform your assessments/i)).toBeInTheDocument();
    });
    expect(window.location.pathname).toBe('/instructor-dashboard');
    expect(jest.mocked(authAPI.login)).toHaveBeenCalledWith({
      email: 'taylor@example.com',
      password: 'correct-password',
    });
    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(jest.mocked(toast.success)).toHaveBeenCalledWith('Welcome back!');
  });

  test('invalid credentials show a real error toast and keep the user on the login page', async () => {
    jest.mocked(authAPI.login).mockRejectedValue({
      response: { data: { message: 'Invalid email or password' } },
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/AchieveUp Portal/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'taylor@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(jest.mocked(toast.error)).toHaveBeenCalledWith('Invalid email or password');
    });
    expect(window.location.pathname).toBe('/login');
    expect(localStorage.getItem('token')).toBeNull();
  });

  test('signing up through the real form logs the new user in and redirects them', async () => {
    jest.mocked(authAPI.signup).mockResolvedValue({ data: { token: 'new-token', user: instructor } } as any);
    jest.mocked(authAPI.me).mockResolvedValue({ data: { user: instructor } } as any);

    window.history.pushState({}, '', '/signup');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Taylor Rivera' } });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'taylor@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'Password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password123' } });
    fireEvent.change(screen.getByLabelText(/canvas api token/i), { target: { value: validToken } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/Transform your assessments/i)).toBeInTheDocument();
    });
    expect(window.location.pathname).toBe('/instructor-dashboard');
    expect(localStorage.getItem('token')).toBe('new-token');
  });

  test('logging out clears the token and returns to the login page', async () => {
    localStorage.setItem('token', 'existing-token');
    jest.mocked(authAPI.me).mockResolvedValue({ data: { user: instructor } } as any);
    window.history.pushState({}, '', '/');

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Transform your assessments/i)).toBeInTheDocument();
    });

    // DesktopSidebar's own Logout button is always in the DOM (unlike the one
    // inside UserMenu's dropdown, which only mounts on hover) - use it
    // directly rather than opening the dropdown and having two matches.
    fireEvent.click(screen.getByRole('button', { name: /logout/i }));

    await waitFor(() => {
      expect(screen.getByText(/AchieveUp Portal/i)).toBeInTheDocument();
    });
    expect(window.location.pathname).toBe('/login');
    expect(localStorage.getItem('token')).toBeNull();
  });
});
