import { describe, expect, it } from 'vitest';
import type { NormalizedPoint, TrackedHand } from '../../shared/runtime/types';
import { buildSpatialTemplateMeshFromHands } from './templateMesh';

describe('buildSpatialTemplateMeshFromHands', () => {
  it('returns an empty hidden mesh when no fingertip topology is available', () => {
    const mesh = buildSpatialTemplateMeshFromHands([]);

    expect(mesh.mode).toBe('hidden');
    expect(mesh.vertices).toHaveLength(0);
    expect(mesh.faces).toHaveLength(0);
    expect(mesh.opacity).toBe(0);
  });

  it('builds the primary two-hand reference template from hand topology', () => {
    const mesh = buildSpatialTemplateMeshFromHands([
      topologyHand('right', 'right', 0.78),
      topologyHand('left', 'left', 0.22),
    ]);

    expect(mesh.mode).toBe('two-hand-template');
    expect(mesh.vertices.length).toBeGreaterThanOrEqual(6);
    expect(mesh.faces.some((face) => face.materialId === 'face-blue')).toBe(true);
    expect(mesh.faces.some((face) => face.materialId === 'edge-white')).toBe(true);
  });

  it('builds one-hand mode as a reference wedge instead of a raw fingertip face', () => {
    const mesh = buildSpatialTemplateMeshFromHands([
      topologyHand('single', 'left', 0.45),
    ]);

    expect(mesh.mode).toBe('one-hand-template');
    expect(mesh.vertices.length).toBeGreaterThanOrEqual(5);
    expect(mesh.faces.some((face) => face.materialId === 'face-blue')).toBe(true);
    expect(mesh.faces.some((face) => face.materialId === 'edge-white')).toBe(true);
  });
});

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
