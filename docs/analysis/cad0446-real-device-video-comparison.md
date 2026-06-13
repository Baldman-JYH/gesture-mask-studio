# cad0446 Real-Device Video Comparison

Chinese version: [cad0446-real-device-video-comparison.zh-CN.md](cad0446-real-device-video-comparison.zh-CN.md)

## Scope

This document compares the real-device validation recording for commit `cad0446f108e5873c13a44582709af8191474a0a` against the original reference video.

Inputs:

- Test recording: `测试记录/基于提交 cad0446f108e5873c13a44582709af8191474a0a的测试记录/Video_2026-06-13_161333.mp4`
- Browser console log: `测试记录/基于提交 cad0446f108e5873c13a44582709af8191474a0a的测试记录/浏览器控制台输出日志.txt`
- Reference video: `D:\code\AIProjects\ShowProjects\视频采集蒙版效果.mp4`

Extracted evidence:

- Test video, 1fps continuous frames: `assets/analysis/cad0446-real-device-comparison/test_1fps/test_001.jpg` to `test_074.jpg`
- Reference video, 4fps continuous frames: `assets/analysis/cad0446-real-device-comparison/reference_4fps/reference_001.jpg` to `reference_038.jpg`
- Test overview: `assets/analysis/cad0446-real-device-comparison/test_contact_1fps.jpg`
- Reference overview: `assets/analysis/cad0446-real-device-comparison/reference_contact_4fps.jpg`
- Test dynamic segments:
  - `assets/analysis/cad0446-real-device-comparison/test_segment_10s_22s_6fps.jpg`
  - `assets/analysis/cad0446-real-device-comparison/test_segment_24s_40s_6fps.jpg`
  - `assets/analysis/cad0446-real-device-comparison/test_segment_44s_60s_6fps.jpg`
- Reference dense overview: `assets/analysis/cad0446-real-device-comparison/reference_contact_8fps.jpg`

## Console Result

The real-device console log no longer shows the previous `THREE.WebGLProgram: Shader Error`.

Observed console output is limited to:

- Microsoft Edge built-in `LanguageDetector` informational message.
- MediaPipe WebGL startup logs.
- MediaPipe warning: `Using NORM_RECT without IMAGE_DIMENSIONS is only supported for the square ROI`.
- `Graph successfully started running.`

Conclusion: the `cad0446` shader portability fix worked. The remaining issue is behavioral and architectural fidelity, not a fatal WebGL compile failure.

## Visual Comparison

### Reference Behavior

The reference effect behaves like a hand-anchored 3D template, folded ribbon, or thin polyhedron:

- The object has visible perspective, thickness cues, bright edge highlights, and face separation.
- Different faces can show different visual templates at the same time, such as blue technical material, white card material, and green organic material.
- The shape appears to rotate, flip, and fold as the hands move.
- Finger/hand contact is visually important. The object appears spatially attached to fingertips instead of merely floating in screen space.
- Some frames show the object changing between a wide quadrilateral, a narrow strip, a triangular prism-like wedge, and a folded triangular surface.

The exact source implementation cannot be proven from the video alone, but the visible behavior strongly suggests a 3D hand-anchored surface model rather than a single 2D screen-space mask.

### Current cad0446 Behavior

The tested implementation now renders an effect, but it behaves as a 2D screen-space sheet:

- One-hand mode draws a flat triangle.
- Two-hand mode draws a flat quadrilateral.
- All generated vertices are placed at `z = 0`.
- The effect samples the camera texture and adds style treatment, but it does not model depth, face rotation, folded surfaces, or per-face materials.
- The sheet often reads as a translucent overlay in front of the image rather than a physical object held by the hand.
- The object does not reproduce the reference's stable 3D flipping or multi-face template behavior.

## Architecture Finding

The current foundation is partially correct but incomplete:

- Correct:
  - Browser `getUserMedia`.
  - Local MediaPipe hand tracking.
  - WebGL/Three.js rendering.
  - Live camera texture sampling as a material input.
  - Static GitHub Pages deployment feasibility.
- Incorrect or insufficient:
  - Treating the target as one 2D light sheet is too weak for the reference.
  - Style switching by openness does not reproduce a multi-face 3D template.
  - `LightSheetGeometry` only represents 3 or 4 normalized screen-space vertices, which cannot express a folded prism/ribbon.
  - The renderer has no concept of model space, face materials, depth, occlusion, or hand-anchor frames.

Recommended terminology: use `gesture-anchored 3D light template` or `hand-anchored textured surface model` for the future architecture. `Mask` can remain in the product name, but it should not define the core rendering model.

## Mirror Bug Finding

The left/right reversal is a real coordinate-space bug.

Current coordinate flow:

- `CameraStage` displays the preview video with CSS `scaleX(-1)` when `mirrored` is true.
- MediaPipe landmarks are passed directly into `deriveLightSheetGestureState`.
- Geometry is generated from unmirrored landmark `x` coordinates.
- The video UV sampling path applies `mirrored ? 1 - x : x`.

This means the user sees a mirrored camera image, while the overlay geometry still follows the unmirrored tracking coordinates. As a result, moving a visible hand left can make the rendered sheet move right.

Required correction:

- Define one canonical `display space` for all visible geometry.
- If the preview is mirrored, convert landmark `x` to `1 - x` before gesture-state and geometry generation.
- Keep video sampling separate from display geometry, so the sampled texture still matches the mirrored preview.
- Add tests for both geometry mirroring and UV sampling to prevent regressions.

## Recommended Next Architecture

The next implementation should not continue tuning the current flat-sheet renderer as the main path. It should split the runtime into explicit coordinate and model layers:

1. `camera-space`
   - Raw MediaPipe landmarks in video coordinates.
   - Unmirrored source video texture coordinates.

2. `display-space`
   - Mirrored or unmirrored coordinates matching what the user sees.
   - All hand anchors used for visible object placement.

3. `gesture-anchor-frame`
   - Thumb/index anchors.
   - Hand span, pinch distance, palm orientation, and optional landmark `z`.
   - Smoothed frame-to-frame state.

4. `spatial-template-model`
   - 3D vertices, faces, face normals, per-face material ids, and fold/rotation state.
   - Supports quadrilateral strips, triangular wedges, and prism-like folded templates.

5. `spatial-template-renderer`
   - Three.js perspective or calibrated orthographic camera.
   - Dynamic `BufferGeometry`.
   - Per-face materials that can combine:
     - live video texture sampling,
     - template texture atlas,
     - edge/highlight lines,
     - transparency and color grading.

6. `occlusion-layer`
   - Initial landmark-based fingertip occlusion.
   - Later optional hand/person segmentation.

## Verification Needed For The Next Fix

For the immediate mirror correction:

- Unit test: mirrored landmarks convert `x` to `1 - x` before geometry generation.
- Unit test: mirrored video UV sampling still uses source-video coordinates.
- Browser smoke: with fake camera, mirror toggle changes overlay/display coordinate mapping without shader errors.
- Real-device check: move a hand left/right and confirm the visible effect follows the same visual direction.

For the larger 3D renderer change:

- Extract a new reference/test frame set after implementation.
- Compare at least:
  - one-hand triangle/wedge state,
  - two-hand wide strip state,
  - narrow card-strip state,
  - large blue template state,
  - hand moving left/right,
  - hand moving closer/farther from camera.
- Confirm visible depth cues:
  - separate faces,
  - edge highlights,
  - perspective rotation,
  - no flat sticker look.

## Conclusion

The user's assessment is substantially correct. The current implementation is no longer failing at the shader level, but the base rendering concept is not faithful enough to the reference. The project should keep the existing camera/tracking/WebGL foundation, fix the mirror coordinate bug immediately, and then replace the flat `LightSheetGeometry` renderer with a hand-anchored 3D textured template model.
