import { describe, expect, it } from 'vitest';
import type { NormalizedPoint, TrackedHand } from '../../shared/runtime/types';
import { extractHandTopologyFrame } from '../hand-topology/handTopology';
import { buildFingertipLattice } from './fingertipLattice';

describe('buildFingertipLattice', () => {
  it('builds five fingertip cross rails and five closed strip faces for two hands', () => {
    const lattice = buildFingertipLattice(extractHandTopologyFrame([
      hand('right', 'right', 0.78),
      hand('left', 'left', 0.22),
    ]));

    expect(lattice.mode).toBe('two-hand-lattice');
    expect(lattice.crossRails.map((rail) => rail.finger)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(lattice.strips.map((strip) => strip.id)).toEqual(['AB', 'BC', 'CD', 'DE', 'EA']);
    expect(lattice.caps.map((cap) => cap.id)).toEqual(['left-hand', 'right-hand']);
    expect(lattice.faces.every((face) => face.indices.length === 3)).toBe(true);
    expect(lattice.faces.length).toBeGreaterThanOrEqual(24);
  });

  it('adds thickness, back faces, and stable material groups', () => {
    const lattice = buildFingertipLattice(extractHandTopologyFrame([
      hand('left', 'left', 0.2),
      hand('right', 'right', 0.8),
    ]));
    const materialIds = Array.from(new Set(lattice.faces.map((face) => face.materialId)));
    const zLevels = Array.from(
      new Set(lattice.vertices.map((vertex) => Math.round((vertex.position.z ?? 0) * 1000) / 1000)),
    );

    expect(lattice.vertices.length).toBeGreaterThan(10);
    expect(materialIds).toEqual(expect.arrayContaining(['scene', 'panel', 'back', 'accent', 'cap', 'edge']));
    expect(zLevels.length).toBeGreaterThanOrEqual(2);
  });

  it('skips degenerate strips instead of emitting zero-area triangles', () => {
    const lattice = buildFingertipLattice(extractHandTopologyFrame([
      degenerateHand('left', 'left', 0.2),
      degenerateHand('right', 'right', 0.8),
    ]));

    expect(lattice.strips.map((strip) => strip.id)).toEqual(['BC', 'CD', 'DE', 'EA']);
    for (const face of lattice.faces) {
      expect(faceArea(lattice, face.indices)).toBeGreaterThan(0.00001);
    }
  });

  it('builds one-hand mode as a closed A-B-C-D-E-A face without virtual rails', () => {
    const lattice = buildFingertipLattice(extractHandTopologyFrame([hand('single', 'left', 0.45)]));

    expect(lattice.mode).toBe('one-hand-lattice');
    expect(lattice.crossRails).toHaveLength(0);
    expect(lattice.strips).toHaveLength(0);
    expect(lattice.boundaryEdges.map((edge) => edge.id)).toEqual(['AB', 'BC', 'CD', 'DE', 'EA']);
    expect(lattice.caps.map((cap) => cap.id)).toEqual(['single-hand']);
    expect(lattice.caps[0]?.materialId).toBe('scene');
    expect(Array.from(new Set(lattice.faces.map((face) => face.materialId)))).toEqual(
      expect.arrayContaining(['scene', 'back', 'edge']),
    );
  });
});

function hand(id: string, handedness: TrackedHand['handedness'], centerX: number): TrackedHand {
  return handFromTips(id, handedness, {
    A: { x: centerX - 0.12, y: 0.52, z: -0.04 },
    B: { x: centerX - 0.06, y: 0.36, z: -0.08 },
    C: { x: centerX, y: 0.3, z: -0.1 },
    D: { x: centerX + 0.06, y: 0.36, z: -0.07 },
    E: { x: centerX + 0.12, y: 0.46, z: -0.05 },
  });
}

function degenerateHand(
  id: string,
  handedness: TrackedHand['handedness'],
  centerX: number,
): TrackedHand {
  return handFromTips(id, handedness, {
    A: { x: centerX - 0.08, y: 0.42, z: -0.04 },
    B: { x: centerX - 0.08, y: 0.42, z: -0.04 },
    C: { x: centerX, y: 0.3, z: -0.1 },
    D: { x: centerX + 0.06, y: 0.36, z: -0.07 },
    E: { x: centerX + 0.12, y: 0.46, z: -0.05 },
  });
}

function handFromTips(
  id: string,
  handedness: TrackedHand['handedness'],
  tips: Record<'A' | 'B' | 'C' | 'D' | 'E', NormalizedPoint>,
): TrackedHand {
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

function faceArea(
  lattice: ReturnType<typeof buildFingertipLattice>,
  indices: [number, number, number],
): number {
  const [a, b, c] = indices.map((index) => lattice.vertices[index].position);
  const ab = {
    x: b.x - a.x,
    y: b.y - a.y,
    z: (b.z ?? 0) - (a.z ?? 0),
  };
  const ac = {
    x: c.x - a.x,
    y: c.y - a.y,
    z: (c.z ?? 0) - (a.z ?? 0),
  };
  const cross = {
    x: ab.y * ac.z - ab.z * ac.y,
    y: ab.z * ac.x - ab.x * ac.z,
    z: ab.x * ac.y - ab.y * ac.x,
  };

  return Math.hypot(cross.x, cross.y, cross.z) / 2;
}
