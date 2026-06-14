import { describe, expect, it } from 'vitest';
import type { LightSheetStylePreset } from '../../shared/runtime/types';
import { resolveSpatialTemplateMaterialSettings } from './materialSettings';

describe('resolveSpatialTemplateMaterialSettings', () => {
  it('assigns distinguishable colors to the five fingertip strip faces', () => {
    const colors = [
      'strip-ab',
      'strip-bc',
      'strip-cd',
      'strip-de',
      'strip-ea',
    ].map((materialId) => resolveSpatialTemplateMaterialSettings(materialId, style, 0.9).color);

    expect(new Set(colors).size).toBe(5);
  });

  it('keeps back faces much lighter than front strip faces to avoid dark box stacking', () => {
    const front = resolveSpatialTemplateMaterialSettings('strip-ab', style, 0.9);
    const back = resolveSpatialTemplateMaterialSettings('back', style, 0.9);

    expect(back.opacity).toBeLessThan(front.opacity * 0.45);
    expect(back.usesVideoTexture).toBe(false);
  });

  it('uses a non-video high-opacity edge material for readable template boundaries', () => {
    const edge = resolveSpatialTemplateMaterialSettings('edge', style, 0.9);

    expect(edge.usesVideoTexture).toBe(false);
    expect(edge.opacity).toBeGreaterThan(0.55);
  });

  it('fades edge opacity with held mesh opacity during tracking gaps', () => {
    const visibleEdge = resolveSpatialTemplateMaterialSettings('edge', style, 0.9);
    const heldEdge = resolveSpatialTemplateMaterialSettings('edge', style, 0.12);

    expect(heldEdge.opacity).toBeLessThan(visibleEdge.opacity * 0.25);
  });
});

const style: LightSheetStylePreset = {
  id: 'organic',
  label: 'Organic',
  thumbnailUrl: 'organic.svg',
  shader: 'organic',
  opacity: 0.78,
  edgeColor: '#ffffff',
  edgeWidth: 2.2,
  sceneSample: {
    enabled: true,
    mode: 'luma-map',
    intensity: 0.8,
    tint: '#8cffb6',
  },
  highlight: {
    enabled: true,
    intensity: 0.72,
    speed: 0.42,
  },
  blendMode: 'screen',
};
