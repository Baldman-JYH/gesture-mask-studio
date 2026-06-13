import { describe, expect, it } from 'vitest';
import type { LightSheetGeometry } from '../../shared/runtime/types';
import {
  geometryToPositions,
  geometryToTriangleIndices,
  geometryToVideoUvs,
} from './rendererCore';

describe('rendererCore', () => {
  const geometry: LightSheetGeometry = {
    mode: 'two-hand-sheet',
    vertices: [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ],
    opacity: 0.8,
    confidence: 0.9,
  };

  it('converts normalized vertices to clip-space positions in order', () => {
    expect(Array.from(geometryToPositions(geometry))).toEqual([
      -1, 1, 0,
      1, 1, 0,
      1, -1, 0,
      -1, -1, 0,
    ]);
  });

  it('converts normalized vertices to mirrored video UVs in order', () => {
    expect(Array.from(geometryToVideoUvs(geometry, true))).toEqual([
      1, 0,
      0, 0,
      0, 1,
      1, 1,
    ]);
  });

  it('triangulates quad geometry without reordering vertices', () => {
    expect(Array.from(geometryToTriangleIndices(geometry))).toEqual([0, 1, 2, 0, 2, 3]);
  });
});
