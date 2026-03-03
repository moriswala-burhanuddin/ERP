const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

app.name = 'invenza-erp';

app.whenReady().then(() => {
    const dbPath = path.join(app.getPath('userData'), 'storeflow.db');
    console.log('RESTORING_PATH:', dbPath);

    try {
        const db = new Database(dbPath);

        // Restore products
        const result = db.prepare('UPDATE products SET is_deleted = 0 WHERE store_id = "store-1" AND is_deleted = 1').run();
        console.log(`RESTORED_PRODUCTS: ${result.changes} records updated.`);

        // Check sales status
        const sales = db.prepare('SELECT COUNT(*) as count FROM sales WHERE store_id = "store-1"').get();
        console.log(`SALES_RECORDS: ${sales.count}`);

        db.close();
    } catch (err) {
        console.error('RESTORE_ERROR:', err.message);
    }
    process.exit(0);
});
