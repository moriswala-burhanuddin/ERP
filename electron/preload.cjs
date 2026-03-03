const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Products
    getProducts: (storeId) => ipcRenderer.invoke('db:getProducts', storeId),
    getProductByBarcode: (barcode, storeId) => ipcRenderer.invoke('db:getProductByBarcode', barcode, storeId),
    addProduct: (product) => ipcRenderer.invoke('db:addProduct', product),
    updateProduct: (id, updates) => ipcRenderer.invoke('db:updateProduct', id, updates),
    deleteProduct: (id) => ipcRenderer.invoke('db:deleteProduct', id),

    // Customers
    getCustomers: (storeId) => ipcRenderer.invoke('db:getCustomers', storeId),
    addCustomer: (customer) => ipcRenderer.invoke('db:addCustomer', customer),
    updateCustomer: (id, updates) => ipcRenderer.invoke('db:updateCustomer', id, updates),

    // Sales
    getSales: (storeId) => ipcRenderer.invoke('db:getSales', storeId),
    addSale: (sale) => ipcRenderer.invoke('db:addSale', sale),

    // Quotations
    getQuotations: (storeId) => ipcRenderer.invoke('db:getQuotations', storeId),
    addQuotation: (quotation) => ipcRenderer.invoke('db:addQuotation', quotation),
    updateQuotation: (id, updates) => ipcRenderer.invoke('db:updateQuotation', id, updates),

    // Purchases
    getPurchases: (storeId) => ipcRenderer.invoke('db:getPurchases', storeId),
    addPurchase: (purchase) => ipcRenderer.invoke('db:addPurchase', purchase),

    // Transactions
    getTransactions: (storeId) => ipcRenderer.invoke('db:getTransactions', storeId),
    addTransaction: (transaction) => ipcRenderer.invoke('db:addTransaction', transaction),

    // Accounts
    getAccounts: (storeId) => ipcRenderer.invoke('db:getAccounts', storeId),

    // Stores & Users
    getStores: () => ipcRenderer.invoke('db:getStores'),
    getUsers: () => ipcRenderer.invoke('db:getUsers'),
    addStore: (store) => ipcRenderer.invoke('db:addStore', store),
    updateStore: (id, updates) => ipcRenderer.invoke('db:updateStore', id, updates),
    deleteStore: (id) => ipcRenderer.invoke('db:deleteStore', id),
    addUser: (user) => ipcRenderer.invoke('db:addUser', user),
    updateUser: (id, updates) => ipcRenderer.invoke('db:updateUser', id, updates),
    deleteUser: (id) => ipcRenderer.invoke('db:deleteUser', id),
    verifyPassword: (id, password) => ipcRenderer.invoke('db:verifyPassword', id, password),
    verifySupervisor: (code) => ipcRenderer.invoke('db:verifySupervisor', code),

    // Barcode Operations
    handleBarcodeScan: (barcode, mode, storeId) => ipcRenderer.invoke('db:handleBarcodeScan', barcode, mode, storeId),

    // Excel Import
    processExcelUpload: (rows, storeId) => ipcRenderer.invoke('db:processExcelUpload', rows, storeId),

    // Sync
    getDirtyData: () => ipcRenderer.invoke('db:getDirtyData'),
    markAsSynced: (confirmedIds) => ipcRenderer.invoke('db:markAsSynced', confirmedIds),
    getLastPullTimestamp: () => ipcRenderer.invoke('db:getLastPullTimestamp'),
    applyCloudUpdates: (data) => ipcRenderer.invoke('db:applyCloudUpdates', data),
    onSyncTrigger: (callback) => ipcRenderer.on('sync:trigger', () => callback()),

    // Phase 11
    processStockTransfer: (transfer) => ipcRenderer.invoke('db:processStockTransfer', transfer),
    getStockTransfers: (storeId) => ipcRenderer.invoke('db:getStockTransfers', storeId),
    getCustomerLedger: (customerId) => ipcRenderer.invoke('db:getCustomerLedger', customerId),
    getPurchaseOrders: (storeId) => ipcRenderer.invoke('db:getPurchaseOrders', storeId),
    addPurchaseOrder: (po) => ipcRenderer.invoke('db:addPurchaseOrder', po),
    getExpenseCategories: () => ipcRenderer.invoke('db:getExpenseCategories'),
    addExpenseCategory: (cat) => ipcRenderer.invoke('db:addExpenseCategory', cat),
    getTaxSlabs: () => ipcRenderer.invoke('db:getTaxSlabs'),
    addTaxSlab: (slab) => ipcRenderer.invoke('db:addTaxSlab', slab),
    getCommissions: (storeId) => ipcRenderer.invoke('db:getCommissions', storeId),
    getLoyaltyPoints: (customerId) => ipcRenderer.invoke('db:getLoyaltyPoints', customerId),
    generateBarcode: (sku) => ipcRenderer.invoke('db:generateBarcode', sku),

    // Log for debugging
    log: (message) => ipcRenderer.send('db:log', message),
    manualBackup: () => ipcRenderer.invoke('system:manualBackup'),
    askAI: (query, contextData) => ipcRenderer.invoke('ai:ask', query, contextData),
    getInventoryForecast: (products, sales) => ipcRenderer.invoke('ai:getForecast', products, sales),
    suggestCategory: (productName) => ipcRenderer.invoke('ai:suggestCategory', productName),
    processInvoiceOCR: (imageBase64, products) => ipcRenderer.invoke('ai:processOCR', imageBase64, products),
    optimizeReorder: (products, sales) => ipcRenderer.invoke('ai:optimizeReorder', products, sales),
    analyzeAttendance: (attendanceData, leaveData) => ipcRenderer.invoke('ai:analyzeAttendance', attendanceData, leaveData),

    // HR & Attendance
    checkIn: (userId, storeId) => ipcRenderer.invoke('db:checkIn', userId, storeId),
    checkOut: (userId) => ipcRenderer.invoke('db:checkOut', userId),
    getAttendance: (userId, startDate, endDate) => ipcRenderer.invoke('db:getAttendance', userId, startDate, endDate),
    applyLeave: (leave) => ipcRenderer.invoke('db:applyLeave', leave),
    getLeaves: (storeId) => ipcRenderer.invoke('db:getLeaves', storeId),
    updateLeaveStatus: (id, status) => ipcRenderer.invoke('db:updateLeaveStatus', id, status),

    // Shifts
    getShifts: (storeId, startDate, endDate) => ipcRenderer.invoke('db:getShifts', storeId, startDate, endDate),
    assignShift: (shift) => ipcRenderer.invoke('db:assignShift', shift),
    optimizeSchedule: (salesHistory, staffList) => ipcRenderer.invoke('ai:optimizeSchedule', salesHistory, staffList),
    analyzePerformance: (storeId) => ipcRenderer.invoke('ai:analyzePerformance', storeId),

    // Hiring & Chat
    hrChat: (query, context) => ipcRenderer.invoke('ai:hrChat', query, context),
    parseResume: (resumeText) => ipcRenderer.invoke('ai:parseResume', resumeText),
    getCandidates: (storeId) => ipcRenderer.invoke('db:getCandidates', storeId),
    addCandidate: (candidate) => ipcRenderer.invoke('db:addCandidate', candidate),
    updateCandidateStatus: (id, status) => ipcRenderer.invoke('db:updateCandidateStatus', id, status),

    // Employees
    getEmployees: (storeId) => ipcRenderer.invoke('db:getEmployees', storeId),
    addEmployee: (employee) => ipcRenderer.invoke('db:addEmployee', employee),

    // Item Kits
    getItemKits: (storeId) => ipcRenderer.invoke('db:getItemKits', storeId),
    addItemKit: (kit) => ipcRenderer.invoke('db:addItemKit', kit),
    updateItemKit: (id, updates) => ipcRenderer.invoke('db:updateItemKit', id, updates),
    deleteItemKit: (id) => ipcRenderer.invoke('db:deleteItemKit', id),

    // Custom Fields
    getCustomFields: () => ipcRenderer.invoke('db:getCustomFields'),
    addCustomField: (field) => ipcRenderer.invoke('db:addCustomField', field),
    updateCustomField: (id, updates) => ipcRenderer.invoke('db:updateCustomField', id, updates),
    deleteCustomField: (id) => ipcRenderer.invoke('db:deleteCustomField', id),

    // Custom Field Values
    getProductCustomValues: (productId) => ipcRenderer.invoke('db:getProductCustomValues', productId),
    getAllProductCustomValues: () => ipcRenderer.invoke('db:getAllProductCustomValues'),
    updateProductCustomValues: (productId, values) => ipcRenderer.invoke('db:updateProductCustomValues', productId, values),

    // Bulk Actions
    bulkDeleteProducts: (ids) => ipcRenderer.invoke('db:bulkDeleteProducts', ids),
    bulkUpdateProducts: (ids, updates) => ipcRenderer.invoke('db:bulkUpdateProducts', ids, updates),

    // Suppliers
    getSuppliers: (storeId) => ipcRenderer.invoke('db:getSuppliers', storeId),
    addSupplier: (supplier) => ipcRenderer.invoke('db:addSupplier', supplier),
    updateSupplier: (id, updates) => ipcRenderer.invoke('db:updateSupplier', id, updates),
    deleteSupplier: (id) => ipcRenderer.invoke('db:deleteSupplier', id),
    getSupplierTransactions: (supplierId) => ipcRenderer.invoke('db:getSupplierTransactions', supplierId),
    addSupplierTransaction: (tx) => ipcRenderer.invoke('db:addSupplierTransaction', tx),
    getSupplierCustomFields: (storeId) => ipcRenderer.invoke('db:getSupplierCustomFields', storeId),
    addSupplierCustomField: (field) => ipcRenderer.invoke('db:addSupplierCustomField', field),
    getSupplierCustomValues: (supplierId) => ipcRenderer.invoke('db:getSupplierCustomValues', supplierId),
    saveSupplierCustomValue: (val) => ipcRenderer.invoke('db:saveSupplierCustomValue', val),
    getSupplierLedger: (supplierId) => ipcRenderer.invoke('db:getSupplierLedger', supplierId),
    getPaymentTerms: (storeId) => ipcRenderer.invoke('db:getPaymentTerms', storeId),
    addPaymentTerm: (term) => ipcRenderer.invoke('db:addPaymentTerm', term),
    getSupplierDocuments: (supplierId) => ipcRenderer.invoke('db:getSupplierDocuments', supplierId),
    addSupplierDocument: (doc) => ipcRenderer.invoke('db:addSupplierDocument', doc),

    // Receiving Module
    getReceivings: (storeId) => ipcRenderer.invoke('db:getReceivings', storeId),
    getReceivingById: (id) => ipcRenderer.invoke('db:getReceivingById', id),
    addReceiving: (receiving) => ipcRenderer.invoke('db:addReceiving', receiving),
    updateReceiving: (id, updates) => ipcRenderer.invoke('db:updateReceiving', id, updates),
    completeReceiving: (data) => ipcRenderer.invoke('db:completeReceiving', data),
    suspendReceiving: (id) => ipcRenderer.invoke('db:suspendReceiving', id),
    addReceivingPayment: (data) => ipcRenderer.invoke('db:addReceivingPayment', data),
    deleteReceiving: (id) => ipcRenderer.invoke('db:deleteReceiving', id),

    // Invoice Module
    getInvoices: (storeId) => ipcRenderer.invoke('db:getInvoices', storeId),
    getInvoiceById: (id) => ipcRenderer.invoke('db:getInvoiceById', id),
    createInvoice: (invoice) => ipcRenderer.invoke('db:createInvoice', invoice),
    updateInvoice: (id, updates) => ipcRenderer.invoke('db:updateInvoice', id, updates),
    deleteInvoice: (id) => ipcRenderer.invoke('db:deleteInvoice', id),


    // New Sales Module IPCs
    updateSale: (id, updates) => ipcRenderer.invoke('db:updateSale', id, updates),
    getGiftCards: (storeId) => ipcRenderer.invoke('db:getGiftCards', storeId),
    addGiftCard: (gc) => ipcRenderer.invoke('db:addGiftCard', gc),
    updateGiftCard: (id, updates) => ipcRenderer.invoke('db:updateGiftCard', id, updates),
    getWorkOrders: (storeId) => ipcRenderer.invoke('db:getWorkOrders', storeId),
    updateWorkOrder: (id, updates) => ipcRenderer.invoke('db:updateWorkOrder', id, updates),
    getDeliveries: (storeId) => ipcRenderer.invoke('db:getDeliveries', storeId),
    updateDelivery: (id, updates) => ipcRenderer.invoke('db:updateDelivery', id, updates),

    // Dashboard
    getDashboardMetrics: (storeId) => ipcRenderer.invoke('db:getDashboardMetrics', storeId),

    // System Features
    printReceipt: (html) => ipcRenderer.invoke('system:printReceipt', html),
    openSecondaryDisplay: () => ipcRenderer.invoke('system:openSecondaryDisplay',),
    updateSecondaryDisplay: (data) => ipcRenderer.send('customer-display:update', data),
    onCustomerDisplayData: (callback) => ipcRenderer.on('customer-display:data', (event, data) => callback(data)),

    // Store Configuration
    getStoreConfig: (storeId) => ipcRenderer.invoke('db:getStoreConfig', storeId),
    saveStoreConfig: (storeId, configData) => ipcRenderer.invoke('db:saveStoreConfig', storeId, configData),

    // Cheques
    getCheques: (storeId) => ipcRenderer.invoke('db:getCheques', storeId),
    addCheque: (cheque) => ipcRenderer.invoke('db:addCheque', cheque),
    updateCheque: (id, updates) => ipcRenderer.invoke('db:updateCheque', id, updates),
    deleteCheque: (id) => ipcRenderer.invoke('db:deleteCheque', id),

    // Reports
    getReport: (type, storeId, dateFrom, dateTo) => ipcRenderer.invoke('db:getReport', type, storeId, dateFrom, dateTo),

    // ─── Auto-Updater ─────────────────────────────────────────────────────────
    // Call these from React to listen for update notifications
    onUpdateAvailable: (callback) => ipcRenderer.on('updater:update-available', (_, info) => callback(info)),
    onDownloadProgress: (callback) => ipcRenderer.on('updater:download-progress', (_, info) => callback(info)),
    onUpdateDownloaded: (callback) => ipcRenderer.on('updater:update-downloaded', (_, info) => callback(info)),
    // Call this when user clicks "Restart & Update"
    installUpdate: () => ipcRenderer.send('updater:install-now'),
})
