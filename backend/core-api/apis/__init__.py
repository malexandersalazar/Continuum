"""This module defines the API routers for the Continuum Core API."""

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

api_v1_router = APIRouter()

from .v1.routes import *  # noqa: E402

api_v1 = FastAPI(title="Continuum Core API V1", version="1.0")
api_v1.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
api_v1.include_router(api_v1_router)
