"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LevelingPlan } from "@/shared/domain/types";
import { planningService } from "@/features/planning";
import { TopicBrowser, learningService } from "@/features/learning";
import { Card } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { Badge } from "@/shared/ui/Badge";
import { Spinner } from "@/shared/ui/Spinner";

export default function LearningPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<LevelingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    (async () => {
      const all = await planningService.listPlans();
      setPlans(all.filter((p) => p.estado === "approved" || p.estado === "active"));
      setLoading(false);
    })();
  }, []);

  async function startFromPlan(planId: string) {
    setStarting(true);
    const session = await learningService.startSessionFromPlan(planId);
    router.push(`/learning/session/${session.session_id}`);
  }

  async function startFree(topic_id: string) {
    setStarting(true);
    const session = await learningService.startFreeSession(topic_id);
    router.push(`/learning/session/${session.session_id}`);
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Nivelaciones asignadas</h2>
        {loading ? (
          <Spinner />
        ) : plans.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No tienes nivelaciones asignadas. Puedes explorar libremente la Knowledge Base abajo.
            </p>
          </Card>
        ) : (
          <ul className="space-y-2">
            {plans.map((p) => (
              <li key={p.plan_id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Plan para {p.student_id}</span>
                      <Badge tone={p.estado === "active" ? "green" : "blue"}>{p.estado}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {p.topics.length} tema(s) · creado{" "}
                      {new Date(p.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Button disabled={starting} onClick={() => startFromPlan(p.plan_id)}>
                    {p.estado === "active" ? "Continuar" : "Comenzar"}
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold">Explorar libremente</h2>
        <TopicBrowser onStart={startFree} disabled={starting} />
      </section>
    </div>
  );
}
