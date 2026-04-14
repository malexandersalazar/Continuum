"use client";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { SessionState } from "@/shared/domain/types";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Textarea";
import { Spinner } from "@/shared/ui/Spinner";
import { MessageBubble } from "./MessageBubble";
import { GagneEventBadge } from "./GagneEventBadge";
import { FaceSignalIndicator } from "./FaceSignalIndicator";
import { useFaceSignal } from "../hooks/useFaceSignal";

interface Props {
  session: SessionState;
  sending: boolean;
  onSend: (message: string, face: ReturnType<typeof useFaceSignal>["signal"]) => void;
}

export function ChatWindow({ session, sending, onSend }: Props) {
  const [draft, setDraft] = useState("");
  const face = useFaceSignal();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.transcript.length]);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim() || sending) return;
    onSend(draft, face.signal);
    setDraft("");
  }

  return (
    <Card className="flex h-[70vh] flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-3 dark:border-gray-800">
        <div>
          <h2 className="text-base font-semibold">{session.topic_actual.titulo}</h2>
          <p className="text-xs text-gray-500">{session.topic_actual.notas_adaptacion || "Sesión en progreso"}</p>
        </div>
        <div className="flex items-center gap-2">
          <GagneEventBadge event={session.gagne_event_actual} />
          <FaceSignalIndicator signal={face.signal} enabled={face.enabled} />
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {session.transcript.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {sending && <Spinner label="El tutor está escribiendo..." />}
        <div ref={endRef} />
      </div>

      <form onSubmit={submit} className="flex items-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-800">
        <Textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe tu respuesta..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit(e);
            }
          }}
        />
        <Button type="submit" disabled={sending || !draft.trim()}>
          Enviar
        </Button>
      </form>
    </Card>
  );
}
