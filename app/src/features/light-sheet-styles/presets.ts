import type { LightSheetStylePreset } from '../../shared/runtime/types';

export const LIGHT_SHEET_STYLE_PRESETS: LightSheetStylePreset[] = [
  {
    id: 'blueprint',
    label: 'Blueprint',
    thumbnailUrl: '/textures/blueprint.svg',
    textureUrl: '/textures/blueprint.svg',
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
  },
  {
    id: 'cards',
    label: 'Cards',
    thumbnailUrl: '/textures/cards.svg',
    textureUrl: '/textures/cards.svg',
    shader: 'cards',
    opacity: 0.88,
    edgeColor: '#fff9f0',
    edgeWidth: 1.8,
    sceneSample: {
      enabled: true,
      mode: 'luma-map',
      intensity: 0.38,
      tint: '#ffffff',
    },
    highlight: {
      enabled: true,
      intensity: 0.42,
      speed: 0.28,
    },
    blendMode: 'normal',
  },
  {
    id: 'organic',
    label: 'Organic',
    thumbnailUrl: '/textures/organic.svg',
    textureUrl: '/textures/organic.svg',
    shader: 'organic',
    opacity: 0.78,
    edgeColor: '#f0fff2',
    edgeWidth: 2.4,
    sceneSample: {
      enabled: true,
      mode: 'posterized',
      intensity: 0.7,
      tint: '#7ee05f',
    },
    highlight: {
      enabled: true,
      intensity: 0.5,
      speed: 0.34,
    },
    blendMode: 'screen',
  },
];

export function getLightSheetStylePreset(id: string): LightSheetStylePreset {
  return (
    LIGHT_SHEET_STYLE_PRESETS.find((preset) => preset.id === id) ??
    LIGHT_SHEET_STYLE_PRESETS[0]
  );
}
