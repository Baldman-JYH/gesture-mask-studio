export type NormalizedPoint = {
  x: number;
  y: number;
  z?: number;
};

export type TrackedHand = {
  id: string;
  handedness: 'left' | 'right' | 'unknown';
  confidence: number;
  landmarks: NormalizedPoint[];
};

export type LightSheetMode = 'hidden' | 'one-hand-preview' | 'two-hand-sheet' | 'fade-out';

export type LightSheetGeometry = {
  mode: LightSheetMode;
  vertices: [NormalizedPoint, NormalizedPoint, NormalizedPoint, NormalizedPoint?];
  opacity: number;
  confidence: number;
};

export type LightSheetGestureState = {
  mode: LightSheetMode;
  confidence: number;
  stylePresetId: string;
  anchors: {
    left: NormalizedPoint;
    right?: NormalizedPoint;
  };
  openness: number;
  rotation: number;
};

export type SceneSamplingInput = {
  video: HTMLVideoElement;
  mirrored: boolean;
  viewport: { width: number; height: number };
};

export type LightSheetStylePreset = {
  id: string;
  label: string;
  thumbnailUrl: string;
  textureUrl?: string;
  shader: 'blueprint' | 'cards' | 'organic' | 'custom';
  opacity: number;
  edgeColor: string;
  edgeWidth: number;
  sceneSample: {
    enabled: boolean;
    mode: 'raw' | 'edge-lines' | 'luma-map' | 'posterized';
    intensity: number;
    tint: string;
  };
  highlight: {
    enabled: boolean;
    intensity: number;
    speed: number;
  };
  blendMode: 'normal' | 'screen' | 'additive';
};

export type LightSheetRenderInput = {
  geometry: LightSheetGeometry;
  style: LightSheetStylePreset;
  scene: SceneSamplingInput;
  timestampMs: number;
  debug?: boolean;
};
