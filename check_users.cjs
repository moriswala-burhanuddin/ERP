const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// Path used in main.cjs for invenza-erp
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'invenza-erp', 'storeflow.db');

console.log('Connecting to:', dbPath);

try {
    const db = new Database(dbPath, { readonly: true });
    
    // Check tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables in DB:', tables.map(t => t.name).join(', '));
    
    // Check users schema
    const schema = db.prepare("PRAGMA table_info(users)").all();
    console.log('Users Schema:', JSON.stringify(schema, null, 2));
    
    // Check users data
    const users = db.prepare("SELECT id, name, email, role, is_deleted, store_id FROM users").all();
    console.log('Users found:', users.length);
    console.log(JSON.stringify(users, null, 2));
    
    // Check settings (license key)
    const settings = db.prepare("SELECT * FROM settings").all();
    console.log('Settings:', JSON.stringify(settings, null, 2));

    db.close();
} catch (err) {
    console.error('Error:', err.message);
}
