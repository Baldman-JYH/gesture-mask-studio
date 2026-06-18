# Reference Effect Replication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate the target reference video effect as a continuous hand-anchored AR 3D template with stable folding states, sharp white edges, face-derived pixel/glitch shader materials, and no disappearance while hands are active.

**Architecture:** Keep the current browser-local foundation: React/Vite, MediaPipe hand tracking, Three.js/WebGL, live camera texture sampling, and static deployment. Insert a `template-state` layer between hand topology and mesh generation, add face-region texture capture, replace the current `MeshBasicMaterial` spatial renderer with a shader-driven renderer, and verify each stage against FFmpeg frame evidence.

**Tech Stack:** React 19, Vite 8, TypeScript, Three.js `RawShaderMaterial`/`ShaderMaterial`, MediaPipe Tasks Vision `HandLandmarker` plus face ROI tracking, Vitest, Playwright/browser smoke checks, FFmpeg frame extraction.

---

## Target Behavior

The result should match these visible properties from `参考视频.mp4`:

- The effect never disappears while one or two hands remain active; transient tracking/lattice failures hold the last good visual state.
- Two hands control a stable object between hands: scale follows hand distance, rotation follows the line between hands, and fold/tilt follows relative palm/fingertip pose.
- The object is not a raw closed fingertip box. It switches among controlled states:
  - `wide-blue-face`: long folded strip with face line art.
  - `white-card-face`: white panel with red pixel blocks.
  - `green-cyan-face`: green/cyan high-contrast panel.
  - `thin-edge`: narrow blade/edge state.
  - `triangle-fold`: triangular folded surface.
  - `one-hand-wedge`: one-hand triangular wedge or held prior state.
- Major edges are sharp, mostly white, and visually stronger than the translucent body.
- Selected faces use a processed face texture: pixelated, high contrast, high saturation, cyan/green/yellow palette, plus RGB/chromatic glitch offsets.
- Other faces use designed panel materials, not just the same translucent camera texture on every face.

## File Structure

Create:

- `app/src/features/template-state/types.ts`
  - Defines stable template state contracts, anchors, hysteresis fields, material roles, and quality flags.
- `app/src/features/template-state/deriveTemplateState.ts`
  - Converts display-space hands/topology plus previous state into a stable `TemplateState`.
- `app/src/features/template-state/deriveTemplateState.test.ts`
  - Covers state continuity, state transitions, scale, rotation, and non-disappearance.
- `app/src/features/spatial-template-model/referenceTemplateMesh.ts`
  - Builds canonical folded mesh variants from `TemplateState`.
- `app/src/features/spatial-template-model/referenceTemplateMesh.test.ts`
  - Verifies vertex/face/material groups for wide strip, triangle fold, thin edge, and one-hand wedge.
- `app/src/features/face-texture/faceTextureSource.ts`
  - Owns face ROI smoothing, fallback face crop, low-resolution canvas capture, and texture metadata.
- `app/src/features/face-texture/faceTextureSource.test.ts`
  - Tests ROI smoothing, crop clamping, and fallback center-face crop.
- `app/src/features/spatial-template-renderer/referenceShaderSource.ts`
  - Vertex/fragment shader strings for face pixelation, palette mapping, RGB glitch, edge glow, and panel modes.
- `app/src/features/spatial-template-renderer/referenceShaderSource.test.ts`
  - Verifies required uniforms and shader branches exist.
- `app/src/features/spatial-template-renderer/referenceMaterialModes.ts`
  - Shares stable shader material-mode values between shader source tests and renderer integration.
- `app/src/features/spatial-template-renderer/referenceMaterialModes.test.ts`
  - Verifies template material ids map to stable shader material modes.
- `app/src/features/spatial-template-renderer/referenceMaterials.ts`
  - Creates shader materials and maps template material roles to uniforms.
- `app/src/features/spatial-template-renderer/referenceMaterials.test.ts`
  - Verifies material role mapping and default uniform values.
- `docs/analysis/f74f885-reference-replication-validation.md`
  - Final validation report after real-device video testing.

Modify:

- `app/src/components/CameraStage.tsx`
  - Feed active hand count, previous template state, face texture source, and renderer input through a stable runtime controller.
- `app/src/features/spatial-template-renderer/renderInput.ts`
  - Extend render input from raw mesh-only to template state, face texture metadata, and material role map.
- `app/src/features/spatial-template-renderer/SpatialTemplateCanvas.tsx`
  - Replace `MeshBasicMaterial` path with shader materials and explicit edge rendering.
- `app/src/features/spatial-template-model/templateMesh.ts`
  - Route production mesh generation through `referenceTemplateMesh` once state tests pass.
- `app/src/features/spatial-template-renderer/renderStabilizer.ts`
  - Keep the current active-hand non-disappearance policy and move it under `TemplateState` continuity.
- `README.md`
  - Update architecture summary after implementation.
- `CODEX_DOC/2026-06-18-video-framework-analysis-progress.md`
  - Continue progress updates after each task.

---

## Task 1: Lock The Non-Disappearance Contract

**Files:**
- Modify: `app/src/features/spatial-template-renderer/renderStabilizer.test.ts`
- Modify: `app/src/features/spatial-template-renderer/renderStabilizer.ts`
- Modify: `app/src/features/spatial-template-renderer/renderInput.ts`
- Modify: `app/src/components/CameraStage.tsx`

- [x] **Step 1: Write the failing test**

Add this behavior if it is not already present:

```ts
it('keeps the last visible template beyond the hold window while hands are still active', () => {
  const visibleState = stabilizeSpatialTemplateFrame(null, renderInput(1000, visibleMesh(), 2));
  const hiddenState = stabilizeSpatialTemplateFrame(
    visibleState,
    renderInput(2400, hiddenMesh(), 2),
  );

  expect(hiddenState.renderInput?.mesh.mode).toBe('two-hand-lattice');
  expect(hiddenState.renderInput?.mesh.opacity).toBe(0.8);
  expect(hiddenState.lastVisibleTimestampMs).toBe(1000);
});
```

- [x] **Step 2: Run test to verify it fails before implementation**

Run:

```bash
cd app
npm.cmd test -- src/features/spatial-template-renderer/renderStabilizer.test.ts
```

Expected before fix: FAIL because `renderInput` is `null`.

- [x] **Step 3: Implement the minimal state metadata**

Add `activeHandCount` to `SpatialTemplateRenderInput` and pass it from `CameraStage`:

```ts
export type SpatialTemplateRenderInput = {
  mesh: SpatialTemplateMesh;
  style: LightSheetStylePreset;
  scene: SceneSamplingInput;
  timestampMs: number;
  activeHandCount: number;
};
```

- [x] **Step 4: Preserve held input while active hands exist**

In `renderStabilizer.ts`, hold lower-fidelity frames while `next.activeHandCount > 0`:

```ts
if (next.activeHandCount > 0) {
  return true;
}
```

Use full opacity while hands are still active:

```ts
const opacityScale = next.activeHandCount > 0 ? 1 : Math.max(0.15, 1 - gapAgeMs / holdMs);
```

- [x] **Step 5: Verify**

Run:

```bash
cd app
npm.cmd test -- src/features/spatial-template-renderer/renderStabilizer.test.ts src/features/spatial-template-renderer/renderInput.test.ts
npm.cmd test
npm.cmd run build
```

Expected: all tests and build pass.

- [x] **Step 6: Commit**

```bash
git add app/src/components/CameraStage.tsx app/src/features/spatial-template-renderer/renderInput.ts app/src/features/spatial-template-renderer/renderStabilizer.ts app/src/features/spatial-template-renderer/renderStabilizer.test.ts CODEX_DOC/2026-06-18-video-framework-analysis-progress.md
git commit -m "fix: keep template visible while hands are active"
```

---

## Task 2: Add TemplateState As The Core Domain Boundary

**Files:**
- Create: `app/src/features/template-state/types.ts`
- Create: `app/src/features/template-state/deriveTemplateState.ts`
- Create: `app/src/features/template-state/deriveTemplateState.test.ts`

- [x] **Step 1: Write the failing tests**

Create `deriveTemplateState.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { deriveTemplateState } from './deriveTemplateState';
import type { TemplateState } from './types';

describe('deriveTemplateState', () => {
  it('keeps the previous visible state when hands are active but current mesh is invalid', () => {
    const previous = visibleState('wide-blue-face');

    const next = deriveTemplateState({
      activeHandCount: 2,
      leftAnchor: { x: 0.22, y: 0.55, z: 0 },
      rightAnchor: { x: 0.78, y: 0.48, z: 0 },
      fingertipQuality: 'invalid',
      timestampMs: 2400,
      previous,
    });

    expect(next.mode).toBe('wide-blue-face');
    expect(next.visible).toBe(true);
    expect(next.opacity).toBe(1);
  });

  it('selects thin-edge when hand span is high but projected height is low', () => {
    const next = deriveTemplateState({
      activeHandCount: 2,
      leftAnchor: { x: 0.15, y: 0.52, z: 0 },
      rightAnchor: { x: 0.86, y: 0.54, z: 0 },
      projectedHeight: 0.025,
      fingertipQuality: 'valid',
      timestampMs: 1200,
      previous: null,
    });

    expect(next.mode).toBe('thin-edge');
    expect(next.rotation).toBeCloseTo(Math.atan2(0.02, 0.71), 3);
  });

  it('selects triangle-fold when one hand is near camera and the other is far', () => {
    const next = deriveTemplateState({
      activeHandCount: 2,
      leftAnchor: { x: 0.18, y: 0.55, z: -0.22 },
      rightAnchor: { x: 0.72, y: 0.42, z: 0.08 },
      projectedHeight: 0.22,
      fingertipQuality: 'valid',
      timestampMs: 1400,
      previous: null,
    });

    expect(next.mode).toBe('triangle-fold');
    expect(next.depthTilt).toBeGreaterThan(0.15);
  });
});

function visibleState(mode: TemplateState['mode']): TemplateState {
  return {
    mode,
    visible: true,
    activeHandCount: 2,
    center: { x: 0.5, y: 0.5, z: 0 },
    span: 0.58,
    rotation: 0,
    depthTilt: 0,
    foldAmount: 0.4,
    opacity: 1,
    materialPreset: 'blue-face',
    timestampMs: 1000,
  };
}
```

- [x] **Step 2: Run test to verify RED**

```bash
cd app
npm.cmd test -- src/features/template-state/deriveTemplateState.test.ts
```

Expected: FAIL because files do not exist.

- [x] **Step 3: Add `types.ts`**

```ts
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
```

- [x] **Step 4: Add minimal `deriveTemplateState.ts`**

```ts
import type { DeriveTemplateStateInput, TemplateMaterialPreset, TemplateMode, TemplateState } from './types';

export function deriveTemplateState(input: DeriveTemplateStateInput): TemplateState {
  if (input.activeHandCount > 0 && input.fingertipQuality !== 'valid' && input.previous?.visible) {
    return {
      ...input.previous,
      activeHandCount: input.activeHandCount,
      timestampMs: input.timestampMs,
      opacity: 1,
    };
  }

  if (input.activeHandCount === 0 || !input.leftAnchor) {
    return hiddenState(input.timestampMs);
  }

  if (input.activeHandCount === 1 || !input.rightAnchor) {
    return {
      mode: 'one-hand-wedge',
      visible: true,
      activeHandCount: 1,
      center: input.leftAnchor,
      span: 0.24,
      rotation: 0,
      depthTilt: 0,
      foldAmount: 0.65,
      opacity: 1,
      materialPreset: 'blue-face',
      timestampMs: input.timestampMs,
    };
  }

  const dx = input.rightAnchor.x - input.leftAnchor.x;
  const dy = input.rightAnchor.y - input.leftAnchor.y;
  const span = Math.hypot(dx, dy);
  const depthTilt = Math.abs((input.rightAnchor.z ?? 0) - (input.leftAnchor.z ?? 0));
  const projectedHeight = input.projectedHeight ?? 0.16;
  const mode = chooseMode(span, projectedHeight, depthTilt);

  return {
    mode,
    visible: true,
    activeHandCount: 2,
    center: {
      x: (input.leftAnchor.x + input.rightAnchor.x) / 2,
      y: (input.leftAnchor.y + input.rightAnchor.y) / 2,
      z: ((input.leftAnchor.z ?? 0) + (input.rightAnchor.z ?? 0)) / 2,
    },
    span,
    rotation: Math.atan2(dy, dx),
    depthTilt,
    foldAmount: clamp01(depthTilt * 2.2 + (0.18 - projectedHeight)),
    opacity: 1,
    materialPreset: materialForMode(mode),
    timestampMs: input.timestampMs,
  };
}

function chooseMode(span: number, projectedHeight: number, depthTilt: number): TemplateMode {
  if (projectedHeight < 0.05 && span > 0.45) {
    return 'thin-edge';
  }

  if (depthTilt > 0.15 || projectedHeight > 0.2) {
    return 'triangle-fold';
  }

  return 'wide-blue-face';
}

function materialForMode(mode: TemplateMode): TemplateMaterialPreset {
  if (mode === 'thin-edge') return 'green-cyan';
  if (mode === 'triangle-fold') return 'white-red-pixels';
  return 'blue-face';
}

function hiddenState(timestampMs: number): TemplateState {
  return {
    mode: 'hidden',
    visible: false,
    activeHandCount: 0,
    center: { x: 0.5, y: 0.5, z: 0 },
    span: 0,
    rotation: 0,
    depthTilt: 0,
    foldAmount: 0,
    opacity: 0,
    materialPreset: 'edge-only',
    timestampMs,
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
```

- [x] **Step 5: Verify GREEN**

```bash
cd app
npm.cmd test -- src/features/template-state/deriveTemplateState.test.ts
```

Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add app/src/features/template-state
git commit -m "feat: add stable template state model"
```

---

## Task 3: Build Canonical Reference Meshes From TemplateState

**Files:**
- Create: `app/src/features/spatial-template-model/referenceTemplateMesh.ts`
- Create: `app/src/features/spatial-template-model/referenceTemplateMesh.test.ts`
- Modify: `app/src/features/spatial-template-model/types.ts`

- [x] **Step 1: Write failing tests**

Create `referenceTemplateMesh.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildReferenceTemplateMesh } from './referenceTemplateMesh';
import type { TemplateState } from '../template-state/types';

describe('buildReferenceTemplateMesh', () => {
  it('builds a long thin wide-blue-face strip with explicit edge material', () => {
    const mesh = buildReferenceTemplateMesh(state('wide-blue-face'));

    expect(mesh.mode).toBe('two-hand-template');
    expect(mesh.vertices.length).toBeGreaterThanOrEqual(8);
    expect(mesh.faces.some((face) => face.materialId === 'face-blue')).toBe(true);
    expect(mesh.faces.some((face) => face.materialId === 'edge-white')).toBe(true);
  });

  it('builds a triangle fold with three visible face materials', () => {
    const mesh = buildReferenceTemplateMesh({
      ...state('triangle-fold'),
      foldAmount: 0.9,
      materialPreset: 'white-red-pixels',
    });

    expect(mesh.faces.filter((face) => face.materialId === 'face-card').length).toBeGreaterThan(0);
    expect(mesh.faces.filter((face) => face.materialId === 'face-blue').length).toBeGreaterThan(0);
    expect(mesh.faces.filter((face) => face.materialId === 'edge-white').length).toBeGreaterThan(0);
  });

  it('builds a thin edge without creating a bulky box', () => {
    const mesh = buildReferenceTemplateMesh({
      ...state('thin-edge'),
      span: 0.7,
      foldAmount: 0.2,
      materialPreset: 'green-cyan',
    });

    const zValues = mesh.vertices.map((vertex) => vertex.position.z ?? 0);
    expect(Math.max(...zValues) - Math.min(...zValues)).toBeLessThan(0.08);
  });
});

function state(mode: TemplateState['mode']): TemplateState {
  return {
    mode,
    visible: true,
    activeHandCount: 2,
    center: { x: 0.5, y: 0.5, z: 0 },
    span: 0.58,
    rotation: -0.16,
    depthTilt: 0.12,
    foldAmount: 0.45,
    opacity: 1,
    materialPreset: 'blue-face',
    timestampMs: 1000,
  };
}
```

- [x] **Step 2: Run RED**

```bash
cd app
npm.cmd test -- src/features/spatial-template-model/referenceTemplateMesh.test.ts
```

Expected: FAIL because builder does not exist.

- [x] **Step 3: Extend material ids**

Add material ids in `types.ts`:

```ts
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
```

- [x] **Step 4: Add mesh builder**

Create `referenceTemplateMesh.ts`:

```ts
import type { TemplateState } from '../template-state/types';
import type { SpatialTemplateMesh, SpatialTemplateVertex } from './types';

export function buildReferenceTemplateMesh(state: TemplateState): SpatialTemplateMesh {
  if (!state.visible || state.mode === 'hidden') {
    return { mode: 'hidden', vertices: [], faces: [], opacity: 0, confidence: 0 };
  }

  const width = Math.max(0.18, state.span);
  const height = state.mode === 'thin-edge' ? 0.035 : state.mode === 'triangle-fold' ? 0.34 : 0.18;
  const depth = state.mode === 'thin-edge' ? 0.03 : 0.1 * state.foldAmount;
  const corners = transformLocalQuad(state, width, height, depth);
  const edgeOffset = 4;
  const edgeCorners = transformLocalQuad(state, width * 1.02, height * 1.08, depth + 0.005);
  const vertices = [...corners, ...edgeCorners];

  return {
    mode: state.activeHandCount === 1 ? 'one-hand-template' : 'two-hand-template',
    vertices,
    faces: [
      { indices: [0, 1, 2], materialId: primaryFaceMaterial(state) },
      { indices: [0, 2, 3], materialId: state.mode === 'triangle-fold' ? 'face-blue' : primaryFaceMaterial(state) },
      { indices: [edgeOffset, edgeOffset + 1, edgeOffset + 2], materialId: 'edge-white' },
      { indices: [edgeOffset, edgeOffset + 2, edgeOffset + 3], materialId: 'edge-white' },
    ],
    opacity: state.opacity,
    confidence: 1,
  };
}

function transformLocalQuad(
  state: TemplateState,
  width: number,
  height: number,
  depth: number,
): SpatialTemplateVertex[] {
  const cos = Math.cos(state.rotation);
  const sin = Math.sin(state.rotation);
  const local = [
    { x: -width / 2, y: -height / 2, z: -depth / 2 },
    { x: width / 2, y: -height / 2, z: depth / 2 },
    { x: width / 2, y: height / 2, z: depth / 2 },
    { x: -width / 2, y: height / 2, z: -depth / 2 },
  ];

  return local.map((point) => {
    const x = state.center.x + point.x * cos - point.y * sin;
    const y = state.center.y + point.x * sin + point.y * cos;
    const position = { x, y, z: point.z };
    return { position, samplePoint: { x, y } };
  });
}

function primaryFaceMaterial(state: TemplateState) {
  if (state.materialPreset === 'white-red-pixels') return 'face-card';
  if (state.materialPreset === 'green-cyan') return 'face-green';
  return 'face-blue';
}
```

- [x] **Step 5: Verify**

```bash
cd app
npm.cmd test -- src/features/spatial-template-model/referenceTemplateMesh.test.ts
```

Expected: PASS.

- [x] **Step 6: Commit**

```bash
git add app/src/features/spatial-template-model/types.ts app/src/features/spatial-template-model/referenceTemplateMesh.ts app/src/features/spatial-template-model/referenceTemplateMesh.test.ts
git commit -m "feat: build canonical reference template meshes"
```

---

## Task 4: Add Face Texture Source

**Files:**
- Create: `app/src/features/face-texture/faceTextureSource.ts`
- Create: `app/src/features/face-texture/faceTextureSource.test.ts`

- [x] **Step 1: Write failing tests**

Create `faceTextureSource.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { clampFaceRoi, smoothFaceRoi, fallbackFaceRoi } from './faceTextureSource';

describe('faceTextureSource', () => {
  it('clamps face ROI inside video bounds', () => {
    expect(clampFaceRoi({ x: -0.1, y: 0.2, width: 1.3, height: 0.9 })).toEqual({
      x: 0,
      y: 0.2,
      width: 1,
      height: 0.8,
    });
  });

  it('smooths face ROI to avoid texture jumps', () => {
    const previous = { x: 0.3, y: 0.2, width: 0.28, height: 0.38 };
    const next = { x: 0.5, y: 0.35, width: 0.2, height: 0.3 };

    expect(smoothFaceRoi(previous, next, 0.25)).toEqual({
      x: 0.35,
      y: 0.2375,
      width: 0.26,
      height: 0.36,
    });
  });

  it('uses a portrait-centered fallback when face detection is unavailable', () => {
    expect(fallbackFaceRoi()).toEqual({
      x: 0.34,
      y: 0.12,
      width: 0.32,
      height: 0.42,
    });
  });
});
```

- [x] **Step 2: Run RED**

```bash
cd app
npm.cmd test -- src/features/face-texture/faceTextureSource.test.ts
```

Expected: FAIL because module does not exist.

- [x] **Step 3: Implement ROI helpers**

```ts
export type FaceRoi = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function fallbackFaceRoi(): FaceRoi {
  return { x: 0.34, y: 0.12, width: 0.32, height: 0.42 };
}

export function clampFaceRoi(roi: FaceRoi): FaceRoi {
  const x = clamp01(roi.x);
  const y = clamp01(roi.y);
  return {
    x,
    y,
    width: Math.min(1 - x, Math.max(0, roi.width)),
    height: Math.min(1 - y, Math.max(0, roi.height)),
  };
}

export function smoothFaceRoi(previous: FaceRoi, next: FaceRoi, amount: number): FaceRoi {
  return {
    x: lerp(previous.x, next.x, amount),
    y: lerp(previous.y, next.y, amount),
    width: lerp(previous.width, next.width, amount),
    height: lerp(previous.height, next.height, amount),
  };
}

function lerp(start: number, end: number, amount: number): number {
  return start + (end - start) * amount;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
```

- [x] **Step 4: Verify**

```bash
cd app
npm.cmd test -- src/features/face-texture/faceTextureSource.test.ts
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add app/src/features/face-texture
git commit -m "feat: add face texture roi source"
```

---

## Task 5: Add Reference Shader Source

**Files:**
- Create: `app/src/features/spatial-template-renderer/referenceShaderSource.ts`
- Create: `app/src/features/spatial-template-renderer/referenceShaderSource.test.ts`

- [x] **Step 1: Write failing shader contract tests**

```ts
import { describe, expect, it } from 'vitest';
import { REFERENCE_FRAGMENT_SHADER, REFERENCE_VERTEX_SHADER } from './referenceShaderSource';

describe('reference shader source', () => {
  it('declares the required texture and effect uniforms', () => {
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform sampler2D uSceneTexture');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform sampler2D uFaceTexture');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform float uPixelSize');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform float uGlitchAmount');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('uniform int uMaterialMode');
  });

  it('includes pixelation, palette mapping, and rgb glitch branches', () => {
    expect(REFERENCE_FRAGMENT_SHADER).toContain('pixelateUv');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('paletteMap');
    expect(REFERENCE_FRAGMENT_SHADER).toContain('rgbGlitch');
  });

  it('passes model and video uv varyings from the vertex shader', () => {
    expect(REFERENCE_VERTEX_SHADER).toContain('varying vec2 vVideoUv');
    expect(REFERENCE_VERTEX_SHADER).toContain('varying vec2 vFaceUv');
  });
});
```

- [x] **Step 2: Run RED**

```bash
cd app
npm.cmd test -- src/features/spatial-template-renderer/referenceShaderSource.test.ts
```

Expected: FAIL because shader source does not exist.

- [x] **Step 3: Implement shader source**

Create `referenceShaderSource.ts`:

```ts
export const REFERENCE_VERTEX_SHADER = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vVideoUv;
varying vec2 vFaceUv;
varying vec3 vLocalPosition;

void main() {
  vVideoUv = uv;
  vFaceUv = uv;
  vLocalPosition = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const REFERENCE_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uSceneTexture;
uniform sampler2D uFaceTexture;
uniform float uOpacity;
uniform float uTime;
uniform float uPixelSize;
uniform float uGlitchAmount;
uniform int uMaterialMode;

varying vec2 vVideoUv;
varying vec2 vFaceUv;
varying vec3 vLocalPosition;

vec2 pixelateUv(vec2 uv, float pixelSize) {
  return floor(uv * pixelSize) / pixelSize;
}

vec3 paletteMap(float lumaValue) {
  vec3 yellow = vec3(1.0, 0.88, 0.08);
  vec3 green = vec3(0.22, 1.0, 0.18);
  vec3 cyan = vec3(0.04, 0.9, 1.0);
  return mix(green, mix(cyan, yellow, smoothstep(0.55, 1.0, lumaValue)), smoothstep(0.18, 0.75, lumaValue));
}

vec3 rgbGlitch(sampler2D tex, vec2 uv, float amount) {
  float wave = sin(uv.y * 40.0 + uTime * 0.006) * amount;
  float r = texture2D(tex, uv + vec2(wave, 0.0)).r;
  float g = texture2D(tex, uv).g;
  float b = texture2D(tex, uv - vec2(wave, 0.0)).b;
  return vec3(r, g, b);
}

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

void main() {
  vec3 face = rgbGlitch(uFaceTexture, pixelateUv(vFaceUv, uPixelSize), uGlitchAmount);
  float value = smoothstep(0.2, 0.9, luma(face));
  vec3 color = paletteMap(value);

  if (uMaterialMode == 1) {
    color = mix(vec3(0.02, 0.08, 0.45), color, value);
  } else if (uMaterialMode == 2) {
    color = mix(vec3(1.0, 0.96, 0.86), vec3(0.9, 0.08, 0.1), step(0.62, value));
  } else if (uMaterialMode == 3) {
    color = mix(vec3(0.0, 0.22, 0.12), color, 0.86);
  } else if (uMaterialMode == 4) {
    color = vec3(1.0);
  }

  gl_FragColor = vec4(color, uOpacity);
}
`;
```

- [x] **Step 4: Verify**

```bash
cd app
npm.cmd test -- src/features/spatial-template-renderer/referenceShaderSource.test.ts
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add app/src/features/spatial-template-renderer/referenceShaderSource.ts app/src/features/spatial-template-renderer/referenceShaderSource.test.ts app/src/features/spatial-template-renderer/referenceMaterialModes.ts app/src/features/spatial-template-renderer/referenceMaterialModes.test.ts
git commit -m "feat: add reference effect shader source"
```

---

## Task 6: Integrate TemplateState, Mesh, Face Texture, And Shader Renderer

**Files:**
- Modify: `app/src/components/CameraStage.tsx`
- Modify: `app/src/features/spatial-template-renderer/renderInput.ts`
- Modify: `app/src/features/spatial-template-renderer/SpatialTemplateCanvas.tsx`
- Modify: `app/src/features/spatial-template-renderer/materialSettings.ts`
- Modify: `app/src/features/spatial-template-model/templateMesh.ts`

- [ ] **Step 1: Add integration tests at pure boundaries first**

Extend `renderInput.test.ts` with:

```ts
it('keeps active hand count and template state in render input', () => {
  const input = createSpatialTemplateRenderInput({
    displayHands: [hand('right', 0.8, 0.5), hand('left', 0.2, 0.45)],
    video: video(),
    mirrored: false,
    style,
    timestampMs: 1600,
    activeHandCount: 2,
  });

  expect(input.activeHandCount).toBe(2);
  expect(input.mesh.mode).not.toBe('hidden');
});
```

- [ ] **Step 2: Run targeted tests**

```bash
cd app
npm.cmd test -- src/features/spatial-template-renderer/renderInput.test.ts src/features/template-state/deriveTemplateState.test.ts src/features/spatial-template-model/referenceTemplateMesh.test.ts
```

Expected before integration: the new render input assertion may pass, but production path still uses old lattice mesh.

- [ ] **Step 3: Route mesh generation through `TemplateState`**

Use this production flow in `CameraStage` or `renderInput`:

```ts
const templateState = deriveTemplateState({
  activeHandCount,
  leftAnchor: anchorFrame.left?.point,
  rightAnchor: anchorFrame.right?.point,
  projectedHeight: estimateProjectedHeight(displayHands),
  fingertipQuality: nextRenderInput.mesh.mode === 'hidden' ? 'invalid' : 'valid',
  timestampMs,
  previous: templateStateRef.current,
});

templateStateRef.current = templateState;
const mesh = buildReferenceTemplateMesh(templateState);
```

- [ ] **Step 4: Replace `MeshBasicMaterial` for front faces**

In `SpatialTemplateCanvas.tsx`, create shader materials for `face-blue`, `face-card`, `face-green`, and `edge-white`. Keep a simple white untextured material only for emergency fallback.

- [ ] **Step 5: Verify**

```bash
cd app
npm.cmd test
npm.cmd run build
```

Expected: all tests and build pass, no TypeScript errors.

- [ ] **Step 6: Browser smoke**

Run local preview and verify the page renders before camera start:

```bash
cd app
npm.cmd run build
npm.cmd run preview -- --host 127.0.0.1 --port 4176
```

Expected: no framework error overlay, canvas container mounts.

- [ ] **Step 7: Commit**

```bash
git add app/src/components/CameraStage.tsx app/src/features/spatial-template-renderer app/src/features/spatial-template-model app/src/features/template-state app/src/features/face-texture
git commit -m "feat: integrate reference template renderer"
```

---

## Task 7: Real-Device FFmpeg Validation

**Files:**
- Create: `docs/analysis/f74f885-reference-replication-validation.md`
- Update: `CODEX_DOC/2026-06-18-video-framework-analysis-progress.md`

- [ ] **Step 1: Deploy or run on a camera-enabled device**

Run:

```bash
cd app
npm.cmd test
npm.cmd run build
```

Expected: all tests and build pass before real-device recording.

- [ ] **Step 2: Record validation video**

Record at least 45 seconds:

- 10s no hands.
- 10s one hand active.
- 15s two hands moving left/right and near/far.
- 10s fast hand motion and partial occlusion.

Save the recording exactly as:

```text
测试记录/reference-replication-validation/screen-recording.mp4
```

- [ ] **Step 3: Extract all frames with FFmpeg**

Use a timestamped output directory:

```powershell
$out = "output/reference-replication-validation-20260618-230000"
New-Item -ItemType Directory -Path "$out\test_frames_full","$out\reference_frames_full","$out\sheets" -Force
ffmpeg -hide_banner -loglevel error -stats -i "测试记录\reference-replication-validation\screen-recording.mp4" -vsync 0 -q:v 3 "$out\test_frames_full\test_%04d.jpg"
ffmpeg -hide_banner -loglevel error -stats -i "参考视频.mp4" -vsync 0 -q:v 3 "$out\reference_frames_full\reference_%04d.jpg"
ffmpeg -hide_banner -loglevel error -y -i "测试记录\reference-replication-validation\screen-recording.mp4" -vf "fps=1,scale=280:-1,tile=7x7" -frames:v 1 -q:v 3 "$out\sheets\test_contact_1fps.jpg"
ffmpeg -hide_banner -loglevel error -y -i "参考视频.mp4" -vf "fps=1,scale=280:-1,tile=5x5" -frames:v 1 -q:v 3 "$out\sheets\reference_contact_1fps.jpg"
```

- [ ] **Step 4: Validate against acceptance criteria**

The validation report must explicitly answer:

- Does the effect disappear while hands remain active?
- Do two-hand states produce controlled strip/triangle/thin-edge shapes instead of a bulky box?
- Are white edges visible in every active state?
- Does at least one face clearly use processed face texture?
- Are the palette and RGB glitch visible: yellow/green/cyan high contrast with channel offsets?
- Does scale follow hand distance?
- Does rotation follow hand line angle?
- Does the effect remain stable under fast hand movement?

- [ ] **Step 5: Commit validation report**

```bash
git add docs/analysis/f74f885-reference-replication-validation.md CODEX_DOC/2026-06-18-video-framework-analysis-progress.md
git commit -m "docs: validate reference effect replication"
```

---

## Final Verification Checklist

- [ ] `npm.cmd test` passes.
- [ ] `npm.cmd run build` passes.
- [ ] `git diff --check` has no whitespace errors.
- [ ] Browser smoke has no shader compile errors.
- [ ] Real-device FFmpeg contact sheets show no active-hand disappearance.
- [ ] Real-device video shows controlled template states, not raw fingertip boxes.
- [ ] Face-derived shader texture is visible and high contrast.
- [ ] Documentation and progress files are updated.

## Known Tradeoffs

- "Perfect" cannot be proven algorithmically from the reference video alone; the practical target is perceptual match under repeated frame comparison.
- A first shader pass can use fallback center face ROI before adding full FaceLandmarker if face tracking causes too much latency.
- Full hand/person occlusion should remain out of scope unless the template obviously needs to pass behind fingers or palms. Edge sharpness, template state, and face shader will provide the largest visual improvement first.
