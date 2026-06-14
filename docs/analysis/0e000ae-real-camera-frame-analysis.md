# 0e000ae Real-Camera Frame Analysis

Chinese version: [0e000ae-real-camera-frame-analysis.zh-CN.md](0e000ae-real-camera-frame-analysis.zh-CN.md)

## Inputs

- Test recording: `测试记录/基于提交 0e000ae09ef1de7178c53d78f01fc6446125129c 测试/屏幕录制 2026-06-14 163150.mp4`
- Reference recording: `参考视频.mp4`
- Test metadata: 3808x1954, 30fps, about 116.33 seconds, 3487 frames.
- Reference metadata: 1226x686, 30fps, about 24.58 seconds, 736 frames.

## Extracted Evidence

All frames were extracted with FFmpeg under:

`测试记录/基于提交 0e000ae09ef1de7178c53d78f01fc6446125129c 测试/ffmpeg逐帧对比_20260614_163150/`

Generated sheets:

- `sheets/test_contact_1fps.jpg`
- `sheets/test_segment_000_040_4fps.jpg`
- `sheets/test_segment_040_080_4fps.jpg`
- `sheets/test_segment_080_117_4fps.jpg`
- `sheets/test_keyframes_labeled.jpg`
- `sheets/reference_contact_1fps.jpg`
- `sheets/reference_segment_000_025_4fps.jpg`
- `sheets/reference_keyframes_labeled.jpg`

Representative keyframes:

- `keyframes/test_t0015_f00450_first_large_offset_box.jpg`
- `keyframes/test_t0024_f00720_right_side_long_tube.jpg`
- `keyframes/test_t0034_f01020_vertical_twisted_body.jpg`
- `keyframes/test_t0048_f01440_low_long_tube.jpg`
- `keyframes/test_t0057_f01710_hourglass_twist.jpg`
- `keyframes/test_t0067_f02010_open_box_near_hands.jpg`
- `keyframes/test_t0085_f02550_long_box_with_offset.jpg`
- `keyframes/test_t0095_f02850_small_residual_triangle.jpg`
- `keyframes/test_t0105_f03150_large_panel_reentry.jpg`

## Improvements From 0e000ae

The raw-depth explosion found in the previous `918465d` analysis is reduced. The mesh no longer appears to use extreme MediaPipe landmark `z` values directly as render depth.

Single-hand leftovers are also reduced. The previous large number of remote one-hand slivers is no longer the dominant failure mode.

## Remaining Issues

The current result is still not close enough to the reference.

1. **The two-hand body often twists into a tube, vertical slab, or hourglass.** Examples include `test_t0024_f00720_right_side_long_tube.jpg`, `test_t0034_f01020_vertical_twisted_body.jpg`, and `test_t0057_f01710_hourglass_twist.jpg`.
2. **The rendered body is not reliably attached to the visible fingertip control points.** Several frames show the body extending from the right edge or below the hands instead of being visually pinched between the two hands.
3. **Small one-hand residual triangles still appear.** `test_t0095_f02850_small_residual_triangle.jpg` shows the gate improved but not fully solved for partial/low-quality hand detections.
4. **The template state is still too literal.** The current model tries to keep the full `A/B/C/D/E` closed body visible too often. The reference transitions between a long bar, thin edge, triangle, and large folded face with clear controlled states.
5. **Face materials remain underdeveloped.** The reference has strong per-face identity and white edges. The current result still reads mostly as live-video-tinted faces.

## Root-Cause Hypothesis

The technical stack is still suitable: MediaPipe Hands plus Three.js can implement the target. The issue is now in the math/model layer, not deployment or browser rendering.

The current data flow confirms three model-level gaps:

- `extractHandTopologyFrame` sorts usable hands by display-space `palmCenter.x` and picks the leftmost/rightmost hands. It does not maintain a persistent physical-hand identity across frames.
- `buildTwoHandClosedBody` assumes both hand loops can use the same `A/B/C/D/E` order directly. It does not normalize loop winding or reject impossible cross-rail layouts.
- The renderer receives whatever lattice the current frame creates. There is no temporal state machine to smooth hand identity, stabilize the selected template state, or fade out invalid geometry.

This explains why `0e000ae` can reduce depth spikes while still producing twisted tubes: the depth is bounded, but the paired fingertip loops are sometimes inconsistent.

## Recommended Next Work

The next fix should target topology identity and lattice validity before adding visual polish.

1. Add tests for two-hand winding and rail crossing:
   - mirrored left/right hand loops with opposite visible winding must not create a twisted tube;
   - crossed or implausible `A-A/B-B/...` rails should hide or fall back to a simpler stable template;
   - switching hand order across adjacent frames should not flip the body.
2. Add a hand-pair stabilization layer:
   - keep a persistent left/right physical identity using previous-frame palm position, handedness, and distance;
   - add hysteresis before switching hand roles;
   - reject two-hand mode when the pair quality score is below threshold.
3. Normalize mesh loop winding:
   - preserve semantic fingertip ids for diagnostics;
   - build faces from a winding-normalized loop order so strips do not self-cross.
4. Add lattice quality gates:
   - rail intersection count;
   - strip aspect ratio;
   - body centroid inside a reasonable hand control envelope;
   - cap polygon area and orientation consistency.
5. After geometry is stable, upgrade material rendering:
   - explicit white edge geometry;
   - per-face template textures;
   - selected live-video-sampling faces.

## Validation Status

This pass changed documentation only. No source code was modified.
