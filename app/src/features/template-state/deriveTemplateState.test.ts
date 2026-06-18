import { describe, expect, it } from 'vitest';
import { deriveTemplateState } from './deriveTemplateState';
import type { TemplateState } from './types';

describe('deriveTemplateState', () => {
  it('keeps the previous visible state when hands are active but current mesh is invalid', () => {
    const previous = visibleState('wide-blue-face');

    const next = deriveTemplateState({
      activeHandCount: 2,
      leftAnchor: { x: 0.22, y: 0.55, z: 0 },
      rightAnchor: { x: 0.78, y: 0.48, z: 0 },
      fingertipQuality: 'invalid',
      timestampMs: 2400,
      previous,
    });

    expect(next.mode).toBe('wide-blue-face');
    expect(next.visible).toBe(true);
    expect(next.opacity).toBe(1);
  });

  it('selects thin-edge when hand span is high but projected height is low', () => {
    const next = deriveTemplateState({
      activeHandCount: 2,
      leftAnchor: { x: 0.15, y: 0.52, z: 0 },
      rightAnchor: { x: 0.86, y: 0.54, z: 0 },
      projectedHeight: 0.025,
      fingertipQuality: 'valid',
      timestampMs: 1200,
      previous: null,
    });

    expect(next.mode).toBe('thin-edge');
    expect(next.rotation).toBeCloseTo(Math.atan2(0.02, 0.71), 3);
  });

  it('selects triangle-fold when one hand is near camera and the other is far', () => {
    const next = deriveTemplateState({
      activeHandCount: 2,
      leftAnchor: { x: 0.18, y: 0.55, z: -0.22 },
      rightAnchor: { x: 0.72, y: 0.42, z: 0.08 },
      projectedHeight: 0.22,
      fingertipQuality: 'valid',
      timestampMs: 1400,
      previous: null,
    });

    expect(next.mode).toBe('triangle-fold');
    expect(next.depthTilt).toBeGreaterThan(0.15);
  });
});

function visibleState(mode: TemplateState['mode']): TemplateState {
  return {
    mode,
    visible: true,
    activeHandCount: 2,
    center: { x: 0.5, y: 0.5, z: 0 },
    span: 0.58,
    rotation: 0,
    depthTilt: 0,
    foldAmount: 0.4,
    opacity: 1,
    materialPreset: 'blue-face',
    timestampMs: 1000,
  };
}
