"use client";
import { use } from "react";
import Link from "next/link";
import { ChatWindow, useSession } from "@/features/learning";
import { Card } from "@/shared/ui/Card";
import { Spinner } from "@/shared/ui/Spinner";

interface Props {
  params: Promise<{ sessionId: string }>;
}

export default function SessionPage({ params }: Props) {
  const { sessionId } = use(params);
  const { session, loading, sending, error, send } = useSession(sessionId);

  if (loading) return <Spinner label="Cargando sesión..." />;
  if (error)
    return (
      <Card>
        <p className="text-sm text-red-600">{error}</p>
        <Link href="/learning" className="mt-2 inline-block text-sm text-blue-600">
          Volver
        </Link>
      </Card>
    );
  if (!session) return null;

  return (
    <div className="space-y-3">
      <Link href="/learning" className="text-sm text-blue-600 hover:underline">
        ← Volver a Learning
      </Link>
      <ChatWindow session={session} sending={sending} onSend={send} />
    </div>
  );
}
