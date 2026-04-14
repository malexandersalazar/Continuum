"""Claude API integration for exam analysis and plan generation."""

from __future__ import annotations

import json
import logging
import time
import uuid
from datetime import datetime, timezone

import anthropic

from application.dtos import (
    ExamAnalysisDTO,
    ExamUploadDTO,
    LevelingPlanDTO,
    TopicErrorDTO,
    TopicPlanEntryDTO,
)
from infrastructure.knowledge_base import Topic, format_topics_for_prompt

logger = logging.getLogger(__name__)

MODEL = "claude-sonnet-4-6"

ANALYZE_SYSTEM = """\
Eres un analizador pedagógico especializado. Tu tarea es revisar exámenes \
escaneados e identificar errores por alumno y por tema.

Los temas evaluados son los siguientes (con su contenido de referencia):

{topic_content}

Reglas de análisis:
- Clasifica cada error como: conceptual | procedimental | omision
- Severidad: 1 (leve, error menor) | 2 (parcial, falta comprensión) | 3 (total, no responde o completamente errado)
- Si el alumno respondió correctamente un tema, NO lo incluyas en el reporte
- Sé específico: describe QUÉ falló, no solo que falló
- Si no puedes leer claramente el examen, indica qué parte no es legible y evalúa lo que sí puedas ver

Responde ÚNICAMENTE en JSON válido con este schema:
{{
  "errors": [
    {{
      "topic_id": "string (uno de los IDs de los temas evaluados)",
      "titulo": "string (título del tema)",
      "severity": 1 | 2 | 3,
      "error_description": "string (descripción específica del error)"
    }}
  ]
}}

Si el examen no contiene errores en ningún tema, devuelve {{"errors": []}}.\
"""

GENERATE_PLAN_SYSTEM = """\
Eres un planificador pedagógico. Recibes el reporte de errores de un alumno \
y debes generar un Plan de Nivelación personalizado.

IMPORTANTE — lo que debes generar es un PLAN, no el contenido de la nivelación. \
El plan debe ser revisable por el docente en menos de 1 minuto.

Los 9 eventos de instrucción de Gagné:
1. Ganar atención
2. Informar objetivos
3. Estimular recuerdo previo
4. Presentar contenido
5. Guiar el aprendizaje
6. Provocar la práctica
7. Dar retroalimentación
8. Evaluar desempeño
9. Promover retención y transferencia

Principios:
- Solo incluye temas donde el alumno tuvo errores (severity >= 1)
- Ordena por severidad descendente (los gaps más críticos primero)
- Para cada tema, define qué eventos de Gagné son necesarios según el tipo de error:
    * Error severo (severity 3): secuencia completa [1,2,3,4,5,6,7,8,9]
    * Error parcial (severity 2): secuencia parcial [3,4,5,6,7,8]
    * Error leve (severity 1): refuerzo [4,5,6,7]
- prioridad: mapea directamente desde severity (3 → prioridad 1, 2 → prioridad 2, 1 → prioridad 3)
- nivel_carga: "normal" por defecto. "reducida" si el alumno tiene 3+ errores severos (severity 3).
- notas_adaptacion: observación específica para que la IA sepa cómo abordarlo en la sesión de nivelación

Contenido de referencia de los temas:

{topic_content}

Responde ÚNICAMENTE en JSON válido con este schema:
{{
  "topics": [
    {{
      "topic_id": "string",
      "titulo": "string",
      "prioridad": 1 | 2 | 3,
      "error_descripcion": "string",
      "gagne_sequence": [int],
      "nivel_carga": "normal" | "reducida" | "ampliada",
      "notas_adaptacion": "string"
    }}
  ]
}}\
"""


def _parse_json(text: str) -> dict:
    """Extract and parse JSON from Claude's response, handling markdown fences."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        first_newline = cleaned.index("\n")
        last_fence = cleaned.rfind("```")
        cleaned = cleaned[first_newline + 1 : last_fence].strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error(
            "Failed to parse Claude response as JSON",
            extra={"raw_response": text[:1000], "error": str(exc)},
        )
        raise ValueError(
            f"Claude returned invalid JSON: {exc}. "
            f"Raw response (first 200 chars): {text[:200]}"
        ) from exc


class ClaudeExamAnalyzer:
    def __init__(self) -> None:
        self._client = anthropic.AsyncAnthropic()

    async def analyze_errors(
        self,
        exams: list[ExamUploadDTO],
        topics: list[Topic],
    ) -> ExamAnalysisDTO:
        logger.info(
            "Starting exam error analysis",
            extra={"exam_count": len(exams), "topic_count": len(topics)},
        )

        topic_content = format_topics_for_prompt(topics)
        system_prompt = ANALYZE_SYSTEM.format(topic_content=topic_content)

        content: list[dict] = []
        for exam in exams:
            content.append(
                {
                    "type": "document",
                    "source": {
                        "type": "base64",
                        "media_type": "application/pdf",
                        "data": exam.file_content_base64,
                    },
                }
            )
        content.append(
            {
                "type": "text",
                "text": (
                    "Analiza los exámenes adjuntos. Identifica los errores del alumno "
                    "en relación a los temas evaluados. Responde en JSON."
                ),
            }
        )

        t0 = time.monotonic()
        response = await self._client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": content}],
        )
        elapsed = time.monotonic() - t0

        raw_text = response.content[0].text
        logger.info(
            "Claude analyze_errors response received",
            extra={
                "elapsed_s": round(elapsed, 2),
                "response_snippet": raw_text[:500],
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                },
            },
        )

        raw = _parse_json(raw_text)
        student_id = exams[0].student_id if exams else ""
        errors = [
            TopicErrorDTO(
                topic_id=e["topic_id"],
                titulo=e.get("titulo", ""),
                severity=e["severity"],
                error_description=e["error_description"],
            )
            for e in raw.get("errors", [])
        ]

        logger.info(
            "Exam analysis complete",
            extra={
                "student_id": student_id,
                "error_count": len(errors),
                "severities": [e.severity for e in errors],
            },
        )

        return ExamAnalysisDTO(student_id=student_id, errors=errors)

    async def generate_plan(
        self,
        student_id: str,
        tenant_id: str,
        analysis: ExamAnalysisDTO,
        topics: list[Topic],
    ) -> LevelingPlanDTO:
        logger.info(
            "Starting plan generation",
            extra={
                "student_id": student_id,
                "error_count": len(analysis.errors),
                "topic_count": len(topics),
            },
        )

        topic_content = format_topics_for_prompt(topics)
        system_prompt = GENERATE_PLAN_SYSTEM.format(topic_content=topic_content)

        errors_json = json.dumps(
            [
                {
                    "topic_id": e.topic_id,
                    "titulo": e.titulo,
                    "severity": e.severity,
                    "error_description": e.error_description,
                }
                for e in analysis.errors
            ],
            ensure_ascii=False,
            indent=2,
        )

        t0 = time.monotonic()
        response = await self._client.messages.create(
            model=MODEL,
            max_tokens=4096,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": (
                        f"Reporte de errores del alumno:\n\n{errors_json}\n\n"
                        "Genera el plan de nivelación en JSON."
                    ),
                }
            ],
        )
        elapsed = time.monotonic() - t0

        raw_text = response.content[0].text
        logger.info(
            "Claude generate_plan response received",
            extra={
                "elapsed_s": round(elapsed, 2),
                "response_snippet": raw_text[:500],
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                },
            },
        )

        raw = _parse_json(raw_text)
        now = datetime.now(timezone.utc).isoformat()
        plan_id = f"plan_{uuid.uuid4().hex[:12]}"

        plan = LevelingPlanDTO(
            plan_id=plan_id,
            student_id=student_id,
            tenant_id=tenant_id,
            origen="docente",
            estado="pending",
            topics=[
                TopicPlanEntryDTO(
                    topic_id=t["topic_id"],
                    titulo=t["titulo"],
                    prioridad=t["prioridad"],
                    error_descripcion=t["error_descripcion"],
                    gagne_sequence=t["gagne_sequence"],
                    nivel_carga=t.get("nivel_carga", "normal"),
                    notas_adaptacion=t.get("notas_adaptacion", ""),
                )
                for t in raw.get("topics", [])
            ],
            topic_actual_index=0,
            created_at=now,
            approved_at=None,
            updated_at=now,
        )

        logger.info(
            "Plan generation complete",
            extra={
                "plan_id": plan_id,
                "topic_count": len(plan.topics),
                "priorities": [t.prioridad for t in plan.topics],
            },
        )

        return plan
