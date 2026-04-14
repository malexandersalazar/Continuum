"""Mappers between API schemas and application DTOs."""

from apis.v1.schemas.requests import (
    FaceSignalPayload,
    GeneratePlanRequest,
    InitFreeSessionRequest,
    InitSessionRequest,
    PostTurnRequest,
)
from apis.v1.schemas.responses import (
    ChatMessageResponse,
    FaceSignalResponse,
    LevelingPlanResponse,
    PedagogicalStateResponse,
    SessionStateResponse,
    TopicPlanEntryResponse,
    TurnResponse,
)
from application.dtos import (
    ChatMessageDTO,
    ExamUploadDTO,
    FaceSignalDTO,
    FreeSessionInitInputDTO,
    LevelingPlanDTO,
    PedagogicalStateDTO,
    PlanGenerateInputDTO,
    SessionInitInputDTO,
    SessionStateDTO,
    TurnInputDTO,
    TurnResultDTO,
)

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
            _topic_entry_to_response(t)
            for t in dto.topics
        ],
        topic_actual_index=dto.topic_actual_index,
        created_at=dto.created_at,
        approved_at=dto.approved_at,
        updated_at=dto.updated_at,
    )


def _topic_entry_to_response(t) -> TopicPlanEntryResponse:
    return TopicPlanEntryResponse(
        topic_id=t.topic_id,
        titulo=t.titulo,
        prioridad=t.prioridad,
        error_descripcion=t.error_descripcion,
        gagne_sequence=t.gagne_sequence,
        eventos_completados=t.eventos_completados,
        nivel_carga=t.nivel_carga,
        notas_adaptacion=t.notas_adaptacion,
    )


# --- Session mappers ---


def to_session_init_input(req: InitSessionRequest) -> SessionInitInputDTO:
    return SessionInitInputDTO(plan_id=req.plan_id, student_id=req.student_id)


def to_free_session_init_input(req: InitFreeSessionRequest) -> FreeSessionInitInputDTO:
    return FreeSessionInitInputDTO(topic_id=req.topic_id, student_id=req.student_id)


def _face_signal_payload_to_dto(fs: FaceSignalPayload | None) -> FaceSignalDTO | None:
    if fs is None:
        return None
    return FaceSignalDTO(
        state=fs.state,
        confidence=fs.confidence,
        timestamp=fs.timestamp,
        metrics=fs.metrics,
    )


def to_turn_input(session_id: str, req: PostTurnRequest) -> TurnInputDTO:
    return TurnInputDTO(
        session_id=session_id,
        student_message=req.student_message,
        face_signal=_face_signal_payload_to_dto(req.face_signal),
    )


def _chat_message_dto_to_response(m: ChatMessageDTO) -> ChatMessageResponse:
    return ChatMessageResponse(
        id=m.id,
        role=m.role,
        text=m.text,
        gagne_event=m.gagne_event,
        timestamp=m.timestamp,
    )


def _face_signal_dto_to_response(fs: FaceSignalDTO | None) -> FaceSignalResponse | None:
    if fs is None:
        return None
    return FaceSignalResponse(
        state=fs.state,
        confidence=fs.confidence,
        timestamp=fs.timestamp,
        metrics=fs.metrics,
    )


def _ped_state_dto_to_response(ps: PedagogicalStateDTO | None) -> PedagogicalStateResponse | None:
    if ps is None:
        return None
    return PedagogicalStateResponse(
        state=ps.state,
        confidence=ps.confidence,
        sources=ps.sources,
        recommended_event=ps.recommended_event,
    )


def to_session_state_response(dto: SessionStateDTO) -> SessionStateResponse:
    return SessionStateResponse(
        session_id=dto.session_id,
        plan_id=dto.plan_id,
        student_id=dto.student_id,
        tenant_id=dto.tenant_id,
        topic_actual=_topic_entry_to_response(dto.topic_actual),
        gagne_event_actual=dto.gagne_event_actual,
        last_face_signal=_face_signal_dto_to_response(dto.last_face_signal),
        last_pedagogical_state=_ped_state_dto_to_response(dto.last_pedagogical_state),
        interaction_summary=dto.interaction_summary,
        turns_in_current_event=dto.turns_in_current_event,
        student_responses=dto.student_responses,
        score_current_topic=dto.score_current_topic,
        intentos_evento_actual=dto.intentos_evento_actual,
        transcript=[_chat_message_dto_to_response(m) for m in dto.transcript],
        status=dto.status,
    )


def to_turn_response(dto: TurnResultDTO) -> TurnResponse:
    return TurnResponse(
        message=_chat_message_dto_to_response(dto.message),
        session=to_session_state_response(dto.session),
    )
