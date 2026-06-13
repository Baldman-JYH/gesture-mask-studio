import type { LightSheetGeometry, NormalizedPoint } from '../../shared/runtime/types';
import { toVideoUv } from '../scene-sampling/screenSpaceSampling';

export function geometryToPositions(geometry: LightSheetGeometry): Float32Array {
  const vertices = getRenderableVertices(geometry);
  const positions = new Float32Array(vertices.length * 3);

  vertices.forEach((vertex, index) => {
    positions[index * 3] = vertex.x * 2 - 1;
    positions[index * 3 + 1] = 1 - vertex.y * 2;
    positions[index * 3 + 2] = 0;
  });

  return positions;
}

export function geometryToVideoUvs(
  geometry: LightSheetGeometry,
  mirrored: boolean,
): Float32Array {
  const vertices = getRenderableVertices(geometry);
  const uvs = new Float32Array(vertices.length * 2);

  vertices.forEach((vertex, index) => {
    const uv = toVideoUv(vertex, mirrored);
    uvs[index * 2] = uv.u;
    uvs[index * 2 + 1] = uv.v;
  });

  return uvs;
}

export function geometryToTriangleIndices(geometry: LightSheetGeometry): Uint16Array {
  const vertexCount = getRenderableVertices(geometry).length;

  if (vertexCount === 3) {
    return new Uint16Array([0, 1, 2]);
  }

  if (vertexCount === 4) {
    return new Uint16Array([0, 1, 2, 0, 2, 3]);
  }

  return new Uint16Array();
}

export function getRenderableVertices(geometry: LightSheetGeometry): NormalizedPoint[] {
  return geometry.vertices.filter((vertex): vertex is NormalizedPoint => Boolean(vertex));
}

export function hexToRgbUnit(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '').trim();
  const value = normalized.length === 3
    ? normalized
      .split('')
      .map((character) => `${character}${character}`)
      .join('')
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return [1, 1, 1];
  }

  return [
    Number.parseInt(value.slice(0, 2), 16) / 255,
    Number.parseInt(value.slice(2, 4), 16) / 255,
    Number.parseInt(value.slice(4, 6), 16) / 255,
  ];
}
