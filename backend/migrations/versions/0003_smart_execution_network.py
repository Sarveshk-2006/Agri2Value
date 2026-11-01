"""0003_smart_execution_network

Revision ID: 0003_smart_execution_network
Revises: 0002_decision_runs_and_options
Create Date: 2026-11-01 23:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0003_smart_execution_network'
down_revision: Union[str, None] = '0002_decision_runs_and_options'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Buyers
    op.create_table(
        'buyers',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('company_name', sa.String(200), nullable=False),
        sa.Column('contact_person', sa.String(200), nullable=False),
        sa.Column('phone', sa.String(20), nullable=False),
        sa.Column('email', sa.String(200), nullable=True),
        sa.Column('district', sa.String(100), nullable=False),
        sa.Column('state', sa.String(100), nullable=False, server_default='Maharashtra'),
        sa.Column('address', sa.String(300), nullable=False),
        sa.Column('buyer_type', sa.String(50), nullable=False, server_default='DIRECT_RETAIL'),
        sa.Column('service_radius_km', sa.Numeric(8, 2), nullable=False, server_default='100.00'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('verification_badge', sa.String(50), nullable=False, server_default='DEMO_SIMULATION'),
        sa.Column('rating', sa.Numeric(3, 2), nullable=True),
        sa.Column('data_mode', sa.String(20), nullable=False, server_default='demo'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_buyers_company_name', 'buyers', ['company_name'])
    op.create_index('ix_buyers_district', 'buyers', ['district'])

    # 2. Buyer Offers
    op.create_table(
        'buyer_offers',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('buyer_id', sa.String(36), sa.ForeignKey('buyers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('commodity', sa.String(100), nullable=False),
        sa.Column('variety', sa.String(100), nullable=True),
        sa.Column('accepted_grades', sa.String(100), nullable=False, server_default='A,B'),
        sa.Column('min_quantity_kg', sa.Numeric(12, 4), nullable=False),
        sa.Column('max_quantity_kg', sa.Numeric(12, 4), nullable=False),
        sa.Column('current_fulfilled_kg', sa.Numeric(12, 4), nullable=False, server_default='0.0000'),
        sa.Column('offered_price_per_kg', sa.Numeric(10, 2), nullable=False),
        sa.Column('price_unit', sa.String(20), nullable=False, server_default='INR/kg'),
        sa.Column('logistics_requirement', sa.String(50), nullable=False, server_default='PICKUP_AT_FARM'),
        sa.Column('payment_terms_days', sa.Integer(), nullable=False, server_default='3'),
        sa.Column('valid_until', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='OPEN'),
        sa.Column('data_mode', sa.String(20), nullable=False, server_default='demo'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_buyer_offers_buyer_id', 'buyer_offers', ['buyer_id'])
    op.create_index('ix_buyer_offers_commodity', 'buyer_offers', ['commodity'])

    # 3. Logistics Providers
    op.create_table(
        'logistics_providers',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('provider_name', sa.String(200), nullable=False),
        sa.Column('contact_phone', sa.String(20), nullable=False),
        sa.Column('vehicle_type', sa.String(100), nullable=False),
        sa.Column('capacity_kg', sa.Numeric(12, 4), nullable=False),
        sa.Column('current_available_capacity_kg', sa.Numeric(12, 4), nullable=False),
        sa.Column('base_district', sa.String(100), nullable=False),
        sa.Column('service_districts', sa.String(300), nullable=False),
        sa.Column('per_km_rate_per_kg', sa.Numeric(8, 4), nullable=False, server_default='0.0450'),
        sa.Column('minimum_fare', sa.Numeric(10, 2), nullable=False, server_default='800.00'),
        sa.Column('pricing_unit', sa.String(50), nullable=False, server_default='INR/kg/km'),
        sa.Column('is_temperature_controlled', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('availability_status', sa.String(50), nullable=False, server_default='AVAILABLE'),
        sa.Column('data_mode', sa.String(20), nullable=False, server_default='demo'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_logistics_providers_name', 'logistics_providers', ['provider_name'])
    op.create_index('ix_logistics_providers_base_district', 'logistics_providers', ['base_district'])

    # 4. Cold Storage Facilities
    op.create_table(
        'cold_storage_facilities',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('facility_name', sa.String(200), nullable=False),
        sa.Column('contact_phone', sa.String(20), nullable=False),
        sa.Column('location_district', sa.String(100), nullable=False),
        sa.Column('location_taluka', sa.String(100), nullable=False),
        sa.Column('compatible_commodities', sa.String(300), nullable=False),
        sa.Column('total_capacity_kg', sa.Numeric(14, 4), nullable=False),
        sa.Column('available_capacity_kg', sa.Numeric(14, 4), nullable=False),
        sa.Column('storage_rate_per_kg_per_month', sa.Numeric(10, 2), nullable=False),
        sa.Column('pricing_unit', sa.String(50), nullable=False, server_default='INR/kg/month'),
        sa.Column('min_holding_days', sa.Integer(), nullable=False, server_default='7'),
        sa.Column('max_holding_days', sa.Integer(), nullable=False, server_default='90'),
        sa.Column('temperature_range_celsius', sa.String(50), nullable=False, server_default='8°C - 12°C'),
        sa.Column('humidity_range_pct', sa.String(50), nullable=False, server_default='85% - 90%'),
        sa.Column('availability_status', sa.String(50), nullable=False, server_default='AVAILABLE'),
        sa.Column('data_mode', sa.String(20), nullable=False, server_default='demo'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_cold_storage_facility_name', 'cold_storage_facilities', ['facility_name'])
    op.create_index('ix_cold_storage_district', 'cold_storage_facilities', ['location_district'])

    # 5. Processing Facilities
    op.create_table(
        'processing_facilities',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('facility_name', sa.String(200), nullable=False),
        sa.Column('contact_phone', sa.String(20), nullable=False),
        sa.Column('facility_type', sa.String(100), nullable=False),
        sa.Column('accepted_commodities', sa.String(300), nullable=False),
        sa.Column('accepted_grades', sa.String(100), nullable=False, server_default='A,B,C'),
        sa.Column('daily_capacity_kg', sa.Numeric(12, 4), nullable=False),
        sa.Column('available_capacity_kg', sa.Numeric(12, 4), nullable=False),
        sa.Column('processing_charge_per_kg', sa.Numeric(10, 2), nullable=False),
        sa.Column('pricing_unit', sa.String(50), nullable=False, server_default='INR/input_kg'),
        sa.Column('output_recovery_ratio', sa.Numeric(6, 4), nullable=False, server_default='0.2800'),
        sa.Column('output_product_name', sa.String(150), nullable=False),
        sa.Column('location_district', sa.String(100), nullable=False),
        sa.Column('location_taluka', sa.String(100), nullable=False),
        sa.Column('availability_status', sa.String(50), nullable=False, server_default='OPERATIONAL'),
        sa.Column('data_mode', sa.String(20), nullable=False, server_default='demo'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_processing_facility_name', 'processing_facilities', ['facility_name'])
    op.create_index('ix_processing_district', 'processing_facilities', ['location_district'])

    # 6. Execution Requests
    op.create_table(
        'execution_requests',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('crop_lot_id', sa.String(36), sa.ForeignKey('crop_lots.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('farmer_user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('decision_run_id', sa.String(36), sa.ForeignKey('decision_runs.id', ondelete='SET NULL'), nullable=True),
        sa.Column('route_type', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='SUBMITTED'),
        sa.Column('buyer_id', sa.String(36), sa.ForeignKey('buyers.id', ondelete='SET NULL'), nullable=True),
        sa.Column('buyer_offer_id', sa.String(36), sa.ForeignKey('buyer_offers.id', ondelete='SET NULL'), nullable=True),
        sa.Column('logistics_provider_id', sa.String(36), sa.ForeignKey('logistics_providers.id', ondelete='SET NULL'), nullable=True),
        sa.Column('cold_storage_facility_id', sa.String(36), sa.ForeignKey('cold_storage_facilities.id', ondelete='SET NULL'), nullable=True),
        sa.Column('processing_facility_id', sa.String(36), sa.ForeignKey('processing_facilities.id', ondelete='SET NULL'), nullable=True),
        sa.Column('requested_quantity_kg', sa.Numeric(14, 4), nullable=False),
        sa.Column('indicative_unit_price', sa.Numeric(10, 2), nullable=False, server_default='0.00'),
        sa.Column('indicative_total_value', sa.Numeric(14, 2), nullable=False, server_default='0.00'),
        sa.Column('indicative_logistics_cost', sa.Numeric(14, 2), nullable=False, server_default='0.00'),
        sa.Column('indicative_storage_cost', sa.Numeric(14, 2), nullable=False, server_default='0.00'),
        sa.Column('indicative_processing_cost', sa.Numeric(14, 2), nullable=False, server_default='0.00'),
        sa.Column('indicative_net_payout', sa.Numeric(14, 2), nullable=False, server_default='0.00'),
        sa.Column('actual_quantity_kg', sa.Numeric(14, 4), nullable=True),
        sa.Column('actual_unit_price', sa.Numeric(10, 2), nullable=True),
        sa.Column('actual_gross_revenue', sa.Numeric(14, 2), nullable=True),
        sa.Column('actual_logistics_cost', sa.Numeric(14, 2), nullable=True),
        sa.Column('actual_storage_cost', sa.Numeric(14, 2), nullable=True),
        sa.Column('actual_processing_cost', sa.Numeric(14, 2), nullable=True),
        sa.Column('actual_net_payout', sa.Numeric(14, 2), nullable=True),
        sa.Column('completion_notes', sa.Text(), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('pickup_location', sa.String(300), nullable=False),
        sa.Column('delivery_location', sa.String(300), nullable=False),
        sa.Column('scheduled_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('data_mode', sa.String(20), nullable=False, server_default='demo'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_execution_requests_farmer_status', 'execution_requests', ['farmer_user_id', 'status'])
    op.create_index('ix_execution_requests_lot', 'execution_requests', ['crop_lot_id'])

    # 7. Execution Request Events
    op.create_table(
        'execution_request_events',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('request_id', sa.String(36), sa.ForeignKey('execution_requests.id', ondelete='CASCADE'), nullable=False),
        sa.Column('from_status', sa.String(50), nullable=True),
        sa.Column('to_status', sa.String(50), nullable=False),
        sa.Column('actor_user_id', sa.String(36), nullable=True),
        sa.Column('actor_role', sa.String(50), nullable=False, server_default='FARMER'),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('metadata_json', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index('ix_execution_request_events_request_id', 'execution_request_events', ['request_id'])


def downgrade() -> None:
    op.drop_table('execution_request_events')
    op.drop_table('execution_requests')
    op.drop_table('processing_facilities')
    op.drop_table('cold_storage_facilities')
    op.drop_table('logistics_providers')
    op.drop_table('buyer_offers')
    op.drop_table('buyers')
