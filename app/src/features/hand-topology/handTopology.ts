import type { NormalizedPoint, TrackedHand } from '../../shared/runtime/types';

export type FingertipId = 'A' | 'B' | 'C' | 'D' | 'E';

export type FingertipSet = Record<FingertipId, NormalizedPoint>;

export type HandTopology = {
  id: string;
  handedness: TrackedHand['handedness'];
  confidence: number;
  fingertips: FingertipSet;
  palmCenter: NormalizedPoint;
};

export type HandTopologyFrame = {
  mode: 'hidden' | 'one-hand' | 'two-hand';
  hands: HandTopology[];
  primary?: HandTopology;
  left?: HandTopology;
  right?: HandTopology;
  confidence: number;
};

const MIN_TRACKING_CONFIDENCE = 0.2;
const DUPLICATE_PALM_DISTANCE = 0.08;
const DUPLICATE_BOUNDS_OVERLAP = 0.46;
const FINGERTIP_INDICES: Record<FingertipId, number> = {
  A: 4,
  B: 8,
  C: 12,
  D: 16,
  E: 20,
};
const PALM_STABILIZER_INDICES = [0, 5, 9, 13, 17];

export function extractHandTopologyFrame(hands: TrackedHand[]): HandTopologyFrame {
  const topologyHands = hands
    .filter((hand) => hand.confidence > MIN_TRACKING_CONFIDENCE)
    .map(toHandTopology)
    .filter((hand): hand is HandTopology => hand !== null)
    .sort((left, right) => right.confidence - left.confidence)
    .reduce<HandTopology[]>((uniqueHands, hand) => {
      if (!uniqueHands.some((existing) => areDuplicateHands(existing, hand))) {
        uniqueHands.push(hand);
      }

      return uniqueHands;
    }, [])
    .sort((left, right) => left.palmCenter.x - right.palmCenter.x);

  if (topologyHands.length === 0) {
    return {
      mode: 'hidden',
      hands: [],
      confidence: 0,
    };
  }

  if (topologyHands.length === 1) {
    return {
      mode: 'one-hand',
      hands: topologyHands,
      primary: topologyHands[0],
      confidence: topologyHands[0].confidence,
    };
  }

  const left = topologyHands[0];
  const right = topologyHands[topologyHands.length - 1];

  return {
    mode: 'two-hand',
    hands: [left, right],
    left,
    right,
    confidence: Math.min(left.confidence, right.confidence),
  };
}

function toHandTopology(hand: TrackedHand): HandTopology | null {
  if (!hasRequiredLandmarks(hand)) {
    return null;
  }

  return {
    id: hand.id,
    handedness: hand.handedness,
    confidence: clamp01(hand.confidence),
    fingertips: {
      A: clampNormalizedPoint(hand.landmarks[FINGERTIP_INDICES.A]),
      B: clampNormalizedPoint(hand.landmarks[FINGERTIP_INDICES.B]),
      C: clampNormalizedPoint(hand.landmarks[FINGERTIP_INDICES.C]),
      D: clampNormalizedPoint(hand.landmarks[FINGERTIP_INDICES.D]),
      E: clampNormalizedPoint(hand.landmarks[FINGERTIP_INDICES.E]),
    },
    palmCenter: averagePoints(PALM_STABILIZER_INDICES.map((index) => hand.landmarks[index])),
  };
}

function hasRequiredLandmarks(hand: TrackedHand): boolean {
  return Object.values(FINGERTIP_INDICES)
    .concat(PALM_STABILIZER_INDICES)
    .every((index) => isPoint(hand.landmarks[index]));
}

function areDuplicateHands(left: HandTopology, right: HandTopology): boolean {
  const palmDistance = Math.hypot(
    left.palmCenter.x - right.palmCenter.x,
    left.palmCenter.y - right.palmCenter.y,
  );
  const sameKnownHandedness =
    left.handedness !== 'unknown' &&
    right.handedness !== 'unknown' &&
    left.handedness === right.handedness;

  return (
    palmDistance < DUPLICATE_PALM_DISTANCE ||
    getFingertipBoundsOverlap(left, right) > DUPLICATE_BOUNDS_OVERLAP ||
    (sameKnownHandedness && palmDistance < DUPLICATE_PALM_DISTANCE * 1.5)
  );
}

function getFingertipBoundsOverlap(left: HandTopology, right: HandTopology): number {
  const leftBounds = getFingertipBounds(left);
  const rightBounds = getFingertipBounds(right);
  const intersectionWidth = Math.max(
    0,
    Math.min(leftBounds.maxX, rightBounds.maxX) - Math.max(leftBounds.minX, rightBounds.minX),
  );
  const intersectionHeight = Math.max(
    0,
    Math.min(leftBounds.maxY, rightBounds.maxY) - Math.max(leftBounds.minY, rightBounds.minY),
  );
  const smallerArea = Math.min(leftBounds.area, rightBounds.area);

  if (smallerArea === 0) {
    return 0;
  }

  return (intersectionWidth * intersectionHeight) / smallerArea;
}

function getFingertipBounds(hand: HandTopology): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  area: number;
} {
  const points = Object.values(hand.fingertips);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
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

function isPoint(point: NormalizedPoint | undefined): point is NormalizedPoint {
  return point !== undefined && Number.isFinite(point.x) && Number.isFinite(point.y);
}

function averagePoints(points: NormalizedPoint[]): NormalizedPoint {
  const totals = points.reduce<{
    x: number;
    y: number;
    z: number;
    zCount: number;
  }>(
    (sum, point) => ({
      x: sum.x + point.x,
      y: sum.y + point.y,
      z: sum.z + (point.z ?? 0),
      zCount: sum.zCount + (point.z === undefined ? 0 : 1),
    }),
    { x: 0, y: 0, z: 0, zCount: 0 },
  );

  return clampNormalizedPoint({
    x: totals.x / points.length,
    y: totals.y / points.length,
    ...(totals.zCount === 0 ? {} : { z: totals.z / totals.zCount }),
  });
}

function clampNormalizedPoint(point: NormalizedPoint): NormalizedPoint {
  return {
    x: clamp01(point.x),
    y: clamp01(point.y),
    ...(point.z === undefined ? {} : { z: point.z }),
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
