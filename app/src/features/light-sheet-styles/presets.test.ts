import { describe, expect, it } from 'vitest';
import { getLightSheetStylePreset, LIGHT_SHEET_STYLE_PRESETS } from './presets';

describe('light sheet style presets', () => {
  it('defines the required blueprint, cards, and organic presets', () => {
    expect(LIGHT_SHEET_STYLE_PRESETS.map((preset) => preset.id)).toEqual([
      'blueprint',
      'cards',
      'organic',
    ]);
  });

  it('keeps live scene sampling enabled for every preset', () => {
    expect(LIGHT_SHEET_STYLE_PRESETS.every((preset) => preset.sceneSample.enabled)).toBe(true);
  });

  it('falls back to blueprint for an unknown preset id', () => {
    expect(getLightSheetStylePreset('missing').id).toBe('blueprint');
  });
});
