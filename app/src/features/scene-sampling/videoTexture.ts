import {
  LinearFilter,
  SRGBColorSpace,
  VideoTexture,
  type Texture,
} from 'three';

const HAVE_CURRENT_DATA = 2;

export function createVideoTexture(video: HTMLVideoElement): VideoTexture {
  const texture = new VideoTexture(video);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;

  return texture;
}

export function disposeTexture(texture: Texture | null): void {
  texture?.dispose();
}

export function isRenderableVideo(video: HTMLVideoElement): boolean {
  return video.readyState >= HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0;
}
