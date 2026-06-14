import { Camera, CircleAlert, LoaderCircle } from 'lucide-react';
import type { CameraState } from '../features/camera/cameraController';
import type { TrackingState } from '../shared/runtime/types';

type PermissionOverlayProps = {
  cameraState: CameraState;
  trackingState: TrackingState;
  message: string | null;
};

export function PermissionOverlay({ cameraState, trackingState, message }: PermissionOverlayProps) {
  if (cameraState === 'ready' && trackingState !== 'loading') {
    return null;
  }

  const Icon = overlayIcon(cameraState, trackingState);

  return (
    <div className="permission-overlay" aria-live="polite">
      <Icon size={24} aria-hidden="true" />
      <span>{message ?? overlayLabel(cameraState, trackingState)}</span>
    </div>
  );
}

function overlayIcon(cameraState: CameraState, trackingState: TrackingState) {
  if (cameraState === 'ready' && trackingState === 'loading') {
    return LoaderCircle;
  }

  if (cameraState === 'denied' || cameraState === 'error') {
    return CircleAlert;
  }

  return Camera;
}

function overlayLabel(cameraState: CameraState, trackingState: TrackingState): string {
  if (cameraState === 'ready' && trackingState === 'loading') {
    return 'Loading hand tracking';
  }

  if (cameraState === 'requesting') {
    return 'Requesting camera access';
  }

  if (cameraState === 'unsupported') {
    return 'Camera API unavailable';
  }

  if (cameraState === 'denied') {
    return 'Camera permission denied';
  }

  if (cameraState === 'error') {
    return 'Camera failed to start';
  }

  return 'Camera idle';
}
