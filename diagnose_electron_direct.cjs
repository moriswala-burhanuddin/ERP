const { app } = require('electron');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Manually target the file we found earlier
const dbPath = 'C:\\Users\\ADMIN\\AppData\\Roaming\\invenza-erp\\storeflow.db';

app.whenReady().then(() => {
    console.log(`INSPECTING: ${dbPath}`);
    if (!fs.existsSync(dbPath)) {
        console.log('FILE NOT FOUND');
        process.exit(1);
    }

    const db = new Database(dbPath, { readonly: true });
    try {
        const stores = db.prepare('SELECT id, name FROM stores').all();
        console.log('STORES_DATA:' + JSON.stringify(stores));

        const productsCount = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
        console.log('PRODUCTS_COUNT:' + productsCount);

        const salesCount = db.prepare('SELECT COUNT(*) as count FROM sales').get().count;
        console.log('SALES_COUNT:' + salesCount);

        const users = db.prepare('SELECT id, name, store_id FROM users').all();
        console.log('USERS_DATA:' + JSON.stringify(users));

    } catch (e) {
        console.error('ERROR:' + e.message);
    } finally {
        db.close();
    }
    process.exit(0);
});
