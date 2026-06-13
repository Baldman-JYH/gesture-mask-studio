import { Activity, Camera, Hand } from 'lucide-react';
import type { ReactNode } from 'react';
import type { CameraState } from '../features/camera/cameraController';

type TrackingState = 'idle' | 'loading' | 'ready' | 'unavailable';

type TopStatusBarProps = {
  cameraState: CameraState;
  trackingState: TrackingState;
  handsCount: number;
};

export function TopStatusBar({ cameraState, trackingState, handsCount }: TopStatusBarProps) {
  return (
    <header className="top-status">
      <div className="brand-lockup" aria-label="Gesture Mask Studio">
        <span className="brand-mark" aria-hidden="true" />
        <h1>Gesture Mask Studio</h1>
      </div>

      <div className="runtime-status" aria-label="Runtime status">
        <StatusPill
          icon={<Camera size={16} aria-hidden="true" />}
          label={cameraState === 'ready' ? 'Camera live' : cameraStateLabel(cameraState)}
          tone={cameraState === 'ready' ? 'ready' : 'idle'}
        />
        <StatusPill
          icon={<Hand size={16} aria-hidden="true" />}
          label={trackingStateLabel(trackingState, handsCount)}
          tone={trackingState === 'ready' && handsCount > 0 ? 'ready' : 'idle'}
        />
        <StatusPill
          icon={<Activity size={16} aria-hidden="true" />}
          label="Realtime"
          tone="ready"
        />
      </div>
    </header>
  );
}

function StatusPill({
  icon,
  label,
  tone,
}: {
  icon: ReactNode;
  label: string;
  tone: 'idle' | 'ready';
}) {
  return (
    <span className={`status-pill status-pill--${tone}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
}

function cameraStateLabel(cameraState: CameraState): string {
  if (cameraState === 'requesting') {
    return 'Requesting';
  }

  if (cameraState === 'denied') {
    return 'Denied';
  }

  if (cameraState === 'unsupported') {
    return 'Unsupported';
  }

  if (cameraState === 'error') {
    return 'Camera error';
  }

  return 'Camera idle';
}

function trackingStateLabel(trackingState: TrackingState, handsCount: number): string {
  if (trackingState === 'loading') {
    return 'Loading';
  }

  if (trackingState === 'ready') {
    return handsCount > 0 ? `${handsCount} hand${handsCount > 1 ? 's' : ''}` : 'Ready';
  }

  if (trackingState === 'unavailable') {
    return 'Tracking off';
  }

  return 'Tracking idle';
}

export type { TrackingState };
