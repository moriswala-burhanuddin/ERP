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

        // Restore products using single quotes for string literals
        const result = db.prepare("UPDATE products SET is_deleted = 0 WHERE store_id = 'store-1' AND is_deleted = 1").run();
        console.log(`RESTORED_PRODUCTS: ${result.changes} records updated.`);

        // Final check
        const stats = db.prepare("SELECT is_deleted, COUNT(*) as count FROM products WHERE store_id = 'store-1' GROUP BY is_deleted").all();
        console.log('FINAL_STATS:', JSON.stringify(stats));

        db.close();
    } catch (err) {
        console.error('RESTORE_ERROR:', err.message);
    }
    process.exit(0);
});
