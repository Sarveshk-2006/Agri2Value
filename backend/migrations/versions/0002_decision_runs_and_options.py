"""0002_decision_runs_and_options

Revision ID: 0002_decision_runs_and_options
Revises: 0001_initial_schema
Create Date: 2026-11-01 22:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0002_decision_runs_and_options'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Decision Runs Table ---
    op.create_table(
        'decision_runs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('crop_lot_id', sa.String(36), sa.ForeignKey('crop_lots.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('owner_user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('algorithm_version', sa.String(50), nullable=False, server_default='v2.0-deterministic'),
        sa.Column('status', sa.String(50), nullable=False, server_default='COMPLETED'),
        sa.Column('recommended_option_id', sa.String(50), nullable=True),
        sa.Column('recommended_route_type', sa.String(50), nullable=True),
        sa.Column('recommended_net_profit', sa.Numeric(14, 2), nullable=True),
        sa.Column('baseline_net_profit', sa.Numeric(14, 2), nullable=True),
        sa.Column('additional_profit_vs_baseline', sa.Numeric(14, 2), nullable=True),
        sa.Column('input_snapshot', sa.Text(), nullable=False),
        sa.Column('disclaimer', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_decision_runs_crop_lot_id', 'decision_runs', ['crop_lot_id'])
    op.create_index('ix_decision_runs_owner_user_id', 'decision_runs', ['owner_user_id'])
    op.create_index('ix_decision_runs_owner_lot', 'decision_runs', ['owner_user_id', 'crop_lot_id'])

    # --- Decision Options Table ---
    op.create_table(
        'decision_options',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('decision_run_id', sa.String(36), sa.ForeignKey('decision_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('route_type', sa.String(50), nullable=False),
        sa.Column('route_name', sa.String(200), nullable=False),
        sa.Column('feasibility_status', sa.String(50), nullable=False),
        sa.Column('rank', sa.Integer(), nullable=True),
        sa.Column('is_recommended', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('saleable_quantity', sa.Numeric(14, 4), nullable=False),
        sa.Column('saleable_quantity_unit', sa.String(20), nullable=False),
        sa.Column('gross_revenue', sa.Numeric(14, 2), nullable=False),
        sa.Column('total_costs', sa.Numeric(14, 2), nullable=False),
        sa.Column('net_profit', sa.Numeric(14, 2), nullable=False),
        sa.Column('net_profit_per_kg', sa.Numeric(14, 2), nullable=False),
        sa.Column('effective_realization_per_kg', sa.Numeric(14, 2), nullable=False),
        sa.Column('additional_profit_vs_baseline', sa.Numeric(14, 2), nullable=False, server_default='0'),
        sa.Column('time_to_payment_days', sa.Integer(), nullable=True),
        sa.Column('cost_breakdown', sa.Text(), nullable=False),
        sa.Column('feasibility_reasons', sa.Text(), nullable=False),
        sa.Column('risks_and_confidence', sa.Text(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('data_source', sa.String(200), nullable=False),
        sa.Column('data_timestamp', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_decision_options_decision_run_id', 'decision_options', ['decision_run_id'])
    op.create_index('ix_decision_options_route_type', 'decision_options', ['route_type'])


def downgrade() -> None:
    op.drop_table('decision_options')
    op.drop_table('decision_runs')
