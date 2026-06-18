import type {
  DeriveTemplateStateInput,
  TemplateMaterialPreset,
  TemplateMode,
  TemplateState,
} from './types';

export function deriveTemplateState(input: DeriveTemplateStateInput): TemplateState {
  if (
    input.activeHandCount > 0 &&
    input.fingertipQuality !== 'valid' &&
    input.previous?.visible
  ) {
    return {
      ...input.previous,
      activeHandCount: input.activeHandCount,
      opacity: 1,
      timestampMs: input.timestampMs,
    };
  }

  if (input.activeHandCount === 0 || !input.leftAnchor) {
    return {
      mode: 'hidden',
      visible: false,
      activeHandCount: input.activeHandCount,
      center: { x: 0.5, y: 0.5, z: 0 },
      span: 0,
      rotation: 0,
      depthTilt: 0,
      foldAmount: 0,
      opacity: 0,
      materialPreset: 'edge-only',
      timestampMs: input.timestampMs,
    };
  }

  if (input.activeHandCount === 1 || !input.rightAnchor) {
    return {
      mode: 'one-hand-wedge',
      visible: true,
      activeHandCount: input.activeHandCount,
      center: input.leftAnchor,
      span: 0.24,
      rotation: 0,
      depthTilt: 0,
      foldAmount: 0.65,
      opacity: 1,
      materialPreset: 'blue-face',
      timestampMs: input.timestampMs,
    };
  }

  const left = input.leftAnchor;
  const right = input.rightAnchor;
  const dx = right.x - left.x;
  const dy = right.y - left.y;
  const span = Math.hypot(dx, dy);
  const rotation = Math.atan2(dy, dx);
  const leftZ = left.z ?? 0;
  const rightZ = right.z ?? 0;
  const depthTilt = Math.abs(rightZ - leftZ);
  const projectedHeight = input.projectedHeight ?? 0.16;
  const mode = selectMode(projectedHeight, span, depthTilt);

  return {
    mode,
    visible: true,
    activeHandCount: input.activeHandCount,
    center: {
      x: (left.x + right.x) / 2,
      y: (left.y + right.y) / 2,
      z: (leftZ + rightZ) / 2,
    },
    span,
    rotation,
    depthTilt,
    foldAmount: clamp01(depthTilt * 2.2 + (0.18 - projectedHeight)),
    opacity: 1,
    materialPreset: materialPresetForMode(mode),
    timestampMs: input.timestampMs,
  };
}

function selectMode(
  projectedHeight: number,
  span: number,
  depthTilt: number,
): TemplateMode {
  if (projectedHeight < 0.05 && span > 0.45) {
    return 'thin-edge';
  }

  if (depthTilt > 0.15 || projectedHeight > 0.2) {
    return 'triangle-fold';
  }

  return 'wide-blue-face';
}

function materialPresetForMode(mode: TemplateMode): TemplateMaterialPreset {
  if (mode === 'thin-edge') {
    return 'green-cyan';
  }

  if (mode === 'triangle-fold') {
    return 'white-red-pixels';
  }

  return 'blue-face';
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
