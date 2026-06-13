export type CameraState = 'idle' | 'requesting' | 'ready' | 'denied' | 'unsupported' | 'error';

export type CameraStartOptions = {
  constraints?: MediaStreamConstraints;
};

export type CameraSnapshot = {
  state: CameraState;
  stream: MediaStream | null;
  error: Error | null;
};

export type CameraStartResult =
  | { state: 'ready'; stream: MediaStream; error: null }
  | { state: Exclude<CameraState, 'ready'>; stream: null; error: Error | null };

type GetUserMedia = (constraints: MediaStreamConstraints) => Promise<MediaStream>;

type CameraControllerDependencies = {
  getUserMedia?: GetUserMedia;
};

const DEFAULT_CONSTRAINTS: MediaStreamConstraints = {
  audio: false,
  video: {
    facingMode: 'user',
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30, max: 60 },
  },
};

export function createCameraController(dependencies: CameraControllerDependencies = {}) {
  let state: CameraState = 'idle';
  let stream: MediaStream | null = null;
  let error: Error | null = null;

  return {
    async start(options: CameraStartOptions = {}): Promise<CameraStartResult> {
      const getUserMedia = resolveGetUserMedia(dependencies);

      if (!getUserMedia) {
        const unsupportedState = 'unsupported';
        state = unsupportedState;
        stream = null;
        error = new Error('Camera API is not available in this browser.');
        return { state: unsupportedState, stream, error };
      }

      state = 'requesting';
      error = null;

      try {
        stream = await getUserMedia(options.constraints ?? DEFAULT_CONSTRAINTS);
        state = 'ready';
        return { state, stream, error: null };
      } catch (caught) {
        stopMediaStream(stream);
        stream = null;
        error = normalizeCameraError(caught);
        const failedState = mapCameraErrorToState(error);
        state = failedState;

        return { state: failedState, stream, error };
      }
    },

    stop(): void {
      stopMediaStream(stream);
      stream = null;
      state = 'idle';
      error = null;
    },

    getSnapshot(): CameraSnapshot {
      return { state, stream, error };
    },
  };
}

function resolveGetUserMedia(
  dependencies: CameraControllerDependencies,
): GetUserMedia | undefined {
  if ('getUserMedia' in dependencies) {
    return dependencies.getUserMedia;
  }

  if (typeof navigator === 'undefined') {
    return undefined;
  }

  return navigator.mediaDevices?.getUserMedia.bind(navigator.mediaDevices);
}

function stopMediaStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

function normalizeCameraError(caught: unknown): Error {
  if (caught instanceof Error) {
    return caught;
  }

  return new Error(String(caught));
}

function mapCameraErrorToState(error: Error): Exclude<CameraState, 'ready'> {
  if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
    return 'denied';
  }

  return 'error';
}
