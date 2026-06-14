import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PermissionOverlay } from './PermissionOverlay';

describe('PermissionOverlay', () => {
  it('keeps a loading prompt visible while the hand tracker initializes', () => {
    render(<PermissionOverlay cameraState="ready" trackingState="loading" message={null} />);

    expect(screen.getByText('Loading hand tracking')).toBeInTheDocument();
  });

  it('hides after camera and hand tracking are ready', () => {
    const { container } = render(
      <PermissionOverlay cameraState="ready" trackingState="ready" message={null} />,
    );

    expect(container.firstChild).toBeNull();
  });
});
