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

const DEFAULT_HOLD_MS = 520;

export function stabilizeSpatialTemplateFrame(
  previous: SpatialTemplateStabilizerState | null,
  next: SpatialTemplateRenderInput,
  options: SpatialTemplateStabilizerOptions = {},
): SpatialTemplateStabilizerState {
  const holdMs = options.holdMs ?? DEFAULT_HOLD_MS;

  if (shouldHoldPreviousVisibleInput(previous, next, holdMs)) {
    return holdPreviousVisibleInput(previous, next, holdMs);
  }

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

  const hiddenAgeMs = Math.max(0, next.timestampMs - previous.lastVisibleTimestampMs);

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

function shouldHoldPreviousVisibleInput(
  previous: SpatialTemplateStabilizerState | null,
  next: SpatialTemplateRenderInput,
  holdMs: number,
): previous is SpatialTemplateStabilizerState & {
  lastVisibleInput: SpatialTemplateRenderInput;
  lastVisibleTimestampMs: number;
} {
  if (!previous?.lastVisibleInput || previous.lastVisibleTimestampMs === null) {
    return false;
  }

  if (previous.lastVisibleInput.mesh.mode !== 'two-hand-lattice') {
    return false;
  }

  if (!isLowerFidelityDegradation(next.mesh.mode)) {
    return false;
  }

  const gapAgeMs = Math.max(0, next.timestampMs - previous.lastVisibleTimestampMs);
  return gapAgeMs <= holdMs;
}

function holdPreviousVisibleInput(
  previous: SpatialTemplateStabilizerState & {
    lastVisibleInput: SpatialTemplateRenderInput;
    lastVisibleTimestampMs: number;
  },
  next: SpatialTemplateRenderInput,
  holdMs: number,
): SpatialTemplateStabilizerState {
  const gapAgeMs = Math.max(0, next.timestampMs - previous.lastVisibleTimestampMs);
  const opacityScale = Math.max(0.15, 1 - gapAgeMs / holdMs);
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

function isLowerFidelityDegradation(mode: SpatialTemplateMesh['mode']): boolean {
  return mode === 'hidden' || mode === 'one-hand-lattice' || mode === 'one-hand-template';
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
