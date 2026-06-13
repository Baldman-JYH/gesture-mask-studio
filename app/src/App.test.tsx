import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App shell', () => {
  it('renders the realtime camera stage shell', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Gesture Mask Studio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start camera' })).toBeDisabled();
  });
});
