import { REFERENCE_MATERIAL_MODES } from './referenceMaterialModes';

export const REFERENCE_VERTEX_SHADER = `
attribute vec2 faceUv;

varying vec2 vVideoUv;
varying vec2 vFaceUv;

void main() {
  vVideoUv = uv;
  vFaceUv = faceUv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const REFERENCE_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uSceneTexture;
uniform sampler2D uFaceTexture;
uniform float uOpacity;
uniform float uTime;
uniform float uPixelSize;
uniform float uGlitchAmount;
uniform int uMaterialMode;
uniform vec4 uFaceRoi;

const int MATERIAL_MODE_BLUE_FACE = ${REFERENCE_MATERIAL_MODES.blueFace};
const int MATERIAL_MODE_CARD_FACE = ${REFERENCE_MATERIAL_MODES.cardFace};
const int MATERIAL_MODE_GREEN_FACE = ${REFERENCE_MATERIAL_MODES.greenFace};
const int MATERIAL_MODE_WHITE_EDGE = ${REFERENCE_MATERIAL_MODES.whiteEdge};

varying vec2 vVideoUv;
varying vec2 vFaceUv;

vec2 pixelateUv(vec2 uv, float pixelSize) {
  float safePixelSize = max(pixelSize, 0.0001);
  return (floor(uv / safePixelSize) + 0.5) * safePixelSize;
}

vec3 paletteMap(vec3 color) {
  float luma = dot(color, vec3(0.299, 0.587, 0.114));

  if (luma < 0.22) {
    return vec3(0.01, 0.02, 0.08);
  }

  if (luma < 0.42) {
    return vec3(0.02, 0.13, 0.78);
  }

  if (luma < 0.64) {
    return vec3(0.0, 0.92, 0.9);
  }

  if (luma < 0.82) {
    return vec3(0.24, 1.0, 0.22);
  }

  return vec3(1.0, 0.96, 0.04);
}

vec3 referenceHueBoost(vec3 color) {
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  vec3 cyanGreen = mix(vec3(0.0, 0.95, 1.0), vec3(0.72, 1.0, 0.0), smoothstep(0.28, 0.72, luma));
  vec3 yellowInk = vec3(1.0, 0.95, 0.04);

  return mix(cyanGreen, yellowInk, smoothstep(0.68, 0.92, luma));
}

vec3 rgbGlitch(vec2 uv, float amount) {
  float scanWave = sin((uv.y + uTime * 0.7) * 82.0);
  vec2 offset = vec2(scanWave * amount, 0.0);

  float red = texture2D(uFaceTexture, uv + offset).r;
  float green = texture2D(uFaceTexture, uv).g;
  float blue = texture2D(uFaceTexture, uv - offset).b;

  return vec3(red, green, blue);
}

float faceMaskFromTexture(vec4 faceSample) {
  return clamp(max(faceSample.a, max(faceSample.r, max(faceSample.g, faceSample.b))), 0.0, 1.0);
}

float faceLuma(vec2 uv) {
  return dot(texture2D(uFaceTexture, uv).rgb, vec3(0.299, 0.587, 0.114));
}

float faceEdgeMagnitude(vec2 uv, float pixelSize) {
  vec2 texel = vec2(max(pixelSize * 0.6, 0.0015), max(pixelSize * 0.6, 0.0015));
  float left = faceLuma(uv - vec2(texel.x, 0.0));
  float right = faceLuma(uv + vec2(texel.x, 0.0));
  float top = faceLuma(uv - vec2(0.0, texel.y));
  float bottom = faceLuma(uv + vec2(0.0, texel.y));
  float edge = abs(right - left) + abs(bottom - top);

  return smoothstep(0.08, 0.28, edge);
}

float portraitParticleGrid(vec2 uv, float edge, float mask) {
  vec2 grid = vec2(42.0, 24.0);
  vec2 cell = floor(uv * grid);
  vec2 gridUv = fract(uv * grid);
  vec2 centered = gridUv - vec2(0.5);
  float cellNoise = fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
  float dotShape = 1.0 - smoothstep(0.16, 0.36, length(centered));
  float scanline = 1.0 - smoothstep(0.18, 0.5, abs(fract((uv.y + uTime * 0.035) * 72.0) - 0.5));
  float brokenCells = step(0.18, cellNoise);
  float edgeBoost = mix(0.22, 1.0, clamp(edge * 1.4, 0.0, 1.0));

  return clamp(dotShape * brokenCells * edgeBoost + scanline * 0.16, 0.0, 1.0) * max(mask, 0.42);
}

float redPixelDotGrid(vec2 uv) {
  vec2 gridUv = fract(uv * vec2(18.0, 9.0));
  vec2 centered = gridUv - vec2(0.5);
  float dotShape = 1.0 - smoothstep(0.1, 0.21, length(centered));
  float paperBounds = step(0.06, uv.x) * step(uv.x, 0.96) * step(0.12, uv.y) * step(uv.y, 0.9);
  float brokenRows = step(0.22, fract((uv.y + uTime * 0.025) * 5.0));

  return dotShape * paperBounds * brokenRows;
}

void main() {
  vec2 sourceFaceUv = uFaceRoi.xy + clamp(vFaceUv, 0.0, 1.0) * uFaceRoi.zw;
  vec2 faceUv = vec2(sourceFaceUv.x, 1.0 - sourceFaceUv.y);
  vec2 pixelUv = pixelateUv(faceUv, uPixelSize);
  vec3 glitchedFace = rgbGlitch(pixelUv, uGlitchAmount);
  vec3 sceneBacklight = texture2D(uSceneTexture, vVideoUv).rgb;
  vec4 faceSample = texture2D(uFaceTexture, faceUv);
  float faceMask = faceMaskFromTexture(faceSample);
  float faceEdge = faceEdgeMagnitude(pixelUv, uPixelSize);
  float portraitParticles = portraitParticleGrid(vFaceUv, faceEdge, faceMask);
  vec3 boostedFace = mix(paletteMap(glitchedFace), referenceHueBoost(glitchedFace), 0.38);
  vec3 particleInk = mix(vec3(0.0, 1.0, 0.88), vec3(1.0, 0.96, 0.04), smoothstep(0.22, 0.86, faceLuma(pixelUv)));
  vec3 portraitInk = mix(boostedFace, vec3(1.0, 0.96, 0.08), max(faceEdge, portraitParticles * 0.58));
  vec3 paletteColor = mix(mix(portraitInk, particleInk, portraitParticles * 0.44), sceneBacklight, 0.035);
  vec3 color = paletteColor;
  float alpha = uOpacity * max(faceMask, 0.45);

  if (uMaterialMode == MATERIAL_MODE_BLUE_FACE) {
    // Blue face branch.
    vec3 blueFace = mix(paletteColor, vec3(0.02, 0.09, 0.95), 0.22);
    color = mix(blueFace, vec3(0.0, 0.88, 1.0), faceMask * 0.18);
    color = mix(color, vec3(1.0, 0.95, 0.08), faceEdge * 0.72);
    alpha = uOpacity * max(faceMask, 0.62);
  } else if (uMaterialMode == MATERIAL_MODE_CARD_FACE) {
    // White/red card branch.
    float redDotGrid = redPixelDotGrid(vFaceUv);
    vec3 cardPaper = mix(vec3(0.94, 0.95, 0.86), paletteColor, 0.18);
    vec3 redDotInk = vec3(1.0, 0.02, 0.08);
    vec3 cardTint = mix(cardPaper, redDotInk, redDotGrid * 0.88);
    vec3 cardFace = mix(paletteColor, cardTint, 0.62);
    color = cardFace;
    alpha = uOpacity * max(faceMask, 0.7);
  } else if (uMaterialMode == MATERIAL_MODE_GREEN_FACE) {
    // Green/cyan branch.
    vec3 greenCyan = mix(vec3(0.0, 1.0, 0.28), vec3(0.0, 0.9, 1.0), vFaceUv.y);
    vec3 greenFace = mix(paletteColor, greenCyan, 0.32);
    color = mix(greenFace, vec3(0.02, 0.04, 0.02), faceEdge * 0.52);
    alpha = uOpacity * max(faceMask, 0.58);
  } else if (uMaterialMode == MATERIAL_MODE_WHITE_EDGE) {
    // White edge branch.
    vec2 edgeDistance = min(vFaceUv, 1.0 - vFaceUv);
    float edgeMask = 1.0 - smoothstep(0.0, 0.035, min(edgeDistance.x, edgeDistance.y));
    color = vec3(1.0);
    alpha = uOpacity * max(edgeMask, faceMask * 0.35);
  }

  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`;
