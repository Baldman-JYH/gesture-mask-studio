import type { NormalizedPoint } from '../../shared/runtime/types';
import type { GestureAnchor, GestureAnchorFrame } from '../gesture-anchor-frame/anchorFrame';
import type { SpatialTemplateFace, SpatialTemplateMesh, SpatialTemplateVertex } from './types';

const ONE_HAND_MIN_LENGTH = 0.22;
const ONE_HAND_MAX_LENGTH = 0.42;
const ONE_HAND_MIN_HALF_WIDTH = 0.07;
const ONE_HAND_MAX_HALF_WIDTH = 0.15;
const TWO_HAND_MIN_HALF_WIDTH = 0.075;
const TWO_HAND_MAX_HALF_WIDTH = 0.18;
const TEMPLATE_THICKNESS = 0.055;
const ONE_HAND_MIN_FOLD_LIFT = 0.1;
const ONE_HAND_MAX_FOLD_LIFT = 0.22;
const TWO_HAND_MIN_FOLD_LIFT = 0.12;
const TWO_HAND_MAX_FOLD_LIFT = 0.28;

export function buildSpatialTemplateMesh(frame: GestureAnchorFrame): SpatialTemplateMesh {
  if (frame.mode === 'one-hand' && frame.primary) {
    return buildOneHandWedge(frame, frame.primary);
  }

  if (frame.mode === 'two-hand' && frame.left && frame.right) {
    return buildTwoHandRibbon(frame, frame.left, frame.right);
  }

  return {
    mode: 'hidden',
    vertices: [],
    faces: [],
    opacity: 0,
    confidence: 0,
  };
}

function buildOneHandWedge(frame: GestureAnchorFrame, anchor: GestureAnchor): SpatialTemplateMesh {
  const axis = normalize2d(anchor.direction.x, anchor.direction.y);
  const normal = { x: -axis.y, y: axis.x };
  const length = lerp(ONE_HAND_MIN_LENGTH, ONE_HAND_MAX_LENGTH, clamp01(frame.openness));
  const halfWidth = lerp(ONE_HAND_MIN_HALF_WIDTH, ONE_HAND_MAX_HALF_WIDTH, clamp01(frame.openness));
  const centerDepth = toTemplateDepth(anchor.point.z);
  const foldLift = lerp(ONE_HAND_MIN_FOLD_LIFT, ONE_HAND_MAX_FOLD_LIFT, clamp01(frame.openness));
  const rearCenter = offsetPoint(anchor.point, axis, -length * 0.42);
  const ridgeCenter = offsetPoint(anchor.point, axis, length * 0.08);
  const frontCenter = offsetPoint(anchor.point, axis, length * 0.58);
  const surfacePoints = [
    offsetPoint(rearCenter, normal, halfWidth * 0.78),
    offsetPoint(ridgeCenter, normal, halfWidth),
    offsetPoint(frontCenter, normal, halfWidth * 0.72),
    offsetPoint(frontCenter, normal, -halfWidth * 0.72),
    offsetPoint(ridgeCenter, normal, -halfWidth),
    offsetPoint(rearCenter, normal, -halfWidth * 0.78),
  ];
  const surfaceDepths = [
    centerDepth - foldLift * 0.25,
    centerDepth + foldLift,
    centerDepth + foldLift * 0.12,
    centerDepth + foldLift * 0.12,
    centerDepth + foldLift,
    centerDepth - foldLift * 0.25,
  ];
  const frontVertices = surfacePoints.map((point, index) => vertex(point, surfaceDepths[index]));
  const backVertices = surfacePoints.map((point, index) => (
    vertex(point, surfaceDepths[index] - TEMPLATE_THICKNESS)
  ));

  return {
    mode: 'one-hand-template',
    vertices: [...frontVertices, ...backVertices],
    faces: [
      { indices: [1, 2, 3, 4], materialId: 'scene' },
      { indices: [0, 1, 4, 5], materialId: 'panel' },
      { indices: [11, 10, 7, 6], materialId: 'back' },
      { indices: [10, 9, 8, 7], materialId: 'back' },
      { indices: [0, 6, 7, 1], materialId: 'edge' },
      { indices: [1, 7, 8, 2], materialId: 'edge' },
      { indices: [2, 8, 9, 3], materialId: 'edge' },
      { indices: [3, 9, 10, 4], materialId: 'edge' },
      { indices: [4, 10, 11, 5], materialId: 'edge' },
      { indices: [5, 11, 6, 0], materialId: 'edge' },
    ],
    opacity: lerp(0.58, 0.86, clamp01(frame.confidence)),
    confidence: clamp01(frame.confidence),
  };
}

function buildTwoHandRibbon(
  frame: GestureAnchorFrame,
  left: GestureAnchor,
  right: GestureAnchor,
): SpatialTemplateMesh {
  const dx = right.point.x - left.point.x;
  const dy = right.point.y - left.point.y;
  const axis = normalize2d(dx, dy);
  const normal = { x: -axis.y, y: axis.x };
  const halfWidth = lerp(TWO_HAND_MIN_HALF_WIDTH, TWO_HAND_MAX_HALF_WIDTH, clamp01(frame.openness));
  const centerDepth = toTemplateDepth(averageOptional(left.point.z, right.point.z));
  const foldLift = lerp(TWO_HAND_MIN_FOLD_LIFT, TWO_HAND_MAX_FOLD_LIFT, clamp01(frame.openness));
  const surfacePoints = [
    offsetPoint(left.point, normal, halfWidth),
    offsetPoint(right.point, normal, halfWidth * 0.86),
    offsetPoint(right.point, normal, -halfWidth * 0.04),
    offsetPoint(left.point, normal, halfWidth * 0.06),
    offsetPoint(left.point, normal, -halfWidth * 0.82),
    offsetPoint(right.point, normal, -halfWidth),
  ];
  const surfaceDepths = [
    centerDepth + foldLift,
    centerDepth + foldLift * 0.82,
    centerDepth + foldLift * 0.08,
    centerDepth + foldLift * 0.2,
    centerDepth - foldLift * 0.28,
    centerDepth - foldLift * 0.18,
  ];
  const frontVertices = surfacePoints.map((point, index) => vertex(point, surfaceDepths[index]));
  const backVertices = surfacePoints.map((point, index) => (
    vertex(point, surfaceDepths[index] - TEMPLATE_THICKNESS)
  ));
  const faces: SpatialTemplateFace[] = [
    { indices: [0, 1, 2, 3], materialId: 'scene' },
    { indices: [3, 2, 5, 4], materialId: 'panel' },
    { indices: [9, 8, 7, 6], materialId: 'back' },
    { indices: [10, 11, 8, 9], materialId: 'back' },
    { indices: [6, 7, 1, 0], materialId: 'edge' },
    { indices: [7, 8, 2, 1], materialId: 'edge' },
    { indices: [8, 11, 5, 2], materialId: 'accent' },
    { indices: [4, 5, 11, 10], materialId: 'edge' },
    { indices: [10, 9, 3, 4], materialId: 'accent' },
    { indices: [9, 6, 0, 3], materialId: 'edge' },
  ];

  return {
    mode: 'two-hand-template',
    vertices: [...frontVertices, ...backVertices],
    faces,
    opacity: lerp(0.64, 0.9, clamp01(frame.confidence)),
    confidence: clamp01(frame.confidence),
  };
}

function vertex(point: NormalizedPoint, z: number): SpatialTemplateVertex {
  const samplePoint = clampNormalizedPoint(point);

  return {
    position: {
      ...samplePoint,
      z,
    },
    samplePoint,
  };
}

function offsetPoint(
  point: NormalizedPoint,
  direction: { x: number; y: number },
  distance: number,
): NormalizedPoint {
  return {
    x: point.x + direction.x * distance,
    y: point.y + direction.y * distance,
    ...(point.z === undefined ? {} : { z: point.z }),
  };
}

function clampNormalizedPoint(point: NormalizedPoint): NormalizedPoint {
  return {
    x: clamp01(point.x),
    y: clamp01(point.y),
    ...(point.z === undefined ? {} : { z: point.z }),
  };
}

function normalize2d(x: number, y: number): { x: number; y: number } {
  const length = Math.hypot(x, y);

  if (length === 0) {
    return { x: 1, y: 0 };
  }

  return {
    x: x / length,
    y: y / length,
  };
}

function toTemplateDepth(z: number | undefined): number {
  return clamp((-(z ?? 0)) * 1.8, -0.16, 0.18);
}

function averageOptional(left?: number, right?: number): number | undefined {
  if (left === undefined && right === undefined) {
    return undefined;
  }

  return ((left ?? 0) + (right ?? 0)) / 2;
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
