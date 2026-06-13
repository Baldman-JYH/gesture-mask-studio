import type { LightSheetGeometry, NormalizedPoint } from '../../shared/runtime/types';

const HAVE_CURRENT_DATA = 2;

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

export function isRenderableVideo(video: HTMLVideoElement): boolean {
  return video.readyState >= HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
