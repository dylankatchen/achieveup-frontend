import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { Home } from 'lucide-react';
import MobileNav from './MobileNav';
import { NavigationItem } from './types';

const items: NavigationItem[] = [{ name: 'Dashboard', href: '/', icon: Home }];

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('MobileNav', () => {
  test('renders the nav links passed to it', () => {
    render(
      <Wrapper>
        <MobileNav navigationItems={items} currentPath="/" onClose={jest.fn()} />
      </Wrapper>
    );
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument();
  });

  test('clicking a link closes the drawer (via onClose)', () => {
    const onClose = jest.fn();
    render(
      <Wrapper>
        <MobileNav navigationItems={items} currentPath="/" onClose={onClose} />
      </Wrapper>
    );
    fireEvent.click(screen.getByRole('link', { name: /dashboard/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('clicking the backdrop closes the drawer', () => {
    const onClose = jest.fn();
    const { container } = render(
      <Wrapper>
        <MobileNav navigationItems={items} currentPath="/" onClose={onClose} />
      </Wrapper>
    );
    const backdrop = container.querySelector('.bg-black\\/30');
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
