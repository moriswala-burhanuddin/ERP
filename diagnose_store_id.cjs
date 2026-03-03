const { app } = require('electron');
const Database = require('better-sqlite3');
const fs = require('fs');

const dbPath = 'C:\\Users\\ADMIN\\AppData\\Roaming\\invenza-erp\\storeflow.db';

app.whenReady().then(() => {
    console.log(`DIAG_START: ${dbPath}`);
    const db = new Database(dbPath, { readonly: true });
    try {
        const productCounts = db.prepare('SELECT store_id, COUNT(*) as count FROM products GROUP BY store_id').all();
        console.log('PRODUCT_COUNTS_BY_STORE:' + JSON.stringify(productCounts));

        const salesCounts = db.prepare('SELECT store_id, COUNT(*) as count FROM sales GROUP BY store_id').all();
        console.log('SALES_COUNTS_BY_STORE:' + JSON.stringify(salesCounts));

        const activeUser = db.prepare('SELECT id, name, store_id FROM users WHERE id = "user-1"').get();
        console.log('USER_store_id:' + JSON.stringify(activeUser));

    } catch (e) {
        console.error('ERROR:' + e.message);
    } finally {
        db.close();
    }
    process.exit(0);
});
