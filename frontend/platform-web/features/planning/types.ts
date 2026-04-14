import type { ExamUpload } from "@/shared/domain/types";

export interface PlanDraftInput {
  teacher_id: string;
  student_id: string;
  topic_ids: string[];
  exams: ExamUpload[];
}
