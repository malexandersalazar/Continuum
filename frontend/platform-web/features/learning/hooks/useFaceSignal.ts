"use client";
import type { FaceSignal } from "@/shared/domain/types";

// STUB — real MediaPipe integration will replace this hook later.
// Returns null consistently; UI shows "Cámara desactivada".
export function useFaceSignal(): { signal: FaceSignal | null; enabled: boolean } {
  return { signal: null, enabled: false };
}
