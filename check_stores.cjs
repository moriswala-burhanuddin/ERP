const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Attempt to find the DB in standard userData paths
const possiblePaths = [
    path.join(process.env.APPDATA, 'invenza-erp', 'storeflow.db'),
    path.join(process.env.APPDATA, 'storeflow-erp', 'storeflow.db'),
    './backend/db.sqlite3' // Fallback to project root if running locally
];

let dbPath = null;
for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        dbPath = p;
        break;
    }
}

if (!dbPath) {
    console.error('Could not find storeflow.db');
    process.exit(1);
}

console.log('Using DB:', dbPath);
const db = new Database(dbPath);

try {
    const stores = db.prepare('SELECT id, name, branch FROM stores').all();
    console.log('--- STORES IN LOCAL DB ---');
    console.table(stores);
    console.log(`Total Stores: ${stores.length}`);
} catch (err) {
    console.error('Error querying stores:', err.message);
} finally {
    db.close();
}
