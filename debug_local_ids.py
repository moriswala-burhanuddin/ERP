import sqlite3
import os

def check_local():
    db_path = './electron/storeflow.db'
    if not os.path.exists(db_path):
        print(f"DB not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    print("\n--- PENDING SALES ---")
    sales = conn.execute('SELECT id, store_id, account_id, customer_id FROM sales WHERE sync_status = 0').fetchall()
    for s in sales:
        print(f"Sale ID: {s['id']}")
        print(f"  Store: {s['store_id']}")
        print(f"  Account: {s['account_id']}")
        print(f"  Customer: {s['customer_id']}")

    print("\n--- PENDING STOCK LOGS ---")
    logs = conn.execute('SELECT id, store_id, product_id FROM stock_logs WHERE sync_status = 0').fetchall()
    for l in logs:
        print(f"Log ID: {l['id']}")
        print(f"  Store: {l['store_id']}")
        print(f"  Product: {l['product_id']}")

    print("\n--- LOCAL STORES ---")
    stores = conn.execute('SELECT id, name FROM stores').fetchall()
    for s in stores:
        print(f"Store: {s['id']} ({s['name']})")

    print("\n--- LOCAL ACCOUNTS ---")
    accounts = conn.execute('SELECT id, name FROM accounts').fetchall()
    for a in accounts:
        print(f"Account: {a['id']} ({a['name']})")

    print("\n--- LOCAL PRODUCTS ---")
    products = conn.execute('SELECT id, name FROM products').fetchall()
    for p in products:
        print(f"Product: {p['id']} ({p['name']})")

if __name__ == "__main__":
    check_local()
