# 918465d Post-Coordinate-Fix Frame Analysis

Chinese version: [918465d-post-coordinate-fix-frame-analysis.zh-CN.md](918465d-post-coordinate-fix-frame-analysis.zh-CN.md)

## Inputs

- Test recording: `测试记录/基于提交 918465d6bc73a750691917c262f9b9c7c438a0df测试/屏幕录制 2026-06-14 134907.mp4`
- Reference recording: `参考视频.mp4`
- Test metadata: 1894x884, 30fps, about 152.04 seconds, 4557 frames.
- Reference metadata: 1226x686, 30fps, about 24.58 seconds, 736 frames.

## Extracted Evidence

All frames were extracted with FFmpeg under:

`测试记录/基于提交 918465d6bc73a750691917c262f9b9c7c438a0df测试/ffmpeg逐帧对比_20260614_134907/`

Generated sheets:

- `sheets/test_contact_1fps.jpg`
- `sheets/test_segment_000_060_4fps.jpg`
- `sheets/test_segment_060_120_4fps.jpg`
- `sheets/test_segment_120_152_4fps.jpg`
- `sheets/test_keyframes_labeled.jpg`
- `sheets/reference_contact_1fps.jpg`
- `sheets/reference_segment_000_025_4fps.jpg`
- `sheets/reference_keyframes_labeled.jpg`

Representative keyframes:

- `keyframes/test_t0010_f00300_two_hand_long_box.jpg`
- `keyframes/test_t0046_f01380_large_closed_box.jpg`
- `keyframes/test_t0065_f01950_single_hand_residual.jpg`
- `keyframes/test_t0102_f03060_large_closed_box.jpg`
- `keyframes/test_t0124_f03720_crossed_hands_wedge.jpg`
- `keyframes/test_t0132_f03960_orphan_triangle.jpg`
- `keyframes/ref_t0001_f00030_long_multi_material_bar.jpg`
- `keyframes/ref_t0007_f00210_triangle_fold_front.jpg`
- `keyframes/ref_t0010_f00300_thin_edge_collapse.jpg`
- `keyframes/ref_t0013_f00390_large_triangle_template.jpg`

## Findings

The previous left-right and top-bottom coordinate-space errors did not reproduce. In stable two-hand frames, the spatial body now follows the visible hand region much more closely than before. The remaining visible mismatch is no longer mainly a source-video versus display-space mapping issue.

The current implementation still differs from the reference in four important areas:

1. **Degenerate one-hand geometry is still rendered.** Frames such as `test_t0065_f01950_single_hand_residual.jpg` and `test_t0132_f03960_orphan_triangle.jpg` show `1 hand` in the status bar, but the one-hand `A-B-C-D-E-A` face collapses into a narrow sliver or isolated triangle. This should be hidden or folded into a stable hand-local thin face.
2. **Two-hand bodies are closed but not yet reference-like.** The mesh now contains the requested fingertip topology, including caps, but the rendered volume often appears as a thick box or capsule rather than the reference's folded template surface.
3. **Depth is still too directly driven by MediaPipe landmark `z`.** Crossed-hand and diagonal poses produce excessive perspective thickness or wedge shapes. The reference appears to use a stabilized template depth model, not raw landmark `z` as geometry depth.
4. **Face material design is still too uniform.** The renderer has different material slots, but the visual result is still dominated by a similar live-video tint. The reference has stronger per-face identity: white borders, blue/white patterned panels, green sampled panels, and clear fold edges.

## Reference Comparison

The reference is best described as a hand-driven folded spatial template, not as a flat mask. It has these behaviors:

- long bar, triangle, and thin-edge states are all stable;
- fold edges remain visually explicit;
- each major face has a distinct material treatment;
- single-hand or partial-hand states collapse predictably instead of leaving detached remote triangles;
- the live scene is sampled through selected template faces, while other faces behave like designed panels.

The current project architecture is still suitable for this target. MediaPipe Hands plus Three.js can support the required effect. The next fixes should be inside the geometry validity/state model and renderer material system, not a full technical rewrite.

## Recommended Next Work

1. Add topology validity checks before rendering:
   - one-hand loop minimum area;
   - loop aspect-ratio limit;
   - fingertip spread threshold;
   - duplicate or stale-hand suppression;
   - hysteresis so invalid frames fade out instead of producing isolated triangles.
2. Replace raw landmark `z` depth with a derived template-depth model:
   - estimate fold direction from hand separation and local fingertip loop orientation;
   - clamp depth range;
   - smooth depth frame-to-frame;
   - keep the topology closed even when a strip degenerates.
3. Upgrade material rendering:
   - explicit line/edge geometry for white borders;
   - stable per-face material ids for `AB/BC/CD/DE/EA`, caps, back, and edges;
   - support non-video template textures per face;
   - keep selected faces sampling live video.
4. Add tests for invalid one-hand loops and two-hand depth clamping before implementation.

## Validation Status

This pass changed documentation only. No source code was modified.
