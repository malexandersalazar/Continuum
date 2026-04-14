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
