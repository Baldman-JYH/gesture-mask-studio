# ce0a171 Real-Camera Frame Analysis

Chinese version: [ce0a171-real-camera-frame-analysis.zh-CN.md](ce0a171-real-camera-frame-analysis.zh-CN.md)

## Inputs

- Test recording: `测试记录/基于提交 ce0a171850d0d010332baa70880bae3744da503c测/屏幕录制 2026-06-14 175634.mp4`
- Reference recording: `参考视频.mp4`
- Test metadata: 3832x2028, 30fps, about 142.12 seconds, 4261 frames.
- Reference metadata: 1226x686, 30fps, about 24.58 seconds, 736 frames.

## Extracted Evidence

All frames were extracted with FFmpeg under:

`测试记录/基于提交 ce0a171850d0d010332baa70880bae3744da503c测/ffmpeg逐帧对比_20260614_175634/`

Generated comparison sheets:

- `sheets/test_contact_1fps.jpg`
- `sheets/test_segment_000_036_4fps.jpg`
- `sheets/test_segment_036_072_4fps.jpg`
- `sheets/test_segment_072_108_4fps.jpg`
- `sheets/test_segment_108_143_4fps.jpg`
- `sheets/test_keyframes_labeled.jpg`
- `sheets/reference_contact_1fps.jpg`
- `sheets/reference_segment_000_025_4fps.jpg`
- `sheets/reference_keyframes_labeled.jpg`

Representative keyframes:

- Test: `test_t014.jpg`, `test_t020.jpg`, `test_t027.jpg`, `test_t034.jpg`, `test_t042.jpg`, `test_t050.jpg`, `test_t058.jpg`, `test_t066.jpg`, `test_t078.jpg`, `test_t090.jpg`, `test_t102.jpg`, `test_t114.jpg`, `test_t126.jpg`, `test_t138.jpg`
- Reference: `reference_t000.jpg`, `reference_t004.jpg`, `reference_t006.jpg`, `reference_t008.jpg`, `reference_t010.jpg`, `reference_t012.jpg`, `reference_t016.jpg`, `reference_t020.jpg`, `reference_t024.jpg`

## Findings

`ce0a171` is an improvement over the previous build: the single-hand extruded body is gone, invalid single-hand poses usually hide, and the two-hand closed fingertip lattice can appear.

Remaining gaps:

1. **Two-hand motion flickers.** The real-camera recording shows the template disappearing and reappearing when both hands move together. The root cause is that `CameraStage` passed each current-frame mesh directly to React state. When MediaPipe or the lattice quality gate temporarily returned `hidden`, the canvas input was removed immediately.
2. **Two-hand bodies still read as long dark boxes in several frames.** Frames such as `test_t027.jpg`, `test_t102.jpg`, `test_t114.jpg`, and `test_t126.jpg` show a closed lattice, but back/cap faces stack visually into a dark translucent block. This is partly a material problem: the renderer made back faces too dark and texture-mapped too much of the body.
3. **The current model is still too literal compared with the reference.** The reference is a controlled hand-driven template that switches among long bar, thin edge, triangular face, folded panel, and large textured face states. The current implementation still connects the current frame's fingertips directly into a mesh.
4. **Hand occlusion/depth ordering is not solved.** The reference often places fingers visually in front of the template. The current render layer still overlays the mesh above the camera feed without a hand/person segmentation pass.
5. **Per-face visual identity needs to be clearer.** The reference uses strong white borders and differentiated face textures. The current result should first use simple independent colors for each side face, then later upgrade to texture and edge styling.

## Fixes In This Pass

- Added a spatial-template stabilizer that holds the last visible mesh through short hidden tracking gaps. This directly targets the two-hand flicker reported during the latest test.
- Changed `CameraStage` to route render input through the stabilizer before updating React state.
- Added a tested material settings layer for the spatial-template renderer.
- Changed the renderer so the five `AB/BC/CD/DE/EA` strip faces get distinguishable colors.
- Reduced back/cap visual weight and stopped texture-mapping dark back faces, so the closed body should read less like a single black box.
- Ensured edge opacity fades with held mesh opacity, so short tracking-gap fade-outs do not leave bright outline remnants.

## Remaining Architecture Direction

The technology stack is still viable: MediaPipe Hands, normalized display-space topology, Three.js, and GitHub Pages can support the target effect.

The next model-level step should not be more ad hoc face drawing. It should add a `TemplateState` layer between raw fingertip topology and mesh construction:

- classify stable states such as `hidden`, `one-hand-face`, `two-hand-bar`, `two-hand-folded`, and `two-hand-triangle`;
- use fingertip points as constraints, not as unconstrained free-form mesh vertices in every frame;
- add hysteresis for state changes;
- keep the current fingertip lattice as the diagnostic/full-body state, but avoid forcing every valid frame into the same closed body.

## Next Validation Plan

1. Deploy this build and hard-refresh the GitHub Pages URL on the camera-enabled device.
2. Two-hand flicker test: move both hands together for at least 20 seconds. Expected result: short tracking gaps should fade/hold the previous geometry instead of making the model blink off instantly.
3. Multi-face style test: hold both hands steady. Expected result: the five side faces should be distinguishable by color, not synchronized into one global tint.
4. Dark-box regression test: repeat the poses around the previous `test_t027`, `test_t102`, and `test_t126` frames. Expected result: the object may still be geometrically imperfect, but it should no longer stack into a heavy black block.
5. Single-hand test: show only one hand and spread fingers. Expected result: no thick body; only a valid one-hand face or hidden output.
6. Record the validation, extract all frames with FFmpeg, and compare again against the same reference key states.
