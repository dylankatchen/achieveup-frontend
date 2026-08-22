import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import UserMenu from './UserMenu';
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

const renderMenu = (props: Partial<React.ComponentProps<typeof UserMenu>> = {}) =>
  render(
    <Wrapper>
      <UserMenu user={user} displayAsInstructor onHelpClick={jest.fn()} onLogout={jest.fn()} {...props} />
    </Wrapper>
  );

describe('UserMenu', () => {
  test("shows the user's name and role in the trigger", () => {
    renderMenu();
    expect(screen.getByText('Jane Instructor')).toBeInTheDocument();
    expect(screen.getByText('Instructor')).toBeInTheDocument();
  });

  test('falls back to email, then "User", when name is missing', () => {
    const { rerender } = renderMenu({ user: { ...user, name: '' } });
    expect(screen.getByText(user.email)).toBeInTheDocument();

    rerender(
      <Wrapper>
        <UserMenu user={null} displayAsInstructor onHelpClick={jest.fn()} onLogout={jest.fn()} />
      </Wrapper>
    );
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  test('dropdown (AccountMenu) is closed by default and opens/closes on hover', () => {
    const { container } = renderMenu();
    expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument();

    fireEvent.mouseEnter(container.firstChild as HTMLElement);
    expect(screen.getByRole('link', { name: /settings/i })).toBeInTheDocument();

    fireEvent.mouseLeave(container.firstChild as HTMLElement);
    expect(screen.queryByRole('link', { name: /settings/i })).not.toBeInTheDocument();
  });
});
