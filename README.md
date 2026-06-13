# Gesture Mask Studio

Gesture Mask Studio is a one-page browser prototype for a gesture-driven live-sampling light sheet effect. Users open the page, grant camera access, and use hand landmarks to shape a translucent WebGL sheet that samples the live camera scene behind it.

The implementation follows the reference-video analysis in `docs/analysis/video-effect-analysis.md`. The effect is not a static image overlay and not face-only rendering; the sheet samples the live camera frame in real time through geometry driven by hand tracking.

Chinese version: [README.zh-CN.md](README.zh-CN.md)

## Run Locally

```bash
cd app
npm install
npm run dev
```

Vite serves the app at:

```text
http://127.0.0.1:5173/gesture-mask-studio/
```

The camera requires a secure context. `localhost` and `127.0.0.1` work for development; GitHub Pages works for deployment because it serves HTTPS.

## Verify

```bash
cd app
npm test
npm run build
```

Current verification covers:

- runtime contracts and style presets,
- gesture-state geometry,
- camera permission state mapping,
- mirrored/unmirrored scene sampling,
- renderer geometry conversion,
- automatic gesture style status and mirror controls,
- production build with local MediaPipe wasm assets.

## Architecture

The app is intentionally split by runtime boundary:

- `camera`: permission and stream lifecycle.
- `hand-tracking`: MediaPipe adapter; emits canonical `TrackedHand` objects only.
- `gesture-engine`: pure hand-to-geometry state derivation.
- `coordinate-space`: camera/display/video UV coordinate conversion.
- `scene-sampling`: normalized screen/video UV mapping.
- `light-sheet-renderer`: Three.js/WebGL video-texture renderer.
- `light-sheet-styles`: extensible style presets.

New visual styles should be added as `LightSheetStylePreset` entries first. Tracking, geometry, and renderer internals should not be rewritten for ordinary style additions.
The default user flow is gesture-driven: the app shows the active `Auto` style and does not require manual Blueprint/Cards/Organic tab selection.

## Deployment

GitHub Pages deployment is configured in `.github/workflows/pages.yml`.

The workflow:

1. installs dependencies in `app/`,
2. runs `npm test`,
3. runs `npm run build`,
4. deploys `app/dist`.

MediaPipe wasm files are copied from `node_modules/@mediapipe/tasks-vision/wasm` into `dist/mediapipe/wasm` during the Vite build, so the deployed page does not depend on a third-party wasm CDN.

## Key Docs

- `docs/analysis/video-effect-analysis.md`
- `docs/analysis/video-effect-analysis.zh-CN.md`
- `docs/analysis/cad0446-real-device-video-comparison.md`
- `docs/analysis/cad0446-real-device-video-comparison.zh-CN.md`
- `docs/analysis/e79f74f-real-device-vertical-comparison.md`
- `docs/analysis/e79f74f-real-device-vertical-comparison.zh-CN.md`
- `docs/analysis/c9076f2-real-device-reference-comparison.md`
- `docs/analysis/c9076f2-real-device-reference-comparison.zh-CN.md`
- `docs/product/requirements-and-business-logic.md`
- `docs/product/requirements-and-business-logic.zh-CN.md`
- `docs/product/prototype-directions.md`
- `docs/product/prototype-directions.zh-CN.md`
- `docs/architecture/technical-architecture.md`
- `docs/architecture/technical-architecture.zh-CN.md`
- `docs/architecture/adr-0001-realtime-scene-sampling-light-sheet.md`
- `docs/architecture/adr-0001-realtime-scene-sampling-light-sheet.zh-CN.md`
- `docs/architecture/adr-0002-hand-anchored-3d-template-model.md`
- `docs/architecture/adr-0002-hand-anchored-3d-template-model.zh-CN.md`
- `docs/architecture/runtime-contracts.md`
- `docs/architecture/runtime-contracts.zh-CN.md`
- `docs/architecture/architecture-quality-gate.md`
- `docs/architecture/architecture-quality-gate.zh-CN.md`
- `docs/architecture/brooks-debt-architecture-review.md`
- `docs/architecture/brooks-debt-architecture-review.zh-CN.md`
- `docs/deployment/github-pages-evaluation.md`
- `docs/deployment/github-pages-evaluation.zh-CN.md`
- `docs/superpowers/plans/2026-06-13-realtime-light-sheet-mvp.md`
- `docs/superpowers/plans/2026-06-13-realtime-light-sheet-mvp.zh-CN.md`
- `docs/verification/verification-plan.md`
- `docs/verification/verification-plan.zh-CN.md`
- `docs/documentation-bilingual-policy.md`
- `docs/documentation-bilingual-policy.zh-CN.md`
- `CODEX_DOC/progress.md`
- `CODEX_DOC/progress.zh-CN.md`
