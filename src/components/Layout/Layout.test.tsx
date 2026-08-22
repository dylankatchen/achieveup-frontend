import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Layout from './Layout';

// Navigation has its own full test suite (Layout/Navigation/*.test.tsx) -
// mocked out here so this file only tests Layout's own contract: rendering
// Navigation once, rendering children, and the page's own layout classes.
jest.mock('./Navigation', () => () => <nav data-testid="mock-navigation" />);

describe('Layout', () => {
  test('renders Navigation and the given children', () => {
    render(
      <Layout>
        <div>Page content</div>
      </Layout>
    );

    expect(screen.getByTestId('mock-navigation')).toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  test('gives <main> both the mobile and desktop top-padding classes', () => {
    // Regression test for a real bug found in PR #22 review: pt-[72px] (to
    // clear the fixed desktop header) had no `md:` prefix, so mobile pages
    // got a pointless empty gap where no fixed header exists at that
    // breakpoint. Now fixed to pt-16 (matching MobileHeader's h-16) plus
    // md:pt-[72px] (matching DesktopHeader's h-[72px]) - this locks in both
    // halves so the bug can't silently come back.
    const { container } = render(
      <Layout>
        <div>content</div>
      </Layout>
    );

    const main = container.querySelector('main');
    expect(main).toHaveClass('pt-16');
    expect(main).toHaveClass('md:pt-[72px]');
    expect(main).toHaveClass('md:ml-[230px]');
  });
});
