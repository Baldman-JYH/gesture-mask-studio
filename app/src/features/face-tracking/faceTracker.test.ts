import { describe, expect, it } from 'vitest';
import { faceRoiFromFaceLandmarkerResult } from './faceTracker';

describe('faceTracker', () => {
  it('maps MediaPipe face landmarks into a face texture ROI', () => {
    expect(
      faceRoiFromFaceLandmarkerResult({
        faceLandmarks: [
          [
            { x: 0.42, y: 0.31 },
            { x: 0.58, y: 0.31 },
            { x: 0.5, y: 0.46 },
            { x: 0.44, y: 0.61 },
            { x: 0.56, y: 0.61 },
          ],
        ],
        faceBlendshapes: [],
        facialTransformationMatrixes: [],
      }),
    ).toEqual({
      x: 0.376,
      y: 0.2224,
      width: 0.248,
      height: 0.495,
    });
  });

  it('returns null when MediaPipe does not detect a face', () => {
    expect(
      faceRoiFromFaceLandmarkerResult({
        faceLandmarks: [],
        faceBlendshapes: [],
        facialTransformationMatrixes: [],
      }),
    ).toBeNull();
  });
});
