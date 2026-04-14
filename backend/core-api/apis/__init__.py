"""This module defines the API routers for the Continuum Core API."""

from fastapi import APIRouter, FastAPI

from .v1.routes import *

api_v1_router = APIRouter()

api_v1 = FastAPI(title="Continuum Core API V1", version="1.0")
api_v1.include_router(api_v1_router)
