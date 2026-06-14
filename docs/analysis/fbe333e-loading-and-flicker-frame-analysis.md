# fbe333e Loading And Flicker Frame Analysis

Chinese version: [fbe333e-loading-and-flicker-frame-analysis.zh-CN.md](fbe333e-loading-and-flicker-frame-analysis.zh-CN.md)

## Inputs

- Test recording: `测试记录/基于提交 fbe333e625203f4d610b9a1ce5a0be80651181cc 测试/屏幕录制 2026-06-14 184255.mp4`
- Reference recording: `参考视频.mp4`
- Test metadata: 3830x2068, 30fps, about 99.90 seconds, 2994 frames.
- Reference metadata: 1226x686, 30fps, about 24.58 seconds, 736 frames.

## Extracted Evidence

All frames were extracted with FFmpeg under:

`测试记录/基于提交 fbe333e625203f4d610b9a1ce5a0be80651181cc 测试/ffmpeg逐帧对比_20260614_184255/`

Generated comparison sheets:

- `sheets/test_contact_1fps.jpg`
- `sheets/test_segment_000_025_4fps.jpg`
- `sheets/test_segment_025_050_4fps.jpg`
- `sheets/test_segment_050_075_4fps.jpg`
- `sheets/test_segment_075_100_4fps.jpg`
- `sheets/test_keyframes_labeled.jpg`
- `sheets/reference_contact_1fps.jpg`
- `sheets/reference_segment_000_025_4fps.jpg`
- `sheets/reference_keyframes_labeled.jpg`

Representative keyframes:

- Test: `test_t004.jpg`, `test_t008.jpg`, `test_t012.jpg`, `test_t018.jpg`, `test_t024.jpg`, `test_t030.jpg`, `test_t036.jpg`, `test_t042.jpg`, `test_t048.jpg`, `test_t056.jpg`, `test_t064.jpg`, `test_t072.jpg`, `test_t080.jpg`, `test_t088.jpg`, `test_t096.jpg`
- Reference: `reference_t000.jpg`, `reference_t004.jpg`, `reference_t006.jpg`, `reference_t008.jpg`, `reference_t010.jpg`, `reference_t012.jpg`, `reference_t016.jpg`, `reference_t020.jpg`, `reference_t024.jpg`

## Findings

1. **Start flow is missing an explicit model-loading state.** After the user starts the camera, the current overlay disappears when the camera stream becomes ready, even if hand-tracking model initialization is still in progress. The UI should keep a visible loading prompt until tracking is ready or unavailable.
2. **The latest build still flickers during two-hand motion.** The 4fps segment sheets show repeated full template appearance/disappearance while both hands remain in a similar control pose. The visible symptom is a state-level blink, not only a shader/material artifact.
3. **The current stabilizer only holds `hidden` gaps briefly.** It does not protect the last valid two-hand lattice when tracking briefly degrades into a lower-fidelity one-hand lattice. In practice, one-hand degradation replaces the last two-hand geometry and resets the hold target.
4. **The color separation improved.** The latest footage shows distinct face colors, so the immediate remaining issue is stability rather than face color identity.
5. **Reference-video gap remains architectural.** The reference behaves like a controlled 3D template state machine with stable white edges, state hysteresis, and hand/depth ordering. The current implementation is still a direct fingertip lattice renderer, so future work should introduce a `TemplateState` layer instead of only tuning individual faces.

## Implementation Direction

This pass should make two targeted fixes:

- add a camera/tracker loading overlay that remains visible after camera permission succeeds and disappears only after the tracker is ready or marked unavailable;
- strengthen the spatial-template stabilizer so a recent two-hand lattice is preserved through short hidden or one-hand degradation gaps, then fades out if tracking remains invalid long enough.

The broader `TemplateState` model remains the next architecture milestone after this stability pass.

## Validation Plan

1. Start the deployed app on a camera-enabled device. Expected: a visible loading prompt appears immediately after clicking `Start camera`.
2. Keep observing until MediaPipe finishes loading. Expected: the loading prompt disappears when tracking is ready; if tracking initialization fails, the UI should not remain stuck in loading.
3. Move both hands together for at least 20 seconds. Expected: brief detection gaps should hold/fade the previous two-hand body instead of blinking the whole geometry off.
4. Show one hand only for more than one second. Expected: the previous two-hand geometry should not remain permanently; after the grace period, the render should switch to valid one-hand face or hidden.
5. Record the result and extract all frames again with FFmpeg for comparison against the same reference sheets.
