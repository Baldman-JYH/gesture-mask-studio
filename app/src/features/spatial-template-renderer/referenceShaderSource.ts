export const REFERENCE_VERTEX_SHADER = `
varying vec2 vVideoUv;
varying vec2 vFaceUv;

void main() {
  vVideoUv = uv;
  vFaceUv = uv;
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

varying vec2 vVideoUv;
varying vec2 vFaceUv;

vec2 pixelateUv(vec2 uv, float pixelSize) {
  float safePixelSize = max(pixelSize, 0.0001);
  return (floor(uv / safePixelSize) + 0.5) * safePixelSize;
}

vec3 paletteMap(vec3 color) {
  float luma = dot(color, vec3(0.299, 0.587, 0.114));

  if (luma < 0.22) {
    return vec3(0.03, 0.02, 0.08);
  }

  if (luma < 0.42) {
    return vec3(0.02, 0.24, 1.0);
  }

  if (luma < 0.64) {
    return vec3(0.0, 0.95, 0.82);
  }

  if (luma < 0.82) {
    return vec3(1.0, 0.04, 0.18);
  }

  return vec3(1.0, 0.94, 0.08);
}

vec3 rgbGlitch(vec2 uv, float amount) {
  float scanWave = sin((uv.y + uTime * 0.7) * 82.0);
  vec2 offset = vec2(scanWave * amount, 0.0);

  float red = texture2D(uSceneTexture, uv + offset).r;
  float green = texture2D(uSceneTexture, uv).g;
  float blue = texture2D(uSceneTexture, uv - offset).b;

  return vec3(red, green, blue);
}

float faceMaskFromTexture(vec4 faceSample) {
  return clamp(max(faceSample.a, max(faceSample.r, max(faceSample.g, faceSample.b))), 0.0, 1.0);
}

void main() {
  vec2 pixelUv = pixelateUv(vVideoUv, uPixelSize);
  vec3 glitchedScene = rgbGlitch(pixelUv, uGlitchAmount);
  vec3 paletteColor = paletteMap(glitchedScene);
  vec4 faceSample = texture2D(uFaceTexture, vFaceUv);
  float faceMask = faceMaskFromTexture(faceSample);
  vec3 color = paletteColor;
  float alpha = uOpacity * max(faceMask, 0.45);

  if (uMaterialMode == 1) {
    // Blue face branch.
    color = mix(vec3(0.02, 0.09, 0.95), vec3(0.0, 0.72, 1.0), faceMask);
    alpha = uOpacity * max(faceMask, 0.62);
  } else if (uMaterialMode == 2) {
    // White/red card branch.
    float redCardBand = step(0.54, fract((vFaceUv.x + vFaceUv.y + uTime * 0.035) * 4.0));
    color = mix(vec3(1.0), vec3(1.0, 0.02, 0.08), redCardBand * 0.72);
    alpha = uOpacity * max(faceMask, 0.7);
  } else if (uMaterialMode == 3) {
    // Green/cyan branch.
    vec3 greenCyan = mix(vec3(0.0, 1.0, 0.28), vec3(0.0, 0.9, 1.0), vFaceUv.y);
    color = mix(greenCyan, paletteColor, 0.18);
    alpha = uOpacity * max(faceMask, 0.58);
  } else if (uMaterialMode == 4) {
    // White edge branch.
    vec2 edgeDistance = min(vFaceUv, 1.0 - vFaceUv);
    float edgeMask = 1.0 - smoothstep(0.0, 0.035, min(edgeDistance.x, edgeDistance.y));
    color = vec3(1.0);
    alpha = uOpacity * max(edgeMask, faceMask * 0.35);
  }

  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`;
