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
    expect(Array.from(geometryToVideoUvs(geometry, { mirrored: true }))).toEqual([
      1, 1,
      0, 1,
      0, 0,
      1, 0,
    ]);
  });

  it('converts vertices to video UVs with the visible cover crop applied', () => {
    expect(Array.from(geometryToVideoUvs(geometry, {
      mirrored: false,
      viewport: { width: 3200, height: 900 },
      video: { width: 1600, height: 900 },
    }))).toEqual([
      0, 0.75,
      1, 0.75,
      1, 0.25,
      0, 0.25,
    ]);
  });

  it('triangulates quad geometry without reordering vertices', () => {
    expect(Array.from(geometryToTriangleIndices(geometry))).toEqual([0, 1, 2, 0, 2, 3]);
  });
});
