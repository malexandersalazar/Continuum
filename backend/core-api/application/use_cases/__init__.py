"""Application use cases."""

from __future__ import annotations

import logging

from application.dtos import LevelingPlanDTO, PlanGenerateInputDTO
from infrastructure.ai.claude_exam_analyzer import ClaudeExamAnalyzer
from infrastructure.knowledge_base import get_topics

logger = logging.getLogger(__name__)


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

        logger.info(
            "GeneratePlanUseCase completed",
            extra={"plan_id": plan.plan_id, "plan_topic_count": len(plan.topics)},
        )

        return plan
