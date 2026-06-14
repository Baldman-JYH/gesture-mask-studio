import { describe, expect, it } from 'vitest';
import type { NormalizedPoint, TrackedHand } from '../../shared/runtime/types';
import { extractHandTopologyFrame } from './handTopology';

describe('extractHandTopologyFrame', () => {
  it('maps MediaPipe fingertip landmarks to semantic A through E points', () => {
    const frame = extractHandTopologyFrame([
      hand('left-hand', 'left', {
        0: { x: 0.4, y: 0.7, z: 0 },
        4: { x: 0.32, y: 0.48, z: -0.04 },
        8: { x: 0.38, y: 0.32, z: -0.08 },
        12: { x: 0.43, y: 0.28, z: -0.1 },
        16: { x: 0.48, y: 0.34, z: -0.07 },
        20: { x: 0.54, y: 0.42, z: -0.05 },
      }),
    ]);

    expect(frame.mode).toBe('one-hand');
    expect(frame.primary?.fingertips.A).toEqual({ x: 0.32, y: 0.48, z: -0.04 });
    expect(frame.primary?.fingertips.B).toEqual({ x: 0.38, y: 0.32, z: -0.08 });
    expect(frame.primary?.fingertips.C).toEqual({ x: 0.43, y: 0.28, z: -0.1 });
    expect(frame.primary?.fingertips.D).toEqual({ x: 0.48, y: 0.34, z: -0.07 });
    expect(frame.primary?.fingertips.E).toEqual({ x: 0.54, y: 0.42, z: -0.05 });
  });

  it('sorts two valid topology hands left-to-right in display space', () => {
    const frame = extractHandTopologyFrame([
      hand('right-display', 'right', {
        0: { x: 0.8, y: 0.72 },
        4: { x: 0.7, y: 0.5 },
        8: { x: 0.76, y: 0.34 },
        12: { x: 0.82, y: 0.3 },
        16: { x: 0.88, y: 0.36 },
        20: { x: 0.94, y: 0.45 },
      }),
      hand('left-display', 'left', {
        0: { x: 0.2, y: 0.72 },
        4: { x: 0.1, y: 0.5 },
        8: { x: 0.16, y: 0.34 },
        12: { x: 0.22, y: 0.3 },
        16: { x: 0.28, y: 0.36 },
        20: { x: 0.34, y: 0.45 },
      }),
    ]);

    expect(frame.mode).toBe('two-hand');
    expect(frame.left?.id).toBe('left-display');
    expect(frame.right?.id).toBe('right-display');
    expect(frame.left?.palmCenter.x).toBeLessThan(frame.right?.palmCenter.x ?? 0);
  });

  it('returns hidden when required fingertip landmarks are missing', () => {
    const frame = extractHandTopologyFrame([
      {
        id: 'partial',
        handedness: 'unknown',
        confidence: 0.9,
        landmarks: [{ x: 0.5, y: 0.6 }],
      },
    ]);

    expect(frame.mode).toBe('hidden');
    expect(frame.hands).toHaveLength(0);
  });
});

function hand(
  id: string,
  handedness: TrackedHand['handedness'],
  points: Record<number, NormalizedPoint>,
): TrackedHand {
  const landmarks = Array.from({ length: 21 }, (_, index) => points[index] ?? { x: 0.5, y: 0.5 });

  return {
    id,
    handedness,
    confidence: 0.9,
    landmarks,
  };
}
