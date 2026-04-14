/**
 * FaceStateClassifier — maps analysis results to a FaceState + confidence.
 *
 * Currently only uses EAR-based drowsiness.
 * Future expansion points are marked with TODO comments.
 */

import type { FaceState } from "@/shared/domain/types";
import type { DrowsinessResult } from "./drowsinessAnalyzer";

export interface FaceClassification {
  state: FaceState;
  confidence: number;
}

// TODO: extend with headPose input when head-angle detection is implemented.
// TODO: extend with blendshapes input for confused/frustrated detection.
export interface ClassifierInput {
  drowsiness: DrowsinessResult;
}

/**
 * Classify FaceState from available signal analysis results.
 *
 * Priority: sleepy > engaged > neutral
 * States "confused" and "frustrated" are reserved for future signal sources (blendshapes, text-face fusion).
 */
export function classifyFaceState({ drowsiness }: ClassifierInput): FaceClassification {
  if (drowsiness.isDrowsy) {
    // Scale confidence with how much low-EAR time has accumulated
    const ratio = Math.min(
      1,
      drowsiness.lowEarAccumulatedMs / (drowsiness.windowMs * 0.5),
    );
    return { state: "sleepy", confidence: 0.5 + ratio * 0.5 };
  }

  if (drowsiness.avgEAR > 0.22) {
    const marginAbove = Math.min(drowsiness.avgEAR - 0.22, 0.2);
    const confidence = 0.5 + (marginAbove / 0.2) * 0.5;
    return { state: "engaged", confidence };
  }

  return { state: "neutral", confidence: 0.6 };
}
