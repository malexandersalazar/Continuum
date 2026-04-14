"use client";
import type { GagneEventId, TopicPlanEntry } from "@/shared/domain/types";
import { Card } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { Textarea } from "@/shared/ui/Textarea";

const ALL_EVENTS: GagneEventId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

interface Props {
  entry: TopicPlanEntry;
  onChange: (next: TopicPlanEntry) => void;
}

export function TopicPlanCard({ entry, onChange }: Props) {
  function toggleEvent(ev: GagneEventId) {
    const has = entry.gagne_sequence.includes(ev);
    const nextSeq = has
      ? entry.gagne_sequence.filter((e) => e !== ev)
      : [...entry.gagne_sequence, ev].sort((a, b) => a - b) as GagneEventId[];
    onChange({ ...entry, gagne_sequence: nextSeq });
  }

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{entry.titulo}</h3>
            <Badge tone={entry.prioridad === 1 ? "red" : entry.prioridad === 2 ? "amber" : "gray"}>
              Prioridad {entry.prioridad}
            </Badge>
            {entry.nivel_carga !== "normal" && (
              <Badge tone="blue">Carga {entry.nivel_carga}</Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{entry.error_descripcion}</p>
        </div>
      </div>
      <div className="mt-3">
        <span className="block text-xs font-medium text-gray-600 dark:text-gray-400">Eventos de Gagné</span>
        <div className="mt-2 flex flex-wrap gap-1">
          {ALL_EVENTS.map((ev) => {
            const active = entry.gagne_sequence.includes(ev);
            return (
              <button
                key={ev}
                type="button"
                onClick={() => toggleEvent(ev)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                E{ev}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Notas de adaptación
          </span>
          <Textarea
            rows={4}
            value={entry.notas_adaptacion}
            onChange={(e) => onChange({ ...entry, notas_adaptacion: e.target.value })}
          />
        </label>
      </div>
    </Card>
  );
}
