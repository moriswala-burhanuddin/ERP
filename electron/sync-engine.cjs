const { db, deviceId } = require('./db.cjs');

const TABLE_NAMES = [
    'stores',
    'users',
    'products',
    'customers',
    'accounts',
    'sales',
    'quotations',
    'purchases',
    'transactions',
    'stock_logs',
    'stock_transfers',
    'expense_categories',
    'tax_slabs',
    'loyalty_points',
    'commissions',
    'purchase_orders',
    'suppliers',
    'payment_terms',
    'receivings',
    'receiving_items',
    'gift_cards',
    'sale_payments',
    'work_orders',
    'deliveries',
    'supplier_custom_fields',
    'supplier_custom_values',
    'supplier_transactions',
    'supplier_documents',
    'attendance',
    'leaves',
    'shifts',
    'candidates',
    'employees',
    'item_kits',
    'kit_items',
    'custom_fields',
    'product_custom_values'
];

const syncEngine = {
    /**
     * Scans all tables for records with sync_status = 0
     * Returns a payload object containing lists of dirty records for each table.
     */
    getDirtyData: () => {
        const dirtyData = {};
        let totalCount = 0;

        for (const table of TABLE_NAMES) {
            try {
                const rows = db.prepare(`SELECT * FROM ${table} WHERE sync_status = 0`).all();
                if (rows.length > 0) {
                    dirtyData[table] = rows;
                    totalCount += rows.length;
                }
            } catch (error) {
                console.error(`Error fetching dirty data for table ${table}:`, error);
            }
        }

        if (totalCount === 0) return null;

        return {
            deviceId,
            timestamp: new Date().toISOString(),
            payload: dirtyData,
            totalCount
        };
    },

    /**
     * Marks records as synced (sync_status = 1) based on their IDs and table names.
     * @param {Object} confirmedIds - Object keyed by table name, containing arrays of synced IDs.
     * e.g. { products: ['uuid-1', 'uuid-2'], sales: ['uuid-3'] }
     */
    markAsSynced: (confirmedIds) => {
        const transaction = db.transaction(() => {
            for (const [table, ids] of Object.entries(confirmedIds)) {
                if (!TABLE_NAMES.includes(table)) continue;
                if (!ids || ids.length === 0) continue;

                const updateStmt = db.prepare(`UPDATE ${table} SET sync_status = 1 WHERE id = ?`);

                for (const id of ids) {
                    updateStmt.run(id);
                }
            }
        });

        try {
            transaction();
            return { success: true };
        } catch (error) {
            console.error('Error marking records as synced:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Applies updates from the server to the local database.
     * @param {Object} updates - Object keyed by table name, containing arrays of records.
     */
    applyUpdates: (updates) => {
        try {
            // Disable FK checks so insertion order from cloud doesn't matter
            db.pragma('foreign_keys = OFF');

            const transaction = db.transaction(() => {
                for (const [table, rows] of Object.entries(updates)) {
                    if (!TABLE_NAMES.includes(table)) continue;
                    if (!rows || rows.length === 0) continue;

                    console.log(`[SyncEngine] Applying ${rows.length} updates for ${table}`);

                    // Get actual columns from local SQLite schema
                    const localCols = new Set(
                        db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name)
                    );

                    // Filter incoming data to only include columns that exist locally
                    const sampleRow = rows[0];
                    const columns = Object.keys(sampleRow).filter(k =>
                        k !== 'sync_status' && localCols.has(k)
                    );

                    if (columns.length === 0) {
                        console.log(`[SyncEngine] No matching columns for table ${table}, skipping.`);
                        continue;
                    }

                    // Build UPSERT: server is source of truth during pull
                    const updateSets = columns
                        .filter(col => col !== 'id')
                        .map(col => `${col} = excluded.${col}`)
                        .join(', ');

                    const hasIsDeleted = localCols.has('is_deleted');
                    const sql = `
                        INSERT INTO ${table} (${columns.join(', ')}, sync_status) 
                        VALUES (${columns.map(() => '?').join(', ')}, 1)
                        ON CONFLICT(id) DO UPDATE SET 
                            ${updateSets},
                            sync_status = 1
                        ${hasIsDeleted ? `WHERE ${table}.is_deleted = 0 OR excluded.is_deleted = 1` : ''}
                    `;
                    const stmt = db.prepare(sql);

                    for (const row of rows) {
                        try {
                            const values = columns.map(col => row[col] ?? null);
                            stmt.run(...values);
                        } catch (rowErr) {
                            console.error(`[SyncEngine] Skipping row in ${table}:`, rowErr.message);
                        }
                    }
                }
            });

            transaction();
            return { success: true };
        } catch (error) {
            console.error('Error applying cloud updates:', error);
            return { success: false, error: error.message };
        } finally {
            // Always re-enable FK checks
            db.pragma('foreign_keys = ON');
        }
    }
};

module.exports = { syncEngine };
