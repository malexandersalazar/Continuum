"use client";
import { useCallback, useState } from "react";
import type { ExamUpload, LevelingPlan } from "@/shared/domain/types";
import { planningService } from "../services/planningService";

export function usePlanDraft() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [exams, setExams] = useState<ExamUpload[]>([]);
  const [studentId, setStudentId] = useState<string>("alu_001");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTopic = useCallback((id: string) => {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    );
  }, []);

  const addExams = useCallback((uploads: ExamUpload[]) => {
    setExams((prev) => [...prev, ...uploads]);
  }, []);

  const removeExam = useCallback((idx: number) => {
    setExams((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const generate = useCallback(async (): Promise<LevelingPlan | null> => {
    if (selectedTopics.length === 0) {
      setError("Selecciona al menos un tema.");
      return null;
    }
    if (exams.length === 0) {
      setError("Adjunta al menos un examen en PDF.");
      return null;
    }
    setSubmitting(true);
    setError(null);
    try {
      return await planningService.generatePlan({
        teacher_id: "prof_demo",
        student_id: studentId,
        topic_ids: selectedTopics,
        exams,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error generando plan.");
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [selectedTopics, studentId, exams]);

  return {
    selectedTopics,
    toggleTopic,
    exams,
    addExams,
    removeExam,
    studentId,
    setStudentId,
    submitting,
    error,
    setError,
    generate,
  };
}
