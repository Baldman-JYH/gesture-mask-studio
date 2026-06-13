import {
  Camera,
  CameraOff,
  FlipHorizontal2,
  GalleryHorizontal,
  Layers3,
  Leaf,
} from 'lucide-react';
import type { CameraState } from '../features/camera/cameraController';
import type { LightSheetStylePreset } from '../shared/runtime/types';

type ControlDockProps = {
  cameraState: CameraState;
  presets: LightSheetStylePreset[];
  selectedPresetId: string;
  mirrored: boolean;
  onStartCamera: () => void;
  onStopCamera: () => void;
  onSelectPreset: (presetId: string) => void;
  onToggleMirror: () => void;
};

const presetIcons = {
  blueprint: Layers3,
  cards: GalleryHorizontal,
  organic: Leaf,
};

export function ControlDock({
  cameraState,
  presets,
  selectedPresetId,
  mirrored,
  onStartCamera,
  onStopCamera,
  onSelectPreset,
  onToggleMirror,
}: ControlDockProps) {
  const isRequesting = cameraState === 'requesting';
  const isLive = cameraState === 'ready';

  return (
    <footer className="control-dock" aria-label="Camera controls">
      <div className="preset-control" role="group" aria-label="Light sheet styles">
        {presets.map((preset) => {
          const Icon = presetIcons[preset.id as keyof typeof presetIcons] ?? Layers3;
          const isSelected = selectedPresetId === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              className="preset-button"
              aria-pressed={isSelected}
              aria-label={preset.label}
              onClick={() => onSelectPreset(preset.id)}
            >
              <img src={preset.thumbnailUrl} alt="" aria-hidden="true" />
              <Icon size={17} aria-hidden="true" />
              <span>{preset.label}</span>
            </button>
          );
        })}
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
