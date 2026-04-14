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
