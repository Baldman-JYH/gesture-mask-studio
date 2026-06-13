import {
  Camera,
  CameraOff,
  FlipHorizontal2,
  GalleryHorizontal,
  Layers3,
  Leaf,
  WandSparkles,
} from 'lucide-react';
import type { CameraState } from '../features/camera/cameraController';
import type { LightSheetStylePreset } from '../shared/runtime/types';

type ControlDockProps = {
  cameraState: CameraState;
  activePreset: LightSheetStylePreset;
  mirrored: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onToggleMirror: () => void;
};

const presetIcons = {
  blueprint: Layers3,
  cards: GalleryHorizontal,
  organic: Leaf,
};

export function ControlDock({
  cameraState,
  activePreset,
  mirrored,
  onStartCamera,
  onStopCamera,
  onToggleMirror,
}: ControlDockProps) {
  const isRequesting = cameraState === 'requesting';
  const isLive = cameraState === 'ready';
  const ActivePresetIcon = presetIcons[activePreset.id as keyof typeof presetIcons] ?? Layers3;

  return (
    <footer className="control-dock" aria-label="Camera controls">
      <div className="gesture-style-status" aria-label="Gesture driven style">
        <img src={activePreset.thumbnailUrl} alt="" aria-hidden="true" />
        <WandSparkles size={18} aria-hidden="true" />
        <span>Auto</span>
        <ActivePresetIcon size={17} aria-hidden="true" />
        <strong>{activePreset.label}</strong>
      </div>

      <div className="dock-actions">
        <button
          type="button"
          className="icon-button"
          aria-label="Mirror"
          aria-pressed={mirrored}
          title="Mirror"
          onClick={onToggleMirror}
        >
          <FlipHorizontal2 size={20} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="camera-button"
          disabled={isRequesting}
          onClick={isLive ? onStopCamera : onStartCamera}
        >
          {isLive ? (
            <CameraOff size={19} aria-hidden="true" />
          ) : (
            <Camera size={19} aria-hidden="true" />
          )}
          <span>{isLive ? 'Stop camera' : 'Start camera'}</span>
        </button>
      </div>
    </footer>
  );
}
