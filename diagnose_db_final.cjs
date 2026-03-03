const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// We know the path now
const userData = app.getPath('userData');
const dbPath = path.join(userData, 'storeflow.db');

app.whenReady().then(() => {
    console.log(`REAL DB PATH: ${dbPath}`);
    if (!fs.existsSync(dbPath)) {
        console.log('DB file NOT FOUND at expected path.');
        process.exit(1);
    }

    const db = new Database(dbPath, { readonly: true });
    try {
        console.log('--- STORES TABLE ---');
        const stores = db.prepare('SELECT * FROM stores').all();
        console.log(JSON.stringify(stores, null, 2));

        console.log('--- RECORD COUNTS ---');
        const tables = ['products', 'sales', 'customers', 'users'];
        tables.forEach(table => {
            try {
                const total = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
                const perStore = db.prepare(`SELECT store_id, COUNT(*) as count FROM ${table} GROUP BY store_id`).all();
                console.log(`${table}: ${total} total`);
                console.log(`  Split:`, JSON.stringify(perStore));
            } catch (e) {
                console.log(`Error on ${table}: ${e.message}`);
            }
        });

        console.log('--- SETTINGS (for last_pull_timestamp) ---');
        try {
            const settings = db.prepare('SELECT * FROM settings').all();
            console.log(JSON.stringify(settings, null, 2));
        } catch (e) { }

    } catch (err) {
        console.error('Diagnostic error:', err.message);
    } finally {
        db.close();
    }
    process.exit(0);
});
