import type { FaceSignal, SessionState } from "@/shared/domain/types";
import { apiClient, ApiError } from "@/shared/lib/apiClient";
import type { TurnResponse } from "../types";

export const learningService = {
  async startSessionFromPlan(plan_id: string, student_id = "alu_001"): Promise<SessionState> {
    return apiClient.post<SessionState>("/api/v1/sessions/init", { plan_id, student_id });
  },

  async startFreeSession(topic_id: string, student_id = "alu_001"): Promise<SessionState> {
    return apiClient.post<SessionState>("/api/v1/sessions/init-free", { topic_id, student_id });
  },

  async getSession(session_id: string): Promise<SessionState | null> {
    try {
      return await apiClient.get<SessionState>(`/api/v1/sessions/${session_id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },

  async postTurn(
    session_id: string,
    studentMessage: string,
    faceSignal: FaceSignal | null,
  ): Promise<TurnResponse> {
    return apiClient.post<TurnResponse>(`/api/v1/sessions/${session_id}/turn`, {
      student_message: studentMessage,
      face_signal: faceSignal,
    });
  },

  async primeOpening(session_id: string): Promise<TurnResponse | null> {
    try {
      return await apiClient.post<TurnResponse>(`/api/v1/sessions/${session_id}/prime`, {});
    } catch (e) {
      if (e instanceof ApiError && (e.status === 204 || e.status === 404)) return null;
      throw e;
    }
  },
};
