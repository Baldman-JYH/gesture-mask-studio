# 454c4a4 Real-Camera Frame Analysis

Chinese version: [454c4a4-real-camera-frame-analysis.zh-CN.md](454c4a4-real-camera-frame-analysis.zh-CN.md)

## Inputs

- Test recording: `测试记录/基于提交 454c4a43503c95dcdfc68a3fe7f6b9b767015c83测试/屏幕录制 2026-06-14 170311.mp4`
- Reference recording: `参考视频.mp4`
- Test metadata: 3834x1958, 30fps, about 117.78 seconds, 3530 frames.
- Reference metadata: 1226x686, 30fps, about 24.58 seconds, 736 frames.

## Extracted Evidence

All frames were extracted with FFmpeg under:

`测试记录/基于提交 454c4a43503c95dcdfc68a3fe7f6b9b767015c83测试/ffmpeg逐帧对比_20260614_170311/`

Generated sheets:

- `sheets/test_contact_1fps.jpg`
- `sheets/test_segment_000_040_4fps.jpg`
- `sheets/test_segment_040_080_4fps.jpg`
- `sheets/test_segment_080_118_4fps.jpg`
- `sheets/test_keyframes_labeled.jpg`
- `sheets/reference_contact_1fps.jpg`
- `sheets/reference_segment_000_025_4fps.jpg`
- `sheets/reference_keyframes_labeled.jpg`

Representative keyframes:

- `keyframes/test_t018.jpg`
- `keyframes/test_t030.jpg`
- `keyframes/test_t056.jpg`
- `keyframes/test_t088.jpg`
- `keyframes/test_t096.jpg`
- `keyframes/reference_t000.jpg`
- `keyframes/reference_t008.jpg`
- `keyframes/reference_t012.jpg`
- `keyframes/reference_t024.jpg`

## Differences From The Reference

`454c4a4` reduced some long tubes and hourglass failures caused by crossed rails, but it still does not match the reference closely enough.

1. **One-hand state still renders a body.** In `test_t018.jpg` and `test_t030.jpg`, the status bar shows `1 hand`, yet a thick polyhedron or triangle fragment is visible. Under the current business model, one hand can only form the `A-B-C-D-E-A` face; it must not create a body.
2. **Invalid lattice is patched by the old anchor template.** When fingertip topology is invalid or rail gates hide the lattice, the render-input layer falls back to the old anchor template, so the status bar and rendered output diverge.
3. **Two-hand geometry still drifts from the fingertips.** In frames such as `test_t088.jpg`, the body is not strictly attached to the ten fingertip control points. One root cause is that the renderer uses a perspective camera even though fingertip vertices are normalized screen-space points; any non-zero z shifts x/y toward the camera center.
4. **Faces do not have stable per-face visual identity.** The five side faces reuse a small set of material groups, so the result still reads as global tinting. The reference has clearer color or texture separation per template face.
5. **The reference uses controlled template states, not arbitrary free deformation.** It switches between long bars, thin edges, triangular faces, and large folded faces while keeping endpoints constrained by the hands. The current model mostly connects the current frame's ten fingertips directly and lacks template-state constraints.

## Root-Cause Assessment

The current technology stack remains suitable: MediaPipe Hands provides fingertip points, Three.js can render the live template, and browser deployment supports the real-time camera requirement. The problem is in model constraints and projection:

- `buildOneHandClosedFace` actually emitted front/back/edge faces, so one hand became an extruded body.
- `createSpatialTemplateRenderInput` fell back to the old template when the lattice was hidden, so invalid topology still displayed a model.
- `SpatialTemplateCanvas` used a perspective camera for screen-space vertices, so depth changed screen position.
- The material enum did not reserve independent slots for the five `AB/BC/CD/DE/EA` side faces, making later per-face templates more expensive to add.

## Fixes In This Pass

- One-hand lattice now uses five fingertip vertices and three triangles, representing only the `A-B-C-D-E-A` plane.
- Invalid fingertip lattices now remain hidden instead of falling back to the old anchor template.
- The old anchor-template production builder was removed, so spatial-template mesh creation now has a single fingertip-topology entry point.
- The spatial-template renderer now uses an orthographic camera so screen-space fingertip vertices do not drift because of z depth.
- The five side faces now have independent material slots: `strip-ab`, `strip-bc`, `strip-cd`, `strip-de`, and `strip-ea`.

## Next Validation Plan

1. After deployment, open GitHub Pages on a camera-enabled device.
2. One-hand test: show only one hand, spread five fingers, and move it. Expected result: only one face attached to the five fingertips; no thick body, remote triangle fragment, or old wedge template.
3. Invalid two-hand test: cross, occlude, or quickly misalign both hands. Expected result: invalid topology hides; it must not patch in a floating old-template body.
4. Two-hand test: spread both hands and move slowly left-right, up-down, and closer-farther. Expected result: the closed body boundary remains attached to the left/right fingertips, with visibly reduced drift.
5. Material test: when the two-hand body appears, the five side faces should show visible hue separation instead of synchronizing to one color.
6. Record the validation and extract all frames with FFmpeg again for comparison against `参考视频.mp4`.
