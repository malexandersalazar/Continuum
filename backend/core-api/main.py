"""Main entry point for the FastAPI application."""

import dotenv
from fastapi import FastAPI

from apis import api_v1

_ = dotenv.load_dotenv(override=True)

def create_app() -> FastAPI:
    """Factory function to create the FastAPI app instance."""
    app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
    app.mount("/api/v1", api_v1)
    return app

application = create_app()
