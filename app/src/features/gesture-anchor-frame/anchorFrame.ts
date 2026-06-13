import type { NormalizedPoint, TrackedHand } from '../../shared/runtime/types';

export type GestureAnchorMode = 'hidden' | 'one-hand' | 'two-hand';

export type GestureAnchor = {
  id: string;
  point: NormalizedPoint;
  direction: {
    x: number;
    y: number;
  };
};

export type GestureAnchorFrame = {
  mode: GestureAnchorMode;
  confidence: number;
  span: number;
  openness: number;
  rotation: number;
  primary?: GestureAnchor;
  left?: GestureAnchor;
  right?: GestureAnchor;
};

const MIN_TRACKING_CONFIDENCE = 0.2;
const THUMB_TIP_INDEX = 4;
const INDEX_TIP_INDEX = 8;
const OPENNESS_NORMALIZER = 0.18;

type HandAnchorSample = {
  hand: TrackedHand;
  anchor: GestureAnchor;
  openness: number;
};

export function deriveGestureAnchorFrame(hands: TrackedHand[]): GestureAnchorFrame {
  const anchors = hands
    .filter((hand) => hand.confidence > MIN_TRACKING_CONFIDENCE)
    .map(toHandAnchorSample);

  if (anchors.length === 0) {
    return createHiddenFrame();
  }

  if (anchors.length === 1) {
    const primary = anchors[0];

    return {
      mode: 'one-hand',
      confidence: clamp01(primary.hand.confidence),
      span: primary.openness * OPENNESS_NORMALIZER,
      openness: primary.openness,
      rotation: Math.atan2(primary.anchor.direction.y, primary.anchor.direction.x),
      primary: primary.anchor,
    };
  }

  anchors.sort((a, b) => a.anchor.point.x - b.anchor.point.x);
  const left = anchors[0];
  const right = anchors[anchors.length - 1];
  const dx = right.anchor.point.x - left.anchor.point.x;
  const dy = right.anchor.point.y - left.anchor.point.y;

  return {
    mode: 'two-hand',
    confidence: Math.min(clamp01(left.hand.confidence), clamp01(right.hand.confidence)),
    span: Math.hypot(dx, dy),
    openness: clamp01((left.openness + right.openness) / 2),
    rotation: Math.atan2(dy, dx),
    left: left.anchor,
    right: right.anchor,
  };
}

function toHandAnchorSample(hand: TrackedHand): HandAnchorSample {
  const thumb = hand.landmarks[THUMB_TIP_INDEX] ?? hand.landmarks[0] ?? { x: 0.5, y: 0.5 };
  const index = hand.landmarks[INDEX_TIP_INDEX] ?? hand.landmarks[0] ?? thumb;
  const dx = index.x - thumb.x;
  const dy = index.y - thumb.y;
  const distance = Math.hypot(dx, dy);

  return {
    hand,
    anchor: {
      id: hand.id,
      point: clampNormalizedPoint({
        x: (thumb.x + index.x) / 2,
        y: (thumb.y + index.y) / 2,
        z: averageOptional(thumb.z, index.z),
      }),
      direction: normalize2d(dx, dy),
    },
    openness: clamp01(distance / OPENNESS_NORMALIZER),
  };
}

function createHiddenFrame(): GestureAnchorFrame {
  return {
    mode: 'hidden',
    confidence: 0,
    span: 0,
    openness: 0,
    rotation: 0,
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

function averageOptional(left?: number, right?: number): number | undefined {
  if (left === undefined && right === undefined) {
    return undefined;
  }

  return ((left ?? 0) + (right ?? 0)) / 2;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
