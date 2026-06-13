import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App shell', () => {
  it('renders the realtime camera stage controls', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Gesture Mask Studio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start camera' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Blueprint' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Cards' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Organic' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('selects the Cards preset', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Cards' }));

    expect(screen.getByRole('button', { name: 'Cards' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Blueprint' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles mirrored camera preview', () => {
    render(<App />);

    const mirrorButton = screen.getByRole('button', { name: 'Mirror' });
    expect(mirrorButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(mirrorButton);

    expect(mirrorButton).toHaveAttribute('aria-pressed', 'false');
  });
});
