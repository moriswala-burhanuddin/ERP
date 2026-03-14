import {
    Product, Customer, Sale, User, Store, Transaction, Purchase,
    GiftCard, WorkOrder, Delivery, Supplier, SupplierTransaction,
    SupplierCustomField, SupplierCustomValue, ItemKit, Quotation,
    PaymentTerm, SupplierDocument, ReceivingItem, Account, Receiving,
    StockTransfer, PurchaseOrder, ExpenseCategory, TaxSlab, Commission,
    LoyaltyPoint, ProductCustomValue, CustomField, ActivityLog,
    DeliveryZone, HRAttendance, HRLeave, Employee, Invoice, InvoiceItem,
    Cheque
} from '../lib/store-data'
import { InventoryRow, ExcelUploadSummary, BarcodeResponse } from '../lib/inventory-utils'

type Updates<T> = Partial<T> & { id?: string };

export interface HiringCandidate {
    id: string;
    name: string;
    role: string;
    status: 'applied' | 'interview' | 'offer' | 'hired' | 'rejected';
    score: number;
    email?: string;
    phone?: string;
    skills?: string;
    storeId?: string;
}

export interface ElectronAPI {
    // Products
    getProducts: (storeId: string) => Promise<Product[]>;
    getDashboardMetrics: (storeId: string) => Promise<DashboardMetrics>;
    getProductByBarcode: (barcode: string, storeId: string) => Promise<Product | null>;
    addProduct: (product: Product) => Promise<{ success: boolean; id?: string }>;
    updateProduct: (id: string, updates: Updates<Product>) => Promise<{ success: boolean }>;
    deleteProduct: (id: string) => Promise<{ success: boolean }>;

    // Customers
    getCustomers: (storeId: string) => Promise<Customer[]>;
    addCustomer: (customer: Customer) => Promise<{ success: boolean; id?: string }>;
    updateCustomer: (id: string, updates: Updates<Customer>) => Promise<{ success: boolean }>;
    deleteCustomer: (id: string) => Promise<{ success: boolean }>;
    bulkDeleteCustomers: (ids: string[]) => Promise<{ success: boolean; count: number }>;

    // Sales
    getSales: (storeId: string) => Promise<Sale[]>;
    addSale: (sale: Sale) => Promise<{ success: boolean; id?: string; invoiceNumber?: string }>;
    updateSale: (id: string, updates: Updates<Sale>) => Promise<{ success: boolean }>;

    // Quotations
    getQuotations: (storeId: string) => Promise<Quotation[]>;
    addQuotation: (quotation: Quotation) => Promise<{ success: boolean; id?: string; quotationNumber?: string }>;
    updateQuotation: (id: string, updates: Updates<Quotation>) => Promise<{ success: boolean }>;

    // Purchases
    getPurchases: (storeId: string) => Promise<Purchase[]>;
    addPurchase: (purchase: Purchase) => Promise<{ success: boolean; id?: string }>;

    // Transactions
    getTransactions: (storeId: string) => Promise<Transaction[]>;
    addTransaction: (transaction: Transaction) => Promise<{ success: boolean; id?: string }>;

    // Accounts
    getAccounts: (storeId: string) => Promise<Account[]>;

    // Stores
    getStores: () => Promise<Store[]>;
    addStore: (store: Store) => Promise<{ success: boolean; id?: string }>;
    updateStore: (id: string, updates: Updates<Store>) => Promise<{ success: boolean }>;
    deleteStore: (id: string) => Promise<{ success: boolean }>;

    // Users
    getUsers: () => Promise<User[]>;
    addUser: (user: User) => Promise<{ success: boolean; id?: string }>;
    updateUser: (id: string, updates: Updates<User>) => Promise<{ success: boolean }>;
    deleteUser: (id: string) => Promise<{ success: boolean }>;

    // Auth & Security
    verifyPassword: (id: string, password: string) => Promise<boolean>;
    verifySupervisor: (code: string) => Promise<boolean>;

    // System
    manualBackup: () => Promise<{ success: boolean; path?: string; error?: string }>;
    updateSecondaryDisplay: (data: unknown) => void;
    handleBarcodeScan: (barcode: string, mode: 'IN' | 'OUT', storeId: string) => Promise<BarcodeResponse>;
    log: (message: string) => void;

    // Sync
    getDirtyData: () => Promise<{ deviceId: string, timestamp: string, payload: Record<string, unknown[]>, totalCount: number } | null>;
    markAsSynced: (confirmedIds: Record<string, string[]>) => Promise<{ success: boolean; error?: string }>;
    getLastPullTimestamp: () => Promise<string | null>;
    applyCloudUpdates: (data: { updates: Record<string, unknown[]>, serverTime: string }) => Promise<{ success: boolean; error?: string }>;
    onSyncTrigger: (callback: () => void) => void;

    // Advanced Features
    processStockTransfer: (transfer: StockTransfer) => Promise<{ success: boolean }>;
    getStockTransfers: (storeId: string) => Promise<StockTransfer[]>;
    getCustomerLedger: (customerId: string) => Promise<unknown[]>;
    getPurchaseOrders: (storeId: string) => Promise<PurchaseOrder[]>;
    addPurchaseOrder: (po: PurchaseOrder) => Promise<{ success: boolean }>;
    updatePurchaseOrder: (id: string, updates: Updates<PurchaseOrder>) => Promise<{ success: boolean }>;
    getExpenseCategories: () => Promise<ExpenseCategory[]>;
    addExpenseCategory: (cat: ExpenseCategory) => Promise<{ success: boolean }>;
    getTaxSlabs: () => Promise<TaxSlab[]>;
    addTaxSlab: (slab: TaxSlab) => Promise<{ success: boolean }>;
    getCommissions: (storeId: string) => Promise<Commission[]>;
    getLoyaltyPoints: (storeId: string) => Promise<LoyaltyPoint[]>;
    generateBarcode: (sku: string) => Promise<string>;
    processExcelUpload: (rows: InventoryRow[], storeId: string) => Promise<ExcelUploadSummary>;

    // AI Features
    askAI: (query: string, contextData: Record<string, unknown>) => Promise<string>;
    getInventoryForecast: (products: Product[], sales: Sale[]) => Promise<string>;
    processInvoiceOCR: (imageBase64: string, products: Product[]) => Promise<{
        supplier: string;
        date: string;
        totalAmount: number;
        items: Array<{ name: string; quantity: number; price: number; productId?: string }>;
    }>;
    optimizeReorder: (products: Product[], sales: Sale[]) => Promise<Record<string, { minStock: number; reorderQuantity: number }>>;
    suggestCategory: (productName: string) => Promise<{ category?: string; brand?: string; unit?: string } | null>;

    // Item Kits
    getItemKits: (storeId: string) => Promise<ItemKit[]>;
    addItemKit: (kit: ItemKit) => Promise<{ success: boolean }>;
    updateItemKit: (id: string, updates: Updates<ItemKit>) => Promise<{ success: boolean }>;
    deleteItemKit: (id: string) => Promise<{ success: boolean }>;

    // Custom Fields
    getCustomFields: () => Promise<CustomField[]>;
    addCustomField: (field: CustomField) => Promise<{ success: boolean }>;
    updateCustomField: (id: string, updates: Updates<CustomField>) => Promise<{ success: boolean }>;
    deleteCustomField: (id: string) => Promise<{ success: boolean }>;
    getProductCustomValues: (productId: string) => Promise<ProductCustomValue[]>;
    getAllProductCustomValues: () => Promise<ProductCustomValue[]>;
    updateProductCustomValues: (productId: string, values: ProductCustomValue[]) => Promise<{ success: boolean }>;
    getCustomerCustomValues: (customerId: string) => Promise<CustomerCustomValue[]>;
    getAllCustomerCustomValues: () => Promise<CustomerCustomValue[]>;
    updateCustomerCustomValues: (customerId: string, values: CustomerCustomValue[]) => Promise<{ success: boolean }>;

    // Bulk Actions
    bulkDeleteProducts: (ids: string[]) => Promise<{ success: boolean }>;
    bulkUpdateProducts: (ids: string[], updates: Updates<Product>) => Promise<{ success: boolean }>;

    // Suppliers
    getSuppliers: (storeId: string) => Promise<Supplier[]>;
    addSupplier: (supplier: Supplier) => Promise<{ success: boolean }>;
    updateSupplier: (id: string, updates: Updates<Supplier>) => Promise<{ success: boolean }>;
    deleteSupplier: (id: string) => Promise<{ success: boolean }>;
    getSupplierTransactions: (supplierId: string) => Promise<SupplierTransaction[]>;
    addSupplierTransaction: (tx: SupplierTransaction) => Promise<{ success: boolean }>;
    getSupplierCustomFields: (storeId: string) => Promise<SupplierCustomField[]>;
    addSupplierCustomField: (field: SupplierCustomField) => Promise<{ success: boolean }>;
    getSupplierCustomValues: (supplierId: string) => Promise<SupplierCustomValue[]>;
    saveSupplierCustomValue: (val: SupplierCustomValue) => Promise<{ success: boolean }>;
    getSupplierLedger: (supplierId: string) => Promise<SupplierTransaction[]>;
    getPaymentTerms: (storeId: string) => Promise<PaymentTerm[]>;
    addPaymentTerm: (term: PaymentTerm) => Promise<{ success: boolean }>;
    getSupplierDocuments: (supplierId: string) => Promise<SupplierDocument[]>;
    addSupplierDocument: (doc: SupplierDocument) => Promise<{ success: boolean }>;

    // Receiving
    getReceivings: (storeId: string) => Promise<Receiving[]>;
    getReceivingById: (id: string) => Promise<Receiving | null>;
    addReceiving: (receiving: Receiving) => Promise<{ success: boolean }>;
    updateReceiving: (id: string, updates: Updates<Receiving>) => Promise<{ success: boolean }>;
    completeReceiving: (data: { id: string, accountId?: string, amountPaid: number }) => Promise<{ success: boolean }>;
    suspendReceiving: (id: string) => Promise<{ success: boolean }>;
    addReceivingPayment: (data: { id: string, amount: number, accountId: string }) => Promise<{ success: boolean }>;
    deleteReceiving: (id: string) => Promise<{ success: boolean }>;

    // Delivery & Logistics
    getDeliveries: (storeId: string) => Promise<Delivery[]>;
    updateDelivery: (id: string, updates: Updates<Delivery>) => Promise<{ success: boolean }>;
    getDeliveryZones: (storeId: string) => Promise<DeliveryZone[]>;
    addDeliveryZone: (zone: DeliveryZone) => Promise<{ success: boolean }>;
    updateDeliveryZone: (id: string, updates: Updates<DeliveryZone>) => Promise<{ success: boolean }>;
    deleteDeliveryZone: (id: string) => Promise<{ success: boolean }>;

    // Categories
    getCategories: (storeId: string) => Promise<Category[]>;
    addCategory: (category: Category) => Promise<{ success: boolean; id?: string }>;
    updateCategory: (id: string, updates: Updates<Category>) => Promise<{ success: boolean }>;
    deleteCategory: (id: string) => Promise<{ success: boolean }>;

    // More Sales Features
    getGiftCards: (storeId: string) => Promise<GiftCard[]>;
    addGiftCard: (gc: GiftCard) => Promise<{ success: boolean }>;
    updateGiftCard: (id: string, updates: Updates<GiftCard>) => Promise<{ success: boolean }>;
    getWorkOrders: (storeId: string) => Promise<WorkOrder[]>;
    updateWorkOrder: (id: string, updates: Updates<WorkOrder>) => Promise<{ success: boolean }>;

    // Printing & POS UI
    printReceipt: (html: string) => Promise<{ success: boolean; error?: string }>;
    generatePDF: (html: string, filename: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
    openSecondaryDisplay: () => Promise<{ success: boolean; error?: string }>;
    onCustomerDisplayData: (callback: (data: unknown) => void) => void;

    // HR Methods
    checkIn: (employeeId: string, storeId: string) => Promise<{ success: boolean; checkInTime: string; status: string }>;
    checkOut: (employeeId: string) => Promise<{ success: boolean; checkOutTime: string }>;
    getAttendance: (employeeId?: string, startDate?: string, endDate?: string) => Promise<HRAttendance[]>;
    applyLeave: (leave: Omit<HRLeave, 'id' | 'status'> & { employeeId: string; storeId: string }) => Promise<{ success: boolean; id: string }>;
    getLeaves: (storeId: string) => Promise<HRLeave[]>;
    updateLeaveStatus: (id: string, status: string) => Promise<boolean>;
    analyzeAttendance: (attendanceData: HRAttendance[], leaveData: HRLeave[]) => Promise<{ employees: RiskEmployee[]; summary: string }>;
    analyzePerformance: (storeId: string) => Promise<{ topPerformers: Array<{ name: string; reason: string; score: string | number }>; riskAlerts: Array<{ name: string; riskLevel: string; reason: string }> }>;
    getEmployees: (storeId: string) => Promise<Employee[]>;
    addEmployee: (employee: Omit<User, 'id'> & Omit<Employee, 'id' | 'userId'>) => Promise<Employee>;
    updateEmployee: (id: string, updates: Partial<Employee> & { user?: Partial<User> }) => Promise<Employee>;
    deleteEmployee: (id: string) => Promise<{ success: boolean }>;
    getPayroll: (storeId: string, employeeId?: string) => Promise<HRPayroll[]>;
    addPayroll: (payroll: HRPayroll) => Promise<void>;
    getCandidates: (storeId: string) => Promise<HiringCandidate[]>;
    addCandidate: (candidate: HiringCandidate & { resumeText?: string }) => Promise<{ success: boolean }>;
    updateCandidateStatus: (id: string, status: string) => Promise<{ success: boolean }>;
    parseResume: (resumeText: string) => Promise<{ name?: string; email?: string; phone?: string; skills?: string | string[]; score?: number }>;

    // Store Configuration
    getStoreConfig: (storeId: string) => Promise<Record<string, unknown> | null>;
    saveStoreConfig: (storeId: string, configData: Record<string, unknown>) => Promise<{ success: boolean } | null>;

    // Invoices
    getInvoices: (storeId: string) => Promise<Invoice[]>;
    getInvoiceById: (id: string) => Promise<Invoice | null>;
    createInvoice: (invoice: Invoice) => Promise<{ success: boolean }>;
    updateInvoice: (id: string, updates: Updates<Invoice>) => Promise<{ success: boolean }>;
    deleteInvoice: (id: string) => Promise<{ success: boolean }>;

    // Cheques
    getCheques: (storeId: string) => Promise<Cheque[]>;
    addCheque: (cheque: Cheque) => Promise<{ success: boolean; id?: string }>;
    updateCheque: (id: string, updates: Updates<Cheque>) => Promise<{ success: boolean }>;
    deleteCheque: (id: string) => Promise<boolean>;

    // Reports
    getReport: (type: string, storeId: string, dateFrom?: string, dateTo?: string) => Promise<Record<string, unknown>[]>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}
