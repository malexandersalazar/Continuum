"""Mappers between API schemas and application DTOs."""

from apis.v1.schemas.requests import GeneratePlanRequest
from apis.v1.schemas.responses import LevelingPlanResponse, TopicPlanEntryResponse
from application.dtos import ExamUploadDTO, LevelingPlanDTO, PlanGenerateInputDTO

DEMO_TENANT_ID = "demo"


def to_plan_generate_input(req: GeneratePlanRequest) -> PlanGenerateInputDTO:
    return PlanGenerateInputDTO(
        teacher_id=req.teacher_id,
        student_id=req.student_id,
        tenant_id=DEMO_TENANT_ID,
        topic_ids=req.topic_ids,
        exams=[
            ExamUploadDTO(
                student_id=e.student_id,
                file_name=e.file_name,
                file_content_base64=e.file_content_base64,
            )
            for e in req.exams
        ],
    )


def to_leveling_plan_response(dto: LevelingPlanDTO) -> LevelingPlanResponse:
    return LevelingPlanResponse(
        plan_id=dto.plan_id,
        student_id=dto.student_id,
        tenant_id=dto.tenant_id,
        origen=dto.origen,
        estado=dto.estado,
        topics=[
            TopicPlanEntryResponse(
                topic_id=t.topic_id,
                titulo=t.titulo,
                prioridad=t.prioridad,
                error_descripcion=t.error_descripcion,
                gagne_sequence=t.gagne_sequence,
                eventos_completados=t.eventos_completados,
                nivel_carga=t.nivel_carga,
                notas_adaptacion=t.notas_adaptacion,
            )
            for t in dto.topics
        ],
        topic_actual_index=dto.topic_actual_index,
        created_at=dto.created_at,
        approved_at=dto.approved_at,
        updated_at=dto.updated_at,
    )
