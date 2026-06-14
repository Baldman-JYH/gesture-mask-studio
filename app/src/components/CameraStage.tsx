import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createCameraController, type CameraState } from '../features/camera/cameraController';
import { toDisplayHands } from '../features/coordinate-space/displaySpace';
import { deriveGestureAnchorFrame, getGestureAnchorHandCount } from '../features/gesture-anchor-frame/anchorFrame';
import { deriveLightSheetGestureState } from '../features/gesture-engine/gestureState';
import { createMediaPipeHandTracker, type HandTracker } from '../features/hand-tracking/handTracker';
import { LIGHT_SHEET_STYLE_PRESETS, getLightSheetStylePreset } from '../features/light-sheet-styles/presets';
import { isRenderableVideo } from '../features/scene-sampling/screenSpaceSampling';
import { createSpatialTemplateRenderInput, type SpatialTemplateRenderInput } from '../features/spatial-template-renderer/renderInput';
import type { TrackedHand } from '../shared/runtime/types';
import { ControlDock } from './ControlDock';
import { PermissionOverlay } from './PermissionOverlay';
import { TopStatusBar, type TrackingState } from './TopStatusBar';

const SpatialTemplateCanvas = lazy(() =>
  import('../features/spatial-template-renderer/SpatialTemplateCanvas').then((module) => ({
    default: module.SpatialTemplateCanvas,
  })),
);

export function CameraStage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controllerRef = useRef(createCameraController());
  const trackerRef = useRef<HandTracker | null>(null);
  const trackerRequestIdRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const activePresetIdRef = useRef(LIGHT_SHEET_STYLE_PRESETS[0].id);
  const mirroredRef = useRef(true);

  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  const [handsCount, setHandsCount] = useState(0);
  const [activePresetId, setActivePresetId] = useState(LIGHT_SHEET_STYLE_PRESETS[0].id);
  const [mirrored, setMirrored] = useState(true);
  const [renderInput, setRenderInput] = useState<SpatialTemplateRenderInput | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    mirroredRef.current = mirrored;
  }, [mirrored]);

  const stopRenderLoop = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const runFrame = useCallback(() => {
    const video = videoRef.current;

    if (!video || !isRenderableVideo(video)) {
      setRenderInput(null);
      animationFrameRef.current = requestAnimationFrame(runFrame);
      return;
    }

    const timestampMs = performance.now();
    const hands = detectHands(trackerRef.current, video, timestampMs);
    const viewport = {
      width: video.clientWidth || video.videoWidth,
      height: video.clientHeight || video.videoHeight,
    };
    const videoSize = {
      width: video.videoWidth,
      height: video.videoHeight,
    };
    const displayHands = toDisplayHands(hands, mirroredRef.current, {
      viewport,
      video: videoSize,
    });
    const anchorFrame = deriveGestureAnchorFrame(displayHands);
    setHandsCount(getGestureAnchorHandCount(anchorFrame));

    const gestureState = deriveLightSheetGestureState({
      hands: displayHands,
    });
    const activePreset = getLightSheetStylePreset(gestureState.stylePresetId);

    if (activePresetIdRef.current !== activePreset.id) {
      activePresetIdRef.current = activePreset.id;
      setActivePresetId(activePreset.id);
    }

    const nextRenderInput = createSpatialTemplateRenderInput({
      displayHands,
      video,
      mirrored: mirroredRef.current,
      style: activePreset,
      timestampMs,
    });

    setRenderInput(nextRenderInput.mesh.mode === 'hidden' ? null : {
      ...nextRenderInput,
      scene: {
        video,
        mirrored: mirroredRef.current,
        viewport,
      },
    });

    animationFrameRef.current = requestAnimationFrame(runFrame);
  }, []);

  const startRenderLoop = useCallback(() => {
    stopRenderLoop();
    animationFrameRef.current = requestAnimationFrame(runFrame);
  }, [runFrame, stopRenderLoop]);

  const startCamera = useCallback(async () => {
    setCameraState('requesting');
    setMessage(null);

    const result = await controllerRef.current.start();
    setCameraState(result.state);

    if (result.state !== 'ready') {
      setRenderInput(null);
      setTrackingState('idle');
      setHandsCount(0);
      setMessage(result.error?.message ?? null);
      return;
    }

    const video = videoRef.current;
    if (video) {
      video.srcObject = result.stream;
      await video.play().catch(() => undefined);
    }

    setTrackingState('loading');
    const trackerRequestId = trackerRequestIdRef.current + 1;
    trackerRequestIdRef.current = trackerRequestId;

    createMediaPipeHandTracker()
      .then((tracker) => {
        if (
          trackerRequestIdRef.current !== trackerRequestId ||
          controllerRef.current.getSnapshot().state !== 'ready'
        ) {
          tracker.close();
          return;
        }

        trackerRef.current = tracker;
        setTrackingState('ready');
      })
      .catch(() => {
        if (
          trackerRequestIdRef.current !== trackerRequestId ||
          controllerRef.current.getSnapshot().state !== 'ready'
        ) {
          return;
        }

        trackerRef.current = null;
        setTrackingState('unavailable');
      });

    startRenderLoop();
  }, [startRenderLoop]);

  const stopCamera = useCallback(() => {
    trackerRequestIdRef.current += 1;
    stopRenderLoop();
    trackerRef.current?.close();
    trackerRef.current = null;
    controllerRef.current.stop();

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraState('idle');
    setTrackingState('idle');
    setHandsCount(0);
    setRenderInput(null);
    setMessage(null);
  }, [stopRenderLoop]);

  useEffect(() => stopCamera, [stopCamera]);

  const activePreset = getLightSheetStylePreset(activePresetId);

  return (
    <main className="app-shell">
      <TopStatusBar
        cameraState={cameraState}
        trackingState={trackingState}
        handsCount={handsCount}
      />

      <section className="camera-stage" aria-label="Realtime camera stage">
        <video
          ref={videoRef}
          className="camera-video"
          data-mirrored={mirrored}
          playsInline
          muted
        />
        {renderInput ? (
          <Suspense fallback={<div className="light-sheet-canvas" aria-hidden="true" />}>
            <SpatialTemplateCanvas renderInput={renderInput} className="light-sheet-canvas" />
          </Suspense>
        ) : (
          <div className="light-sheet-canvas" aria-hidden="true" />
        )}
        <div className="stage-grid" aria-hidden="true" />
        <PermissionOverlay cameraState={cameraState} message={message} />
      </section>

      <ControlDock
        cameraState={cameraState}
        activePreset={activePreset}
        mirrored={mirrored}
        onStartCamera={startCamera}
        onStopCamera={stopCamera}
        onToggleMirror={() => setMirrored((value) => !value)}
      />
    </main>
  );
}

function detectHands(
  tracker: HandTracker | null,
  video: HTMLVideoElement,
  timestampMs: number,
): TrackedHand[] {
  if (!tracker) {
    return [];
  }

  try {
    return tracker.detect(video, timestampMs);
  } catch {
    return [];
  }
}
