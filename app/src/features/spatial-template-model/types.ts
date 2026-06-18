import type { NormalizedPoint } from '../../shared/runtime/types';

export type SpatialTemplateMode =
  | 'hidden'
  | 'one-hand-template'
  | 'two-hand-template'
  | 'one-hand-lattice'
  | 'two-hand-lattice';

export type SpatialTemplateMaterialId =
  | 'scene'
  | 'panel'
  | 'back'
  | 'accent'
  | 'cap'
  | 'edge'
  | 'strip-ab'
  | 'strip-bc'
  | 'strip-cd'
  | 'strip-de'
  | 'strip-ea'
  | 'face-blue'
  | 'face-card'
  | 'face-green'
  | 'edge-white'
  | 'glass-clear';

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
