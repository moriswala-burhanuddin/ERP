const { app } = require('electron');
const Database = require('better-sqlite3');
const fs = require('fs');

const dbPath = 'C:\\Users\\ADMIN\\AppData\\Roaming\\invenza-erp\\storeflow.db';

app.whenReady().then(() => {
    console.log(`CHECKING_CONTENT: ${dbPath}`);
    const db = new Database(dbPath, { readonly: true });
    try {
        const prod = db.prepare('SELECT store_id, COUNT(*) as count FROM products GROUP BY store_id').all();
        console.log('PRODUCTS:' + JSON.stringify(prod));

        const sale = db.prepare('SELECT store_id, COUNT(*) as count FROM sales GROUP BY store_id').all();
        console.log('SALES:' + JSON.stringify(sale));

        const user = db.prepare('SELECT id, store_id FROM users').all();
        console.log('USERS:' + JSON.stringify(user));

        const settings = db.prepare('SELECT * FROM settings').all();
        console.log('SETTINGS:' + JSON.stringify(settings));

    } catch (e) {
        console.error('ERROR:' + e.message);
    } finally {
        db.close();
    }
    process.exit(0);
});
