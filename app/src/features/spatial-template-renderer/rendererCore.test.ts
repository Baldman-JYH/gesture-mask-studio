import { describe, expect, it } from 'vitest';
import type { SpatialTemplateMesh } from '../spatial-template-model/types';
import { spatialTemplateToBufferData } from './rendererCore';

const triangleMesh: SpatialTemplateMesh = {
  mode: 'one-hand-wedge',
  opacity: 0.8,
  confidence: 0.9,
  vertices: [
    { position: { x: 0.5, y: 0.4, z: 0.04 }, samplePoint: { x: 0.5, y: 0.4 } },
    { position: { x: 0.4, y: 0.6, z: 0.04 }, samplePoint: { x: 0.4, y: 0.6 } },
    { position: { x: 0.6, y: 0.6, z: 0.04 }, samplePoint: { x: 0.6, y: 0.6 } },
  ],
  faces: [{ indices: [0, 1, 2], materialId: 'scene' }],
};

const quadMesh: SpatialTemplateMesh = {
  mode: 'two-hand-ribbon',
  opacity: 0.8,
  confidence: 0.9,
  vertices: [
    { position: { x: 0.25, y: 0.4, z: 0.03 }, samplePoint: { x: 0.25, y: 0.4 } },
    { position: { x: 0.75, y: 0.4, z: 0.03 }, samplePoint: { x: 0.75, y: 0.4 } },
    { position: { x: 0.75, y: 0.6, z: 0.03 }, samplePoint: { x: 0.75, y: 0.6 } },
    { position: { x: 0.25, y: 0.6, z: 0.03 }, samplePoint: { x: 0.25, y: 0.6 } },
  ],
  faces: [{ indices: [0, 1, 2, 3], materialId: 'accent' }],
};

describe('spatialTemplateToBufferData', () => {
  it('converts display-space vertices into world positions and video uvs', () => {
    const data = spatialTemplateToBufferData(triangleMesh, {
      aspect: 2,
      videoMapping: { mirrored: false },
    });

    expect(data.positions[0]).toBeCloseTo(0, 6);
    expect(data.positions[1]).toBeCloseTo(0.2, 6);
    expect(data.positions[2]).toBeCloseTo(0.04, 6);
    expect(data.uvs[0]).toBeCloseTo(0.5, 6);
    expect(data.uvs[1]).toBeCloseTo(0.6, 6);
    expect(Array.from(data.indices)).toEqual([0, 1, 2]);
    expect(data.groups[0]).toEqual({ start: 0, count: 3, materialIndex: 0 });
  });

  it('triangulates quad faces and assigns the matching material group', () => {
    const data = spatialTemplateToBufferData(quadMesh, {
      aspect: 1,
      videoMapping: { mirrored: false },
    });

    expect(Array.from(data.indices)).toEqual([0, 1, 2, 0, 2, 3]);
    expect(data.groups[0]).toEqual({ start: 0, count: 6, materialIndex: 1 });
  });
});
