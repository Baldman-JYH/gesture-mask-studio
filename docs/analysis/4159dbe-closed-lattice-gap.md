# 4159dbe Closed Lattice Gap Analysis

Chinese version: [4159dbe-closed-lattice-gap.zh-CN.md](4159dbe-closed-lattice-gap.zh-CN.md)

## Scope

This document reviews the real-device validation recording for commit `4159dbe0bf5ada0fc3a51f94079e6489f89ac536` against `参考视频.mp4`.

Inputs:

- Test recording: `测试记录/基于提交 4159dbe0bf5ada0fc3a51f94079e6489f89ac536测试/屏幕录制 2026-06-14 115010.mp4`
- Reference recording: `参考视频.mp4`
- Extracted evidence: `测试记录/基于提交 4159dbe0bf5ada0fc3a51f94079e6489f89ac536测试/ffmpeg逐帧对比_20260614_115010/`

FFmpeg evidence:

- Test recording: 1898x880, 30fps, about 113.7 seconds, 3407 extracted frames.
- Reference recording: 1226x686, 30fps, about 24.58 seconds, 736 extracted frames.
- Contact sheets were generated at 1fps and 4fps segments.

## Findings

The `4159dbe` implementation is an improvement over the earlier fixed-anchor model because the rendered geometry follows fingertip topology more consistently. However, it still does not implement the requested point-edge-face-volume model completely.

Visible gaps:

- One-hand mode still renders as a strip/ribbon because it creates a virtual second hand. It should instead render a single hand face bounded by `A-B-C-D-E-A`.
- Two-hand mode remains open. It creates `AB`, `BC`, `CD`, and `DE` strips, but does not create the `EA` closing strip.
- Two-hand mode lacks left and right cap faces formed by each hand's `A-B-C-D-E-A` loop.
- Face materials are too global. Most visible color changes are driven by the active preset tint, so the object often changes as one sheet instead of showing stable per-face color distinction.
- In near/crossing poses, the missing closure makes the object collapse visually into a long open board.

## Root Cause

The current implementation still contains a compromise from the first fingertip-lattice iteration:

- single hand -> create a virtual rail;
- two hands -> create four open strips;
- cap faces -> absent;
- `EA` closure -> absent;
- material ids -> assigned per broad strip group rather than full topology role.

This means the domain model is still a deformable strip lattice, not a complete point-edge-face-volume body.

## Required Model Change

The next implementation should use this topology:

Single hand:

- points: `A`, `B`, `C`, `D`, `E`;
- edges: `AB`, `BC`, `CD`, `DE`, `EA`;
- face: one front hand face triangulated from the five-point loop;
- optional thickness/back/edge faces for visibility, but no virtual second hand.

Two hands:

- points: `L_A` through `L_E` and `R_A` through `R_E`;
- cross edges: `L_A-R_A`, `L_B-R_B`, `L_C-R_C`, `L_D-R_D`, `L_E-R_E`;
- side loops: `L_A-L_B-L_C-L_D-L_E-L_A` and `R_A-R_B-R_C-R_D-R_E-R_A`;
- strip faces: `AB`, `BC`, `CD`, `DE`, `EA`;
- cap faces: left `A-B-C-D-E-A` and right `A-B-C-D-E-A`;
- material ids assigned by topology role so adjacent faces are visibly distinct.

## Verification Implications

Automated tests must assert:

- one-hand mode does not use virtual rails;
- one-hand mode has exactly the five boundary edges `AB/BC/CD/DE/EA`;
- two-hand mode includes five strips, including `EA`;
- two-hand mode includes left and right cap faces;
- material ids include distinct roles for scene, panel, cap, accent, back, and edge;
- all renderer faces are triangles with non-zero area.

Real-device verification should confirm:

- one hand produces a compact hand-loop face, not a long virtual strip;
- two hands produce a closed body with visible end caps;
- adjacent faces retain different colors/material treatments during movement;
- crossing/near poses no longer collapse into a single open board.
