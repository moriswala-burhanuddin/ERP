const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const fs = require('fs');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'invenza-erp', 'storeflow.db');
const db = new Database(dbPath);

const results = {};

try {
    results.product_counts = db.prepare('SELECT store_id, is_deleted, COUNT(*) as count FROM products GROUP BY store_id, is_deleted').all();
    results.sample_products = db.prepare('SELECT id, name, store_id, is_deleted FROM products LIMIT 5').all();
    results.sales_counts = db.prepare('SELECT store_id, COUNT(*) as count FROM sales GROUP BY store_id').all();
    results.stores = db.prepare('SELECT id, name FROM stores').all();
} catch (e) {
    results.error = e.message;
}

fs.writeFileSync('db_check_results.json', JSON.stringify(results, null, 2));
console.log('Results written to db_check_results.json');
db.close();
