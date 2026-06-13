import type { SpatialTemplateMaterialId, SpatialTemplateMesh } from '../spatial-template-model/types';
import { toVideoUv, type VideoUvMapping } from '../scene-sampling/screenSpaceSampling';

export type SpatialTemplateBufferGroup = {
  start: number;
  count: number;
  materialIndex: number;
};

export type SpatialTemplateBufferData = {
  positions: number[];
  uvs: number[];
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
  const indices: number[] = [];
  const groups: SpatialTemplateBufferGroup[] = [];

  for (const vertex of mesh.vertices) {
    positions.push(
      (vertex.position.x - 0.5) * 2 * options.aspect,
      (0.5 - vertex.position.y) * 2,
      vertex.position.z ?? 0,
    );

    const uv = toVideoUv(vertex.samplePoint, options.videoMapping);
    uvs.push(uv.u, uv.v);
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
    indices,
    groups,
  };
}

export function materialIdToIndex(materialId: SpatialTemplateMaterialId): number {
  if (materialId === 'accent') {
    return 1;
  }

  if (materialId === 'edge') {
    return 2;
  }

  return 0;
}

function triangulateFace(
  indices: [number, number, number] | [number, number, number, number],
): number[] {
  if (indices.length === 3) {
    return [indices[0], indices[1], indices[2]];
  }

  return [indices[0], indices[1], indices[2], indices[0], indices[2], indices[3]];
}
