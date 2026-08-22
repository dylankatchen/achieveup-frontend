import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HowItWorksModal from './HowItWorksModal';

describe('HowItWorksModal', () => {
  test('renders the how-it-works content', () => {
    render(<HowItWorksModal onClose={jest.fn()} />);
    expect(screen.getByRole('heading', { name: /how achieveup works/i })).toBeInTheDocument();
    expect(screen.getByText(/define skills for your course/i)).toBeInTheDocument();
  });

  test('close button calls onClose', () => {
    const onClose = jest.fn();
    render(<HowItWorksModal onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('"Create Skill Matrix" CTA calls onClose', () => {
    const onClose = jest.fn();
    render(<HowItWorksModal onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /create skill matrix/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('"Assign Skills" CTA calls onClose', () => {
    const onClose = jest.fn();
    render(<HowItWorksModal onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /assign skills/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
