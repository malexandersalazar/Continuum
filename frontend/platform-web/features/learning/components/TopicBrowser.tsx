"use client";
import { kbByModule } from "@/shared/domain/knowledgeBase";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";

interface Props {
  onStart: (topic_id: string) => void;
  disabled?: boolean;
}

export function TopicBrowser({ onStart, disabled }: Props) {
  const groups = kbByModule();
  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([group, topics]) => (
        <Card key={group}>
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">{group}</h3>
          <ul className="space-y-2">
            {topics.map((t) => (
              <li
                key={t.topic_id}
                className="flex items-center justify-between gap-3 rounded-md border border-gray-200 p-3 dark:border-gray-800"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium">{t.titulo}</div>
                  <p className="line-clamp-1 text-xs text-gray-600 dark:text-gray-400">
                    {t.secciones.concepto}
                  </p>
                </div>
                <Button variant="secondary" disabled={disabled} onClick={() => onStart(t.topic_id)}>
                  Explorar
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
