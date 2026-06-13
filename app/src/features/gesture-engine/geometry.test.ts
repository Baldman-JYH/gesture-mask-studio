import { describe, expect, it } from 'vitest';
import {
  buildOneHandPreviewGeometry,
  buildTwoHandLightSheetGeometry,
  clampNormalizedPoint,
} from './geometry';

describe('buildTwoHandLightSheetGeometry', () => {
  it('builds a four-vertex light sheet between two anchors', () => {
    const geometry = buildTwoHandLightSheetGeometry({
      left: { x: 0.25, y: 0.5 },
      right: { x: 0.75, y: 0.5 },
      openness: 0.5,
      confidence: 0.9,
    });

    expect(geometry.mode).toBe('two-hand-sheet');
    expect(geometry.vertices).toHaveLength(4);
    expect(geometry.opacity).toBeGreaterThan(0.7);
  });

  it('keeps vertices inside normalized screen bounds', () => {
    const geometry = buildTwoHandLightSheetGeometry({
      left: { x: 0.02, y: 0.05 },
      right: { x: 0.98, y: 0.95 },
      openness: 1,
      confidence: 1,
    });

    for (const vertex of geometry.vertices) {
      expect(vertex?.x).toBeGreaterThanOrEqual(0);
      expect(vertex?.x).toBeLessThanOrEqual(1);
      expect(vertex?.y).toBeGreaterThanOrEqual(0);
      expect(vertex?.y).toBeLessThanOrEqual(1);
    }
  });
});

describe('buildOneHandPreviewGeometry', () => {
  it('builds a compact triangular preview around one anchor', () => {
    const geometry = buildOneHandPreviewGeometry({
      anchor: { x: 0.5, y: 0.5 },
      openness: 0.4,
      confidence: 0.75,
    });

    expect(geometry.mode).toBe('one-hand-preview');
    expect(geometry.vertices).toHaveLength(3);
    expect(geometry.confidence).toBe(0.75);
  });
});

describe('clampNormalizedPoint', () => {
  it('clamps x and y to normalized bounds', () => {
    expect(clampNormalizedPoint({ x: -0.5, y: 1.5 })).toEqual({ x: 0, y: 1 });
  });
});
