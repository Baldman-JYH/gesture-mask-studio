import type { NormalizedPoint } from '../../shared/runtime/types';
import type { TemplateState } from '../template-state/types';
import type {
  SpatialTemplateFace,
  SpatialTemplateMaterialId,
  SpatialTemplateMesh,
  SpatialTemplateMode,
  SpatialTemplateVertex,
} from './types';

type LocalPoint = Required<NormalizedPoint>;

export function buildReferenceTemplateMesh(state: TemplateState): SpatialTemplateMesh {
  if (state.mode === 'hidden' || !state.visible || state.opacity <= 0) {
    return hiddenMesh();
  }

  switch (state.mode) {
    case 'wide-blue-face':
      return meshFromLocalState(state, wideBlueFace(state));
    case 'triangle-fold':
      return meshFromLocalState(state, triangleFold(state));
    case 'thin-edge':
      return meshFromLocalState(state, thinEdge(state));
    case 'white-card-face':
      return meshFromLocalState(state, whiteCardFace(state));
    case 'green-cyan-face':
      return meshFromLocalState(state, greenCyanFace(state));
    case 'one-hand-wedge':
      return meshFromLocalState(state, oneHandWedge(state));
  }
}

function wideBlueFace(state: TemplateState): MeshParts {
  const width = span(state);
  const halfWidth = width / 2;
  const halfHeight = width * 0.08;
  const edgeHeight = Math.max(width * 0.018, 0.008);
  const foldZ = foldDepth(state, 0.08);

  return {
    points: [
      point(-halfWidth, -halfHeight, 0),
      point(0, -halfHeight, foldZ),
      point(halfWidth, -halfHeight, 0),
      point(-halfWidth, halfHeight, 0),
      point(0, halfHeight, foldZ),
      point(halfWidth, halfHeight, 0),
      point(-halfWidth, -halfHeight - edgeHeight, 0),
      point(0, -halfHeight - edgeHeight, foldZ),
      point(halfWidth, -halfHeight - edgeHeight, 0),
      point(-halfWidth, halfHeight + edgeHeight, 0),
      point(0, halfHeight + edgeHeight, foldZ),
      point(halfWidth, halfHeight + edgeHeight, 0),
    ],
    faces: [
      face([0, 3, 4, 1], 'face-blue'),
      face([1, 4, 5, 2], 'face-blue'),
      face([6, 0, 1, 7], 'edge-white'),
      face([7, 1, 2, 8], 'edge-white'),
      face([3, 9, 10, 4], 'edge-white'),
      face([4, 10, 11, 5], 'edge-white'),
    ],
  };
}

function triangleFold(state: TemplateState): MeshParts {
  const width = span(state) * 0.82;
  const halfWidth = width / 2;
  const height = span(state) * 0.48;
  const foldZ = foldDepth(state, 0.18);
  const backFoldZ = -foldZ * 0.35;
  const edgeHeight = Math.max(span(state) * 0.035, 0.012);

  return {
    points: [
      point(-halfWidth, height * 0.38, 0),
      point(halfWidth, height * 0.38, 0),
      point(0, -height * 0.62, foldZ),
      point(0, height * 0.12, backFoldZ),
      point(-halfWidth, height * 0.38 + edgeHeight, 0),
      point(halfWidth, height * 0.38 + edgeHeight, 0),
      point(0, -height * 0.62 - edgeHeight, foldZ),
    ],
    faces: [
      face([0, 3, 2], 'face-card'),
      face([3, 1, 2], 'face-blue'),
      face([4, 5, 1, 0], 'edge-white'),
      face([0, 2, 6], 'edge-white'),
      face([2, 1, 5, 6], 'edge-white'),
    ],
  };
}

function thinEdge(state: TemplateState): MeshParts {
  const width = span(state);
  const halfWidth = width / 2;
  const halfHeight = Math.max(width * 0.018, 0.008);
  const zOffset = depthSign(state) * Math.min(0.03, width * 0.025);

  return {
    points: [
      point(-halfWidth, -halfHeight, -zOffset),
      point(halfWidth, -halfHeight, zOffset),
      point(halfWidth, halfHeight, zOffset),
      point(-halfWidth, halfHeight, -zOffset),
      point(-halfWidth * 0.98, 0, -zOffset * 0.4),
      point(halfWidth * 0.98, 0, zOffset * 0.4),
    ],
    faces: [
      face([0, 1, 5, 4], 'edge-white'),
      face([4, 5, 2, 3], 'edge-white'),
      face([0, 3, 2, 1], 'glass-clear'),
    ],
  };
}

function whiteCardFace(state: TemplateState): MeshParts {
  const width = span(state) * 0.76;
  const height = span(state) * 0.42;
  const foldZ = foldDepth(state, 0.05);
  const edgeHeight = Math.max(span(state) * 0.02, 0.008);

  return {
    points: [
      point(-width / 2, -height / 2, 0),
      point(0, -height / 2, foldZ),
      point(width / 2, -height / 2, 0),
      point(-width / 2, height / 2, 0),
      point(0, height / 2, foldZ),
      point(width / 2, height / 2, 0),
      point(-width / 2, height / 2 + edgeHeight, 0),
      point(width / 2, height / 2 + edgeHeight, 0),
    ],
    faces: [
      face([0, 3, 4, 1], 'face-card'),
      face([1, 4, 5, 2], 'face-card'),
      face([3, 6, 7, 5], 'edge-white'),
    ],
  };
}

function greenCyanFace(state: TemplateState): MeshParts {
  const width = span(state) * 0.86;
  const height = span(state) * 0.34;
  const foldZ = foldDepth(state, 0.06);
  const edgeHeight = Math.max(span(state) * 0.018, 0.008);

  return {
    points: [
      point(-width / 2, -height / 2, 0),
      point(0, -height / 2, foldZ),
      point(width / 2, -height / 2, 0),
      point(-width / 2, height / 2, 0),
      point(0, height / 2, foldZ),
      point(width / 2, height / 2, 0),
      point(-width / 2, -height / 2 - edgeHeight, 0),
      point(width / 2, -height / 2 - edgeHeight, 0),
    ],
    faces: [
      face([0, 3, 4, 1], 'face-green'),
      face([1, 4, 5, 2], 'glass-clear'),
      face([6, 0, 2, 7], 'edge-white'),
    ],
  };
}

function oneHandWedge(state: TemplateState): MeshParts {
  const width = span(state) * 0.48;
  const height = span(state) * 0.42;
  const foldZ = foldDepth(state, 0.14);

  return {
    points: [
      point(-width * 0.35, height * 0.45, 0),
      point(width * 0.5, height * 0.2, 0),
      point(-width * 0.1, -height * 0.55, foldZ),
      point(-width * 0.48, -height * 0.08, foldZ * 0.35),
      point(width * 0.56, height * 0.28, foldZ * 0.15),
    ],
    faces: [
      face([0, 1, 2], 'face-card'),
      face([0, 2, 3], 'face-blue'),
      face([0, 4, 1], 'edge-white'),
      face([1, 4, 2], 'edge-white'),
    ],
  };
}

type MeshParts = {
  points: LocalPoint[];
  faces: SpatialTemplateFace[];
};

function meshFromLocalState(state: TemplateState, parts: MeshParts): SpatialTemplateMesh {
  return {
    mode: spatialMode(state),
    vertices: parts.points.map((localPoint) => vertex(state, localPoint)),
    faces: parts.faces,
    opacity: clamp01(state.opacity),
    confidence: clamp01(state.opacity),
  };
}

function vertex(state: TemplateState, localPoint: LocalPoint): SpatialTemplateVertex {
  const position = rotateIntoDisplaySpace(state, localPoint);

  return {
    position,
    samplePoint: position,
  };
}

function rotateIntoDisplaySpace(state: TemplateState, localPoint: LocalPoint): LocalPoint {
  const cos = Math.cos(state.rotation);
  const sin = Math.sin(state.rotation);
  const centerZ = state.center.z ?? 0;

  return {
    x: state.center.x + localPoint.x * cos - localPoint.y * sin,
    y: state.center.y + localPoint.x * sin + localPoint.y * cos,
    z: centerZ + localPoint.z,
  };
}

function spatialMode(state: TemplateState): SpatialTemplateMode {
  return state.mode === 'one-hand-wedge' || state.activeHandCount <= 1
    ? 'one-hand-template'
    : 'two-hand-template';
}

function hiddenMesh(): SpatialTemplateMesh {
  return {
    mode: 'hidden',
    vertices: [],
    faces: [],
    opacity: 0,
    confidence: 0,
  };
}

function face(
  indices: SpatialTemplateFace['indices'],
  materialId: SpatialTemplateMaterialId,
): SpatialTemplateFace {
  return { indices, materialId };
}

function point(x: number, y: number, z: number): LocalPoint {
  return { x, y, z };
}

function span(state: TemplateState): number {
  return Math.max(0.08, state.span);
}

function foldDepth(state: TemplateState, scale: number): number {
  const foldAmount = clamp01(state.foldAmount);
  const tilt = Math.max(Math.abs(state.depthTilt), 0.2);

  return depthSign(state) * span(state) * scale * foldAmount * tilt;
}

function depthSign(state: TemplateState): 1 | -1 {
  if (state.depthDelta < 0) {
    return -1;
  }

  return 1;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
