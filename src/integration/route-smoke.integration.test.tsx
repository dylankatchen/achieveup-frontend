import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { authAPI, canvasInstructorAPI, canvasAPI } from '../services/api';

// Confirms each main authenticated route actually wires up end to end through
// the real App/router/RequireRole/Layout stack and mounts the right page
// without crashing. Deliberately shallow (one heading check each) - the deep
// interaction flows for these pages already have their own coverage
// (SkillMatrixCreator.test.tsx) or are out of scope for this pass
// (SkillAssignmentInterface.tsx has no unit tests yet; not improvising that
// coverage here).
jest.mock('../services/api', () => ({
  authAPI: {
    me: jest.fn(),
  },
  canvasInstructorAPI: {
    getInstructorCourses: jest.fn(),
  },
  canvasAPI: {
    getInstructorCourses: jest.fn(),
  },
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() },
  toast: { success: jest.fn(), error: jest.fn() },
  Toaster: () => <div data-testid="toaster" />,
}));

const instructor = {
  id: 'instructor-1',
  name: 'Taylor Rivera',
  email: 'taylor@example.com',
  role: 'instructor',
};

const visitAsInstructor = (path: string) => {
  localStorage.setItem('token', 'fake-token');
  jest.mocked(authAPI.me).mockResolvedValue({ data: { user: instructor } } as any);
  window.history.pushState({}, '', path);
};

beforeEach(() => {
  localStorage.clear();
  jest.mocked(canvasInstructorAPI.getInstructorCourses).mockResolvedValue({ data: [] } as any);
  jest.mocked(canvasAPI.getInstructorCourses).mockResolvedValue({ data: [] } as any);
});

describe('authenticated route smoke tests', () => {
  test('/skill-matrix mounts the Skill Matrix Creator inside Layout', async () => {
    visitAsInstructor('/skill-matrix');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Skill Matrix Creator')).toBeInTheDocument();
    });
    // Layout/Navigation is actually mounted, not just the bare page
    expect(screen.getByRole('link', { name: /skill matrix/i })).toBeInTheDocument();
  });

  test('/skill-assignment mounts the Skill Assignment Interface inside Layout', async () => {
    visitAsInstructor('/skill-assignment');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Skill Assignment Interface')).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /skill assignment/i })).toBeInTheDocument();
  });

  test('/progress mounts Student Progress Tracking inside Layout', async () => {
    visitAsInstructor('/progress');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /student progress tracking/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /student progress/i })).toBeInTheDocument();
  });

  test('/settings mounts Account Settings inside Layout, pre-filled from the real user', async () => {
    visitAsInstructor('/settings');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /account settings/i })).toBeInTheDocument();
    });
    // Profile section starts read-only (an "Edit" button reveals the form) -
    // confirm it's showing the real user's data, not stale/placeholder text.
    // ("Taylor Rivera" also appears in the header's UserMenu, so scope to
    // the profile field itself rather than a bare getByText.)
    const nameLabel = screen.getByText('Full Name');
    expect(nameLabel.nextElementSibling).toHaveTextContent('Taylor Rivera');
  });
});
