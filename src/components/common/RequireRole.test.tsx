import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import RequireRole from './RequireRole';
import { useAuth } from '../../contexts/AuthContext';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const instructorUser = {
  id: 'i1',
  name: 'Jane',
  email: 'jane@example.com',
  role: 'instructor' as const,
  canvasTokenType: 'instructor' as const,
};
const studentUser = {
  id: 's1',
  name: 'Sam',
  email: 'sam@example.com',
  role: 'student' as const,
  canvasTokenType: 'student' as const,
};

const mockAuth = (overrides: Partial<ReturnType<typeof useAuth>>) => {
  jest.mocked(useAuth).mockReturnValue({
    user: null,
    loading: false,
    isAuthenticated: false,
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    backendAvailable: true,
    isInstructor: false,
    isStudent: false,
    ...overrides,
  });
};

// RequireRole is the actual security boundary for every protected route -
// this renders it inside a real route tree (not just in isolation) so
// <Navigate>/<Outlet> behavior is exercised for real, the same way the
// browser would hit it.
const renderGuarded = (initialPath: string, roles?: Array<'student' | 'instructor'>) =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/instructor-dashboard" element={<div>Instructor Dashboard</div>} />
        <Route path="/student-dashboard" element={<div>Student Dashboard</div>} />
        <Route element={<RequireRole roles={roles} />}>
          <Route path="/protected" element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );

describe('RequireRole', () => {
  test('shows a spinner while auth state is loading, rendering nothing else', () => {
    mockAuth({ loading: true });
    const { container } = renderGuarded('/protected', ['instructor']);

    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });

  test('redirects an unauthenticated visitor to /login', () => {
    mockAuth({ isAuthenticated: false, user: null });
    renderGuarded('/protected', ['instructor']);

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  test('an authenticated user with no role logs out and redirects to /login', () => {
    const logout = jest.fn();
    mockAuth({
      isAuthenticated: true,
      user: { id: 'x', name: 'X', email: 'x@example.com', role: '' as any, canvasTokenType: 'instructor' },
      logout,
    });
    renderGuarded('/protected', ['instructor']);

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(logout).toHaveBeenCalledTimes(1);
  });

  test('a matching role passes through and renders the protected route', () => {
    mockAuth({ isAuthenticated: true, user: instructorUser, isInstructor: true });
    renderGuarded('/protected', ['instructor']);

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('with no roles prop, any authenticated user passes through', () => {
    mockAuth({ isAuthenticated: true, user: studentUser, isStudent: true });
    renderGuarded('/protected', undefined);

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('a student hitting an instructor-only route is redirected to their own dashboard, not a blank/error page', () => {
    mockAuth({ isAuthenticated: true, user: studentUser, isStudent: true });
    renderGuarded('/protected', ['instructor']);

    expect(screen.getByText('Student Dashboard')).toBeInTheDocument();
  });

  test('an instructor hitting a student-only route (without student access) is redirected to their own dashboard', () => {
    mockAuth({ isAuthenticated: true, user: instructorUser, isInstructor: true });
    renderGuarded('/protected', ['student']);

    expect(screen.getByText('Instructor Dashboard')).toBeInTheDocument();
  });

  test('an instructor WITH has_student_access is let into a student-only route', () => {
    mockAuth({
      isAuthenticated: true,
      user: { ...instructorUser, has_student_access: true },
      isInstructor: true,
    });
    renderGuarded('/protected', ['student']);

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('an instructor WITHOUT has_student_access does not get the same carve-out', () => {
    mockAuth({
      isAuthenticated: true,
      user: { ...instructorUser, has_student_access: false },
      isInstructor: true,
    });
    renderGuarded('/protected', ['student']);

    expect(screen.getByText('Instructor Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
