const Database = require('better-sqlite3');
const path = require('path');

// Manually point to the known migrated path
const dbPath = 'C:\\Users\\ADMIN\\AppData\\Roaming\\invenza-erp\\storeflow.db';

const db = new Database(dbPath, { readonly: true });

try {
    console.log('--- STORES ---');
    const stores = db.prepare('SELECT id, name, branch FROM stores').all();
    console.table(stores);

    console.log('--- USERS ---');
    const users = db.prepare('SELECT id, name, email, store_id FROM users').all();
    console.table(users);

    console.log('--- PRODUCTS (First 5) ---');
    const products = db.prepare('SELECT id, name, store_id FROM products LIMIT 5').all();
    console.table(products);

    console.log('--- SALES (First 5) ---');
    const sales = db.prepare('SELECT id, invoice_number, store_id FROM sales LIMIT 5').all();
    console.table(sales);

} catch (err) {
    console.error('Error:', err.message);
} finally {
    db.close();
}
