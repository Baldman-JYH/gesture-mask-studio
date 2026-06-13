import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App shell', () => {
  it('renders the realtime camera stage controls', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Gesture Mask Studio' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start camera' })).toBeEnabled();
    expect(screen.getByLabelText('Gesture driven style')).toHaveTextContent('Auto');
    expect(screen.queryByRole('button', { name: 'Blueprint' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cards' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Organic' })).not.toBeInTheDocument();
  });

  it('shows tracking idle before the camera starts', () => {
    render(<App />);

    expect(screen.getByText('Tracking idle')).toBeInTheDocument();
  });

  it('toggles mirrored camera preview', () => {
    render(<App />);

    const mirrorButton = screen.getByRole('button', { name: 'Mirror' });
    expect(mirrorButton).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(mirrorButton);

    expect(mirrorButton).toHaveAttribute('aria-pressed', 'false');
  });
});
