import type {
  ChatMessage,
  FaceSignal,
  LevelingPlan,
  SessionState,
  TopicPlanEntry,
} from "@/shared/domain/types";
import { DEMO_TENANT_ID, getTopic } from "@/shared/domain/knowledgeBase";
import { detectState, generateTutorReply, selectGagneEvent } from "@/shared/domain/mockTutor";
import { generateId } from "@/shared/lib/ids";
import { listKeys, readJSON, writeJSON } from "@/shared/lib/storage";
import type { TurnResponse } from "../types";

const SESSION_KEY = (id: string) => `session:${id}`;
const PLAN_KEY = (id: string) => `plan:${id}`;

function buildFreePlan(topicId: string, studentId: string): LevelingPlan {
  const topic = getTopic(topicId);
  if (!topic) throw new Error(`Topic not found: ${topicId}`);
  const now = new Date().toISOString();
  return {
    plan_id: generateId("plan"),
    student_id: studentId,
    tenant_id: DEMO_TENANT_ID,
    origen: "alumno_libre",
    estado: "active",
    topics: [
      {
        topic_id: topic.topic_id,
        titulo: topic.titulo,
        prioridad: 1,
        error_descripcion: "",
        gagne_sequence: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        eventos_completados: [],
        nivel_carga: "normal",
        notas_adaptacion: "",
      },
    ],
    topic_actual_index: 0,
    created_at: now,
    approved_at: now,
    updated_at: now,
  };
}

export const learningService = {
  async startSessionFromPlan(plan_id: string, student_id = "alu_001"): Promise<SessionState> {
    const plan = readJSON<LevelingPlan>(PLAN_KEY(plan_id));
    if (!plan) throw new Error(`Plan not found: ${plan_id}`);

    const firstTopic: TopicPlanEntry = plan.topics[0];
    const session: SessionState = {
      session_id: generateId("sess"),
      plan_id: plan.plan_id,
      student_id,
      tenant_id: plan.tenant_id,
      topic_actual: firstTopic,
      gagne_event_actual: firstTopic.gagne_sequence[0],
      last_face_signal: null,
      last_pedagogical_state: null,
      interaction_summary: "Inicio de sesión.",
      turns_in_current_event: 0,
      student_responses: [],
      score_current_topic: 0,
      intentos_evento_actual: 0,
      transcript: [],
      status: "active",
    };

    const activePlan: LevelingPlan = { ...plan, estado: "active", updated_at: new Date().toISOString() };
    writeJSON(PLAN_KEY(plan.plan_id), activePlan);
    writeJSON(SESSION_KEY(session.session_id), session);
    return session;
  },

  async startFreeSession(topic_id: string, student_id = "alu_001"): Promise<SessionState> {
    const plan = buildFreePlan(topic_id, student_id);
    writeJSON(PLAN_KEY(plan.plan_id), plan);
    const firstTopic = plan.topics[0];
    const session: SessionState = {
      session_id: generateId("sess"),
      plan_id: plan.plan_id,
      student_id,
      tenant_id: plan.tenant_id,
      topic_actual: firstTopic,
      gagne_event_actual: 1,
      last_face_signal: null,
      last_pedagogical_state: null,
      interaction_summary: "Sesión libre.",
      turns_in_current_event: 0,
      student_responses: [],
      score_current_topic: 0,
      intentos_evento_actual: 0,
      transcript: [],
      status: "active",
    };
    writeJSON(SESSION_KEY(session.session_id), session);
    return session;
  },

  async getSession(session_id: string): Promise<SessionState | null> {
    return readJSON<SessionState>(SESSION_KEY(session_id));
  },

  async listSessions(): Promise<SessionState[]> {
    return listKeys("session:")
      .map((k) => readJSON<SessionState>(k))
      .filter((s): s is SessionState => s !== null);
  },

  async postTurn(
    session_id: string,
    studentMessage: string,
    faceSignal: FaceSignal | null,
  ): Promise<TurnResponse> {
    const session = readJSON<SessionState>(SESSION_KEY(session_id));
    if (!session) throw new Error(`Session not found: ${session_id}`);

    const now = new Date().toISOString();
    const studentMsg: ChatMessage = {
      id: generateId("msg"),
      role: "student",
      text: studentMessage,
      timestamp: now,
    };

    const ped = detectState(
      studentMessage,
      faceSignal,
      session.turns_in_current_event,
      session.intentos_evento_actual,
    );
    const eventBefore = session.gagne_event_actual;
    const recommended = selectGagneEvent({ ...session }, ped);
    const movedEvent = recommended !== eventBefore;

    const reply = generateTutorReply(session, recommended, ped, studentMessage);
    const tutorMsg: ChatMessage = {
      id: generateId("msg"),
      role: "tutor",
      text: reply,
      gagne_event: recommended,
      timestamp: new Date().toISOString(),
    };

    const updatedTopic: TopicPlanEntry = movedEvent
      ? {
          ...session.topic_actual,
          eventos_completados: session.topic_actual.eventos_completados.includes(eventBefore)
            ? session.topic_actual.eventos_completados
            : [...session.topic_actual.eventos_completados, eventBefore],
        }
      : session.topic_actual;

    const scoreDelta = ped.state === "engaged" ? 0.15 : ped.state === "neutral" ? 0.08 : -0.05;

    const nextSession: SessionState = {
      ...session,
      topic_actual: updatedTopic,
      gagne_event_actual: recommended,
      last_face_signal: faceSignal,
      last_pedagogical_state: ped,
      turns_in_current_event: movedEvent ? 0 : session.turns_in_current_event + 1,
      student_responses: [...session.student_responses.slice(-2), studentMessage],
      score_current_topic: Math.max(0, Math.min(1, session.score_current_topic + scoreDelta)),
      intentos_evento_actual: movedEvent ? 0 : session.intentos_evento_actual + 1,
      transcript: [...session.transcript, studentMsg, tutorMsg],
    };

    writeJSON(SESSION_KEY(session_id), nextSession);
    return { message: tutorMsg, session: nextSession };
  },

  async primeOpening(session_id: string): Promise<TurnResponse | null> {
    const session = readJSON<SessionState>(SESSION_KEY(session_id));
    if (!session || session.transcript.length > 0) return null;
    const ped = {
      state: "neutral" as const,
      confidence: 0.5,
      sources: ["text" as const],
      recommended_event: null,
    };
    const reply = generateTutorReply(session, session.gagne_event_actual, ped, "");
    const tutorMsg: ChatMessage = {
      id: generateId("msg"),
      role: "tutor",
      text: reply,
      gagne_event: session.gagne_event_actual,
      timestamp: new Date().toISOString(),
    };
    const next: SessionState = {
      ...session,
      last_pedagogical_state: ped,
      transcript: [tutorMsg],
    };
    writeJSON(SESSION_KEY(session_id), next);
    return { message: tutorMsg, session: next };
  },
};
