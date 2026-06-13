import type { NormalizedPoint } from '../../shared/runtime/types';
import type { GestureAnchor, GestureAnchorFrame } from '../gesture-anchor-frame/anchorFrame';
import type { SpatialTemplateFace, SpatialTemplateMesh, SpatialTemplateVertex } from './types';

const ONE_HAND_MIN_LENGTH = 0.22;
const ONE_HAND_MAX_LENGTH = 0.38;
const ONE_HAND_MIN_HALF_WIDTH = 0.08;
const ONE_HAND_MAX_HALF_WIDTH = 0.16;
const TWO_HAND_MIN_HALF_WIDTH = 0.055;
const TWO_HAND_MAX_HALF_WIDTH = 0.15;
const TEMPLATE_DEPTH = 0.08;

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
  const frontZ = centerDepth + TEMPLATE_DEPTH / 2;
  const backZ = centerDepth - TEMPLATE_DEPTH / 2;
  const tip = offsetPoint(anchor.point, axis, length);
  const baseCenter = offsetPoint(anchor.point, axis, -length * 0.38);
  const baseLeft = offsetPoint(baseCenter, normal, halfWidth);
  const baseRight = offsetPoint(baseCenter, normal, -halfWidth);

  return {
    mode: 'one-hand-wedge',
    vertices: [
      vertex(tip, frontZ),
      vertex(baseLeft, frontZ),
      vertex(baseRight, frontZ),
      vertex(tip, backZ),
      vertex(baseLeft, backZ),
      vertex(baseRight, backZ),
    ],
    faces: [
      { indices: [0, 1, 2], materialId: 'scene' },
      { indices: [5, 4, 3], materialId: 'accent' },
      { indices: [0, 3, 4, 1], materialId: 'edge' },
      { indices: [1, 4, 5, 2], materialId: 'edge' },
      { indices: [2, 5, 3, 0], materialId: 'edge' },
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
  const frontZ = centerDepth + TEMPLATE_DEPTH / 2;
  const backZ = centerDepth - TEMPLATE_DEPTH / 2;
  const leftTop = offsetPoint(left.point, normal, halfWidth);
  const rightTop = offsetPoint(right.point, normal, halfWidth * 0.82);
  const rightBottom = offsetPoint(right.point, normal, -halfWidth);
  const leftBottom = offsetPoint(left.point, normal, -halfWidth * 0.72);
  const faces: SpatialTemplateFace[] = [
    { indices: [0, 1, 2, 3], materialId: 'scene' },
    { indices: [7, 6, 5, 4], materialId: 'accent' },
    { indices: [4, 5, 1, 0], materialId: 'edge' },
    { indices: [5, 6, 2, 1], materialId: 'edge' },
    { indices: [3, 2, 6, 7], materialId: 'edge' },
    { indices: [4, 0, 3, 7], materialId: 'edge' },
  ];

  return {
    mode: 'two-hand-ribbon',
    vertices: [
      vertex(leftTop, frontZ),
      vertex(rightTop, frontZ),
      vertex(rightBottom, frontZ),
      vertex(leftBottom, frontZ),
      vertex(leftTop, backZ),
      vertex(rightTop, backZ),
      vertex(rightBottom, backZ),
      vertex(leftBottom, backZ),
    ],
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
