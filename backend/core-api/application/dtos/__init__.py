"""Data Transfer Objects for the application layer."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class ExamUploadDTO:
    student_id: str
    file_name: str
    file_content_base64: str


@dataclass
class PlanGenerateInputDTO:
    teacher_id: str
    student_id: str
    tenant_id: str
    topic_ids: list[str]
    exams: list[ExamUploadDTO]


@dataclass
class TopicErrorDTO:
    topic_id: str
    titulo: str
    severity: int
    error_description: str


@dataclass
class ExamAnalysisDTO:
    student_id: str
    errors: list[TopicErrorDTO]


@dataclass
class TopicPlanEntryDTO:
    topic_id: str
    titulo: str
    prioridad: int
    error_descripcion: str
    gagne_sequence: list[int]
    eventos_completados: list[int] = field(default_factory=list)
    nivel_carga: str = "normal"
    notas_adaptacion: str = ""


@dataclass
class LevelingPlanDTO:
    plan_id: str
    student_id: str
    tenant_id: str
    origen: str
    estado: str
    topics: list[TopicPlanEntryDTO]
    topic_actual_index: int
    created_at: str
    approved_at: str | None
    updated_at: str


# --- Session-related DTOs ---


@dataclass
class FaceSignalDTO:
    state: str
    confidence: float
    timestamp: str
    metrics: dict | None = None


@dataclass
class PedagogicalStateDTO:
    state: str
    confidence: float
    sources: list[str] = field(default_factory=list)
    recommended_event: int | None = None


@dataclass
class ChatMessageDTO:
    id: str
    role: str
    text: str
    timestamp: str
    gagne_event: int | None = None


@dataclass
class SessionStateDTO:
    session_id: str
    plan_id: str
    student_id: str
    tenant_id: str
    topic_actual: TopicPlanEntryDTO
    gagne_event_actual: int
    interaction_summary: str
    turns_in_current_event: int
    student_responses: list[str]
    score_current_topic: float
    intentos_evento_actual: int
    transcript: list[ChatMessageDTO]
    status: str
    last_face_signal: FaceSignalDTO | None = None
    last_pedagogical_state: PedagogicalStateDTO | None = None


@dataclass
class SessionInitInputDTO:
    plan_id: str
    student_id: str


@dataclass
class FreeSessionInitInputDTO:
    topic_id: str
    student_id: str


@dataclass
class TurnInputDTO:
    session_id: str
    student_message: str
    face_signal: FaceSignalDTO | None = None


@dataclass
class TurnResultDTO:
    message: ChatMessageDTO
    session: SessionStateDTO
