import type { LevelingPlan, PlanEstado } from "@/shared/domain/types";
import { apiClient } from "@/shared/lib/apiClient";
import { listKeys, readJSON, writeJSON, removeKey } from "@/shared/lib/storage";
import type { PlanDraftInput } from "../types";

const PLAN_KEY = (id: string) => `plan:${id}`;

export const planningService = {
  async generatePlan(input: PlanDraftInput): Promise<LevelingPlan> {
    const plan = await apiClient.post<LevelingPlan>("/api/v1/plans/generate", {
      teacher_id: input.teacher_id,
      student_id: input.student_id,
      topic_ids: input.topic_ids,
      exams: input.exams.map((e) => ({
        student_id: e.student_id,
        file_name: e.file_name,
        file_content_base64: e.file_content_base64,
      })),
    });
    writeJSON(PLAN_KEY(plan.plan_id), plan);
    return plan;
  },

  async getPlan(plan_id: string): Promise<LevelingPlan | null> {
    return readJSON<LevelingPlan>(PLAN_KEY(plan_id));
  },

  async savePlan(plan: LevelingPlan): Promise<LevelingPlan> {
    const next: LevelingPlan = { ...plan, updated_at: new Date().toISOString() };
    writeJSON(PLAN_KEY(next.plan_id), next);
    return next;
  },

  async setEstado(plan_id: string, estado: PlanEstado): Promise<LevelingPlan | null> {
    const plan = readJSON<LevelingPlan>(PLAN_KEY(plan_id));
    if (!plan) return null;
    const next: LevelingPlan = {
      ...plan,
      estado,
      approved_at: estado === "approved" ? new Date().toISOString() : plan.approved_at,
      updated_at: new Date().toISOString(),
    };
    writeJSON(PLAN_KEY(plan_id), next);
    return next;
  },

  async listPlans(): Promise<LevelingPlan[]> {
    return listKeys("plan:")
      .map((k) => readJSON<LevelingPlan>(k))
      .filter((p): p is LevelingPlan => p !== null)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async deletePlan(plan_id: string): Promise<void> {
    removeKey(PLAN_KEY(plan_id));
  },
};
