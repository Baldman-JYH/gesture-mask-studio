import type {
  LightSheetStylePreset,
  SceneSamplingInput,
  TrackedHand,
} from '../../shared/runtime/types';
import {
  clampFaceRoi,
  deriveGestureFaceRoi,
  fallbackFaceRoi,
  type FaceRoi,
} from '../face-texture/faceTextureSource';
import { buildSpatialTemplateFromHands } from '../spatial-template-model/templateMesh';
import type { SpatialTemplateMesh } from '../spatial-template-model/types';
import type { TemplateState } from '../template-state/types';

export type SpatialTemplateRenderInput = {
  mesh: SpatialTemplateMesh;
  templateState: TemplateState;
  faceRoi: FaceRoi;
  style: LightSheetStylePreset;
  scene: SceneSamplingInput;
  timestampMs: number;
  activeHandCount: number;
};

export type CreateSpatialTemplateRenderInputOptions = {
  displayHands: TrackedHand[];
  video: HTMLVideoElement;
  mirrored: boolean;
  style: LightSheetStylePreset;
  timestampMs: number;
  activeHandCount?: number;
  previousTemplateState?: TemplateState | null;
  faceRoi?: FaceRoi;
};

export function createSpatialTemplateRenderInput(
  options: CreateSpatialTemplateRenderInputOptions,
): SpatialTemplateRenderInput {
  const template = buildSpatialTemplateFromHands(options.displayHands, {
    activeHandCount: options.activeHandCount,
    previousTemplateState: options.previousTemplateState,
    timestampMs: options.timestampMs,
  });

  return {
    mesh: template.mesh,
    templateState: template.templateState,
    faceRoi: clampFaceRoi(options.faceRoi ?? deriveFaceRoi(template.templateState)),
    style: options.style,
    scene: {
      video: options.video,
      mirrored: options.mirrored,
      viewport: {
        width: options.video.clientWidth || options.video.videoWidth,
        height: options.video.clientHeight || options.video.videoHeight,
      },
    },
    timestampMs: options.timestampMs,
    activeHandCount: template.templateState.activeHandCount,
  };
}

function deriveFaceRoi(templateState: TemplateState): FaceRoi {
  if (!templateState.visible || templateState.activeHandCount === 0) {
    return fallbackFaceRoi();
  }

  return deriveGestureFaceRoi(templateState.center, templateState.span);
}
