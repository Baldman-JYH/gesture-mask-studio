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

function round(value: number): number {
  return Math.round(value * 10000) / 10000;
}
