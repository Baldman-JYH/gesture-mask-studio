import { describe, expect, it } from 'vitest';
import type { TrackedHand } from '../../shared/runtime/types';
import { deriveGestureAnchorFrame, getGestureAnchorHandCount } from './anchorFrame';

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
    expect(frame.rotation).toBeCloseTo(
      Math.atan2(
        (frame.right?.point.y ?? 0) - (frame.left?.point.y ?? 0),
        (frame.right?.point.x ?? 0) - (frame.left?.point.x ?? 0),
      ),
      3,
    );
  });

  it('uses the visible outer hand bounds for two-hand projection span', () => {
    const frame = deriveGestureAnchorFrame([
      openPalm('left', {
        innerThumbX: 0.35,
        innerIndexX: 0.39,
        outerX: 0.16,
        y: 0.48,
      }),
      openPalm('right', {
        innerThumbX: 0.61,
        innerIndexX: 0.65,
        outerX: 0.84,
        y: 0.46,
      }),
    ]);

    expect(frame.mode).toBe('two-hand');
    expect(frame.left?.point.x).toBeCloseTo(0.16);
    expect(frame.right?.point.x).toBeCloseTo(0.84);
    expect(frame.span).toBeGreaterThan(0.66);
  });

  it('collapses duplicate detections from one physical hand into one usable anchor', () => {
    const frame = deriveGestureAnchorFrame([
      hand('primary', 0.42, 0.52, 0.94),
      hand('duplicate', 0.445, 0.535, 0.72),
    ]);

    expect(frame.mode).toBe('one-hand');
    expect(frame.primary?.id).toBe('primary');
    expect(getGestureAnchorHandCount(frame)).toBe(1);
  });

  it('reports usable hand count from the filtered anchor frame mode', () => {
    expect(getGestureAnchorHandCount(deriveGestureAnchorFrame([]))).toBe(0);
    expect(getGestureAnchorHandCount(deriveGestureAnchorFrame([hand('single', 0.45, 0.5)]))).toBe(1);
    expect(
      getGestureAnchorHandCount(
        deriveGestureAnchorFrame([hand('left', 0.2, 0.5), hand('right', 0.8, 0.5)]),
      ),
    ).toBe(2);
  });
});

function openPalm(
  id: string,
  options: {
    innerThumbX: number;
    innerIndexX: number;
    outerX: number;
    y: number;
  },
): TrackedHand {
  const centerX = (options.innerThumbX + options.innerIndexX) / 2;
  const landmarks = Array.from({ length: 21 }, () => ({ x: centerX, y: options.y, z: -0.02 }));
  landmarks[0] = { x: centerX, y: options.y + 0.16, z: 0 };
  landmarks[4] = { x: options.innerThumbX, y: options.y + 0.02, z: -0.04 };
  landmarks[8] = { x: options.innerIndexX, y: options.y - 0.12, z: -0.06 };
  landmarks[12] = { x: options.outerX, y: options.y - 0.16, z: -0.05 };
  landmarks[16] = { x: options.outerX, y: options.y - 0.08, z: -0.04 };
  landmarks[20] = { x: options.outerX, y: options.y + 0.02, z: -0.03 };

  return {
    id,
    handedness: 'unknown',
    confidence: 0.9,
    landmarks,
  };
}
