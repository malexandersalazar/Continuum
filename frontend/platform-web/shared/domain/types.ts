export type GagneEventId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface TopicExercise {
  nivel: "basico" | "intermedio" | "avanzado";
  enunciado: string;
  respuesta: string;
}

export interface TopicExample {
  enunciado: string;
  solucion: string;
  paso_a_paso: string[];
}

export interface TopicSecciones {
  concepto: string;
  ejemplos: TopicExample[];
  contraejemplos: string[];
  ejercicios: TopicExercise[];
  aplicaciones_reales: string[];
  mnemotecnia: string;
}

export interface Topic {
  topic_id: string;
  tenant_id: string;
  curso: string;
  modulo: string;
  titulo: string;
  prerequisitos: string[];
  secciones: TopicSecciones;
}

export type PlanEstado = "pending" | "approved" | "active" | "completed";

export interface TopicPlanEntry {
  topic_id: string;
  titulo: string;
  prioridad: 1 | 2 | 3;
  error_descripcion: string;
  gagne_sequence: GagneEventId[];
  eventos_completados: GagneEventId[];
  nivel_carga: "normal" | "reducida" | "ampliada";
  notas_adaptacion: string;
}

export interface LevelingPlan {
  plan_id: string;
  student_id: string;
  tenant_id: string;
  origen: "docente" | "alumno_libre";
  estado: PlanEstado;
  topics: TopicPlanEntry[];
  topic_actual_index: number;
  created_at: string;
  approved_at: string | null;
  updated_at: string;
}

export type FaceState = "neutral" | "confused" | "frustrated" | "sleepy" | "engaged";

export interface FaceSignal {
  state: FaceState;
  confidence: number;
  timestamp: string;
}

export type PedagogicalStateKind =
  | "neutral"
  | "confusion"
  | "frustration"
  | "demotivation"
  | "fatigue"
  | "engaged";

export interface PedagogicalState {
  state: PedagogicalStateKind;
  confidence: number;
  sources: ("text" | "face")[];
  recommended_event: GagneEventId | null;
}

export interface ChatMessage {
  id: string;
  role: "student" | "tutor";
  text: string;
  gagne_event?: GagneEventId;
  timestamp: string;
}

export interface SessionState {
  session_id: string;
  plan_id: string;
  student_id: string;
  tenant_id: string;
  topic_actual: TopicPlanEntry;
  gagne_event_actual: GagneEventId;
  last_face_signal: FaceSignal | null;
  last_pedagogical_state: PedagogicalState | null;
  interaction_summary: string;
  turns_in_current_event: number;
  student_responses: string[];
  score_current_topic: number;
  intentos_evento_actual: number;
  transcript: ChatMessage[];
  status: "active" | "completed";
}

export interface ExamUpload {
  student_id: string;
  file_name: string;
  file_size: number;
}
