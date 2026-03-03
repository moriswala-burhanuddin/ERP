const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

app.whenReady().then(() => {
    const dbPath = path.join(app.getPath('userData'), 'storeflow.db');
    console.log('CHECKING_DB:', dbPath);

    const db = new Database(dbPath, { readonly: true });
    const results = {};

    try {
        results.product_counts = db.prepare('SELECT store_id, is_deleted, COUNT(*) as count FROM products GROUP BY store_id, is_deleted').all();
        results.sample_products = db.prepare('SELECT id, name, store_id, is_deleted FROM products LIMIT 10').all();
        results.sales_counts = db.prepare('SELECT store_id, COUNT(*) as count FROM sales GROUP BY store_id').all();
        results.stores = db.prepare('SELECT id, name FROM stores').all();

        // Check for specific products that might be hidden
        const invisibleProducts = db.prepare('SELECT id, name, store_id, is_deleted FROM products WHERE is_deleted = 1 LIMIT 5').all();
        results.invisible_products_sample = invisibleProducts;

    } catch (e) {
        results.error = e.message;
    }

    fs.writeFileSync('db_check_results.json', JSON.stringify(results, null, 2));
    console.log('RESULTS_WRITTEN');
    db.close();
    process.exit(0);
});
