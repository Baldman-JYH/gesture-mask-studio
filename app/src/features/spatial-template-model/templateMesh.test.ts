import { describe, expect, it } from 'vitest';
import type { GestureAnchorFrame } from '../gesture-anchor-frame/anchorFrame';
import { buildSpatialTemplateMesh } from './templateMesh';

const hiddenFrame: GestureAnchorFrame = {
  mode: 'hidden',
  confidence: 0,
  span: 0,
  openness: 0,
  rotation: 0,
};

const oneHandFrame: GestureAnchorFrame = {
  mode: 'one-hand',
  confidence: 0.9,
  span: 0.12,
  openness: 0.6,
  rotation: 0,
  primary: {
    id: 'single',
    point: { x: 0.5, y: 0.5, z: -0.02 },
    direction: { x: 1, y: 0 },
  },
};

const twoHandFrame: GestureAnchorFrame = {
  mode: 'two-hand',
  confidence: 0.85,
  span: 0.5,
  openness: 0.7,
  rotation: 0,
  left: {
    id: 'left',
    point: { x: 0.25, y: 0.5, z: -0.02 },
    direction: { x: 1, y: 0 },
  },
  right: {
    id: 'right',
    point: { x: 0.75, y: 0.5, z: -0.02 },
    direction: { x: 1, y: 0 },
  },
};

describe('buildSpatialTemplateMesh', () => {
  it('returns an empty hidden mesh for hidden anchor frames', () => {
    const mesh = buildSpatialTemplateMesh(hiddenFrame);

    expect(mesh.mode).toBe('hidden');
    expect(mesh.vertices).toHaveLength(0);
    expect(mesh.faces).toHaveLength(0);
  });

  it('builds a one-hand triangular prism with multiple material faces', () => {
    const mesh = buildSpatialTemplateMesh(oneHandFrame);

    expect(mesh.mode).toBe('one-hand-wedge');
    expect(mesh.vertices).toHaveLength(6);
    expect(mesh.faces.some((face) => face.materialId === 'scene')).toBe(true);
    expect(mesh.faces.some((face) => face.materialId === 'edge')).toBe(true);
  });

  it('builds a two-hand ribbon prism with front, back, and edge faces', () => {
    const mesh = buildSpatialTemplateMesh(twoHandFrame);

    expect(mesh.mode).toBe('two-hand-ribbon');
    expect(mesh.vertices).toHaveLength(8);
    expect(mesh.faces).toHaveLength(6);
    expect(mesh.faces[0].materialId).toBe('scene');
    expect(mesh.faces[1].materialId).toBe('accent');
  });

  it('keeps generated display-space sample points inside normalized bounds', () => {
    const mesh = buildSpatialTemplateMesh(twoHandFrame);

    for (const vertex of mesh.vertices) {
      expect(vertex.samplePoint.x).toBeGreaterThanOrEqual(0);
      expect(vertex.samplePoint.x).toBeLessThanOrEqual(1);
      expect(vertex.samplePoint.y).toBeGreaterThanOrEqual(0);
      expect(vertex.samplePoint.y).toBeLessThanOrEqual(1);
    }
  });
});
