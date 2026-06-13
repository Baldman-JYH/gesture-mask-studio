import type { NormalizedPoint } from '../../shared/runtime/types';

export type SpatialTemplateMode = 'hidden' | 'one-hand-wedge' | 'two-hand-ribbon';

export type SpatialTemplateMaterialId = 'scene' | 'accent' | 'edge';

export type SpatialTemplateVertex = {
  position: NormalizedPoint;
  samplePoint: NormalizedPoint;
};

export type SpatialTemplateFace = {
  indices: [number, number, number] | [number, number, number, number];
  materialId: SpatialTemplateMaterialId;
};

export type SpatialTemplateMesh = {
  mode: SpatialTemplateMode;
  vertices: SpatialTemplateVertex[];
  faces: SpatialTemplateFace[];
  opacity: number;
  confidence: number;
};
