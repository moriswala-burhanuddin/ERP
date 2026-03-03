const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

app.name = 'invenza-erp';

app.whenReady().then(() => {
    const dbPath = path.join(app.getPath('userData'), 'storeflow.db');
    const dumpFile = 'd:\\NEW-ERP\\storeflow-erp\\db_dump.json';

    try {
        const db = new Database(dbPath, { readonly: true });

        const stats = {
            products: db.prepare('SELECT store_id, is_deleted, COUNT(*) as count FROM products GROUP BY store_id, is_deleted').all(),
            sales: db.prepare('SELECT store_id, COUNT(*) as count FROM sales GROUP BY store_id').all(),
            stores: db.prepare('SELECT * FROM stores').all(),
            settings: db.prepare('SELECT * FROM settings').all(),
            sample_product: db.prepare('SELECT * FROM products LIMIT 1').get()
        };

        fs.writeFileSync(dumpFile, JSON.stringify(stats, null, 2));
        console.log('DUMP_SUCCESS');
        db.close();
    } catch (err) {
        console.error('DUMP_ERROR:', err.message);
    }
    process.exit(0);
});
