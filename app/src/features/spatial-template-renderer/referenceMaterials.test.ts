import { Texture } from 'three';
import { describe, expect, it } from 'vitest';
import { SPATIAL_TEMPLATE_MATERIAL_SLOT_IDS, materialIdToIndex } from './rendererCore';
import {
  createReferenceTemplateMaterials,
  updateReferenceTemplateMaterials,
} from './referenceMaterials';
import { REFERENCE_MATERIAL_MODES } from './referenceMaterialModes';
import {
  REFERENCE_FRAGMENT_SHADER,
  REFERENCE_VERTEX_SHADER,
} from './referenceShaderSource';

describe('reference materials', () => {
  it('creates one shader material per spatial template material slot', () => {
    const materials = createReferenceTemplateMaterials();

    expect(materials).toHaveLength(SPATIAL_TEMPLATE_MATERIAL_SLOT_IDS.length);
    expect(materials[materialIdToIndex('face-blue')].vertexShader).toBe(REFERENCE_VERTEX_SHADER);
    expect(materials[materialIdToIndex('face-blue')].fragmentShader).toBe(REFERENCE_FRAGMENT_SHADER);
    expect(materials[materialIdToIndex('face-blue')].uniforms.uMaterialMode.value).toBe(
      REFERENCE_MATERIAL_MODES.blueFace,
    );
    expect(materials[materialIdToIndex('edge-white')].uniforms.uMaterialMode.value).toBe(
      REFERENCE_MATERIAL_MODES.whiteEdge,
    );

    materials.forEach((material) => material.dispose());
  });

  it('updates shared texture, timing, face ROI, and opacity uniforms', () => {
    const materials = createReferenceTemplateMaterials();
    const sceneTexture = new Texture();
    const faceTexture = new Texture();

    updateReferenceTemplateMaterials(materials, {
      sceneTexture,
      faceTexture,
      opacity: 0.72,
      timestampMs: 1250,
      pixelSize: 0.03125,
      glitchAmount: 0.012,
      faceRoi: { x: 0.34, y: 0.12, width: 0.32, height: 0.42 },
    });

    const material = materials[materialIdToIndex('face-card')];
    expect(material.uniforms.uSceneTexture.value).toBe(sceneTexture);
    expect(material.uniforms.uFaceTexture.value).toBe(faceTexture);
    expect(material.uniforms.uOpacity.value).toBeCloseTo(0.72);
    expect(material.uniforms.uTime.value).toBeCloseTo(1.25);
    expect(material.uniforms.uPixelSize.value).toBeCloseTo(0.03125);
    expect(material.uniforms.uGlitchAmount.value).toBeCloseTo(0.012);
    expect(material.uniforms.uFaceRoi.value.toArray()).toEqual([0.34, 0.12, 0.32, 0.42]);

    materials.forEach((entry) => entry.dispose());
    sceneTexture.dispose();
    faceTexture.dispose();
  });
});
