const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const logFile = 'd:\\NEW-ERP\\storeflow-erp\\diag_log.txt';
const resultFile = 'd:\\NEW-ERP\\storeflow-erp\\db_results.json';

function log(msg) {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
}

app.whenReady().then(() => {
    try {
        fs.writeFileSync(logFile, 'Starting Diagnosis...\n');
        const dbPath = path.join(app.getPath('userData'), 'storeflow.db');
        log(`DB Path: ${dbPath}`);

        const db = new Database(dbPath, { readonly: true });
        const results = {};

        results.product_counts = db.prepare('SELECT store_id, is_deleted, COUNT(*) as count FROM products GROUP BY store_id, is_deleted').all();
        log('Product counts fetched');

        results.sample_products = db.prepare('SELECT id, name, store_id, is_deleted FROM products LIMIT 10').all();
        results.sales_counts = db.prepare('SELECT store_id, COUNT(*) as count FROM sales GROUP BY store_id').all();
        results.stores = db.prepare('SELECT id, name FROM stores').all();

        fs.writeFileSync(resultFile, JSON.stringify(results, null, 2));
        log('Results written');

        db.close();
    } catch (e) {
        log(`ERROR: ${e.message}\n${e.stack}`);
    } finally {
        process.exit(0);
    }
});
