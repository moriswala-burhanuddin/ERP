const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'electron', 'storeflow.db');
console.log('Opening database at:', dbPath);

try {
    const db = new Database(dbPath);

    const stores = db.prepare('SELECT * FROM stores').all();
    console.log('Stores count:', stores.length);
    console.log('Stores:', JSON.stringify(stores, null, 2));

    const products = db.prepare('SELECT * FROM products').all();
    console.log('Products count:', products.length);
    console.log('Products:', JSON.stringify(products, null, 2));

    const users = db.prepare('SELECT * FROM users').all();
    console.log('Users count:', users.length);

    db.close();
} catch (err) {
    console.error('Error reading database:', err.message);
}
