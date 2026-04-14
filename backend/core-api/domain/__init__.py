"""Domain models for the Continuum core application."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class TopicPlanEntry:
    topic_id: str
    titulo: str
    prioridad: int
    error_descripcion: str
    gagne_sequence: list[int]
    eventos_completados: list[int] = field(default_factory=list)
    nivel_carga: str = "normal"
    notas_adaptacion: str = ""

    def mark_event_completed(self, event_id: int) -> None:
        if event_id not in self.eventos_completados:
            self.eventos_completados.append(event_id)

    def all_events_completed(self) -> bool:
        return set(self.gagne_sequence).issubset(set(self.eventos_completados))


@dataclass
class LevelingPlan:
    plan_id: str
    student_id: str
    tenant_id: str
    origen: str
    estado: str
    topics: list[TopicPlanEntry]
    topic_actual_index: int
    created_at: str
    approved_at: str | None
    updated_at: str

    def has_topics(self) -> bool:
        return len(self.topics) > 0

    def approve(self) -> None:
        now = datetime.now(timezone.utc).isoformat()
        self.estado = "approved"
        self.approved_at = now
        self.updated_at = now

    def activate(self) -> None:
        self.estado = "active"
        self.updated_at = datetime.now(timezone.utc).isoformat()


@dataclass
class FaceSignal:
    state: str
    confidence: float
    timestamp: str
    metrics: dict | None = None


@dataclass
class PedagogicalState:
    state: str
    confidence: float
    sources: list[str]
    recommended_event: int | None = None


@dataclass
class ChatMessage:
    id: str
    role: str  # "student" | "tutor"
    text: str
    timestamp: str
    gagne_event: int | None = None


@dataclass
class TutoringSession:
    session_id: str
    plan_id: str
    student_id: str
    tenant_id: str
    topic_actual: TopicPlanEntry
    gagne_event_actual: int
    interaction_summary: str
    turns_in_current_event: int
    student_responses: list[str]
    score_current_topic: float
    intentos_evento_actual: int
    transcript: list[ChatMessage]
    status: str = "active"  # "active" | "completed"
    last_face_signal: FaceSignal | None = None
    last_pedagogical_state: PedagogicalState | None = None
