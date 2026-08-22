import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import DesktopHeader from './DesktopHeader';
import { User } from '../../../types';

const user: User = {
  id: 'instructor-1',
  name: 'Jane Instructor',
  email: 'jane@example.com',
  role: 'instructor',
  canvasTokenType: 'instructor',
};

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

const renderHeader = (props: Partial<React.ComponentProps<typeof DesktopHeader>> = {}) =>
  render(
    <Wrapper>
      <DesktopHeader
        user={user}
        displayAsInstructor
        canSwitchToStudentView={false}
        viewingAsStudent={false}
        onHelpClick={jest.fn()}
        onLogout={jest.fn()}
        {...props}
      />
    </Wrapper>
  );

describe('DesktopHeader', () => {
  test('renders a search input and the user menu trigger', () => {
    renderHeader();
    expect(screen.getByPlaceholderText(/search skills or courses/i)).toBeInTheDocument();
    expect(screen.getByText('Jane Instructor')).toBeInTheDocument();
  });

  test('hides the switch-view link when canSwitchToStudentView is false', () => {
    renderHeader({ canSwitchToStudentView: false });
    expect(screen.queryByText(/view as student/i)).not.toBeInTheDocument();
  });

  test('shows "View as Student" pointing at /student-dashboard when eligible', () => {
    renderHeader({ canSwitchToStudentView: true, viewingAsStudent: false });
    const link = screen.getByRole('link', { name: /view as student/i });
    expect(link).toHaveAttribute('href', '/student-dashboard');
  });

  test('shows "Back to Instructor" pointing at /instructor-dashboard while viewing as student', () => {
    renderHeader({ canSwitchToStudentView: true, viewingAsStudent: true });
    const link = screen.getByRole('link', { name: /back to instructor/i });
    expect(link).toHaveAttribute('href', '/instructor-dashboard');
  });
});
