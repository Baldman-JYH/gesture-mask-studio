import { useEffect, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Camera,
  Mesh,
  RawShaderMaterial,
  Scene,
  Vector3,
  WebGLRenderer,
  type VideoTexture,
} from 'three';
import type { LightSheetRenderInput } from '../../shared/runtime/types';
import { createVideoTexture, disposeTexture } from '../scene-sampling/videoTexture';
import {
  geometryToPositions,
  geometryToTriangleIndices,
  geometryToVideoUvs,
  hexToRgbUnit,
} from './rendererCore';
import {
  LIGHT_SHEET_FRAGMENT_SHADER,
  LIGHT_SHEET_VERTEX_SHADER,
} from './shaderSource';

type LightSheetCanvasProps = {
  renderInput: LightSheetRenderInput | null;
  className?: string;
};

type RendererRefs = {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: Camera;
  geometry: BufferGeometry;
  material: RawShaderMaterial;
  mesh: Mesh;
  texture: VideoTexture | null;
  video: HTMLVideoElement | null;
  animationFrame: number;
};

export function LightSheetCanvas({ renderInput, className }: LightSheetCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<LightSheetRenderInput | null>(renderInput);
  const rendererRef = useRef<RendererRefs | null>(null);

  useEffect(() => {
    inputRef.current = renderInput;
    updateRenderInput(rendererRef.current, renderInput);
  }, [renderInput]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return undefined;
    }

    const refs = createRendererRefs();
    rendererRef.current = refs;
    host.appendChild(refs.renderer.domElement);

    const resizeObserver = new ResizeObserver(() => resizeRenderer(host, refs.renderer));
    resizeObserver.observe(host);
    resizeRenderer(host, refs.renderer);

    const renderLoop = () => {
      const input = inputRef.current;
      if (input) {
        refs.material.uniforms.uTime.value = input.timestampMs;
        refs.texture && (refs.texture.needsUpdate = true);
      }

      refs.renderer.render(refs.scene, refs.camera);
      refs.animationFrame = requestAnimationFrame(renderLoop);
    };

    updateRenderInput(refs, inputRef.current);
    refs.animationFrame = requestAnimationFrame(renderLoop);

    return () => {
      cancelAnimationFrame(refs.animationFrame);
      resizeObserver.disconnect();
      disposeTexture(refs.texture);
      refs.geometry.dispose();
      refs.material.dispose();
      refs.renderer.dispose();
      refs.renderer.domElement.remove();
      rendererRef.current = null;
    };
  }, []);

  return <div ref={hostRef} className={className} aria-hidden="true" />;
}

function createRendererRefs(): RendererRefs {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new Camera();
  const geometry = new BufferGeometry();
  const material = new RawShaderMaterial({
    vertexShader: LIGHT_SHEET_VERTEX_SHADER,
    fragmentShader: LIGHT_SHEET_FRAGMENT_SHADER,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uSceneTexture: { value: null },
      uTint: { value: new Vector3(1, 1, 1) },
      uEdgeColor: { value: new Vector3(1, 1, 1) },
      uOpacity: { value: 0 },
      uSceneIntensity: { value: 0 },
      uTime: { value: 0 },
      uShaderMode: { value: 0 },
    },
  });
  const mesh = new Mesh(geometry, material);
  mesh.visible = false;
  scene.add(mesh);

  return {
    renderer,
    scene,
    camera,
    geometry,
    material,
    mesh,
    texture: null,
    video: null,
    animationFrame: 0,
  };
}

function updateRenderInput(refs: RendererRefs | null, renderInput: LightSheetRenderInput | null): void {
  if (!refs || !renderInput || renderInput.geometry.mode === 'hidden') {
    if (refs) {
      refs.mesh.visible = false;
    }
    return;
  }

  if (refs.video !== renderInput.scene.video) {
    disposeTexture(refs.texture);
    refs.texture = createVideoTexture(renderInput.scene.video);
    refs.video = renderInput.scene.video;
    refs.material.uniforms.uSceneTexture.value = refs.texture;
  }

  refs.geometry.setAttribute(
    'position',
    new BufferAttribute(geometryToPositions(renderInput.geometry), 3),
  );
  refs.geometry.setAttribute(
    'uv',
    new BufferAttribute(geometryToVideoUvs(renderInput.geometry, {
      mirrored: renderInput.scene.mirrored,
      viewport: renderInput.scene.viewport,
      video: {
        width: renderInput.scene.video.videoWidth,
        height: renderInput.scene.video.videoHeight,
      },
    }), 2),
  );
  refs.geometry.setIndex(new BufferAttribute(geometryToTriangleIndices(renderInput.geometry), 1));
  refs.geometry.attributes.position.needsUpdate = true;
  refs.geometry.attributes.uv.needsUpdate = true;
  refs.geometry.index && (refs.geometry.index.needsUpdate = true);

  const tint = hexToRgbUnit(renderInput.style.sceneSample.tint);
  const edgeColor = hexToRgbUnit(renderInput.style.edgeColor);
  refs.material.uniforms.uTint.value.set(tint[0], tint[1], tint[2]);
  refs.material.uniforms.uEdgeColor.value.set(edgeColor[0], edgeColor[1], edgeColor[2]);
  refs.material.uniforms.uOpacity.value = renderInput.style.opacity * renderInput.geometry.opacity;
  refs.material.uniforms.uSceneIntensity.value = renderInput.style.sceneSample.intensity;
  refs.material.uniforms.uShaderMode.value = shaderModeToUniform(renderInput.style.shader);
  refs.mesh.visible = true;
}

function shaderModeToUniform(shader: LightSheetRenderInput['style']['shader']): number {
  if (shader === 'blueprint') {
    return 1;
  }

  if (shader === 'cards') {
    return 2;
  }

  if (shader === 'organic') {
    return 3;
  }

  return 0;
}

function resizeRenderer(host: HTMLElement, renderer: WebGLRenderer): void {
  const width = Math.max(1, host.clientWidth);
  const height = Math.max(1, host.clientHeight);
  renderer.setSize(width, height, false);
}
