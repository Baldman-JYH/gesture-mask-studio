import type {
  LightSheetStylePreset,
  SceneSamplingInput,
  TrackedHand,
} from '../../shared/runtime/types';
import { deriveGestureAnchorFrame, type GestureAnchorFrame } from '../gesture-anchor-frame/anchorFrame';
import {
  buildSpatialTemplateMesh,
  buildSpatialTemplateMeshFromHands,
} from '../spatial-template-model/templateMesh';
import type { SpatialTemplateMesh } from '../spatial-template-model/types';

export type SpatialTemplateRenderInput = {
  mesh: SpatialTemplateMesh;
  style: LightSheetStylePreset;
  scene: SceneSamplingInput;
  timestampMs: number;
};

export type CreateSpatialTemplateRenderInputOptions = {
  displayHands: TrackedHand[];
  anchorFrame?: GestureAnchorFrame;
  video: HTMLVideoElement;
  mirrored: boolean;
  style: LightSheetStylePreset;
  timestampMs: number;
};

export function createSpatialTemplateRenderInput(
  options: CreateSpatialTemplateRenderInputOptions,
): SpatialTemplateRenderInput {
  const anchorFrame = options.anchorFrame ?? deriveGestureAnchorFrame(options.displayHands);
  const latticeMesh = buildSpatialTemplateMeshFromHands(options.displayHands);
  const mesh = latticeMesh.mode === 'hidden' ? buildSpatialTemplateMesh(anchorFrame) : latticeMesh;

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
  };
}
