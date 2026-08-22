import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { Home, Sparkles } from 'lucide-react';
import DesktopSidebar from './DesktopSidebar';
import { NavigationItem } from './types';

const items: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Skill Matrix', href: '/skill-matrix', icon: Sparkles },
];

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

const renderSidebar = (props: Partial<React.ComponentProps<typeof DesktopSidebar>> = {}) =>
  render(
    <Wrapper>
      <DesktopSidebar
        displayAsInstructor
        navigationItems={items}
        currentPath="/"
        onHelpClick={jest.fn()}
        onLogout={jest.fn()}
        {...props}
      />
    </Wrapper>
  );

describe('DesktopSidebar', () => {
  test('renders every nav item as a link with the right href', () => {
    renderSidebar();
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /skill matrix/i })).toHaveAttribute('href', '/skill-matrix');
  });

  test('shows "How It Works" for instructors, hides it for students', () => {
    const { rerender } = renderSidebar({ displayAsInstructor: true });
    expect(screen.getByRole('button', { name: /how it works/i })).toBeInTheDocument();

    rerender(
      <Wrapper>
        <DesktopSidebar
          displayAsInstructor={false}
          navigationItems={items}
          currentPath="/"
          onHelpClick={jest.fn()}
          onLogout={jest.fn()}
        />
      </Wrapper>
    );
    expect(screen.queryByRole('button', { name: /how it works/i })).not.toBeInTheDocument();
  });

  test('help and logout buttons fire their handlers', () => {
    const onHelpClick = jest.fn();
    const onLogout = jest.fn();
    renderSidebar({ onHelpClick, onLogout });

    fireEvent.click(screen.getByRole('button', { name: /how it works/i }));
    expect(onHelpClick).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /logout/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  test('logo links to / for instructors, to /student-dashboard otherwise', () => {
    const { rerender } = renderSidebar({ displayAsInstructor: true });
    expect(screen.getByRole('link', { name: /achieveup/i })).toHaveAttribute('href', '/');

    rerender(
      <Wrapper>
        <DesktopSidebar
          displayAsInstructor={false}
          navigationItems={items}
          currentPath="/"
          onHelpClick={jest.fn()}
          onLogout={jest.fn()}
        />
      </Wrapper>
    );
    expect(screen.getByRole('link', { name: /achieveup/i })).toHaveAttribute('href', '/student-dashboard');
  });
});
