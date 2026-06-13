import type {
  LightSheetGestureState,
  TrackedHand,
} from '../../shared/runtime/types';
import { deriveGestureAnchorFrame } from '../gesture-anchor-frame/anchorFrame';
import { getLightSheetStylePreset } from '../light-sheet-styles/presets';

type DeriveGestureStateInput = {
  hands: TrackedHand[];
  requestedPresetId?: string;
};

const CARDS_STYLE_OPENNESS_MAX = 0.35;
const ORGANIC_STYLE_OPENNESS_MIN = 0.72;

export function deriveLightSheetGestureState(
  input: DeriveGestureStateInput,
): LightSheetGestureState {
  const anchorFrame = deriveGestureAnchorFrame(input.hands);

  if (anchorFrame.mode !== 'two-hand' || !anchorFrame.left || !anchorFrame.right) {
    return createHiddenGestureState(input.requestedPresetId);
  }

  const stylePresetId = getResolvedStylePresetId(
    input.requestedPresetId,
    [anchorFrame.openness],
  );

  return {
    mode: 'two-hand-sheet',
    confidence: anchorFrame.confidence,
    stylePresetId,
    anchors: {
      left: anchorFrame.left.point,
      right: anchorFrame.right.point,
    },
    openness: anchorFrame.openness,
    rotation: anchorFrame.rotation,
  };
}

function createHiddenGestureState(requestedPresetId: string | undefined): LightSheetGestureState {
  return {
    mode: 'hidden',
    confidence: 0,
    stylePresetId: getResolvedStylePresetId(requestedPresetId, []),
    anchors: { left: { x: 0.5, y: 0.5 } },
    openness: 0,
    rotation: 0,
  };
}

function getResolvedStylePresetId(
  requestedPresetId: string | undefined,
  opennessValues: number[],
): string {
  if (requestedPresetId !== undefined) {
    return getLightSheetStylePreset(requestedPresetId).id;
  }

  if (opennessValues.length === 0) {
    return 'blueprint';
  }

  const averageOpenness = opennessValues.reduce((sum, value) => sum + value, 0) / opennessValues.length;

  if (averageOpenness < CARDS_STYLE_OPENNESS_MAX) {
    return 'cards';
  }

  if (averageOpenness > ORGANIC_STYLE_OPENNESS_MIN) {
    return 'organic';
  }

  return 'blueprint';
}
