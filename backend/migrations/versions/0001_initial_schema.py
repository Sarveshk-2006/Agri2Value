"""0001_initial_schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-11-01 20:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Users Table ---
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('full_name', sa.String(200), nullable=False),
        sa.Column('phone', sa.String(20), nullable=False, unique=True),
        sa.Column('role', sa.String(50), nullable=False, server_default='FARMER'),
        sa.Column('preferred_language', sa.String(10), nullable=False, server_default='en'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_users_phone', 'users', ['phone'], unique=True)

    # --- Farms Table ---
    op.create_table(
        'farms',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('owner_user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('farm_name', sa.String(200), nullable=False),
        sa.Column('state', sa.String(100), nullable=False),
        sa.Column('district', sa.String(100), nullable=False),
        sa.Column('village', sa.String(200), nullable=False),
        sa.Column('latitude', sa.Numeric(10, 7), nullable=True),
        sa.Column('longitude', sa.Numeric(10, 7), nullable=True),
        sa.Column('land_area', sa.Numeric(10, 4), nullable=True),
        sa.Column('land_area_unit', sa.String(20), nullable=False, server_default='acre'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_farms_owner_user_id', 'farms', ['owner_user_id'])
    op.create_index('ix_farms_owner_district', 'farms', ['owner_user_id', 'district'])

    # --- Farm Resources Table ---
    op.create_table(
        'farm_resources',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('farm_id', sa.String(36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('resource_type', sa.String(100), nullable=False),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('quantity', sa.Numeric(12, 4), nullable=True),
        sa.Column('unit', sa.String(50), nullable=True),
        sa.Column('availability_status', sa.String(50), nullable=False, server_default='available'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_farm_resources_farm_id', 'farm_resources', ['farm_id'])

    # --- Crop Lots Table ---
    op.create_table(
        'crop_lots',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('farm_id', sa.String(36), sa.ForeignKey('farms.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('owner_user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('crop_name', sa.String(100), nullable=False),
        sa.Column('variety', sa.String(100), nullable=True),
        sa.Column('quantity', sa.Numeric(12, 4), nullable=False),
        sa.Column('quantity_unit', sa.String(20), nullable=False),
        sa.Column('quantity_kg_normalized', sa.Numeric(14, 4), nullable=False),
        sa.Column('harvest_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('quality_grade', sa.String(50), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='DRAFT'),
        sa.Column('data_mode', sa.String(20), nullable=False, server_default='real'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_crop_lots_farm_id', 'crop_lots', ['farm_id'])
    op.create_index('ix_crop_lots_owner_user_id', 'crop_lots', ['owner_user_id'])
    op.create_index('ix_crop_lots_crop_name', 'crop_lots', ['crop_name'])
    op.create_index('ix_crop_lots_owner_status', 'crop_lots', ['owner_user_id', 'status'])
    op.create_index('ix_crop_lots_farm_crop', 'crop_lots', ['farm_id', 'crop_name'])

    # --- Crop Lot Events Table ---
    op.create_table(
        'crop_lot_events',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('crop_lot_id', sa.String(36), sa.ForeignKey('crop_lots.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('actor_user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_crop_lot_events_crop_lot_id', 'crop_lot_events', ['crop_lot_id'])


def downgrade() -> None:
    op.drop_table('crop_lot_events')
    op.drop_table('crop_lots')
    op.drop_table('farm_resources')
    op.drop_table('farms')
    op.drop_table('users')
