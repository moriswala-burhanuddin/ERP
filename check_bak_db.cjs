const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

app.whenReady().then(() => {
    const dbPath = path.join(__dirname, 'electron', 'storeflow.db.bak');
    console.log('CHECKING_BAK_DB:', dbPath);

    try {
        if (!fs.existsSync(dbPath)) {
            console.log('BAK_DB_NOT_FOUND');
        } else {
            const db = new Database(dbPath, { readonly: true });
            const products = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
            const sales = db.prepare('SELECT COUNT(*) as count FROM sales').get().count;
            console.log('BAK_DB_STATS:', JSON.stringify({ products, sales }));
            db.close();
        }
    } catch (err) {
        console.error('BAK_DB_ERROR:', err.message);
    }
    process.exit(0);
});
