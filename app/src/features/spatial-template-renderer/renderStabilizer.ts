import type { SpatialTemplateMesh } from '../spatial-template-model/types';
import type { SpatialTemplateRenderInput } from './renderInput';

export type SpatialTemplateStabilizerState = {
  renderInput: SpatialTemplateRenderInput | null;
  lastVisibleInput: SpatialTemplateRenderInput | null;
  lastVisibleTimestampMs: number | null;
};

export type SpatialTemplateStabilizerOptions = {
  holdMs?: number;
};

const DEFAULT_HOLD_MS = 180;

export function stabilizeSpatialTemplateFrame(
  previous: SpatialTemplateStabilizerState | null,
  next: SpatialTemplateRenderInput,
  options: SpatialTemplateStabilizerOptions = {},
): SpatialTemplateStabilizerState {
  const holdMs = options.holdMs ?? DEFAULT_HOLD_MS;

  if (next.mesh.mode !== 'hidden') {
    return {
      renderInput: next,
      lastVisibleInput: next,
      lastVisibleTimestampMs: next.timestampMs,
    };
  }

  if (!previous?.lastVisibleInput || previous.lastVisibleTimestampMs === null) {
    return emptyState();
  }

  const hiddenAgeMs = next.timestampMs - previous.lastVisibleTimestampMs;

  if (hiddenAgeMs > holdMs) {
    return emptyState();
  }

  const opacityScale = Math.max(0.15, 1 - hiddenAgeMs / holdMs);
  const heldInput = previous.lastVisibleInput;

  return {
    renderInput: {
      ...heldInput,
      timestampMs: next.timestampMs,
      scene: next.scene,
      mesh: fadeMesh(heldInput.mesh, opacityScale),
    },
    lastVisibleInput: previous.lastVisibleInput,
    lastVisibleTimestampMs: previous.lastVisibleTimestampMs,
  };
}

function emptyState(): SpatialTemplateStabilizerState {
  return {
    renderInput: null,
    lastVisibleInput: null,
    lastVisibleTimestampMs: null,
  };
}

function fadeMesh(mesh: SpatialTemplateMesh, opacityScale: number): SpatialTemplateMesh {
  return {
    ...mesh,
    opacity: mesh.opacity * opacityScale,
    confidence: mesh.confidence * opacityScale,
  };
}
