type VisionFilesetResolver<T> = (wasmBaseUrl: string) => Promise<T>;

const visionFilesetCache = new Map<string, Promise<unknown>>();

export function resolveVisionFileset<T>(
  wasmBaseUrl: string,
  resolver: VisionFilesetResolver<T>,
): Promise<T> {
  const cached = visionFilesetCache.get(wasmBaseUrl) as Promise<T> | undefined;
  if (cached) {
    return cached;
  }

  const pending = resolver(wasmBaseUrl);
  visionFilesetCache.set(wasmBaseUrl, pending);
  return pending;
}
