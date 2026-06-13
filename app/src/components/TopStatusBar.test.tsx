import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TopStatusBar } from './TopStatusBar';

describe('TopStatusBar', () => {
  it('shows no hands when tracking is ready but no landmarks are detected', () => {
    render(<TopStatusBar cameraState="ready" trackingState="ready" handsCount={0} />);

    expect(screen.getByText('No hands')).toBeInTheDocument();
  });
});
