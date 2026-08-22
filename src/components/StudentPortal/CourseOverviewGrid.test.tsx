import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseOverviewGrid from './CourseOverviewGrid';

const course = (overrides: Partial<React.ComponentProps<typeof CourseOverviewGrid>['courses'][number]> = {}) => ({
  id: 'c1',
  name: 'Data Structures',
  code: 'COP3530',
  averageScore: 80,
  nextHint: 'On track',
  ...overrides,
});

describe('CourseOverviewGrid', () => {
  test('shows an empty-state message when there are no courses', () => {
    render(<CourseOverviewGrid courses={[]} />);
    expect(screen.getByText('No Canvas courses found.')).toBeInTheDocument();
  });

  test('renders a course card with its name, code, and score', () => {
    render(<CourseOverviewGrid courses={[course()]} />);
    expect(screen.getByText('Data Structures')).toBeInTheDocument();
    expect(screen.getByText('COP3530')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('On track')).toBeInTheDocument();
  });

  test('a course with no attempted skills (averageScore null) shows an em dash instead of a score', () => {
    render(<CourseOverviewGrid courses={[course({ averageScore: null, nextHint: 'Not started yet' })]} />);
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });
});
