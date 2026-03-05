const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.join(__dirname, 'electron', 'storeflow.db');
console.log('Connecting to:', dbPath);
const db = new Database(dbPath);
try {
    console.log('--- STORES ---');
    console.log(JSON.stringify(db.prepare('SELECT id, name FROM stores').all(), null, 2));

    console.log('--- EMPLOYEES ---');
    console.log(JSON.stringify(db.prepare('SELECT id, user_id, store_id FROM employees').all(), null, 2));

    console.log('--- USERS ---');
    const users = db.prepare('SELECT id, name, email, role, store_id FROM users').all();
    console.log(JSON.stringify(users, null, 2));

    console.log('--- ATTENDANCE MIGRATION CHECK ---');
    // Check if attendance table has records and what IDs they use
    try {
        const att = db.prepare('SELECT * FROM attendance LIMIT 5').all();
        console.log('Attendance Sample:', JSON.stringify(att, null, 2));
    } catch (e) {
        console.log('Attendance table error:', e.message);
    }

} catch (e) {
    console.error(e);
} finally {
    db.close();
}
