import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import MasteryRing from './MasteryRing';

describe('MasteryRing', () => {
  test('renders children inside the ring', () => {
    const { getByText } = render(
      <MasteryRing percent={50}>
        <span>75%</span>
      </MasteryRing>
    );
    expect(getByText('75%')).toBeInTheDocument();
  });

  test('clamps a percent above 100 to a full ring (zero offset)', () => {
    const { container } = render(<MasteryRing percent={150} size={80} strokeWidth={8} />);
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    expect(progressCircle).toHaveAttribute('stroke-dashoffset', '0');
  });

  test('clamps a negative percent to an empty ring (offset = full circumference)', () => {
    const { container } = render(<MasteryRing percent={-20} size={80} strokeWidth={8} />);
    const circles = container.querySelectorAll('circle');
    const progressCircle = circles[1];
    const circumference = 2 * Math.PI * ((80 - 8) / 2);
    expect(progressCircle).toHaveAttribute('stroke-dashoffset', String(circumference));
  });

  test('0% and 100% render at opposite ends of the same clamped range', () => {
    const { container: emptyContainer } = render(<MasteryRing percent={0} size={80} strokeWidth={8} />);
    const { container: fullContainer } = render(<MasteryRing percent={100} size={80} strokeWidth={8} />);
    const circumference = 2 * Math.PI * ((80 - 8) / 2);

    expect(emptyContainer.querySelectorAll('circle')[1]).toHaveAttribute(
      'stroke-dashoffset',
      String(circumference)
    );
    expect(fullContainer.querySelectorAll('circle')[1]).toHaveAttribute('stroke-dashoffset', '0');
  });
});
