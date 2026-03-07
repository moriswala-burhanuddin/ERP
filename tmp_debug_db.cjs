const Database = require('better-sqlite3');
const path = require('path');
const dbPath = 'C:\\Users\\ADMIN\\AppData\\Roaming\\invenza-erp\\storeflow.db';
const db = new Database(dbPath);

console.log('--- sale_payments TABLE INFO ---');
const info = db.prepare('PRAGMA table_info(sale_payments)').all();
console.log(JSON.stringify(info, null, 2));

console.log('\n--- sale_payments FOREIGN KEYS ---');
const fks = db.prepare('PRAGMA foreign_key_list(sale_payments)').all();
console.log(JSON.stringify(fks, null, 2));

console.log('\n--- accounts TABLE SAMPLE ---');
const accounts = db.prepare('SELECT id, name FROM accounts LIMIT 5').all();
console.log(JSON.stringify(accounts, null, 2));

console.log('\n--- stores TABLE SAMPLE ---');
const stores = db.prepare('SELECT id, name FROM stores LIMIT 5').all();
console.log(JSON.stringify(stores, null, 2));
