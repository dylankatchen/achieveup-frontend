import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import MobileHeader from './MobileHeader';
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

const renderHeader = (props: Partial<React.ComponentProps<typeof MobileHeader>> = {}) =>
  render(
    <Wrapper>
      <MobileHeader
        isNavOpen={false}
        onToggleNav={jest.fn()}
        displayAsInstructor
        canSwitchToStudentView={false}
        viewingAsStudent={false}
        user={user}
        onHelpClick={jest.fn()}
        onLogout={jest.fn()}
        {...props}
      />
    </Wrapper>
  );

describe('MobileHeader', () => {
  test('toggle button calls onToggleNav', () => {
    const onToggleNav = jest.fn();
    renderHeader({ onToggleNav });
    fireEvent.click(screen.getByRole('button', { name: /toggle navigation menu/i }));
    expect(onToggleNav).toHaveBeenCalledTimes(1);
  });

  test('renders a search input', () => {
    renderHeader();
    expect(screen.getByPlaceholderText(/search skills or courses/i)).toBeInTheDocument();
  });

  test('logo links home for instructors, to /student-dashboard when displayAsInstructor is false', () => {
    const { rerender } = renderHeader({ displayAsInstructor: true });
    expect(screen.getByRole('link')).toHaveAttribute('href', '/');

    rerender(
      <Wrapper>
        <MobileHeader
          isNavOpen={false}
          onToggleNav={jest.fn()}
          displayAsInstructor={false}
          canSwitchToStudentView={false}
          viewingAsStudent={false}
          user={user}
          onHelpClick={jest.fn()}
          onLogout={jest.fn()}
        />
      </Wrapper>
    );
    expect(screen.getByRole('link')).toHaveAttribute('href', '/student-dashboard');
  });

  test('profile button opens the account menu with the user\'s identity shown', () => {
    renderHeader();
    expect(screen.queryByText('Jane Instructor')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'J' }));
    expect(screen.getByText('Jane Instructor')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();
  });

  test('clicking the backdrop closes the account menu', () => {
    const { container } = renderHeader();
    fireEvent.click(screen.getByRole('button', { name: 'J' }));
    expect(screen.getByText('Jane Instructor')).toBeInTheDocument();

    const backdrop = container.querySelector('.fixed.inset-0.z-40');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(screen.queryByText('Jane Instructor')).not.toBeInTheDocument();
  });
});
