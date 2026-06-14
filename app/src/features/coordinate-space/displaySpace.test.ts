import { describe, expect, it } from 'vitest';
import type { TrackedHand } from '../../shared/runtime/types';
import { toDisplayHands } from './displaySpace';

function trackedHand(): TrackedHand {
  return {
    id: 'hand-1',
    handedness: 'right',
    confidence: 0.93,
    landmarks: [
      { x: 0.2, y: 0.3, z: -0.01 },
      { x: 0.7, y: 0.8, z: 0.02 },
    ],
  };
}

describe('toDisplayHands', () => {
  it('keeps hand landmarks unchanged when the preview is not mirrored', () => {
    expect(toDisplayHands([trackedHand()], false)).toEqual([trackedHand()]);
  });

  it('mirrors landmark x coordinates before visible geometry is derived', () => {
    const [hand] = toDisplayHands([trackedHand()], true);

    expect(hand.id).toBe('hand-1');
    expect(hand.handedness).toBe('right');
    expect(hand.confidence).toBe(0.93);
    expect(hand.landmarks[0]).toEqual({ x: 0.8, y: 0.3, z: -0.01 });
    expect(hand.landmarks[1].x).toBeCloseTo(0.3);
    expect(hand.landmarks[1].y).toBe(0.8);
    expect(hand.landmarks[1].z).toBe(0.02);
  });

  it('maps source video landmarks through object-fit cover before mirroring', () => {
    const [hand] = toDisplayHands([trackedHand()], true, {
      viewport: { width: 1904, height: 878 },
      video: { width: 1280, height: 720 },
    });

    expect(hand.landmarks[0].x).toBeCloseTo(0.8, 6);
    expect(hand.landmarks[0].y).toBeCloseTo(0.256036, 6);
    expect(hand.landmarks[1].x).toBeCloseTo(0.3, 6);
    expect(hand.landmarks[1].y).toBeCloseTo(0.865945, 6);
  });

  it('does not mutate the camera-space tracking result', () => {
    const hand = trackedHand();
    toDisplayHands([hand], true);

    expect(hand.landmarks[0]).toEqual({ x: 0.2, y: 0.3, z: -0.01 });
  });
});
