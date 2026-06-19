import { describe, expect, it } from 'vitest';
import {
  REFERENCE_FRAGMENT_SHADER,
  REFERENCE_VERTEX_SHADER,
} from './referenceShaderSource';
import { REFERENCE_MATERIAL_MODES } from './referenceMaterialModes';

describe('reference shader source', () => {
  it('declares the required texture and effect uniforms', () => {
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform sampler2D uSceneTexture');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform sampler2D uFaceTexture');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform float uOpacity');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform float uTime');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform float uPixelSize');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform float uGlitchAmount');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform int uMaterialMode');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform vec4 uFaceRoi');
  });

  it('includes pixelation, palette mapping, and rgb glitch branches', () => {
    expect(REFERENCE_FRAGMENT_SHADER).toContain('pixelateUv');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('paletteMap');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('rgbGlitch');
  });

  it('uses the face texture as the primary source for palette and rgb glitch processing', () => {
    expect(REFERENCE_FRAGMENT_SHADER).toContain('texture2D(uFaceTexture, uv + offset).r');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('texture2D(uFaceTexture, uv).g');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('texture2D(uFaceTexture, uv - offset).b');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('vec3 glitchedFace = rgbGlitch');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('paletteMap(glitchedFace)');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('vec2 faceUv = uFaceRoi.xy +');
  });

  it('passes model and video uv varyings from the vertex shader', () => {
    expect(REFERENCE_VERTEX_SHADER).toContain('varying vec2 vVideoUv');
    expect(REFERENCE_VERTEX_SHADER).toContain('varying vec2 vFaceUv');
  });

  it('declares the material mode branches needed by renderer integration', () => {
    expect(REFERENCE_FRAGMENT_SHADER).toContain(
      `const int MATERIAL_MODE_BLUE_FACE = ${REFERENCE_MATERIAL_MODES.blueFace};`,
    );
    expect(REFERENCE_FRAGMENT_SHADER).toContain(
      `const int MATERIAL_MODE_CARD_FACE = ${REFERENCE_MATERIAL_MODES.cardFace};`,
    );
    expect(REFERENCE_FRAGMENT_SHADER).toContain(
      `const int MATERIAL_MODE_GREEN_FACE = ${REFERENCE_MATERIAL_MODES.greenFace};`,
    );
    expect(REFERENCE_FRAGMENT_SHADER).toContain(
      `const int MATERIAL_MODE_WHITE_EDGE = ${REFERENCE_MATERIAL_MODES.whiteEdge};`,
    );
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uMaterialMode == MATERIAL_MODE_BLUE_FACE');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uMaterialMode == MATERIAL_MODE_CARD_FACE');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uMaterialMode == MATERIAL_MODE_GREEN_FACE');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uMaterialMode == MATERIAL_MODE_WHITE_EDGE');
  });

  it('keeps face-derived palette color as the base for textured material modes', () => {
    expect(REFERENCE_FRAGMENT_SHADER).toContain('vec3 blueFace = mix(paletteColor');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('vec3 cardFace = mix(paletteColor');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('vec3 greenFace = mix(paletteColor');
  });

  it('adds reference-style face edge ink over the pixelated portrait texture', () => {
    expect(REFERENCE_FRAGMENT_SHADER).toContain('faceEdgeMagnitude');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('portraitInk');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('referenceHueBoost');
  });
});
