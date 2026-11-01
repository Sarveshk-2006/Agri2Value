# backend/app/main.py
"""
Agri2Value — FastAPI Application Entry Point.

Registers all routers, middleware, CORS and exception handlers.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import get_settings
from app.core.errors import (
    AppError,
    app_error_handler,
    http_exception_handler,
    unhandled_exception_handler,
)
from app.core.logging import configure_logging, get_logger
from app.database.base import check_db_connection

# ---- Import routers -----------------------------------------
from app.auth.router import router as auth_router
from app.farms.router import router as farms_router
from app.crop_lots.router import farm_crop_lots_router, crop_lots_router

settings = get_settings()
configure_logging(debug=settings.DEBUG)
logger = get_logger("main")


# ---- Application Lifespan ------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Run startup and shutdown tasks."""
    logger.info(
        "Agri2Value starting",
        env=settings.APP_ENV,
        demo_mode=settings.DEMO_MODE,
        api_prefix=settings.API_V1_PREFIX,
    )
    db_ok = await check_db_connection()
    if db_ok:
        logger.info("Database connection: OK")
    else:
        logger.error(
            "Database connection FAILED on startup. "
            "Ensure PostgreSQL is running and DATABASE_URL is correct."
        )
    yield
    logger.info("Agri2Value shutting down")


# ---- Application Factory -------------------------------------

def create_app() -> FastAPI:
    app = FastAPI(
        title="Agri2Value API",
        description=(
            "AI-assisted farm-to-profit decision and execution platform.\n\n"
            f"**{'⚠️ DEMO MODE ACTIVE' if settings.DEMO_MODE else 'Live Mode'}** — "
            "All authentication in this environment is demonstration-only. "
            "No real OTP is sent."
        ),
        version="0.1.0",
        docs_url=f"{settings.API_V1_PREFIX}/docs",
        redoc_url=f"{settings.API_V1_PREFIX}/redoc",
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        lifespan=lifespan,
    )

    # ---- CORS ------------------------------------------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ---- Exception handlers ----------------------------------
    from fastapi import HTTPException
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

    # ---- Health endpoint -------------------------------------
    @app.get(
        f"{settings.API_V1_PREFIX}/health",
        tags=["Health"],
        summary="Application Health Check",
    )
    async def health_check():
        db_healthy = await check_db_connection()
        return JSONResponse(
            status_code=200 if db_healthy else 503,
            content={
                "status": "healthy" if db_healthy else "degraded",
                "app": settings.APP_NAME,
                "version": "0.1.0",
                "environment": settings.APP_ENV,
                "demo_mode": settings.DEMO_MODE,
                "database": "connected" if db_healthy else "unreachable",
                "warning": (
                    "DEMO MODE: Authentication is for demonstration purposes only. "
                    "Not for production use."
                ) if settings.DEMO_MODE else None,
            },
        )

    # ---- Register routers ------------------------------------
    prefix = settings.API_V1_PREFIX

    app.include_router(auth_router, prefix=prefix)
    app.include_router(farms_router, prefix=prefix)
    app.include_router(farm_crop_lots_router, prefix=prefix)
    app.include_router(crop_lots_router, prefix=prefix)

    return app


app = create_app()
