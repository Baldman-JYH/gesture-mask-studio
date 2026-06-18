import { describe, expect, it } from 'vitest';
import {
  REFERENCE_FRAGMENT_SHADER,
  REFERENCE_VERTEX_SHADER,
} from './referenceShaderSource';

describe('reference shader source', () => {
  it('declares the required texture and effect uniforms', () => {
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform sampler2D uSceneTexture');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform sampler2D uFaceTexture');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform float uPixelSize');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform float uGlitchAmount');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform int uMaterialMode');
  });

  it('includes pixelation, palette mapping, and rgb glitch branches', () => {
    expect(REFERENCE_FRAGMENT_SHADER).toContain('pixelateUv');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('paletteMap');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('rgbGlitch');
  });

  it('passes model and video uv varyings from the vertex shader', () => {
    expect(REFERENCE_VERTEX_SHADER).toContain('varying vec2 vVideoUv');
    expect(REFERENCE_VERTEX_SHADER).toContain('varying vec2 vFaceUv');
  });

  it('declares the material mode branches needed by renderer integration', () => {
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uMaterialMode == 1');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uMaterialMode == 2');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uMaterialMode == 3');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uMaterialMode == 4');
  });
});
