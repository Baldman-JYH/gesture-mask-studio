import type { LightSheetGeometry, NormalizedPoint } from '../../shared/runtime/types';

export type VideoUv = {
  u: number;
  v: number;
};

export function toVideoUv(point: NormalizedPoint, mirrored: boolean): VideoUv {
  const x = clamp01(point.x);
  const y = clamp01(point.y);

  return {
    u: mirrored ? 1 - x : x,
    v: y,
  };
}

export function geometryToSamplingPoints(
  geometry: LightSheetGeometry,
  mirrored: boolean,
): VideoUv[] {
  return geometry.vertices
    .filter((vertex): vertex is NormalizedPoint => Boolean(vertex))
    .map((vertex) => toVideoUv(vertex, mirrored));
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
