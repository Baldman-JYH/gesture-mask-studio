# Realtime Light Sheet MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable browser MVP for the gesture-driven live-sampling light sheet experience.

**Architecture:** The app is a React + Vite + TypeScript static frontend under `app/`. Runtime boundaries follow `docs/architecture/runtime-contracts.md`: camera, hand tracking, gesture engine, scene sampling, light-sheet renderer, and light-sheet styles stay isolated and communicate through explicit types.

**Tech Stack:** React 19, Vite, TypeScript, Vitest, Testing Library, Three.js, MediaPipe Tasks Vision, lucide-react.

---

## File Structure

- Create: `app/package.json` - app scripts and dependencies.
- Create: `app/index.html` - Vite entry HTML.
- Create: `app/tsconfig.json`, `app/tsconfig.node.json`, `app/vite.config.ts`, `app/vitest.setup.ts` - TypeScript/Vite/Vitest config.
- Create: `app/src/main.tsx`, `app/src/App.tsx`, `app/src/App.css`, `app/src/styles/tokens.css` - React shell and visual system.
- Create: `app/src/shared/runtime/types.ts` - canonical runtime TypeScript contracts.
- Create: `app/src/features/light-sheet-styles/presets.ts` and tests.
- Create: `app/src/features/gesture-engine/geometry.ts`, `gestureState.ts`, and tests.
- Create: `app/src/features/camera/cameraController.ts` and tests.
- Create: `app/src/features/hand-tracking/handTracker.ts` - MediaPipe adapter.
- Create: `app/src/features/scene-sampling/videoTexture.ts`, `screenSpaceSampling.ts`, and tests.
- Create: `app/src/features/light-sheet-renderer/LightSheetCanvas.tsx`, `shaderSource.ts`, `rendererCore.ts`, and tests for pure helpers.
- Create: `app/src/components/CameraStage.tsx`, `TopStatusBar.tsx`, `ControlDock.tsx`, `PermissionOverlay.tsx`.
- Create: `app/src/assets/textures/*.svg` and `app/src/assets/textures/*.png` or CSS-generated canvas texture helpers for style previews.
- Create: `.github/workflows/pages.yml` - GitHub Pages deployment workflow.

---

### Task 1: App Scaffold And Tooling

**Files:**
- Create: `app/package.json`
- Create: `app/index.html`
- Create: `app/tsconfig.json`
- Create: `app/tsconfig.node.json`
- Create: `app/vite.config.ts`
- Create: `app/vitest.setup.ts`
- Create: `app/src/main.tsx`
- Create: `app/src/App.tsx`
- Create: `app/src/App.css`
- Create: `app/src/styles/tokens.css`

- [ ] **Step 1: Create package and config files**

`app/package.json` must include:

```json
{
  "name": "gesture-mask-studio-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite --host 127.0.0.1",
    "build": "tsc -b && vite build",
    "preview": "vite preview --host 127.0.0.1",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "tsc -b --pretty false"
  },
  "dependencies": {
    "@mediapipe/tasks-vision": "^0.10.22",
    "@vitejs/plugin-react": "^5.0.0",
    "lucide-react": "^0.468.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "three": "^0.172.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.1.0",
    "@types/react": "^19.0.1",
    "@types/react-dom": "^19.0.1",
    "@types/three": "^0.172.0",
    "typescript": "^5.7.2",
    "vite": "^6.0.5",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`

Expected: `package-lock.json` is created and install exits 0.

- [ ] **Step 3: Add minimal React shell**

`App.tsx` initially renders a full-screen dark stage with product name and a disabled Start Camera button. It is scaffold only; production runtime behavior comes in later tasks.

- [ ] **Step 4: Verify scaffold**

Run: `npm test`

Expected: Vitest exits 0 with no behavior tests yet.

Run: `npm run build`

Expected: TypeScript and Vite build exit 0.

- [ ] **Step 5: Commit**

```bash
git add app package-lock.json
git commit -m "feat: scaffold realtime light sheet app"
```

---

### Task 2: Runtime Contracts And Style Presets

**Files:**
- Create: `app/src/shared/runtime/types.ts`
- Create: `app/src/features/light-sheet-styles/presets.ts`
- Create: `app/src/features/light-sheet-styles/presets.test.ts`

- [ ] **Step 1: Write failing preset tests**

`presets.test.ts` must assert:

```ts
import { describe, expect, it } from 'vitest';
import { getLightSheetStylePreset, LIGHT_SHEET_STYLE_PRESETS } from './presets';

describe('light sheet style presets', () => {
  it('defines the required blueprint, cards, and organic presets', () => {
    expect(LIGHT_SHEET_STYLE_PRESETS.map((preset) => preset.id)).toEqual([
      'blueprint',
      'cards',
      'organic',
    ]);
  });

  it('keeps live scene sampling enabled for every preset', () => {
    expect(LIGHT_SHEET_STYLE_PRESETS.every((preset) => preset.sceneSample.enabled)).toBe(true);
  });

  it('falls back to blueprint for an unknown preset id', () => {
    expect(getLightSheetStylePreset('missing').id).toBe('blueprint');
  });
});
```

- [ ] **Step 2: Run test to verify RED**

Run: `npm test -- src/features/light-sheet-styles/presets.test.ts`

Expected: FAIL because `presets.ts` does not exist.

- [ ] **Step 3: Implement runtime contracts and presets**

Create `types.ts` with `NormalizedPoint`, `TrackedHand`, `LightSheetGeometry`, `LightSheetGestureState`, `SceneSamplingInput`, `LightSheetRenderInput`, and `LightSheetStylePreset` from `docs/architecture/runtime-contracts.md`.

Create `presets.ts` with exactly three initial presets: `blueprint`, `cards`, `organic`.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/features/light-sheet-styles/presets.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/shared/runtime/types.ts app/src/features/light-sheet-styles
git commit -m "feat: add light sheet runtime contracts"
```

---

### Task 3: Gesture Engine Geometry

**Files:**
- Create: `app/src/features/gesture-engine/geometry.ts`
- Create: `app/src/features/gesture-engine/geometry.test.ts`
- Create: `app/src/features/gesture-engine/gestureState.ts`
- Create: `app/src/features/gesture-engine/gestureState.test.ts`

- [ ] **Step 1: Write failing geometry tests**

Tests must assert:

```ts
import { describe, expect, it } from 'vitest';
import { buildTwoHandLightSheetGeometry } from './geometry';

describe('buildTwoHandLightSheetGeometry', () => {
  it('builds a four-vertex light sheet between two anchors', () => {
    const geometry = buildTwoHandLightSheetGeometry({
      left: { x: 0.25, y: 0.5 },
      right: { x: 0.75, y: 0.5 },
      openness: 0.5,
      confidence: 0.9,
    });

    expect(geometry.mode).toBe('two-hand-sheet');
    expect(geometry.vertices).toHaveLength(4);
    expect(geometry.opacity).toBeGreaterThan(0.7);
  });

  it('keeps vertices inside normalized screen bounds', () => {
    const geometry = buildTwoHandLightSheetGeometry({
      left: { x: 0.02, y: 0.05 },
      right: { x: 0.98, y: 0.95 },
      openness: 1,
      confidence: 1,
    });

    for (const vertex of geometry.vertices) {
      expect(vertex.x).toBeGreaterThanOrEqual(0);
      expect(vertex.x).toBeLessThanOrEqual(1);
      expect(vertex.y).toBeGreaterThanOrEqual(0);
      expect(vertex.y).toBeLessThanOrEqual(1);
    }
  });
});
```

- [ ] **Step 2: Run geometry RED**

Run: `npm test -- src/features/gesture-engine/geometry.test.ts`

Expected: FAIL because geometry module does not exist.

- [ ] **Step 3: Implement geometry**

Implement pure functions:

```ts
buildTwoHandLightSheetGeometry(input): LightSheetGeometry
buildOneHandPreviewGeometry(input): LightSheetGeometry
clampNormalizedPoint(point): NormalizedPoint
```

- [ ] **Step 4: Verify geometry GREEN**

Run: `npm test -- src/features/gesture-engine/geometry.test.ts`

Expected: PASS.

- [ ] **Step 5: Write and run gesture state tests**

Tests must cover:

- two hands -> `two-hand-sheet`
- one hand -> `one-hand-preview`
- no hands with no prior state -> `hidden`
- unknown style id -> fallback to `blueprint`

Run: `npm test -- src/features/gesture-engine/gestureState.test.ts`

Expected RED, then implement `deriveLightSheetGestureState`, then GREEN.

- [ ] **Step 6: Commit**

```bash
git add app/src/features/gesture-engine
git commit -m "feat: add gesture engine geometry"
```

---

### Task 4: Camera, Tracking Adapter, Scene Sampling, And Renderer Core

**Files:**
- Create: `app/src/features/camera/cameraController.ts`
- Create: `app/src/features/camera/cameraController.test.ts`
- Create: `app/src/features/hand-tracking/handTracker.ts`
- Create: `app/src/features/scene-sampling/screenSpaceSampling.ts`
- Create: `app/src/features/scene-sampling/screenSpaceSampling.test.ts`
- Create: `app/src/features/scene-sampling/videoTexture.ts`
- Create: `app/src/features/light-sheet-renderer/shaderSource.ts`
- Create: `app/src/features/light-sheet-renderer/rendererCore.ts`
- Create: `app/src/features/light-sheet-renderer/rendererCore.test.ts`
- Create: `app/src/features/light-sheet-renderer/LightSheetCanvas.tsx`

- [ ] **Step 1: Write failing camera tests**

Test state mapping with injected `getUserMedia`:

```ts
it('returns denied state when camera permission is denied', async () => {
  const controller = createCameraController({
    getUserMedia: () => Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })),
  });

  const result = await controller.start();

  expect(result.state).toBe('denied');
});
```

- [ ] **Step 2: RED/GREEN camera**

Run failing test, implement `createCameraController`, run passing test.

- [ ] **Step 3: Write failing scene sampling tests**

Tests must assert mirrored and unmirrored UV mapping:

```ts
expect(toVideoUv({ x: 0.25, y: 0.75 }, false)).toEqual({ u: 0.25, v: 0.75 });
expect(toVideoUv({ x: 0.25, y: 0.75 }, true)).toEqual({ u: 0.75, v: 0.75 });
```

- [ ] **Step 4: RED/GREEN scene sampling**

Run failing test, implement `toVideoUv`, run passing test.

- [ ] **Step 5: Write renderer core tests**

Tests must assert `geometryToPositions` converts normalized vertices to clip-space positions and preserves vertex order.

- [ ] **Step 6: RED/GREEN renderer core**

Run failing test, implement `geometryToPositions`, run passing test.

- [ ] **Step 7: Implement MediaPipe adapter and React canvas**

`handTracker.ts` wraps MediaPipe but does not leak MediaPipe types outside the module.

`LightSheetCanvas.tsx` owns Three.js setup and accepts `LightSheetRenderInput`.

- [ ] **Step 8: Verify**

Run: `npm test`

Expected: all tests PASS.

Run: `npm run build`

Expected: build PASS.

- [ ] **Step 9: Commit**

```bash
git add app/src/features/camera app/src/features/hand-tracking app/src/features/scene-sampling app/src/features/light-sheet-renderer
git commit -m "feat: add realtime sampling renderer core"
```

---

### Task 5: Camera Stage UI, GitHub Pages, And Verification

**Files:**
- Modify: `app/src/App.tsx`
- Modify: `app/src/App.css`
- Create: `app/src/components/CameraStage.tsx`
- Create: `app/src/components/TopStatusBar.tsx`
- Create: `app/src/components/ControlDock.tsx`
- Create: `app/src/components/PermissionOverlay.tsx`
- Create: `app/src/assets/textures/blueprint.svg`
- Create: `app/src/assets/textures/cards.svg`
- Create: `app/src/assets/textures/organic.svg`
- Create: `.github/workflows/pages.yml`
- Modify: `README.md`
- Modify: `CODEX_DOC/progress.md`

- [ ] **Step 1: Write UI behavior tests**

Tests must assert:

- product name renders,
- preset buttons render,
- clicking Cards changes selected preset,
- Mirror button toggles pressed state.

- [ ] **Step 2: RED/GREEN UI tests**

Run failing UI tests, implement components, run passing tests.

- [ ] **Step 3: Implement visual system**

Implement the `prototype-01-immersive-stage.png` direction:

- full-bleed camera stage,
- dark top status bar,
- compact bottom dock,
- texture selector with Blueprint/Cards/Organic,
- icon buttons using lucide-react,
- no marketing hero, no explanatory cards.

- [ ] **Step 4: Add GitHub Pages workflow**

Create `.github/workflows/pages.yml` that builds `app` and deploys `app/dist`.

- [ ] **Step 5: Verify all checks**

Run:

```bash
cd app
npm test
npm run build
```

Expected: both PASS.

- [ ] **Step 6: Browser verification**

Start: `npm run dev -- --port 5173`

Open Browser/IAB to `http://127.0.0.1:5173/`.

Verify:

- first viewport matches the accepted concept structure,
- controls are visible and not overlapping,
- preset buttons change style state,
- camera permission flow is reachable,
- app does not crash when camera is unavailable.

- [ ] **Step 7: Visual evidence**

Capture a screenshot and compare it with `assets/design/prototype-01-immersive-stage.png` using `view_image`.

- [ ] **Step 8: Commit**

```bash
git add app .github README.md CODEX_DOC/progress.md
git commit -m "feat: implement realtime light sheet mvp"
```

---

## Self-Review

- Spec coverage: tasks cover static deployment, camera, hand tracking adapter, realtime scene sampling, light-sheet renderer, style presets, UI controls, tests, and GitHub Pages.
- Red-flag scan: all implementation steps contain concrete file paths, commands, and expected outcomes.
- Type consistency: `LightSheet`, `SceneSampling`, `GestureEngine`, and `LightSheetStylePreset` match `runtime-contracts.md`.
