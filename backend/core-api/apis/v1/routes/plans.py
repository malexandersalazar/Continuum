"""Plans route definitions."""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from apis.v1.mappers import to_leveling_plan_response, to_plan_generate_input
from apis.v1.schemas.requests import GeneratePlanRequest, UpdateEstadoRequest
from apis.v1.schemas.responses import LevelingPlanResponse
from application.use_cases import ApprovePlanUseCase, GeneratePlanUseCase, GetPlanUseCase, ListPlansUseCase
from infrastructure.ai.claude_exam_analyzer import ClaudeExamAnalyzer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/plans", tags=["plans"])


@router.post("/generate", response_model=LevelingPlanResponse)
async def generate_plan(body: GeneratePlanRequest) -> LevelingPlanResponse:
    logger.info(
        "POST /plans/generate received",
        extra={
            "student_id": body.student_id,
            "teacher_id": body.teacher_id,
            "topic_count": len(body.topic_ids),
            "exam_count": len(body.exams),
            "topic_ids": body.topic_ids,
        },
    )
    try:
        analyzer = ClaudeExamAnalyzer()
        use_case = GeneratePlanUseCase(analyzer)
        input_dto = to_plan_generate_input(body)
        result = await use_case.execute(input_dto)
        response = to_leveling_plan_response(result)
        logger.info(
            "POST /plans/generate success",
            extra={"plan_id": response.plan_id, "topic_count": len(response.topics)},
        )
        return response
    except ValueError as e:
        logger.warning("Validation error in /plans/generate", extra={"error": str(e)})
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception("Error generating plan")
        raise HTTPException(status_code=500, detail=f"Error generating plan: {e}")


@router.get("", response_model=list[LevelingPlanResponse])
async def list_plans(
    student_id: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
) -> list[LevelingPlanResponse]:
    use_case = ListPlansUseCase()
    plans = use_case.execute(student_id=student_id, estado=estado)
    return [to_leveling_plan_response(p) for p in plans]


@router.get("/{plan_id}", response_model=LevelingPlanResponse)
async def get_plan(plan_id: str) -> LevelingPlanResponse:
    use_case = GetPlanUseCase()
    plan = use_case.execute(plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail=f"Plan not found: {plan_id}")
    return to_leveling_plan_response(plan)


@router.put("/{plan_id}/estado", response_model=LevelingPlanResponse)
async def update_plan_estado(plan_id: str, body: UpdateEstadoRequest) -> LevelingPlanResponse:
    if body.estado != "approved":
        raise HTTPException(status_code=400, detail="Only 'approved' estado transition is supported")
    use_case = ApprovePlanUseCase()
    plan = use_case.execute(plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail=f"Plan not found: {plan_id}")
    return to_leveling_plan_response(plan)
