// MOCK — replaced by POST /plans/analyze + /plans/generate when backend lands.
import type { GagneEventId, LevelingPlan, Topic, TopicPlanEntry } from "./types";
import { getTopic } from "./knowledgeBase";
import { generateId } from "@/shared/lib/ids";

export interface MockAnalyzeInput {
  tenant_id: string;
  teacher_id: string;
  student_id: string;
  topic_ids: string[];
  exam_file_names: string[];
}

const SEVERITY_CYCLE: (1 | 2 | 3)[] = [3, 2, 1, 2];

const SEQUENCE_BY_SEVERITY: Record<1 | 2 | 3, GagneEventId[]> = {
  3: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  2: [3, 4, 5, 6, 7, 8],
  1: [4, 5, 6, 7],
};

function synthErrorDescription(topic: Topic, severity: 1 | 2 | 3): string {
  if (severity === 3) return `No comprende el concepto base de "${topic.titulo}". Requiere nivelación completa.`;
  if (severity === 2) return `Concepto entendido pero falla en la ejecución de ejercicios de "${topic.titulo}".`;
  return `Errores menores en "${topic.titulo}"; refuerzo puntual suficiente.`;
}

function synthNotes(topic: Topic, severity: 1 | 2 | 3): string {
  if (severity === 3)
    return "Comenzar con analogías concretas antes de formalizar. Evitar notación avanzada al inicio.";
  if (severity === 2) return "Ir directo a práctica con feedback inmediato en cada paso.";
  return "Enfocarse en práctica; no re-explicar el concepto.";
}

export function mockAnalyzeAndPlan(input: MockAnalyzeInput): LevelingPlan {
  const topics: TopicPlanEntry[] = input.topic_ids
    .map((id, idx) => {
      const topic = getTopic(id);
      if (!topic) return null;
      const severity = SEVERITY_CYCLE[idx % SEVERITY_CYCLE.length];
      return {
        topic_id: topic.topic_id,
        titulo: topic.titulo,
        prioridad: severity,
        error_descripcion: synthErrorDescription(topic, severity),
        gagne_sequence: [...SEQUENCE_BY_SEVERITY[severity]],
        eventos_completados: [],
        nivel_carga: input.topic_ids.length >= 3 && severity === 3 ? "reducida" : "normal",
        notas_adaptacion: synthNotes(topic, severity),
      } as TopicPlanEntry;
    })
    .filter((t): t is TopicPlanEntry => t !== null)
    .sort((a, b) => a.prioridad - b.prioridad);

  const now = new Date().toISOString();
  return {
    plan_id: generateId("plan"),
    student_id: input.student_id,
    tenant_id: input.tenant_id,
    origen: "docente",
    estado: "pending",
    topics,
    topic_actual_index: 0,
    created_at: now,
    approved_at: null,
    updated_at: now,
  };
}
