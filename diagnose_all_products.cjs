const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

app.whenReady().then(() => {
    const dbPath = 'C:\\Users\\ADMIN\\AppData\\Roaming\\invenza-erp\\storeflow.db';
    console.log('--- START DIAGNOSTIC ---');
    console.log(`Path: ${dbPath}`);

    try {
        const db = new Database(dbPath, { readonly: true });

        const products = db.prepare('SELECT id, name, sku, store_id, is_deleted, sync_status FROM products').all();
        console.log(`TOTAL_PRODUCTS_IN_DB: ${products.length}`);

        const countsByStore = {};
        products.forEach(p => {
            const key = `${p.store_id} | deleted=${p.is_deleted}`;
            countsByStore[key] = (countsByStore[key] || 0) + 1;
        });
        console.log('STATS:', JSON.stringify(countsByStore, null, 2));

        const sales = db.prepare('SELECT COUNT(*) as count FROM sales').get().count;
        console.log(`TOTAL_SALES_IN_DB: ${sales}`);

        db.close();
    } catch (err) {
        console.error('ERROR:', err.message);
    }
    console.log('--- END DIAGNOSTIC ---');
    process.exit(0);
});
