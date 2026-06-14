import type { TrackedHand } from '../../shared/runtime/types';
import { buildFingertipLattice } from '../fingertip-lattice/fingertipLattice';
import { extractHandTopologyFrame } from '../hand-topology/handTopology';
import type { SpatialTemplateMesh } from './types';

export function buildSpatialTemplateMeshFromHands(hands: TrackedHand[]): SpatialTemplateMesh {
  const lattice = buildFingertipLattice(extractHandTopologyFrame(hands));

  if (lattice.mode === 'hidden') {
    return {
      mode: 'hidden',
      vertices: [],
      faces: [],
      opacity: 0,
      confidence: 0,
    };
  }

  return {
    mode: lattice.mode,
    vertices: lattice.vertices,
    faces: lattice.faces,
    opacity: lerp(0.62, 0.9, clamp01(lattice.confidence)),
    confidence: clamp01(lattice.confidence),
  };
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
