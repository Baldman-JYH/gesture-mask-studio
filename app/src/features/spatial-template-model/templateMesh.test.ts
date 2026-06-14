import { describe, expect, it } from 'vitest';
import type { NormalizedPoint, TrackedHand } from '../../shared/runtime/types';
import type { GestureAnchorFrame } from '../gesture-anchor-frame/anchorFrame';
import { buildSpatialTemplateMesh, buildSpatialTemplateMeshFromHands } from './templateMesh';

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

  it('builds a one-hand folded rectangular 3D template, not a triangle', () => {
    const mesh = buildSpatialTemplateMesh(oneHandFrame);
    const materialIds = Array.from(new Set(mesh.faces.map((face) => face.materialId)));
    const zLevels = uniqueZLevels(mesh);

    expect(mesh.mode).toBe('one-hand-template');
    expect(mesh.vertices.length).toBeGreaterThanOrEqual(12);
    expect(mesh.faces.every((face) => face.indices.length === 4)).toBe(true);
    expect(materialIds).toEqual(expect.arrayContaining(['scene', 'panel', 'back', 'edge']));
    expect(zLevels.length).toBeGreaterThanOrEqual(3);
  });

  it('builds a two-hand folded multi-face 3D template with distinct material groups', () => {
    const mesh = buildSpatialTemplateMesh(twoHandFrame);
    const materialIds = Array.from(new Set(mesh.faces.map((face) => face.materialId)));
    const zLevels = uniqueZLevels(mesh);

    expect(mesh.mode).toBe('two-hand-template');
    expect(mesh.vertices.length).toBeGreaterThan(8);
    expect(mesh.faces.length).toBeGreaterThan(8);
    expect(materialIds).toEqual(expect.arrayContaining(['scene', 'panel', 'back', 'accent', 'edge']));
    expect(zLevels.length).toBeGreaterThanOrEqual(3);
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

  it('builds the primary two-hand mesh from fingertip topology instead of anchor templates', () => {
    const mesh = buildSpatialTemplateMeshFromHands([
      topologyHand('right', 'right', 0.78),
      topologyHand('left', 'left', 0.22),
    ]);

    expect(mesh.mode).toBe('two-hand-lattice');
    expect(mesh.vertices.length).toBeGreaterThanOrEqual(20);
    expect(mesh.faces.every((face) => face.indices.length === 3)).toBe(true);
    expect(mesh.faces.length).toBeGreaterThan(20);
  });
});

function uniqueZLevels(mesh: ReturnType<typeof buildSpatialTemplateMesh>): number[] {
  return Array.from(
    new Set(mesh.vertices.map((vertex) => Math.round((vertex.position.z ?? 0) * 1000) / 1000)),
  );
}

function topologyHand(
  id: string,
  handedness: TrackedHand['handedness'],
  centerX: number,
): TrackedHand {
  const tips = {
    A: { x: centerX - 0.12, y: 0.52, z: -0.04 },
    B: { x: centerX - 0.06, y: 0.36, z: -0.08 },
    C: { x: centerX, y: 0.3, z: -0.1 },
    D: { x: centerX + 0.06, y: 0.36, z: -0.07 },
    E: { x: centerX + 0.12, y: 0.46, z: -0.05 },
  } satisfies Record<'A' | 'B' | 'C' | 'D' | 'E', NormalizedPoint>;
  const landmarks = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.58, z: -0.02 }));
  landmarks[0] = { x: tips.C.x, y: 0.72, z: 0 };
  landmarks[4] = tips.A;
  landmarks[5] = { x: tips.B.x, y: 0.58, z: -0.03 };
  landmarks[8] = tips.B;
  landmarks[9] = { x: tips.C.x, y: 0.58, z: -0.03 };
  landmarks[12] = tips.C;
  landmarks[13] = { x: tips.D.x, y: 0.58, z: -0.03 };
  landmarks[16] = tips.D;
  landmarks[17] = { x: tips.E.x, y: 0.58, z: -0.03 };
  landmarks[20] = tips.E;

  return {
    id,
    handedness,
    confidence: 0.9,
    landmarks,
  };
}
