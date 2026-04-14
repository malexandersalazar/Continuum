"""Request schemas for API v1."""

from pydantic import BaseModel, Field


class ExamUploadRequest(BaseModel):
    student_id: str
    file_name: str
    file_content_base64: str


class GeneratePlanRequest(BaseModel):
    teacher_id: str = "prof_demo"
    student_id: str
    topic_ids: list[str] = Field(min_length=1)
    exams: list[ExamUploadRequest] = Field(min_length=1)


class UpdateEstadoRequest(BaseModel):
    estado: str


# --- Session requests ---


class InitSessionRequest(BaseModel):
    plan_id: str
    student_id: str = "alu_001"


class InitFreeSessionRequest(BaseModel):
    topic_id: str
    student_id: str = "alu_001"


class FaceSignalPayload(BaseModel):
    state: str
    confidence: float
    timestamp: str
    metrics: dict | None = None


class PostTurnRequest(BaseModel):
    student_message: str
    face_signal: FaceSignalPayload | None = None
