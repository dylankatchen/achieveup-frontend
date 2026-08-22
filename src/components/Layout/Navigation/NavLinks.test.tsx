import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { Home, Sparkles } from 'lucide-react';
import NavLinks from './NavLinks';
import { NavigationItem } from './types';

const items: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Skill Matrix', href: '/skill-matrix', icon: Sparkles },
];

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('NavLinks', () => {
  test('renders one link per item with the right href', () => {
    render(
      <Wrapper>
        <NavLinks items={items} currentPath="/" variant="desktop" />
      </Wrapper>
    );
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: /skill matrix/i })).toHaveAttribute('href', '/skill-matrix');
  });

  test('marks only the link matching currentPath as active', () => {
    render(
      <Wrapper>
        <NavLinks items={items} currentPath="/skill-matrix" variant="desktop" />
      </Wrapper>
    );
    expect(screen.getByRole('link', { name: /skill matrix/i })).toHaveClass('bg-au-gold-light');
    expect(screen.getByRole('link', { name: /dashboard/i })).not.toHaveClass('bg-au-gold-light');
  });

  test('calls onNavigate when a link is clicked (used to close the mobile drawer)', () => {
    const onNavigate = jest.fn();
    render(
      <Wrapper>
        <NavLinks items={items} currentPath="/" variant="mobile" onNavigate={onNavigate} />
      </Wrapper>
    );
    fireEvent.click(screen.getByRole('link', { name: /skill matrix/i }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
