import {
  AdditiveBlending,
  DoubleSide,
  ShaderMaterial,
  Vector4,
  type Texture,
} from 'three';
import type { FaceRoi } from '../face-texture/faceTextureSource';
import { SPATIAL_TEMPLATE_MATERIAL_SLOT_IDS } from './rendererCore';
import { materialModeForTemplateMaterial } from './referenceMaterialModes';
import {
  REFERENCE_FRAGMENT_SHADER,
  REFERENCE_VERTEX_SHADER,
} from './referenceShaderSource';

export type ReferenceTemplateUniformInput = {
  sceneTexture: Texture | null;
  faceTexture: Texture | null;
  opacity: number;
  timestampMs: number;
  pixelSize: number;
  glitchAmount: number;
  faceRoi: FaceRoi;
};

export function createReferenceTemplateMaterials(): ShaderMaterial[] {
  return SPATIAL_TEMPLATE_MATERIAL_SLOT_IDS.map((materialId) => (
    new ShaderMaterial({
      vertexShader: REFERENCE_VERTEX_SHADER,
      fragmentShader: REFERENCE_FRAGMENT_SHADER,
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      blending: AdditiveBlending,
      uniforms: {
        uSceneTexture: { value: null },
        uFaceTexture: { value: null },
        uOpacity: { value: 0 },
        uTime: { value: 0 },
        uPixelSize: { value: 0.03125 },
        uGlitchAmount: { value: 0.012 },
        uMaterialMode: { value: materialModeForTemplateMaterial(materialId) },
        uFaceRoi: { value: new Vector4(0.34, 0.12, 0.32, 0.42) },
      },
    })
  ));
}

export function updateReferenceTemplateMaterials(
  materials: ShaderMaterial[],
  input: ReferenceTemplateUniformInput,
): void {
  for (const material of materials) {
    material.uniforms.uSceneTexture.value = input.sceneTexture;
    material.uniforms.uFaceTexture.value = input.faceTexture;
    material.uniforms.uOpacity.value = input.opacity;
    material.uniforms.uTime.value = input.timestampMs / 1000;
    material.uniforms.uPixelSize.value = input.pixelSize;
    material.uniforms.uGlitchAmount.value = input.glitchAmount;
    material.uniforms.uFaceRoi.value.set(
      input.faceRoi.x,
      input.faceRoi.y,
      input.faceRoi.width,
      input.faceRoi.height,
    );
  }
}
