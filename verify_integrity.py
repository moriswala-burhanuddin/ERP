import sqlite3
import os
import sys

# Add backend to path for Django
sys.path.append(os.path.join(os.getcwd(), 'backend'))

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storeflow_backend.settings')
django.setup()

from api.models import Store, Account, Product, Customer

def verify():
    db_path = './electron/storeflow.db'
    if not os.path.exists(db_path):
        print(f"DB not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    print("\n=== REFERENCE INTEGRITY CHECK ===")

    # Check Sales
    sales = conn.execute('SELECT id, store_id, account_id, customer_id FROM sales WHERE sync_status = 0').fetchall()
    print(f"Found {len(sales)} pending sales")
    for s in sales:
        # Account
        acc_exists = Account.objects.filter(id=s['account_id']).exists()
        print(f"Sale {s['id']} -> Account {s['account_id']} | Server Exists: {acc_exists}")
        
        # Store
        store_exists = Store.objects.filter(id=s['store_id']).exists()
        print(f"Sale {s['id']} -> Store {s['store_id']} | Server Exists: {store_exists}")

        # Customer
        if s['customer_id']:
            cust_exists = Customer.objects.filter(id=s['customer_id']).exists()
            print(f"Sale {s['id']} -> Customer {s['customer_id']} | Server Exists: {cust_exists}")

    # Check Logs
    logs = conn.execute('SELECT id, store_id, product_id FROM stock_logs WHERE sync_status = 0').fetchall()
    print(f"\nFound {len(logs)} pending stock logs")
    for l in logs:
        prod_exists = Product.objects.filter(id=l['product_id']).exists()
        print(f"Log {l['id']} -> Product {l['product_id']} | Server Exists: {prod_exists}")
        
        store_exists = Store.objects.filter(id=l['store_id']).exists()
        print(f"Log {l['id']} -> Store {l['store_id']} | Server Exists: {store_exists}")

if __name__ == "__main__":
    verify()
