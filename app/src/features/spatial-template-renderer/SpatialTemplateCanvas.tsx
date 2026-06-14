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
import type { SpatialTemplateMaterialId } from '../spatial-template-model/types';
import { resolveSpatialTemplateMaterialSettings } from './materialSettings';
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

const MATERIAL_SLOT_IDS: SpatialTemplateMaterialId[] = [
  'scene',
  'panel',
  'back',
  'accent',
  'cap',
  'edge',
  'strip-ab',
  'strip-bc',
  'strip-cd',
  'strip-de',
  'strip-ea',
];

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
  refs.materials.forEach((material, index) => {
    const settings = resolveSpatialTemplateMaterialSettings(
      MATERIAL_SLOT_IDS[index] ?? 'scene',
      renderInput.style,
      renderInput.mesh.opacity,
    );
    material.map = settings.usesVideoTexture ? refs.texture : null;
    material.color.setHex(settings.color);
    material.opacity = settings.opacity;
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
