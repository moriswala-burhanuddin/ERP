const { app } = require('electron');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = 'C:\\Users\\ADMIN\\AppData\\Roaming\\invenza-erp\\storeflow.db';

app.whenReady().then(() => {
    console.log(`DIAGNOSING: ${dbPath}`);
    const db = new Database(dbPath, { readonly: true });
    try {
        const productsStoreIds = db.prepare('SELECT DISTINCT store_id FROM products').all();
        console.log('PRODUCTS_STORE_IDS:' + JSON.stringify(productsStoreIds));

        const salesStoreIds = db.prepare('SELECT DISTINCT store_id FROM sales').all();
        console.log('SALES_STORE_IDS:' + JSON.stringify(salesStoreIds));

        const stores = db.prepare('SELECT id, name FROM stores').all();
        console.log('STORES_TABLE:' + JSON.stringify(stores));

        const users = db.prepare('SELECT id, name, store_id FROM users').all();
        console.log('USERS_TABLE:' + JSON.stringify(users));

        const sampleSale = db.prepare('SELECT * FROM sales LIMIT 1').get();
        console.log('SAMPLE_SALE:' + JSON.stringify(sampleSale));

    } catch (e) {
        console.error('DIAG_ERROR:' + e.message);
    } finally {
        db.close();
    }
    process.exit(0);
});
