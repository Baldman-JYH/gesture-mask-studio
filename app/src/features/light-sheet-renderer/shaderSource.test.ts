import { describe, expect, it } from 'vitest';
import { LIGHT_SHEET_FRAGMENT_SHADER } from './shaderSource';

describe('light sheet shader source', () => {
  it('does not depend on derivative-only fragment shader functions', () => {
    expect(LIGHT_SHEET_FRAGMENT_SHADER).not.toContain('fwidth(');
    expect(LIGHT_SHEET_FRAGMENT_SHADER).not.toContain('GL_OES_standard_derivatives');
  });
});
