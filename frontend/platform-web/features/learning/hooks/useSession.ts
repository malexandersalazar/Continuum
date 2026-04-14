"use client";
import { useCallback, useEffect, useState } from "react";
import type { FaceSignal, SessionState } from "@/shared/domain/types";
import { learningService } from "../services/learningService";

export function useSession(session_id: string) {
  const [session, setSession] = useState<SessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await learningService.getSession(session_id);
        if (cancelled) return;
        if (!s) {
          setError("Sesión no encontrada.");
          setLoading(false);
          return;
        }
        setSession(s);
        if (s.transcript.length === 0) {
          const primed = await learningService.primeOpening(session_id);
          if (!cancelled && primed) setSession(primed.session);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session_id]);

  const send = useCallback(
    async (message: string, face: FaceSignal | null) => {
      if (!session || !message.trim()) return;
      setSending(true);
      try {
        const res = await learningService.postTurn(session.session_id, message, face);
        setSession(res.session);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al enviar turno");
      } finally {
        setSending(false);
      }
    },
    [session],
  );

  return { session, loading, sending, error, send };
}
