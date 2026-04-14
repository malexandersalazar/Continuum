"""Repositories for plans and sessions.

PlanRepository is backed by a JSON file (PLANS_DB_PATH env var, default: data/plans.json)
so plans survive server restarts. SessionRepository remains in-memory (sessions are
transient within a dev run).
"""

from __future__ import annotations

import json
import logging
import os
from dataclasses import asdict
from pathlib import Path

from domain import LevelingPlan, TopicPlanEntry, TutoringSession

logger = logging.getLogger(__name__)

_PLANS_DB_PATH = Path(os.getenv("PLANS_DB_PATH", "data/plans.json"))


def _dict_to_plan(d: dict) -> LevelingPlan:
    topics = [TopicPlanEntry(**t) for t in d["topics"]]
    return LevelingPlan(
        plan_id=d["plan_id"],
        student_id=d["student_id"],
        tenant_id=d["tenant_id"],
        origen=d["origen"],
        estado=d["estado"],
        topics=topics,
        topic_actual_index=d["topic_actual_index"],
        created_at=d["created_at"],
        approved_at=d.get("approved_at"),
        updated_at=d["updated_at"],
    )


class PlanRepository:
    def __init__(self) -> None:
        self._plans: dict[str, LevelingPlan] = {}
        self._path = _PLANS_DB_PATH
        self._load()

    def _load(self) -> None:
        if not self._path.exists():
            return
        try:
            with open(self._path) as f:
                data = json.load(f)
            for plan_dict in data:
                plan = _dict_to_plan(plan_dict)
                self._plans[plan.plan_id] = plan
            logger.info("Plans loaded from disk", extra={"count": len(self._plans), "path": str(self._path)})
        except Exception:
            logger.warning("Failed to load plans from disk — starting with empty store", exc_info=True)

    def _flush(self) -> None:
        self._path.parent.mkdir(parents=True, exist_ok=True)
        with open(self._path, "w") as f:
            json.dump([asdict(p) for p in self._plans.values()], f, indent=2)

    def save(self, plan: LevelingPlan) -> None:
        self._plans[plan.plan_id] = plan
        self._flush()
        logger.info("Plan saved", extra={"plan_id": plan.plan_id, "estado": plan.estado})

    def get(self, plan_id: str) -> LevelingPlan | None:
        return self._plans.get(plan_id)

    def list_all(self) -> list[LevelingPlan]:
        return sorted(self._plans.values(), key=lambda p: p.created_at, reverse=True)

    def list_by_student(self, student_id: str) -> list[LevelingPlan]:
        return sorted(
            [p for p in self._plans.values() if p.student_id == student_id],
            key=lambda p: p.created_at,
            reverse=True,
        )

    def list_by_estado(self, estado: str) -> list[LevelingPlan]:
        return sorted(
            [p for p in self._plans.values() if p.estado == estado],
            key=lambda p: p.created_at,
            reverse=True,
        )


class SessionRepository:
    def __init__(self) -> None:
        self._sessions: dict[str, TutoringSession] = {}

    def save(self, session: TutoringSession) -> None:
        self._sessions[session.session_id] = session
        logger.info(
            "Session saved",
            extra={"session_id": session.session_id, "status": session.status},
        )

    def get(self, session_id: str) -> TutoringSession | None:
        return self._sessions.get(session_id)

    def list_by_student(self, student_id: str) -> list[TutoringSession]:
        return [s for s in self._sessions.values() if s.student_id == student_id]


plan_repo = PlanRepository()
session_repo = SessionRepository()
