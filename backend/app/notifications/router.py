# backend/app/notifications/router.py
"""FastAPI Router for Real-Time Farmer Notifications & Alerts."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel

from app.auth.dependencies import get_current_user
from app.database.base import get_db
from app.database.models import User
from app.notifications.schemas import NotificationListResponse, MarkReadResponse
from app.notifications.service import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications & Alerts"])


class MarkAllReadRequest(BaseModel):
    item_ids: Optional[List[str]] = None


@router.get(
    "",
    response_model=NotificationListResponse,
    summary="List Farmer Notifications & Alerts",
    description="Returns aggregated notifications across risk alerts, harvest lots, execution requests, and contracts.",
)
async def list_notifications(
    limit: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await notification_service.get_notifications_for_user(db, current_user, limit=limit)


@router.post(
    "/{notification_id}/read",
    response_model=MarkReadResponse,
    summary="Mark Single Notification as Read",
)
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notification_service.mark_read(current_user.id, notification_id)
    notifs = await notification_service.get_notifications_for_user(db, current_user)
    return MarkReadResponse(
        success=True,
        marked_id=notification_id,
        unread_count=notifs.unread_count,
    )


@router.post(
    "/mark-all-read",
    response_model=MarkReadResponse,
    summary="Mark All Notifications as Read",
)
async def mark_all_read(
    payload: Optional[MarkAllReadRequest] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notifs = await notification_service.get_notifications_for_user(db, current_user)
    ids_to_mark = payload.item_ids if (payload and payload.item_ids) else [it.id for it in notifs.items]
    notification_service.mark_all_read(current_user.id, ids_to_mark)
    return MarkReadResponse(
        success=True,
        marked_id=None,
        unread_count=0,
    )

