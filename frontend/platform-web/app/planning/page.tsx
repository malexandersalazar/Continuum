"use client";
import { useRouter } from "next/navigation";
import { ExamUploader, TopicTree, usePlanDraft } from "@/features/planning";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";

export default function PlanningPage() {
  const router = useRouter();
  const draft = usePlanDraft();

  async function handleGenerate() {
    const plan = await draft.generate();
    if (plan) router.push(`/planning/review?plan_id=${plan.plan_id}`);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">1. Selecciona los temas evaluados</h2>
        <TopicTree selected={draft.selectedTopics} onToggle={draft.toggleTopic} />
      </div>
      <aside className="space-y-4">
        <h2 className="text-lg font-semibold">2. Adjunta evaluaciones</h2>
        <ExamUploader
          studentId={draft.studentId}
          onStudentIdChange={draft.setStudentId}
          exams={draft.exams}
          onAdd={draft.addExams}
          onRemove={draft.removeExam}
        />
        <Card>
          <h3 className="text-sm font-semibold">Resumen</h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li>Temas seleccionados: {draft.selectedTopics.length}</li>
            <li>Exámenes adjuntos: {draft.exams.length}</li>
            <li>Alumno: {draft.studentId || "—"}</li>
          </ul>
          {draft.error && <p className="mt-2 text-sm text-red-600">{draft.error}</p>}
          <Button
            className="mt-4 w-full"
            onClick={handleGenerate}
            disabled={draft.submitting || draft.selectedTopics.length === 0}
          >
            {draft.submitting ? "Generando..." : "Generar plan"}
          </Button>
        </Card>
      </aside>
    </div>
  );
}
