import type { NormalizedPoint, TrackedHand } from '../../shared/runtime/types';

export type DisplaySpaceSize = {
  width: number;
  height: number;
};

export type DisplaySpaceMapping = {
  viewport?: DisplaySpaceSize;
  video?: DisplaySpaceSize;
};

export function toDisplayHands(
  hands: TrackedHand[],
  mirrored: boolean,
  mapping: DisplaySpaceMapping = {},
): TrackedHand[] {
  return hands.map((hand) => ({
    ...hand,
    landmarks: hand.landmarks.map((point) => toDisplayPoint(point, mirrored, mapping)),
  }));
}

function toDisplayPoint(
  point: NormalizedPoint,
  mirrored: boolean,
  mapping: DisplaySpaceMapping,
): NormalizedPoint {
  const visiblePoint = toObjectFitCoverDisplayPoint(point, mapping);

  return {
    ...visiblePoint,
    x: mirrored ? 1 - visiblePoint.x : visiblePoint.x,
  };
}

function toObjectFitCoverDisplayPoint(
  point: NormalizedPoint,
  mapping: DisplaySpaceMapping,
): NormalizedPoint {
  const viewport = mapping.viewport;
  const video = mapping.video;

  if (!viewport || !video || !isPositiveSize(viewport) || !isPositiveSize(video)) {
    return point;
  }

  const scale = Math.max(viewport.width / video.width, viewport.height / video.height);
  const renderedWidth = video.width * scale;
  const renderedHeight = video.height * scale;
  const offsetX = (viewport.width - renderedWidth) / 2;
  const offsetY = (viewport.height - renderedHeight) / 2;

  return {
    ...point,
    x: clamp01((point.x * renderedWidth + offsetX) / viewport.width),
    y: clamp01((point.y * renderedHeight + offsetY) / viewport.height),
  };
}

function isPositiveSize(size: DisplaySpaceSize): boolean {
  return size.width > 0 && size.height > 0;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
