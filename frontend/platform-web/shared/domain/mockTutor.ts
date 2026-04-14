// MOCK — replaced by POST /sessions/:id/turn when backend lands.
import type {
  FaceSignal,
  GagneEventId,
  PedagogicalState,
  PedagogicalStateKind,
  SessionState,
  Topic,
} from "./types";
import { getTopic } from "./knowledgeBase";

interface Intervention {
  primary: GagneEventId | null;
  secondary: GagneEventId | null;
}

const INTERVENTION_MAP: Record<PedagogicalStateKind, Intervention> = {
  confusion: { primary: 4, secondary: 5 },
  frustration: { primary: 5, secondary: 6 },
  demotivation: { primary: 1, secondary: 2 },
  fatigue: { primary: null, secondary: null },
  engaged: { primary: null, secondary: null },
  neutral: { primary: null, secondary: null },
};

export function detectState(
  studentMessage: string,
  faceSignal: FaceSignal | null,
  turnsInCurrentEvent: number,
  intentos: number,
): PedagogicalState {
  const msg = studentMessage.toLowerCase();
  const trimmed = studentMessage.trim();

  const textSignals: Record<PedagogicalStateKind, boolean> = {
    confusion: ["no entiendo", "no comprendo", "cómo", "por qué", "no sé", "perdido", "confundido", "???"].some((p) =>
      msg.includes(p),
    ),
    frustration: ["no puedo", "muy difícil", "no sirvo", "imposible", "ugh", "me rendí", "para qué"].some((p) =>
      msg.includes(p),
    ),
    demotivation: trimmed.length < 10 || ["ok", "si", "sí", "no", "...", "aja"].includes(trimmed.toLowerCase()),
    fatigue: turnsInCurrentEvent > 8 || intentos > 3,
    engaged: studentMessage.length > 40 && studentMessage.includes("?"),
    neutral: false,
  };

  const faceMap: Record<string, PedagogicalStateKind | null> = {
    confused: "confusion",
    frustrated: "frustration",
    sleepy: "fatigue",
    engaged: "engaged",
    neutral: null,
  };
  const facePedagogical =
    faceSignal && faceSignal.confidence > 0.65 ? faceMap[faceSignal.state] ?? null : null;

  const order: PedagogicalStateKind[] = ["frustration", "confusion", "fatigue", "demotivation", "engaged"];
  const detected: PedagogicalStateKind = order.find((k) => textSignals[k]) ?? "neutral";

  let final: PedagogicalStateKind = detected;
  let confidence = 0.5;
  let sources: ("text" | "face")[] = ["text"];

  if (facePedagogical && facePedagogical === detected) {
    confidence = Math.min(0.95, (faceSignal?.confidence ?? 0.7) + 0.15);
    sources = ["text", "face"];
  } else if (facePedagogical && facePedagogical !== detected) {
    confidence = 0.6;
  } else if (detected !== "neutral") {
    confidence = 0.75;
  } else {
    final = "neutral";
  }

  return { state: final, confidence, sources, recommended_event: null };
}

export function selectGagneEvent(session: SessionState, ped: PedagogicalState): GagneEventId {
  const entry = session.topic_actual;
  const current = session.gagne_event_actual;
  const seq = entry.gagne_sequence;
  const intervention = INTERVENTION_MAP[ped.state];

  if (ped.state === "fatigue" && seq.includes(6)) {
    ped.recommended_event = 6;
    return 6;
  }
  if (ped.state === "demotivation" && seq.includes(1) && current !== 1) {
    ped.recommended_event = 1;
    return 1;
  }
  if (intervention.primary && seq.includes(intervention.primary)) {
    const targetIdx = seq.indexOf(intervention.primary);
    const currentIdx = seq.indexOf(current);
    if (targetIdx >= Math.max(0, currentIdx - 2)) {
      ped.recommended_event = intervention.primary;
      return intervention.primary;
    }
  }
  if ((ped.state === "engaged" || ped.state === "neutral") && session.turns_in_current_event >= 1) {
    const currentIdx = seq.indexOf(current);
    if (currentIdx >= 0 && currentIdx < seq.length - 1) {
      const next = seq[currentIdx + 1];
      ped.recommended_event = next;
      return next;
    }
  }
  ped.recommended_event = current;
  return current;
}

function pickExercise(topic: Topic, nivelCarga: string): string {
  const preferred = nivelCarga === "reducida" ? "basico" : "intermedio";
  const ex = topic.secciones.ejercicios.find((e) => e.nivel === preferred) ?? topic.secciones.ejercicios[0];
  return ex?.enunciado ?? "Plantea un ejercicio propio sobre el tema.";
}

export function generateTutorReply(
  session: SessionState,
  event: GagneEventId,
  ped: PedagogicalState,
  studentMessage: string,
): string {
  const topic = getTopic(session.topic_actual.topic_id);
  if (!topic) return "Sigamos adelante.";

  const sec = topic.secciones;
  const title = topic.titulo;

  const openingByState: Partial<Record<PedagogicalStateKind, string>> = {
    frustration: "Tranquilo, vamos paso a paso. ",
    confusion: "Te lo explico desde otro ángulo. ",
    fatigue: "Hagamos algo cortito para sentir un avance. ",
    demotivation: "Te muestro para qué sirve esto en la vida real. ",
  };
  const opener = openingByState[ped.state] ?? "";

  switch (event) {
    case 1: {
      const app = sec.aplicaciones_reales[0] ?? "situaciones cotidianas";
      return `${opener}¿Sabías que "${title}" aparece cuando, por ejemplo, ${app}? Antes de entrar en reglas, ¿dónde crees que lo usarías tú?`;
    }
    case 2:
      return `${opener}Al terminar esta parte podrás: (1) reconocer ${title} en un problema, (2) resolver ejercicios típicos paso a paso, y (3) explicar por qué el método funciona. ¿Te parece?`;
    case 3: {
      const prereq = topic.prerequisitos[0] ?? "operaciones básicas";
      return `${opener}Antes de avanzar, recordemos: ¿qué te viene a la mente cuando piensas en ${prereq}? Respóndeme con tus propias palabras.`;
    }
    case 4: {
      const ex = sec.ejemplos[0];
      return `${opener}${sec.concepto}\n\nEjemplo: ${ex?.enunciado ?? ""} → ${ex?.solucion ?? ""}.\n¿Tiene sentido hasta aquí?`;
    }
    case 5: {
      const counter = sec.contraejemplos[0] ?? "";
      const ex = sec.ejemplos[0];
      const steps = ex?.paso_a_paso.join(" → ") ?? "";
      return `${opener}Mira los pasos: ${steps}. Y ojo con los contraejemplos: ${counter}. ¿Qué parte del paso a paso te gustaría que practiquemos primero?`;
    }
    case 6:
      return `${opener}Probemos un ejercicio: ${pickExercise(topic, session.topic_actual.nivel_carga)}. Tómate tu tiempo y mándame tu respuesta.`;
    case 7: {
      if (studentMessage.length < 3) return "Cuéntame qué intentaste y dónde te quedaste, aunque sea un paso.";
      return `${opener}Revisemos tu respuesta: "${studentMessage}". Si coincide con lo esperado, ¡vas bien! Si no, piensa qué paso del despeje podría haberse volteado. ¿Quieres intentarlo de nuevo?`;
    }
    case 8: {
      const ex = sec.ejercicios.find((e) => e.nivel === "avanzado") ?? sec.ejercicios[sec.ejercicios.length - 1];
      return `${opener}Evaluación: ${ex?.enunciado ?? "Resuelve un ejercicio similar de mayor dificultad."}. Envíame tu respuesta sin pistas esta vez.`;
    }
    case 9: {
      const app = sec.aplicaciones_reales[sec.aplicaciones_reales.length - 1] ?? sec.aplicaciones_reales[0];
      return `${opener}Para cerrar, imagina: ${app}. ¿Cómo usarías lo aprendido de ${title} para resolver esa situación?`;
    }
  }
}
