import { describe, expect, it } from 'vitest';
import { toVideoUv } from './screenSpaceSampling';

describe('toVideoUv', () => {
  it('maps normalized screen points to unmirrored video UVs', () => {
    expect(toVideoUv({ x: 0.25, y: 0.75 }, false)).toEqual({ u: 0.25, v: 0.75 });
  });

  it('maps normalized screen points to mirrored video UVs', () => {
    expect(toVideoUv({ x: 0.25, y: 0.75 }, true)).toEqual({ u: 0.75, v: 0.75 });
  });

  it('clamps points to the video sampling area', () => {
    expect(toVideoUv({ x: -0.5, y: 1.4 }, false)).toEqual({ u: 0, v: 1 });
  });
});
