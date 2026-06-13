# e79f74f Real-Device Vertical Sampling Analysis

Chinese version: [e79f74f-real-device-vertical-comparison.zh-CN.md](e79f74f-real-device-vertical-comparison.zh-CN.md)

## Scope

This analysis compares the real-device validation recording for commit `e79f74f257c80db9ae39c2b0d3e0b47425a31609` with the expected reference-video behavior.

Inputs:

- Real-device recording: `测试记录/基于提交 e79f74f257c80db9ae39c2b0d3e0b47425a31609测试/屏幕录制 2026-06-13 170040.mp4`
- Console screenshot: `测试记录/基于提交 e79f74f257c80db9ae39c2b0d3e0b47425a31609测试/image.png`
- Reference behavior: `docs/analysis/video-effect-analysis.md`
- Derived evidence: `assets/analysis/e79f74f-real-device-vertical-comparison/`

FFmpeg extraction produced:

- 179 continuous 1fps frames from the real-device recording,
- one 1fps contact sheet,
- three 4fps segment contact sheets for 20s-40s, 60s-85s, and 120s-145s.

## Findings

The console screenshot no longer shows the earlier WebGL shader compile failure. MediaPipe starts successfully, emits only its known runtime warnings, and closes cleanly when the camera stops.

The left/right movement correction from the previous fix is visible in the recording. The remaining defect is vertical inversion of the camera content rendered inside the light sheet. The sheet's screen-space geometry is not the failing layer; the sampled video texture content is upside down relative to the visible camera frame.

The current runtime still renders a flat screen-space light sheet. It does not yet implement the reference video's hand-anchored 3D template model, fingertip-anchored depth movement, multi-face mesh, or folding/rotation behavior described in ADR-0002.

## Root Cause

The project uses three coordinate spaces:

- display-space: normalized screen coordinates where `y = 0` is the top of the visible camera frame and `y = 1` is the bottom;
- clip-space: WebGL vertex coordinates where `+1` is top and `-1` is bottom;
- video-uv-space: texture coordinates used by Three.js video sampling.

The geometry conversion is correct:

```ts
clipY = 1 - displayY * 2;
```

The bug was in `scene-sampling` video UV conversion. It mapped display-space `y` directly to `v`, which samples the opposite vertical side of the Three.js `VideoTexture`:

```ts
v = y; // wrong for the current VideoTexture path
```

For the current renderer, the display-to-video mapping must be:

```ts
v = 1 - y;
```

The horizontal mirror rule remains independent: `x` is flipped only when the visible camera preview is mirrored.

## Fix Direction

The fix should stay narrow:

- keep the geometry `y` conversion unchanged;
- keep the previous display-space mirror conversion unchanged;
- update only display-space to video-UV conversion so `v = 1 - y`;
- lock the behavior with unit tests in `scene-sampling` and `light-sheet-renderer`.

## Verification Requirements

Automated verification:

- `npm test -- src/features/scene-sampling/screenSpaceSampling.test.ts src/features/light-sheet-renderer/rendererCore.test.ts`
- full `npm test`
- `npm run build`
- bilingual documentation pairing check
- `git diff --check`

Real-device verification after deployment:

- hard refresh the GitHub Pages URL;
- keep Mirror enabled and move the hand left/right/up/down;
- verify left/right movement remains aligned;
- verify sampled content inside the sheet is no longer vertically inverted;
- repeat with Mirror disabled;
- record a short video and keep the raw recording under local `测试记录/`.
