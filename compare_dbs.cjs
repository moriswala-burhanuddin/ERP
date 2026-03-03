const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const fs = require('fs');

app.whenReady().then(() => {
    const roaming = path.join(os.homedir(), 'AppData', 'Roaming');
    const folders = ['vite_react_shadcn_ts', 'invenza-erp'];
    const results = {};

    folders.forEach(folder => {
        const dbPath = path.join(roaming, folder, 'storeflow.db');
        if (fs.existsSync(dbPath)) {
            try {
                const db = new Database(dbPath, { readonly: true });
                const products = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
                const sales = db.prepare('SELECT COUNT(*) as count FROM sales').get().count;
                const customers = db.prepare('SELECT COUNT(*) as count FROM customers').get().count;
                results[folder] = { path: dbPath, products, sales, customers };
                db.close();
            } catch (e) {
                results[folder] = { path: dbPath, error: e.message };
            }
        }
    });

    fs.writeFileSync('d:\\NEW-ERP\\storeflow-erp\\search_results_v2.json', JSON.stringify(results, null, 2));
    console.log('SEARCH_COMPLETE');
    process.exit(0);
});
