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
const DUPLICATE_ANCHOR_DISTANCE = 0.12;
const DUPLICATE_SAME_HAND_DISTANCE = 0.18;
const DUPLICATE_BOUNDS_OVERLAP = 0.46;

type HandAnchorSample = {
  hand: TrackedHand;
  anchor: GestureAnchor;
  bounds: LandmarkBounds;
  openness: number;
};

export function deriveGestureAnchorFrame(hands: TrackedHand[]): GestureAnchorFrame {
  const anchors = hands
    .filter((hand) => hand.confidence > MIN_TRACKING_CONFIDENCE)
    .map(toHandAnchorSample);
  const uniqueAnchors = dedupeHandAnchorSamples(anchors);

  if (uniqueAnchors.length === 0) {
    return createHiddenFrame();
  }

  if (uniqueAnchors.length === 1) {
    const primary = uniqueAnchors[0];

    return {
      mode: 'one-hand',
      confidence: clamp01(primary.hand.confidence),
      span: primary.openness * OPENNESS_NORMALIZER,
      openness: primary.openness,
      rotation: Math.atan2(primary.anchor.direction.y, primary.anchor.direction.x),
      primary: primary.anchor,
    };
  }

  uniqueAnchors.sort((a, b) => a.anchor.point.x - b.anchor.point.x);
  const left = uniqueAnchors[0];
  const right = uniqueAnchors[uniqueAnchors.length - 1];
  const leftAnchor = toOuterHandAnchor(left, 'left');
  const rightAnchor = toOuterHandAnchor(right, 'right');
  const dx = rightAnchor.point.x - leftAnchor.point.x;
  const dy = rightAnchor.point.y - leftAnchor.point.y;

  return {
    mode: 'two-hand',
    confidence: Math.min(clamp01(left.hand.confidence), clamp01(right.hand.confidence)),
    span: Math.hypot(dx, dy),
    openness: clamp01((left.openness + right.openness) / 2),
    rotation: Math.atan2(dy, dx),
    left: leftAnchor,
    right: rightAnchor,
  };
}

export function getGestureAnchorHandCount(frame: GestureAnchorFrame): number {
  if (frame.mode === 'two-hand') {
    return 2;
  }

  if (frame.mode === 'one-hand') {
    return 1;
  }

  return 0;
}

function dedupeHandAnchorSamples(samples: HandAnchorSample[]): HandAnchorSample[] {
  const rankedSamples = [...samples].sort((a, b) => b.hand.confidence - a.hand.confidence);
  const uniqueSamples: HandAnchorSample[] = [];

  for (const sample of rankedSamples) {
    const duplicate = uniqueSamples.some((existing) => areDuplicateHands(existing, sample));

    if (!duplicate) {
      uniqueSamples.push(sample);
    }
  }

  return uniqueSamples;
}

function areDuplicateHands(left: HandAnchorSample, right: HandAnchorSample): boolean {
  const anchorDistance = Math.hypot(
    left.anchor.point.x - right.anchor.point.x,
    left.anchor.point.y - right.anchor.point.y,
  );
  const sameKnownHandedness =
    left.hand.handedness !== 'unknown' &&
    right.hand.handedness !== 'unknown' &&
    left.hand.handedness === right.hand.handedness;
  const boundsOverlap = getBoundsOverlapRatio(left.hand, right.hand);

  return (
    anchorDistance < DUPLICATE_ANCHOR_DISTANCE ||
    boundsOverlap > DUPLICATE_BOUNDS_OVERLAP ||
    (sameKnownHandedness && anchorDistance < DUPLICATE_SAME_HAND_DISTANCE)
  );
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
    bounds: getLandmarkBounds(hand),
    openness: clamp01(distance / OPENNESS_NORMALIZER),
  };
}

function toOuterHandAnchor(sample: HandAnchorSample, side: 'left' | 'right'): GestureAnchor {
  return {
    ...sample.anchor,
    point: {
      ...sample.anchor.point,
      x: side === 'left' ? sample.bounds.minX : sample.bounds.maxX,
    },
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

function getBoundsOverlapRatio(left: TrackedHand, right: TrackedHand): number {
  const leftBounds = getLandmarkBounds(left);
  const rightBounds = getLandmarkBounds(right);
  const intersectionWidth = Math.max(
    0,
    Math.min(leftBounds.maxX, rightBounds.maxX) - Math.max(leftBounds.minX, rightBounds.minX),
  );
  const intersectionHeight = Math.max(
    0,
    Math.min(leftBounds.maxY, rightBounds.maxY) - Math.max(leftBounds.minY, rightBounds.minY),
  );
  const intersectionArea = intersectionWidth * intersectionHeight;
  const smallerArea = Math.min(leftBounds.area, rightBounds.area);

  if (smallerArea === 0) {
    return 0;
  }

  return intersectionArea / smallerArea;
}

type LandmarkBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  area: number;
};

function getLandmarkBounds(hand: TrackedHand): LandmarkBounds {
  const xs = hand.landmarks.map((landmark) => landmark.x);
  const ys = hand.landmarks.map((landmark) => landmark.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    minX,
    maxX,
    minY,
    maxY,
    area: Math.max((maxX - minX) * (maxY - minY), Number.EPSILON),
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
