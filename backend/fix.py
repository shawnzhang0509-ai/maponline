import sqlite3
import os

db = 'instance/app.db'
if not os.path.exists(db):
    print("Error: DB not found")
    exit()

conn = sqlite3.connect(db)
c = conn.cursor()

# Check table
c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='shop'")
if not c.fetchone():
    print("Error: No 'shop' table")
    c.execute("SELECT name FROM sqlite_master WHERE type='table'")
    print("Found tables:", [r[0] for r in c.fetchall()])
    exit()

# Get cols
c.execute('PRAGMA table_info(shop)')
cols = [d[1] for d in c.fetchall()]
print("Current columns:", cols)

# Add fields
if 'about_me' not in cols:
    c.execute('ALTER TABLE shop ADD COLUMN about_me TEXT')
    print("Added: about_me")

if 'additional_price' not in cols:
    c.execute('ALTER TABLE shop ADD COLUMN additional_price VARCHAR(200)')
    print("Added: additional_price")

conn.commit()
print("Success! All done.")
conn.close()