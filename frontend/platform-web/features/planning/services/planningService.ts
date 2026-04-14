import type { LevelingPlan, PlanEstado } from "@/shared/domain/types";
import { apiClient, ApiError } from "@/shared/lib/apiClient";
import type { PlanDraftInput } from "../types";

export const planningService = {
  async generatePlan(input: PlanDraftInput): Promise<LevelingPlan> {
    return apiClient.post<LevelingPlan>("/api/v1/plans/generate", {
      teacher_id: input.teacher_id,
      student_id: input.student_id,
      topic_ids: input.topic_ids,
      exams: input.exams.map((e) => ({
        student_id: e.student_id,
        file_name: e.file_name,
        file_content_base64: e.file_content_base64,
      })),
    });
  },

  async getPlan(plan_id: string): Promise<LevelingPlan | null> {
    try {
      return await apiClient.get<LevelingPlan>(`/api/v1/plans/${plan_id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },

  async setEstado(plan_id: string, estado: PlanEstado): Promise<LevelingPlan | null> {
    try {
      return await apiClient.put<LevelingPlan>(`/api/v1/plans/${plan_id}/estado`, { estado });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },

  async listPlans(): Promise<LevelingPlan[]> {
    return apiClient.get<LevelingPlan[]>("/api/v1/plans");
  },
};
