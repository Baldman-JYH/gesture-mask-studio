import type { LightSheetGeometry, NormalizedPoint } from '../../shared/runtime/types';

const HAVE_CURRENT_DATA = 2;

export type VideoUv = {
  u: number;
  v: number;
};

export type SamplingSize = {
  width: number;
  height: number;
};

export type VideoUvMapping = {
  mirrored: boolean;
  viewport?: SamplingSize;
  video?: SamplingSize;
};

export function toVideoUv(point: NormalizedPoint, mapping: VideoUvMapping): VideoUv {
  const sourcePoint = toObjectFitCoverSourcePoint(point, mapping);

  return {
    u: mapping.mirrored ? 1 - sourcePoint.x : sourcePoint.x,
    v: 1 - sourcePoint.y,
  };
}

export function geometryToSamplingPoints(
  geometry: LightSheetGeometry,
  mapping: VideoUvMapping,
): VideoUv[] {
  return geometry.vertices
    .filter((vertex): vertex is NormalizedPoint => Boolean(vertex))
    .map((vertex) => toVideoUv(vertex, mapping));
}

export function isRenderableVideo(video: HTMLVideoElement): boolean {
  return video.readyState >= HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function toObjectFitCoverSourcePoint(
  point: NormalizedPoint,
  mapping: VideoUvMapping,
): NormalizedPoint {
  const x = clamp01(point.x);
  const y = clamp01(point.y);
  const viewport = mapping.viewport;
  const video = mapping.video;

  if (!viewport || !video || !isPositiveSize(viewport) || !isPositiveSize(video)) {
    return { x, y };
  }

  const scale = Math.max(viewport.width / video.width, viewport.height / video.height);
  const renderedWidth = video.width * scale;
  const renderedHeight = video.height * scale;
  const offsetX = (viewport.width - renderedWidth) / 2;
  const offsetY = (viewport.height - renderedHeight) / 2;

  return {
    x: clamp01((x * viewport.width - offsetX) / renderedWidth),
    y: clamp01((y * viewport.height - offsetY) / renderedHeight),
  };
}

function isPositiveSize(size: SamplingSize): boolean {
  return size.width > 0 && size.height > 0;
}
