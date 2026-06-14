# 6f5dc25 Fingertip Lattice Model Analysis

Chinese version: [6f5dc25-fingertip-lattice-model.zh-CN.md](6f5dc25-fingertip-lattice-model.zh-CN.md)

## Scope

This document reviews the real-device recording for commit `6f5dc25a3c5721988c33cebf78adabef4abdd326` against `参考视频.mp4`, then evaluates the proposed point-edge-face-volume model.

Inputs:

- Test recording: `测试记录/基于提交 6f5dc25a3c5721988c33cebf78adabef4abdd326测试/屏幕录制 2026-06-14 104817.mp4`
- Reference recording: `参考视频.mp4`
- Extracted evidence: `测试记录/基于提交 6f5dc25a3c5721988c33cebf78adabef4abdd326测试/ffmpeg逐帧对比_20260614/`

FFmpeg evidence:

- Test recording: 1910x890, 30fps, about 84.80 seconds, 2541 extracted frames.
- Reference recording: 1226x686, 30fps, about 24.58 seconds, 736 extracted frames.
- Contact sheets were generated at 1fps and dynamic segments at 4fps for both comparison sets.

## Frame Comparison Findings

The reference effect is closer to a hand-driven folded spatial template than to a translucent screen-space overlay. It shows a dynamic multi-face object whose visible silhouette changes as the hands move. Some frames read as long strips, some as wide panels, and some as folded or curved ribbon-like surfaces. Different faces use different visual treatments: live scene sampling, colored translucent panels, edge highlights, dotted/graphic faces, and darker side/back faces.

The current implementation still behaves like a fixed spatial template driven by one anchor per hand. The mesh can show perspective and several material groups, but its topology does not come from the fingertips. In practice it remains a broad folded sheet/ribbon that follows the hands rather than a geometry constructed from ten fingertip control points.

This is consistent with the current code boundary:

- `deriveGestureAnchorFrame` reduces each hand to one midpoint between thumb tip and index tip.
- `buildSpatialTemplateMesh` builds a fixed one-hand or two-hand template from those anchors.
- The renderer can draw mesh faces, but the model layer does not yet expose fingertip topology.

## Assessment Of The Proposed Model

The proposed point-edge-face-volume direction is correct and is closer to the reference video than the current anchor-template approach. Treating fingertips as semantic control points is a better domain model because later style changes can be expressed as alternate topology/material rules instead of rewriting camera, tracking, and rendering code.

However, the raw version needs mathematical constraints before implementation. Ten fingertips alone do not guarantee a stable closed 3D body in every hand pose.

## Mathematical Risks

1. **Single-hand fingertip loop is not reliably planar.** The loop `A-B-C-D-E-A` on one hand can become non-planar, concave, or self-intersecting when fingers bend, overlap, or rotate toward the camera. It should not be treated as one polygon face without validation.

2. **Ten tips define a graph or surface first, not a closed volume.** A complete solid needs oriented faces, normal direction, and thickness. Fingertip points can define a deformable lattice; the implementation must add thickness by offsetting a front surface along a stable normal.

3. **Degenerate poses are common.** If fingertips become collinear, too close, hidden, or crossed, some quads collapse or flip. The mesh builder must skip invalid faces or degrade to a smaller topology.

4. **Handedness and mirroring must be normalized.** Camera-space left/right, MediaPipe handedness, and display-space mirror state can disagree. The model must build topology in display-space after explicit coordinate normalization.

5. **Depth is noisy and not metric.** MediaPipe hand `z` values are useful for relative motion but not precise world coordinates. Depth should influence fold amount and perspective after smoothing and clamping, not directly define exact physical thickness.

6. **Thumb order differs from the other fingers.** Anatomically, the thumb can sit far outside the four-finger arc. The `A-B-C-D-E-A` closure should be optional or decorative unless it passes geometry checks.

7. **Tracking gaps need fallback behavior.** Real camera frames can miss one hand or one fingertip. The topology should support confidence thresholds and fallback meshes instead of jumping to a broken body.

## Recommended Mathematical Model

Use a `FingertipLatticeFrame` as the primary model.

Semantic control points:

- `A`: thumb tip, landmark 4.
- `B`: index fingertip, landmark 8.
- `C`: middle fingertip, landmark 12.
- `D`: ring fingertip, landmark 16.
- `E`: pinky fingertip, landmark 20.

Stabilizers:

- wrist: landmark 0;
- MCP joints: landmarks 5, 9, 13, 17;
- palm center and palm normal derived from wrist/MCP landmarks;
- per-point confidence and smoothed previous-frame state.

For two valid hands, build the primary lattice:

- Cross rails: `L_A-R_A`, `L_B-R_B`, `L_C-R_C`, `L_D-R_D`, `L_E-R_E`.
- Side rails: `L_A-L_B-L_C-L_D-L_E` and `R_A-R_B-R_C-R_D-R_E`.
- Primary strip faces:
  - `Q_AB = [L_A, R_A, R_B, L_B]`
  - `Q_BC = [L_B, R_B, R_C, L_C]`
  - `Q_CD = [L_C, R_C, R_D, L_D]`
  - `Q_DE = [L_D, R_D, R_E, L_E]`

Do not force the closure `E-A` into a face by default. It can be rendered as an edge, an optional cap, or a style-specific face only when it passes area, planarity, and intersection checks.

Each quad must be triangulated before rendering. For non-planar quads, choose the diagonal that produces lower twist and avoids inverted normals. Add thickness by duplicating the front surface along a smoothed normal and connecting side faces. Assign a stable material id per strip, cap, back, and edge group.

## Implementation Feasibility

The current stack remains viable. Browser + MediaPipe Hands + Three.js can implement this model. The issue is not the technology choice; it is the current model boundary.

Required module shift:

- Add `features/hand-topology/` to map MediaPipe landmarks into semantic fingertips and stabilizers.
- Add `features/fingertip-lattice/` to construct rails, validated strips, triangulation, normals, thickness, and material groups.
- Change `features/spatial-template-model/` from fixed anchor templates to lattice-driven meshes.
- Keep `features/spatial-template-renderer/` mostly as a mesh renderer, but ensure it accepts triangle lists and material groups.
- Keep the current anchor-template path only as a fallback/debug model, not the main target behavior.

## Test Requirements Before Code Changes

Add RED tests before implementation:

- MediaPipe landmarks map to left/right `A/B/C/D/E` fingertip semantics after display-space mirroring.
- Two valid hands produce five cross rails and four primary strips.
- Non-planar quads are triangulated into valid triangles with stable winding.
- Degenerate or missing fingertips skip invalid faces instead of generating flipped triangles.
- Material ids are stable across scene, panel, back, accent, and edge groups.
- One physical hand duplicated by tracking does not produce a two-hand lattice.
- One-hand fallback uses a controlled partial lattice, not the old fixed triangle/wedge.

## Decision

The user's point-edge-face-volume idea is feasible, but it should be implemented as a validated fingertip lattice with palm stabilizers, triangulated surfaces, thickness, and fallback states. This supersedes the current fixed two-anchor spatial template as the long-term model.
