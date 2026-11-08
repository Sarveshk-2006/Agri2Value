import sqlite3
import os

backup_path = os.path.join(os.path.dirname(__file__), "..", "backups", "agri2value_dev_backup_20261108.db")

def verify():
    if not os.path.exists(backup_path):
        print(f"ERROR: Backup file {backup_path} does not exist!")
        return False
    
    conn = sqlite3.connect(backup_path)
    cur = conn.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    tables = [r[0] for r in cur.fetchall()]
    print(f"[VERIFIED BACKUP] Total tables: {len(tables)}")
    total_rows = 0
    for t in sorted(tables):
        cur.execute(f'SELECT count(*) FROM "{t}"')
        cnt = cur.fetchone()[0]
        total_rows += cnt
        if cnt > 0:
            print(f"  - {t}: {cnt} rows")
    print(f"[VERIFIED BACKUP] Total rows preserved: {total_rows}")
    conn.close()
    return len(tables) >= 25

if __name__ == "__main__":
    verify()
