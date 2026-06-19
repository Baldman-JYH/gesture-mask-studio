import { describe, expect, it } from 'vitest';
import type { TemplateMode, TemplateState } from '../template-state/types';
import { buildReferenceTemplateMesh } from './referenceTemplateMesh';

describe('buildReferenceTemplateMesh', () => {
  it('builds a long thin wide-blue-face strip with explicit edge material', () => {
    const mesh = buildReferenceTemplateMesh(state('wide-blue-face'));

    expect(mesh.mode).toBe('two-hand-template');
    expect(mesh.vertices.length).toBeGreaterThanOrEqual(8);
    expect(mesh.faces.some((face) => face.materialId === 'face-blue')).toBe(true);
    expect(mesh.faces.some((face) => face.materialId === 'edge-white')).toBe(true);

    const { width, height } = bounds(mesh.vertices.map((vertex) => vertex.position));
    expect(width).toBeGreaterThan(height * 3);
  });

  it('overscales the wide strip beyond the raw hand span like the reference projection', () => {
    const templateState = state('wide-blue-face');
    const mesh = buildReferenceTemplateMesh(templateState);
    const { width, height } = bounds(mesh.vertices.map((vertex) => vertex.position));

    expect(width).toBeGreaterThan(templateState.span * 1.35);
    expect(height).toBeGreaterThan(templateState.span * 0.2);
  });

  it('builds a triangle fold with three visible face materials', () => {
    const templateState = {
      ...state('triangle-fold'),
      foldAmount: 0.9,
      materialPreset: 'white-red-pixels',
      depthDelta: 0.3,
      depthTilt: 0.3,
    };
    const mesh = buildReferenceTemplateMesh(templateState);

    expect(mesh.faces.filter((face) => face.materialId === 'face-card').length).toBeGreaterThan(0);
    expect(mesh.faces.filter((face) => face.materialId === 'face-blue').length).toBeGreaterThan(0);
    expect(mesh.faces.filter((face) => face.materialId === 'edge-white').length).toBeGreaterThan(0);

    const { width, height } = bounds(mesh.vertices.map((vertex) => vertex.position));
    expect(width).toBeGreaterThan(templateState.span * 1.05);
    expect(height).toBeGreaterThan(templateState.span * 0.5);
  });

  it('builds a thin edge without creating a bulky box', () => {
    const mesh = buildReferenceTemplateMesh({
      ...state('thin-edge'),
      span: 0.7,
      foldAmount: 0.2,
      materialPreset: 'green-cyan',
    });

    const zValues = mesh.vertices.map((vertex) => vertex.position.z ?? 0);
    expect(Math.max(...zValues) - Math.min(...zValues)).toBeLessThan(0.08);
    expect(mesh.faces.some((face) => face.materialId === 'edge-white')).toBe(true);
  });

  it('uses signed depthDelta to mirror fold depth direction', () => {
    const nearLeft = buildReferenceTemplateMesh({
      ...state('triangle-fold'),
      depthDelta: 0.3,
      depthTilt: 0.3,
      foldAmount: 0.8,
    });
    const nearRight = buildReferenceTemplateMesh({
      ...state('triangle-fold'),
      depthDelta: -0.3,
      depthTilt: 0.3,
      foldAmount: 0.8,
    });

    const firstFoldVertexIndex = 2;
    expect(nearLeft.vertices[firstFoldVertexIndex].position.z).toBeCloseTo(
      -(nearRight.vertices[firstFoldVertexIndex].position.z ?? 0),
    );
  });

  it('rotates local mesh points around the template center', () => {
    const unrotated = buildReferenceTemplateMesh({
      ...state('wide-blue-face'),
      rotation: 0,
    });
    const rotated = buildReferenceTemplateMesh({
      ...state('wide-blue-face'),
      rotation: Math.PI / 2,
    });

    const unrotatedBounds = bounds(unrotated.vertices.map((vertex) => vertex.position));
    const rotatedBounds = bounds(rotated.vertices.map((vertex) => vertex.position));

    expect(unrotatedBounds.width).toBeGreaterThan(unrotatedBounds.height * 3);
    expect(rotatedBounds.height).toBeGreaterThan(rotatedBounds.width * 3);
  });

  it('preserves canonical face uvs when rotating the template', () => {
    const mesh = buildReferenceTemplateMesh({
      ...state('wide-blue-face'),
      rotation: Math.PI / 2,
    });
    const faceUvs = mesh.vertices
      .filter((vertex) => vertex.faceUv)
      .map((vertex) => vertex.faceUv);

    expect(faceUvs.length).toBe(mesh.vertices.length);
    expect(faceUvs).toContainEqual({ u: 0, v: 0 });
    expect(faceUvs).toContainEqual({ u: 0.5, v: 0 });
    expect(faceUvs).toContainEqual({ u: 1, v: 0 });
    expect(faceUvs).toContainEqual({ u: 0, v: 1 });
    expect(faceUvs).toContainEqual({ u: 0.5, v: 1 });
    expect(faceUvs).toContainEqual({ u: 1, v: 1 });
  });

  it('returns a hidden mesh when state is hidden', () => {
    const mesh = buildReferenceTemplateMesh({
      ...state('wide-blue-face'),
      mode: 'hidden',
      visible: true,
      opacity: 1,
    });

    expect(mesh).toEqual({
      mode: 'hidden',
      vertices: [],
      faces: [],
      opacity: 0,
      confidence: 0,
    });
  });

  it('returns a hidden mesh when state is invisible', () => {
    const mesh = buildReferenceTemplateMesh({
      ...state('white-card-face'),
      visible: false,
      opacity: 1,
    });

    expect(mesh.vertices).toHaveLength(0);
    expect(mesh.faces).toHaveLength(0);
    expect(mesh.opacity).toBe(0);
    expect(mesh.confidence).toBe(0);
  });

  it('builds visible meshes for card, green-cyan, and one-hand wedge modes', () => {
    const whiteCard = buildReferenceTemplateMesh({
      ...state('white-card-face'),
      materialPreset: 'white-red-pixels',
    });
    const greenCyan = buildReferenceTemplateMesh({
      ...state('green-cyan-face'),
      materialPreset: 'green-cyan',
    });
    const wedge = buildReferenceTemplateMesh({
      ...state('one-hand-wedge'),
      activeHandCount: 1,
      materialPreset: 'edge-only',
    });

    expect(whiteCard.mode).toBe('two-hand-template');
    expect(whiteCard.faces.some((face) => face.materialId === 'face-card')).toBe(true);
    expect(greenCyan.faces.some((face) => face.materialId === 'face-green')).toBe(true);
    expect(greenCyan.faces.some((face) => face.materialId === 'glass-clear')).toBe(true);
    expect(wedge.mode).toBe('one-hand-template');
    expect(wedge.faces.some((face) => face.materialId === 'edge-white')).toBe(true);
  });
});

function state(mode: TemplateMode): TemplateState {
  return {
    mode,
    visible: true,
    activeHandCount: mode === 'one-hand-wedge' ? 1 : 2,
    center: { x: 0.5, y: 0.5, z: 0 },
    span: 0.6,
    rotation: 0,
    depthTilt: 0,
    depthDelta: 0,
    foldAmount: 0.4,
    opacity: 0.84,
    materialPreset: 'blue-face',
    timestampMs: 1000,
  };
}

function bounds(points: Array<{ x: number; y: number }>): { width: number; height: number } {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  return {
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}
