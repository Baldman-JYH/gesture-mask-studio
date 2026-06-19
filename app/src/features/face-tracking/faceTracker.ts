import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import type { FaceRoi } from '../face-texture/faceTextureSource';
import { selectTrackedFaceRoi } from '../face-texture/faceTextureSource';

export type FaceTracker = {
  detect(video: HTMLVideoElement, timestampMs: number): FaceRoi | null;
  close(): void;
};

export type FaceTrackerOptions = {
  wasmBaseUrl?: string;
  modelAssetPath?: string;
  numFaces?: number;
  minConfidence?: number;
};

const DEFAULT_WASM_BASE_URL = `${import.meta.env.BASE_URL}mediapipe/wasm`;
const DEFAULT_MODEL_ASSET_PATH =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

export async function createMediaPipeFaceTracker(
  options: FaceTrackerOptions = {},
): Promise<FaceTracker> {
  const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision');
  const vision = await FilesetResolver.forVisionTasks(options.wasmBaseUrl ?? DEFAULT_WASM_BASE_URL);
  const landmarker = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: options.modelAssetPath ?? DEFAULT_MODEL_ASSET_PATH,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numFaces: options.numFaces ?? 1,
    minFaceDetectionConfidence: options.minConfidence ?? 0.45,
    minFacePresenceConfidence: options.minConfidence ?? 0.45,
    minTrackingConfidence: options.minConfidence ?? 0.45,
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
  });

  return {
    detect(video: HTMLVideoElement, timestampMs: number): FaceRoi | null {
      return faceRoiFromFaceLandmarkerResult(landmarker.detectForVideo(video, timestampMs));
    },

    close(): void {
      landmarker.close();
    },
  };
}

export function faceRoiFromFaceLandmarkerResult(
  result: Pick<FaceLandmarkerResult, 'faceLandmarks'>,
): FaceRoi | null {
  return selectTrackedFaceRoi(result.faceLandmarks);
}
