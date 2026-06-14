# 3136e09 Offset Frame Analysis

Chinese version: [3136e09-offset-frame-analysis.zh-CN.md](3136e09-offset-frame-analysis.zh-CN.md)

## Inputs

- Test recording: `测试记录/基于提交 3136e094b0210928d2eb01f8f06d8541535e6ca2测试/屏幕录制 2026-06-14 130340.mp4`
- Reference recording: `参考视频.mp4`
- Test recording metadata: 1904x878, 30fps, about 206.5 seconds, 6191 frames.
- Reference metadata: 1226x686, 30fps, about 24.58 seconds, 736 frames.

## Extracted Evidence

All frames were extracted with FFmpeg to:

`测试记录/基于提交 3136e094b0210928d2eb01f8f06d8541535e6ca2测试/ffmpeg逐帧对比_20260614_130340/`

Generated sheets:

- `sheets/test_contact_1fps.jpg`
- `sheets/reference_contact_1fps.jpg`
- `sheets/test_segment_000_060_4fps.jpg`
- `sheets/test_segment_060_120_4fps.jpg`
- `sheets/test_segment_120_180_4fps.jpg`
- `sheets/test_segment_180_207_4fps.jpg`
- `sheets/reference_segment_000_025_4fps.jpg`

Representative keyframes:

- `keyframes/test_100s_horizontal_low_offset.jpg`
- `keyframes/test_145s_single_hand_slab.jpg`
- `keyframes/test_190s_diagonal_capsule.jpg`
- `keyframes/reference_002s_hand_anchored_strip.jpg`
- `keyframes/reference_008s_thin_fold.jpg`
- `keyframes/reference_015s_wide_face_anchor.jpg`

## Findings

The `3136e09` build fixed the previous open-body problem. The object is now generally closed.

The remaining offset is not a simple mirror-axis error. It changes with pose and vertical screen position. In the 1904x878 recording, two-hand horizontal poses often render as a closed long body whose center is lower than the visible fingertips. Single-hand poses can render a small sliver or thick slab beside the hand rather than directly on the visible fingertip loop.

The reference video behaves differently: the template edge stays visually attached to the fingers more often, and the object changes between thin strip, triangular fold, and wide face without drifting away from the hand controls.

## Root Cause

The runtime mixed two coordinate spaces:

1. MediaPipe returns source-video normalized landmarks.
2. The browser displays the camera video with `object-fit: cover` inside the visible stage.
3. The spatial template geometry used the source-video landmarks directly as display-space vertices.

For this recording, the visible stage is wider than the camera stream. `object-fit: cover` scales the source video to the stage width and crops vertically. A source point at `y=0.3` is visible near display `y=0.256`, not `y=0.3`. The missing source-to-display conversion explains the remaining pose-dependent vertical offset.

A secondary visual issue remains: MediaPipe `z` is still used directly as spatial-template depth before perspective projection. This can amplify the "thick capsule" look during one-hand or diagonal poses. It should be treated separately after verifying the coordinate-space fix.

## Change Made

`toDisplayHands` now maps source-video landmarks through the same centered `object-fit: cover` transform used by the visible video before applying mirror conversion. `CameraStage` passes the current video and viewport sizes into that mapping.

This keeps the hand topology input in the same coordinate space as the visible camera preview and the spatial-template renderer.

## Verification Required

Automated tests cover the wide-stage vertical crop case that reproduced this recording's offset pattern.

Manual camera validation is still required because the real offset depends on physical device aspect ratio, browser viewport, and camera stream dimensions.
