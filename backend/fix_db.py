# -*- coding: utf-8 -*-
import sqlite3
import os

# Auto-detect database path
possible_paths = [
    'instance/app.db',
    '../instance/app.db',
    'app.db',
    'database.db'
]

db_path = None
for path in possible_paths:
    if os.path.exists(path):
        db_path = path
        break

if not db_path:
    print("ERROR: Database file not found!")
    print("Searched paths:")
    for p in possible_paths:
        print(f" - {os.path.abspath(p)}")
    db_path = 'instance/app.db'
    print(f"Will try default path: {db_path}")

print(f"Operating on database: {os.path.abspath(db_path)}")

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Add about_me column
    try:
        cursor.execute("ALTER TABLE shop ADD COLUMN about_me TEXT")
        print("SUCCESS: Column 'about_me' added.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("INFO: Column 'about_me' already exists. Skipping.")
        else:
            raise e

    # 2. Add additional_price column
    try:
        cursor.execute("ALTER TABLE shop ADD COLUMN additional_price VARCHAR(200)")
        print("SUCCESS: Column 'additional_price' added.")
    except sqlite3.OperationalError as e:
        if "duplicate column name" in str(e):
            print("INFO: Column 'additional_price' already exists. Skipping.")
        else:
            raise e

    conn.commit()
    print("\nDONE: Database fixed successfully!")
    print("NEXT STEP: Restart your backend (python run.py) and refresh the browser.")

except Exception as e:
    print(f"\nERROR: {e}")
    print("TIP: Make sure the backend server is stopped before running this script.")
finally:
    if conn:
        conn.close()