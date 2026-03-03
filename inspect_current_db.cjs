const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

// Since we are running outside Electron potentially, or inside, let's try to find the path correctly.
// We'll use the path from the diagnostic log.
const dbPath = 'C:\\Users\\ADMIN\\AppData\\Roaming\\Electron\\storeflow.db';

const db = new Database(dbPath, { readonly: true });

try {
    console.log('--- STORES ---');
    const stores = db.prepare('SELECT id, name, branch FROM stores').all();
    console.table(stores);

    console.log('--- SALES (Sample) ---');
    const sales = db.prepare('SELECT id, invoice_number, store_id FROM sales LIMIT 5').all();
    console.table(sales);

    console.log('--- SETTINGS ---');
    const settings = db.prepare('SELECT * FROM settings').all();
    console.table(settings);

    console.log('--- RECORD COUNTS ---');
    const tables = ['products', 'customers', 'sales', 'purchases', 'transactions'];
    tables.forEach(table => {
        try {
            const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
            const unsynced = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE sync_status = 0`).get().count;
            console.log(`${table}: ${count} total, ${unsynced} unsynced`);
        } catch (e) { }
    });

} catch (err) {
    console.error('Error:', err.message);
} finally {
    db.close();
}
