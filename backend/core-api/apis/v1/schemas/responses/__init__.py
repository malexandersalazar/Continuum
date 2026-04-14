"""Response schemas for API v1."""

from pydantic import BaseModel


class TopicPlanEntryResponse(BaseModel):
    topic_id: str
    titulo: str
    prioridad: int
    error_descripcion: str
    gagne_sequence: list[int]
    eventos_completados: list[int]
    nivel_carga: str
    notas_adaptacion: str


class LevelingPlanResponse(BaseModel):
    plan_id: str
    student_id: str
    tenant_id: str
    origen: str
    estado: str
    topics: list[TopicPlanEntryResponse]
    topic_actual_index: int
    created_at: str
    approved_at: str | None
    updated_at: str


# --- Session response schemas ---


class ChatMessageResponse(BaseModel):
    id: str
    role: str
    text: str
    gagne_event: int | None
    timestamp: str


class FaceSignalResponse(BaseModel):
    state: str
    confidence: float
    timestamp: str
    metrics: dict | None


class PedagogicalStateResponse(BaseModel):
    state: str
    confidence: float
    sources: list[str]
    recommended_event: int | None


class SessionStateResponse(BaseModel):
    session_id: str
    plan_id: str
    student_id: str
    tenant_id: str
    topic_actual: TopicPlanEntryResponse
    gagne_event_actual: int
    last_face_signal: FaceSignalResponse | None
    last_pedagogical_state: PedagogicalStateResponse | None
    interaction_summary: str
    turns_in_current_event: int
    student_responses: list[str]
    score_current_topic: float
    intentos_evento_actual: int
    transcript: list[ChatMessageResponse]
    status: str


class TurnResponse(BaseModel):
    message: ChatMessageResponse
    session: SessionStateResponse
