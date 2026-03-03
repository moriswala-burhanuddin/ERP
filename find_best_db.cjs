const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');
const fs = require('fs');

const roaming = path.join(os.homedir(), 'AppData', 'Roaming');
const possibleFolders = [
    'vite_react_shadcn_ts',
    'invenza-erp',
    'StoreFlow ERP',
    'Electron'
];

const results = {};

possibleFolders.forEach(folder => {
    const dbPath = path.join(roaming, folder, 'storeflow.db');
    if (fs.existsSync(dbPath)) {
        try {
            const db = new Database(dbPath, { readonly: true });
            const products = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
            const sales = db.prepare('SELECT COUNT(*) as count FROM sales').get().count;
            results[folder] = { path: dbPath, products, sales };
            db.close();
        } catch (e) {
            results[folder] = { path: dbPath, error: e.message };
        }
    } else {
        results[folder] = { path: dbPath, status: 'NOT_FOUND' };
    }
});

fs.writeFileSync('d:\\NEW-ERP\\storeflow-erp\\search_results.json', JSON.stringify(results, null, 2));
console.log('SEARCH_COMPLETE');
