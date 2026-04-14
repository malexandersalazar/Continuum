"use client";
import type { LevelingPlan, TopicPlanEntry } from "@/shared/domain/types";
import { Card } from "@/shared/ui/Card";
import { TopicPlanCard } from "./TopicPlanCard";

interface Props {
  plan: LevelingPlan;
  onChange: (next: LevelingPlan) => void;
}

export function PlanDraftReview({ plan, onChange }: Props) {
  function updateTopic(idx: number, next: TopicPlanEntry) {
    onChange({
      ...plan,
      topics: plan.topics.map((t, i) => (i === idx ? next : t)),
    });
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div>
            <span className="text-gray-500">Plan ID:</span> <span className="font-mono">{plan.plan_id}</span>
          </div>
          <div>
            <span className="text-gray-500">Alumno:</span> {plan.student_id}
          </div>
          <div>
            <span className="text-gray-500">Estado:</span> {plan.estado}
          </div>
          <div>
            <span className="text-gray-500">Temas:</span> {plan.topics.length}
          </div>
        </div>
      </Card>
      {plan.topics.map((entry, idx) => (
        <TopicPlanCard key={entry.topic_id} entry={entry} onChange={(next) => updateTopic(idx, next)} />
      ))}
    </div>
  );
}
