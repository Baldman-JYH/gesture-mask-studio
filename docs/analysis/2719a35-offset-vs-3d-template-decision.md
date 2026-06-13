# 2719a35 Offset vs 3D Template Decision

Chinese version: [2719a35-offset-vs-3d-template-decision.zh-CN.md](2719a35-offset-vs-3d-template-decision.zh-CN.md)

## Scope

This analysis reviews the real-device validation recording for commit `2719a35a7abd998f3c3818efd30e84b1c1c5a736` and compares it with the refreshed reference video to decide whether the next engineering step should keep tuning the current 2D offset or move to the 3D template architecture.

Inputs:

- Real-device recording: `测试记录/基于提交 2719a35a7abd998f3c3818efd30e84b1c1c5a736测试/屏幕录制 2026-06-13 185629.mp4`
- Reference video: `参考视频.mp4`
- Derived evidence: `assets/analysis/2719a35-real-device-architecture-decision/`

Extracted evidence:

- real-device recording: 1900x870, 30fps, 68.74s, 2058 video frames;
- reference video: 1226x686, 30fps, 24.58s, 736 video frames;
- 69 continuous 1fps frames from the real-device recording;
- 25 continuous 1fps frames from the reference video;
- 1fps contact sheets for both videos;
- 4fps segment contact sheets for the real-device recording and reference video.

## Findings

The current implementation no longer shows the earlier left/right or vertical inversion class of bug in the sampled content. The remaining visible mismatch is dominated by the rendering model:

- the current effect is still a large screen-space quadrilateral or trapezoid;
- the sheet content is produced by live video sampling plus tint/grid styling;
- the same background marker or face can appear duplicated inside the sheet because that is what the current live-sampling shader is designed to do;
- the sheet can rotate visually, but it does not become a folded multi-face object.

The reference video shows a different target:

- a hand/fingertip-anchored spatial template;
- multiple faces with independent materials;
- thin thickness/edge highlights;
- perspective foreshortening;
- face flips, folding, and ribbon-like rotation;
- movement that feels attached to finger anchors rather than only to a 2D plane in the camera preview.

Because of that, continuing to tune the 2D sheet offset would mostly polish an interim renderer. It may improve the current demo but will not converge to the reference behavior.

## Decision

Move to the 3D template implementation next.

Keep the current 2D renderer only as a calibration/debug harness for coordinate-space and live video sampling. Do not spend another major iteration trying to make the current flat sheet visually match the reference.

The only 2D work that remains useful is narrow diagnostic work, such as adding a raw sampling debug style with no tint/grid to verify that display-space to video-uv mapping remains correct.

## Tech Debt Check

Brooks-debt review classifies the main risk as **Domain Model Distortion** plus **Change Propagation**: implementing folded, multi-face, fingertip-anchored behavior inside `light-sheet-renderer` would force the current flat light-sheet model to represent a different domain concept.

Remedy: create the spatial-template boundary described in ADR-0002 and keep `light-sheet-renderer` as an interim renderer. This avoids turning every future template, fold, material, or anchor change into a cross-cutting rewrite of gesture, sampling, renderer, and UI code.

## Recommended Next Implementation

Implement the first ADR-0002 milestone:

- introduce a tested gesture anchor frame derived from hand landmarks;
- introduce a spatial template model with vertices, faces, material ids, and fold state;
- render a minimal Three.js ribbon/prism with multiple textured faces;
- keep live video sampling as one optional material source, not as the only effect model;
- use fingertip/hand anchors to drive position, rotation, scale, and fold;
- keep occlusion and person segmentation for a later step after the 3D template motion is stable.

## Verification Plan For The Next Change

Automated:

- unit tests for hand landmark to anchor-frame conversion;
- unit tests for mesh construction, face ordering, and fold state;
- unit tests for gesture state transitions: no hand, one hand, two hands;
- renderer smoke test proving that all template materials compile without shader errors;
- full `npm test`, `npm run build`, documentation pairing check, and `git diff --check`.

Real device:

- one visible hand should only render if the selected 3D template mode explicitly supports one-hand anchors;
- two visible hands should produce a spatial template, not a flat screen-space sheet;
- moving fingers left/right/up/down should move the template in the same visible direction;
- moving fingers near/far should change scale/perspective rather than only translating the object;
- the template should show at least two visually distinct faces during rotation/folding;
- compare a new recording against `reference_contact_1fps.jpg` and `reference_segment_000_024_4fps.jpg`.
