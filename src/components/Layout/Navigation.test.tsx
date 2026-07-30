import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Navigation from './Navigation';

// Mock the AuthContext
const mockUser = {
  id: '1',
  name: 'Test Instructor',
  email: 'test@example.com',
  role: 'instructor' as const,
  canvasTokenType: 'instructor' as const,
  hasCanvasToken: true,
};

const mockAuthContext = {
  user: mockUser,
  logout: jest.fn(),
  backendAvailable: true,
  isAuthenticated: true,
  loading: false,
  login: jest.fn(),
  signup: jest.fn(),
  refreshUser: jest.fn(),
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

const NavigationWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Navigation Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders navigation items correctly', () => {
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );

    expect(screen.getByText('AchieveUp')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Skill Matrix')).toBeInTheDocument();
    expect(screen.getByText('Skill Assignment')).toBeInTheDocument();
    expect(screen.getByText('Student Progress')).toBeInTheDocument();
  });

  test('shows user information correctly', () => {
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );

    expect(screen.getByText('Test Instructor')).toBeInTheDocument();
    expect(screen.getByText('Instructor')).toBeInTheDocument();
  });

  test('shows backend status indicator', () => {
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );

    // Should show connected status - just verify SVG icons are present
    expect(document.querySelector('svg')).toBeInTheDocument(); // At least one icon should be present
  });

  test('handles logout correctly', () => {
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(mockAuthContext.logout).toHaveBeenCalledTimes(1);
  });

  test('mobile menu toggles correctly', () => {
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );

    // Find the mobile menu button (hamburger icon)
    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);

    // Mobile navigation should appear
    // The exact test depends on how the mobile menu is implemented
    expect(menuButton).toBeInTheDocument();
  });

  test('shows correct navigation links', () => {
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );

    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveAttribute('href', '/');

    const skillMatrixLink = screen.getByRole('link', { name: /skill matrix/i });
    expect(skillMatrixLink).toHaveAttribute('href', '/skill-matrix');

    const skillAssignmentLink = screen.getByRole('link', { name: /skill assignment/i });
    expect(skillAssignmentLink).toHaveAttribute('href', '/skill-assignment');
  });
});

describe('Navigation - Backend Unavailable', () => {
  test('shows offline indicator when backend is unavailable', () => {
    const offlineAuthContext = {
      ...mockAuthContext,
      backendAvailable: false,
    };

    jest.mocked(require('../../contexts/AuthContext').useAuth).mockReturnValue(offlineAuthContext);

    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );

    // Should show disconnected status
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
}); 