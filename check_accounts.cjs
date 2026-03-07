const Database = require('better-sqlite3');
const path = require('path');
const dbPath = 'C:\\Users\\ADMIN\\AppData\\Roaming\\invenza-erp\\storeflow.db';
const db = new Database(dbPath);
try {
    const accounts = db.prepare('SELECT * FROM accounts').all();
    console.log(JSON.stringify(accounts, null, 2));
} catch (e) {
    console.error(e);
}
db.close();
