import { describe, expect, it } from 'vitest';
import type { TrackedHand } from '../../shared/runtime/types';
import { deriveGestureAnchorFrame } from './anchorFrame';

function hand(id: string, x: number, y: number, confidence = 0.9): TrackedHand {
  return {
    id,
    handedness: 'unknown',
    confidence,
    landmarks: [
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x: x - 0.04, y, z: -0.03 },
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x: x + 0.04, y: y + 0.02, z: -0.01 },
    ],
  };
}

describe('deriveGestureAnchorFrame', () => {
  it('returns hidden when no confident hand is available', () => {
    expect(deriveGestureAnchorFrame([hand('low', 0.5, 0.5, 0.1)]).mode).toBe('hidden');
  });

  it('derives an explicit one-hand anchor frame from thumb and index tips', () => {
    const frame = deriveGestureAnchorFrame([hand('single', 0.4, 0.5)]);

    expect(frame.mode).toBe('one-hand');
    expect(frame.primary?.point.x).toBeCloseTo(0.4, 3);
    expect(frame.primary?.point.y).toBeCloseTo(0.51, 3);
    expect(frame.span).toBeGreaterThan(0.07);
    expect(frame.openness).toBeGreaterThan(0);
  });

  it('sorts two-hand anchors left-to-right in display space', () => {
    const frame = deriveGestureAnchorFrame([hand('right', 0.8, 0.5), hand('left', 0.2, 0.45)]);

    expect(frame.mode).toBe('two-hand');
    expect(frame.left?.point.x).toBeLessThan(frame.right?.point.x ?? 0);
    expect(frame.rotation).toBeCloseTo(Math.atan2(0.05, 0.6), 2);
  });
});
