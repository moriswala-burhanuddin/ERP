const Database = require('better-sqlite3');
const db = new Database('C:\\Users\\ADMIN\\AppData\\Roaming\\invenza-erp\\storeflow.db');

const tables = ['sale_payments', 'work_orders', 'deliveries'];
for (const tbl of tables) {
    const fks = db.prepare(`PRAGMA foreign_key_list(${tbl})`).all();
    console.log(`Table: ${tbl}`);
    console.log(JSON.stringify(fks, null, 2));
}
db.close();
