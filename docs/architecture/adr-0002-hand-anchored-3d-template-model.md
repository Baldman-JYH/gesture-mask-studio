# ADR-0002: Move Toward A Hand-Anchored 3D Template Model

Chinese version: [adr-0002-hand-anchored-3d-template-model.zh-CN.md](adr-0002-hand-anchored-3d-template-model.zh-CN.md)

## Status

Accepted as the next renderer architecture direction.

## Context

Real-device validation for commit `cad0446f108e5873c13a44582709af8191474a0a` proved that the shader now renders, but the visible behavior does not match the reference closely enough.

Evidence is documented in:

- [cad0446 real-device video comparison](../analysis/cad0446-real-device-video-comparison.md)
- [original reference video analysis](../analysis/video-effect-analysis.md)

The reference appears to behave like a hand-anchored 3D template, folded ribbon, or thin polyhedron:

- visible face separation,
- perspective and thickness cues,
- bright edge highlights,
- face-level texture/material changes,
- flipping and folding as hands move,
- finger contact that feels spatially anchored.

The current implementation is a flat screen-space triangle or quadrilateral. It samples the live camera texture, which remains a valid foundation, but it cannot express multiple faces, fold state, depth, or per-face template materials.

## Decision

Keep the existing browser-local foundation:

- `getUserMedia` camera input,
- MediaPipe hand landmarks,
- WebGL/Three.js rendering,
- live video texture sampling,
- GitHub Pages static deployment.

Change the future rendering target from a flat `LightSheetGeometry` surface to a hand-anchored 3D textured template model.

This introduces a required coordinate boundary:

- `camera-space`: raw MediaPipe/video coordinates.
- `display-space`: coordinates matching the visible mirrored or unmirrored camera preview.
- `model-space`: local coordinates for the 3D template/ribbon/prism.
- `video-uv-space`: source video sampling coordinates.

Immediate bug fixes may still touch the current flat renderer, but all new renderer work should align with this 3D model direction.

## Runtime Shape

Recommended future module boundaries:

```text
features/coordinate-space/
  cameraSpaceToDisplaySpace
  displaySpaceToVideoUv

features/gesture-anchor-frame/
  deriveAnchorFrame
  smoothAnchorFrame

features/spatial-template-model/
  buildTemplateMesh
  assignTemplateFaces
  deriveFoldState

features/spatial-template-renderer/
  renderTemplateMesh
  templateMaterials
  edgeHighlights

features/occlusion-layer/
  fingertipOcclusion
  optionalSegmentationOcclusion
```

The existing `features/light-sheet-renderer` can be kept as an interim renderer until the spatial renderer replaces it.

## Consequences

Positive:

- The renderer can reproduce folded, flipping, multi-face reference states.
- Style additions become per-face material/template changes instead of flat shader variants only.
- Coordinate mirroring is explicit and testable.
- The architecture can later add occlusion without rewriting camera or hand tracking.

Costs:

- More geometry and renderer tests are required.
- The render input contract will need a new mesh/template model.
- The first 3D implementation should be phased to avoid replacing tracking, sampling, and UI at the same time.

## Phased Implementation

1. Fix display-coordinate mirroring in the current pipeline.
2. Add tested spatial template model types: vertices, faces, face material ids, fold state, anchor frame.
3. Build a minimal 3D ribbon/prism renderer with per-face materials.
4. Recreate the reference states:
   - one-hand triangular wedge,
   - two-hand wide strip,
   - narrow card strip,
   - large blue technical template,
   - hand left/right movement,
   - hand near/far movement.
5. Add fingertip occlusion, then evaluate full hand/person segmentation only if needed.

## Non-Goals

- Do not add a server-side renderer.
- Do not add NVIDIA or cloud inference for the MVP path.
- Do not attempt to prove the exact original algorithm from video alone.
- Do not rewrite camera permission, MediaPipe loading, or deployment just to support the new renderer.

## Verification Requirements

Every implementation step must include:

- unit tests for coordinate-space conversion,
- unit tests for mesh/fold construction,
- renderer tests for face ordering and UV/material assignment,
- browser smoke checks for WebGL canvas rendering without shader errors,
- real-device video comparison against the reference contact sheets.
