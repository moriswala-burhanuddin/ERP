const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

app.whenReady().then(() => {
    const dbPath = path.join(__dirname, 'electron', 'storeflow.db');
    console.log('CHECKING_LOCAL_DB:', dbPath);

    try {
        if (!fs.existsSync(dbPath)) {
            console.log('LOCAL_DB_NOT_FOUND');
        } else {
            const db = new Database(dbPath, { readonly: true });
            const products = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
            const sales = db.prepare('SELECT COUNT(*) as count FROM sales').get().count;
            const stores = db.prepare('SELECT id, name FROM stores').all();
            console.log('LOCAL_DB_STATS:', JSON.stringify({ products, sales, stores }));
            db.close();
        }
    } catch (err) {
        console.error('LOCAL_DB_ERROR:', err.message);
    }
    process.exit(0);
});
