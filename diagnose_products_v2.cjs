const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

app.whenReady().then(() => {
    const dbPath = path.join(app.getPath('userData'), 'storeflow.db');
    console.log('DIAGNOSE_PATH:', dbPath);

    try {
        const db = new Database(dbPath, { readonly: true });

        const productStats = db.prepare(`
            SELECT 
                store_id, 
                is_deleted, 
                COUNT(*) as count 
            FROM products 
            GROUP BY store_id, is_deleted
        `).all();
        console.log('PRODUCT_STATS:', JSON.stringify(productStats));

        const sampleProducts = db.prepare(`
            SELECT id, name, sku, store_id, is_deleted, updated_at 
            FROM products 
            WHERE store_id = 'store-1' 
            LIMIT 5
        `).all();
        console.log('SAMPLE_PRODUCTS:', JSON.stringify(sampleProducts));

        const salesStats = db.prepare(`
            SELECT store_id, COUNT(*) as count 
            FROM sales 
            GROUP BY store_id
        `).all();
        console.log('SALES_STATS:', JSON.stringify(salesStats));

        const stores = db.prepare('SELECT id, name FROM stores').all();
        console.log('STORES:', JSON.stringify(stores));

        db.close();
    } catch (err) {
        console.error('DIAGNOSE_ERROR:', err.message);
    }
    process.exit(0);
});
