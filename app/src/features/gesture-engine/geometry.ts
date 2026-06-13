import type { LightSheetGeometry, NormalizedPoint } from '../../shared/runtime/types';

type TwoHandGeometryInput = {
  left: NormalizedPoint;
  right: NormalizedPoint;
  openness: number;
  confidence: number;
};

type OneHandGeometryInput = {
  anchor: NormalizedPoint;
  openness: number;
  confidence: number;
};

const MIN_TWO_HAND_THICKNESS = 0.055;
const MAX_TWO_HAND_THICKNESS = 0.18;
const ONE_HAND_PREVIEW_RADIUS = 0.11;

export function clampNormalizedPoint(point: NormalizedPoint): NormalizedPoint {
  return {
    x: clamp01(point.x),
    y: clamp01(point.y),
    ...(point.z === undefined ? {} : { z: point.z }),
  };
}

export function buildTwoHandLightSheetGeometry(input: TwoHandGeometryInput): LightSheetGeometry {
  const left = clampNormalizedPoint(input.left);
  const right = clampNormalizedPoint(input.right);
  const dx = right.x - left.x;
  const dy = right.y - left.y;
  const length = Math.hypot(dx, dy) || 1;
  const normal = {
    x: -dy / length,
    y: dx / length,
  };
  const openness = clamp01(input.openness);
  const thickness = lerp(MIN_TWO_HAND_THICKNESS, MAX_TWO_HAND_THICKNESS, openness);

  const vertices: [NormalizedPoint, NormalizedPoint, NormalizedPoint, NormalizedPoint] = [
    clampNormalizedPoint({ x: left.x + normal.x * thickness, y: left.y + normal.y * thickness }),
    clampNormalizedPoint({ x: right.x + normal.x * thickness * 0.72, y: right.y + normal.y * thickness * 0.72 }),
    clampNormalizedPoint({ x: right.x - normal.x * thickness, y: right.y - normal.y * thickness }),
    clampNormalizedPoint({ x: left.x - normal.x * thickness * 0.62, y: left.y - normal.y * thickness * 0.62 }),
  ];

  return {
    mode: 'two-hand-sheet',
    vertices,
    opacity: lerp(0.74, 0.9, clamp01(input.confidence)),
    confidence: clamp01(input.confidence),
  };
}

export function buildOneHandPreviewGeometry(input: OneHandGeometryInput): LightSheetGeometry {
  const anchor = clampNormalizedPoint(input.anchor);
  const radius = lerp(ONE_HAND_PREVIEW_RADIUS * 0.6, ONE_HAND_PREVIEW_RADIUS, clamp01(input.openness));

  return {
    mode: 'one-hand-preview',
    vertices: [
      clampNormalizedPoint({ x: anchor.x, y: anchor.y - radius }),
      clampNormalizedPoint({ x: anchor.x + radius * 1.2, y: anchor.y + radius * 0.8 }),
      clampNormalizedPoint({ x: anchor.x - radius * 1.2, y: anchor.y + radius * 0.8 }),
    ],
    opacity: lerp(0.48, 0.72, clamp01(input.confidence)),
    confidence: clamp01(input.confidence),
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}
