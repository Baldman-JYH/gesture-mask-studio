import { describe, expect, it } from 'vitest';
import { resolveVisionFileset } from './visionFileset';

describe('resolveVisionFileset', () => {
  it('reuses the pending vision fileset for the same wasm base URL', async () => {
    let calls = 0;
    const fileset = {};
    const resolver = async () => {
      calls += 1;
      return fileset;
    };

    const [first, second] = await Promise.all([
      resolveVisionFileset('test://shared-wasm-a', resolver),
      resolveVisionFileset('test://shared-wasm-a', resolver),
    ]);

    expect(first).toBe(fileset);
    expect(second).toBe(fileset);
    expect(calls).toBe(1);
  });

  it('keeps different wasm base URLs isolated', async () => {
    let calls = 0;
    const resolver = async (baseUrl: string) => {
      calls += 1;
      return { baseUrl };
    };

    const first = await resolveVisionFileset('test://shared-wasm-b', resolver);
    const second = await resolveVisionFileset('test://shared-wasm-c', resolver);

    expect(first).toEqual({ baseUrl: 'test://shared-wasm-b' });
    expect(second).toEqual({ baseUrl: 'test://shared-wasm-c' });
    expect(calls).toBe(2);
  });
});
