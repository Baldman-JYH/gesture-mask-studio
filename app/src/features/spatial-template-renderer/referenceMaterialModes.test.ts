import { describe, expect, it } from 'vitest';
import {
  REFERENCE_MATERIAL_MODES,
  materialModeForTemplateMaterial,
} from './referenceMaterialModes';

describe('reference material modes', () => {
  it('maps reference template material ids to stable shader modes', () => {
    expect(materialModeForTemplateMaterial('face-blue')).toBe(REFERENCE_MATERIAL_MODES.blueFace);
    expect(materialModeForTemplateMaterial('face-card')).toBe(REFERENCE_MATERIAL_MODES.cardFace);
    expect(materialModeForTemplateMaterial('face-green')).toBe(REFERENCE_MATERIAL_MODES.greenFace);
    expect(materialModeForTemplateMaterial('edge-white')).toBe(REFERENCE_MATERIAL_MODES.whiteEdge);
  });

  it('keeps non-reference material ids on the default textured mode', () => {
    expect(materialModeForTemplateMaterial('scene')).toBe(REFERENCE_MATERIAL_MODES.defaultTextured);
    expect(materialModeForTemplateMaterial('glass-clear')).toBe(REFERENCE_MATERIAL_MODES.defaultTextured);
  });
});
