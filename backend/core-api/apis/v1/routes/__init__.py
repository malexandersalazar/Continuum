"""API v1 route definitions."""

from apis import api_v1_router
from apis.v1.routes.plans import router as plans_router
from apis.v1.routes.sessions import router as sessions_router

api_v1_router.include_router(plans_router)
api_v1_router.include_router(sessions_router)
