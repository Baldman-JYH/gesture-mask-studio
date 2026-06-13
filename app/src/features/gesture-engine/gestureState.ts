import type {
  LightSheetGestureState,
  NormalizedPoint,
  TrackedHand,
} from '../../shared/runtime/types';
import { getLightSheetStylePreset } from '../light-sheet-styles/presets';
import { clampNormalizedPoint } from './geometry';

type DeriveGestureStateInput = {
  hands: TrackedHand[];
  requestedPresetId: string;
};

const THUMB_TIP_INDEX = 4;
const INDEX_TIP_INDEX = 8;

export function deriveLightSheetGestureState(
  input: DeriveGestureStateInput,
): LightSheetGestureState {
  const stylePresetId = getLightSheetStylePreset(input.requestedPresetId).id;
  const trackedHands = input.hands.filter((hand) => hand.confidence > 0.2);

  if (trackedHands.length === 0) {
    return {
      mode: 'hidden',
      confidence: 0,
      stylePresetId,
      anchors: { left: { x: 0.5, y: 0.5 } },
      openness: 0,
      rotation: 0,
    };
  }

  const anchors = trackedHands.map((hand) => ({
    hand,
    anchor: getPinchAnchor(hand),
    openness: getHandOpenness(hand),
  }));

  anchors.sort((a, b) => a.anchor.x - b.anchor.x);

  if (anchors.length === 1) {
    return {
      mode: 'one-hand-preview',
      confidence: anchors[0].hand.confidence,
      stylePresetId,
      anchors: { left: anchors[0].anchor },
      openness: anchors[0].openness,
      rotation: 0,
    };
  }

  const left = anchors[0];
  const right = anchors[anchors.length - 1];

  return {
    mode: 'two-hand-sheet',
    confidence: Math.min(left.hand.confidence, right.hand.confidence),
    stylePresetId,
    anchors: {
      left: left.anchor,
      right: right.anchor,
    },
    openness: clamp01((left.openness + right.openness) / 2),
    rotation: Math.atan2(right.anchor.y - left.anchor.y, right.anchor.x - left.anchor.x),
  };
}

function getPinchAnchor(hand: TrackedHand): NormalizedPoint {
  const thumb = hand.landmarks[THUMB_TIP_INDEX] ?? hand.landmarks[0] ?? { x: 0.5, y: 0.5 };
  const index = hand.landmarks[INDEX_TIP_INDEX] ?? hand.landmarks[0] ?? thumb;

  return clampNormalizedPoint({
    x: (thumb.x + index.x) / 2,
    y: (thumb.y + index.y) / 2,
    z: averageOptional(thumb.z, index.z),
  });
}

function getHandOpenness(hand: TrackedHand): number {
  const thumb = hand.landmarks[THUMB_TIP_INDEX];
  const index = hand.landmarks[INDEX_TIP_INDEX];

  if (!thumb || !index) {
    return 0.4;
  }

  const distance = Math.hypot(index.x - thumb.x, index.y - thumb.y);
  return clamp01(distance / 0.18);
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
