import { describe, expect, it } from 'vitest';
import { toVideoUv } from './screenSpaceSampling';

describe('toVideoUv', () => {
  it('maps display-space points to unmirrored Three.js video texture UVs', () => {
    expect(toVideoUv({ x: 0.25, y: 0.75 }, { mirrored: false })).toEqual({ u: 0.25, v: 0.25 });
  });

  it('maps display-space points to mirrored Three.js video texture UVs', () => {
    expect(toVideoUv({ x: 0.25, y: 0.75 }, { mirrored: true })).toEqual({ u: 0.75, v: 0.25 });
  });

  it('clamps points to the video sampling area', () => {
    expect(toVideoUv({ x: -0.5, y: 1.4 }, { mirrored: false })).toEqual({ u: 0, v: 0 });
  });

  it('maps through object-fit cover when the viewport is wider than the camera video', () => {
    const mapping = {
      mirrored: false,
      viewport: { width: 3200, height: 900 },
      video: { width: 1600, height: 900 },
    };

    expect(toVideoUv({ x: 0.5, y: 0 }, mapping)).toEqual({ u: 0.5, v: 0.75 });
    expect(toVideoUv({ x: 0.5, y: 1 }, mapping)).toEqual({ u: 0.5, v: 0.25 });
  });

  it('maps mirrored x through object-fit cover when the viewport is taller than the camera video', () => {
    const mapping = {
      mirrored: true,
      viewport: { width: 900, height: 1600 },
      video: { width: 1600, height: 900 },
    };

    expect(toVideoUv({ x: 0, y: 0.5 }, mapping).u).toBeCloseTo(0.658, 3);
    expect(toVideoUv({ x: 1, y: 0.5 }, mapping).u).toBeCloseTo(0.342, 3);
  });
});
