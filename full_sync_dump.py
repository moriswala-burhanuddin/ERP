import sqlite3
import os
import sys

# Setup Django
sys.path.append(os.path.join(os.getcwd(), 'backend'))
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storeflow_backend.settings')
django.setup()

from api.models import Store, Account, Product, Customer

def dump_all():
    # Local
    db_path = './electron/storeflow.db'
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    with open('full_sync_debug.txt', 'w', encoding='utf-8') as f:
        f.write("=== LOCAL IDs ===\n")
        f.write(f"Stores: {[r['id'] for r in conn.execute('SELECT id FROM stores').fetchall()]}\n")
        f.write(f"Accounts: {[r['id'] for r in conn.execute('SELECT id FROM accounts').fetchall()]}\n")
        f.write(f"Customers: {[r['id'] for r in conn.execute('SELECT id FROM customers').fetchall()]}\n")
        f.write(f"Products: {[r['id'] for r in conn.execute('SELECT id FROM products').fetchall()]}\n")

        sales = conn.execute('SELECT id, store_id, account_id, customer_id FROM sales WHERE sync_status = 0').fetchall()
        f.write("\n=== PENDING LOCAL SALES ===\n")
        for s in sales:
            f.write(f"Sale {s['id']} -> Store:{s['store_id']}, Acc:{s['account_id']}, Cust:{s['customer_id']}\n")

        logs = conn.execute('SELECT id, store_id, product_id FROM stock_logs WHERE sync_status = 0').fetchall()
        f.write("\n=== PENDING LOCAL LOGS ===\n")
        for l in logs:
            f.write(f"Log {l['id']} -> Store:{l['store_id']}, Prod:{l['product_id']}\n")

        f.write("\n=== SERVER IDs ===\n")
        f.write(f"Stores: {[s.id for s in Store.objects.all()]}\n")
        f.write(f"Accounts: {[a.id for a in Account.objects.all()]}\n")
        f.write(f"Customers: {[c.id for c in Customer.objects.all()]}\n")
        f.write(f"Products: {[p.id for p in Product.objects.all()]}\n")

if __name__ == "__main__":
    dump_all()
    print("Dump complete -> full_sync_debug.txt")
