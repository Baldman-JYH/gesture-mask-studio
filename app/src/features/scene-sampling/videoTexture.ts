import { LinearFilter, SRGBColorSpace, VideoTexture, type Texture } from 'three';

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
