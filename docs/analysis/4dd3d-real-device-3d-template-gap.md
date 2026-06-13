# 4dd3d Real-Device 3D Template Gap Analysis

Chinese version: [4dd3d-real-device-3d-template-gap.zh-CN.md](4dd3d-real-device-3d-template-gap.zh-CN.md)

## Scope

This analysis reviews the real-device validation recording for deployed commit `4dd3d98105b96f39726dcd1d0bace974fb540511` and compares it against `参考视频.mp4`.

Inputs:

- Real-device recording: `测试记录/基于提交 4dd3d98105b96f39726dcd1d0bace974fb540511测试/屏幕录制 2026-06-13 201908.mp4`
- Reference video: `参考视频.mp4`
- Derived frame evidence: `测试记录/基于提交 4dd3d98105b96f39726dcd1d0bace974fb540511测试/ffmpeg逐帧分析/`

Frame extraction summary:

- real-device recording: 1912x932, 30fps, 191.34s, 5736 frames;
- reference video: 1226x686, 30fps, 24.58s, 736 frames;
- every frame was extracted for both videos;
- additional 1fps and segment contact sheets were generated for manual comparison.

## Observed Gap

The deployed result still reads as a thin translucent screen-space sheet. It can move with the hand anchors, but it does not consistently show a real 3D template model.

The reference video is materially different:

- it shows a hand-anchored 3D template, not a single triangle;
- multiple faces become visible during motion;
- faces use different visual treatments instead of one uniform transparent tint;
- fold/ribbon-like motion reveals side faces, thickness, and perspective;
- movement appears attached to fingertip anchors, with rotation and fold changes driven by hand pose.

The current implementation has two immediate defects:

- one physical hand can be counted as two hands because raw MediaPipe detections are used without duplicate-hand suppression;
- the procedural mesh is still too close to a flat prism in display space, so the result does not present as a folded multi-face 3D model.

## Architecture Assessment

The chosen stack remains viable:

- MediaPipe Hands can provide real-time hand landmarks in the browser;
- Three.js can render procedural 3D meshes, textured faces, thickness, and perspective;
- static GitHub Pages deployment remains suitable because camera access works over HTTPS and the effect runs fully client-side.

The issue is the current implementation boundary, not the stack selection. The project should keep the existing architecture but harden the domain boundary:

- gesture tracking outputs filtered, stable hand anchor frames;
- spatial-template-model owns mesh topology, fold state, material ids, and template variants;
- spatial-template-renderer maps those meshes into Three.js buffers and materials;
- camera and UI layers consume the filtered gesture/template state instead of raw detector counts.

## Decision

Continue with the current browser + MediaPipe + Three.js stack.

Do not replace it with server-side rendering, NVIDIA-specific runtime, or a static image generation approach. The next optimization must change the model from a thin prism into a folded multi-face 3D template and must filter duplicate hand detections before UI and renderer state are derived.

## Required Next Fix

- Add duplicate-hand suppression for detections that share the same physical anchor.
- Drive the top status hand count from the filtered gesture anchor frame, not raw detector results.
- Replace the one-hand triangle/wedge with a small folded rectangular template.
- Replace the two-hand flat ribbon prism with a non-coplanar folded template mesh that includes live-scene, secondary face, back face, accent, and edge material groups.
- Keep real-time video sampling as one face material, not as the entire effect.

## Verification Focus

Automated verification must prove:

- duplicate detections collapse to one usable hand;
- separated real hands still produce a two-hand frame;
- the one-hand mesh is not triangular;
- the two-hand mesh has more than one visible face type;
- generated vertices are non-coplanar enough to render as a 3D model;
- material ids map to distinct renderer groups.

Real-device verification must confirm:

- one physical hand no longer displays `2 hands`;
- the one-hand mode shows a compact folded 3D template, not a triangle;
- the two-hand mode shows multiple faces and edge thickness during movement;
- left/right/up/down movement remains aligned with the camera preview;
- near/far hand movement changes perspective instead of only translating a flat sheet.
