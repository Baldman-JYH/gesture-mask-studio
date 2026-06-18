export type FaceRoi = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

export const fallbackFaceRoi = (): FaceRoi => ({
  x: 0.34,
  y: 0.12,
  width: 0.32,
  height: 0.42,
});

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

export const smoothFaceRoi = (previous: FaceRoi, next: FaceRoi, amount: number): FaceRoi => ({
  x: lerp(previous.x, next.x, amount),
  y: lerp(previous.y, next.y, amount),
  width: lerp(previous.width, next.width, amount),
  height: lerp(previous.height, next.height, amount),
});
