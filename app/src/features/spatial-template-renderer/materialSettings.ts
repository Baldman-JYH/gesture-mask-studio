import type { LightSheetStylePreset } from '../../shared/runtime/types';
import type { SpatialTemplateMaterialId } from '../spatial-template-model/types';

export type SpatialTemplateMaterialSettings = {
  color: number;
  opacity: number;
  usesVideoTexture: boolean;
};

const STRIP_COLORS: Record<string, number> = {
  'strip-ab': 0x34d8ff,
  'strip-bc': 0x85ff72,
  'strip-cd': 0xffd45c,
  'strip-de': 0xff78d6,
  'strip-ea': 0x9b86ff,
};

export function resolveSpatialTemplateMaterialSettings(
  materialId: SpatialTemplateMaterialId | string,
  style: LightSheetStylePreset,
  meshOpacity: number,
): SpatialTemplateMaterialSettings {
  const baseOpacity = clamp01(style.opacity * meshOpacity);
  const tint = hexToNumber(style.sceneSample.tint);
  const edge = hexToNumber(style.edgeColor);

  if (materialId === 'scene') {
    return {
      color: tint,
      opacity: baseOpacity * Math.max(0.5, style.sceneSample.intensity * 0.76),
      usesVideoTexture: true,
    };
  }

  if (materialId === 'panel') {
    return {
      color: mixRgb(0xffffff, tint, 0.4),
      opacity: baseOpacity * 0.42,
      usesVideoTexture: true,
    };
  }

  if (materialId === 'back') {
    return {
      color: 0x22323a,
      opacity: baseOpacity * 0.16,
      usesVideoTexture: false,
    };
  }

  if (materialId === 'accent') {
    return {
      color: mixRgb(tint, edge, 0.55),
      opacity: baseOpacity * 0.38,
      usesVideoTexture: false,
    };
  }

  if (materialId === 'cap') {
    return {
      color: mixRgb(0xffffff, tint, 0.32),
      opacity: baseOpacity * 0.28,
      usesVideoTexture: false,
    };
  }

  if (materialId === 'edge') {
    return {
      color: edge,
      opacity: baseOpacity * 0.86,
      usesVideoTexture: false,
    };
  }

  if (materialId in STRIP_COLORS) {
    return {
      color: mixRgb(STRIP_COLORS[materialId], tint, 0.16),
      opacity: baseOpacity * 0.72,
      usesVideoTexture: true,
    };
  }

  return {
    color: tint,
    opacity: baseOpacity * 0.5,
    usesVideoTexture: true,
  };
}

function hexToNumber(hex: string): number {
  const normalized = hex.replace('#', '').trim();
  const value = normalized.length === 3
    ? normalized
      .split('')
      .map((character) => `${character}${character}`)
      .join('')
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return 0xffffff;
  }

  return Number.parseInt(value, 16);
}

function mixRgb(left: number, right: number, amount: number): number {
  const mixChannel = (shift: number) => {
    const leftChannel = (left >> shift) & 0xff;
    const rightChannel = (right >> shift) & 0xff;
    return Math.round(leftChannel + (rightChannel - leftChannel) * amount);
  };

  return (mixChannel(16) << 16) + (mixChannel(8) << 8) + mixChannel(0);
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
