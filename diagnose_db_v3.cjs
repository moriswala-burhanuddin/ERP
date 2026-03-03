const sqlite3 = require('better-sqlite3');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'invenza-erp', 'storeflow.db');
console.log('Checking DB at:', dbPath);

try {
    const db = new sqlite3(dbPath);

    console.log('\n--- Products Check ---');
    const products = db.prepare('SELECT id, name, sku, store_id, sync_status, is_deleted FROM products').all();
    console.log(`Total Products: ${products.length}`);
    const activeProducts = products.filter(p => p.is_deleted === 0);
    console.log(`Active Products (is_deleted=0): ${activeProducts.length}`);

    const productsByStore = db.prepare('SELECT store_id, COUNT(*) as count FROM products GROUP BY store_id').all();
    console.log('Products by store:', productsByStore);

    const activeProductsByStore = db.prepare('SELECT store_id, COUNT(*) as count FROM products WHERE is_deleted = 0 GROUP BY store_id').all();
    console.log('Active Products by store:', activeProductsByStore);

    console.log('\n--- Sales Check ---');
    const sales = db.prepare('SELECT id, store_id, sync_status FROM sales').all();
    console.log(`Total Sales: ${sales.length}`);
    console.log(`Sales synced (sync_status=1): ${sales.filter(s => s.sync_status === 1).length}`);
    console.log(`Sales pending (sync_status=0): ${sales.filter(s => s.sync_status === 0).length}`);

    console.log('\n--- Schema Check (store_id presence) ---');
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    const tablesWithoutStoreId = [];
    for (const table of tables) {
        const columns = db.prepare(`PRAGMA table_info(${table})`).all();
        const hasStoreId = columns.some(c => c.name === 'store_id');
        if (!hasStoreId) {
            tablesWithoutStoreId.push(table);
        }
    }
    console.log('Tables without store_id:', tablesWithoutStoreId);

    db.close();
} catch (err) {
    console.error('Error:', err.message);
}
