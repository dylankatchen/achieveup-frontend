import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import StudentPortalLayout from './StudentPortalLayout';

const mockLogout = jest.fn();
const mockAuthContext = {
  user: { id: 'student-1', name: 'Jordan Miller', email: 'jordan@example.com', role: 'student' as const },
  logout: mockLogout,
  isInstructor: false,
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

const renderLayout = () =>
  render(
    <BrowserRouter>
      <StudentPortalLayout>
        <div>page content</div>
      </StudentPortalLayout>
    </BrowserRouter>
  );

describe('StudentPortalLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders sidebar nav, page content, and the user name', () => {
    renderLayout();

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Courses')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Badges')).toBeInTheDocument();
    expect(screen.getByText('page content')).toBeInTheDocument();
    expect(screen.getByText('Jordan Miller')).toBeInTheDocument();
  });

  test('not-yet-built nav items are disabled', () => {
    renderLayout();

    expect(screen.getByText('Courses').closest('button')).toBeDisabled();
    expect(screen.getByText('Skills').closest('button')).toBeDisabled();
    expect(screen.getByText('Badges').closest('button')).toBeDisabled();
  });

  test('opens the profile menu and logs out', () => {
    renderLayout();

    fireEvent.click(screen.getByText('Jordan Miller'));
    const logoutButton = screen.getByText('Log out');
    expect(logoutButton).toBeInTheDocument();

    fireEvent.click(logoutButton);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  test('does not show "Back to Instructor" for a plain student account', () => {
    renderLayout();

    fireEvent.click(screen.getByText('Jordan Miller'));
    expect(screen.queryByText('Back to Instructor')).not.toBeInTheDocument();
  });
});
