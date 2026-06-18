import type { SpatialTemplateMaterialId, SpatialTemplateMesh } from '../spatial-template-model/types';
import { toVideoUv, type VideoUvMapping } from '../scene-sampling/screenSpaceSampling';

export const SPATIAL_TEMPLATE_MATERIAL_SLOT_IDS: SpatialTemplateMaterialId[] = [
  'scene',
  'panel',
  'back',
  'accent',
  'cap',
  'edge',
  'strip-ab',
  'strip-bc',
  'strip-cd',
  'strip-de',
  'strip-ea',
  'face-blue',
  'face-card',
  'face-green',
  'edge-white',
  'glass-clear',
];

export type SpatialTemplateBufferGroup = {
  start: number;
  count: number;
  materialIndex: number;
};

export type SpatialTemplateBufferData = {
  positions: number[];
  uvs: number[];
  faceUvs: number[];
  indices: number[];
  groups: SpatialTemplateBufferGroup[];
};

export type SpatialTemplateBufferOptions = {
  aspect: number;
  videoMapping: VideoUvMapping;
};

export function spatialTemplateToBufferData(
  mesh: SpatialTemplateMesh,
  options: SpatialTemplateBufferOptions,
): SpatialTemplateBufferData {
  const positions: number[] = [];
  const uvs: number[] = [];
  const faceUvs: number[] = [];
  const indices: number[] = [];
  const groups: SpatialTemplateBufferGroup[] = [];
  const faceUvBounds = getFaceUvBounds(mesh);

  for (const vertex of mesh.vertices) {
    positions.push(
      (vertex.position.x - 0.5) * 2 * options.aspect,
      (0.5 - vertex.position.y) * 2,
      vertex.position.z ?? 0,
    );

    const uv = toVideoUv(vertex.samplePoint, options.videoMapping);
    uvs.push(uv.u, uv.v);

    const faceUv = vertex.faceUv ?? toFaceUv(vertex.position, faceUvBounds);
    faceUvs.push(faceUv.u, faceUv.v);
  }

  for (const face of mesh.faces) {
    const start = indices.length;
    const triangles = triangulateFace(face.indices);
    indices.push(...triangles);
    groups.push({
      start,
      count: triangles.length,
      materialIndex: materialIdToIndex(face.materialId),
    });
  }

  return {
    positions,
    uvs,
    faceUvs,
    indices,
    groups,
  };
}

export function materialIdToIndex(materialId: SpatialTemplateMaterialId): number {
  const index = SPATIAL_TEMPLATE_MATERIAL_SLOT_IDS.indexOf(materialId);
  return index === -1 ? 0 : index;
}

function triangulateFace(
  indices: [number, number, number] | [number, number, number, number],
): number[] {
  if (indices.length === 3) {
    return [indices[0], indices[1], indices[2]];
  }

  return [indices[0], indices[1], indices[2], indices[0], indices[2], indices[3]];
}

function getFaceUvBounds(mesh: SpatialTemplateMesh): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} {
  if (mesh.vertices.length === 0) {
    return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  }

  const xs = mesh.vertices.map((vertex) => vertex.position.x);
  const ys = mesh.vertices.map((vertex) => vertex.position.y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function toFaceUv(
  point: { x: number; y: number },
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
): { u: number; v: number } {
  const width = Math.max(bounds.maxX - bounds.minX, Number.EPSILON);
  const height = Math.max(bounds.maxY - bounds.minY, Number.EPSILON);

  return {
    u: clamp01((point.x - bounds.minX) / width),
    v: clamp01((bounds.maxY - point.y) / height),
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
