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
  const landmarks = Array.from({ length: 21 }, () => ({ x, y, z: -0.02 }));
  landmarks[0] = { x, y: y + 0.22, z: 0 };
  landmarks[4] = { x: x - 0.12, y: y + 0.02, z: -0.04 };
  landmarks[5] = { x: x - 0.06, y: y + 0.12, z: -0.03 };
  landmarks[8] = { x: x - 0.06, y: y - 0.14, z: -0.08 };
  landmarks[9] = { x, y: y + 0.12, z: -0.03 };
  landmarks[12] = { x, y: y - 0.2, z: -0.1 };
  landmarks[13] = { x: x + 0.06, y: y + 0.12, z: -0.03 };
  landmarks[16] = { x: x + 0.06, y: y - 0.14, z: -0.07 };
  landmarks[17] = { x: x + 0.12, y: y + 0.12, z: -0.03 };
  landmarks[20] = { x: x + 0.12, y: y - 0.04, z: -0.05 };

  return {
    id,
    handedness: 'unknown',
    confidence: 0.9,
    landmarks,
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

    expect(input.mesh.mode).toBe('one-hand-lattice');
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

    expect(input.mesh.mode).toBe('two-hand-lattice');
    expect(input.mesh.faces.every((face) => face.indices.length === 3)).toBe(true);
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

    expect(input.mesh.mode).toBe('one-hand-lattice');
  });

  it('falls back to the stable anchor template when fingertip rails cross', () => {
    const input = createSpatialTemplateRenderInput({
      displayHands: [
        verticalHand('left', 0.24, ['A', 'B', 'C', 'D', 'E']),
        verticalHand('right', 0.76, ['E', 'D', 'C', 'B', 'A']),
      ],
      video: video(),
      mirrored: false,
      style,
      timestampMs: 2200,
    });

    expect(input.mesh.mode).toBe('two-hand-template');
    expect(input.mesh.faces.every((face) => face.indices.length === 4)).toBe(true);
  });
});

function verticalHand(
  id: string,
  x: number,
  order: Array<'A' | 'B' | 'C' | 'D' | 'E'>,
): TrackedHand {
  const landmarks = Array.from({ length: 21 }, () => ({ x, y: 0.5, z: -0.02 }));
  const yByOrder = [0.24, 0.32, 0.4, 0.48, 0.56];
  const indexByFinger = {
    A: 4,
    B: 8,
    C: 12,
    D: 16,
    E: 20,
  } as const;

  landmarks[0] = { x, y: 0.72, z: 0 };
  for (const [index, finger] of order.entries()) {
    landmarks[indexByFinger[finger]] = { x, y: yByOrder[index], z: -0.04 };
  }

  return {
    id,
    handedness: 'unknown',
    confidence: 0.9,
    landmarks,
  };
}
