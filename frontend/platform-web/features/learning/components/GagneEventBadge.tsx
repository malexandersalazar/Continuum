import type { GagneEventId } from "@/shared/domain/types";
import { Badge } from "@/shared/ui/Badge";

const LABELS: Record<GagneEventId, string> = {
  1: "Ganar atención",
  2: "Informar objetivos",
  3: "Recordar previos",
  4: "Presentar contenido",
  5: "Guiar aprendizaje",
  6: "Práctica",
  7: "Retroalimentación",
  8: "Evaluación",
  9: "Transferencia",
};

export function GagneEventBadge({ event }: { event: GagneEventId }) {
  return (
    <Badge tone="blue">
      E{event} · {LABELS[event]}
    </Badge>
  );
}
