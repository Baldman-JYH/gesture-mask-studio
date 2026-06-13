import type { NormalizedPoint, TrackedHand } from '../../shared/runtime/types';

export function toDisplayHands(hands: TrackedHand[], mirrored: boolean): TrackedHand[] {
  if (!mirrored) {
    return hands;
  }

  return hands.map((hand) => ({
    ...hand,
    landmarks: hand.landmarks.map(toMirroredDisplayPoint),
  }));
}

function toMirroredDisplayPoint(point: NormalizedPoint): NormalizedPoint {
  return {
    ...point,
    x: 1 - point.x,
  };
}
