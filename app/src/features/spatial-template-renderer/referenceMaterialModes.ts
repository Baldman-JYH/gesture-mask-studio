import type { SpatialTemplateMaterialId } from '../spatial-template-model/types';

export const REFERENCE_MATERIAL_MODES = {
  defaultTextured: 0,
  blueFace: 1,
  cardFace: 2,
  greenFace: 3,
  whiteEdge: 4,
} as const;

export type ReferenceMaterialMode =
  (typeof REFERENCE_MATERIAL_MODES)[keyof typeof REFERENCE_MATERIAL_MODES];

export const materialModeForTemplateMaterial = (
  materialId: SpatialTemplateMaterialId,
): ReferenceMaterialMode => {
  switch (materialId) {
    case 'face-blue':
      return REFERENCE_MATERIAL_MODES.blueFace;
    case 'face-card':
      return REFERENCE_MATERIAL_MODES.cardFace;
    case 'face-green':
      return REFERENCE_MATERIAL_MODES.greenFace;
    case 'edge-white':
      return REFERENCE_MATERIAL_MODES.whiteEdge;
    default:
      return REFERENCE_MATERIAL_MODES.defaultTextured;
  }
};
