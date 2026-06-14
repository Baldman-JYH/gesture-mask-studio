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

export type FingertipStripId = 'AB' | 'BC' | 'CD' | 'DE';

export type FingertipStrip = {
  id: FingertipStripId;
  corners: [number, number, number, number];
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
  strips: FingertipStrip[];
  faces: FingertipLatticeFace[];
  confidence: number;
};

type LatticeHandPair = {
  left: HandTopology;
  right: HandTopology;
  virtualEnd: boolean;
};

const FINGER_ORDER: FingertipId[] = ['A', 'B', 'C', 'D', 'E'];
const STRIP_IDS: FingertipStripId[] = ['AB', 'BC', 'CD', 'DE'];
const FRONT_FACE_MATERIALS: SpatialTemplateMaterialId[] = ['scene', 'panel', 'accent', 'panel'];
const TEMPLATE_THICKNESS = 0.055;
const ONE_HAND_VIRTUAL_RAIL_SPAN = 0.28;
const MIN_TRIANGLE_AREA = 0.00001;

export function buildFingertipLattice(frame: HandTopologyFrame): FingertipLattice {
  const pair = toLatticeHandPair(frame);

  if (pair === null) {
    return {
      mode: 'hidden',
      vertices: [],
      crossRails: [],
      strips: [],
      faces: [],
      confidence: 0,
    };
  }

  const vertices = createVertices(pair);
  const crossRails = createCrossRails(pair);
  const strips: FingertipStrip[] = [];
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

  return {
    mode: frame.mode === 'two-hand' ? 'two-hand-lattice' : 'one-hand-lattice',
    vertices,
    crossRails,
    strips,
    faces,
    confidence: frame.confidence,
  };
}

function toLatticeHandPair(frame: HandTopologyFrame): LatticeHandPair | null {
  if (frame.mode === 'two-hand' && frame.left && frame.right) {
    return {
      left: frame.left,
      right: frame.right,
      virtualEnd: false,
    };
  }

  if (frame.mode === 'one-hand' && frame.primary) {
    const virtualHand = createVirtualHand(frame.primary);
    const [left, right] = [frame.primary, virtualHand].sort(
      (a, b) => a.palmCenter.x - b.palmCenter.x,
    );

    return {
      left,
      right,
      virtualEnd: true,
    };
  }

  return null;
}

function createVirtualHand(hand: HandTopology): HandTopology {
  const direction = hand.palmCenter.x < 0.5 ? 1 : -1;
  const fingertips = Object.fromEntries(
    FINGER_ORDER.map((finger) => [
      finger,
      offsetPoint(hand.fingertips[finger], {
        x: direction * ONE_HAND_VIRTUAL_RAIL_SPAN,
        y: 0.025,
        z: -TEMPLATE_THICKNESS,
      }),
    ]),
  ) as HandTopology['fingertips'];

  return {
    ...hand,
    id: `${hand.id}:virtual`,
    confidence: hand.confidence * 0.72,
    fingertips,
    palmCenter: offsetPoint(hand.palmCenter, {
      x: direction * ONE_HAND_VIRTUAL_RAIL_SPAN,
      y: 0.025,
      z: -TEMPLATE_THICKNESS,
    }),
  };
}

function createVertices(pair: LatticeHandPair): SpatialTemplateVertex[] {
  const front = [
    ...FINGER_ORDER.map((finger) => vertex(pair.left.fingertips[finger])),
    ...FINGER_ORDER.map((finger) => vertex(pair.right.fingertips[finger])),
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

function createCrossRails(pair: LatticeHandPair): FingertipCrossRail[] {
  return FINGER_ORDER.map((finger) => ({
    finger,
    start: pair.left.fingertips[finger],
    end: pair.right.fingertips[finger],
    virtualEnd: pair.virtualEnd,
  }));
}

function createStrip(index: number, materialId: SpatialTemplateMaterialId): FingertipStrip {
  const leftCurrent = index;
  const leftNext = index + 1;
  const rightCurrent = FINGER_ORDER.length + index;
  const rightNext = FINGER_ORDER.length + index + 1;

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
    triangleArea(vertices, [corners[0], corners[1], corners[2]]) > MIN_TRIANGLE_AREA &&
    triangleArea(vertices, [corners[0], corners[2], corners[3]]) > MIN_TRIANGLE_AREA
  );
}

function toBackCorners(corners: [number, number, number, number]): [number, number, number, number] {
  return corners.map((index) => index + FINGER_ORDER.length * 2) as [number, number, number, number];
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

function vertex(point: NormalizedPoint): SpatialTemplateVertex {
  const samplePoint = clampNormalizedPoint(point);

  return {
    position: samplePoint,
    samplePoint,
  };
}

function offsetPoint(
  point: NormalizedPoint,
  offset: { x: number; y: number; z: number },
): NormalizedPoint {
  return clampNormalizedPoint({
    x: point.x + offset.x,
    y: point.y + offset.y,
    z: (point.z ?? 0) + offset.z,
  });
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
