# c9076f2 Real-Device And Reference Video Comparison

Chinese version: [c9076f2-real-device-reference-comparison.zh-CN.md](c9076f2-real-device-reference-comparison.zh-CN.md)

## Scope

This analysis reviews the latest real-device validation recording for commit `c9076f2f94c8c8117356d2ea8186bccc6f1c46f1` and compares it with the refreshed reference video.

Inputs:

- Real-device recording: `测试记录/基于提交 c9076f2f94c8c8117356d2ea8186bccc6f1c46f1测试/屏幕录制 2026-06-13 175923.mp4`
- Refreshed reference video: `参考视频.mp4`
- Derived evidence: `assets/analysis/c9076f2-real-device-offset-comparison/`

Extracted evidence:

- 117 continuous 1fps frames from the real-device recording,
- three 4fps real-device segment contact sheets,
- 50 continuous 2fps frames from the refreshed reference video,
- one 4fps reference-video contact sheet.

## Latest Test Findings

The previous vertical inversion issue is fixed. The sampled camera content inside the current light sheet is no longer upside down.

The remaining visible mismatch is a stable sampling offset: content inside the sheet does not perfectly overlap the same content in the visible camera preview. The cause is that the visible `<video>` uses `object-fit: cover`, so the browser crops and scales the camera stream before displaying it. The renderer was sampling the full video texture directly, without applying the same cover crop.

Single-hand behavior should be treated as a bug for the current 2D implementation. The early prototype exposed a `one-hand-preview` mode, but the current deployable light sheet should only render after two confirmed hands are available. Zero or one hand should produce hidden geometry.

## Reference Video Findings

The refreshed reference video is not a flat camera-sampling rectangle. It shows a hand-anchored 3D template:

- multi-face material states,
- perspective scaling and foreshortening,
- folding and rotation around hand/finger anchors,
- template faces that carry different visual designs,
- fingertip-driven movement rather than only a screen-space rectangle between two palm centers.

The current renderer can still be useful as a validation step for live scene sampling, but it is not architecturally sufficient to reproduce the reference effect. The reference-aligned path remains ADR-0002: a hand-anchored 3D template model.

## Fix Direction

This change keeps the fix scoped to the current 2D implementation:

- remove current-runtime one-hand preview rendering;
- keep two-hand light-sheet rendering;
- convert display-space points through the visible `object-fit: cover` transform before video UV sampling;
- keep horizontal mirror and vertical texture coordinates as separate rules;
- leave the full 3D template model for the ADR-0002 implementation stage.

## Verification Requirements

Automated:

- target tests for gesture state, geometry, scene sampling, and renderer UVs;
- full `npm test`;
- `npm run build`;
- bilingual documentation pairing check;
- `git diff --check`.

Real device:

- one hand only: no camera-area light sheet should render;
- two hands visible: the light sheet should render;
- sampled content inside the sheet should overlap the visible background more closely than `c9076f2`;
- Mirror on/off should preserve horizontal alignment;
- console should have no `THREE.WebGLProgram: Shader Error`.
