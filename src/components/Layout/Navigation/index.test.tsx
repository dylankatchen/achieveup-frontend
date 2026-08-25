import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { User } from '../../../types';
import Navigation from './index';

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../services/api', () => ({
  canvasAPI: {
    getCourses: jest.fn().mockResolvedValue({ data: [] }),
    getInstructorCourses: jest.fn().mockResolvedValue({ data: [] }),
  },
}));

const instructorUser: User = {
  id: 'instructor-1',
  name: 'Jane Instructor',
  email: 'jane@example.com',
  role: 'instructor',
  canvasTokenType: 'instructor',
};

const studentUser: User = {
  id: 'student-1',
  name: 'Sam Student',
  email: 'sam@example.com',
  role: 'student',
  canvasTokenType: 'student',
};

const mockAuth = (overrides: {
  user: User | null;
  isInstructor: boolean;
  isStudent: boolean;
}) => {
  jest.mocked(useAuth).mockReturnValue({
    logout: jest.fn(),
    backendAvailable: true,
    isAuthenticated: true,
    loading: false,
    login: jest.fn(),
    signup: jest.fn(),
    refreshUser: jest.fn(),
    ...overrides,
  });
};

const renderAt = (path: string) => {
  window.history.pushState({}, '', path);
  return render(
    <BrowserRouter>
      <Navigation />
    </BrowserRouter>
  );
};

describe('Navigation (index)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('role/route-based derivation', () => {
    test('instructor without student access sees the instructor items and no switch link', () => {
      mockAuth({ user: instructorUser, isInstructor: true, isStudent: false });
      renderAt('/');

      expect(screen.getByRole('link', { name: /skill matrix/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /^courses$/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/view as student/i)).not.toBeInTheDocument();
    });

    test('student sees the student items and no switch link', () => {
      mockAuth({ user: studentUser, isInstructor: false, isStudent: true });
      renderAt('/student-dashboard');

      expect(screen.getByRole('link', { name: /^courses$/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /skill matrix/i })).not.toBeInTheDocument();
      expect(screen.queryByText(/view as student/i)).not.toBeInTheDocument();
    });

    test('instructor with student access on an instructor route sees instructor items plus "View as Student"', () => {
      mockAuth({
        user: { ...instructorUser, has_student_access: true },
        isInstructor: true,
        isStudent: false,
      });
      renderAt('/');

      expect(screen.getByRole('link', { name: /skill matrix/i })).toBeInTheDocument();
      const link = screen.getByRole('link', { name: /view as student/i });
      expect(link).toHaveAttribute('href', '/student-dashboard');
    });

    test('instructor with student access on /student-dashboard is treated as viewing-as-student: student items plus "Back to Instructor"', () => {
      mockAuth({
        user: { ...instructorUser, has_student_access: true },
        isInstructor: true,
        isStudent: false,
      });
      renderAt('/student-dashboard');

      expect(screen.getByRole('link', { name: /^courses$/i })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: /skill matrix/i })).not.toBeInTheDocument();
      const link = screen.getByRole('link', { name: /back to instructor/i });
      expect(link).toHaveAttribute('href', '/instructor-dashboard');
    });

    test('instructor WITHOUT student access still sees instructor items even directly on /student-dashboard (no route guard here, just display logic)', () => {
      mockAuth({ user: instructorUser, isInstructor: true, isStudent: false });
      renderAt('/student-dashboard');

      // viewingAsStudent requires canSwitchToStudentView, which requires has_student_access.
      // Without it, displayAsInstructor stays true regardless of pathname.
      expect(screen.getByRole('link', { name: /skill matrix/i })).toBeInTheDocument();
      expect(screen.queryByText(/back to instructor/i)).not.toBeInTheDocument();
    });
  });

  describe('mobile menu toggle', () => {
    test('mobile nav drawer is closed by default, opens on hamburger click, closes again on a second click', () => {
      mockAuth({ user: instructorUser, isInstructor: true, isStudent: false });
      renderAt('/');

      expect(screen.getAllByRole('link', { name: /skill matrix/i })).toHaveLength(1);

      const toggle = screen.getByRole('button', { name: /toggle navigation menu/i });
      fireEvent.click(toggle);
      expect(screen.getAllByRole('link', { name: /skill matrix/i })).toHaveLength(2);

      fireEvent.click(toggle);
      expect(screen.getAllByRole('link', { name: /skill matrix/i })).toHaveLength(1);
    });
  });

  describe('help modal', () => {
    test('opens from the desktop sidebar "How It Works" button and closes via its own close button', () => {
      mockAuth({ user: instructorUser, isInstructor: true, isStudent: false });
      renderAt('/');

      expect(screen.queryByRole('heading', { name: /how achieveup works/i })).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /how it works/i }));
      expect(screen.getByRole('heading', { name: /how achieveup works/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(screen.queryByRole('heading', { name: /how achieveup works/i })).not.toBeInTheDocument();
    });
  });
});
