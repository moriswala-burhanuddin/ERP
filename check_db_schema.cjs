const Database = require("better-sqlite3");
const path = require("path");
const os = require("os");

const userDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'invenza-erp');
const dbPath = path.join(userDataPath, 'storeflow.db');

console.log("Checking DB at:", dbPath);
try {
    const db = new Database(dbPath);
    const row = db.prepare("SELECT sql FROM sqlite_master WHERE name='sales'").get();
    if (row) {
        fs.writeFileSync('db_schema_debug.txt', row.sql);
        console.log("Schema written to db_schema_debug.txt");
    } else {
        console.log("Sales table not found");
    }

} catch (e) {
    console.error("Error:", e.message);
}
