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
