# backend/app/notifications/service.py
"""
Aggregated Notification Engine for Agri2Value.

Combines alerts and lifecycle milestones across:
1. FarmerRiskAlerts (overdue payments, escrow disputes)
2. ExecutionRequestEvents (logistics dispatch, delivery confirmations)
3. CropLotEvents (harvest registrations, crop rescue watchdog)
4. TransactionAuditEvents (deal contract acceptance)
5. IoTAlerts (soil moisture / temperature anomalies)

Maintains read/unread state per user.
"""
from typing import List, Set, Dict, Any
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database.models import (
    User,
    FarmerRiskAlert,
    ExecutionRequest,
    ExecutionRequestEvent,
    CropLot,
    CropLotEvent,
    TransactionAuditEvent,
    DealAgreement,
    IoTAlert,
    Farm,
)
from app.notifications.schemas import NotificationItem, NotificationListResponse

# User read notifications registry (persisted in-process for farmer session)
_user_read_notifications: Dict[str, Set[str]] = {}


class NotificationService:
    async def get_notifications_for_user(
        self,
        db: AsyncSession,
        user: User,
        limit: int = 25,
    ) -> NotificationListResponse:
        read_set = _user_read_notifications.setdefault(user.id, set())
        items: List[NotificationItem] = []

        # 1. Farmer Risk Alerts
        risk_stmt = (
            select(FarmerRiskAlert)
            .where(FarmerRiskAlert.farmer_user_id == user.id)
            .order_by(FarmerRiskAlert.created_at.desc())
            .limit(10)
        )
        risk_res = await db.execute(risk_stmt)
        for ra in risk_res.scalars().all():
            notif_id = f"risk-{ra.id}"
            is_read = notif_id in read_set or ra.is_resolved
            items.append(
                NotificationItem(
                    id=notif_id,
                    category="RISK_ALERT",
                    title=f"Risk Alert: {ra.risk_type.replace('_', ' ').title()}",
                    message=ra.explanation or ra.trigger_evidence,
                    severity="WARNING" if ra.severity == "WARNING" else "CRITICAL",
                    is_read=is_read,
                    created_at=ra.created_at,
                    action_route="/app/protection",
                    action_label="Review Agreement",
                )
            )

        # 2. Execution Request Status Updates
        exec_stmt = (
            select(ExecutionRequest)
            .where(ExecutionRequest.farmer_user_id == user.id)
            .options(selectinload(ExecutionRequest.events))
            .order_by(ExecutionRequest.created_at.desc())
            .limit(5)
        )
        exec_res = await db.execute(exec_stmt)
        for req in exec_res.scalars().all():
            for evt in (req.events or []):
                notif_id = f"exec-{evt.id}"
                items.append(
                    NotificationItem(
                        id=notif_id,
                        category="EXECUTION",
                        title=f"Execution Update: {evt.to_status}",
                        message=evt.message or f"Order transitioned to {evt.to_status}",
                        severity="SUCCESS" if evt.to_status in ("CONFIRMED", "COMPLETED") else "INFO",
                        is_read=notif_id in read_set,
                        created_at=evt.created_at,
                        action_route="/app/execution",
                        action_label="Track Order",
                    )
                )

        # 3. Crop Lot Events (Harvest, Rescue, Decision)
        lot_stmt = (
            select(CropLot)
            .where(CropLot.owner_user_id == user.id)
            .options(selectinload(CropLot.events))
            .order_by(CropLot.created_at.desc())
            .limit(5)
        )
        lot_res = await db.execute(lot_stmt)
        for lot in lot_res.scalars().all():
            for evt in (lot.events or []):
                notif_id = f"lot-{evt.id}"
                items.append(
                    NotificationItem(
                        id=notif_id,
                        category="HARVEST",
                        title=f"Harvest Lot: {lot.crop_name} ({evt.event_type})",
                        message=evt.description or f"Event {evt.event_type} on lot {lot.crop_name}",
                        severity="WARNING" if "RESCUE" in evt.event_type else "INFO",
                        is_read=notif_id in read_set,
                        created_at=evt.created_at,
                        action_route="/app/lots",
                        action_label="View Produce",
                    )
                )

        # 4. Deal Agreements Audit Events
        agr_stmt = (
            select(DealAgreement)
            .where(DealAgreement.farmer_user_id == user.id)
            .options(selectinload(DealAgreement.audit_events))
            .order_by(DealAgreement.created_at.desc())
            .limit(5)
        )
        agr_res = await db.execute(agr_stmt)
        for agr in agr_res.scalars().all():
            for audit in (agr.audit_events or []):
                notif_id = f"audit-{audit.id}"
                items.append(
                    NotificationItem(
                        id=notif_id,
                        category="PROTECTION",
                        title=f"Agreement {agr.agreement_number}: {audit.event_type}",
                        message=audit.summary,
                        severity="SUCCESS" if "ACCEPTED" in audit.event_type else "INFO",
                        is_read=notif_id in read_set,
                        created_at=audit.created_at,
                        action_route="/app/protection",
                        action_label="Open Ledger",
                    )
                )

        # Sort all aggregated items descending by created_at
        items.sort(key=lambda x: x.created_at, reverse=True)
        items = items[:limit]

        unread_count = sum(1 for it in items if not it.is_read)

        return NotificationListResponse(
            items=items,
            unread_count=unread_count,
            total=len(items),
        )

    def mark_read(self, user_id: str, notification_id: str) -> None:
        read_set = _user_read_notifications.setdefault(user_id, set())
        read_set.add(notification_id)

    def mark_all_read(self, user_id: str, item_ids: List[str]) -> None:
        read_set = _user_read_notifications.setdefault(user_id, set())
        read_set.update(item_ids)


notification_service = NotificationService()

