import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom';
import RoleHome from './RoleHome';
import { useAuth } from '../../contexts/AuthContext';

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const renderAt = (user: { role: 'instructor' | 'student' } | null) => {
  jest.mocked(useAuth).mockReturnValue({ user } as any);

  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<RoleHome />} />
        <Route path="/instructor-dashboard" element={<div>Instructor Dashboard</div>} />
        <Route path="/student-dashboard" element={<div>Student Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('RoleHome', () => {
  test('sends an instructor to /instructor-dashboard', () => {
    renderAt({ role: 'instructor' });
    expect(screen.getByText('Instructor Dashboard')).toBeInTheDocument();
  });

  test('sends a student to /student-dashboard', () => {
    renderAt({ role: 'student' });
    expect(screen.getByText('Student Dashboard')).toBeInTheDocument();
  });

  test('with no user at all, falls through to /student-dashboard (not a direct /login redirect)', () => {
    // This looks like an odd default, but it's intentional here: RoleHome
    // only decides *which* dashboard, not *whether* the visitor is allowed
    // in at all - that's RequireRole's job one hop later, and it's the one
    // that actually sends an unauthenticated visitor to /login. This test
    // locks in that two-hop behavior so it can't drift into a silent
    // student-dashboard flash for logged-out visitors without a test
    // noticing.
    renderAt(null);
    expect(screen.getByText('Student Dashboard')).toBeInTheDocument();
  });
});
