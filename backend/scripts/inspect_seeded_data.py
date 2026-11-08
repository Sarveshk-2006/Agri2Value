import sqlite3
import uuid

def format_uuid(val):
    if not val:
        return val
    try:
        return str(uuid.UUID(val))
    except Exception:
        return str(val)

conn = sqlite3.connect('backend/agri2value_dev.db')
cursor = conn.cursor()

tables = [t[0] for t in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]

for table in tables:
    cols = [c[1] for c in cursor.execute(f"PRAGMA table_info({table})").fetchall()]
    rows = cursor.execute(f"SELECT * FROM {table}").fetchall()
    print(f"\n==================== {table} ({len(rows)} rows) ====================")
    print("Columns:", ", ".join(cols[:8]))
    for r in rows[:3]:
        # print first few cols
        formatted = [format_uuid(c) if isinstance(c, str) and len(c) == 32 else str(c) for c in r[:6]]
        print("  ", formatted)

conn.close()
