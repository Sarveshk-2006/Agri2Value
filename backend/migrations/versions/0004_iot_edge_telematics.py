"""0004_iot_edge_telematics

Revision ID: 0004_iot_edge_telematics
Revises: 0003_smart_execution_network
Create Date: 2026-11-02 00:20:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0004_iot_edge_telematics'
down_revision: Union[str, None] = '0003_smart_execution_network'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. IoT Devices
    op.create_table(
        'iot_devices',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('device_code', sa.String(64), nullable=False, unique=True),
        sa.Column('device_name', sa.String(100), nullable=False),
        sa.Column('farm_id', sa.String(36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('farmer_user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('device_type', sa.String(50), nullable=False, server_default='ESP32_AGRI_NODE'),
        sa.Column('firmware_version', sa.String(30), nullable=False, server_default='v1.0.0-sim'),
        sa.Column('sensor_capabilities', sa.String(255), nullable=False, server_default='SOIL_MOISTURE,AIR_TEMP,HUMIDITY,RAINFALL'),
        sa.Column('status', sa.String(30), nullable=False, server_default='ACTIVE'),
        sa.Column('data_source', sa.String(30), nullable=False, server_default='SIMULATED'),
        sa.Column('api_key_hash', sa.String(128), nullable=False),
        sa.Column('api_key_prefix', sa.String(20), nullable=False),
        sa.Column('last_seen_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('last_reading_summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index('ix_iot_devices_device_code', 'iot_devices', ['device_code'])
    op.create_index('ix_iot_devices_farm_id', 'iot_devices', ['farm_id'])
    op.create_index('ix_iot_devices_farmer_user_id', 'iot_devices', ['farmer_user_id'])
    op.create_index('ix_iot_devices_farm_status', 'iot_devices', ['farm_id', 'status'])

    # 2. IoT Telemetry Readings
    op.create_table(
        'iot_telemetry_readings',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('device_id', sa.String(36), sa.ForeignKey('iot_devices.id', ondelete='CASCADE'), nullable=False),
        sa.Column('farm_id', sa.String(36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('reading_id', sa.String(64), nullable=False),
        sa.Column('sensor_type', sa.String(50), nullable=False),
        sa.Column('value', sa.Numeric(10, 2), nullable=False),
        sa.Column('unit', sa.String(20), nullable=False),
        sa.Column('device_timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('server_ingested_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('source_type', sa.String(30), nullable=False, server_default='SIMULATED'),
        sa.Column('quality_flag', sa.String(30), nullable=False, server_default='VALID'),
        sa.Column('raw_metadata', sa.Text(), nullable=True),
        sa.UniqueConstraint('device_id', 'reading_id', name='uq_device_reading_id'),
    )
    op.create_index('ix_iot_readings_device_id', 'iot_telemetry_readings', ['device_id'])
    op.create_index('ix_iot_readings_farm_id', 'iot_telemetry_readings', ['farm_id'])
    op.create_index('ix_iot_readings_reading_id', 'iot_telemetry_readings', ['reading_id'])
    op.create_index('ix_iot_readings_sensor_type', 'iot_telemetry_readings', ['sensor_type'])
    op.create_index('ix_iot_readings_device_time', 'iot_telemetry_readings', ['device_id', 'device_timestamp'])
    op.create_index('ix_iot_readings_farm_type_time', 'iot_telemetry_readings', ['farm_id', 'sensor_type', 'device_timestamp'])

    # 3. IoT Alerts
    op.create_table(
        'iot_alerts',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('device_id', sa.String(36), sa.ForeignKey('iot_devices.id', ondelete='CASCADE'), nullable=False),
        sa.Column('farm_id', sa.String(36), sa.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False),
        sa.Column('alert_type', sa.String(50), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False, server_default='WARNING'),
        sa.Column('trigger_reading_id', sa.String(64), nullable=True),
        sa.Column('sensor_type', sa.String(50), nullable=True),
        sa.Column('trigger_value', sa.Numeric(10, 2), nullable=True),
        sa.Column('trigger_unit', sa.String(20), nullable=True),
        sa.Column('reading_timestamp', sa.DateTime(timezone=True), nullable=True),
        sa.Column('threshold_used', sa.String(100), nullable=False),
        sa.Column('source_type', sa.String(30), nullable=False, server_default='SIMULATED'),
        sa.Column('explanation', sa.Text(), nullable=False),
        sa.Column('is_resolved', sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_iot_alerts_device_id', 'iot_alerts', ['device_id'])
    op.create_index('ix_iot_alerts_farm_id', 'iot_alerts', ['farm_id'])
    op.create_index('ix_iot_alerts_device_resolved', 'iot_alerts', ['device_id', 'is_resolved'])
    op.create_index('ix_iot_alerts_farm_created', 'iot_alerts', ['farm_id', 'created_at'])


def downgrade() -> None:
    op.drop_table('iot_alerts')
    op.drop_table('iot_telemetry_readings')
    op.drop_table('iot_devices')
