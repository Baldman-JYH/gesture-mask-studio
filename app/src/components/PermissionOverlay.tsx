import { Camera, CircleAlert } from 'lucide-react';
import type { CameraState } from '../features/camera/cameraController';

type PermissionOverlayProps = {
  cameraState: CameraState;
  message: string | null;
};

export function PermissionOverlay({ cameraState, message }: PermissionOverlayProps) {
  if (cameraState === 'ready') {
    return null;
  }

  const Icon = cameraState === 'denied' || cameraState === 'error' ? CircleAlert : Camera;

  return (
    <div className="permission-overlay" aria-live="polite">
      <Icon size={24} aria-hidden="true" />
      <span>{message ?? overlayLabel(cameraState)}</span>
    </div>
  );
}

function overlayLabel(cameraState: CameraState): string {
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
