import type { FaceSignal } from "@/shared/domain/types";
import { Badge } from "@/shared/ui/Badge";

export function FaceSignalIndicator({ signal, enabled }: { signal: FaceSignal | null; enabled: boolean }) {
  if (!enabled) return <Badge tone="gray">Cámara desactivada</Badge>;
  if (!signal) return <Badge tone="gray">Esperando señal...</Badge>;
  const tone = signal.state === "engaged" ? "green" : signal.state === "confused" ? "amber" : "gray";
  return (
    <Badge tone={tone}>
      Rostro: {signal.state} ({Math.round(signal.confidence * 100)}%)
    </Badge>
  );
}
