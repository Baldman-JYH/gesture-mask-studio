import type { NormalizedPoint } from '../../shared/runtime/types';

export type FaceRoi = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

export const fallbackFaceRoi = (): FaceRoi => ({
  x: 0.3,
  y: 0.24,
  width: 0.4,
  height: 0.56,
});

export const deriveGestureFaceRoi = (
  center: { x: number; y: number },
  span: number,
): FaceRoi => {
  const width = clamp(round(Math.max(0.4, Math.min(0.56, span * 0.7931034483))), 0.4, 0.56);
  const height = clamp(round(Math.max(0.5, Math.min(0.64, width * 1.2130434783))), 0.5, 0.64);

  return clampFaceRoi({
    x: round(center.x - width / 2),
    y: round(center.y - height * 0.5211469534),
    width,
    height,
  });
};

export const deriveTrackedFaceRoi = (landmarks: NormalizedPoint[]): FaceRoi | null => {
  const finiteLandmarks = landmarks.filter(isFinitePoint);
  if (finiteLandmarks.length === 0) {
    return null;
  }

  const xs = finiteLandmarks.map((point) => point.x);
  const ys = finiteLandmarks.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const boundsWidth = Math.max(maxX - minX, 0.0001);
  const boundsHeight = Math.max(maxY - minY, 0.0001);
  const width = clamp(round(Math.max(0.22, boundsWidth * 1.55)), 0.18, 0.58);
  const height = clamp(round(Math.max(0.3, boundsHeight * 1.65, width * 1.25)), 0.26, 0.68);
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return roundFaceRoi(clampFaceRoi({
    x: round(centerX - width / 2),
    y: round(centerY - height * 0.48),
    width,
    height,
  }));
};

export const selectTrackedFaceRoi = (faces: NormalizedPoint[][]): FaceRoi | null => {
  let selected: FaceRoi | null = null;
  let selectedArea = 0;

  for (const landmarks of faces) {
    const roi = deriveTrackedFaceRoi(landmarks);
    if (!roi) {
      continue;
    }

    const area = roi.width * roi.height;
    if (!selected || area > selectedArea) {
      selected = roi;
      selectedArea = area;
    }
  }

  return selected;
};

export const clampFaceRoi = (roi: FaceRoi): FaceRoi => {
  const x = clamp(roi.x, 0, 1);
  const y = clamp(roi.y, 0, 1);

  return {
    x,
    y,
    width: clamp(roi.width, 0, 1 - x),
    height: clamp(roi.height, 0, 1 - y),
  };
};

export const smoothFaceRoi = (previous: FaceRoi, next: FaceRoi, amount: number): FaceRoi => {
  const clampedAmount = clamp(amount, 0, 1);

  return {
    x: lerp(previous.x, next.x, clampedAmount),
    y: lerp(previous.y, next.y, clampedAmount),
    width: lerp(previous.width, next.width, clampedAmount),
    height: lerp(previous.height, next.height, clampedAmount),
  };
};

export const stabilizeTrackedFaceRoi = (
  previous: FaceRoi | null,
  next: FaceRoi | null,
  amount: number,
): FaceRoi | null => {
  if (!next) {
    return previous;
  }

  if (!previous) {
    return next;
  }

  return roundFaceRoi(smoothFaceRoi(previous, next, amount));
};

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}

function roundFaceRoi(roi: FaceRoi): FaceRoi {
  return {
    x: round(roi.x),
    y: round(roi.y),
    width: round(roi.width),
    height: round(roi.height),
  };
}

function isFinitePoint(point: NormalizedPoint): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}
