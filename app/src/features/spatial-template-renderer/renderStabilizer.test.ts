import { describe, expect, it } from 'vitest';
import type { LightSheetStylePreset } from '../../shared/runtime/types';
import type { SpatialTemplateMesh } from '../spatial-template-model/types';
import type { SpatialTemplateRenderInput } from './renderInput';
import { stabilizeSpatialTemplateFrame } from './renderStabilizer';

describe('stabilizeSpatialTemplateFrame', () => {
  it('keeps the last visible template through a short hidden tracking gap', () => {
    const visible = renderInput(1000, visibleMesh());
    const visibleState = stabilizeSpatialTemplateFrame(null, visible);
    const hiddenState = stabilizeSpatialTemplateFrame(visibleState, renderInput(1320, hiddenMesh()));

    expect(hiddenState.renderInput?.mesh.mode).toBe('two-hand-lattice');
    expect(hiddenState.renderInput?.mesh.opacity).toBeGreaterThan(0);
    expect(hiddenState.lastVisibleTimestampMs).toBe(1000);
  });

  it('keeps a recent two-hand template through a short one-hand tracking degradation', () => {
    const twoHandState = stabilizeSpatialTemplateFrame(null, renderInput(1000, visibleMesh()));
    const degradedState = stabilizeSpatialTemplateFrame(
      twoHandState,
      renderInput(1180, oneHandMesh()),
    );

    expect(degradedState.renderInput?.mesh.mode).toBe('two-hand-lattice');
    expect(degradedState.renderInput?.mesh.opacity).toBeGreaterThan(0);
    expect(degradedState.lastVisibleTimestampMs).toBe(1000);
  });

  it('clears the held template after the hidden gap exceeds the hold window', () => {
    const visibleState = stabilizeSpatialTemplateFrame(null, renderInput(1000, visibleMesh()));
    const hiddenState = stabilizeSpatialTemplateFrame(visibleState, renderInput(1700, hiddenMesh()));

    expect(hiddenState.renderInput).toBeNull();
    expect(hiddenState.lastVisibleInput).toBeNull();
    expect(hiddenState.lastVisibleTimestampMs).toBeNull();
  });

  it('replaces held geometry immediately when a new visible template arrives', () => {
    const firstState = stabilizeSpatialTemplateFrame(null, renderInput(1000, visibleMesh(0.2)));
    const heldState = stabilizeSpatialTemplateFrame(firstState, renderInput(1040, hiddenMesh()));
    const nextState = stabilizeSpatialTemplateFrame(heldState, renderInput(1080, visibleMesh(0.72)));

    expect(nextState.renderInput?.mesh.vertices[0]?.position.x).toBe(0.72);
    expect(nextState.lastVisibleTimestampMs).toBe(1080);
  });
});

function renderInput(timestampMs: number, mesh: SpatialTemplateMesh): SpatialTemplateRenderInput {
  return {
    mesh,
    style,
    scene: {
      video: document.createElement('video'),
      mirrored: true,
      viewport: { width: 640, height: 360 },
    },
    timestampMs,
  };
}

function visibleMesh(x = 0.3): SpatialTemplateMesh {
  return {
    mode: 'two-hand-lattice',
    opacity: 0.8,
    confidence: 0.9,
    vertices: [
      { position: { x, y: 0.4, z: 0 }, samplePoint: { x, y: 0.4 } },
      { position: { x: x + 0.2, y: 0.5, z: 0 }, samplePoint: { x: x + 0.2, y: 0.5 } },
      { position: { x, y: 0.6, z: 0 }, samplePoint: { x, y: 0.6 } },
    ],
    faces: [{ indices: [0, 1, 2], materialId: 'strip-ab' }],
  };
}

function hiddenMesh(): SpatialTemplateMesh {
  return {
    mode: 'hidden',
    opacity: 0,
    confidence: 0,
    vertices: [],
    faces: [],
  };
}

function oneHandMesh(): SpatialTemplateMesh {
  return {
    mode: 'one-hand-lattice',
    opacity: 0.5,
    confidence: 0.45,
    vertices: [
      { position: { x: 0.1, y: 0.2, z: 0 }, samplePoint: { x: 0.1, y: 0.2 } },
      { position: { x: 0.2, y: 0.3, z: 0 }, samplePoint: { x: 0.2, y: 0.3 } },
      { position: { x: 0.1, y: 0.4, z: 0 }, samplePoint: { x: 0.1, y: 0.4 } },
    ],
    faces: [{ indices: [0, 1, 2], materialId: 'scene' }],
  };
}

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
