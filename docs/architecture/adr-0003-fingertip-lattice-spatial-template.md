# ADR-0003: Fingertip Lattice Spatial Template

Chinese version: [adr-0003-fingertip-lattice-spatial-template.zh-CN.md](adr-0003-fingertip-lattice-spatial-template.zh-CN.md)

## Status

Accepted as the next architecture direction.

This ADR supersedes the fixed anchor-template direction from ADR-0002 for the main realtime effect. ADR-0002 remains useful as historical context and as a fallback/debug rendering path.

## Context

Frame analysis for commit `6f5dc25a3c5721988c33cebf78adabef4abdd326` showed that the deployed spatial template is still not close enough to `参考视频.mp4`.

Evidence:

- [6f5dc25 Fingertip Lattice Model Analysis](../analysis/6f5dc25-fingertip-lattice-model.md)
- Extracted frame evidence under `测试记录/基于提交 6f5dc25a3c5721988c33cebf78adabef4abdd326测试/ffmpeg逐帧对比_20260614/`

The current implementation reduces each hand to one anchor and builds a fixed mesh from those anchors. This cannot express the reference behavior, where the object appears to be controlled by several fingertip positions and changes its visible topology as the hand pose changes.

## Decision

Use a fingertip lattice as the primary spatial template model.

The model uses five semantic fingertip points per hand:

- thumb: `A`
- index: `B`
- middle: `C`
- ring: `D`
- pinky: `E`

The model also uses wrist and palm landmarks as stabilizers for hand orientation, palm normal, confidence, and temporal smoothing.

For two valid hands, the topology starts from:

- five cross rails between matching fingertips;
- two side rails along the left and right finger order;
- five validated strip faces between adjacent fingers, including the closing `EA` strip;
- left and right cap faces from each hand's `A-B-C-D-E-A` loop;
- generated thickness, back faces, side faces, edge material groups, and material ids.

For one valid hand, the topology starts from:

- five boundary edges: `AB`, `BC`, `CD`, `DE`, and `EA`;
- one cap/front face from the hand's `A-B-C-D-E-A` loop;
- generated thickness, back faces, and edge material groups;
- no virtual second hand.

Rendering uses triangulated faces, not raw arbitrary polygons. Every generated face must pass minimum area, winding, and degeneracy checks before it reaches the renderer.

## Module Boundary

New/changed boundaries:

```text
features/hand-topology/
  extractHandTopologyFrame
  normalizeHandedness
  derivePalmStabilizers

features/fingertip-lattice/
  buildFingertipRails
  buildValidatedStrips
  triangulateLatticeFaces
  addTemplateThickness
  assignLatticeMaterials

features/spatial-template-model/
  buildSpatialTemplateMeshFromLattice
  fallbackAnchorTemplate

features/spatial-template-renderer/
  renderTriangleMeshByMaterialGroup
```

Existing camera, MediaPipe loading, display-space coordinate normalization, video UV mapping, and GitHub Pages deployment remain valid.

## Consequences

Positive:

- The main domain model now matches the reference effect more closely.
- Later template style changes can be implemented by changing topology/material rules instead of rewriting the camera or tracking stack.
- Face-level material assignment becomes stable and extensible.
- Degenerate hand poses can be handled explicitly instead of producing accidental geometry.
- Single-hand and two-hand behavior now share the same point-edge-face-volume model.

Cost:

- More geometry tests are required.
- The model layer needs stricter validation before renderer handoff.
- One-hand behavior must be a closed hand-loop face, not a virtual two-hand strip.

## Verification Requirements

Before implementation is accepted:

- Unit tests must cover fingertip extraction, handedness/mirror normalization, rail construction, face validation, triangulation, thickness, material assignment, duplicate-hand suppression, and fallback behavior.
- Tests must assert `EA` closure and hand cap faces.
- `npm test` and `npm run build` must pass.
- Bilingual documentation pairing must pass.
- A real-device validation video must be recorded and compared against `参考视频.mp4` with FFmpeg contact sheets.
- The validation report must explicitly state whether the rendered object is still a fixed template or now follows fingertip topology.
