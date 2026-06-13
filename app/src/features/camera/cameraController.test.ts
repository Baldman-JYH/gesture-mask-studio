import { describe, expect, it, vi } from 'vitest';
import { createCameraController } from './cameraController';

describe('createCameraController', () => {
  it('returns denied state when camera permission is denied', async () => {
    const controller = createCameraController({
      getUserMedia: () =>
        Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })),
    });

    const result = await controller.start();

    expect(result.state).toBe('denied');
  });

  it('returns unsupported state when getUserMedia is unavailable', async () => {
    const controller = createCameraController({
      getUserMedia: undefined,
    });

    const result = await controller.start();

    expect(result.state).toBe('unsupported');
  });

  it('stops active tracks and resets to idle', async () => {
    const stop = vi.fn();
    const stream = {
      getTracks: () => [{ stop }],
    } as unknown as MediaStream;
    const controller = createCameraController({
      getUserMedia: () => Promise.resolve(stream),
    });

    await controller.start();
    controller.stop();

    expect(stop).toHaveBeenCalledTimes(1);
    expect(controller.getSnapshot()).toEqual({ state: 'idle', stream: null, error: null });
  });
});
