const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const userData = app.getPath('userData');
const dbPath = path.join(userData, 'storeflow.db');

app.whenReady().then(() => {
    console.log(`Checking DB at: ${dbPath}`);
    if (!fs.existsSync(dbPath)) {
        console.log('DB file does not exist at this path.');
        process.exit(1);
    }

    const db = new Database(dbPath, { readonly: true });
    try {
        console.log('--- STORES ---');
        const stores = db.prepare('SELECT * FROM stores').all();
        console.log(JSON.stringify(stores, null, 2));

        console.log('--- RECORD COUNTS PER STORE ---');
        const tables = ['products', 'sales', 'customers'];
        tables.forEach(table => {
            try {
                const counts = db.prepare(`SELECT store_id, COUNT(*) as count FROM ${table} GROUP BY store_id`).all();
                console.log(`Table ${table}:`, JSON.stringify(counts, null, 2));
            } catch (e) {
                console.log(`Error counting ${table}: ${e.message}`);
            }
        });

        console.log('--- DIRTY RECORDS (sync_status = 0) ---');
        tables.forEach(table => {
            try {
                const dirty = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE sync_status = 0`).get().count;
                console.log(`${table} unsynced: ${dirty}`);
            } catch (e) { }
        });

    } catch (err) {
        console.error('Diagnostic error:', err.message);
    } finally {
        db.close();
    }
    process.exit(0);
});
