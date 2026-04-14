"""Claude-powered adaptive tutoring for Gagné-based learning sessions."""

from __future__ import annotations

import logging
import time

import anthropic

from domain import PedagogicalState, TutoringSession
from infrastructure.pedagogical import format_topic_section_for_prompt, load_topic_section

logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-6"

MAX_TRANSCRIPT_MESSAGES = 20

GAGNE_EVENT_NAMES: dict[int, str] = {
    1: "Ganar atención",
    2: "Informar objetivos",
    3: "Estimular recuerdo previo",
    4: "Presentar contenido",
    5: "Guiar el aprendizaje",
    6: "Provocar la práctica",
    7: "Dar retroalimentación",
    8: "Evaluar desempeño",
    9: "Promover retención y transferencia",
}

GAGNE_EVENT_INSTRUCTIONS: dict[int, str] = {
    1: (
        "EVENTO ACTIVO: E1 — Ganar la atención\n"
        "Objetivo: despertar curiosidad. NO expliques el contenido todavía.\n"
        "Usa una pregunta intrigante, una situación de la vida real, un dato sorprendente,\n"
        "o una analogía con algo que el alumno conozca.\n"
        "Sé breve: máximo 3 oraciones + una pregunta que invite a continuar."
    ),
    2: (
        "EVENTO ACTIVO: E2 — Informar objetivos\n"
        "Objetivo: decirle al alumno qué va a poder hacer al terminar esta sesión.\n"
        'Formula los objetivos en primera persona del alumno: "Al terminar esta parte, podrás..."\n'
        "Sé concreto y alcanzable. Máximo 2-3 objetivos."
    ),
    3: (
        "EVENTO ACTIVO: E3 — Estimular recuerdo previo\n"
        "Objetivo: conectar con lo que el alumno ya sabe.\n"
        "Haz 1-2 preguntas sobre los prerequisitos del tema. No des la respuesta tú.\n"
        "Espera que el alumno responda antes de avanzar."
    ),
    4: (
        "EVENTO ACTIVO: E4 — Presentar el contenido\n"
        "Objetivo: explicar el concepto central con claridad.\n"
        "Usa el contenido de referencia proporcionado. Puedes usar los ejemplos del material.\n"
        "Adapta el lenguaje al nivel del alumno. Evita jerga innecesaria.\n"
        'Termina con: "¿Tiene sentido hasta aquí?" o una pregunta de comprensión sencilla.'
    ),
    5: (
        "EVENTO ACTIVO: E5 — Guía en el aprendizaje\n"
        "Objetivo: facilitar la asimilación con ejemplos adicionales o contraejemplos.\n"
        "Si el alumno mostró confusión, usa un ángulo diferente al de E4.\n"
        "Usa analogías concretas. Muestra el contraejemplo si está disponible.\n"
        "Guía paso a paso, no des la respuesta completa de golpe."
    ),
    6: (
        "EVENTO ACTIVO: E6 — Práctica\n"
        "Objetivo: el alumno aplica lo aprendido.\n"
        "Presenta UN ejercicio a la vez. No presentes todos juntos.\n"
        'Si nivel_carga es "reducida", empieza con el ejercicio de nivel básico.\n'
        "Después de cada respuesta del alumno, evalúa y da feedback antes de continuar."
    ),
    7: (
        "EVENTO ACTIVO: E7 — Retroalimentación\n"
        "Objetivo: feedback inmediato y específico sobre la respuesta del alumno.\n"
        'Si es correcta: confirma y explica por qué es correcta (no solo "¡Bien!").\n'
        "Si es incorrecta: señala específicamente dónde está el error sin dar la respuesta.\n"
        "Da una pista que permita al alumno corregir por su cuenta."
    ),
    8: (
        "EVENTO ACTIVO: E8 — Evaluación del desempeño\n"
        "Objetivo: verificar si el alumno logró el objetivo del tema.\n"
        "Presenta un ejercicio de nivel intermedio o superior.\n"
        "Este ejercicio debe ser diferente a los de práctica.\n"
        "No des pistas aquí — es una evaluación real."
    ),
    9: (
        "EVENTO ACTIVO: E9 — Retención y transferencia\n"
        "Objetivo: consolidar y conectar con otros contextos.\n"
        "Presenta una situación nueva donde aplique lo aprendido.\n"
        "Puede ser interdisciplinaria (física, economía, cotidiano).\n"
        "Pregunta cómo conecta este tema con algo que ya conocía antes de esta sesión."
    ),
}


def _build_system_prompt(
    session: TutoringSession,
    gagne_event: int,
    ped_state: PedagogicalState,
) -> str:
    """Build the dynamic system prompt for a turn."""
    topic_section = load_topic_section(session.topic_actual.topic_id, gagne_event)
    topic_text = format_topic_section_for_prompt(topic_section)
    event_name = GAGNE_EVENT_NAMES.get(gagne_event, f"Evento {gagne_event}")
    event_instructions = GAGNE_EVENT_INSTRUCTIONS.get(gagne_event, "Continúa la sesión normalmente.")

    return f"""\
Eres un tutor personalizado de IA. Estás conduciendo una sesión de nivelación \
con un estudiante. Implementas los 9 eventos de instrucción de Gagné de manera \
adaptativa según el estado del alumno.

## Tema actual
{topic_text}

## Notas de adaptación del docente
{session.topic_actual.notas_adaptacion or "Sin notas adicionales."}

## Estado pedagógico detectado
Estado: {ped_state.state} (confianza: {ped_state.confidence:.0%})
Fuentes: {', '.join(ped_state.sources)}
Turnos en evento actual: {session.turns_in_current_event}

## Instrucciones del evento activo — {event_name}
{event_instructions}

## Reglas generales
- Responde siempre en español
- Sé cercano, nunca condescendiente
- Si el estado es "frustration", reduce la complejidad inmediatamente
- Si el estado es "fatigue", propón un micro-logro alcanzable en 1-2 turnos
- Máximo 4 oraciones por respuesta, salvo que el evento requiera más (ej. presentar contenido)

## Resumen de la sesión hasta ahora
{session.interaction_summary}"""


def _build_messages(
    session: TutoringSession,
    student_message: str,
) -> list[dict]:
    """Build the messages array from the session transcript.

    Includes the last ``MAX_TRANSCRIPT_MESSAGES`` from the transcript
    plus the current student message.
    """
    messages: list[dict] = []

    # Take the tail of the transcript
    recent = session.transcript[-MAX_TRANSCRIPT_MESSAGES:]
    for m in recent:
        role = "user" if m.role == "student" else "assistant"
        messages.append({"role": role, "content": m.text})

    # Add current student message
    if student_message:
        # Avoid duplicate if the last transcript entry was also the same student message
        if not messages or messages[-1]["role"] != "user" or messages[-1]["content"] != student_message:
            messages.append({"role": "user", "content": student_message})

    # Ensure messages start with "user" (Claude API requirement)
    if messages and messages[0]["role"] == "assistant":
        messages = messages[1:]

    # If no messages, create a minimal user message
    if not messages:
        messages = [{"role": "user", "content": "Hola, estoy listo para empezar."}]

    return messages


class ClaudeSessionTutor:
    """Generates adaptive tutoring responses using Claude."""

    def __init__(self) -> None:
        self._client = anthropic.AsyncAnthropic()

    async def generate_reply(
        self,
        session: TutoringSession,
        gagne_event: int,
        ped_state: PedagogicalState,
        student_message: str,
    ) -> str:
        system_prompt = _build_system_prompt(session, gagne_event, ped_state)
        messages = _build_messages(session, student_message)

        logger.info(
            "Calling Claude session tutor",
            extra={
                "session_id": session.session_id,
                "gagne_event": gagne_event,
                "ped_state": ped_state.state,
                "message_count": len(messages),
            },
        )

        t0 = time.monotonic()
        response = await self._client.messages.create(
            model=MODEL,
            max_tokens=1024,
            system=system_prompt,
            messages=messages,
        )
        elapsed = time.monotonic() - t0

        raw_text = response.content[0].text

        logger.info(
            "Claude session tutor response received",
            extra={
                "session_id": session.session_id,
                "elapsed_s": round(elapsed, 2),
                "response_snippet": raw_text[:300],
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                },
            },
        )

        return raw_text
