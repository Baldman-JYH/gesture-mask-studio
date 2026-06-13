# Spatial Template MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current primary visual effect with a tested hand-anchored 3D spatial template MVP that supports one-hand wedge and two-hand ribbon geometry.

**Architecture:** Add a new ADR-0002 runtime path instead of extending the flat `light-sheet-renderer` domain model. `gesture-anchor-frame` converts display-space landmarks into stable anchors, `spatial-template-model` builds multi-face meshes, and `spatial-template-renderer` renders those meshes with Three.js and live video texture sampling.

**Tech Stack:** React 19, TypeScript, Vitest, Three.js, MediaPipe hand landmarks, Vite static deployment.

---

## File Structure

- Create `app/src/features/gesture-anchor-frame/anchorFrame.ts`: derive one-hand/two-hand anchor frames from display-space landmarks.
- Create `app/src/features/gesture-anchor-frame/anchorFrame.test.ts`: verify confidence filtering, one-hand anchors, two-hand sorting, openness, rotation, and depth preservation.
- Create `app/src/features/spatial-template-model/types.ts`: define spatial template mesh, vertices, faces, material ids, and render modes.
- Create `app/src/features/spatial-template-model/templateMesh.ts`: build one-hand triangular prism and two-hand ribbon prism meshes.
- Create `app/src/features/spatial-template-model/templateMesh.test.ts`: verify hidden mesh, one-hand wedge, two-hand ribbon, face/material ordering, and normalized bounds.
- Create `app/src/features/spatial-template-renderer/rendererCore.ts`: convert spatial meshes to Three.js buffer positions, uvs, indices, and material groups.
- Create `app/src/features/spatial-template-renderer/rendererCore.test.ts`: verify buffer lengths, world coordinate conversion, video UV mapping, and group assignment.
- Create `app/src/features/spatial-template-renderer/SpatialTemplateCanvas.tsx`: Three.js renderer for the spatial template mesh.
- Modify `app/src/components/CameraStage.tsx`: derive anchor frame, build spatial mesh, and render `SpatialTemplateCanvas`.
- Modify `app/src/shared/runtime/types.ts`: add `SpatialTemplateRenderInput` only if the renderer input must be shared outside the feature module.
- Modify `CODEX_DOC/progress.md` and `CODEX_DOC/progress.zh-CN.md`: record each completed phase.

---

### Task 1: Gesture Anchor Frame

**Files:**
- Create: `app/src/features/gesture-anchor-frame/anchorFrame.ts`
- Test: `app/src/features/gesture-anchor-frame/anchorFrame.test.ts`

- [x] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import type { TrackedHand } from '../../shared/runtime/types';
import { deriveGestureAnchorFrame } from './anchorFrame';

function hand(id: string, x: number, y: number, confidence = 0.9): TrackedHand {
  return {
    id,
    handedness: 'unknown',
    confidence,
    landmarks: [
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x: x - 0.04, y, z: -0.03 },
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x, y, z: -0.02 },
      { x: x + 0.04, y: y + 0.02, z: -0.01 },
    ],
  };
}

describe('deriveGestureAnchorFrame', () => {
  it('returns hidden when no confident hand is available', () => {
    expect(deriveGestureAnchorFrame([hand('low', 0.5, 0.5, 0.1)]).mode).toBe('hidden');
  });

  it('derives an explicit one-hand anchor frame from thumb and index tips', () => {
    const frame = deriveGestureAnchorFrame([hand('single', 0.4, 0.5)]);

    expect(frame.mode).toBe('one-hand');
    expect(frame.primary?.point.x).toBeCloseTo(0.4, 3);
    expect(frame.primary?.point.y).toBeCloseTo(0.51, 3);
    expect(frame.span).toBeGreaterThan(0.07);
    expect(frame.openness).toBeGreaterThan(0);
  });

  it('sorts two-hand anchors left-to-right in display space', () => {
    const frame = deriveGestureAnchorFrame([hand('right', 0.8, 0.5), hand('left', 0.2, 0.45)]);

    expect(frame.mode).toBe('two-hand');
    expect(frame.left?.point.x).toBeLessThan(frame.right?.point.x ?? 0);
    expect(frame.rotation).toBeCloseTo(Math.atan2(0.05, 0.6), 2);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/gesture-anchor-frame/anchorFrame.test.ts`

Expected: FAIL because `./anchorFrame` does not exist.

- [x] **Step 3: Implement minimal anchor frame code**

Create `deriveGestureAnchorFrame(hands)` that filters `confidence > 0.2`, uses landmark 4 and 8 for thumb/index tips, clamps x/y to `0..1`, returns `hidden`, `one-hand`, or `two-hand`, and computes `span`, `openness`, `rotation`, and optional z.

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/gesture-anchor-frame/anchorFrame.test.ts`

Expected: PASS.

---

### Task 2: Spatial Template Mesh Model

**Files:**
- Create: `app/src/features/spatial-template-model/types.ts`
- Create: `app/src/features/spatial-template-model/templateMesh.ts`
- Test: `app/src/features/spatial-template-model/templateMesh.test.ts`

- [x] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import type { GestureAnchorFrame } from '../gesture-anchor-frame/anchorFrame';
import { buildSpatialTemplateMesh } from './templateMesh';

const hiddenFrame: GestureAnchorFrame = {
  mode: 'hidden',
  confidence: 0,
  span: 0,
  openness: 0,
  rotation: 0,
};

const oneHandFrame: GestureAnchorFrame = {
  mode: 'one-hand',
  confidence: 0.9,
  span: 0.12,
  openness: 0.6,
  rotation: 0,
  primary: {
    id: 'single',
    point: { x: 0.5, y: 0.5, z: -0.02 },
    direction: { x: 1, y: 0 },
  },
};

const twoHandFrame: GestureAnchorFrame = {
  mode: 'two-hand',
  confidence: 0.85,
  span: 0.5,
  openness: 0.7,
  rotation: 0,
  left: {
    id: 'left',
    point: { x: 0.25, y: 0.5, z: -0.02 },
    direction: { x: 1, y: 0 },
  },
  right: {
    id: 'right',
    point: { x: 0.75, y: 0.5, z: -0.02 },
    direction: { x: 1, y: 0 },
  },
};

describe('buildSpatialTemplateMesh', () => {
  it('returns an empty hidden mesh for hidden anchor frames', () => {
    const mesh = buildSpatialTemplateMesh(hiddenFrame);

    expect(mesh.mode).toBe('hidden');
    expect(mesh.vertices).toHaveLength(0);
    expect(mesh.faces).toHaveLength(0);
  });

  it('builds a one-hand triangular prism with multiple material faces', () => {
    const mesh = buildSpatialTemplateMesh(oneHandFrame);

    expect(mesh.mode).toBe('one-hand-wedge');
    expect(mesh.vertices).toHaveLength(6);
    expect(mesh.faces.some((face) => face.materialId === 'scene')).toBe(true);
    expect(mesh.faces.some((face) => face.materialId === 'edge')).toBe(true);
  });

  it('builds a two-hand ribbon prism with front, back, and edge faces', () => {
    const mesh = buildSpatialTemplateMesh(twoHandFrame);

    expect(mesh.mode).toBe('two-hand-ribbon');
    expect(mesh.vertices).toHaveLength(8);
    expect(mesh.faces).toHaveLength(6);
    expect(mesh.faces[0].materialId).toBe('scene');
    expect(mesh.faces[1].materialId).toBe('accent');
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/spatial-template-model/templateMesh.test.ts`

Expected: FAIL because `templateMesh` does not exist.

- [x] **Step 3: Implement minimal mesh model**

Implement `buildSpatialTemplateMesh(frame)` with:
- `hidden` -> no vertices/faces;
- `one-hand` -> triangular prism: 6 vertices, front/back triangles, three edge faces;
- `two-hand` -> ribbon prism: 8 vertices, front/back quads, four edge quads;
- each vertex stores display-space position and `samplePoint` for video UV projection.

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/spatial-template-model/templateMesh.test.ts`

Expected: PASS.

---

### Task 3: Spatial Renderer Core

**Files:**
- Create: `app/src/features/spatial-template-renderer/rendererCore.ts`
- Test: `app/src/features/spatial-template-renderer/rendererCore.test.ts`

- [x] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import type { SpatialTemplateMesh } from '../spatial-template-model/types';
import { spatialTemplateToBufferData } from './rendererCore';

const mesh: SpatialTemplateMesh = {
  mode: 'one-hand-wedge',
  opacity: 0.8,
  confidence: 0.9,
  vertices: [
    { position: { x: 0.5, y: 0.4, z: 0.04 }, samplePoint: { x: 0.5, y: 0.4 } },
    { position: { x: 0.4, y: 0.6, z: 0.04 }, samplePoint: { x: 0.4, y: 0.6 } },
    { position: { x: 0.6, y: 0.6, z: 0.04 }, samplePoint: { x: 0.6, y: 0.6 } },
  ],
  faces: [{ indices: [0, 1, 2], materialId: 'scene' }],
};

describe('spatialTemplateToBufferData', () => {
  it('converts display-space vertices into world positions and video uvs', () => {
    const data = spatialTemplateToBufferData(mesh, {
      aspect: 2,
      videoMapping: { mirrored: false },
    });

    expect(Array.from(data.positions.slice(0, 3))).toEqual([0, 0.2, 0.04]);
    expect(Array.from(data.uvs.slice(0, 2))).toEqual([0.5, 0.6]);
    expect(Array.from(data.indices)).toEqual([0, 1, 2]);
    expect(data.groups[0]).toEqual({ start: 0, count: 3, materialIndex: 0 });
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- src/features/spatial-template-renderer/rendererCore.test.ts`

Expected: FAIL because `rendererCore` does not exist.

- [x] **Step 3: Implement minimal renderer core**

Implement `spatialTemplateToBufferData(mesh, options)` to output `positions`, `uvs`, `indices`, and `groups`. Map display points with `x = (displayX - 0.5) * 2 * aspect`, `y = (0.5 - displayY) * 2`, and pass `samplePoint` through `toVideoUv`.

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- src/features/spatial-template-renderer/rendererCore.test.ts`

Expected: PASS.

---

### Task 4: React Three.js Integration

**Files:**
- Create: `app/src/features/spatial-template-renderer/SpatialTemplateCanvas.tsx`
- Modify: `app/src/components/CameraStage.tsx`

- [x] **Step 1: Add renderer component**

Create a `SpatialTemplateCanvas` component that mirrors the current renderer lifecycle: create `WebGLRenderer`, `Scene`, `PerspectiveCamera`, `BufferGeometry`, a material array, and a mesh. Use `spatialTemplateToBufferData` during input updates.

- [x] **Step 2: Connect the component to CameraStage**

In `CameraStage`, derive `anchorFrame = deriveGestureAnchorFrame(displayHands)`, build `mesh = buildSpatialTemplateMesh(anchorFrame)`, and pass it to `SpatialTemplateCanvas` with the current video, mirror state, viewport, style preset, and timestamp.

- [x] **Step 3: Run app-level tests**

Run: `npm test -- src/App.test.tsx src/components/TopStatusBar.test.tsx`

Expected: PASS.

---

### Task 5: Verification And Documentation

**Files:**
- Modify: `CODEX_DOC/progress.md`
- Modify: `CODEX_DOC/progress.zh-CN.md`
- Optionally modify: `docs/architecture/adr-0002-hand-anchored-3d-template-model.md`
- Optionally modify: `docs/architecture/adr-0002-hand-anchored-3d-template-model.zh-CN.md`

- [x] **Step 1: Run target tests**

Run:

```bash
npm test -- src/features/gesture-anchor-frame/anchorFrame.test.ts src/features/spatial-template-model/templateMesh.test.ts src/features/spatial-template-renderer/rendererCore.test.ts
```

Expected: PASS.

- [x] **Step 2: Run full verification**

Run:

```bash
npm test
npm run build
git diff --check
```

Expected: tests and build pass; `git diff --check` has no whitespace errors except acceptable Windows line-ending warnings.

- [x] **Step 3: Update progress docs**

Record the implementation result, red/green evidence, and real-device verification plan in both `CODEX_DOC/progress.md` and `CODEX_DOC/progress.zh-CN.md`.

---

## Self-Review

- Spec coverage: the plan implements the next ADR-0002 milestone: anchor frame, spatial mesh, multi-face renderer core, and React integration.
- Placeholder scan: no task uses TBD/TODO/fill-in instructions; each code-bearing task includes concrete test code and commands.
- Type consistency: `GestureAnchorFrame`, `SpatialTemplateMesh`, `SpatialTemplateFace`, and `spatialTemplateToBufferData` are introduced before they are used.
