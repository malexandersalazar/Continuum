"""Application use cases."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from application.dtos import (
    ChatMessageDTO,
    FreeSessionInitInputDTO,
    LevelingPlanDTO,
    PlanGenerateInputDTO,
    SessionInitInputDTO,
    SessionStateDTO,
    TurnInputDTO,
    TurnResultDTO,
)
from application.mappers import (
    domain_plan_to_dto,
    domain_session_to_state_dto,
    dto_to_domain_plan,
)
from domain import (
    ChatMessage,
    FaceSignal,
    PedagogicalState,
    TopicPlanEntry,
    TutoringSession,
)
from domain import LevelingPlan as DomainPlan
from infrastructure.ai.claude_exam_analyzer import ClaudeExamAnalyzer
from infrastructure.ai.claude_session_tutor import ClaudeSessionTutor
from infrastructure.knowledge_base import get_topic, get_topics
from infrastructure.pedagogical import detect_state, select_gagne_event
from persistence import plan_repo, session_repo

logger = logging.getLogger(__name__)


def _generate_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class GeneratePlanUseCase:
    def __init__(self, analyzer: ClaudeExamAnalyzer) -> None:
        self._analyzer = analyzer

    async def execute(self, input_dto: PlanGenerateInputDTO) -> LevelingPlanDTO:
        logger.info(
            "GeneratePlanUseCase started",
            extra={
                "student_id": input_dto.student_id,
                "tenant_id": input_dto.tenant_id,
                "topic_ids": input_dto.topic_ids,
                "exam_count": len(input_dto.exams),
            },
        )

        topics = get_topics(input_dto.topic_ids)
        if not topics:
            raise ValueError("No valid topics found for the given IDs.")

        logger.info(
            "Topics resolved",
            extra={
                "requested": len(input_dto.topic_ids),
                "resolved": len(topics),
                "resolved_ids": [t["topic_id"] for t in topics],
            },
        )

        analysis = await self._analyzer.analyze_errors(
            exams=input_dto.exams,
            topics=topics,
        )

        logger.info(
            "Error analysis received",
            extra={
                "error_count": len(analysis.errors),
                "severities": [e.severity for e in analysis.errors],
                "topic_ids_with_errors": [e.topic_id for e in analysis.errors],
            },
        )

        plan = await self._analyzer.generate_plan(
            student_id=input_dto.student_id,
            tenant_id=input_dto.tenant_id,
            analysis=analysis,
            topics=topics,
        )

        if plan.topics:
            domain_plan = dto_to_domain_plan(plan)
            plan_repo.save(domain_plan)
            logger.info(
                "Plan persisted",
                extra={"plan_id": plan.plan_id, "topic_count": len(plan.topics)},
            )
        else:
            logger.info(
                "Plan not persisted (no topics)",
                extra={"plan_id": plan.plan_id},
            )

        logger.info(
            "GeneratePlanUseCase completed",
            extra={"plan_id": plan.plan_id, "plan_topic_count": len(plan.topics)},
        )

        return plan


class ListPlansUseCase:
    def execute(
        self,
        student_id: str | None = None,
        estado: str | None = None,
    ) -> list[LevelingPlanDTO]:
        if student_id:
            plans = plan_repo.list_by_student(student_id)
        elif estado:
            plans = plan_repo.list_by_estado(estado)
        else:
            plans = plan_repo.list_all()
        return [domain_plan_to_dto(p) for p in plans]


class GetPlanUseCase:
    def execute(self, plan_id: str) -> LevelingPlanDTO | None:
        plan = plan_repo.get(plan_id)
        if plan is None:
            return None
        return domain_plan_to_dto(plan)


class ApprovePlanUseCase:
    def execute(self, plan_id: str) -> LevelingPlanDTO | None:
        plan = plan_repo.get(plan_id)
        if plan is None:
            return None
        plan.approve()
        plan_repo.save(plan)
        logger.info("Plan approved", extra={"plan_id": plan_id})
        return domain_plan_to_dto(plan)


# --- Session use cases ---


class InitSessionUseCase:
    """Create a tutoring session from an approved or active plan."""

    def __init__(self, tutor: ClaudeSessionTutor) -> None:
        self._tutor = tutor

    def execute(self, input_dto: SessionInitInputDTO) -> SessionStateDTO:
        plan = plan_repo.get(input_dto.plan_id)
        if plan is None:
            raise ValueError(f"Plan not found: {input_dto.plan_id}")
        if plan.estado not in ("approved", "active"):
            raise ValueError(f"Plan estado must be 'approved' or 'active', got '{plan.estado}'")

        if plan.estado == "approved":
            plan.activate()
            plan_repo.save(plan)

        first_topic = plan.topics[plan.topic_actual_index]
        session = TutoringSession(
            session_id=_generate_id("sess"),
            plan_id=plan.plan_id,
            student_id=input_dto.student_id,
            tenant_id=plan.tenant_id,
            topic_actual=first_topic,
            gagne_event_actual=first_topic.gagne_sequence[0],
            interaction_summary="Inicio de sesión.",
            turns_in_current_event=0,
            student_responses=[],
            score_current_topic=0.0,
            intentos_evento_actual=0,
            transcript=[],
        )

        session_repo.save(session)
        logger.info(
            "Session initialized from plan",
            extra={"session_id": session.session_id, "plan_id": plan.plan_id},
        )
        return domain_session_to_state_dto(session)


class InitFreeSessionUseCase:
    """Create a free-exploration session from a single topic."""

    def execute(self, input_dto: FreeSessionInitInputDTO) -> SessionStateDTO:
        topic = get_topic(input_dto.topic_id)
        if topic is None:
            raise ValueError(f"Topic not found: {input_dto.topic_id}")

        now = _now_iso()
        plan = DomainPlan(
            plan_id=_generate_id("plan"),
            student_id=input_dto.student_id,
            tenant_id=topic["tenant_id"],
            origen="alumno_libre",
            estado="active",
            topics=[
                TopicPlanEntry(
                    topic_id=topic["topic_id"],
                    titulo=topic["titulo"],
                    prioridad=1,
                    error_descripcion="",
                    gagne_sequence=[1, 2, 3, 4, 5, 6, 7, 8, 9],
                ),
            ],
            topic_actual_index=0,
            created_at=now,
            approved_at=now,
            updated_at=now,
        )
        plan_repo.save(plan)

        first_topic = plan.topics[0]
        session = TutoringSession(
            session_id=_generate_id("sess"),
            plan_id=plan.plan_id,
            student_id=input_dto.student_id,
            tenant_id=plan.tenant_id,
            topic_actual=first_topic,
            gagne_event_actual=1,
            interaction_summary="Sesión libre.",
            turns_in_current_event=0,
            student_responses=[],
            score_current_topic=0.0,
            intentos_evento_actual=0,
            transcript=[],
        )
        session_repo.save(session)
        logger.info(
            "Free session initialized",
            extra={"session_id": session.session_id, "topic_id": input_dto.topic_id},
        )
        return domain_session_to_state_dto(session)


class GetSessionUseCase:
    def execute(self, session_id: str) -> SessionStateDTO | None:
        session = session_repo.get(session_id)
        if session is None:
            return None
        return domain_session_to_state_dto(session)


class ProcessTurnUseCase:
    """Process a single student turn: detect state, select event, call Claude, update session."""

    def __init__(self, tutor: ClaudeSessionTutor) -> None:
        self._tutor = tutor

    async def execute(self, input_dto: TurnInputDTO) -> TurnResultDTO:
        session = session_repo.get(input_dto.session_id)
        if session is None:
            raise ValueError(f"Session not found: {input_dto.session_id}")

        # Build face signal domain object
        face_signal: FaceSignal | None = None
        if input_dto.face_signal:
            face_signal = FaceSignal(
                state=input_dto.face_signal.state,
                confidence=input_dto.face_signal.confidence,
                timestamp=input_dto.face_signal.timestamp,
                metrics=input_dto.face_signal.metrics,
            )

        # 1. Detect pedagogical state
        ped_state = detect_state(
            student_message=input_dto.student_message,
            face_signal=face_signal,
            turns_in_current_event=session.turns_in_current_event,
            intentos=session.intentos_evento_actual,
        )

        # 2. Select Gagné event
        event_before = session.gagne_event_actual
        recommended = select_gagne_event(session, ped_state)
        moved_event = recommended != event_before

        # 3. Call Claude session tutor
        reply_text = await self._tutor.generate_reply(
            session=session,
            gagne_event=recommended,
            ped_state=ped_state,
            student_message=input_dto.student_message,
        )

        # 4. Build messages
        now = _now_iso()
        student_msg = ChatMessage(
            id=_generate_id("msg"),
            role="student",
            text=input_dto.student_message,
            timestamp=now,
        )
        tutor_msg = ChatMessage(
            id=_generate_id("msg"),
            role="tutor",
            text=reply_text,
            timestamp=_now_iso(),
            gagne_event=recommended,
        )

        # 5. Update session state
        if moved_event:
            session.topic_actual.mark_event_completed(event_before)

        score_delta = (
            0.15 if ped_state.state == "engaged"
            else 0.08 if ped_state.state == "neutral"
            else -0.05
        )

        session.gagne_event_actual = recommended
        session.last_face_signal = face_signal
        session.last_pedagogical_state = ped_state
        session.turns_in_current_event = 0 if moved_event else session.turns_in_current_event + 1
        session.student_responses = session.student_responses[-2:] + [input_dto.student_message]
        session.score_current_topic = max(0.0, min(1.0, session.score_current_topic + score_delta))
        session.intentos_evento_actual = 0 if moved_event else session.intentos_evento_actual + 1
        session.transcript.append(student_msg)
        session.transcript.append(tutor_msg)

        session_repo.save(session)

        logger.info(
            "Turn processed",
            extra={
                "session_id": session.session_id,
                "ped_state": ped_state.state,
                "event_before": event_before,
                "event_after": recommended,
                "moved": moved_event,
            },
        )

        session_dto = domain_session_to_state_dto(session)
        message_dto = ChatMessageDTO(
            id=tutor_msg.id,
            role=tutor_msg.role,
            text=tutor_msg.text,
            gagne_event=tutor_msg.gagne_event,
            timestamp=tutor_msg.timestamp,
        )
        return TurnResultDTO(message=message_dto, session=session_dto)


class PrimeOpeningUseCase:
    """Generate the opening tutor message for a new session."""

    def __init__(self, tutor: ClaudeSessionTutor) -> None:
        self._tutor = tutor

    async def execute(self, session_id: str) -> TurnResultDTO | None:
        session = session_repo.get(session_id)
        if session is None:
            raise ValueError(f"Session not found: {session_id}")

        if session.transcript:
            return None  # Already has messages

        ped_state = PedagogicalState(
            state="neutral",
            confidence=0.5,
            sources=["text"],
            recommended_event=session.gagne_event_actual,
        )

        reply_text = await self._tutor.generate_reply(
            session=session,
            gagne_event=session.gagne_event_actual,
            ped_state=ped_state,
            student_message="",
        )

        tutor_msg = ChatMessage(
            id=_generate_id("msg"),
            role="tutor",
            text=reply_text,
            timestamp=_now_iso(),
            gagne_event=session.gagne_event_actual,
        )

        session.last_pedagogical_state = ped_state
        session.transcript.append(tutor_msg)
        session_repo.save(session)

        session_dto = domain_session_to_state_dto(session)
        message_dto = ChatMessageDTO(
            id=tutor_msg.id,
            role=tutor_msg.role,
            text=tutor_msg.text,
            gagne_event=tutor_msg.gagne_event,
            timestamp=tutor_msg.timestamp,
        )
        return TurnResultDTO(message=message_dto, session=session_dto)
