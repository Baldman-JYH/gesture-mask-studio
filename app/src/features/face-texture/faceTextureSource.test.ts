import { describe, expect, it } from 'vitest';
import {
  clampFaceRoi,
  deriveGestureFaceRoi,
  fallbackFaceRoi,
  smoothFaceRoi,
} from './faceTextureSource';

describe('faceTextureSource', () => {
  it('clamps face ROI inside video bounds', () => {
    expect(clampFaceRoi({ x: -0.1, y: 0.2, width: 1.3, height: 0.9 })).toEqual({
      x: 0,
      y: 0.2,
      width: 1,
      height: 0.8,
    });
  });

  it('smooths face ROI to avoid texture jumps', () => {
    const previous = { x: 0.3, y: 0.2, width: 0.28, height: 0.38 };
    const next = { x: 0.5, y: 0.35, width: 0.2, height: 0.3 };

    expect(smoothFaceRoi(previous, next, 0.25)).toEqual({
      x: 0.35,
      y: 0.2375,
      width: 0.26,
      height: 0.36,
    });
  });

  it('clamps smoothing amount to avoid extrapolated face crops', () => {
    const previous = { x: 0.2, y: 0.2, width: 0.3, height: 0.4 };
    const next = { x: 0.6, y: 0.4, width: 0.2, height: 0.3 };

    expect(smoothFaceRoi(previous, next, -0.5)).toEqual(previous);
    expect(smoothFaceRoi(previous, next, 1.5)).toEqual(next);
  });

  it('uses a portrait-centered fallback when face detection is unavailable', () => {
    expect(fallbackFaceRoi()).toEqual({
      x: 0.3,
      y: 0.24,
      width: 0.4,
      height: 0.56,
    });
  });

  it('derives a broad portrait crop from the live template center and span', () => {
    expect(deriveGestureFaceRoi({ x: 0.62, y: 0.7 }, 0.58)).toEqual({
      x: 0.39,
      y: 0.4092,
      width: 0.46,
      height: 0.558,
    });
  });
});
