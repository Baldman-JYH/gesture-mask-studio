import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createCameraController, type CameraState } from '../features/camera/cameraController';
import { toDisplayHands } from '../features/coordinate-space/displaySpace';
import { stabilizeTrackedFaceRoi, type FaceRoi } from '../features/face-texture/faceTextureSource';
import { createMediaPipeFaceTracker, type FaceTracker } from '../features/face-tracking/faceTracker';
import { deriveGestureAnchorFrame, getGestureAnchorHandCount } from '../features/gesture-anchor-frame/anchorFrame';
import { deriveLightSheetGestureState } from '../features/gesture-engine/gestureState';
import { createMediaPipeHandTracker, type HandTracker } from '../features/hand-tracking/handTracker';
import { LIGHT_SHEET_STYLE_PRESETS, getLightSheetStylePreset } from '../features/light-sheet-styles/presets';
import { isRenderableVideo } from '../features/scene-sampling/screenSpaceSampling';
import { createSpatialTemplateRenderInput, type SpatialTemplateRenderInput } from '../features/spatial-template-renderer/renderInput';
import {
  resolveRenderInputForUnavailableVideoFrame,
  stabilizeSpatialTemplateFrame,
  type SpatialTemplateStabilizerState,
} from '../features/spatial-template-renderer/renderStabilizer';
import type { TemplateState } from '../features/template-state/types';
import type { TrackedHand, TrackingState } from '../shared/runtime/types';
import { ControlDock } from './ControlDock';
import { PermissionOverlay } from './PermissionOverlay';
import { TopStatusBar } from './TopStatusBar';

const SpatialTemplateCanvas = lazy(() =>
  import('../features/spatial-template-renderer/SpatialTemplateCanvas').then((module) => ({
    default: module.SpatialTemplateCanvas,
  })),
);

export function CameraStage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controllerRef = useRef(createCameraController());
  const trackerRef = useRef<HandTracker | null>(null);
  const faceTrackerRef = useRef<FaceTracker | null>(null);
  const trackerRequestIdRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const activePresetIdRef = useRef(LIGHT_SHEET_STYLE_PRESETS[0].id);
  const mirroredRef = useRef(true);
  const stabilizerStateRef = useRef<SpatialTemplateStabilizerState | null>(null);
  const templateStateRef = useRef<TemplateState | null>(null);
  const faceRoiRef = useRef<FaceRoi | null>(null);

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

    if (!video) {
      stabilizerStateRef.current = null;
      templateStateRef.current = null;
      faceRoiRef.current = null;
      setRenderInput(null);
      animationFrameRef.current = requestAnimationFrame(runFrame);
      return;
    }

    if (!isRenderableVideo(video)) {
      setRenderInput(resolveRenderInputForUnavailableVideoFrame(stabilizerStateRef.current));
      animationFrameRef.current = requestAnimationFrame(runFrame);
      return;
    }

    const timestampMs = performance.now();
    faceRoiRef.current = stabilizeTrackedFaceRoi(
      faceRoiRef.current,
      detectFaceRoi(faceTrackerRef.current, video, timestampMs),
      0.35,
    );
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
    const activeHandCount = getGestureAnchorHandCount(anchorFrame);
    setHandsCount(activeHandCount);

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
      activeHandCount,
      previousTemplateState: templateStateRef.current,
      faceRoi: faceRoiRef.current ?? undefined,
    });
    templateStateRef.current = nextRenderInput.templateState;
    const stabilizedState = stabilizeSpatialTemplateFrame(
      stabilizerStateRef.current,
      {
        ...nextRenderInput,
        scene: {
          video,
          mirrored: mirroredRef.current,
          viewport,
        },
      },
    );
    stabilizerStateRef.current = stabilizedState;
    setRenderInput(stabilizedState.renderInput);

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

    createMediaPipeFaceTracker()
      .then((tracker) => {
        if (
          trackerRequestIdRef.current !== trackerRequestId ||
          controllerRef.current.getSnapshot().state !== 'ready'
        ) {
          tracker.close();
          return;
        }

        faceTrackerRef.current = tracker;
      })
      .catch(() => {
        if (
          trackerRequestIdRef.current !== trackerRequestId ||
          controllerRef.current.getSnapshot().state !== 'ready'
        ) {
          return;
        }

        faceTrackerRef.current = null;
      });

    startRenderLoop();
  }, [startRenderLoop]);

  const stopCamera = useCallback(() => {
    trackerRequestIdRef.current += 1;
    stopRenderLoop();
    trackerRef.current?.close();
    trackerRef.current = null;
    faceTrackerRef.current?.close();
    faceTrackerRef.current = null;
    controllerRef.current.stop();

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraState('idle');
    setTrackingState('idle');
    setHandsCount(0);
    stabilizerStateRef.current = null;
    templateStateRef.current = null;
    faceRoiRef.current = null;
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
        <PermissionOverlay
          cameraState={cameraState}
          trackingState={trackingState}
          message={message}
        />
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

function detectFaceRoi(
  tracker: FaceTracker | null,
  video: HTMLVideoElement,
  timestampMs: number,
): FaceRoi | null {
  if (!tracker) {
    return null;
  }

  try {
    return tracker.detect(video, timestampMs);
  } catch {
    return null;
  }
}
