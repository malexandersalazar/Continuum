"""Mappers between domain models and application DTOs."""

from __future__ import annotations

from domain import (
    ChatMessage as DomainChatMessage,
    FaceSignal as DomainFaceSignal,
    LevelingPlan as DomainPlan,
    PedagogicalState as DomainPedState,
    TopicPlanEntry as DomainTopicEntry,
    TutoringSession,
)

from application.dtos import (
    ChatMessageDTO,
    FaceSignalDTO,
    LevelingPlanDTO,
    PedagogicalStateDTO,
    SessionStateDTO,
    TopicPlanEntryDTO,
)


# --- LevelingPlan converters ---


def dto_to_domain_plan(dto: LevelingPlanDTO) -> DomainPlan:
    return DomainPlan(
        plan_id=dto.plan_id,
        student_id=dto.student_id,
        tenant_id=dto.tenant_id,
        origen=dto.origen,
        estado=dto.estado,
        topics=[
            DomainTopicEntry(
                topic_id=t.topic_id,
                titulo=t.titulo,
                prioridad=t.prioridad,
                error_descripcion=t.error_descripcion,
                gagne_sequence=list(t.gagne_sequence),
                eventos_completados=list(t.eventos_completados),
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


def domain_plan_to_dto(plan: DomainPlan) -> LevelingPlanDTO:
    return LevelingPlanDTO(
        plan_id=plan.plan_id,
        student_id=plan.student_id,
        tenant_id=plan.tenant_id,
        origen=plan.origen,
        estado=plan.estado,
        topics=[
            TopicPlanEntryDTO(
                topic_id=t.topic_id,
                titulo=t.titulo,
                prioridad=t.prioridad,
                error_descripcion=t.error_descripcion,
                gagne_sequence=list(t.gagne_sequence),
                eventos_completados=list(t.eventos_completados),
                nivel_carga=t.nivel_carga,
                notas_adaptacion=t.notas_adaptacion,
            )
            for t in plan.topics
        ],
        topic_actual_index=plan.topic_actual_index,
        created_at=plan.created_at,
        approved_at=plan.approved_at,
        updated_at=plan.updated_at,
    )


# --- Session converters ---


def _domain_face_signal_to_dto(fs: DomainFaceSignal | None) -> FaceSignalDTO | None:
    if fs is None:
        return None
    return FaceSignalDTO(
        state=fs.state,
        confidence=fs.confidence,
        timestamp=fs.timestamp,
        metrics=fs.metrics,
    )


def _domain_ped_state_to_dto(ps: DomainPedState | None) -> PedagogicalStateDTO | None:
    if ps is None:
        return None
    return PedagogicalStateDTO(
        state=ps.state,
        confidence=ps.confidence,
        sources=list(ps.sources),
        recommended_event=ps.recommended_event,
    )


def domain_session_to_state_dto(session: TutoringSession) -> SessionStateDTO:
    return SessionStateDTO(
        session_id=session.session_id,
        plan_id=session.plan_id,
        student_id=session.student_id,
        tenant_id=session.tenant_id,
        topic_actual=TopicPlanEntryDTO(
            topic_id=session.topic_actual.topic_id,
            titulo=session.topic_actual.titulo,
            prioridad=session.topic_actual.prioridad,
            error_descripcion=session.topic_actual.error_descripcion,
            gagne_sequence=list(session.topic_actual.gagne_sequence),
            eventos_completados=list(session.topic_actual.eventos_completados),
            nivel_carga=session.topic_actual.nivel_carga,
            notas_adaptacion=session.topic_actual.notas_adaptacion,
        ),
        gagne_event_actual=session.gagne_event_actual,
        last_face_signal=_domain_face_signal_to_dto(session.last_face_signal),
        last_pedagogical_state=_domain_ped_state_to_dto(session.last_pedagogical_state),
        interaction_summary=session.interaction_summary,
        turns_in_current_event=session.turns_in_current_event,
        student_responses=list(session.student_responses),
        score_current_topic=session.score_current_topic,
        intentos_evento_actual=session.intentos_evento_actual,
        transcript=[
            ChatMessageDTO(
                id=m.id,
                role=m.role,
                text=m.text,
                gagne_event=m.gagne_event,
                timestamp=m.timestamp,
            )
            for m in session.transcript
        ],
        status=session.status,
    )
