"use client";
import { kbByModule } from "@/shared/domain/knowledgeBase";
import { Card } from "@/shared/ui/Card";
import { Badge } from "@/shared/ui/Badge";
import { cn } from "@/shared/lib/cn";

interface Props {
  selected: string[];
  onToggle: (topic_id: string) => void;
}

export function TopicTree({ selected, onToggle }: Props) {
  const groups = kbByModule();
  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([group, topics]) => (
        <Card key={group}>
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">{group}</h3>
          <ul className="space-y-2">
            {topics.map((t) => {
              const isSelected = selected.includes(t.topic_id);
              return (
                <li key={t.topic_id}>
                  <button
                    type="button"
                    onClick={() => onToggle(t.topic_id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors",
                      isSelected
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                        : "border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="mt-1 h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{t.titulo}</div>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                        {t.secciones.concepto}
                      </p>
                      {t.prerequisitos.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {t.prerequisitos.map((p) => (
                            <Badge key={p} tone="gray">
                              ← {p}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>
      ))}
    </div>
  );
}
