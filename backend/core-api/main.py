"""Main entry point for the FastAPI application."""

import os

import dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

_ = dotenv.load_dotenv(override=True)

from infrastructure.common.logger_service import LoggerService  # noqa: E402

_root_logger = LoggerService(
    log_level=os.getenv("LOG_LEVEL", "INFO"),
    log_dir=os.path.join(os.path.dirname(__file__), "logs"),
    name="",
)

from apis import api_v1  # noqa: E402


def create_app() -> FastAPI:
    app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.mount("/api/v1", api_v1)
    return app

application = create_app()
