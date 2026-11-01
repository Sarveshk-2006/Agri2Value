# backend/app/core/errors.py
"""
Centralized error handling and custom exceptions for Agri2Value.
"""
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse


# ---- Custom Exception Classes ---------------------------------

class AppError(Exception):
    """Base class for application-specific errors."""
    def __init__(self, message: str, code: str = "APP_ERROR"):
        self.message = message
        self.code = code
        super().__init__(message)


class NotFoundError(AppError):
    def __init__(self, resource: str, resource_id: str = ""):
        msg = f"{resource} not found"
        if resource_id:
            msg += f": {resource_id}"
        super().__init__(msg, "NOT_FOUND")


class AuthorizationError(AppError):
    def __init__(self, message: str = "You are not authorized to access this resource."):
        super().__init__(message, "AUTHORIZATION_ERROR")


class ValidationError(AppError):
    def __init__(self, message: str):
        super().__init__(message, "VALIDATION_ERROR")


class DuplicateError(AppError):
    def __init__(self, resource: str):
        super().__init__(f"{resource} already exists.", "DUPLICATE_ERROR")


# ---- Exception Handlers (registered in main.py) ---------------

async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    status_map = {
        "NOT_FOUND": status.HTTP_404_NOT_FOUND,
        "AUTHORIZATION_ERROR": status.HTTP_403_FORBIDDEN,
        "VALIDATION_ERROR": status.HTTP_422_UNPROCESSABLE_ENTITY,
        "DUPLICATE_ERROR": status.HTTP_409_CONFLICT,
    }
    status_code = status_map.get(exc.code, status.HTTP_400_BAD_REQUEST)
    return JSONResponse(
        status_code=status_code,
        content={
            "error": exc.code,
            "message": exc.message,
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTP_ERROR",
            "message": exc.detail,
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    # Log internally but never expose internal error details to clients
    from app.core.logging import get_logger
    logger = get_logger("errors")
    logger.error(
        "Unhandled exception",
        path=request.url.path,
        method=request.method,
        error_type=type(exc).__name__,
        # Do NOT log exc args — they may contain sensitive data
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An unexpected error occurred. Please try again later.",
        },
    )
