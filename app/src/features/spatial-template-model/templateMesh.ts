import type { TrackedHand } from '../../shared/runtime/types';
import { deriveGestureAnchorFrame, getGestureAnchorHandCount } from '../gesture-anchor-frame/anchorFrame';
import { extractHandTopologyFrame } from '../hand-topology/handTopology';
import { deriveTemplateState } from '../template-state/deriveTemplateState';
import type { FingertipQuality, TemplateState } from '../template-state/types';
import { buildReferenceTemplateMesh } from './referenceTemplateMesh';
import type { SpatialTemplateMesh } from './types';

export type SpatialTemplateBuildOptions = {
  activeHandCount?: number;
  previousTemplateState?: TemplateState | null;
  timestampMs?: number;
};

export type SpatialTemplateBuildResult = {
  mesh: SpatialTemplateMesh;
  templateState: TemplateState;
};

export function buildSpatialTemplateFromHands(
  hands: TrackedHand[],
  options: SpatialTemplateBuildOptions = {},
): SpatialTemplateBuildResult {
  const anchorFrame = deriveGestureAnchorFrame(hands);
  const topologyFrame = extractHandTopologyFrame(hands);
  const activeHandCount = options.activeHandCount ?? getGestureAnchorHandCount(anchorFrame);
  const templateState = deriveTemplateState({
    activeHandCount,
    leftAnchor: anchorFrame.left?.point ?? anchorFrame.primary?.point,
    rightAnchor: anchorFrame.right?.point,
    projectedHeight: estimateProjectedHeight(topologyFrame),
    fingertipQuality: deriveFingertipQuality(activeHandCount, topologyFrame),
    timestampMs: options.timestampMs ?? 0,
    previous: options.previousTemplateState ?? null,
  });

  return {
    mesh: buildReferenceTemplateMesh(templateState),
    templateState,
  };
}

export function buildSpatialTemplateMeshFromHands(hands: TrackedHand[]): SpatialTemplateMesh {
  return buildSpatialTemplateFromHands(hands).mesh;
}

function deriveFingertipQuality(
  activeHandCount: number,
  topologyFrame: ReturnType<typeof extractHandTopologyFrame>,
): FingertipQuality {
  if (activeHandCount === 0) {
    return 'missing';
  }

  if (topologyFrame.mode === 'hidden') {
    return 'invalid';
  }

  return 'valid';
}

function estimateProjectedHeight(
  topologyFrame: ReturnType<typeof extractHandTopologyFrame>,
): number | undefined {
  const points = topologyFrame.hands.flatMap((hand) => Object.values(hand.fingertips));

  if (points.length === 0) {
    return undefined;
  }

  const yValues = points.map((point) => point.y);
  return Math.max(...yValues) - Math.min(...yValues);
}
