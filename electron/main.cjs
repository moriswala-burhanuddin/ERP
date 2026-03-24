const { app, BrowserWindow, ipcMain, Menu, shell, Notification, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { markAllDirty } = require('./migration-utils.cjs')
const { autoUpdater } = require('electron-updater')
const log = require('electron-log')
const bwipjs = require('bwip-js')

// Configure logging
autoUpdater.logger = log
autoUpdater.logger.transports.file.level = 'info'
log.info('[Main] App starting...')

// IPC for version
ipcMain.handle('system:getVersion', () => {
    const version = app.getVersion();
    log.info('[Main] Returning app version:', version);
    return version;
});

// Crypto for device ID
const crypto = require('crypto')

// License & Device ID IPCs
ipcMain.handle('system:getDeviceId', async () => {
    return dbDeviceId
})

ipcMain.handle('system:getLicenseKey', async () => {
    return dbHelpers.getSetting('license_key')
})

ipcMain.handle('system:saveLicenseKey', async (event, key) => {
    return dbHelpers.setSetting('license_key', key)
})


// Force app name to ensure correct userData path (AppData/Roaming/invenza-erp)
app.name = 'invenza-erp';
log.info('[MAIN] Forced App Name to:', app.name);
log.info('[MAIN] Current UserData:', app.getPath('userData'));
log.info('[MAIN] App Version:', app.getVersion());


const { db, dbHelpers, deviceId: dbDeviceId } = require('./db.cjs')
const { askAI, getInventoryForecast, suggestProductCategory, processInvoiceOCR, optimizeReorderPoints } = require('./ai-service.cjs')

// Cheques
ipcMain.handle('db:getCheques', async (event, storeId) => {
    return dbHelpers.getAllCheques(storeId)
})

ipcMain.handle('db:addCheque', async (event, cheque) => {
    const result = dbHelpers.addCheque(cheque)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:updateCheque', async (event, id, updates) => {
    const result = dbHelpers.updateCheque(id, updates)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:deleteCheque', async (event, id) => {
    const result = dbHelpers.deleteCheque(id)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

let mainWindow;
let secondaryWindow;

console.log('[MAIN] App Name:', app.getName());
console.log('[MAIN] UserData Path:', app.getPath('userData'));
try {
    const stores = db.prepare('SELECT id, name FROM stores').all();
    console.log('[MAIN] Available Stores in DB:', JSON.stringify(stores));
} catch (e) {
    console.error('[MAIN] DB Store Check Error:', e.message);
}

function createWindow() {
    // Persistence for sync automation
    const userDataPath = app.getPath('userData');
    const migrationLockPath = path.join(userDataPath, 'vps_migration_v1.lock');

    if (!fs.existsSync(migrationLockPath)) {
        console.log('[MAIN] performing one-time VPS migration (marking all data as dirty)...');
        try {
            const { db } = require('./db.cjs');
            markAllDirty(db);
            fs.writeFileSync(migrationLockPath, 'Migration to VPS initiated at ' + new Date().toISOString());
            console.log('[MAIN] Migration lock created.');
        } catch (err) {
            console.error('[MAIN] Migration failed:', err.message);
        }
    }

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, '../build/icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    // In production, load the index.html file
    // In development, reload the local server
    if (!app.isPackaged && process.env.NODE_ENV !== 'production') {
        mainWindow.loadURL("http://127.0.0.1:8080/")
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
        // mainWindow.webContents.openDevTools() // Disable auto-open for production
    }

    // Trigger initial sync after window is ready
    mainWindow.webContents.on('did-finish-load', () => {
        console.log('[MAIN] Triggering initial sync...');
        mainWindow.webContents.send('sync:trigger');
    });
}

// Set up periodic sync (every 5 minutes)
setInterval(() => {
    if (mainWindow) {
        console.log('[MAIN] Triggering periodic sync...');
        mainWindow.webContents.send('sync:trigger');
    }
}, 5 * 60 * 1000);

// IPC Handlers for Database Operations

// Products
ipcMain.handle('db:getProducts', async (event, storeId) => {
    console.log(`IPC: getProducts for store ${storeId}`)
    try {
        const products = dbHelpers.getAllProducts(storeId)
        console.log(`IPC: getProducts returning ${products.length} products`)
        return products
    } catch (err) {
        console.error(`IPC: getProducts ERROR:`, err.message)
        throw err
    }
})

ipcMain.handle('db:getProductByBarcode', async (event, barcode, storeId) => {
    console.log(`IPC: getProductByBarcode ${barcode} for store ${storeId}`)
    return dbHelpers.getProductByBarcode(barcode, storeId)
})

ipcMain.handle('db:addProduct', async (event, product) => {
    console.log(`IPC: addProduct ${product.name}`)
    const result = dbHelpers.addProduct(product)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:updateProduct', async (event, id, updates) => {
    console.log(`IPC: updateProduct ${id}`)
    // Use the logging wrapper to track manual stock changes
    const result = dbHelpers.updateProductWithLog(id, updates, 'system', 'Manual Edit via App')
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:deleteProduct', async (event, id) => {
    console.log(`IPC: deleteProduct ${id}`)
    const result = dbHelpers.deleteProduct(id)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:bulkDeleteProducts', async (event, ids) => {
    console.log(`IPC: bulkDeleteProducts ${ids.length} items`)
    const result = dbHelpers.bulkDeleteProducts(ids)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

// Reporting
ipcMain.handle('db:getReport', async (event, type, storeId, dateFrom, dateTo) => {
    console.log(`IPC: getReport ${type} for store ${storeId}`)
    return dbHelpers.getReportData(type, storeId, dateFrom, dateTo)
})

ipcMain.handle('db:bulkUpdateProducts', async (event, ids, updates) => {
    console.log(`IPC: bulkUpdateProducts ${ids.length} items`)
    const result = dbHelpers.bulkUpdateProducts(ids, updates)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

// Item Kits
ipcMain.handle('db:getItemKits', async (event, storeId) => {
    return dbHelpers.getAllItemKits(storeId)
})

ipcMain.handle('db:addItemKit', async (event, kit) => {
    const result = dbHelpers.addItemKit(kit)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:updateItemKit', async (event, id, updates) => {
    const result = dbHelpers.updateItemKit(id, updates)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:deleteItemKit', async (event, id) => {
    const result = dbHelpers.deleteItemKit(id)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

// Custom Fields
ipcMain.handle('db:getCustomFields', async () => {
    return dbHelpers.getAllCustomFields()
})

ipcMain.handle('db:addCustomField', async (event, field) => {
    const result = dbHelpers.addCustomField(field)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:updateCustomField', async (event, id, updates) => {
    const result = dbHelpers.updateCustomField(id, updates)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:deleteCustomField', async (event, id) => {
    const result = dbHelpers.deleteCustomField(id)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:getProductCustomValues', async (event, productId) => {
    return dbHelpers.getProductCustomValues(productId)
})

ipcMain.handle('db:getAllProductCustomValues', async () => {
    return dbHelpers.getAllProductCustomValues()
})

ipcMain.handle('db:updateProductCustomValues', async (event, productId, values) => {
    const result = dbHelpers.updateProductCustomValues(productId, values)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

// Customers
ipcMain.handle('db:getCustomers', async (event, storeId) => {
    return dbHelpers.getAllCustomers(storeId)
})

ipcMain.handle('db:addCustomer', async (event, customer) => {
    const result = dbHelpers.addCustomer(customer)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:updateCustomer', async (event, id, updates) => {
    const result = dbHelpers.updateCustomer(id, updates)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

// Sales
ipcMain.handle('db:getSales', async (event, storeId) => {
    return dbHelpers.getAllSales(storeId)
})

ipcMain.handle('db:getDashboardMetrics', async (event, storeId) => {
    return dbHelpers.getDashboardMetrics(storeId)
})

ipcMain.handle('db:addSale', async (event, sale) => {
    console.log(`IPC: addSale (Transaction) ${sale.id}`)
    try {
        const result = dbHelpers.processSale(sale)
        if (mainWindow) mainWindow.webContents.send('sync:trigger')
        return result
    } catch (err) {
        console.error(`IPC: addSale Transaction Error:`, err.message)
        throw err // Propagate error to renderer
    }
})

// Quotations
ipcMain.handle('db:deleteSale', async (event, id) => {
    const result = dbHelpers.deleteSale(id)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:getQuotations', async (event, storeId) => {
    return dbHelpers.getAllQuotations(storeId)
})

ipcMain.handle('db:addQuotation', async (event, quotation) => {
    return dbHelpers.addQuotation(quotation)
})

ipcMain.handle('db:updateQuotation', async (event, id, updates) => {
    const fields = Object.keys(updates).map(key => {
        const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
        return `${snakeKey} = @${key}`
    }).join(', ')

    const stmt = db.prepare(`UPDATE quotations SET ${fields}, updated_at = datetime('now') WHERE id = @id`)
    return stmt.run({ id, ...updates })
})

ipcMain.handle('db:deleteQuotation', async (event, id) => {
    const result = dbHelpers.deleteQuotation(id)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

// Purchases
ipcMain.handle('db:getPurchases', async (event, storeId) => {
    return dbHelpers.getAllPurchases(storeId)
})

ipcMain.handle('db:addPurchase', async (event, purchase) => {
    console.log(`IPC: addPurchase (Transaction) ${purchase.id}`)
    const result = dbHelpers.processPurchase(purchase)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

// Transactions
ipcMain.handle('db:deletePurchase', async (event, id) => {
    const result = dbHelpers.deletePurchase(id)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:getTransactions', async (event, storeId) => {
    return dbHelpers.getAllTransactions(storeId)
})

ipcMain.handle('db:addTransaction', async (event, transaction) => {
    const result = dbHelpers.addTransaction(transaction)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:deleteTransaction', async (event, id) => {
    const result = dbHelpers.deleteTransaction(id)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

// Accounts
ipcMain.handle('db:getAccounts', async (event, storeId) => {
    return dbHelpers.getAllAccounts(storeId)
})

ipcMain.handle('db:addAccount', async (event, account) => {
    const result = dbHelpers.addAccount(account)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:updateAccount', async (event, id, updates) => {
    const result = dbHelpers.updateAccount(id, updates)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:deleteAccount', async (event, id) => {
    const result = dbHelpers.deleteAccount(id)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:clearLocalData', async (event, storeId) => {
    const result = dbHelpers.clearLocalData(storeId)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

// Stores & Users
ipcMain.handle('db:getStores', async () => {
    return dbHelpers.getAllStores()
})

ipcMain.handle('db:getUsers', async () => {
    return dbHelpers.getAllUsers()
})

ipcMain.handle('db:deleteUser', async (event, id) => {
    return dbHelpers.deleteUser(id)
})

ipcMain.handle('db:addStore', async (event, store) => {
    const result = dbHelpers.addStore(store)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:updateStore', async (event, id, updates) => {
    const result = dbHelpers.updateStore(id, updates)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:deleteStore', async (event, id) => {
    const result = dbHelpers.deleteStore(id)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:addUser', async (event, user) => {
    const result = dbHelpers.addUser(user)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:updateUser', async (event, id, updates) => {
    const result = dbHelpers.updateUser(id, updates)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:toggleDriverStatus', async (event, userId, isDriver) => {
    const result = dbHelpers.toggleDriverStatus(userId, isDriver)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:verifyPassword', async (event, id, password) => {
    return dbHelpers.verifyPassword(id, password)
})

ipcMain.handle('db:verifySupervisor', async (event, code) => {
    return dbHelpers.verifySupervisor(code)
})

// Advanced Phase 11 IPCs
ipcMain.handle('db:processStockTransfer', async (event, transfer) => {
    const result = dbHelpers.processStockTransfer(transfer)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:getStockTransfers', async (event, storeId) => {
    return dbHelpers.getStockTransfers(storeId)
})

ipcMain.handle('db:getCustomerLedger', async (event, customerId) => {
    return dbHelpers.getCustomerLedger(customerId)
})

ipcMain.handle('db:getPurchaseOrders', async (event, storeId) => {
    return dbHelpers.getPurchaseOrders(storeId)
})

ipcMain.handle('db:addPurchaseOrder', async (event, po) => {
    const result = dbHelpers.addPurchaseOrder(po)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:getExpenseCategories', async () => {
    return dbHelpers.getExpenseCategories()
})

ipcMain.handle('db:addExpenseCategory', async (event, cat) => {
    const result = dbHelpers.addExpenseCategory(cat)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:getTaxSlabs', async () => {
    return dbHelpers.getTaxSlabs()
})

ipcMain.handle('db:addTaxSlab', async (event, slab) => {
    const result = dbHelpers.addTaxSlab(slab)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:getCommissions', async (event, storeId) => {
    return dbHelpers.getCommissions(storeId)
})

ipcMain.handle('db:getLoyaltyPoints', async (event, customerId) => {
    return dbHelpers.getLoyaltyPoints(customerId)
})

// Feature 10: Auto-Backup System
async function backupDatabase() {
    try {
        const dbPath = path.join(app.getPath('userData'), 'storeflow.db')
        const backupsDir = path.join(app.getPath('userData'), 'backups')
        if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir)

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const backupPath = path.join(backupsDir, `backup-${timestamp}.db`)

        await dbHelpers.backup(backupPath)
        console.log('[Backup] Auto-backup created:', backupPath)

        // Keep only last 5 backups
        const files = fs.readdirSync(backupsDir)
            .filter(f => f.startsWith('backup-'))
            .sort((a, b) => fs.statSync(path.join(backupsDir, b)).mtime - fs.statSync(path.join(backupsDir, a)).mtime)

        if (files.length > 5) {
            files.slice(5).forEach(f => fs.unlinkSync(path.join(backupsDir, f)))
        }
        return { success: true, path: backupPath }
    } catch (err) {
        console.error('[Backup] Failed:', err)
        return { success: false, error: err.message }
    }
}

ipcMain.handle('system:backup', async () => {
    await backupDatabase()
    return { success: true }
})

ipcMain.handle('system:manualBackup', async () => {
    try {
        const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
            title: 'Export Database Backup',
            defaultPath: path.join(app.getPath('desktop'), `storeflow-backup-${new Date().toISOString().split('T')[0]}.db`),
            filters: [
                { name: 'SQLite Database', extensions: ['db'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        })

        if (canceled || !filePath) return { success: false, error: 'Cancelled' }

        await dbHelpers.backup(filePath)

        dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Backup Successful',
            message: `Database successfully exported to:\n${filePath}`,
            buttons: ['OK']
        })

        return { success: true, path: filePath }
    } catch (err) {
        console.error('[Manual Backup] Failed:', err)
        dialog.showErrorBox('Backup Failed', `Failed to create backup: ${err.message}`)
        return { success: false, error: err.message }
    }
})

// Excel Upload Handler
ipcMain.handle('db:processExcelUpload', async (event, rows, storeId) => {
    let createdCount = 0
    let updatedCount = 0
    let failedCount = 0
    const errors = []

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        try {
            const existingProduct = dbHelpers.getProductByBarcode(row.barcode, storeId)

            if (existingProduct) {
                dbHelpers.updateProduct(existingProduct.id, {
                    name: row.name,
                    sellingPrice: row.price,
                    quantity: existingProduct.quantity + row.stock,
                    updatedAt: new Date().toISOString()
                })
                updatedCount++
            } else {
                dbHelpers.addProduct({
                    id: `prod-${Date.now()}-${i}`,
                    name: row.name,
                    barcode: row.barcode,
                    sellingPrice: row.price,
                    purchasePrice: row.price * 0.7,
                    quantity: row.stock,
                    sku: row.barcode,
                    category: row.category || 'Uncategorized',
                    storeId: storeId,
                    lastUsed: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    unit: 'Pcs'
                })
                createdCount++
            }
        } catch (e) {
            failedCount++
            errors.push({ row: i + 2, reason: e.message })
        }
    }

    return {
        total_rows: rows.length,
        created_products: createdCount,
        updated_products: updatedCount,
        failed_rows: failedCount,
        errors
    }
})

// Sync Engine IPC
ipcMain.handle('db:getDirtyData', () => {
    try {
        const { syncEngine } = require('./sync-engine.cjs');
        return syncEngine.getDirtyData();
    } catch (err) {
        console.error('db:getDirtyData error:', err);
        return null;
    }
});

ipcMain.handle('db:markAsSynced', (event, confirmedIds) => {
    try {
        const { syncEngine } = require('./sync-engine.cjs');
        return syncEngine.markAsSynced(confirmedIds);
    } catch (err) {
        console.error('db:markAsSynced error:', err);
        return { success: false, error: err.message };
    }
});

ipcMain.handle('db:getLastPullTimestamp', () => {
    try {
        const { dbHelpers } = require('./db.cjs');
        return dbHelpers.getSetting('last_pull_timestamp');
    } catch (err) {
        console.error('db:getLastPullTimestamp error:', err);
        return null;
    }
});

ipcMain.handle('db:applyCloudUpdates', (event, { updates, serverTime }) => {
    try {
        const { syncEngine } = require('./sync-engine.cjs');
        const { dbHelpers } = require('./db.cjs');
        const result = syncEngine.applyUpdates(updates);
        if (result.success) {
            dbHelpers.setSetting('last_pull_timestamp', serverTime);
        }
        return result;
    } catch (err) {
        console.error('db:applyCloudUpdates error:', err);
        return { success: false, error: err.message };
    }
});

// Debug Logger
ipcMain.on('db:log', (event, message) => {
    console.log(`[Renderer] ${message}`)
})

ipcMain.handle('ai:ask', async (event, query, contextData) => {
    console.log(`AI: Querying for "${query}"`)
    return askAI(query, contextData)
})

ipcMain.handle('ai:getForecast', async (event, products, sales) => {
    console.log('AI: Generating Inventory Forecast')
    return getInventoryForecast(products, sales)
})

ipcMain.handle('ai:suggestCategory', async (event, productName) => {
    console.log(`AI: Suggesting category for "${productName}"`)
    return suggestProductCategory(productName)
})

ipcMain.handle('ai:processOCR', async (event, imageBase64, products) => {
    console.log('AI: Processing Invoice OCR')
    return processInvoiceOCR(imageBase64, products)
})

ipcMain.handle('ai:optimizeReorder', async (event, products, sales) => {
    console.log('AI: Optimizing Reorder Points')
    return optimizeReorderPoints(products, sales)
})

const { analyzeAttendancePatterns } = require('./ai-service.cjs')

ipcMain.handle('ai:analyzeAttendance', async (event, attendanceData, leaveData) => {
    console.log('AI: Analyzing Attendance Patterns')
    return analyzeAttendancePatterns(attendanceData, leaveData)
})

// HR & Attendance IPCs
ipcMain.handle('db:checkIn', async (event, employeeId, storeId) => {
    const result = dbHelpers.checkIn(employeeId, storeId)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:checkOut', async (event, employeeId) => {
    const result = dbHelpers.checkOut(employeeId)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:getAttendance', async (event, employeeId, startDate, endDate) => {
    return dbHelpers.getAttendance(employeeId, startDate, endDate)
})

ipcMain.handle('db:applyLeave', async (event, leave) => {
    const result = dbHelpers.applyLeave(leave)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:getLeaves', async (event, storeId) => {
    return dbHelpers.getLeaves(storeId)
})

ipcMain.handle('db:updateLeaveStatus', async (event, id, status) => {
    const result = dbHelpers.updateLeaveStatus(id, status)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

// Shift Management
ipcMain.handle('db:getShifts', async (event, storeId, startDate, endDate) => {
    return dbHelpers.getShifts(storeId, startDate, endDate)
})

ipcMain.handle('db:assignShift', async (event, shift) => {
    const result = dbHelpers.assignShift(shift)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('ai:optimizeSchedule', async (event, salesHistory, staffList) => {
    console.log('AI: Optimizing Shift Schedule')
    const { optimizeShiftSchedule } = require('./ai-service.cjs')
    return optimizeShiftSchedule(salesHistory, staffList)
})

ipcMain.handle('ai:analyzePerformance', async (event, storeId) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = new Date().toISOString().split('T')[0];

    const performance = dbHelpers.getStaffPerformanceData(storeId, startStr, endStr);
    const shrinkage = dbHelpers.getInventoryShrinkage(storeId, startStr, endStr);
    const shifts = dbHelpers.getShifts(storeId, startStr, endStr);

    const { analyzePerformanceAndRisk } = require('./ai-service.cjs');
    return analyzePerformanceAndRisk(performance, shrinkage, shifts);
})

// Phase 4: HR Chat & Hiring
ipcMain.handle('ai:hrChat', async (event, query, context) => {
    const { chatWithHR } = require('./ai-service.cjs')
    return chatWithHR(query, context)
})

ipcMain.handle('ai:parseResume', async (event, resumeText) => {
    const { parseResume } = require('./ai-service.cjs')
    return parseResume(resumeText)
})

ipcMain.handle('db:getCandidates', async (event, storeId) => {
    return dbHelpers.getCandidates(storeId)
})

ipcMain.handle('db:addCandidate', async (event, candidate) => {
    const result = dbHelpers.addCandidate(candidate)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:updateCandidateStatus', async (event, id, status) => {
    const result = dbHelpers.updateCandidateStatus(id, status)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:generateBarcode', async (event, sku) => {
    try {
        const png = await bwipjs.toBuffer({
            bcid: 'code128',       // Barcode type
            text: sku,             // Text to encode
            scale: 3,              // 3x scaling factor
            height: 10,            // Bar height, in millimeters
            includetext: true,      // Show human-readable text
            textxalign: 'center',  // Always good to set this
        })
        return `data:image/png;base64,${png.toString('base64')}`
    } catch (err) {
        console.error('Barcode Generation Error:', err)
        throw err
    }
})

// Employees
ipcMain.handle('db:getEmployees', async (event, storeId) => {
    return dbHelpers.getEmployees(storeId)
})

ipcMain.handle('db:addEmployee', async (event, employee) => {
    try {
        const result = dbHelpers.addEmployee(employee)
        if (mainWindow) mainWindow.webContents.send('sync:trigger')
        return result
    } catch (err) {
        console.error('IPC: addEmployee error:', err.message)
        throw err
    }
})

ipcMain.handle('db:updateEmployee', async (event, id, updates) => {
    const result = dbHelpers.updateEmployee(id, updates)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:deleteEmployee', async (event, id) => {
    const result = dbHelpers.deleteEmployee(id)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

// Payroll
ipcMain.handle('db:getPayroll', async (event, storeId, employeeId) => {
    return dbHelpers.getPayroll(storeId, employeeId)
})

ipcMain.handle('db:addPayroll', async (event, payroll) => {
    const result = dbHelpers.addPayroll(payroll)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

// Categories
ipcMain.handle('db:getCategories', async (event, storeId) => {
    return dbHelpers.getCategories(storeId)
})

ipcMain.handle('db:addCategory', async (event, category) => {
    const result = dbHelpers.addCategory(category)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})


// Suppliers
ipcMain.handle('db:getSuppliers', async (event, storeId) => {
    return dbHelpers.getAllSuppliers(storeId)
})

ipcMain.handle('db:addSupplier', async (event, supplier) => {
    const result = dbHelpers.addSupplier(supplier)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:updateSupplier', async (event, id, updates) => {
    const result = dbHelpers.updateSupplier(id, updates)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:deleteSupplier', async (event, id) => {
    const result = dbHelpers.deleteSupplier(id)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:getSupplierTransactions', async (event, supplierId) => {
    return dbHelpers.getSupplierTransactions(supplierId)
})

ipcMain.handle('db:addSupplierTransaction', async (event, tx) => {
    const result = dbHelpers.addSupplierTransaction(tx)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:getSupplierCustomFields', async (event, storeId) => {
    return dbHelpers.getSupplierCustomFields(storeId)
})

ipcMain.handle('db:addSupplierCustomField', async (event, field) => {
    const result = dbHelpers.addSupplierCustomField(field)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:getSupplierCustomValues', async (event, supplierId) => {
    return dbHelpers.getSupplierCustomValues(supplierId)
})

ipcMain.handle('db:saveSupplierCustomValue', async (event, val) => {
    const result = dbHelpers.saveSupplierCustomValue(val)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:getSupplierLedger', async (event, supplierId) => {
    return dbHelpers.getSupplierLedger(supplierId)
})

ipcMain.handle('db:getPaymentTerms', async (event, storeId) => {
    return dbHelpers.getPaymentTerms(storeId)
})

ipcMain.handle('db:addPaymentTerm', async (event, term) => {
    const result = dbHelpers.addPaymentTerm(term)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:getSupplierDocuments', async (event, supplierId) => {
    return dbHelpers.getSupplierDocuments(supplierId)
})

ipcMain.handle('db:addSupplierDocument', async (event, doc) => {
    const result = dbHelpers.addSupplierDocument(doc)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

// Receiving Module
ipcMain.handle('db:getReceivings', async (event, storeId) => {
    return dbHelpers.getReceivings(storeId)
})

ipcMain.handle('db:getReceivingById', async (event, id) => {
    return dbHelpers.getReceivingById(id)
})

ipcMain.handle('db:addReceiving', async (event, receiving) => {
    const result = dbHelpers.addReceiving(receiving)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:updateReceiving', async (event, id, updates) => {
    const result = dbHelpers.updateReceiving(id, updates)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:completeReceiving', async (event, { id, accountId, amountPaid }) => {
    const result = dbHelpers.completeReceiving(id, accountId, amountPaid)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:suspendReceiving', async (event, id) => {
    const result = dbHelpers.suspendReceiving(id)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:addReceivingPayment', async (event, { id, amount, accountId }) => {
    const result = dbHelpers.addReceivingPayment(id, amount, accountId)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})


ipcMain.handle('db:deleteReceiving', async (event, id) => {
    const result = dbHelpers.deleteReceiving(id)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

// Invoice Module
ipcMain.handle('db:getInvoices', async (event, storeId) => {
    return dbHelpers.getInvoices(storeId)
})

ipcMain.handle('db:getInvoiceById', async (event, id) => {
    return dbHelpers.getInvoiceById(id)
})

ipcMain.handle('db:createInvoice', async (event, invoice) => {
    const result = dbHelpers.createInvoice(invoice)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:updateInvoice', async (event, id, updates) => {
    const result = dbHelpers.updateInvoice(id, updates)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:deleteInvoice', async (event, id) => {
    const result = dbHelpers.deleteInvoice(id)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})


// New Sales Module IPCs
ipcMain.handle('db:updateSale', async (event, id, updates) => {
    const result = dbHelpers.updateSale(id, updates)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:getGiftCards', async (event, storeId) => {
    return dbHelpers.getGiftCards(storeId)
})

ipcMain.handle('db:addGiftCard', async (event, gc) => {
    const result = dbHelpers.addGiftCard(gc)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:updateGiftCard', async (event, id, updates) => {
    const result = dbHelpers.updateGiftCard(id, updates)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:getWorkOrders', async (event, storeId) => {
    return dbHelpers.getWorkOrders(storeId)
})

ipcMain.handle('db:updateWorkOrder', async (event, id, updates) => {
    const result = dbHelpers.updateWorkOrder(id, updates)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:getDeliveries', async (event, storeId) => {
    return dbHelpers.getDeliveries(storeId)
})

ipcMain.handle('db:updateDelivery', async (event, id, updates) => {
    const result = dbHelpers.updateDelivery(id, updates)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

// Delivery Zones
ipcMain.handle('db:getDeliveryZones', async (event, storeId) => {
    return dbHelpers.getDeliveryZones(storeId)
})

ipcMain.handle('db:addDeliveryZone', async (event, zone) => {
    const result = dbHelpers.addDeliveryZone(zone)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:updateDeliveryZone', async (event, id, updates) => {
    const result = dbHelpers.updateDeliveryZone(id, updates)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('db:deleteDeliveryZone', async (event, id) => {
    const result = dbHelpers.deleteDeliveryZone(id)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

// Store Configuration
ipcMain.handle('db:getStoreConfig', async (event, storeId) => {
    return dbHelpers.getStoreConfig(storeId)
})

ipcMain.handle('db:saveStoreConfig', async (event, storeId, configData) => {
    const result = dbHelpers.saveStoreConfig(storeId, configData)
    if (mainWindow) mainWindow.webContents.send('sync:trigger')
    return result
})

ipcMain.handle('system:printReceipt', async (event, html) => {
    let printWindow = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: true } })
    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

    return new Promise((resolve) => {
        printWindow.webContents.on('did-finish-load', async () => {
            try {
                const printResult = printWindow.webContents.print({ silent: true, printBackground: true });
                if (printResult && typeof printResult.then === 'function') {
                    const success = await printResult;
                    printWindow.close();
                    resolve({ success });
                } else {
                    // Fallback for cases where print returns void or fails to return a promise
                    setTimeout(() => {
                        printWindow.close();
                        resolve({ success: true });
                    }, 1000);
                }
            } catch (err) {
                if (!printWindow.isDestroyed()) printWindow.close();
                resolve({ success: false, error: err.message });
            }
        })
    })
})

ipcMain.handle('system:generatePDF', async (event, html, filename) => {
    let printWindow = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: true } })
    printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

    const { dialog } = require('electron');
    const fs = require('fs');

    return new Promise((resolve) => {
        printWindow.webContents.on('did-finish-load', async () => {
            try {
                const { filePath } = await dialog.showSaveDialog({
                    title: 'Save Invoice PDF',
                    defaultPath: filename || 'invoice.pdf',
                    filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
                });

                if (!filePath) {
                    printWindow.close();
                    resolve({ success: false, error: 'Cancelled' });
                    return;
                }

                const data = await printWindow.webContents.printToPDF({
                    printBackground: true,
                    margins: { marginType: 'default' }
                });

                fs.writeFileSync(filePath, data);
                printWindow.close();
                resolve({ success: true, filePath });
            } catch (err) {
                if (!printWindow.isDestroyed()) printWindow.close();
                resolve({ success: false, error: err.message });
            }
        })
    })
})

ipcMain.handle('system:openSecondaryDisplay', async () => {
    if (secondaryWindow) {
        secondaryWindow.focus()
        return { success: true }
    }

    const { screen } = require('electron')
    const displays = screen.getAllDisplays()
    const externalDisplay = displays.find((display) => {
        return display.bounds.x !== 0 || display.bounds.y !== 0
    })

    secondaryWindow = new BrowserWindow({
        width: 800,
        height: 600,
        x: externalDisplay ? externalDisplay.bounds.x : 100,
        y: externalDisplay ? externalDisplay.bounds.y : 100,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    if (!app.isPackaged && process.env.NODE_ENV !== 'production') {
        secondaryWindow.loadURL("http://127.0.0.1:8080/#/customer-display")
    } else {
        secondaryWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'customer-display' })
    }

    secondaryWindow.on('closed', () => {
        secondaryWindow = null
    })

    return { success: true }
})

ipcMain.on('customer-display:update', (event, data) => {
    if (secondaryWindow) {
        secondaryWindow.webContents.send('customer-display:data', data)
    }
})

console.log('[Main] IPC Handlers registered successfully');

// ─── Auto-Updater Setup ──────────────────────────────────────────────────────
function setupAutoUpdater() {
    // Do not check for updates in dev mode
    if (!app.isPackaged) {
        console.log('[Updater] Dev mode — skipping update check.');
        return;
    }

    autoUpdater.autoDownload = true;       // Download in background silently
    autoUpdater.autoInstallOnAppQuit = true; // Install when the user quits normally

    // Check for update immediately when app opens
    autoUpdater.checkForUpdates().catch(err => {
        console.error('[Updater] Check failed:', err);
    });

    // Update is available — notify renderer so it can show a banner
    autoUpdater.on('update-available', (info) => {
        console.log('[Updater] Update available:', info.version);
        if (mainWindow) {
            mainWindow.webContents.send('updater:update-available', { version: info.version });
        }
    });

    // No update — just log
    autoUpdater.on('update-not-available', () => {
        console.log('[Updater] App is up to date.');
    });

    // Download progress (optional — we send to renderer so it can show %)
    autoUpdater.on('download-progress', (progress) => {
        if (mainWindow) {
            mainWindow.webContents.send('updater:download-progress', {
                percent: Math.floor(progress.percent)
            });
        }
    });

    // Update has been fully downloaded — prompt user to restart
    autoUpdater.on('update-downloaded', (info) => {
        console.log('[Updater] Update downloaded:', info.version);
        if (mainWindow) {
            mainWindow.webContents.send('updater:update-downloaded', { version: info.version });
        }
    });

    autoUpdater.on('error', (err) => {
        log.error('[Updater] Error:', err);
        if (mainWindow) {
            mainWindow.webContents.send('updater:error', { message: err.message });
        }
    });
}

// IPC: Manual check for updates (can be called from a hidden button or console)
ipcMain.handle('updater:check', async () => {
    log.info('[Updater] Manual check requested');
    try {
        const result = await autoUpdater.checkForUpdates();
        return { success: true, info: result ? result.updateInfo : null };
    } catch (err) {
        log.error('[Updater] Manual check failed:', err);
        return { success: false, error: err.message };
    }
});

// Barcode / SKU Scanner - Stock IN or OUT
ipcMain.handle('db:handleBarcodeScan', async (event, barcode, mode, storeId) => {
    const result = dbHelpers.handleBarcodeScan(barcode, mode, storeId)
    if (result?.status === 'SUCCESS' && mainWindow) {
        mainWindow.webContents.send('sync:trigger')
    }
    return result
})

// IPC: Renderer clicked "Restart & Install"
ipcMain.on('updater:install-now', () => {
    autoUpdater.quitAndInstall(false, true); // silent=false, forceRunAfter=true
});
// ─────────────────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
    log.info('[Main] App is ready, creating window');
    createWindow();

    // Wait slightly more to ensure React is mounted before checking
    setTimeout(() => {
        setupAutoUpdater();
    }, 5000);
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})
