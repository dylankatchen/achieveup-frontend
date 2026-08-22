import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import AccountMenu from './AccountMenu';
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

const renderMenu = (props: Partial<React.ComponentProps<typeof AccountMenu>> = {}) =>
  render(
    <Wrapper>
      <AccountMenu displayAsInstructor onHelpClick={jest.fn()} onLogout={jest.fn()} {...props} />
    </Wrapper>
  );

describe('AccountMenu', () => {
  test('always shows Settings and Logout', () => {
    renderMenu();
    expect(screen.getByRole('link', { name: /settings/i })).toHaveAttribute('href', '/settings');
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });

  test('shows "How It Works" for instructors', () => {
    renderMenu({ displayAsInstructor: true });
    expect(screen.getByRole('button', { name: /how it works/i })).toBeInTheDocument();
  });

  test('hides "How It Works" for students', () => {
    renderMenu({ displayAsInstructor: false });
    expect(screen.queryByRole('button', { name: /how it works/i })).not.toBeInTheDocument();
  });

  test('clicking "How It Works" fires onHelpClick and onItemClick', () => {
    const onHelpClick = jest.fn();
    const onItemClick = jest.fn();
    renderMenu({ displayAsInstructor: true, onHelpClick, onItemClick });

    fireEvent.click(screen.getByRole('button', { name: /how it works/i }));
    expect(onHelpClick).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledTimes(1);
  });

  test('clicking Logout fires onLogout and onItemClick', () => {
    const onLogout = jest.fn();
    const onItemClick = jest.fn();
    renderMenu({ onLogout, onItemClick });

    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(onItemClick).toHaveBeenCalledTimes(1);
  });

  test('hides the switch-view link when canSwitchToStudentView is false', () => {
    renderMenu({ canSwitchToStudentView: false });
    expect(screen.queryByText(/view as student/i)).not.toBeInTheDocument();
  });

  test('shows "View as Student" pointing at /student-dashboard when eligible', () => {
    renderMenu({ canSwitchToStudentView: true, viewingAsStudent: false });
    const link = screen.getByRole('link', { name: /view as student/i });
    expect(link).toHaveAttribute('href', '/student-dashboard');
  });

  test('shows "Back to Instructor" pointing at /instructor-dashboard while viewing as student', () => {
    renderMenu({ canSwitchToStudentView: true, viewingAsStudent: true });
    const link = screen.getByRole('link', { name: /back to instructor/i });
    expect(link).toHaveAttribute('href', '/instructor-dashboard');
  });

  test('does not show the identity block by default', () => {
    renderMenu({ user });
    expect(screen.queryByText('Jane Instructor')).not.toBeInTheDocument();
  });

  test('shows name and role in the identity block when showIdentity is true', () => {
    renderMenu({ user, showIdentity: true, displayAsInstructor: true });
    expect(screen.getByText('Jane Instructor')).toBeInTheDocument();
    expect(screen.getByText('Instructor')).toBeInTheDocument();
  });

  test('identity block falls back to email, then "User", when name is missing', () => {
    const { rerender } = renderMenu({ user: { ...user, name: '' }, showIdentity: true });
    expect(screen.getByText(user.email)).toBeInTheDocument();

    rerender(
      <Wrapper>
        <AccountMenu
          displayAsInstructor
          onHelpClick={jest.fn()}
          onLogout={jest.fn()}
          user={null}
          showIdentity
        />
      </Wrapper>
    );
    expect(screen.getByText('User')).toBeInTheDocument();
  });
});
