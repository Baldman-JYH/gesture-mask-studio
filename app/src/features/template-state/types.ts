import type { NormalizedPoint } from '../../shared/runtime/types';

export type TemplateMode =
  | 'hidden'
  | 'wide-blue-face'
  | 'white-card-face'
  | 'green-cyan-face'
  | 'thin-edge'
  | 'triangle-fold'
  | 'one-hand-wedge';

export type TemplateMaterialPreset =
  | 'blue-face'
  | 'white-red-pixels'
  | 'green-cyan'
  | 'edge-only';

export type TemplateState = {
  mode: TemplateMode;
  visible: boolean;
  activeHandCount: number;
  center: NormalizedPoint;
  span: number;
  rotation: number;
  depthTilt: number;
  depthDelta: number;
  foldAmount: number;
  opacity: number;
  materialPreset: TemplateMaterialPreset;
  timestampMs: number;
};

export type FingertipQuality = 'valid' | 'invalid' | 'missing';

export type DeriveTemplateStateInput = {
  activeHandCount: number;
  leftAnchor?: NormalizedPoint;
  rightAnchor?: NormalizedPoint;
  projectedHeight?: number;
  fingertipQuality: FingertipQuality;
  timestampMs: number;
  previous: TemplateState | null;
};
