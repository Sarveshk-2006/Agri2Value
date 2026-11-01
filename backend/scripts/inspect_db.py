# backend/scripts/inspect_db.py
import sqlite3

def inspect():
    conn = sqlite3.connect("agri2value_dev.db")
    cur = conn.cursor()
    cur.execute("SELECT type, name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type, name")
    print("--- Database Schema Objects in agri2value_dev.db ---")
    for obj_type, name in cur.fetchall():
        print(f"[{obj_type.upper()}] {name}")
    
    print("\n--- Row Counts ---")
    for table in ["users", "farms", "farm_resources", "crop_lots", "crop_lot_events", "alembic_version"]:
        try:
            cur.execute(f"SELECT count(*) FROM {table}")
            cnt = cur.fetchone()[0]
            print(f"{table}: {cnt} rows")
        except Exception as e:
            print(f"{table}: error ({e})")
    conn.close()

if __name__ == "__main__":
    inspect()
