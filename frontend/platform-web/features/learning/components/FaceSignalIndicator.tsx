import type { FaceSignal } from "@/shared/domain/types";
import { Badge } from "@/shared/ui/Badge";

const STATE_TONE: Record<NonNullable<FaceSignal["state"]>, "green" | "amber" | "gray"> = {
  engaged: "green",
  neutral: "gray",
  sleepy: "amber",
  confused: "amber",
  frustrated: "amber",
};

export function FaceSignalIndicator({ signal, enabled }: { signal: FaceSignal | null; enabled: boolean }) {
  if (!enabled) return <Badge tone="gray">Cámara desactivada</Badge>;
  if (!signal) return <Badge tone="gray">Esperando señal...</Badge>;

  const tone = STATE_TONE[signal.state] ?? "gray";
  const earLabel = signal.metrics?.ear !== undefined ? ` · EAR ${signal.metrics.ear.toFixed(2)}` : "";

  return (
    <Badge tone={tone}>
      Rostro: {signal.state} ({Math.round(signal.confidence * 100)}%){earLabel}
    </Badge>
  );
}
