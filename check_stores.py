import sqlite3
import os

# Possible paths for the SQLite DB
possible_paths = [
    os.path.join(os.environ.get('APPDATA', ''), 'invenza-erp', 'storeflow.db'),
    os.path.join(os.environ.get('APPDATA', ''), 'storeflow-erp', 'storeflow.db'),
    './backend/db.sqlite3'
]

db_path = None
for p in possible_paths:
    if os.path.exists(p):
        db_path = p
        break

if not db_path:
    print('Could not find storeflow.db')
    exit(1)

print(f'Using DB: {db_path}')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute('SELECT id, name, branch FROM stores')
    rows = cursor.fetchall()
    print('--- STORES IN LOCAL DB ---')
    for row in rows:
        print(f'ID: {row[0]} | Name: {row[1]} | Branch: {row[2]}')
    print(f'Total Stores: {len(rows)}')
except Exception as e:
    print(f'Error querying stores: {e}')
finally:
    conn.close()
