"""0005_farmer_protection_trust

Revision ID: 0005_farmer_protection_trust
Revises: 0004_iot_edge_telematics
Create Date: 2026-11-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0005_farmer_protection_trust'
down_revision: Union[str, None] = '0004_iot_edge_telematics'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Deal Agreements
    op.create_table(
        'deal_agreements',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('agreement_number', sa.String(50), nullable=False, unique=True),
        sa.Column('execution_request_id', sa.String(36), sa.ForeignKey('execution_requests.id', ondelete='SET NULL'), nullable=True),
        sa.Column('farmer_user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('farm_id', sa.String(36), sa.ForeignKey('farms.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('crop_lot_id', sa.String(36), sa.ForeignKey('crop_lots.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('partner_type', sa.String(30), nullable=False, server_default='BUYER'),
        sa.Column('partner_id', sa.String(64), nullable=True),
        sa.Column('partner_name', sa.String(200), nullable=False),
        sa.Column('partner_contact', sa.String(100), nullable=True),
        sa.Column('commodity', sa.String(100), nullable=False),
        sa.Column('variety', sa.String(100), nullable=True),
        sa.Column('quality_grade', sa.String(50), nullable=True),
        sa.Column('agreed_quantity_kg', sa.Numeric(14, 4), nullable=False),
        sa.Column('quantity_unit', sa.String(20), nullable=False, server_default='kg'),
        sa.Column('agreed_unit_price', sa.Numeric(10, 2), nullable=False),
        sa.Column('pricing_unit', sa.String(20), nullable=False, server_default='INR/kg'),
        sa.Column('gross_amount', sa.Numeric(14, 2), nullable=False),
        sa.Column('logistics_deduction', sa.Numeric(14, 2), nullable=False, server_default='0.00'),
        sa.Column('processing_deduction', sa.Numeric(14, 2), nullable=False, server_default='0.00'),
        sa.Column('quality_deduction', sa.Numeric(14, 2), nullable=False, server_default='0.00'),
        sa.Column('other_deductions', sa.Numeric(14, 2), nullable=False, server_default='0.00'),
        sa.Column('total_deductions', sa.Numeric(14, 2), nullable=False, server_default='0.00'),
        sa.Column('estimated_net_payout', sa.Numeric(14, 2), nullable=False),
        sa.Column('quality_requirements', sa.Text(), nullable=True),
        sa.Column('pickup_location', sa.String(300), nullable=True),
        sa.Column('delivery_location', sa.String(300), nullable=False),
        sa.Column('expected_delivery_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('payment_terms_days', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('expected_payment_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(30), nullable=False, server_default='PENDING_ACCEPTANCE'),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('is_latest', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('farmer_accepted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('partner_accepted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('farmer_notes', sa.Text(), nullable=True),
        sa.Column('terms_acknowledged', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('data_mode', sa.String(20), nullable=False, server_default='demo'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_deal_agreements_agreement_number', 'deal_agreements', ['agreement_number'])
    op.create_index('ix_deal_agreements_farmer_user_id', 'deal_agreements', ['farmer_user_id'])
    op.create_index('ix_deal_agreements_execution_request_id', 'deal_agreements', ['execution_request_id'])
    op.create_index('ix_deal_agreements_crop_lot_id', 'deal_agreements', ['crop_lot_id'])
    op.create_index('ix_deal_agreements_farmer_status', 'deal_agreements', ['farmer_user_id', 'status'])

    # 2. Agreement Amendments
    op.create_table(
        'agreement_amendments',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('agreement_id', sa.String(36), sa.ForeignKey('deal_agreements.id', ondelete='CASCADE'), nullable=False),
        sa.Column('version', sa.Integer(), nullable=False),
        sa.Column('changed_by_role', sa.String(30), nullable=False),
        sa.Column('changed_by_name', sa.String(100), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('terms_snapshot_json', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_agreement_amendments_agreement_id', 'agreement_amendments', ['agreement_id'])

    # 3. Delivery Records
    op.create_table(
        'delivery_records',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('delivery_number', sa.String(50), nullable=False, unique=True),
        sa.Column('agreement_id', sa.String(36), sa.ForeignKey('deal_agreements.id', ondelete='CASCADE'), nullable=False),
        sa.Column('execution_request_id', sa.String(36), sa.ForeignKey('execution_requests.id', ondelete='SET NULL'), nullable=True),
        sa.Column('expected_quantity_kg', sa.Numeric(14, 4), nullable=False),
        sa.Column('delivered_quantity_kg', sa.Numeric(14, 4), nullable=False),
        sa.Column('accepted_quantity_kg', sa.Numeric(14, 4), nullable=False),
        sa.Column('rejected_quantity_kg', sa.Numeric(14, 4), nullable=False, server_default='0.00'),
        sa.Column('quantity_unit', sa.String(20), nullable=False, server_default='kg'),
        sa.Column('delivery_timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('delivery_location', sa.String(300), nullable=False),
        sa.Column('farmer_confirmed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('farmer_confirmed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('partner_confirmed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('partner_confirmed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('quality_notes', sa.Text(), nullable=True),
        sa.Column('vehicle_number', sa.String(50), nullable=True),
        sa.Column('driver_contact', sa.String(50), nullable=True),
        sa.Column('evidence_notes', sa.Text(), nullable=True),
        sa.Column('evidence_data_mode', sa.String(30), nullable=False, server_default='SIMULATED_DEMO_PROOF'),
        sa.Column('status', sa.String(30), nullable=False, server_default='PENDING'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_delivery_records_delivery_number', 'delivery_records', ['delivery_number'])
    op.create_index('ix_delivery_records_agreement_id', 'delivery_records', ['agreement_id'])
    op.create_index('ix_delivery_records_status', 'delivery_records', ['status'])

    # 4. Payment Records
    op.create_table(
        'payment_records',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('payment_reference', sa.String(100), nullable=False, unique=True),
        sa.Column('agreement_id', sa.String(36), sa.ForeignKey('deal_agreements.id', ondelete='CASCADE'), nullable=False),
        sa.Column('execution_request_id', sa.String(36), sa.ForeignKey('execution_requests.id', ondelete='SET NULL'), nullable=True),
        sa.Column('amount_due', sa.Numeric(14, 2), nullable=False),
        sa.Column('amount_paid', sa.Numeric(14, 2), nullable=False),
        sa.Column('payment_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('due_date', sa.DateTime(timezone=True), nullable=False),
        sa.Column('payment_method', sa.String(50), nullable=False, server_default='BANK_TRANSFER'),
        sa.Column('payment_status', sa.String(30), nullable=False, server_default='PENDING'),
        sa.Column('payer_name', sa.String(150), nullable=False),
        sa.Column('payee_name', sa.String(150), nullable=False),
        sa.Column('transaction_reference_id', sa.String(100), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('data_mode', sa.String(20), nullable=False, server_default='SIMULATED'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_payment_records_payment_reference', 'payment_records', ['payment_reference'])
    op.create_index('ix_payment_records_agreement_id', 'payment_records', ['agreement_id'])
    op.create_index('ix_payment_records_due_date', 'payment_records', ['due_date'])
    op.create_index('ix_payment_records_payment_status', 'payment_records', ['payment_status'])

    # 5. Farmer Disputes
    op.create_table(
        'farmer_disputes',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('dispute_reference', sa.String(50), nullable=False, unique=True),
        sa.Column('agreement_id', sa.String(36), sa.ForeignKey('deal_agreements.id', ondelete='CASCADE'), nullable=False),
        sa.Column('farmer_user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('delivery_record_id', sa.String(36), sa.ForeignKey('delivery_records.id', ondelete='SET NULL'), nullable=True),
        sa.Column('payment_record_id', sa.String(36), sa.ForeignKey('payment_records.id', ondelete='SET NULL'), nullable=True),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('disputed_amount', sa.Numeric(14, 2), nullable=True),
        sa.Column('evidence_notes', sa.Text(), nullable=True),
        sa.Column('evidence_data_mode', sa.String(30), nullable=False, server_default='DEMO_EVIDENCE'),
        sa.Column('status', sa.String(30), nullable=False, server_default='OPEN'),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('resolved_by', sa.String(100), nullable=True),
        sa.Column('disclaimer', sa.String(255), nullable=False, server_default='Internal platform record and workflow. Not a court, arbitration service, or legal authority.'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_farmer_disputes_dispute_reference', 'farmer_disputes', ['dispute_reference'])
    op.create_index('ix_farmer_disputes_agreement_id', 'farmer_disputes', ['agreement_id'])
    op.create_index('ix_farmer_disputes_farmer_status', 'farmer_disputes', ['farmer_user_id', 'status'])

    # 6. Dispute Events
    op.create_table(
        'dispute_events',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('dispute_id', sa.String(36), sa.ForeignKey('farmer_disputes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('actor_role', sa.String(30), nullable=False),
        sa.Column('actor_name', sa.String(100), nullable=False),
        sa.Column('action', sa.String(50), nullable=False),
        sa.Column('previous_status', sa.String(30), nullable=True),
        sa.Column('new_status', sa.String(30), nullable=True),
        sa.Column('notes', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_dispute_events_dispute_id', 'dispute_events', ['dispute_id'])

    # 7. Farmer Risk Alerts
    op.create_table(
        'farmer_risk_alerts',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('farmer_user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('agreement_id', sa.String(36), sa.ForeignKey('deal_agreements.id', ondelete='CASCADE'), nullable=True),
        sa.Column('risk_type', sa.String(50), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False, server_default='WARNING'),
        sa.Column('trigger_evidence', sa.Text(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('recommended_action', sa.Text(), nullable=False),
        sa.Column('is_resolved', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('resolution_notes', sa.Text(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_farmer_risk_alerts_farmer_resolved', 'farmer_risk_alerts', ['farmer_user_id', 'is_resolved'])
    op.create_index('ix_farmer_risk_alerts_agreement_id', 'farmer_risk_alerts', ['agreement_id'])

    # 8. Transaction Audit Events
    op.create_table(
        'transaction_audit_events',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('agreement_id', sa.String(36), sa.ForeignKey('deal_agreements.id', ondelete='CASCADE'), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('actor_role', sa.String(30), nullable=False),
        sa.Column('actor_name', sa.String(100), nullable=False),
        sa.Column('summary', sa.String(255), nullable=False),
        sa.Column('details_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_transaction_audit_events_agreement_id', 'transaction_audit_events', ['agreement_id'])
    op.create_index('ix_transaction_audit_events_created_at', 'transaction_audit_events', ['created_at'])


def downgrade() -> None:
    op.drop_table('transaction_audit_events')
    op.drop_table('farmer_risk_alerts')
    op.drop_table('dispute_events')
    op.drop_table('farmer_disputes')
    op.drop_table('payment_records')
    op.drop_table('delivery_records')
    op.drop_table('agreement_amendments')
    op.drop_table('deal_agreements')
