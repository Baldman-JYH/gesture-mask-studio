import { useEffect, useRef } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
  WebGLRenderer,
  type VideoTexture,
} from 'three';
import { createVideoTexture, disposeTexture } from '../scene-sampling/videoTexture';
import { spatialTemplateToBufferData } from './rendererCore';
import type { SpatialTemplateRenderInput } from './renderInput';

type SpatialTemplateCanvasProps = {
  renderInput: SpatialTemplateRenderInput | null;
  className?: string;
};

type RendererRefs = {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: OrthographicCamera;
  geometry: BufferGeometry;
  materials: MeshBasicMaterial[];
  mesh: Mesh;
  texture: VideoTexture | null;
  video: HTMLVideoElement | null;
  animationFrame: number;
};

export function SpatialTemplateCanvas({ renderInput, className }: SpatialTemplateCanvasProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<SpatialTemplateRenderInput | null>(renderInput);
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

    const resizeObserver = new ResizeObserver(() => resizeRenderer(host, refs));
    resizeObserver.observe(host);
    resizeRenderer(host, refs);

    const renderLoop = () => {
      if (refs.texture) {
        refs.texture.needsUpdate = true;
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
      refs.materials.forEach((material) => material.dispose());
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
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.01, 10);
  camera.position.z = 2.7;
  camera.lookAt(0, 0, 0);

  const geometry = new BufferGeometry();
  const materials = Array.from({ length: 11 }, () => (
    new MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: DoubleSide,
    })
  ));
  const mesh = new Mesh(geometry, materials);
  mesh.visible = false;
  scene.add(mesh);

  return {
    renderer,
    scene,
    camera,
    geometry,
    materials,
    mesh,
    texture: null,
    video: null,
    animationFrame: 0,
  };
}

function updateRenderInput(
  refs: RendererRefs | null,
  renderInput: SpatialTemplateRenderInput | null,
): void {
  if (!refs || !renderInput || renderInput.mesh.mode === 'hidden') {
    if (refs) {
      refs.mesh.visible = false;
    }
    return;
  }

  ensureVideoTexture(refs, renderInput.scene.video);
  updateGeometry(refs, renderInput);
  updateMaterials(refs, renderInput);
}

function ensureVideoTexture(refs: RendererRefs, video: HTMLVideoElement): void {
  if (refs.video === video) {
    return;
  }

  disposeTexture(refs.texture);
  refs.texture = createVideoTexture(video);
  refs.video = video;
}

function updateGeometry(refs: RendererRefs, renderInput: SpatialTemplateRenderInput): void {
  const viewport = renderInput.scene.viewport;
  const aspect = viewport.height > 0 ? viewport.width / viewport.height : 1;
  const data = spatialTemplateToBufferData(renderInput.mesh, {
    aspect,
    videoMapping: {
      mirrored: renderInput.scene.mirrored,
      viewport,
      video: {
        width: renderInput.scene.video.videoWidth,
        height: renderInput.scene.video.videoHeight,
      },
    },
  });

  refs.geometry.setAttribute(
    'position',
    new BufferAttribute(new Float32Array(data.positions), 3),
  );
  refs.geometry.setAttribute(
    'uv',
    new BufferAttribute(new Float32Array(data.uvs), 2),
  );
  refs.geometry.setIndex(new BufferAttribute(new Uint16Array(data.indices), 1));
  refs.geometry.clearGroups();
  data.groups.forEach((group) => refs.geometry.addGroup(group.start, group.count, group.materialIndex));
  refs.geometry.computeVertexNormals();
  refs.mesh.visible = data.indices.length > 0;
}

function updateMaterials(refs: RendererRefs, renderInput: SpatialTemplateRenderInput): void {
  const tint = hexToNumber(renderInput.style.sceneSample.tint);
  const edge = hexToNumber(renderInput.style.edgeColor);
  const opacity = renderInput.style.opacity * renderInput.mesh.opacity;
  const [
    sceneMaterial,
    panelMaterial,
    backMaterial,
    accentMaterial,
    capMaterial,
    edgeMaterial,
  ] = refs.materials;

  sceneMaterial.map = refs.texture;
  sceneMaterial.color.setHex(tint);
  sceneMaterial.opacity = opacity * Math.max(0.42, renderInput.style.sceneSample.intensity * 0.72);
  sceneMaterial.needsUpdate = true;

  panelMaterial.map = refs.texture;
  panelMaterial.color.setHex(tint);
  panelMaterial.opacity = opacity * 0.34;
  panelMaterial.needsUpdate = true;

  backMaterial.map = refs.texture;
  backMaterial.color.setHex(0x10242c);
  backMaterial.opacity = opacity * 0.5;
  backMaterial.needsUpdate = true;

  accentMaterial.map = refs.texture;
  accentMaterial.color.setHex(mixRgb(tint, edge, 0.55));
  accentMaterial.opacity = opacity * 0.48;
  accentMaterial.needsUpdate = true;

  capMaterial.map = refs.texture;
  capMaterial.color.setHex(mixRgb(0xffffff, tint, 0.28));
  capMaterial.opacity = opacity * 0.58;
  capMaterial.needsUpdate = true;

  edgeMaterial.map = null;
  edgeMaterial.color.setHex(edge);
  edgeMaterial.opacity = opacity * 0.78;
  edgeMaterial.needsUpdate = true;

  const stripBaseColors = [0x28d6ff, 0x7cff74, 0xffd166, 0xff7ad9, 0x8f7cff];
  refs.materials.slice(6).forEach((material, index) => {
    material.map = refs.texture;
    material.color.setHex(mixRgb(stripBaseColors[index] ?? tint, tint, 0.34));
    material.opacity = opacity * (0.42 + index * 0.035);
    material.needsUpdate = true;
  });
}

function resizeRenderer(host: HTMLElement, refs: RendererRefs): void {
  const width = Math.max(1, host.clientWidth);
  const height = Math.max(1, host.clientHeight);
  const aspect = width / height;
  refs.renderer.setSize(width, height, false);
  refs.camera.left = -aspect;
  refs.camera.right = aspect;
  refs.camera.top = 1;
  refs.camera.bottom = -1;
  refs.camera.updateProjectionMatrix();
}

function hexToNumber(hex: string): number {
  const normalized = hex.replace('#', '').trim();
  const value = normalized.length === 3
    ? normalized
      .split('')
      .map((character) => `${character}${character}`)
      .join('')
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return 0xffffff;
  }

  return Number.parseInt(value, 16);
}

function mixRgb(left: number, right: number, amount: number): number {
  const mixChannel = (shift: number) => {
    const leftChannel = (left >> shift) & 0xff;
    const rightChannel = (right >> shift) & 0xff;
    return Math.round(leftChannel + (rightChannel - leftChannel) * amount);
  };

  return (mixChannel(16) << 16) + (mixChannel(8) << 8) + mixChannel(0);
}
