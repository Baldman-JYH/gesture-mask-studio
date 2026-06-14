import type { NormalizedPoint } from '../../shared/runtime/types';
import type { FingertipId, HandTopology, HandTopologyFrame } from '../hand-topology/handTopology';
import type { SpatialTemplateMaterialId, SpatialTemplateVertex } from '../spatial-template-model/types';

export type FingertipLatticeMode = 'hidden' | 'one-hand-lattice' | 'two-hand-lattice';

export type FingertipCrossRail = {
  finger: FingertipId;
  start: NormalizedPoint;
  end: NormalizedPoint;
  virtualEnd: boolean;
};

export type FingertipBoundaryEdgeId = 'AB' | 'BC' | 'CD' | 'DE' | 'EA';

export type FingertipBoundaryEdge = {
  id: FingertipBoundaryEdgeId;
  hand: 'single' | 'left' | 'right';
  start: NormalizedPoint;
  end: NormalizedPoint;
};

export type FingertipStripId = FingertipBoundaryEdgeId;

export type FingertipStrip = {
  id: FingertipStripId;
  corners: [number, number, number, number];
  materialId: SpatialTemplateMaterialId;
};

export type FingertipCap = {
  id: 'single-hand' | 'left-hand' | 'right-hand';
  corners: [number, number, number, number, number];
  materialId: SpatialTemplateMaterialId;
};

export type FingertipLatticeFace = {
  indices: [number, number, number];
  materialId: SpatialTemplateMaterialId;
};

export type FingertipLattice = {
  mode: FingertipLatticeMode;
  vertices: SpatialTemplateVertex[];
  crossRails: FingertipCrossRail[];
  boundaryEdges: FingertipBoundaryEdge[];
  strips: FingertipStrip[];
  caps: FingertipCap[];
  faces: FingertipLatticeFace[];
  confidence: number;
};

const FINGER_ORDER: FingertipId[] = ['A', 'B', 'C', 'D', 'E'];
const EDGE_IDS: FingertipBoundaryEdgeId[] = ['AB', 'BC', 'CD', 'DE', 'EA'];
const STRIP_IDS: FingertipStripId[] = EDGE_IDS;
const FRONT_FACE_MATERIALS: SpatialTemplateMaterialId[] = [
  'strip-ab',
  'strip-bc',
  'strip-cd',
  'strip-de',
  'strip-ea',
];
const FRONT_DEPTH_PROFILE = [-0.008, 0.012, 0.034, 0.012, -0.008] as const;
const TEMPLATE_THICKNESS = 0.032;
const MIN_TRIANGLE_AREA = 0.00001;
const MIN_HAND_LOOP_AREA = 0.0025;
const MIN_HAND_LOOP_SPREAD = 0.08;
const MAX_HAND_LOOP_ASPECT_RATIO = 10;

export function buildFingertipLattice(frame: HandTopologyFrame): FingertipLattice {
  if (frame.mode === 'hidden') {
    return {
      mode: 'hidden',
      vertices: [],
      crossRails: [],
      boundaryEdges: [],
      strips: [],
      caps: [],
      faces: [],
      confidence: 0,
    };
  }

  if (frame.mode === 'one-hand' && frame.primary) {
    return buildOneHandClosedFace(frame.primary, frame.confidence);
  }

  if (frame.mode === 'two-hand' && frame.left && frame.right) {
    return buildTwoHandClosedBody(frame.left, frame.right, frame.confidence);
  }

  return {
    mode: 'hidden',
    vertices: [],
    crossRails: [],
    boundaryEdges: [],
    strips: [],
    caps: [],
    faces: [],
    confidence: 0,
  };
}

function buildOneHandClosedFace(hand: HandTopology, confidence: number): FingertipLattice {
  if (!isRenderableHandLoop(hand)) {
    return hiddenLattice();
  }

  const vertices = createHandLoopVertices(hand);
  const boundaryEdges = createBoundaryEdges(hand, 'single');
  const caps: FingertipCap[] = [{
    id: 'single-hand',
    corners: [0, 1, 2, 3, 4],
    materialId: 'scene',
  }];
  const faces: FingertipLatticeFace[] = [];

  addLoopFaces(faces, vertices, caps[0].corners, caps[0].materialId);

  return {
    mode: 'one-hand-lattice',
    vertices,
    crossRails: [],
    boundaryEdges,
    strips: [],
    caps,
    faces,
    confidence,
  };
}

function buildTwoHandClosedBody(
  left: HandTopology,
  right: HandTopology,
  confidence: number,
): FingertipLattice {
  if (!isRenderableHandLoop(left) || !isRenderableHandLoop(right) || hasCrossingRails(left, right)) {
    return hiddenLattice();
  }

  const vertices = createTwoHandVertices(left, right);
  const crossRails = createCrossRails(left, right);
  const boundaryEdges = [
    ...createBoundaryEdges(left, 'left'),
    ...createBoundaryEdges(right, 'right'),
  ];
  const strips: FingertipStrip[] = [];
  const caps: FingertipCap[] = [
    { id: 'left-hand', corners: [0, 1, 2, 3, 4], materialId: 'cap' },
    { id: 'right-hand', corners: [5, 6, 7, 8, 9], materialId: 'cap' },
  ];
  const faces: FingertipLatticeFace[] = [];

  for (let index = 0; index < STRIP_IDS.length; index += 1) {
    const strip = createStrip(index, FRONT_FACE_MATERIALS[index]);

    if (!hasValidQuad(vertices, strip.corners)) {
      continue;
    }

    strips.push(strip);
    addSurfaceFaces(faces, vertices, strip.corners, strip.materialId);
    addSurfaceFaces(faces, vertices, toBackCorners(strip.corners), 'back');
    addEdgeFaces(faces, vertices, strip.corners);
  }

  for (const cap of caps) {
    addLoopFaces(faces, vertices, cap.corners, cap.materialId);
    addLoopFaces(faces, vertices, toBackLoopCorners(cap.corners, FINGER_ORDER.length * 2), 'back');
    addLoopEdgeFaces(faces, vertices, cap.corners, FINGER_ORDER.length * 2);
  }

  return {
    mode: 'two-hand-lattice',
    vertices,
    crossRails,
    boundaryEdges,
    strips,
    caps,
    faces,
    confidence,
  };
}

function createHandLoopVertices(hand: HandTopology): SpatialTemplateVertex[] {
  return FINGER_ORDER.map((finger) => (
    vertex(hand.fingertips[finger], 0)
  ));
}

function createTwoHandVertices(left: HandTopology, right: HandTopology): SpatialTemplateVertex[] {
  const front = [
    ...FINGER_ORDER.map((finger, index) => vertex(left.fingertips[finger], FRONT_DEPTH_PROFILE[index])),
    ...FINGER_ORDER.map((finger, index) => vertex(right.fingertips[finger], FRONT_DEPTH_PROFILE[index])),
  ];
  const back = front.map((frontVertex) => ({
    position: {
      ...frontVertex.position,
      z: (frontVertex.position.z ?? 0) - TEMPLATE_THICKNESS,
    },
    samplePoint: frontVertex.samplePoint,
  }));

  return [...front, ...back];
}

function createCrossRails(left: HandTopology, right: HandTopology): FingertipCrossRail[] {
  return FINGER_ORDER.map((finger) => ({
    finger,
    start: left.fingertips[finger],
    end: right.fingertips[finger],
    virtualEnd: false,
  }));
}

function createBoundaryEdges(
  hand: HandTopology,
  handId: FingertipBoundaryEdge['hand'],
): FingertipBoundaryEdge[] {
  return EDGE_IDS.map((id, index) => {
    const start = FINGER_ORDER[index];
    const end = FINGER_ORDER[(index + 1) % FINGER_ORDER.length];

    return {
      id,
      hand: handId,
      start: hand.fingertips[start],
      end: hand.fingertips[end],
    };
  });
}

function createStrip(index: number, materialId: SpatialTemplateMaterialId): FingertipStrip {
  const leftCurrent = index;
  const leftNext = (index + 1) % FINGER_ORDER.length;
  const rightCurrent = FINGER_ORDER.length + index;
  const rightNext = FINGER_ORDER.length + ((index + 1) % FINGER_ORDER.length);

  return {
    id: STRIP_IDS[index],
    corners: [leftCurrent, rightCurrent, rightNext, leftNext],
    materialId,
  };
}

function addSurfaceFaces(
  faces: FingertipLatticeFace[],
  vertices: SpatialTemplateVertex[],
  corners: [number, number, number, number],
  materialId: SpatialTemplateMaterialId,
): void {
  addFaceIfValid(faces, vertices, [corners[0], corners[1], corners[2]], materialId);
  addFaceIfValid(faces, vertices, [corners[0], corners[2], corners[3]], materialId);
}

function addLoopFaces(
  faces: FingertipLatticeFace[],
  vertices: SpatialTemplateVertex[],
  corners: [number, number, number, number, number],
  materialId: SpatialTemplateMaterialId,
): void {
  addFaceIfValid(faces, vertices, [corners[0], corners[1], corners[2]], materialId);
  addFaceIfValid(faces, vertices, [corners[0], corners[2], corners[3]], materialId);
  addFaceIfValid(faces, vertices, [corners[0], corners[3], corners[4]], materialId);
}

function addEdgeFaces(
  faces: FingertipLatticeFace[],
  vertices: SpatialTemplateVertex[],
  corners: [number, number, number, number],
): void {
  const backCorners = toBackCorners(corners);

  for (let index = 0; index < corners.length; index += 1) {
    const next = (index + 1) % corners.length;
    addFaceIfValid(faces, vertices, [corners[index], corners[next], backCorners[next]], 'edge');
    addFaceIfValid(faces, vertices, [corners[index], backCorners[next], backCorners[index]], 'edge');
  }
}

function addLoopEdgeFaces(
  faces: FingertipLatticeFace[],
  vertices: SpatialTemplateVertex[],
  corners: [number, number, number, number, number],
  backOffset: number,
): void {
  const backCorners = toBackLoopCorners(corners, backOffset);

  for (let index = 0; index < corners.length; index += 1) {
    const next = (index + 1) % corners.length;
    addFaceIfValid(faces, vertices, [corners[index], corners[next], backCorners[next]], 'edge');
    addFaceIfValid(faces, vertices, [corners[index], backCorners[next], backCorners[index]], 'edge');
  }
}

function addFaceIfValid(
  faces: FingertipLatticeFace[],
  vertices: SpatialTemplateVertex[],
  indices: [number, number, number],
  materialId: SpatialTemplateMaterialId,
): void {
  if (triangleArea(vertices, indices) <= MIN_TRIANGLE_AREA) {
    return;
  }

  faces.push({ indices, materialId });
}

function hasValidQuad(
  vertices: SpatialTemplateVertex[],
  corners: [number, number, number, number],
): boolean {
  return (
    screenTriangleArea(vertices, [corners[0], corners[1], corners[2]]) > MIN_TRIANGLE_AREA &&
    screenTriangleArea(vertices, [corners[0], corners[2], corners[3]]) > MIN_TRIANGLE_AREA
  );
}

function toBackCorners(corners: [number, number, number, number]): [number, number, number, number] {
  return corners.map((index) => index + FINGER_ORDER.length * 2) as [number, number, number, number];
}

function toBackLoopCorners(
  corners: [number, number, number, number, number],
  backOffset: number,
): [number, number, number, number, number] {
  return corners.map((index) => index + backOffset) as [
    number,
    number,
    number,
    number,
    number,
  ];
}

function triangleArea(
  vertices: SpatialTemplateVertex[],
  indices: [number, number, number],
): number {
  const [a, b, c] = indices.map((index) => vertices[index].position);
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

function screenTriangleArea(
  vertices: SpatialTemplateVertex[],
  indices: [number, number, number],
): number {
  const [a, b, c] = indices.map((index) => vertices[index].position);

  return Math.abs(
    (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y)) / 2,
  );
}

function vertex(point: NormalizedPoint, depth = 0): SpatialTemplateVertex {
  const samplePoint = clampNormalizedPoint(point);

  return {
    position: {
      x: samplePoint.x,
      y: samplePoint.y,
      z: depth,
    },
    samplePoint,
  };
}

function hiddenLattice(): FingertipLattice {
  return {
    mode: 'hidden',
    vertices: [],
    crossRails: [],
    boundaryEdges: [],
    strips: [],
    caps: [],
    faces: [],
    confidence: 0,
  };
}

function isRenderableHandLoop(hand: HandTopology): boolean {
  const points = FINGER_ORDER.map((finger) => hand.fingertips[finger]);
  const bounds = getPointBounds(points);
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const shortSide = Math.max(Math.min(width, height), Number.EPSILON);
  const longSide = Math.max(width, height);

  return (
    polygonArea(points) >= MIN_HAND_LOOP_AREA &&
    Math.hypot(width, height) >= MIN_HAND_LOOP_SPREAD &&
    longSide / shortSide <= MAX_HAND_LOOP_ASPECT_RATIO
  );
}

function hasCrossingRails(left: HandTopology, right: HandTopology): boolean {
  const rails = FINGER_ORDER.map((finger) => ({
    start: left.fingertips[finger],
    end: right.fingertips[finger],
  }));

  for (let firstIndex = 0; firstIndex < rails.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < rails.length; secondIndex += 1) {
      if (segmentsIntersect(rails[firstIndex].start, rails[firstIndex].end, rails[secondIndex].start, rails[secondIndex].end)) {
        return true;
      }
    }
  }

  return false;
}

function segmentsIntersect(
  a: NormalizedPoint,
  b: NormalizedPoint,
  c: NormalizedPoint,
  d: NormalizedPoint,
): boolean {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);

  return abC * abD < 0 && cdA * cdB < 0;
}

function orientation(a: NormalizedPoint, b: NormalizedPoint, c: NormalizedPoint): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function polygonArea(points: NormalizedPoint[]): number {
  let doubledArea = 0;

  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    doubledArea += current.x * next.y - next.x * current.y;
  }

  return Math.abs(doubledArea) / 2;
}

function getPointBounds(points: NormalizedPoint[]): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function clampNormalizedPoint(point: NormalizedPoint): NormalizedPoint {
  return {
    x: clamp01(point.x),
    y: clamp01(point.y),
    ...(point.z === undefined ? {} : { z: point.z }),
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
