import type {
  LightSheetGestureState,
  NormalizedPoint,
  TrackedHand,
} from '../../shared/runtime/types';
import { getLightSheetStylePreset } from '../light-sheet-styles/presets';
import { clampNormalizedPoint } from './geometry';

type DeriveGestureStateInput = {
  hands: TrackedHand[];
  requestedPresetId?: string;
};

const THUMB_TIP_INDEX = 4;
const INDEX_TIP_INDEX = 8;
const CARDS_STYLE_OPENNESS_MAX = 0.35;
const ORGANIC_STYLE_OPENNESS_MIN = 0.72;

export function deriveLightSheetGestureState(
  input: DeriveGestureStateInput,
): LightSheetGestureState {
  const trackedHands = input.hands.filter((hand) => hand.confidence > 0.2);

  if (trackedHands.length < 2) {
    return createHiddenGestureState(input.requestedPresetId);
  }

  const anchors = trackedHands.map((hand) => ({
    hand,
    anchor: getPinchAnchor(hand),
    openness: getHandOpenness(hand),
  }));
  const stylePresetId = getResolvedStylePresetId(
    input.requestedPresetId,
    anchors.map((anchor) => anchor.openness),
  );

  anchors.sort((a, b) => a.anchor.x - b.anchor.x);

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

function createHiddenGestureState(requestedPresetId: string | undefined): LightSheetGestureState {
  return {
    mode: 'hidden',
    confidence: 0,
    stylePresetId: getResolvedStylePresetId(requestedPresetId, []),
    anchors: { left: { x: 0.5, y: 0.5 } },
    openness: 0,
    rotation: 0,
  };
}

function getResolvedStylePresetId(
  requestedPresetId: string | undefined,
  opennessValues: number[],
): string {
  if (requestedPresetId !== undefined) {
    return getLightSheetStylePreset(requestedPresetId).id;
  }

  if (opennessValues.length < 2) {
    return 'blueprint';
  }

  const averageOpenness = opennessValues.reduce((sum, value) => sum + value, 0) / opennessValues.length;

  if (averageOpenness < CARDS_STYLE_OPENNESS_MAX) {
    return 'cards';
  }

  if (averageOpenness > ORGANIC_STYLE_OPENNESS_MIN) {
    return 'organic';
  }

  return 'blueprint';
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
