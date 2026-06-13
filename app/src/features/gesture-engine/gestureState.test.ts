import { describe, expect, it } from 'vitest';
import type { TrackedHand } from '../../shared/runtime/types';
import { deriveLightSheetGestureState } from './gestureState';

function hand(id: string, x: number, y: number, confidence = 0.9): TrackedHand {
  return {
    id,
    handedness: 'unknown',
    confidence,
    landmarks: [
      { x, y },
      { x, y },
      { x, y },
      { x, y },
      { x: x + 0.02, y: y + 0.01 },
      { x, y },
      { x, y },
      { x, y },
      { x: x - 0.02, y: y + 0.01 },
    ],
  };
}

describe('deriveLightSheetGestureState', () => {
  it('uses two hands to enter two-hand-sheet mode', () => {
    const state = deriveLightSheetGestureState({
      hands: [hand('right', 0.8, 0.45), hand('left', 0.2, 0.5)],
      requestedPresetId: 'cards',
    });

    expect(state.mode).toBe('two-hand-sheet');
    expect(state.stylePresetId).toBe('cards');
    expect(state.anchors.left.x).toBeLessThan(state.anchors.right?.x ?? 0);
  });

  it('uses one hand to enter one-hand-preview mode', () => {
    const state = deriveLightSheetGestureState({
      hands: [hand('single', 0.4, 0.5)],
      requestedPresetId: 'organic',
    });

    expect(state.mode).toBe('one-hand-preview');
    expect(state.anchors.right).toBeUndefined();
  });

  it('hides the sheet when no hands are available', () => {
    const state = deriveLightSheetGestureState({
      hands: [],
      requestedPresetId: 'blueprint',
    });

    expect(state.mode).toBe('hidden');
    expect(state.confidence).toBe(0);
  });

  it('falls back to blueprint for an unknown style id', () => {
    const state = deriveLightSheetGestureState({
      hands: [hand('left', 0.2, 0.5), hand('right', 0.8, 0.5)],
      requestedPresetId: 'missing',
    });

    expect(state.stylePresetId).toBe('blueprint');
  });
});
