"""Session route definitions."""

import logging

from fastapi import APIRouter, HTTPException, Response

from apis.v1.mappers import (
    to_free_session_init_input,
    to_session_init_input,
    to_session_state_response,
    to_turn_input,
    to_turn_response,
)
from apis.v1.schemas.requests import InitFreeSessionRequest, InitSessionRequest, PostTurnRequest
from apis.v1.schemas.responses import SessionStateResponse, TurnResponse
from application.use_cases import (
    GetSessionUseCase,
    InitFreeSessionUseCase,
    InitSessionUseCase,
    PrimeOpeningUseCase,
    ProcessTurnUseCase,
)
from infrastructure.ai.claude_session_tutor import ClaudeSessionTutor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/init", response_model=SessionStateResponse)
async def init_session(body: InitSessionRequest) -> SessionStateResponse:
    logger.info(
        "POST /sessions/init received",
        extra={"plan_id": body.plan_id, "student_id": body.student_id},
    )
    try:
        tutor = ClaudeSessionTutor()
        use_case = InitSessionUseCase(tutor)
        input_dto = to_session_init_input(body)
        result = use_case.execute(input_dto)
        return to_session_state_response(result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Error initializing session")
        raise HTTPException(status_code=500, detail=f"Error initializing session: {e}")


@router.post("/init-free", response_model=SessionStateResponse)
async def init_free_session(body: InitFreeSessionRequest) -> SessionStateResponse:
    logger.info(
        "POST /sessions/init-free received",
        extra={"topic_id": body.topic_id, "student_id": body.student_id},
    )
    try:
        use_case = InitFreeSessionUseCase()
        input_dto = to_free_session_init_input(body)
        result = use_case.execute(input_dto)
        return to_session_state_response(result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Error initializing free session")
        raise HTTPException(status_code=500, detail=f"Error initializing free session: {e}")


@router.get("/{session_id}", response_model=SessionStateResponse)
async def get_session(session_id: str) -> SessionStateResponse:
    use_case = GetSessionUseCase()
    result = use_case.execute(session_id)
    if result is None:
        raise HTTPException(status_code=404, detail=f"Session not found: {session_id}")
    return to_session_state_response(result)


@router.post("/{session_id}/turn", response_model=TurnResponse)
async def post_turn(session_id: str, body: PostTurnRequest) -> TurnResponse:
    logger.info(
        "POST /sessions/{session_id}/turn received",
        extra={
            "session_id": session_id,
            "message_length": len(body.student_message),
            "has_face_signal": body.face_signal is not None,
        },
    )
    try:
        tutor = ClaudeSessionTutor()
        use_case = ProcessTurnUseCase(tutor)
        input_dto = to_turn_input(session_id, body)
        result = await use_case.execute(input_dto)
        return to_turn_response(result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Error processing turn")
        raise HTTPException(status_code=500, detail=f"Error processing turn: {e}")


@router.post("/{session_id}/prime", response_model=TurnResponse)
async def prime_opening(session_id: str) -> TurnResponse | Response:
    logger.info("POST /sessions/{session_id}/prime received", extra={"session_id": session_id})
    try:
        tutor = ClaudeSessionTutor()
        use_case = PrimeOpeningUseCase(tutor)
        result = await use_case.execute(session_id)
        if result is None:
            return Response(status_code=204)
        return to_turn_response(result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("Error priming opening")
        raise HTTPException(status_code=500, detail=f"Error priming opening: {e}")
