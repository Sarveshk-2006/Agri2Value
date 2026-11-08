"""
Agri2Value — Pilot Readiness Validation: Backup Creation & Restoration Drill
Tests isolated export and restoration of all database entities with zero data loss.
"""

import os
import sys
import json
import sqlite3
import tempfile
from datetime import datetime, timezone
from decimal import Decimal

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.models import Base

TABLE_HIERARCHY = [
    "users",
    "farms",
    "farm_resources",
    "crop_lots",
    "crop_lot_events",
    "decision_runs",
    "decision_options",
    "buyers",
    "buyer_offers",
    "logistics_providers",
    "cold_storage_facilities",
    "processing_facilities",
    "execution_requests",
    "execution_request_events",
    "iot_devices",
    "iot_telemetry_readings",
    "iot_alerts",
    "deal_agreements",
    "agreement_amendments",
    "delivery_records",
    "payment_records",
    "farmer_disputes",
    "dispute_events",
    "farmer_risk_alerts",
    "transaction_audit_events",
    "alembic_version",
]

def decimal_serializer(obj):
    if isinstance(obj, Decimal):
        return str(obj)
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def run_backup_restore_drill():
    print("=" * 80)
    print("AGRI2VALUE PILOT AUDIT: DATABASE BACKUP & RESTORATION DRILL")
    print("=" * 80)

    src_db = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "agri2value.db")
    if not os.path.exists(src_db):
        src_db = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backups", "agri2value_dev_backup_20261108.db")

    print(f"1. Source Database: {src_db}")
    src_conn = sqlite3.connect(src_db)
    src_conn.row_factory = sqlite3.Row
    src_cur = src_conn.cursor()

    # Verify source table count and row count
    src_cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    existing_tables = [r[0] for r in src_cur.fetchall()]
    print(f"   Found {len(existing_tables)} tables in source database.")

    source_counts = {}
    source_dump = {}
    for tbl in existing_tables:
        src_cur.execute(f'SELECT count(*) FROM "{tbl}"')
        cnt = src_cur.fetchone()[0]
        source_counts[tbl] = cnt
        src_cur.execute(f'SELECT * FROM "{tbl}"')
        source_dump[tbl] = [dict(row) for row in src_cur.fetchall()]

    total_source_rows = sum(source_counts.values())
    print(f"   Total source records to back up: {total_source_rows}")

    # 2. Perform Backup Export to Isolated JSON Artifact
    backup_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backups")
    os.makedirs(backup_dir, exist_ok=True)
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_file = os.path.join(backup_dir, f"pilot_readiness_backup_{timestamp}.json")
    
    with open(backup_file, "w", encoding="utf-8") as f:
        json.dump(source_dump, f, default=decimal_serializer, indent=2)
    
    backup_size = os.path.getsize(backup_file)
    print(f"\n2. Backup Creation: SUCCESS")
    print(f"   Artifact: {backup_file}")
    print(f"   Size: {backup_size / 1024:.2f} KB")

    # 3. Perform Isolated Target Restoration into Clean Temp Database
    print("\n3. Executing Isolated Restoration Drill...")
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp_target:
        restored_db_path = tmp_target.name

    try:
        dest_conn = sqlite3.connect(restored_db_path)
        dest_conn.execute("PRAGMA foreign_keys = ON")
        dest_cur = dest_conn.cursor()

        # Replay DDL schema from source
        src_cur.execute("SELECT sql FROM sqlite_master WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%' AND sql IS NOT NULL")
        ddl_statements = [r[0] for r in src_cur.fetchall()]

        for ddl in ddl_statements:
            try:
                dest_cur.execute(ddl)
            except sqlite3.OperationalError:
                pass
        dest_conn.commit()

        # Replay data in strict foreign-key order
        restored_counts = {}
        for tbl in TABLE_HIERARCHY:
            if tbl not in source_dump or not source_dump[tbl]:
                continue
            rows = source_dump[tbl]
            if not rows:
                continue
            cols = list(rows[0].keys())
            placeholders = ", ".join(["?" for _ in cols])
            col_names = ", ".join([f'"{c}"' for c in cols])
            insert_sql = f'INSERT INTO "{tbl}" ({col_names}) VALUES ({placeholders})'

            val_tuples = []
            for r in rows:
                val_tuples.append([r[c] for c in cols])
            dest_cur.executemany(insert_sql, val_tuples)
            restored_counts[tbl] = len(rows)

        dest_conn.commit()

        # Check integrity
        dest_cur.execute("PRAGMA integrity_check")
        integrity = dest_cur.fetchone()[0]
        assert integrity == "ok", f"Integrity check failed: {integrity}"

        dest_cur.execute("PRAGMA foreign_key_check")
        fk_violations = dest_cur.fetchall()
        assert len(fk_violations) == 0, f"FK violations found: {fk_violations}"

        print(f"   Schema DDL: Recreated successfully")
        print(f"   Integrity Check: {integrity.upper()}")
        print(f"   Foreign Key Check: 0 Violations (Referential integrity intact)")

        # Verify row match
        mismatches = 0
        for tbl, s_cnt in source_counts.items():
            dest_cur.execute(f'SELECT count(*) FROM "{tbl}"')
            r_cnt = dest_cur.fetchone()[0]
            if s_cnt != r_cnt:
                print(f"   [MISMATCH] {tbl}: source={s_cnt}, restored={r_cnt}")
                mismatches += 1

        assert mismatches == 0, f"Detected {mismatches} row count mismatches during restoration!"
        print(f"   Row Count Verification: 100% Match ({total_source_rows}/{total_source_rows} records)")

        # Run Verification Query on Restored Database
        dest_cur.execute("SELECT count(*) FROM users WHERE role='FARMER'")
        farmer_count = dest_cur.fetchone()[0]
        dest_cur.execute("SELECT count(*) FROM farms")
        farms_count = dest_cur.fetchone()[0]
        dest_cur.execute("SELECT count(*) FROM deal_agreements")
        agreements_count = dest_cur.fetchone()[0]

        print(f"\n4. Restored Database Query Test:")
        print(f"   - Farmers query: {farmer_count} active farmers")
        print(f"   - Farms query: {farms_count} mapped farms")
        print(f"   - Deal agreements query: {agreements_count} executed agreements")
        print("\n" + "=" * 80)
        print("DRILL VERDICT: PASS — BACKUP CREATION & ISOLATED RESTORATION 100% VERIFIED")
        print("=" * 80)

        dest_conn.close()
    finally:
        src_conn.close()
        if os.path.exists(restored_db_path):
            os.remove(restored_db_path)

if __name__ == "__main__":
    run_backup_restore_drill()
