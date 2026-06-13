import { describe, expect, it } from 'vitest';
import type { LightSheetStylePreset, TrackedHand } from '../../shared/runtime/types';
import { createSpatialTemplateRenderInput } from './renderInput';

const style: LightSheetStylePreset = {
  id: 'blueprint',
  label: 'Blueprint',
  thumbnailUrl: 'blueprint.svg',
  shader: 'blueprint',
  opacity: 0.82,
  edgeColor: '#e9fbff',
  edgeWidth: 2.2,
  sceneSample: {
    enabled: true,
    mode: 'edge-lines',
    intensity: 0.86,
    tint: '#38d5ff',
  },
  highlight: {
    enabled: true,
    intensity: 0.72,
    speed: 0.42,
  },
  blendMode: 'screen',
};

function hand(id: string, x: number, y: number): TrackedHand {
  return {
    id,
    handedness: 'unknown',
    confidence: 0.9,
    landmarks: [
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x: x - 0.04, y, z: -0.03 },
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x: x + 0.04, y: y + 0.02, z: -0.01 },
    ],
  };
}

function video(): HTMLVideoElement {
  const element = document.createElement('video');
  Object.defineProperty(element, 'videoWidth', { value: 1280 });
  Object.defineProperty(element, 'videoHeight', { value: 720 });
  Object.defineProperty(element, 'clientWidth', { value: 640 });
  Object.defineProperty(element, 'clientHeight', { value: 360 });
  return element;
}

describe('createSpatialTemplateRenderInput', () => {
  it('creates a one-hand spatial template render input from display hands', () => {
    const input = createSpatialTemplateRenderInput({
      displayHands: [hand('single', 0.45, 0.5)],
      video: video(),
      mirrored: true,
      style,
      timestampMs: 1200,
    });

    expect(input.mesh.mode).toBe('one-hand-template');
    expect(input.scene.viewport).toEqual({ width: 640, height: 360 });
    expect(input.timestampMs).toBe(1200);
  });

  it('creates a two-hand spatial template render input from display hands', () => {
    const input = createSpatialTemplateRenderInput({
      displayHands: [hand('right', 0.8, 0.5), hand('left', 0.2, 0.45)],
      video: video(),
      mirrored: false,
      style,
      timestampMs: 1600,
    });

    expect(input.mesh.mode).toBe('two-hand-template');
    expect(input.scene.mirrored).toBe(false);
  });

  it('collapses duplicate hand detections before building render input', () => {
    const input = createSpatialTemplateRenderInput({
      displayHands: [hand('primary', 0.42, 0.52), hand('duplicate', 0.445, 0.535)],
      video: video(),
      mirrored: true,
      style,
      timestampMs: 1800,
    });

    expect(input.mesh.mode).toBe('one-hand-template');
  });
});
