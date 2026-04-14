import type { ChatMessage } from "@/shared/domain/types";
import { Badge } from "@/shared/ui/Badge";
import { cn } from "@/shared/lib/cn";

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isStudent = message.role === "student";
  return (
    <div className={cn("flex w-full", isStudent ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
          isStudent
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-gray-100 text-gray-900 rounded-bl-sm dark:bg-gray-800 dark:text-gray-100",
        )}
      >
        {!isStudent && message.gagne_event && (
          <div className="mb-1">
            <Badge tone="blue">Evento E{message.gagne_event}</Badge>
          </div>
        )}
        {message.text}
      </div>
    </div>
  );
}
