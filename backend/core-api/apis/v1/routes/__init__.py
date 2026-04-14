"""API v1 route definitions."""

import logging

from fastapi import HTTPException

from apis import api_v1_router
from apis.v1.mappers import to_leveling_plan_response, to_plan_generate_input
from apis.v1.schemas.requests import GeneratePlanRequest
from apis.v1.schemas.responses import LevelingPlanResponse
from application.use_cases import GeneratePlanUseCase
from infrastructure.ai.claude_exam_analyzer import ClaudeExamAnalyzer

logger = logging.getLogger(__name__)


@api_v1_router.post("/plans/generate", response_model=LevelingPlanResponse)
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
