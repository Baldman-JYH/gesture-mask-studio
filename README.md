# Gesture Mask Studio

Gesture Mask Studio is a planned one-page browser experience for real-time webcam gesture mask effects.

The target interaction is based on the local reference video `视频采集蒙版效果.mp4`: users open a URL, grant camera permission, and use hand gestures to stretch and reshape a translucent textured mask in the live camera view.

## Current Status

This repository currently contains the analysis and planning phase:

- Video frame extraction evidence.
- Visual effect analysis.
- Product requirements and business logic.
- Technical architecture.
- Runtime contracts and architecture quality gate.
- GitHub Pages deployment evaluation.

Implementation is intentionally deferred until the visual prototype direction is confirmed.

## Planned Stack

- React + Vite + TypeScript
- MediaPipe Tasks Vision HandLandmarker
- Three.js/WebGL
- GitHub Pages

## Key Docs

- `docs/analysis/video-effect-analysis.md`
- `docs/product/requirements-and-business-logic.md`
- `docs/product/prototype-directions.md`
- `docs/architecture/technical-architecture.md`
- `docs/architecture/adr-0001-realtime-scene-sampling-light-sheet.md`
- `docs/architecture/runtime-contracts.md`
- `docs/architecture/architecture-quality-gate.md`
- `docs/architecture/brooks-debt-architecture-review.md`
- `docs/deployment/github-pages-evaluation.md`
- `CODEX_DOC/progress.md`
