import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Card from './Card';

describe('Card', () => {
  test('renders children', () => {
    render(<Card>Card body content</Card>);
    expect(screen.getByText('Card body content')).toBeInTheDocument();
  });

  test('renders no header when neither title nor headerActions is passed', () => {
    const { container } = render(<Card>Body</Card>);
    expect(container.querySelector('h3')).not.toBeInTheDocument();
  });

  test('renders the header when title is passed, even with no subtitle', () => {
    render(<Card title="Card Title">Body</Card>);
    expect(screen.getByRole('heading', { name: 'Card Title' })).toBeInTheDocument();
  });

  test('renders the header when only headerActions is passed (no title)', () => {
    render(<Card headerActions={<button>Action</button>}>Body</Card>);
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  test('subtitle only renders alongside a title, not on its own', () => {
    // Card has no code path to show subtitle without title/headerActions also
    // being present (the whole header block is gated on title || headerActions) -
    // this locks in that subtitle alone, with neither, renders nothing.
    const { container } = render(<Card subtitle="Orphan subtitle">Body</Card>);
    expect(screen.queryByText('Orphan subtitle')).not.toBeInTheDocument();
    expect(container.querySelector('h3')).not.toBeInTheDocument();
  });

  test('renders subtitle text when title is also present', () => {
    render(
      <Card title="Title" subtitle="Helpful subtitle">
        Body
      </Card>
    );
    expect(screen.getByText('Helpful subtitle')).toBeInTheDocument();
  });
});
