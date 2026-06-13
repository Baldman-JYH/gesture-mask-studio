export const LIGHT_SHEET_VERTEX_SHADER = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

varying vec2 vVideoUv;
varying vec2 vLocalUv;

void main() {
  vVideoUv = uv;
  vLocalUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const LIGHT_SHEET_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D uSceneTexture;
uniform vec3 uTint;
uniform vec3 uEdgeColor;
uniform float uOpacity;
uniform float uSceneIntensity;
uniform float uTime;
uniform int uShaderMode;

varying vec2 vVideoUv;
varying vec2 vLocalUv;

float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

float lineGrid(vec2 uv, float scale) {
  vec2 cell = abs(fract(uv * scale) - 0.5);
  float line = min(cell.x, cell.y);
  return 1.0 - smoothstep(0.018, 0.045, line);
}

void main() {
  vec4 scene = texture2D(uSceneTexture, vVideoUv);
  float brightness = luma(scene.rgb);
  float pulse = 0.5 + 0.5 * sin(uTime * 0.0018 + vLocalUv.x * 8.0);
  vec3 sampled = mix(scene.rgb, scene.rgb * uTint, uSceneIntensity);

  if (uShaderMode == 1) {
    float grid = lineGrid(vVideoUv, 28.0);
    sampled = mix(sampled, uTint, grid * 0.48 + brightness * 0.16);
  } else if (uShaderMode == 2) {
    sampled = floor(sampled * 5.0) / 5.0;
    sampled = mix(sampled, vec3(brightness), 0.28);
  } else if (uShaderMode == 3) {
    float wave = sin((vVideoUv.x + vVideoUv.y + uTime * 0.0004) * 18.0);
    sampled = mix(sampled, uTint, 0.18 + wave * 0.08);
  }

  float edge = smoothstep(0.0, 0.045, min(min(vLocalUv.x, 1.0 - vLocalUv.x), min(vLocalUv.y, 1.0 - vLocalUv.y)));
  vec3 color = mix(uEdgeColor, sampled + uTint * pulse * 0.08, edge);
  float alpha = uOpacity * (0.42 + brightness * 0.38 + pulse * 0.08);

  gl_FragColor = vec4(color, alpha);
}
`;
