"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { LevelingPlan } from "@/shared/domain/types";
import { PlanDraftReview, planningService } from "@/features/planning";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Spinner } from "@/shared/ui/Spinner";

function ReviewInner() {
  const router = useRouter();
  const params = useSearchParams();
  const planId = params.get("plan_id");
  const [plan, setPlan] = useState<LevelingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!planId) return;
    (async () => {
      const p = await planningService.getPlan(planId);
      setPlan(p);
      setLoading(false);
    })();
  }, [planId]);

  async function handleApprove() {
    if (!plan) return;
    setSaving(true);
    await planningService.savePlan(plan);
    await planningService.setEstado(plan.plan_id, "approved");
    setSaving(false);
    router.push("/planning");
  }

  if (!planId) return <Card>Falta plan_id en la URL.</Card>;
  if (loading) return <Spinner label="Cargando plan..." />;
  if (!plan) return <Card>Plan no encontrado.</Card>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">3. Revisa y aprueba el plan</h2>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => router.push("/planning")}>
            Cancelar
          </Button>
          <Button onClick={handleApprove} disabled={saving}>
            {saving ? "Guardando..." : "Aprobar plan"}
          </Button>
        </div>
      </div>
      <PlanDraftReview plan={plan} onChange={setPlan} />
    </div>
  );
}

export default function PlanningReviewPage() {
  return (
    <Suspense fallback={<Spinner label="Cargando plan..." />}>
      <ReviewInner />
    </Suspense>
  );
}
