const Database = require('better-sqlite3');
const db = new Database('invenza.db');
try {
    console.log('--- STORES ---');
    console.log(db.prepare('SELECT id, name FROM stores').all());
    console.log('--- EMPLOYEES ---');
    console.log(db.prepare('SELECT id, user_id, store_id FROM employees').all());
    console.log('--- USERS ---');
    console.log(db.prepare('SELECT id, name, email, store_id FROM users').all());
} catch (e) {
    console.error(e);
} finally {
    db.close();
}
