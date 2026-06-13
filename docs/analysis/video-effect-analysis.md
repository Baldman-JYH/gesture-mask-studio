# Video Effect Analysis

Source video: `D:\code\AIProjects\ShowProjects\视频采集蒙版效果.mp4`

Extracted evidence:
- `assets/video-frames/contact_sheet_4fps.jpg`
- `assets/video-frames/sample_001.jpg` to `sample_038.jpg`
- `assets/video-frames/time_00s.jpg` to `time_09s.jpg`
- `assets/video-frames/scene_001.jpg` to `scene_060.jpg`

## Source Metadata

- Duration: about 9.45 seconds.
- Video stream: HEVC, 716 x 572, 30fps, 282 frames.
- Audio stream: AAC mono.
- The video appears to be a screen/webcam capture of an existing interactive demo, with a small `Show UI` control visible in the upper-right corner.

## Observed Visual Behavior

### Primary Effect

The effect renders a semi-transparent image sheet in front of the camera feed. The sheet is anchored by the user's hands and behaves like a thin flexible plane:

- It stretches between the left and right hand.
- It rotates and skews as hand positions change.
- It can appear as a long quadrilateral strip, a trapezoid, or a triangular wedge.
- It has a bright white edge line and glossy highlight, which make it feel like a physical sheet rather than a flat sticker.

### Gesture/Shape Timeline

The exact original algorithm is not visible from the video, but these states are observable:

- Around 0s: sheet is a large triangular/quadrilateral wedge, with a green texture on the upper region and a playing-card texture on the lower strip.
- Around 1s: sheet becomes a wide blue technical-line-art quadrilateral across the face.
- Around 2s: sheet becomes a long narrow playing-card strip, roughly aligned between both hands.
- Around 3s: strip begins changing into a green illustrated strip while keeping the same hand-aligned geometry.
- Around 4s: left hand moves close to camera and forms a triangle-like hand aperture; the sheet collapses into a vertical triangular wedge.
- Around 5s-7s: sheet expands back into a green triangular/trapezoid form, with the left hand large in the foreground and the right hand near the far edge.
- Around 8s-9s: sheet expands into a large blue technical-line-art trapezoid, almost filling the center/right side.

### Texture States

At least three texture families appear:

1. Blue technical line art
   - Blue/cyan gradient background.
   - White line drawing/diagram strokes.
   - Strong futuristic appearance.

2. White playing-card pattern
   - White base.
   - Red card symbols/pips.
   - Reads like a thin physical card strip.

3. Green illustrated/nature-like texture
   - Green/black organic linework.
   - More opaque and darker than the card state.

The video does not prove whether texture changes are triggered by explicit gestures, hand distance thresholds, timed cycling, or hidden UI. For the new project, a deterministic gesture mapping is recommended so users can understand and repeat the effect.

## Gesture Inference

The likely control model is:

- Detect both hands.
- Use fingertips as anchors, especially index-finger tip and thumb tip.
- Build a 2D polygon from these anchors.
- Map a texture into that polygon with perspective distortion.
- Smooth landmark motion frame-to-frame to avoid jitter.

The strongest implementation cue is that the sheet endpoints closely follow hand/fingertip positions, while the interior is rendered as a textured plane. This suggests a hand-landmark plus WebGL compositing approach rather than frame-by-frame image generation.

## Implementation Implications

### Real-Time Recognition

Recommended browser-side detector:

- MediaPipe Tasks Vision `HandLandmarker` running in WebAssembly.
- Detect up to two hands.
- Use index-tip, thumb-tip, wrist, and palm landmarks for:
  - hand identity,
  - pinch/open state,
  - anchor points,
  - rough orientation,
  - gesture confidence.

Minimum viable gestures:

- One hand: show a small triangular preview near the active hand.
- Two hands: stretch the full sheet between hands.
- Pinch gesture: lock or sharpen an endpoint.
- Open palm: expand sheet thickness.
- Hand distance: scale sheet length.
- Hand rotation: rotate/skew the sheet.

### Rendering

Recommended renderer:

- WebGL via Three.js or a lightweight custom WebGL layer.
- Orthographic camera aligned to the video plane.
- Dynamic `BufferGeometry` with 3 or 4 vertices.
- Texture atlas for the three visual states.
- Fragment shader or overlay pass for:
  - alpha/transparency,
  - white edge lines,
  - glossy diagonal highlights,
  - slight bloom/glow.

Canvas 2D is possible for rough affine transforms but is not ideal for the perspective-warped quadrilateral/triangle effect. WebGL is the safer choice.

### Occlusion

The reference often makes the sheet appear near or behind fingers. A high-fidelity version can use segmentation or hand masks to redraw hands above parts of the sheet.

Recommended phased approach:

1. MVP: draw video first, then draw the sheet overlay. This gives the core effect.
2. Enhanced: use hand landmarks to mask small fingertip circles above the sheet.
3. Advanced: add full hand/person segmentation for more accurate occlusion.

### Browser Deployment

The effect can run as a static browser app:

- `getUserMedia` provides the webcam stream.
- MediaPipe model assets are loaded from the deployed static site or CDN.
- Three.js renders locally.
- No server-side compute is required.

Camera access requires a secure origin. GitHub Pages is HTTPS, so it is compatible with webcam access after the user grants permission.

## Risks And Unknowns

- Exact texture-switch trigger is not visible in the source video.
- Occlusion fidelity may differ unless hand/person segmentation is added.
- Hand tracking performance depends on device CPU/GPU and webcam lighting.
- iOS Safari and lower-end mobile devices need specific performance testing.
- Users may need a fallback message when camera permission is denied or no two hands are detected.

## Recommended Product Direction

Build a one-page browser experience named `Gesture Mask Studio`:

- The first screen is the actual camera experience, not a marketing page.
- The UI should be minimal and overlayed around the camera canvas.
- Primary controls:
  - camera permission/start,
  - effect preset selector,
  - mirror toggle,
  - tracking confidence indicator,
  - optional debug landmarks toggle.
- Default preset should reproduce the blue technical-line-art sheet because it is the most visually distinctive in the reference.

## Success Criteria

- User opens a browser URL and grants camera permission.
- Within 1-2 seconds, hand tracking starts locally.
- With two hands visible, a textured sheet appears between hands.
- The sheet stretches, rotates, and changes shape in real time.
- The effect provides at least three visual presets corresponding to the source video.
- The page is deployable as a static site on GitHub Pages.
