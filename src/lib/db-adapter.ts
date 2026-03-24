// Database adapter - uses Electron IPC when available, falls back to mock data
import { isElectron } from './electron-helper'
import {
    Product, Customer, Sale, User, Store, Transaction, Purchase,
    GiftCard, WorkOrder, Delivery, Supplier, SupplierTransaction,
    SupplierCustomField, SupplierCustomValue, ItemKit, Quotation,
    PaymentTerm, SupplierDocument, ReceivingItem, Account, Receiving,
    StockTransfer, PurchaseOrder, ExpenseCategory, TaxSlab, Commission,
    LoyaltyPoint, ProductCustomValue, CustomerCustomValue, CustomField, DashboardMetrics,
    HRAttendance, HRLeave, Employee, HRPayroll, Invoice, InvoiceItem,
    Cheque, Category
} from './store-data'
import { InventoryRow } from './inventory-utils'

// Helper for Partial updates
type Updates<T> = Partial<T> & { id?: string };

export const dbAdapter = {
    async getProducts(storeId: string): Promise<Product[] | null> {
        if (isElectron()) {
            return await window.electronAPI.getProducts(storeId)
        }
        return null
    },

    getDashboardMetrics: (storeId: string): Promise<DashboardMetrics | null> => isElectron() ? window.electronAPI.getDashboardMetrics(storeId) : Promise.resolve(null),

    async getProductByBarcode(barcode: string, storeId: string) {
        if (isElectron()) {
            return await window.electronAPI.getProductByBarcode(barcode, storeId)
        }
        return null
    },

    async addProduct(product: Product) {
        if (isElectron()) {
            return await window.electronAPI.addProduct(product)
        }
        return null
    },

    async updateProduct(id: string, updates: Updates<Product>) {
        if (isElectron()) {
            return await window.electronAPI.updateProduct(id, updates)
        }
        return null
    },

    async deleteProduct(id: string) {
        if (isElectron()) {
            return await window.electronAPI.deleteProduct(id)
        }
        return null
    },

    async getCustomers(storeId: string): Promise<Customer[] | null> {
        if (isElectron()) {
            return await window.electronAPI.getCustomers(storeId)
        }
        return null
    },

    async addCustomer(customer: Customer) {
        if (isElectron()) {
            return await window.electronAPI.addCustomer(customer)
        }
        return null
    },

    async updateCustomer(id: string, updates: Updates<Customer>) {
        if (isElectron()) {
            return await window.electronAPI.updateCustomer(id, updates)
        }
        return null
    },

    async deleteCustomer(id: string) {
        if (isElectron()) {
            return await window.electronAPI.deleteCustomer(id)
        }
        return null
    },

    async getSales(storeId: string): Promise<Sale[] | null> {
        if (isElectron()) {
            return await window.electronAPI.getSales(storeId)
        }
        return null
    },

    async addSale(sale: Sale) {
        if (isElectron()) {
            return await window.electronAPI.addSale(sale)
        }
        return null
    },
    
    async deleteSale(id: string) {
        if (isElectron()) {
            return await window.electronAPI.deleteSale(id)
        }
        return null
    },

    async getQuotations(storeId: string): Promise<Quotation[] | null> {
        if (isElectron()) {
            return await window.electronAPI.getQuotations(storeId)
        }
        return null
    },

    async addQuotation(quotation: Quotation) {
        if (isElectron()) {
            return await window.electronAPI.addQuotation(quotation)
        }
        return null
    },

    async updateQuotation(id: string, updates: Updates<Quotation>) {
        if (isElectron()) {
            return await window.electronAPI.updateQuotation(id, updates)
        }
        return null
    },

    async deleteQuotation(id: string) {
        if (isElectron()) {
            return await window.electronAPI.deleteQuotation(id)
        }
        return null
    },

    async getPurchases(storeId: string): Promise<Purchase[] | null> {
        if (isElectron()) {
            return await window.electronAPI.getPurchases(storeId)
        }
        return null
    },

    async addPurchase(purchase: Purchase) {
        if (isElectron()) {
            return await window.electronAPI.addPurchase(purchase)
        }
        return null
    },

    async deletePurchase(id: string) {
        if (isElectron()) {
            return await window.electronAPI.deletePurchase(id)
        }
        return null
    },

    async getTransactions(storeId: string): Promise<Transaction[] | null> {
        if (isElectron()) {
            return await window.electronAPI.getTransactions(storeId)
        }
        return null
    },

    async addTransaction(transaction: Transaction) {
        if (isElectron()) {
            return await window.electronAPI.addTransaction(transaction)
        }
        return null
    },

    async deleteTransaction(id: string) {
        if (isElectron()) {
            return await window.electronAPI.deleteTransaction(id)
        }
        return null
    },

    async getAccounts(storeId: string): Promise<Account[] | null> {
        if (isElectron()) {
            return await window.electronAPI.getAccounts(storeId)
        }
        return null
    },

    async addAccount(account: Account) {
        if (isElectron()) {
            return await window.electronAPI.addAccount(account)
        }
        return null
    },

    async updateAccount(id: string, updates: Updates<Account>) {
        if (isElectron()) {
            return await window.electronAPI.updateAccount(id, updates)
        }
        return null
    },

    async deleteAccount(id: string) {
        if (isElectron()) {
            return await window.electronAPI.deleteAccount(id)
        }
        return null
    },

    async getStores(): Promise<Store[] | null> {
        if (isElectron()) {
            return await window.electronAPI.getStores()
        }
        return null
    },

    async addStore(store: Store) {
        if (isElectron()) {
            return await window.electronAPI.addStore(store)
        }
        return null
    },

    async updateStore(id: string, updates: Updates<Store>) {
        if (isElectron()) {
            return await window.electronAPI.updateStore(id, updates)
        }
        return null
    },

    async deleteStore(id: string) {
        if (isElectron()) {
            return await window.electronAPI.deleteStore(id)
        }
        return null
    },

    async getUsers(): Promise<User[] | null> {
        if (isElectron()) {
            return await window.electronAPI.getUsers()
        }
        return null
    },

    async handleBarcodeScan(barcode: string, mode: 'IN' | 'OUT', storeId: string) {
        if (isElectron()) {
            return await window.electronAPI.handleBarcodeScan(barcode, mode, storeId)
        }
        return null
    },

    async addUser(user: User) {
        if (isElectron()) {
            return await window.electronAPI.addUser(user)
        }
        return null
    },

    async updateUser(id: string, updates: Updates<User>) {
        if (isElectron()) {
            return await window.electronAPI.updateUser(id, updates)
        }
        return null
    },

    async deleteUser(id: string) {
        if (isElectron()) {
            return await window.electronAPI.deleteUser(id)
        }
        return null
    },

    // Phase 11 & Advanced Features
    processStockTransfer: (transfer: StockTransfer) => isElectron() ? window.electronAPI.processStockTransfer(transfer) : Promise.resolve(null),
    getStockTransfers: (storeId: string): Promise<StockTransfer[] | null> => isElectron() ? window.electronAPI.getStockTransfers(storeId) : Promise.resolve(null),
    getCustomerLedger: (customerId: string): Promise<unknown[] | null> => isElectron() ? window.electronAPI.getCustomerLedger(customerId) : Promise.resolve(null),
    getSupplierLedger: (supplierId: string): Promise<SupplierTransaction[] | null> => isElectron() ? window.electronAPI.getSupplierLedger(supplierId) : Promise.resolve(null),
    getPurchaseOrders: (storeId: string): Promise<PurchaseOrder[] | null> => isElectron() ? window.electronAPI.getPurchaseOrders(storeId) : Promise.resolve(null),
    addPurchaseOrder: (po: PurchaseOrder) => isElectron() ? window.electronAPI.addPurchaseOrder(po) : Promise.resolve(null),
    updatePurchaseOrder: (id: string, updates: Partial<PurchaseOrder>) => isElectron() ? window.electronAPI.updatePurchaseOrder(id, updates) : Promise.resolve(null),
    getExpenseCategories: (): Promise<ExpenseCategory[] | null> => isElectron() ? window.electronAPI.getExpenseCategories() : Promise.resolve(null),
    addExpenseCategory: (cat: ExpenseCategory) => isElectron() ? window.electronAPI.addExpenseCategory(cat) : Promise.resolve(null),
    getTaxSlabs: (): Promise<TaxSlab[] | null> => isElectron() ? window.electronAPI.getTaxSlabs() : Promise.resolve(null),
    addTaxSlab: (slab: TaxSlab) => isElectron() ? window.electronAPI.addTaxSlab(slab) : Promise.resolve(null),
    getCommissions: (storeId: string): Promise<Commission[] | null> => isElectron() ? window.electronAPI.getCommissions(storeId) : Promise.resolve(null),
    getLoyaltyPoints: (customerId: string): Promise<LoyaltyPoint[] | null> => isElectron() ? window.electronAPI.getLoyaltyPoints(customerId) : Promise.resolve(null),
    generateBarcode: (sku: string): Promise<string | null> => isElectron() ? window.electronAPI.generateBarcode(sku) : Promise.resolve(null),

    log: (message: string) => isElectron() ? window.electronAPI.log(message) : Promise.resolve(null),

    async processExcelUpload(rows: InventoryRow[], storeId: string) {
        if (isElectron()) {
            return await window.electronAPI.processExcelUpload(rows, storeId)
        }
        return null
    },

    // Item Kits
    getItemKits: (storeId: string) => isElectron() ? window.electronAPI.getItemKits(storeId) : Promise.resolve(null),
    addItemKit: (kit: ItemKit) => isElectron() ? window.electronAPI.addItemKit(kit) : Promise.resolve(null),
    updateItemKit: (id: string, updates: Updates<ItemKit>) => isElectron() ? window.electronAPI.updateItemKit(id, updates) : Promise.resolve(null),
    deleteItemKit: (id: string) => isElectron() ? window.electronAPI.deleteItemKit(id) : Promise.resolve(null),

    // Custom Fields
    getCustomFields: () => isElectron() ? window.electronAPI.getCustomFields() : Promise.resolve(null),
    onCustomerDisplayData: (callback: (data: unknown) => void) => isElectron() ? window.electronAPI.onCustomerDisplayData(callback) : Promise.resolve(null),
    addCustomField: (field: CustomField) => isElectron() ? window.electronAPI.addCustomField(field) : Promise.resolve(null),
    updateCustomField: (id: string, updates: Updates<CustomField>) => isElectron() ? window.electronAPI.updateCustomField(id, updates) : Promise.resolve(null),
    deleteCustomField: (id: string) => isElectron() ? window.electronAPI.deleteCustomField(id) : Promise.resolve(null),

    // Custom Field Values
    getProductCustomValues: (productId: string) => isElectron() ? window.electronAPI.getProductCustomValues(productId) : Promise.resolve(null),
    getAllProductCustomValues: () => isElectron() ? window.electronAPI.getAllProductCustomValues() : Promise.resolve(null),
    updateProductCustomValues: (productId: string, values: ProductCustomValue[]) => isElectron() ? window.electronAPI.updateProductCustomValues(productId, values) : Promise.resolve(null),

    // Customer Custom Field Values
    getCustomerCustomValues: (customerId: string) => isElectron() ? window.electronAPI.getCustomerCustomValues?.(customerId) : Promise.resolve(null),
    getAllCustomerCustomValues: () => isElectron() ? window.electronAPI.getAllCustomerCustomValues?.() : Promise.resolve(null),
    updateCustomerCustomValues: (customerId: string, values: CustomerCustomValue[]) => isElectron() ? window.electronAPI.updateCustomerCustomValues?.(customerId, values) : Promise.resolve(null),

    // Bulk Actions
    bulkDeleteProducts: (ids: string[]) => isElectron() ? window.electronAPI.bulkDeleteProducts(ids) : Promise.resolve(null),
    bulkUpdateProducts: (ids: string[], updates: Updates<Product>) => isElectron() ? window.electronAPI.bulkUpdateProducts(ids, updates) : Promise.resolve(null),

    // Suppliers
    getSuppliers: (storeId: string) => isElectron() ? window.electronAPI.getSuppliers(storeId) : Promise.resolve(null),
    addSupplier: (supplier: Supplier) => isElectron() ? window.electronAPI.addSupplier(supplier) : Promise.resolve(null),
    updateSupplier: (id: string, updates: Updates<Supplier>) => isElectron() ? window.electronAPI.updateSupplier(id, updates) : Promise.resolve(null),
    deleteSupplier: (id: string) => isElectron() ? window.electronAPI.deleteSupplier(id) : Promise.resolve(null),
    getSupplierTransactions: (supplierId: string) => isElectron() ? window.electronAPI.getSupplierTransactions(supplierId) : Promise.resolve(null),
    addSupplierTransaction: (tx: SupplierTransaction) => isElectron() ? window.electronAPI.addSupplierTransaction(tx) : Promise.resolve(null),
    getSupplierCustomFields: (storeId: string) => isElectron() ? window.electronAPI.getSupplierCustomFields(storeId) : Promise.resolve(null),
    addSupplierCustomField: (field: SupplierCustomField) => isElectron() ? window.electronAPI.addSupplierCustomField(field) : Promise.resolve(null),
    getSupplierCustomValues: (supplierId: string) => isElectron() ? window.electronAPI.getSupplierCustomValues(supplierId) : Promise.resolve(null),
    saveSupplierCustomValue: (val: SupplierCustomValue) => isElectron() ? window.electronAPI.saveSupplierCustomValue(val) : Promise.resolve(null),
    getPaymentTerms: (storeId: string) => isElectron() ? window.electronAPI.getPaymentTerms(storeId) : Promise.resolve(null),
    addPaymentTerm: (term: PaymentTerm) => isElectron() ? window.electronAPI.addPaymentTerm(term) : Promise.resolve(null),
    getSupplierDocuments: (supplierId: string) => isElectron() ? window.electronAPI.getSupplierDocuments(supplierId) : Promise.resolve(null),
    addSupplierDocument: (doc: SupplierDocument) => isElectron() ? window.electronAPI.addSupplierDocument(doc) : Promise.resolve(null),

    // Receiving Module
    getReceivings: (storeId: string) => isElectron() ? window.electronAPI.getReceivings(storeId) : Promise.resolve(null),
    getReceivingById: (id: string) => isElectron() ? window.electronAPI.getReceivingById(id) : Promise.resolve(null),
    addReceiving: (receiving: Receiving) => isElectron() ? window.electronAPI.addReceiving(receiving) : Promise.resolve(null),
    updateReceiving: (id: string, updates: Updates<Receiving>) => isElectron() ? window.electronAPI.updateReceiving(id, updates) : Promise.resolve(null),
    completeReceiving: (data: { id: string, accountId?: string, amountPaid: number }) => isElectron() ? window.electronAPI.completeReceiving(data) : Promise.resolve(null),
    suspendReceiving: (id: string) => isElectron() ? window.electronAPI.suspendReceiving(id) : Promise.resolve(null),
    addReceivingPayment: (data: { id: string, amount: number, accountId: string }) => isElectron() ? window.electronAPI.addReceivingPayment(data) : Promise.resolve(null),
    deleteReceiving: (id: string) => isElectron() ? window.electronAPI.deleteReceiving(id) : Promise.resolve(null),

    // New Sales Module Actions
    updateSale: (id: string, updates: Updates<Sale>) => isElectron() ? window.electronAPI.updateSale(id, updates) : Promise.resolve(null),
    getGiftCards: (storeId: string) => isElectron() ? window.electronAPI.getGiftCards(storeId) : Promise.resolve(null),
    addGiftCard: (gc: GiftCard) => isElectron() ? window.electronAPI.addGiftCard(gc) : Promise.resolve(null),
    updateGiftCard: (id: string, updates: Updates<GiftCard>) => isElectron() ? window.electronAPI.updateGiftCard(id, updates) : Promise.resolve(null),
    getWorkOrders: (storeId: string) => isElectron() ? window.electronAPI.getWorkOrders(storeId) : Promise.resolve(null),
    updateWorkOrder: (id: string, updates: Updates<WorkOrder>) => isElectron() ? window.electronAPI.updateWorkOrder(id, updates) : Promise.resolve(null),
    getDeliveries: (storeId: string) => isElectron() ? window.electronAPI.getDeliveries(storeId) : Promise.resolve(null),
    updateDelivery: (id: string, updates: Updates<Delivery>) => isElectron() ? window.electronAPI.updateDelivery(id, updates) : Promise.resolve(null),

    // HR Methods
    checkIn: (employeeId: string, storeId: string): Promise<{ success: boolean; checkInTime: string; status: string } | null> =>
        isElectron() ? window.electronAPI.checkIn(employeeId, storeId) : Promise.resolve(null),
    checkOut: (employeeId: string): Promise<{ success: boolean; checkOutTime: string } | null> =>
        isElectron() ? window.electronAPI.checkOut(employeeId) : Promise.resolve(null),
    getAttendance: (employeeId?: string, startDate?: string, endDate?: string): Promise<HRAttendance[] | null> =>
        isElectron() ? window.electronAPI.getAttendance(employeeId, startDate, endDate) : Promise.resolve(null),
    applyLeave: (leave: Omit<HRLeave, 'id' | 'status'> & { employeeId: string; storeId: string }): Promise<{ success: boolean; id: string } | null> =>
        isElectron() ? window.electronAPI.applyLeave(leave) : Promise.resolve(null),
    getLeaves: (storeId: string): Promise<HRLeave[] | null> =>
        isElectron() ? window.electronAPI.getLeaves(storeId) : Promise.resolve(null),
    updateLeaveStatus: (id: string, status: string): Promise<boolean | null> =>
        isElectron() ? window.electronAPI.updateLeaveStatus(id, status) : Promise.resolve(null),
    getEmployees: (storeId: string): Promise<Employee[] | null> =>
        isElectron() ? window.electronAPI.getEmployees(storeId) : Promise.resolve(null),
    addEmployee: (employee: Omit<User, 'id'> & Omit<Employee, 'id' | 'userId'>): Promise<Employee | null> =>
        isElectron() ? window.electronAPI.addEmployee(employee) : Promise.resolve(null),
    updateEmployee: (id: string, updates: Partial<Employee> & { user?: Partial<User> }): Promise<Employee | null> =>
        isElectron() ? window.electronAPI.updateEmployee(id, updates) : Promise.resolve(null),
    deleteEmployee: (id: string): Promise<{ success: boolean } | null> =>
        isElectron() ? window.electronAPI.deleteEmployee(id) : Promise.resolve(null),
    getPayroll: (storeId: string, employeeId?: string): Promise<HRPayroll[] | null> =>
        isElectron() ? window.electronAPI.getPayroll(storeId, employeeId) : Promise.resolve(null),
    addPayroll: (payroll: HRPayroll) => isElectron() ? window.electronAPI.addPayroll(payroll) : Promise.resolve(null),

    // Store Configuration
    getStoreConfig: (storeId: string): Promise<Record<string, unknown> | null> =>
        isElectron() ? window.electronAPI.getStoreConfig(storeId) : Promise.resolve(null),
    saveStoreConfig: (storeId: string, configData: Record<string, unknown>): Promise<{ success: boolean } | null> =>
        isElectron() ? window.electronAPI.saveStoreConfig(storeId, configData) : Promise.resolve(null),

    // Invoice Module
    getInvoices: (storeId: string): Promise<Invoice[] | null> => isElectron() ? window.electronAPI.getInvoices(storeId) : Promise.resolve(null),
    getInvoiceById: (id: string): Promise<Invoice | null> => isElectron() ? window.electronAPI.getInvoiceById(id) : Promise.resolve(null),
    createInvoice: (invoice: Invoice) => isElectron() ? window.electronAPI.createInvoice(invoice) : Promise.resolve(null),
    updateInvoice: (id: string, updates: Partial<Invoice>) => isElectron() ? window.electronAPI.updateInvoice(id, updates) : Promise.resolve(null),
    deleteInvoice: (id: string) => isElectron() ? window.electronAPI.deleteInvoice(id) : Promise.resolve(null),

    // Cheques
    getCheques: (storeId: string) => isElectron() ? window.electronAPI.getCheques(storeId) : Promise.resolve(null),
    addCheque: (cheque: Cheque) => isElectron() ? window.electronAPI.addCheque(cheque) : Promise.resolve(null),
    updateCheque: (id: string, updates: Updates<Cheque>) => isElectron() ? window.electronAPI.updateCheque(id, updates) : Promise.resolve(null),
    deleteCheque: (id: string) => isElectron() ? window.electronAPI.deleteCheque(id) : Promise.resolve(null),
    clearLocalData: (storeId: string) => isElectron() ? window.electronAPI.clearLocalData(storeId) : Promise.resolve(false),

    // Reports
    getReport: (type: string, storeId: string, dateFrom?: string, dateTo?: string) =>
        isElectron() ? window.electronAPI.getReport(type, storeId, dateFrom, dateTo) : Promise.resolve([]),

    // Categories
    getCategories: (storeId: string): Promise<Category[] | null> => isElectron() ? window.electronAPI.getCategories(storeId) : Promise.resolve(null),
    addCategory: (category: Category) => isElectron() ? window.electronAPI.addCategory(category) : Promise.resolve(null),
    updateCategory: (id: string, updates: Updates<Category>) => isElectron() ? window.electronAPI.updateCategory(id, updates) : Promise.resolve(null),
    deleteCategory: (id: string) => isElectron() ? window.electronAPI.deleteCategory(id) : Promise.resolve(null),
}
