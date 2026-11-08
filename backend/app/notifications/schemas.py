# backend/app/notifications/schemas.py
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class NotificationItem(BaseModel):
    id: str
    category: str  # "RISK_ALERT", "EXECUTION", "PROTECTION", "HARVEST", "IOT"
    title: str
    message: str
    severity: str  # "INFO", "WARNING", "CRITICAL", "SUCCESS"
    is_read: bool
    created_at: datetime
    action_route: Optional[str] = None
    action_label: Optional[str] = None


class NotificationListResponse(BaseModel):
    items: List[NotificationItem]
    unread_count: int
    total: int


class MarkReadResponse(BaseModel):
    success: bool
    marked_id: Optional[str] = None
    unread_count: int
