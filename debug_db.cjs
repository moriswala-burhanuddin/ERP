const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'vite_react_shadcn_ts', 'storeflow.db');
const db = new Database(dbPath);

console.log('--- USERS ---');
const users = db.prepare('SELECT id, name, email, role, store_id FROM users').all();
console.table(users);

console.log('--- ATTENDANCE ---');
const attendance = db.prepare('SELECT * FROM attendance').all();
console.table(attendance);

console.log('--- JOIN CHECK ---');
const joined = db.prepare('SELECT a.id, a.user_id, u.name as user_name, a.date FROM attendance a JOIN users u ON a.user_id = u.id').all();
console.table(joined);

db.close();
