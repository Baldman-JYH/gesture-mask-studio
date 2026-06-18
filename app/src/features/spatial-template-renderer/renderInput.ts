import type {
  LightSheetStylePreset,
  SceneSamplingInput,
  TrackedHand,
} from '../../shared/runtime/types';
import { buildSpatialTemplateMeshFromHands } from '../spatial-template-model/templateMesh';
import type { SpatialTemplateMesh } from '../spatial-template-model/types';

export type SpatialTemplateRenderInput = {
  mesh: SpatialTemplateMesh;
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
};

export function createSpatialTemplateRenderInput(
  options: CreateSpatialTemplateRenderInputOptions,
): SpatialTemplateRenderInput {
  const mesh = buildSpatialTemplateMeshFromHands(options.displayHands);

  return {
    mesh,
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
    activeHandCount: options.activeHandCount ?? options.displayHands.length,
  };
}
