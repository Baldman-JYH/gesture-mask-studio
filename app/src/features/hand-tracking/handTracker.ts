import {
  FilesetResolver,
  HandLandmarker,
  type HandLandmarkerResult,
} from '@mediapipe/tasks-vision';
import type { NormalizedPoint, TrackedHand } from '../../shared/runtime/types';

export type HandTracker = {
  detect(video: HTMLVideoElement, timestampMs: number): TrackedHand[];
  close(): void;
};

export type HandTrackerOptions = {
  wasmBaseUrl?: string;
  modelAssetPath?: string;
  numHands?: number;
  minConfidence?: number;
};

const DEFAULT_WASM_BASE_URL =
  'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm';
const DEFAULT_MODEL_ASSET_PATH =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';

export async function createMediaPipeHandTracker(
  options: HandTrackerOptions = {},
): Promise<HandTracker> {
  const vision = await FilesetResolver.forVisionTasks(options.wasmBaseUrl ?? DEFAULT_WASM_BASE_URL);
  const landmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: options.modelAssetPath ?? DEFAULT_MODEL_ASSET_PATH,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numHands: options.numHands ?? 2,
    minHandDetectionConfidence: options.minConfidence ?? 0.45,
    minHandPresenceConfidence: options.minConfidence ?? 0.45,
    minTrackingConfidence: options.minConfidence ?? 0.45,
  });

  return {
    detect(video: HTMLVideoElement, timestampMs: number): TrackedHand[] {
      return toTrackedHands(landmarker.detectForVideo(video, timestampMs));
    },

    close(): void {
      landmarker.close();
    },
  };
}

function toTrackedHands(result: HandLandmarkerResult): TrackedHand[] {
  return result.landmarks.map((landmarks, index) => {
    const handedness = normalizeHandedness(result.handedness?.[index]?.[0]?.categoryName);
    const confidence = result.handedness?.[index]?.[0]?.score ?? 0.8;

    return {
      id: `hand-${index}-${handedness}`,
      handedness,
      confidence,
      landmarks: landmarks.map(toNormalizedPoint),
    };
  });
}

function toNormalizedPoint(landmark: NormalizedPoint): NormalizedPoint {
  return {
    x: landmark.x,
    y: landmark.y,
    ...(landmark.z === undefined ? {} : { z: landmark.z }),
  };
}

function normalizeHandedness(value: string | undefined): TrackedHand['handedness'] {
  if (value === 'Left') {
    return 'left';
  }

  if (value === 'Right') {
    return 'right';
  }

  return 'unknown';
}
